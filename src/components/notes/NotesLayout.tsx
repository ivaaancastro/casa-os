'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotesSidebar } from './NotesSidebar';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';

export interface Note {
  id: string;
  title: string;
  content: string;
  type: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string | null };
}

interface NotesLayoutProps {
  notes: Note[];
  currentUserId: string;
  currentUserRole: string;
}

type FolderFilter = 'ALL' | 'SHOPPING' | 'GENERAL' | 'TODO';

export function NotesLayout({ notes, currentUserId, currentUserRole }: NotesLayoutProps) {
  const router = useRouter();
  const [notesState, setNotesState] = useState<Note[]>(notes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftNote, setDraftNote] = useState<Note | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Adopta el listado del servidor cuando cambia (p.ej. tras refresh)
  useEffect(() => {
    setNotesState(notes);
  }, [notes]);

  const selectedRealNote = selectedNoteId
    ? notesState.find((n) => n.id === selectedNoteId) ?? null
    : null;
  const editorNote =
    selectedRealNote ?? (draftNote && selectedNoteId === draftNote.id ? draftNote : null);

  const filteredNotes = notesState
    .filter((note) => {
      if (activeFolder !== 'ALL' && note.type !== activeFolder) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function handleSelectNote(id: string) {
    setDraftNote(null);
    setSelectedNoteId(id);
    setSidebarOpen(false);
  }

  function handleFolderChange(folder: FolderFilter) {
    setActiveFolder(folder);
    setDraftNote(null);
    setSelectedNoteId(null);
  }

  function handleCreateNote() {
    const now = new Date();
    const draft: Note = {
      id: `draft-${Date.now()}`,
      title: '',
      content: '',
      type: activeFolder === 'ALL' ? 'GENERAL' : activeFolder,
      completed: false,
      createdAt: now,
      updatedAt: now,
      author: { id: currentUserId, name: null },
    };
    setDraftNote(draft);
    setSelectedNoteId(draft.id);
    setSidebarOpen(false);
  }

  const handleCreated = useCallback(
    (created: Note) => {
      setDraftNote(null);
      setNotesState((prev) => [created, ...prev.filter((n) => n.id !== created.id)]);
      setSelectedNoteId(created.id);
      router.refresh();
    },
    [router]
  );

  const handleNoteUpdated = useCallback(
    (id: string, patch: { title?: string; content?: string }) => {
      setNotesState((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date() } : n))
      );
    },
    []
  );

  function handleDeleted() {
    setDraftNote(null);
    setSelectedNoteId(null);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-40 bg-ink/10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar de notas */}
      <aside
        className={`
          absolute inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-mist bg-canvas
          transition-transform duration-300 ease-edit
          lg:static lg:z-auto lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between border-b border-mist px-4 py-3">
          <span className="font-display text-2xl leading-none tracking-editorial">Notas</span>
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
            notes={notesState}
          />
          <NotesList
            notes={filteredNotes}
            selectedNoteId={selectedNoteId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
          />
        </div>
      </aside>

      {/* Editor */}
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
          onDeleted={handleDeleted}
          onCreated={handleCreated}
          onNoteUpdated={handleNoteUpdated}
        />
      </main>
    </div>
  );
}
