'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { NoteCard } from './NoteCard';
import { NoteForm } from './NoteForm';
import { Modal } from '@/components/ui/Modal';

interface Note {
  id: string;
  title: string;
  content: string;
  type: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string | null };
}

interface NoteListProps {
  notes: Note[];
  currentUserId: string;
  currentUserRole: string;
}

export function NoteList({ notes, currentUserId, currentUserRole }: NoteListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  async function clearCompleted() {
    if (!confirm('Eliminar todas las notas completadas?')) return;

    const completedIds = notes.filter((n) => n.completed).map((n) => n.id);

    try {
      await Promise.all(
        completedIds.map((id) =>
          fetch(`/api/notes/${id}`, { method: 'DELETE' })
        )
      );

      startTransition(() => {
        router.refresh();
      });
    } catch {
      alert('Error al limpiar completados');
    }
  }

  const hasCompleted = notes.some((n) => n.completed);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
        </p>
        <div className="flex gap-2">
          {hasCompleted && (
            <button
              onClick={clearCompleted}
              className="btn-secondary text-xs"
            >
              Limpiar completados
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary text-xs"
          >
            + Nueva nota
          </button>
        </div>
      </div>

      {sortedNotes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No hay notas</p>
          <p className="text-gray-400 text-sm">Crea la primera para empezar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva nota">
        <NoteForm onComplete={() => setShowCreate(false)} />
      </Modal>

      <Modal
        open={!!editingNote}
        onClose={() => setEditingNote(null)}
        title="Editar nota"
      >
        {editingNote && (
          <NoteForm
            noteId={editingNote.id}
            initialData={{
              title: editingNote.title,
              content: editingNote.content,
              type: editingNote.type as 'SHOPPING' | 'GENERAL' | 'TODO',
            }}
            onComplete={() => setEditingNote(null)}
          />
        )}
      </Modal>
    </div>
  );
}
