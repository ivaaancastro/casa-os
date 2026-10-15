'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
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
  onBack: () => void;
  onCreated?: (id: string) => void;
}

type SaveState = 'saved' | 'saving' | 'idle';

function isDraft(note: Note | null): boolean {
  return !!note && (note.id.startsWith('draft-') || note.id.startsWith('temp-'));
}

export function NoteEditor({ note, currentUserId, currentUserRole, onDeleted, onBack, onCreated }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createdRef = useRef(false);
  const latestTitleRef = useRef(title);
  const previousNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    latestTitleRef.current = title;
  }, [title]);

  // Reset created flag when switching notes
  useEffect(() => {
    if (note?.id !== previousNoteIdRef.current) {
      createdRef.current = false;
      previousNoteIdRef.current = note?.id ?? null;
    }
  }, [note?.id]);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize.configure({ types: ['textStyle'] }),
      LineHeight.configure({ types: ['textStyle', 'paragraph', 'heading'] }),
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: 'Escribe aqui...' }),
    ],
    content: note?.content ?? '',
    onUpdate: ({ editor }) => {
      if (!note || isDraft(note) && !createdRef.current) return;
      scheduleSave(editor.getHTML());
    },
  });

  function scheduleSave(content: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState('saving');
    debounceRef.current = setTimeout(() => {
      saveNote(content);
    }, 500);
  }

  const saveNote = useCallback(async (content: string) => {
    if (!note || isDraft(note) && !createdRef.current) return;
    const realId = createdRef.current ? (note as { realId?: string }).realId ?? note.id : note.id;
    if (isDraft(note)) return; // guard
    setSaveState('saving');
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, completed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al guardar');
        setSaveState('idle');
        return;
      }
      setSaveState('saved');
      router.refresh();
    } catch {
      setError('Error de conexion');
      setSaveState('idle');
    }
  }, [note, title, completed, router]);

  // Load note data into editor
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setCompleted(note.completed);
      setSaveState('idle');
      setError('');
      if (editor && note.content) {
        const current = editor.getHTML();
        if (current !== note.content) {
          editor.commands.setContent(note.content);
        }
      } else if (editor && !note.content) {
        editor.commands.clearContent();
      }
    }
  }, [note, editor]);

  // Create real note on server when drafting, then switch to real id
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
        if (res.ok) {
          const newNote = await res.json();
          createdRef.current = true;
          (note as { realId?: string }).realId = newNote.id;
          // flush any typed content/title by saving now
          const html = editor?.getHTML() ?? '';
          await fetch(`/api/notes/${newNote.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: latestTitleRef.current, content: html, completed }),
          });
          onCreated?.(newNote.id);
        } else {
          setError('Error al crear la nota');
        }
      } catch {
        setError('Error de conexion');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, note?.id, editor]);

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
      router.refresh();
    } catch {
      setError('Error al actualizar');
    }
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-ash">
        <div className="text-center">
          <p className="text-sm">Selecciona una nota o crea una nueva</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-mist">
        <button onClick={onBack} className="lg:hidden p-1.5 rounded-none hover:bg-pearl text-ash" aria-label="Volver a la lista">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {saveState === 'saving' && <span className="text-xs text-ash">Guardando...</span>}
          {saveState === 'saved' && <span className="text-xs text-ash">Guardado</span>}

          {(note.type === 'SHOPPING' || note.type === 'TODO') && (
            <button onClick={toggleCompleted} className={`p-1.5 rounded-none transition-colors ${completed ? 'bg-ink text-canvas text-ink' : 'hover:bg-pearl text-ash'}`} aria-label={completed ? 'Marcar como pendiente' : 'Marcar como completada'}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {!isDraft(note) && (
            <button onClick={handleDelete} className={`p-1.5 rounded-none transition-colors ${showConfirmDelete ? 'bg-red-50 text-red-600' : 'hover:bg-pearl text-ash hover:text-red-600'}`} aria-label="Eliminar nota">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {showConfirmDelete && (
        <div className="p-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <span className="text-xs text-red-700">Eliminar esta nota?</span>
          <div className="flex gap-2">
            <button onClick={() => setShowConfirmDelete(false)} className="text-xs text-ash hover:text-gray-800">Cancelar</button>
            <button onClick={handleDelete} className="text-xs text-red-600 font-medium hover:text-red-800">Eliminar</button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-50 border-b border-red-100 text-xs text-red-700">{error}</div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 lg:px-10">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (debounceRef.current) clearTimeout(debounceRef.current);
              setSaveState('saving');
              debounceRef.current = setTimeout(() => {
                const html = editor?.getHTML() ?? '';
                saveNote(html);
              }, 500);
            }}
            placeholder="Titulo"
            className="mb-10 w-full border-none bg-transparent font-display text-5xl tracking-editorial text-ink placeholder-mist outline-none"
          />

          <Toolbar editor={editor} />

          <div className="pb-20 pt-4">
            <EditorContent
              editor={editor}
              className="min-h-[50vh] text-[18px] leading-[1.7] text-ink outline-none"
            />
          </div>
        </div>
      </div>

      {!isDraft(note) && (
        <div className="p-3 border-t border-mist text-xs text-ash flex items-center justify-between">
          <span>Creada por {note.author.name || 'Desconocido'}</span>
          <span>{new Date(note.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      )}

      <style jsx>{`
        .ProseMirror { outline: none; min-height: 300px; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #9ca3af; pointer-events: none; height: 0; }
        .ProseMirror h1 { font-size: 1.875rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; line-height: 1.2; }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin-top: 0.875rem; margin-bottom: 0.375rem; line-height: 1.3; }
        .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin-top: 0.75rem; margin-bottom: 0.25rem; line-height: 1.4; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror li { margin: 0.25rem 0; }
        .ProseMirror blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; margin: 0.75rem 0; color: #6b7280; font-style: italic; }
        .ProseMirror code { background-color: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875em; font-family: monospace; }
        .ProseMirror pre { background-color: #1f2937; color: #f9fafb; padding: 0.75rem 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 0.75rem 0; }
        .ProseMirror pre code { background-color: transparent; padding: 0; color: inherit; font-size: 0.875rem; }
        .ProseMirror hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
        .ProseMirror mark { border-radius: 0.125rem; padding: 0 0.125rem; }
      `}</style>
    </div>
  );
}
