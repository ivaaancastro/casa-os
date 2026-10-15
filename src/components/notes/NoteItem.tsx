'use client';

import type { Note } from './NotesLayout';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
}

function extractPreview(html: string): string {
  if (typeof window === 'undefined') return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Ahora';
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function NoteItem({ note, isSelected, onSelect }: NoteItemProps) {
  const preview = extractPreview(note.content).slice(0, 80);
  const dateLabel = formatDate(note.createdAt.toISOString());

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
