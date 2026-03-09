'use client';

import React from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  readOnly = false,
}: RichTextEditorProps) {
  return (
    <div className="border rounded-lg overflow-hidden h-full flex flex-col">
      {/* Toolbar */}
      {!readOnly && (
        <div className="border-b px-4 py-2 bg-muted/30 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 hover:bg-muted rounded text-sm font-semibold"
              onClick={() => {
                const selection = window.getSelection()?.toString();
                if (selection) {
                  onChange(value.replace(selection, `**${selection}**`));
                }
              }}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="p-2 hover:bg-muted rounded text-sm italic"
              onClick={() => {
                const selection = window.getSelection()?.toString();
                if (selection) {
                  onChange(value.replace(selection, `*${selection}*`));
                }
              }}
            >
              I
            </button>
            <button
              type="button"
              className="p-2 hover:bg-muted rounded text-sm underline"
              onClick={() => {
                const selection = window.getSelection()?.toString();
                if (selection) {
                  onChange(value.replace(selection, `__${selection}__`));
                }
              }}
            >
              U
            </button>
          </div>
          <div className="h-5 w-px bg-border mx-2" />
          <button
            type="button"
            className="px-3 py-1 hover:bg-muted rounded text-sm"
            onClick={() => onChange(value + '\n# Heading\n')}
          >
            H
          </button>
          <button
            type="button"
            className="px-3 py-1 hover:bg-muted rounded text-sm"
            onClick={() => onChange(value + '\n- List item\n')}
          >
            • List
          </button>
          <button
            type="button"
            className="px-3 py-1 hover:bg-muted rounded text-sm"
            onClick={() => onChange(value + '\n`code`\n')}
          >
            {'</>'}
          </button>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 overflow-auto">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="w-full h-full p-4 bg-background resize-none focus:outline-none text-sm leading-relaxed"
        />
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-1.5 bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
        <span>{value.length} characters</span>
        <span>{value.split(/\s+/).filter(Boolean).length} words</span>
      </div>
    </div>
  );
}
