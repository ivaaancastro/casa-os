'use client';

import { useState, useRef, useCallback } from 'react';
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

  // Determine the note currently shown in the editor.
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
    <div className="flex h-[calc(100vh-9.5rem)] -m-4 lg:-m-8 border-t border-mist">
      {/* Columna 1: Carpetas */}
      <div className="hidden lg:block w-60 border-r border-mist bg-pearl overflow-y-auto">
        <NotesSidebar
          activeFolder={activeFolder}
          onFolderChange={handleFolderChange}
          notes={notes}
        />
      </div>

      {/* Columna 2: Lista de notas */}
      <div className={`
        w-full lg:w-80 border-r border-mist flex flex-col
        ${mobileView === 'editor' ? 'hidden lg:flex' : 'flex'}
      `}>
        <NotesList
          notes={filteredNotes}
          selectedNoteId={selectedNoteId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onFolderChange={handleFolderChange}
          isMobile={mobileView === 'list'}
        />
      </div>

      {/* Columna 3: Editor */}
      <div className={`
        flex-1 flex flex-col
        ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
      `}>
        <NoteEditor
          note={editorNote}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onDeleted={handleDeleted}
          onBack={() => setMobileView('list')}
          onCreated={handleCreated}
        />
      </div>
    </div>
  );
}
