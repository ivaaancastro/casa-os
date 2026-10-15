'use client';

import type { Note } from './NotesLayout';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
}

export function NoteItem({ note, isSelected, onSelect }: NoteItemProps) {
  const preview = note.content.split('\n').slice(0, 2).join(' ').slice(0, 80);
  const date = new Date(note.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let dateLabel: string;
  if (diffHours < 1) dateLabel = 'Ahora';
  else if (diffHours < 24) dateLabel = `Hace ${diffHours}h`;
  else if (diffDays === 1) dateLabel = 'Ayer';
  else if (diffDays < 7) dateLabel = `Hace ${diffDays} dias`;
  else dateLabel = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left p-3 border-b border-gray-100 transition-colors
        ${isSelected ? 'bg-brand-50' : 'hover:bg-gray-50'}
      `}
    >
      <div className="font-medium text-sm text-gray-900 truncate">
        {note.title || 'Sin titulo'}
      </div>
      <div className="text-xs text-gray-500 truncate mt-0.5">
        {preview || 'Sin contenido'}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {dateLabel}
      </div>
    </button>
  );
}
