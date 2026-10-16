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
    <div className="px-3 pb-2 pt-3">
      <p className="mb-2 px-1 text-[10px] tracking-wider2 text-ash">Carpetas</p>
      <nav className="space-y-px">
        {FOLDERS.map((folder) => (
          <button
            key={folder.value}
            onClick={() => onFolderChange(folder.value)}
            className={`
              flex w-full items-center justify-between px-2.5 py-1.5 text-sm transition-colors
              ${
                activeFolder === folder.value
                  ? 'bg-ink font-medium text-canvas'
                  : 'text-ink hover:bg-pearl'
              }
            `}
          >
            <span>{folder.label}</span>
            <span
              className={`text-xs ${
                activeFolder === folder.value ? 'text-canvas/60' : 'text-ash'
              }`}
            >
              {getCount(folder.value)}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
