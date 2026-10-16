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
  onFolderChange: (folder: 'ALL' | 'SHOPPING' | 'GENERAL' | 'TODO') => void;
  isMobile: boolean;
}

export function NotesList({
  notes,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onFolderChange,
  isMobile,
}: NotesListProps) {
  return (
    <>
      {/* Header con busqueda y crear */}
      <div className="p-3 border-b border-mist space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-ash absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="note-search"
              name="note-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar"
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-none border border-mist focus:border-ink focus:outline-none focus:outline-none"
            />
          </div>
          <button
            onClick={onCreateNote}
            className="p-1.5 rounded-none hover:bg-pearl text-ash hover:text-gray-700 transition-colors"
            aria-label="Nueva nota"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Filtros rapidos en movil */}
        {isMobile && (
          <div className="flex gap-1 overflow-x-auto">
            {(['ALL', 'SHOPPING', 'GENERAL', 'TODO'] as const).map((f) => (
              <button
                key={f}
                onClick={() => onFolderChange(f)}
                className={`
                  px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors
                  ${notes.length > 0 ? 'text-ash hover:bg-pearl' : 'text-ash'}
                `}
              >
                {f === 'ALL' ? 'Todas' : f === 'SHOPPING' ? 'Compra' : f === 'GENERAL' ? 'General' : 'Pendientes'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de notas */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-8 text-center text-ash text-sm">
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
