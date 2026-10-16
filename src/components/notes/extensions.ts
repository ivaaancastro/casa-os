import { Extension } from '@tiptap/core';
import { BulletList } from '@tiptap/extension-list';

/**
 * Lista con viñetas que ademas soporta el estilo "guiones" (tipo Apple Notas).
 * El estilo se guarda en el atributo `data-list-style` de la lista.
 */
export const DashBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyle: {
        default: 'bullet',
        parseHTML: (element) => element.getAttribute('data-list-style') || 'bullet',
        renderHTML: (attributes) =>
          attributes.listStyle === 'dash' ? { 'data-list-style': 'dash' } : {},
      },
    };
  },
});

export const INDENT_TYPES = ['paragraph', 'heading'];
export const MAX_INDENT = 3;

/**
 * Indentacion de parrafos/encabezados guardada en `data-indent`.
 * Atajos: Cmd/Ctrl + ] indenta, Cmd/Ctrl + [ desindenta.
 */
export const Indent = Extension.create({
  name: 'indent',
  addGlobalAttributes() {
    return [
      {
        types: INDENT_TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const value = parseInt(element.getAttribute('data-indent') || '0', 10);
              return Number.isNaN(value) ? 0 : value;
            },
            renderHTML: (attributes) =>
              attributes.indent ? { 'data-indent': attributes.indent } : {},
          },
        },
      },
    ];
  },
  addKeyboardShortcuts() {
    const change = (delta: number) => () => {
      const { editor } = this;
      const type = editor.isActive('heading') ? 'heading' : 'paragraph';
      const current = (editor.getAttributes(type).indent as number) ?? 0;
      const next = Math.min(MAX_INDENT, Math.max(0, current + delta));
      if (next === current) return false;
      return editor.chain().focus().updateAttributes(type, { indent: next }).run();
    };
    return {
      'Mod-]': change(1),
      'Mod-[': change(-1),
    };
  },
});

/**
 * Atajos de lista tipo Apple Notas (prioridad alta para ganar a los de TipTap):
 * Cmd/Ctrl + Shift + 7 viñetas, 8 guiones, 9 numerada, L checklist.
 */
export const AppleListKeymap = Extension.create({
  name: 'appleListKeymap',
  priority: 1000,
  addKeyboardShortcuts() {
    const { editor } = this;
    const setList = (kind: 'bullet' | 'dash' | 'ordered' | 'task') => () => {
      if (kind === 'ordered') return editor.chain().focus().toggleOrderedList().run();
      if (kind === 'task') return editor.chain().focus().toggleTaskList().run();
      const listStyle = kind === 'dash' ? 'dash' : 'bullet';
      if (editor.isActive('bulletList')) {
        return editor.chain().focus().updateAttributes('bulletList', { listStyle }).run();
      }
      return editor
        .chain()
        .focus()
        .toggleBulletList()
        .updateAttributes('bulletList', { listStyle })
        .run();
    };
    return {
      'Mod-Shift-7': setList('bullet'),
      'Mod-Shift-8': setList('dash'),
      'Mod-Shift-9': setList('ordered'),
      'Mod-Shift-l': setList('task'),
    };
  },
});
