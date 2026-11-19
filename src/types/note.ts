/** Nota compartida por la vista de escritorio y la vista móvil. */
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
