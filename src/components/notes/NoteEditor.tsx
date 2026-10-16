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
import type { Note } from './NotesLayout';
import { Toolbar } from './Toolbar';

interface NoteEditorProps {
  note: Note | null;
  currentUserId: string;
  currentUserRole: string;
  onDeleted: () => void;
  onCreated?: (note: Note) => void;
  onNoteUpdated?: (id: string, patch: { title?: string; content?: string }) => void;
}

type SaveState = 'saved' | 'saving' | 'idle';

function isDraft(note: Note | null): boolean {
  return !!note && (note.id.startsWith('draft-') || note.id.startsWith('temp-'));
}

export function NoteEditor({
  note,
  currentUserId,
  onDeleted,
  onCreated,
  onNoteUpdated,
}: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createdRef = useRef(false);
  const loadedNoteIdRef = useRef<string | null>(null);

  // Refs con el estado mas reciente para evitar closures obsoletos en el editor
  const noteRef = useRef<Note | null>(note);
  const titleValueRef = useRef(title);
  const completedRef = useRef(completed);
  const onNoteUpdatedRef = useRef(onNoteUpdated);
  noteRef.current = note;
  titleValueRef.current = title;
  completedRef.current = completed;
  onNoteUpdatedRef.current = onNoteUpdated;

  // Persiste titulo + contenido via PATCH (sin refrescar la pagina)
  const persist = useCallback(async (content: string) => {
    const current = noteRef.current;
    if (!current) return;
    if (isDraft(current)) return;
    setSaveState('saving');
    try {
      const res = await fetch(`/api/notes/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleValueRef.current,
          content,
          completed: completedRef.current,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al guardar');
        setSaveState('idle');
        return;
      }
      setError('');
      setSaveState('saved');
      onNoteUpdatedRef.current?.(current.id, {
        title: titleValueRef.current,
        content,
      });
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
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize.configure({ types: ['textStyle'] }),
      LineHeight.configure({ types: ['textStyle', 'paragraph', 'heading'] }),
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: 'Escribe aquí...' }),
    ],
    content: note?.content ?? '',
    onUpdate: ({ editor }) => {
      const current = noteRef.current;
      if (!current) return;
      if (isDraft(current) && !createdRef.current) return;
      scheduleSaveRef.current(editor.getHTML());
    },
  });

  // Carga el contenido solo cuando cambia de nota (evita perder foco/cursor)
  useEffect(() => {
    if (!note) {
      loadedNoteIdRef.current = null;
      return;
    }
    if (loadedNoteIdRef.current === note.id) return;
    loadedNoteIdRef.current = note.id;
    setTitle(note.title);
    setCompleted(note.completed);
    setSaveState('idle');
    setError('');
    setShowConfirmDelete(false);
    if (editor) {
      if (note.content) {
        editor.commands.setContent(note.content);
      } else {
        editor.commands.clearContent();
      }
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
        const html = editor?.getHTML() ?? '';
        await fetch(`/api/notes/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: titleValueRef.current,
            content: html,
            completed: completedRef.current,
          }),
        });
        onCreated?.({
          id: created.id,
          title: titleValueRef.current,
          content: html,
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
    if (isDraft(note) && titleRef.current) {
      titleRef.current.focus();
    }
  }, [note]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState('saving');
    debounceRef.current = setTimeout(() => {
      const html = editor?.getHTML() ?? '';
      persist(html);
    }, 600);
  }

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
      {/* Barra de acciones */}
      <div className="flex items-center gap-3 border-b border-mist px-3 py-2">
        <div className="flex items-center gap-2">
          {saveState === 'saving' && <span className="text-xs text-ash">Guardando…</span>}
          {saveState === 'saved' && <span className="text-xs text-ash">Guardado</span>}
        </div>

        <div className="ml-auto flex items-center gap-1">
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
        <div className="flex items-center justify-between border-b border-alarm/20 bg-alarm/5 px-3 py-2">
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

      {error && (
        <div className="border-b border-alarm/20 bg-alarm/5 px-3 py-2 text-xs text-alarm">{error}</div>
      )}

      {/* Toolbar siempre visible, fuera del area con scroll */}
      <Toolbar editor={editor} />

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[780px] px-6 py-8 md:px-10 md:py-12">
          <input
            ref={titleRef}
            id="note-title"
            name="note-title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título"
            className="no-focus-outline mb-5 w-full border-0 bg-transparent p-0 font-display text-3xl leading-tight tracking-editorial text-ink outline-none placeholder:text-mist md:text-4xl"
          />

          <EditorContent
            editor={editor}
            className="text-[17px] leading-[1.75] text-ink"
          />
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
          min-height: 320px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #b3b3b3;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror > * + * {
          margin-top: 0.75em;
        }
        .ProseMirror h1 {
          font-size: 1.75rem;
          font-weight: 600;
          line-height: 1.2;
        }
        .ProseMirror h2 {
          font-size: 1.4rem;
          font-weight: 600;
          line-height: 1.3;
        }
        .ProseMirror h3 {
          font-size: 1.15rem;
          font-weight: 600;
          line-height: 1.4;
        }
        .ProseMirror ul {
          list-style: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style: decimal;
          padding-left: 1.5rem;
        }
        .ProseMirror li {
          margin: 0.15rem 0;
        }
        .ProseMirror li p {
          margin: 0;
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
      `}</style>
    </div>
  );
}
