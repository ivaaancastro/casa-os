'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Note } from './NotesLayout';

interface NoteEditorProps {
  note: Note | null;
  currentUserId: string;
  currentUserRole: string;
  onDeleted: () => void;
  onBack: () => void;
}

type SaveState = 'saved' | 'saving' | 'idle';

export function NoteEditor({ note, currentUserId, currentUserRole, onDeleted, onBack }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNewNote = note?.id.startsWith('temp-') ?? false;

  // Cargar nota seleccionada
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCompleted(note.completed);
      setSaveState('idle');
      setError('');
    }
  }, [note]);

  // Auto-guardado con debounce
  const saveNote = useCallback(async () => {
    if (!note || isNewNote) return;

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
  }, [note, title, content, completed, isNewNote, router]);

  const handleChange = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState('saving');
    debounceRef.current = setTimeout(() => {
      saveNote();
    }, 500);
  }, [saveNote]);

  // Crear nota nueva
  useEffect(() => {
    if (isNewNote && note) {
      const noteType = note.type;
      async function createNote() {
        try {
          const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: '', content: '', type: noteType }),
          });

          if (res.ok) {
            const newNote = await res.json();
            router.refresh();
            window.history.replaceState(null, '', `/notas?id=${newNote.id}`);
          }
        } catch {
          setError('Error al crear nota');
        }
      }
      createNote();
    }
  }, [isNewNote, note, router]);

  // Enfocar titulo en nota nueva
  useEffect(() => {
    if (isNewNote && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isNewNote]);

  // Limpiar debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function handleDelete() {
    if (!note) return;

    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }

    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleted();
        router.refresh();
      }
    } catch {
      setError('Error al eliminar');
    }
  }

  async function toggleCompleted() {
    if (!note || isNewNote) return;
    const newCompleted = !completed;
    setCompleted(newCompleted);
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      });
      if (res.ok) router.refresh();
    } catch {
      setError('Error al actualizar');
    }
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Selecciona una nota o crea una nueva</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header del editor */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label="Volver a la lista"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {saveState === 'saving' && (
            <span className="text-xs text-gray-400">Guardando...</span>
          )}
          {saveState === 'saved' && (
            <span className="text-xs text-gray-400">Guardado</span>
          )}

          {(note.type === 'SHOPPING' || note.type === 'TODO') && (
            <button
              onClick={toggleCompleted}
              className={`
                p-1.5 rounded-lg transition-colors
                ${completed ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-100 text-gray-400'}
              `}
              aria-label={completed ? 'Marcar como pendiente' : 'Marcar como completada'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          <button
            onClick={handleDelete}
            className={`
              p-1.5 rounded-lg transition-colors
              ${showConfirmDelete ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'}
            `}
            aria-label="Eliminar nota"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Confirmacion de eliminar */}
      {showConfirmDelete && (
        <div className="p-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <span className="text-xs text-red-700">Eliminar esta nota?</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-red-600 font-medium hover:text-red-800"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-2 bg-red-50 border-b border-red-100 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); handleChange(); }}
          placeholder="Titulo"
          className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent mb-2"
        />
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); handleChange(); }}
          placeholder="Escribe aqui..."
          className="w-full min-h-[300px] text-sm text-gray-700 placeholder-gray-300 border-none outline-none bg-transparent resize-none leading-relaxed"
        />
      </div>

      {/* Footer con info */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-400 flex items-center justify-between">
        <span>
          Creada por {note.author.name || 'Desconocido'}
        </span>
        <span>
          {new Date(note.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}
