'use client';

import { NoteEditor } from './NoteEditor';
import { NoteItem } from './NoteItem';
import { FolderChips } from './FolderChips';
import type { FolderFilter } from '@/lib/utils/note-filter';
import type { Note } from '@/types/note';

interface NotesMobileViewProps {
  notes: Note[];
  filteredNotes: Note[];
  activeFolder: FolderFilter;
  onFolderChange: (folder: FolderFilter) => void;
  selectedNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onBack: () => void;
  editorNote: Note | null;
  currentUserId: string;
  currentUserRole: string;
  onDeleted: () => void;
  onCreated: (note: Note) => void;
  onNoteUpdated: (id: string, patch: { title?: string; content?: string }) => void;
}

/** Vista móvil: lista por defecto, filtros en chips y editor apilado. */
export function NotesMobileView({
  notes,
  filteredNotes,
  activeFolder,
  onFolderChange,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onBack,
  editorNote,
  currentUserId,
  currentUserRole,
  onDeleted,
  onCreated,
  onNoteUpdated,
}: NotesMobileViewProps) {
  const showEditor = !!editorNote;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* La lista permanece montada (oculta) para conservar el scroll al volver */}
      <div className={showEditor ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
        <header className="shrink-0 border-b border-mist px-4 pb-2 pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-ui text-[21px] font-medium leading-none tracking-editorial text-ink">
              Notas
            </h1>
            <span className="text-[13px] text-ash">
              {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
            </span>
          </div>

          <div className="relative mt-3">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="note-search-mobile"
              name="note-search-mobile"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar notas"
              aria-label="Buscar notas"
              className="h-11 w-full border border-mist bg-canvas pl-9 pr-11 text-sm text-ink placeholder:text-ash focus:border-ink focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda"
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-ash hover:text-ink"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth={1.5} d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>

          <FolderChips
            activeFolder={activeFolder}
            onFolderChange={onFolderChange}
            notes={notes}
          />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto pb-28" data-testid="notes-mobile-list">
          {filteredNotes.length === 0 ? (
            <p className="p-6 text-center text-sm text-ash">
              {searchQuery ? 'Sin resultados' : 'No hay notas'}
            </p>
          ) : (
            filteredNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                onSelect={() => onSelectNote(note.id)}
              />
            ))
          )}
        </div>

        <button
          onClick={onCreateNote}
          aria-label="Nueva nota"
          title="Nueva nota"
          className="absolute right-4 z-30 flex h-14 w-14 items-center justify-center bg-ink text-canvas transition-colors hover:bg-black"
          style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeWidth={1.5} d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {showEditor && (
        <section className="flex min-h-0 flex-1 flex-col" aria-label="Editar nota">
          <div className="flex shrink-0 items-center gap-3 border-b border-mist px-3 py-2">
            <button
              onClick={onBack}
              aria-label="Volver a la lista de notas"
              className="inline-flex min-h-11 items-center gap-1 pr-2 text-sm text-ink hover:text-ash"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={1.5} d="M15 5l-7 7 7 7" />
              </svg>
              <span>Notas</span>
            </button>
            <span className="truncate text-sm text-ash">
              {editorNote.title || 'Sin título'}
            </span>
          </div>

          <NoteEditor
            note={editorNote}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onDeleted={onDeleted}
            onCreated={onCreated}
            onNoteUpdated={onNoteUpdated}
            mobile
          />
        </section>
      )}
    </div>
  );
}
