'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    type: string;
    completed: boolean;
    createdAt: Date;
    author: { id: string; name: string | null };
  };
  currentUserId: string;
  currentUserRole: string;
}

export function NoteCard({ note, currentUserId, currentUserRole }: NoteCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const canEdit = note.author.id === currentUserId || currentUserRole === 'ADMIN';

  async function toggleCompleted() {
    setError('');
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !note.completed }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al actualizar');
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError('Error de conexion');
    }
  }

  async function handleDelete() {
    if (!confirm('Eliminar esta nota?')) return;

    setError('');
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al eliminar');
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError('Error de conexion');
    }
  }

  const typeLabel = note.type === 'SHOPPING' ? 'Compra' : note.type === 'TODO' ? 'Pendiente' : 'General';
  const typeColor = note.type === 'SHOPPING'
    ? 'bg-green-50 text-green-700'
    : note.type === 'TODO'
    ? 'bg-yellow-50 text-yellow-700'
    : 'bg-blue-50 text-blue-700';

  return (
    <div className={`card transition-opacity ${note.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {note.type === 'SHOPPING' && (
          <button
            onClick={toggleCompleted}
            disabled={isPending}
            className="mt-1 flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-brand-500 transition-colors disabled:opacity-50"
            aria-label={note.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
          >
            {note.completed && (
              <svg className="w-3 h-3 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium text-gray-900 ${note.completed ? 'line-through' : ''}`}>
              {note.title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor}`}>
              {typeLabel}
            </span>
          </div>
          <p className={`text-sm text-gray-600 whitespace-pre-wrap ${note.completed ? 'line-through' : ''}`}>
            {note.content}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Creada por {note.author.name || 'Desconocido'} · {new Date(note.createdAt).toLocaleDateString('es-ES')}
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={toggleCompleted}
              disabled={isPending}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              aria-label="Editar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              aria-label="Eliminar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
