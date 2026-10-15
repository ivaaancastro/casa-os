'use client';

import type { Note } from './NotesLayout';

type FolderFilter = 'ALL' | 'SHOPPING' | 'GENERAL' | 'TODO';

interface NotesSidebarProps {
  activeFolder: FolderFilter;
  onFolderChange: (folder: FolderFilter) => void;
  notes: Note[];
}

const FOLDERS: { value: FolderFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'SHOPPING', label: 'Compra' },
  { value: 'GENERAL', label: 'General' },
  { value: 'TODO', label: 'Pendientes' },
];

export function NotesSidebar({ activeFolder, onFolderChange, notes }: NotesSidebarProps) {
  function getCount(folder: FolderFilter): number {
    if (folder === 'ALL') return notes.length;
    return notes.filter((n) => n.type === folder).length;
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Carpetas
      </h2>
      <nav className="space-y-1">
        {FOLDERS.map((folder) => (
          <button
            key={folder.value}
            onClick={() => onFolderChange(folder.value)}
            className={`
              w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
              ${activeFolder === folder.value
                ? 'bg-brand-50 text-brand-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            <span>{folder.label}</span>
            <span className="text-xs text-gray-400">{getCount(folder.value)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
