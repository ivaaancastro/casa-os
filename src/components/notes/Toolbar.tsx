'use client';

import type { Editor } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';

interface ToolbarProps {
  editor: Editor | null;
}

const FONT_FAMILIES = [
  { label: 'Jost', value: 'Jost, Helvetica Neue, Arial, sans-serif' },
  { label: 'Bodoni', value: 'Bodoni Moda, Georgia, serif' },
  { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Inter', value: 'Inter, Helvetica Neue, Arial, sans-serif' },
  { label: 'Mono', value: "'Courier New', monospace" },
  { label: 'Sistema', value: 'system-ui, sans-serif' },
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72];

const LINE_HEIGHTS = [
  { label: '1.1', value: '1.1' },
  { label: '1.4', value: '1.4' },
  { label: '1.7', value: '1.7' },
  { label: '2.0', value: '2.0' },
];

const TEXT_COLORS = [
  '#0A0A0A', '#262626', '#404040', '#595959', '#737373', '#8C8C8C',
  '#A6A6A6', '#BFBFBF', '#D9D9D9', '#EDEDED', '#F5F5F5', '#FFFFFF',
  '#8E2222', '#A33B2F', '#B8543C', '#CC6D49', '#E08656', '#F49F63',
  '#2F5597', '#3E7CB1', '#4DA6CB', '#5CC3D9', '#6EE7FF', '#A3E635',
];

const HIGHLIGHT_COLORS = [
  '#FFFFFF', '#F5F5F5', '#FFFBEB', '#ECFDF5',
  '#EFF6FF', '#F5F3FF', '#FDF2F8', '#FEF2F2',
];

export function Toolbar({ editor }: ToolbarProps) {
  const [showColors, setShowColors] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColors(false);
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) setShowHighlights(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const currentFont = editor.getAttributes('textStyle').fontFamily ?? FONT_FAMILIES[0].value;
  const currentSize = editor.getAttributes('textStyle').fontSize ?? '16px';

  const btn = (onClick: () => void, active?: boolean, disabled?: boolean, title?: string, children?: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-8 min-w-[28px] items-center justify-center px-2 transition-colors ${
        active ? 'bg-ink text-canvas' : 'text-ink hover:bg-pearl'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const divider = () => <div className="w-px h-5 bg-mist mx-1" />;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-mist px-3 py-2 bg-canvas">
      {/* Fuente y tamano */}
      <select
        className="h-8 border border-mist px-2 text-sm bg-canvas text-ink focus:border-ink focus:outline-none"
        value={currentFont}
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
            {f.label}
          </option>
        ))}
      </select>
      <select
        className="h-8 w-14 border border-mist px-2 text-sm bg-canvas text-ink focus:border-ink focus:outline-none"
        value={parseInt(currentSize)}
        onChange={(e) => editor.chain().focus().setFontSize(`${e.target.value}px`).run()}
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select
        className="h-8 w-14 border border-mist px-2 text-xs text-ash bg-canvas focus:border-ink focus:outline-none"
        onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()}
        title="Altura de linea"
      >
        {LINE_HEIGHTS.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      {divider()}

      {/* Estilos basicos */}
      {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), false, 'Negrita', <span className="font-bold text-sm">B</span>)}
      {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), false, 'Cursiva', <span className="italic text-sm">I</span>)}
      {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), false, 'Subrayado', <span className="underline text-sm">U</span>)}
      {btn(() => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'), false, 'Tachado', <span className="line-through text-sm">S</span>)}

      {divider()}

      {/* Listas */}
      {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), false, 'Lista bullets', (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
      ))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), false, 'Lista numerada', (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 19h14" /></svg>
      ))}

      {divider()}

      {/* Alineacion */}
      {btn(() => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }), false, 'Alinear izquierda', (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h10M4 18h14" /></svg>
      ))}
      {btn(() => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }), false, 'Centrar', (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M7 12h10M5 18h14" /></svg>
      ))}
      {btn(() => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }), false, 'Alinear derecha', (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M10 12h10M6 18h14" /></svg>
      ))}

      {divider()}

      {/* Color texto */}
      <div className="relative" ref={colorRef}>
        <button
          type="button"
          title="Color del texto"
          onClick={() => {
            setShowColors((v) => !v);
            setShowHighlights(false);
          }}
          className="inline-flex h-8 w-8 items-center justify-center border border-mist text-sm transition-colors hover:bg-pearl"
        >
          <span style={{ color: editor.getAttributes('textStyle').color || '#0A0A0A' }}>A</span>
        </button>
        {showColors && (
          <div className="absolute top-full left-0 z-50 mt-2 grid grid-cols-6 gap-1 border border-mist bg-canvas p-3 shadow-focus">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  editor.chain().focus().setColor(c).run();
                  setShowColors(false);
                }}
                className="h-6 w-6 border border-mist transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Highlight */}
      <div className="relative" ref={highlightRef}>
        <button
          type="button"
          title="Resaltado"
          onClick={() => {
            setShowHighlights((v) => !v);
            setShowColors(false);
          }}
          className="inline-flex h-8 w-8 items-center justify-center border border-mist text-sm transition-colors hover:bg-pearl"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        {showHighlights && (
          <div className="absolute top-full left-0 z-50 mt-2 flex gap-2 border border-mist bg-canvas p-3 shadow-focus">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  editor.chain().focus().toggleHighlight({ color: c }).run();
                  setShowHighlights(false);
                }}
                className="h-8 w-8 border border-mist transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              type="button"
              title="Quitar resaltado"
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setShowHighlights(false);
              }}
              className="h-8 border border-ink px-2 text-xs text-ink transition-colors hover:bg-ink hover:text-canvas"
            >
              Quitar
            </button>
          </div>
        )}
      </div>

      {divider()}

      {/* quote + code */}
      {btn(() => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'), false, 'Cita', (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h8m-8 4h8M10 20V4M16 20V4" /></svg>
      ))}
      {btn(() => editor.chain().focus().toggleCode().run(), editor.isActive('code'), false, 'Codigo en linea', (
        <span className="font-mono text-xs">&lt;&gt;</span>
      ))}

      {divider()}

      {/* Undo/redo */}
      {btn(() => editor.chain().focus().undo().run(), false, !editor.can().undo(), 'Deshacer', (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a5 5 0 015 5v2M3 10l6-6m-6 6l6 6" /></svg>
      ))}
      {btn(() => editor.chain().focus().redo().run(), false, !editor.can().redo(), 'Rehacer', (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 10H11a5 5 0 00-5 5v2m15-7l-6-6m6 6l-6 6" /></svg>
      ))}

      {divider()}

      {btn(() => editor.chain().focus().setHorizontalRule().run(), false, false, 'Linea horizontal', (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16" /></svg>
      ))}
    </div>
  );
}
