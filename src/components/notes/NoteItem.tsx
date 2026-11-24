'use client';

import { extractFirstBlockText, removeFirstBlock } from '@/lib/utils/note-html';
import type { Note } from '@/types/note';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
}

function extractPreview(html: string, title: string): string {
  if (!html) return '';
  // Si el primer bloque ya es el titulo, no se repite en el preview.
  const body =
    title && extractFirstBlockText(html) === title.trim() ? removeFirstBlock(html) : html;
  return body
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  const preview = extractPreview(note.content, note.title).slice(0, 80);
  const dateLabel = formatDate(note.createdAt.toISOString());

  return (
    <button
      onClick={onSelect}
      aria-current={isSelected ? 'true' : undefined}
      className={`
        flex min-h-[76px] w-full flex-col justify-center border-b border-mist/60 px-4 py-3 text-left transition-colors
        ${isSelected ? 'border-l-2 border-l-ink bg-pearl' : 'hover:bg-pearl'}
      `}
    >
      <span className="truncate text-sm font-medium text-ink">
        {note.title || 'Sin titulo'}
      </span>
      <span className="mt-0.5 truncate text-xs text-ash">
        {preview || 'Sin contenido'}
      </span>
      <span className="mt-1 text-xs text-ash">{dateLabel}</span>
    </button>
  );
}
