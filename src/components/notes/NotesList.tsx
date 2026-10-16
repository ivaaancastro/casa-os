'use client';

import { NoteItem } from './NoteItem';
import type { Note } from './NotesLayout';

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
}

export function NotesList({
  notes,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
}: NotesListProps) {
  return (
    <>
      {/* Busqueda + crear */}
      <div className="flex items-center gap-2 border-b border-mist px-3 py-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ash"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="note-search"
            name="note-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar"
            className="w-full border border-mist py-1.5 pl-8 pr-3 text-sm focus:border-ink focus:outline-none"
          />
        </div>
        <button
          onClick={onCreateNote}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-ink text-ink transition-colors hover:bg-ink hover:text-canvas"
          aria-label="Nueva nota"
          title="Nueva nota"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Lista de notas */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-6 text-center text-sm text-ash">
            {searchQuery ? 'Sin resultados' : 'No hay notas'}
          </div>
        ) : (
          notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={note.id === selectedNoteId}
              onSelect={() => onSelectNote(note.id)}
            />
          ))
        )}
      </div>
    </>
  );
}
