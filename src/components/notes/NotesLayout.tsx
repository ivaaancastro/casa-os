'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { filterNotes } from '@/lib/utils/note-filter';
import type { FolderFilter } from '@/lib/utils/note-filter';
import type { Note } from '@/types/note';
import { NotesDesktopView } from './NotesDesktopView';
import { NotesMobileView } from './NotesMobileView';
import { useIsMobile } from './useIsMobile';

interface NotesLayoutProps {
  notes: Note[];
  currentUserId: string;
  currentUserRole: string;
}

/** Dueño del estado de notas; delega el render en una vista por breakpoint. */
export function NotesLayout({ notes, currentUserId, currentUserRole }: NotesLayoutProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [notesState, setNotesState] = useState<Note[]>(notes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftNote, setDraftNote] = useState<Note | null>(null);

  useEffect(() => {
    setNotesState(notes);
  }, [notes]);

  const selectedRealNote = selectedNoteId
    ? notesState.find((n) => n.id === selectedNoteId) ?? null
    : null;
  const editorNote =
    selectedRealNote ?? (draftNote && selectedNoteId === draftNote.id ? draftNote : null);

  const filteredNotes = filterNotes(notesState, { folder: activeFolder, query: searchQuery });

  function handleSelectNote(id: string) {
    setDraftNote(null);
    setSelectedNoteId(id);
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
  }

  function handleBack() {
    setDraftNote(null);
    setSelectedNoteId(null);
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

  const sharedProps = {
    notes: notesState,
    filteredNotes,
    activeFolder,
    onFolderChange: handleFolderChange,
    selectedNoteId,
    searchQuery,
    onSearchChange: setSearchQuery,
    onSelectNote: handleSelectNote,
    onCreateNote: handleCreateNote,
    editorNote,
    currentUserId,
    currentUserRole,
    onDeleted: handleDeleted,
    onCreated: handleCreated,
    onNoteUpdated: handleNoteUpdated,
  };

  if (isMobile) {
    return <NotesMobileView {...sharedProps} onBack={handleBack} />;
  }

  return <NotesDesktopView {...sharedProps} />;
}
