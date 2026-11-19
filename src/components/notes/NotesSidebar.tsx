'use client';

import { countByFolder, NOTE_FOLDERS } from '@/lib/utils/note-filter';
import type { FolderFilter } from '@/lib/utils/note-filter';
import type { Note } from '@/types/note';

interface NotesSidebarProps {
  activeFolder: FolderFilter;
  onFolderChange: (folder: FolderFilter) => void;
  notes: Note[];
}

export function NotesSidebar({ activeFolder, onFolderChange, notes }: NotesSidebarProps) {
  return (
    <div className="px-3 pb-2 pt-3">
      <p className="mb-2 px-1 text-[10px] tracking-wider2 text-ash">Carpetas</p>
      <nav className="space-y-px" aria-label="Carpetas de notas">
        {NOTE_FOLDERS.map((folder) => {
          const isActive = activeFolder === folder.value;
          return (
            <button
              key={folder.value}
              onClick={() => onFolderChange(folder.value)}
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex w-full items-center justify-between px-2.5 py-1.5 text-sm transition-colors
                ${isActive ? 'bg-ink font-medium text-canvas' : 'text-ink hover:bg-pearl'}
              `}
            >
              <span>{folder.label}</span>
              <span className={`text-xs ${isActive ? 'text-canvas/60' : 'text-ash'}`}>
                {countByFolder(notes, folder.value)}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
