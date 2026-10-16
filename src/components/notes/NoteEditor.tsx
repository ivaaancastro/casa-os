'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontFamily, FontSize, LineHeight } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import type { Note } from './NotesLayout';
import { Toolbar } from './Toolbar';
import { DashBulletList, Indent, AppleListKeymap } from './extensions';
import {
  extractFirstBlockText,
  withTitleLine,
} from '@/lib/utils/note-html';
import { sanitizeNoteContent } from '@/lib/utils/sanitize';

interface NoteEditorProps {
  note: Note | null;
  currentUserId: string;
  currentUserRole: string;
  onDeleted: () => void;
  onCreated?: (note: Note) => void;
  onNoteUpdated?: (id: string, patch: { title?: string; content?: string }) => void;
}

type SaveState = 'saved' | 'saving' | 'idle';

const TITLE_MAX = 200;

function isDraft(note: Note | null): boolean {
  return !!note && (note.id.startsWith('draft-') || note.id.startsWith('temp-'));
}

export function NoteEditor({ note, currentUserId, onDeleted, onCreated, onNoteUpdated }: NoteEditorProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createdRef = useRef(false);
  const loadedNoteIdRef = useRef<string | null>(null);

  const noteRef = useRef<Note | null>(note);
  const completedRef = useRef(completed);
  const onNoteUpdatedRef = useRef(onNoteUpdated);
  noteRef.current = note;
  completedRef.current = completed;
  onNoteUpdatedRef.current = onNoteUpdated;

  const persist = useCallback(async (content: string) => {
    const current = noteRef.current;
    if (!current || isDraft(current)) return;
    const title = extractFirstBlockText(content).slice(0, TITLE_MAX);
    const clean = sanitizeNoteContent(content);
    setSaveState('saving');
    try {
      const res = await fetch(`/api/notes/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: clean, completed: completedRef.current }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al guardar');
        setSaveState('idle');
        return;
      }
      setError('');
      setSaveState('saved');
      onNoteUpdatedRef.current?.(current.id, { title, content: clean });
    } catch {
      setError('Error de conexión');
      setSaveState('idle');
    }
  }, []);

  const scheduleSave = useCallback(
    (content: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveState('saving');
      debounceRef.current = setTimeout(() => persist(content), 600);
    },
    [persist]
  );
  const scheduleSaveRef = useRef(scheduleSave);
  scheduleSaveRef.current = scheduleSave;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        },
      }),
      DashBulletList,
      Indent,
      AppleListKeymap,
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize.configure({ types: ['textStyle'] }),
      LineHeight.configure({ types: ['textStyle', 'paragraph', 'heading'] }),
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({
        placeholder: ({ node }) => (node.type.name === 'heading' ? 'Título' : 'Escribe aquí...'),
        showOnlyWhenEditable: true,
      }),
    ],
    content: note?.content ?? '',
    // La barra debe reflejar el cursor (estilo activo, negrita, etc.) como en Apple Notas.
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      const current = noteRef.current;
      if (!current) return;
      if (isDraft(current) && !createdRef.current) return;
      scheduleSaveRef.current(editor.getHTML());
    },
  });

  // Carga el contenido solo al cambiar de nota (evita perder foco/cursor)
  useEffect(() => {
    if (!note) {
      loadedNoteIdRef.current = null;
      return;
    }
    if (loadedNoteIdRef.current === note.id) return;
    loadedNoteIdRef.current = note.id;
    setCompleted(note.completed);
    setSaveState('idle');
    setError('');
    setShowConfirmDelete(false);
    if (editor) {
      const content = withTitleLine(note.title, note.content);
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [note, editor]);

  // Foco en la linea de titulo al crear una nota nueva
  useEffect(() => {
    if (isDraft(note) && editor) {
      editor.commands.focus('start');
    }
  }, [note, editor]);

  // Convierte el borrador en una nota real en el servidor
  useEffect(() => {
    if (!note || !isDraft(note) || createdRef.current) return;
    const noteType = note.type;
    (async () => {
      try {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '', content: '', type: noteType }),
        });
        if (!res.ok) {
          setError('Error al crear la nota');
          return;
        }
        const created = await res.json();
        createdRef.current = true;
        const html = editor?.getHTML() ?? '<h1></h1>';
        const title = extractFirstBlockText(html).slice(0, TITLE_MAX);
        const clean = sanitizeNoteContent(html);
        await fetch(`/api/notes/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content: clean, completed: completedRef.current }),
        });
        onCreated?.({
          id: created.id,
          title,
          content: clean,
          type: created.type ?? noteType,
          completed: completedRef.current,
          createdAt: new Date(created.createdAt),
          updatedAt: new Date(created.updatedAt),
          author: created.author ?? { id: currentUserId, name: null },
        });
      } catch {
        setError('Error de conexión');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id, editor]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function handleDelete() {
    if (!note || isDraft(note)) return;
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      if (res.ok) {
        createdRef.current = false;
        onDeleted();
        router.refresh();
      }
    } catch {
      setError('Error al eliminar');
    }
  }

  async function toggleCompleted() {
    if (!note || isDraft(note)) return;
    const newCompleted = !completed;
    setCompleted(newCompleted);
    completedRef.current = newCompleted;
    try {
      await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      });
      onNoteUpdatedRef.current?.(note.id, {});
      router.refresh();
    } catch {
      setError('Error al actualizar');
    }
  }

  if (!note) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-ash">Selecciona una nota o crea una nueva</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Barra: formato + estado + acciones (un solo marco) */}
      <div className="relative border-b border-mist bg-canvas">
        <div className="flex items-start gap-2 px-3 py-2">
          <Toolbar editor={editor} />
          <div className="ml-auto flex shrink-0 items-center gap-1 pt-0.5">
            <span className="px-1 text-xs text-ash">
              {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Guardado' : ''}
            </span>

            {(note.type === 'SHOPPING' || note.type === 'TODO') && (
              <button
                onClick={toggleCompleted}
                className={`inline-flex h-8 w-8 items-center justify-center transition-colors ${
                  completed ? 'bg-ink text-canvas' : 'text-ash hover:bg-pearl hover:text-ink'
                }`}
                aria-label={completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                title={completed ? 'Marcar como pendiente' : 'Marcar como completada'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}

            {!isDraft(note) && (
              <button
                onClick={handleDelete}
                className={`inline-flex h-8 w-8 items-center justify-center transition-colors ${
                  showConfirmDelete ? 'bg-alarm text-canvas' : 'text-ash hover:bg-pearl hover:text-alarm'
                }`}
                aria-label="Eliminar nota"
                title="Eliminar nota"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {showConfirmDelete && (
          <div className="flex items-center justify-between border-t border-alarm/20 bg-alarm/5 px-3 py-2">
            <span className="text-xs text-alarm">¿Eliminar esta nota?</span>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmDelete(false)} className="text-xs text-ash hover:text-ink">
                Cancelar
              </button>
              <button onClick={handleDelete} className="text-xs font-medium text-alarm hover:underline">
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="border-b border-alarm/20 bg-alarm/5 px-3 py-2 text-xs text-alarm">{error}</div>
      )}

      {/* Contenido con scroll (el titulo es la primera linea) */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-6 py-8 md:px-10 md:py-12">
          <EditorContent editor={editor} className="text-[17px] leading-[1.75] text-ink" />
        </div>
      </div>

      {!isDraft(note) && (
        <div className="flex items-center justify-between border-t border-mist px-3 py-2 text-xs text-ash">
          <span>Creada por {note.author.name || 'Desconocido'}</span>
          <span>
            {new Date(note.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      )}

      <style jsx>{`
        .ProseMirror {
          outline: none;
          min-height: 60vh;
        }
        .ProseMirror .is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #b3b3b3;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror > * + * {
          margin-top: 0.4em;
        }
        .ProseMirror h1 {
          font-size: 1.9rem;
          font-weight: 600;
          line-height: 1.15;
          margin-bottom: 0.2em;
        }
        .ProseMirror h2 {
          font-size: 1.4rem;
          font-weight: 600;
          line-height: 1.25;
        }
        .ProseMirror h3 {
          font-size: 1.15rem;
          font-weight: 600;
          line-height: 1.35;
        }
        .ProseMirror ul {
          list-style: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style: decimal;
          padding-left: 1.5rem;
        }
        .ProseMirror ul[data-list-style='dash'] {
          list-style: none;
          padding-left: 1.5rem;
        }
        .ProseMirror ul[data-list-style='dash'] > li {
          position: relative;
        }
        .ProseMirror ul[data-list-style='dash'] > li::before {
          content: '–';
          position: absolute;
          left: -1.1rem;
        }
        .ProseMirror li p {
          margin: 0;
        }
        .ProseMirror [data-indent='1'] {
          margin-left: 1.5rem;
        }
        .ProseMirror [data-indent='2'] {
          margin-left: 3rem;
        }
        .ProseMirror [data-indent='3'] {
          margin-left: 4.5rem;
        }
        .ProseMirror blockquote {
          border-left: 2px solid #0a0a0a;
          padding-left: 1rem;
          color: #6b6b6b;
          font-style: italic;
        }
        .ProseMirror code {
          background-color: #f5f5f5;
          padding: 0.125rem 0.375rem;
          font-size: 0.875em;
          font-family: ui-monospace, monospace;
        }
        .ProseMirror pre {
          background-color: #0a0a0a;
          color: #ffffff;
          padding: 0.875rem 1rem;
          overflow-x: auto;
        }
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid #e4e4e4;
          margin: 1.5rem 0;
        }
        .ProseMirror mark {
          padding: 0 0.125rem;
        }
        .ProseMirror a {
          color: #2f5597;
          text-decoration: underline;
          cursor: pointer;
        }
        /* Lista de tareas (checklist) */
        .ProseMirror ul[data-type='taskList'] {
          list-style: none;
          padding-left: 0;
        }
        .ProseMirror ul[data-type='taskList'] li {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
        }
        .ProseMirror ul[data-type='taskList'] li > label {
          margin-top: 0.25rem;
        }
        .ProseMirror ul[data-type='taskList'] li > div {
          flex: 1 1 auto;
        }
        .ProseMirror ul[data-type='taskList'] input[type='checkbox'] {
          height: 1rem;
          width: 1rem;
          accent-color: #0a0a0a;
        }
        /* Tablas */
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          overflow: hidden;
        }
        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #e4e4e4;
          padding: 0.4rem 0.6rem;
          vertical-align: top;
          position: relative;
          min-width: 3rem;
        }
        .ProseMirror th {
          background-color: #f5f5f5;
          font-weight: 600;
          text-align: left;
        }
        .ProseMirror .selectedCell::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(10, 10, 10, 0.08);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
