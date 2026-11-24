'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontFamily, FontSize, LineHeight } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import type { Note } from '@/types/note';
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
  /** Usa el toolbar compacto y objetivos táctiles grandes. */
  mobile?: boolean;
}

type SaveState = 'saved' | 'saving' | 'idle';

const TITLE_MAX = 200;

function isDraft(note: Note | null): boolean {
  return !!note && (note.id.startsWith('draft-') || note.id.startsWith('temp-'));
}

export function NoteEditor({ note, currentUserId, onDeleted, onCreated, onNoteUpdated, mobile = false }: NoteEditorProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createdRef = useRef(false);
  const createdIdRef = useRef<string | null>(null);
  const loadedNoteIdRef = useRef<string | null>(null);

  const noteRef = useRef<Note | null>(note);
  const completedRef = useRef(completed);
  const onNoteUpdatedRef = useRef(onNoteUpdated);
  const editorRef = useRef<Editor | null>(null);
  const persistRef = useRef<((content: string) => Promise<void>) | null>(null);
  noteRef.current = note;
  completedRef.current = completed;
  onNoteUpdatedRef.current = onNoteUpdated;

  const persist = useCallback(async (content: string) => {
    const current = noteRef.current;
    if (!current) return;
    // Durante la creación el borrador ya tiene id real en el servidor: el
    // guardado con debounce debe apuntar a él aunque el state aún sea draft.
    const targetId = isDraft(current) ? createdIdRef.current : current.id;
    if (!targetId) return;
    const title = extractFirstBlockText(content).slice(0, TITLE_MAX);
    const clean = sanitizeNoteContent(content);
    setSaveState('saving');
    try {
      const res = await fetch(`/api/notes/${targetId}`, {
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
      onNoteUpdatedRef.current?.(targetId, { title, content: clean });
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

  editorRef.current = editor;
  persistRef.current = persist;

  // Carga el contenido solo al cambiar de nota (evita perder foco/cursor)
  useEffect(() => {
    if (!note) {
      loadedNoteIdRef.current = null;
      return;
    }
    if (loadedNoteIdRef.current === note.id) return;
    const previousId = loadedNoteIdRef.current;
    loadedNoteIdRef.current = note.id;
    if (note.id.startsWith('draft-') || note.id.startsWith('temp-')) {
      createdIdRef.current = null;
    }
    setCompleted(note.completed);
    setError('');
    setShowConfirmDelete(false);
    // Al convertir un borrador en nota real el editor ya tiene lo que el
    // usuario ha escrito: recargar desde el servidor le quitaría el cursor.
    const createdFromDraft =
      !!previousId && previousId.startsWith('draft-') && !note.id.startsWith('draft-');
    if (!createdFromDraft) setSaveState('idle');
    if (editor && !createdFromDraft) {
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
    // Se marca ANTES del POST: en desarrollo los effects se ejecutan dos veces
    // y dos POSTs simultáneos crearon notas duplicadas.
    createdRef.current = true;
    const noteType = note.type;
    (async () => {
      try {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '', content: '', type: noteType }),
        });
        if (!res.ok) {
          createdRef.current = false;
          setError('Error al crear la nota');
          return;
        }
        const created = await res.json();
        createdIdRef.current = created.id;
        const html = editor?.getHTML() ?? '<h1></h1>';
        const title = extractFirstBlockText(html).slice(0, TITLE_MAX);
        const clean = sanitizeNoteContent(html);
        const saved = await fetch(`/api/notes/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content: clean, completed: completedRef.current }),
        });
        if (!saved.ok) {
          setError('Error al guardar');
          return;
        }
        setSaveState('saved');
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
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        // Al volver a la lista se descartaba el guardado pendiente: se vacía
        // aquí para no perder lo escrito justo antes de salir del editor.
        const html = editorRef.current?.getHTML();
        if (html && persistRef.current) void persistRef.current(html);
      }
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
        createdIdRef.current = null;
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
      <div className="relative border-b border-mist/60 bg-canvas">
        <div className="flex items-start gap-2 px-3 py-2">
          <Toolbar editor={editor} compact={mobile} />
          <div className="ml-auto flex shrink-0 items-center gap-1 pt-0.5">
            <span className="px-1 text-xs text-ash">
              {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Guardado' : ''}
            </span>

            {(note.type === 'SHOPPING' || note.type === 'TODO') && (
              <button
                onClick={toggleCompleted}
                className={`inline-flex items-center justify-center transition-colors ${
                  mobile ? 'h-11 w-11' : 'h-8 w-8'
                } ${
                  completed ? 'bg-accent text-white' : 'text-ash hover:bg-pearl hover:text-ink'
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
                className={`inline-flex items-center justify-center transition-colors ${
                  mobile ? 'h-11 w-11' : 'h-8 w-8'
                } ${
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
        <div className={mobile ? 'w-full px-4 py-6 md:px-10 md:py-10 lg:px-12' : 'w-full px-6 py-8 sm:px-8 md:px-10 md:py-10 lg:px-12'}>
          <EditorContent editor={editor} className="text-[17px] leading-[1.75] text-ink" />
        </div>
      </div>

      {!isDraft(note) && (
        <div className="flex items-center justify-between border-t border-mist/60 px-3 py-2 text-xs text-ash">
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
    </div>
  );
}
