'use client';

import { useState, useCallback } from 'react';
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

function isDraftId(id: string): boolean {
  return id.startsWith('draft-') || id.startsWith('temp-');
}

export function NotesLayout({ notes, currentUserId, currentUserRole }: NotesLayoutProps) {
  const router = useRouter();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');
  const [draftNote, setDraftNote] = useState<Note | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedRealNote = selectedNoteId ? notes.find((n) => n.id === selectedNoteId) ?? null : null;
  const editorNote = selectedRealNote ?? (draftNote && selectedNoteId === draftNote.id ? draftNote : null);

  const filteredNotes = notes
    .filter((note) => {
      if (activeFolder !== 'ALL' && note.type !== activeFolder) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function handleSelectNote(id: string) {
    setDraftNote(null);
    setSelectedNoteId(id);
    setMobileView('editor');
    setSidebarOpen(false);
  }

  function handleFolderChange(folder: FolderFilter) {
    setActiveFolder(folder);
    setDraftNote(null);
    setSelectedNoteId(null);
    setMobileView('list');
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
    setMobileView('editor');
    setSidebarOpen(false);
  }

  const handleCreated = useCallback((realId: string) => {
    setDraftNote(null);
    setSelectedNoteId(realId);
    router.refresh();
  }, [router]);

  function handleDeleted() {
    setDraftNote(null);
    setSelectedNoteId(null);
    setMobileView('list');
    router.refresh();
  }

  return (
    <div className="flex h-[calc(100vh-9.5rem)] -m-4 lg:-m-8">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 bg-canvas border-r border-mist
          transform transition-transform duration-300 ease-edit
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-mist px-4 py-4">
            <span className="font-display text-xl tracking-editorial">Notas</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-ash hover:text-ink"
              aria-label="Cerrar menú"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <NotesSidebar
              activeFolder={activeFolder}
              onFolderChange={handleFolderChange}
              notes={notes}
            />
            <NotesList
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectNote={handleSelectNote}
              onCreateNote={handleCreateNote}
              onFolderChange={handleFolderChange}
              isMobile={true}
            />
          </div>
        </div>
      </aside>

      {/* Editor */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 border-b border-mist px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-ink hover:text-ash"
            aria-label="Abrir menú"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm text-ash">
            {editorNote ? (editorNote.title || 'Sin título') : 'Selecciona una nota'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <NoteEditor
            note={editorNote}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onDeleted={handleDeleted}
            onBack={() => {
              setMobileView('list');
              setSidebarOpen(true);
            }}
            onCreated={handleCreated}
          />
        </div>
      </main>
    </div>
  );
}
