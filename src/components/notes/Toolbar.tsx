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

const MONO_FONT = "'Courier New', monospace";

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72];

const LINE_HEIGHTS = [
  { label: '1.1', value: '1.1' },
  { label: '1.4', value: '1.4' },
  { label: '1.7', value: '1.7' },
  { label: '2.0', value: '2.0' },
];

const PARAGRAPH_STYLES = [
  { label: 'Título', value: 'title' },
  { label: 'Encabezado', value: 'h2' },
  { label: 'Subencabezado', value: 'h3' },
  { label: 'Cuerpo', value: 'body' },
  { label: 'Monoespaciado', value: 'mono' },
];

const TEXT_COLORS = [
  '#0A0A0A', '#262626', '#404040', '#595959', '#737373', '#8C8C8C',
  '#A6A6A6', '#BFBFBF', '#D9D9D9', '#EDEDED', '#F5F5F5', '#FFFFFF',
  '#8E2222', '#A33B2F', '#B8543C', '#CC6D49', '#E08656', '#F49F63',
  '#2F5597', '#3E7CB1', '#4DA6CB', '#5CC3D9', '#6EE7FF', '#A3E635',
];

const HIGHLIGHT_COLORS = [
  '#FFFFFF', '#F5F5F5', '#FDE68A', '#BBF7D0',
  '#BFDBFE', '#DDD6FE', '#FBCFE8', '#FECACA',
];

function getBlockStyle(editor: Editor): string {
  if (editor.isActive('heading', { level: 1 })) return 'title';
  if (editor.isActive('heading', { level: 2 })) return 'h2';
  if (editor.isActive('heading', { level: 3 })) return 'h3';
  const fontFamily = editor.getAttributes('textStyle').fontFamily as string | undefined;
  if (fontFamily && fontFamily.includes('Courier')) return 'mono';
  return 'body';
}

export function Toolbar({ editor }: ToolbarProps) {
  const [showColors, setShowColors] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColors(false);
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) {
        setShowHighlights(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const currentFont =
    editor.getAttributes('textStyle').fontFamily ??
    (editor.isActive('heading') ? FONT_FAMILIES[1].value : FONT_FAMILIES[0].value);
  const currentSize = editor.getAttributes('textStyle').fontSize ?? '16px';
  const currentLineHeight =
    editor.getAttributes('paragraph').lineHeight ??
    editor.getAttributes('textStyle').lineHeight ??
    '1.7';
  const currentStyle = getBlockStyle(editor);
  const isDash =
    editor.isActive('bulletList') && editor.getAttributes('bulletList').listStyle === 'dash';

  const applyStyle = (value: string) => {
    const chain = editor.chain().focus();
    if (value === 'title') chain.setHeading({ level: 1 }).run();
    else if (value === 'h2') chain.setHeading({ level: 2 }).run();
    else if (value === 'h3') chain.setHeading({ level: 3 }).run();
    else if (value === 'mono') chain.setParagraph().setFontFamily(MONO_FONT).run();
    else chain.setParagraph().run();
  };

  const setListStyle = (kind: 'bullet' | 'dash') => {
    if (editor.isActive('bulletList')) {
      editor.chain().focus().updateAttributes('bulletList', { listStyle: kind }).run();
    } else {
      editor.chain().focus().toggleBulletList().updateAttributes('bulletList', { listStyle: kind }).run();
    }
  };

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del enlace', previous ?? 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const btn = (
    onClick: () => void,
    active?: boolean,
    disabled?: boolean,
    title?: string,
    children?: React.ReactNode
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 min-w-[30px] items-center justify-center px-2 transition-colors ${
        active ? 'bg-ink text-canvas' : 'text-ink hover:bg-pearl'
      } ${disabled ? 'cursor-not-allowed opacity-30' : ''}`}
    >
      {children}
    </button>
  );

  const divider = () => <div className="mx-1 h-5 w-px bg-mist" />;
  const selectClass =
    'h-8 border border-mist bg-canvas px-2 text-sm text-ink focus:border-ink focus:outline-none';
  const iconClass = 'h-4 w-4';

  return (
    <div className="flex flex-1 flex-wrap items-center gap-1">
      {/* Estilo de parrafo */}
      <select
        id="paragraph-style"
        name="paragraph-style"
        aria-label="Estilo"
        title="Estilo"
        className={selectClass}
        value={currentStyle}
        onChange={(e) => applyStyle(e.target.value)}
      >
        {PARAGRAPH_STYLES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Fuente / tamaño / línea */}
      <select
        id="font-family"
        name="font-family"
        aria-label="Fuente"
        title="Fuente"
        className={selectClass}
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
        id="font-size"
        name="font-size"
        aria-label="Tamaño"
        title="Tamaño"
        className={`${selectClass} w-16`}
        value={parseInt(currentSize, 10) || 16}
        onChange={(e) => editor.chain().focus().setFontSize(`${e.target.value}px`).run()}
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        id="line-height"
        name="line-height"
        aria-label="Altura de línea"
        title="Altura de línea"
        className={`${selectClass} w-16 text-xs text-ash`}
        value={currentLineHeight}
        onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()}
      >
        {LINE_HEIGHTS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>

      {divider()}

      {/* Énfasis */}
      {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), false, 'Negrita', <span className="text-sm font-bold">B</span>)}
      {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), false, 'Cursiva', <span className="text-sm italic">I</span>)}
      {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), false, 'Subrayado', <span className="text-sm underline">U</span>)}
      {btn(() => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'), false, 'Tachado', <span className="text-sm line-through">S</span>)}

      {divider()}

      {/* Listas */}
      {btn(() => setListStyle('bullet'), editor.isActive('bulletList') && !isDash, false, 'Lista con viñetas', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
      ))}
      {btn(() => setListStyle('dash'), isDash, false, 'Lista con guiones', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6h12M9 12h12M9 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>
      ))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), false, 'Lista numerada', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4v-1a1 1 0 011-1h0a1 1 0 011 1v1" /></svg>
      ))}
      {btn(() => editor.chain().focus().toggleTaskList().run(), editor.isActive('taskList'), false, 'Lista de tareas', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></svg>
      ))}

      {divider()}

      {/* Alineación */}
      {btn(() => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }), false, 'Alinear izquierda', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h10M4 18h14" /></svg>
      ))}
      {btn(() => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }), false, 'Centrar', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M7 12h10M5 18h14" /></svg>
      ))}
      {btn(() => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }), false, 'Alinear derecha', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M10 12h10M6 18h14" /></svg>
      ))}

      {divider()}

      {/* Color de texto */}
      <div ref={colorRef}>
        <button
          type="button"
          title="Color del texto"
          aria-label="Color del texto"
          aria-expanded={showColors}
          onClick={() => {
            setShowColors((v) => !v);
            setShowHighlights(false);
          }}
          className={`inline-flex h-8 items-center gap-1 px-2 transition-colors ${
            showColors ? 'bg-ink text-canvas' : 'text-ink hover:bg-pearl'
          }`}
        >
          <span className="text-sm font-medium" style={{ color: showColors ? undefined : editor.getAttributes('textStyle').color || '#0A0A0A' }}>
            A
          </span>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showColors && (
          <div className="absolute inset-x-0 top-full z-50 border-b border-mist bg-canvas px-3 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] tracking-wider2 text-ash">COLOR DEL TEXTO</span>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColors(false);
                }}
                className="text-xs text-ash hover:text-ink"
              >
                Restablecer
              </button>
            </div>
            <div className="grid grid-cols-12 gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={`Color ${c}`}
                  onClick={() => {
                    editor.chain().focus().setColor(c).run();
                    setShowColors(false);
                  }}
                  className="h-6 w-full border border-mist transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resaltado */}
      <div ref={highlightRef}>
        <button
          type="button"
          title="Resaltado"
          aria-label="Resaltado"
          aria-expanded={showHighlights}
          onClick={() => {
            setShowHighlights((v) => !v);
            setShowColors(false);
          }}
          className={`inline-flex h-8 items-center gap-1 px-2 transition-colors ${
            showHighlights ? 'bg-ink text-canvas' : 'text-ink hover:bg-pearl'
          }`}
        >
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showHighlights && (
          <div className="absolute inset-x-0 top-full z-50 border-b border-mist bg-canvas px-3 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] tracking-wider2 text-ash">RESALTADO</span>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setShowHighlights(false);
                }}
                className="text-xs text-ash hover:text-ink"
              >
                Quitar
              </button>
            </div>
            <div className="grid grid-cols-12 gap-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={`Resaltado ${c}`}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: c }).run();
                    setShowHighlights(false);
                  }}
                  className="h-6 w-full border border-mist transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {divider()}

      {/* Enlace / tabla / cita / código / divisoria */}
      {btn(() => setLink(), editor.isActive('link'), false, 'Enlace', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 11-5.656-5.656l1.5-1.5m9.657-1.343a4 4 0 00-5.657 0l-3 3" /></svg>
      ))}
      {btn(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), editor.isActive('table'), false, 'Insertar tabla', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h18v14H3zM3 10h18M9 5v14M15 5v14" /></svg>
      ))}
      {btn(() => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'), false, 'Cita', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h8m-8 4h8M10 20V4M16 20V4" /></svg>
      ))}
      {btn(() => editor.chain().focus().toggleCode().run(), editor.isActive('code'), false, 'Código en línea', (
        <span className="font-mono text-xs">&lt;/&gt;</span>
      ))}
      {btn(() => editor.chain().focus().setHorizontalRule().run(), false, false, 'Línea divisoria', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16" /></svg>
      ))}

      {divider()}

      {/* Indentación */}
      {btn(() => editor.chain().focus().updateAttributes(editor.isActive('heading') ? 'heading' : 'paragraph', { indent: Math.min(3, (editor.getAttributes(editor.isActive('heading') ? 'heading' : 'paragraph').indent ?? 0) + 1) }).run(), false, false, 'Sangrar (⌘])', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M10 12h10M4 18h16M4 10l3 2-3 2" /></svg>
      ))}
      {btn(() => editor.chain().focus().updateAttributes(editor.isActive('heading') ? 'heading' : 'paragraph', { indent: Math.max(0, (editor.getAttributes(editor.isActive('heading') ? 'heading' : 'paragraph').indent ?? 0) - 1) }).run(), false, false, 'Desangrar (⌘[)', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M10 12h10M4 18h16M7 10l-3 2 3 2" /></svg>
      ))}

      {divider()}

      {/* Deshacer / rehacer */}
      {btn(() => editor.chain().focus().undo().run(), false, !editor.can().undo(), 'Deshacer', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a5 5 0 015 5v2M3 10l6-6m-6 6l6 6" /></svg>
      ))}
      {btn(() => editor.chain().focus().redo().run(), false, !editor.can().redo(), 'Rehacer', (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 10H11a5 5 0 00-5 5v2m15-7l-6-6m6 6l-6 6" /></svg>
      ))}
    </div>
  );
}
