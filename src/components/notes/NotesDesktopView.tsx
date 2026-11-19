'use client';

import { useState } from 'react';
import { NotesSidebar } from './NotesSidebar';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';
import type { FolderFilter } from '@/lib/utils/note-filter';
import type { Note } from '@/types/note';

interface NotesDesktopViewProps {
  notes: Note[];
  filteredNotes: Note[];
  activeFolder: FolderFilter;
  onFolderChange: (folder: FolderFilter) => void;
  selectedNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  editorNote: Note | null;
  currentUserId: string;
  currentUserRole: string;
  onDeleted: () => void;
  onCreated: (note: Note) => void;
  onNoteUpdated: (id: string, patch: { title?: string; content?: string }) => void;
}

/** Layout original de escritorio: sidebar con carpetas/lista y editor a la derecha. */
export function NotesDesktopView({
  notes,
  filteredNotes,
  activeFolder,
  onFolderChange,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  editorNote,
  currentUserId,
  currentUserRole,
  onDeleted,
  onCreated,
  onNoteUpdated,
}: NotesDesktopViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleSelectNote(id: string) {
    onSelectNote(id);
    setSidebarOpen(false);
  }

  function handleFolderChange(folder: FolderFilter) {
    onFolderChange(folder);
    setSidebarOpen(false);
  }

  function handleCreateNote() {
    onCreateNote();
    setSidebarOpen(false);
  }

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-40 bg-ink/10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          absolute inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-mist bg-canvas
          transition-transform duration-300 ease-edit
          lg:static lg:z-auto lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between border-b border-mist px-4 py-3">
          <span className="text-xl font-medium leading-none text-ink md:font-display md:tracking-editorial">
            Notas
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-ash hover:text-ink lg:hidden"
            aria-label="Cerrar menú"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <NotesSidebar
            activeFolder={activeFolder}
            onFolderChange={handleFolderChange}
            notes={notes}
          />
          <NotesList
            notes={filteredNotes}
            selectedNoteId={selectedNoteId}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
          />
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-mist px-3 py-2 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-ink hover:text-ash"
            aria-label="Abrir menú"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="truncate text-sm text-ash">
            {editorNote ? editorNote.title || 'Sin título' : 'Selecciona una nota'}
          </span>
        </div>

        <NoteEditor
          note={editorNote}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onDeleted={onDeleted}
          onCreated={onCreated}
          onNoteUpdated={onNoteUpdated}
        />
      </main>
    </div>
  );
}
