'use client';

import { countByFolder, NOTE_FOLDERS } from '@/lib/utils/note-filter';
import type { FolderFilter } from '@/lib/utils/note-filter';
import type { Note } from '@/types/note';

interface FolderChipsProps {
  activeFolder: FolderFilter;
  onFolderChange: (folder: FolderFilter) => void;
  notes: Note[];
}

/** Filtros de carpeta de una sola fila, con scroll lateral y contadores. */
export function FolderChips({ activeFolder, onFolderChange, notes }: FolderChipsProps) {
  return (
    <div
      className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1"
      role="group"
      aria-label="Carpetas de notas"
    >
      {NOTE_FOLDERS.map((folder) => {
        const isActive = activeFolder === folder.value;
        return (
          <button
            key={folder.value}
            onClick={() => onFolderChange(folder.value)}
            aria-pressed={isActive}
            className={`
              flex min-h-11 shrink-0 items-center gap-1.5 border px-3 text-sm transition-colors
              ${
                isActive
                  ? 'border-ink bg-accent text-white'
                  : 'border-mist/60 text-ink hover:bg-pearl'
              }
            `}
          >
            <span>{folder.label}</span>
            <span className={`text-xs ${isActive ? 'text-canvas/60' : 'text-ash'}`}>
              {countByFolder(notes, folder.value)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
