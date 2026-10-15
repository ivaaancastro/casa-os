'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NOTE_TYPES, type NoteType } from '@/lib/schemas/note';

interface NoteFormProps {
  initialData?: {
    title: string;
    content: string;
    type: NoteType;
  };
  noteId?: string;
  onComplete?: () => void;
}

export function NoteForm({ initialData, noteId, onComplete }: NoteFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [type, setType] = useState<NoteType>(initialData?.type ?? 'GENERAL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = noteId ? `/api/notes/${noteId}` : '/api/notes';
      const method = noteId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al guardar');
        setLoading(false);
        return;
      }

      router.refresh();
      onComplete?.();
    } catch {
      setError('Error de conexion');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="note-title" className="label">
          Titulo
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="Titulo de la nota"
          required
          minLength={3}
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="note-content" className="label">
          Contenido
        </label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input min-h-[100px] resize-y"
          placeholder="Escribe aqui..."
          required
          maxLength={2000}
        />
      </div>

      <div>
        <label className="label">Tipo</label>
        <div className="flex gap-2">
          {NOTE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${type === t
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              {t === 'SHOPPING' ? 'Compra' : t === 'GENERAL' ? 'General' : 'Pendiente'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onComplete}
          className="btn-secondary flex-1"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? 'Guardando...' : noteId ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
