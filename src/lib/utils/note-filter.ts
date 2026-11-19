import type { Note } from '../../types/note';

export type FolderFilter = 'ALL' | 'SHOPPING' | 'GENERAL' | 'TODO';

export type NoteFilter = {
  folder: FolderFilter;
  query: string;
};

/** Única fuente de carpetas: sidebar de escritorio y chips móviles. */
export const NOTE_FOLDERS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'SHOPPING', label: 'Compra' },
  { value: 'GENERAL', label: 'General' },
  { value: 'TODO', label: 'Pendientes' },
] as const satisfies ReadonlyArray<{ value: FolderFilter; label: string }>;

/**
 * Filtrado local de notas: por carpeta y por texto (título o contenido),
 * ordenado por fecha de creación descendente. Sin peticiones de red.
 */
export function filterNotes(notes: Note[], { folder, query }: NoteFilter): Note[] {
  const q = query.trim().toLowerCase();
  return notes
    .filter((note) => {
      if (folder !== 'ALL' && note.type !== folder) return false;
      if (!q) return true;
      return (
        note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Contador por carpeta para los chips móviles y el sidebar de escritorio. */
export function countByFolder(notes: Note[], folder: FolderFilter): number {
  if (folder === 'ALL') return notes.length;
  return notes.filter((note) => note.type === folder).length;
}
