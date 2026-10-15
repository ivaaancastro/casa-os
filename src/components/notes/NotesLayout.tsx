'use client';

import { useState } from 'react';
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
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

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

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  function handleSelectNote(id: string) {
    setSelectedNoteId(id);
    setMobileView('editor');
  }

  function handleCreateNote() {
    const now = new Date();
    const newNote: Note = {
      id: `temp-${Date.now()}`,
      title: '',
      content: '',
      type: activeFolder === 'ALL' ? 'GENERAL' : activeFolder,
      completed: false,
      createdAt: now,
      updatedAt: now,
      author: { id: currentUserId, name: null },
    };
    setSelectedNoteId(newNote.id);
    setMobileView('editor');
    return newNote;
  }

  function handleDeleteNote() {
    setSelectedNoteId(null);
    setMobileView('list');
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 lg:-m-8">
      {/* Columna 1: Carpetas */}
      <div className="hidden lg:block w-60 border-r border-gray-200 bg-gray-50/50 overflow-y-auto">
        <NotesSidebar
          activeFolder={activeFolder}
          onFolderChange={setActiveFolder}
          notes={notes}
        />
      </div>

      {/* Columna 2: Lista de notas */}
      <div className={`
        w-full lg:w-80 border-r border-gray-200 flex flex-col
        ${mobileView === 'editor' ? 'hidden lg:flex' : 'flex'}
      `}>
        <NotesList
          notes={filteredNotes}
          selectedNoteId={selectedNoteId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onFolderChange={setActiveFolder}
          isMobile={mobileView === 'list'}
        />
      </div>

      {/* Columna 3: Editor */}
      <div className={`
        flex-1 flex flex-col
        ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
      `}>
        <NoteEditor
          note={selectedNote}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onDeleted={handleDeleteNote}
          onBack={() => setMobileView('list')}
        />
      </div>
    </div>
  );
}
