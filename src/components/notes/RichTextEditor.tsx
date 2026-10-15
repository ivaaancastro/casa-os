'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect, useRef, useState } from 'react';

type SaveState = 'saved' | 'saving' | 'idle';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder = 'Escribe aqui...' }: RichTextEditorProps) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      const html = editor.getHTML();

      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveState('saving');

      debounceRef.current = setTimeout(() => {
        onChange(html);
        setSaveState('saved');
      }, 500);
    },
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (editor && content && !editor.getText()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleChange = useCallback(
    (html: string) => {
      onChange(html);
      setSaveState('saved');
    },
    [onChange]
  );

  if (!editor) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div className="rich-text-editor">
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none focus:outline-none min-h-[300px] text-gray-700 leading-relaxed"
        style={{ minHeight: '300px' }}
      />
      <style jsx>{`
        .rich-text-editor :global(.ProseMirror) {
          outline: none;
          min-height: 300px;
        }
        .rich-text-editor :global(.ProseMirror p.is-editor-empty:first-child::before) {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor :global(.ProseMirror h1) {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        .rich-text-editor :global(.ProseMirror h2) {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 0.875rem;
          margin-bottom: 0.375rem;
          line-height: 1.3;
        }
        .rich-text-editor :global(.ProseMirror h3) {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }
        .rich-text-editor :global(.ProseMirror ul) {
          list-style: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor :global(.ProseMirror ol) {
          list-style: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor :global(.ProseMirror li) {
          margin: 0.25rem 0;
        }
        .rich-text-editor :global(.ProseMirror blockquote) {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: #6b7280;
          font-style: italic;
        }
        .rich-text-editor :global(.ProseMirror code) {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: monospace;
        }
        .rich-text-editor :global(.ProseMirror pre) {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.75rem 0;
        }
        .rich-text-editor :global(.ProseMirror pre code) {
          background-color: transparent;
          padding: 0;
          color: inherit;
          font-size: 0.875rem;
        }
        .rich-text-editor :global(.ProseMirror hr) {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1rem 0;
        }
        .rich-text-editor :global(.ProseMirror mark) {
          border-radius: 0.125rem;
          padding: 0 0.125rem;
        }
      `}</style>
    </div>
  );
}
