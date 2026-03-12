'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Code2, FileText, Download, Image, File, Eye, Loader2, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-[#1e1e1e] rounded-xl">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
    </div>
  ),
});

interface SubmissionPreviewProps {
  answers?: {
    textContent?: string;
    codeContent?: string;
    language?: string;
    executionResult?: {
      stdout?: string;
      stderr?: string;
      executionTime?: string;
    };
  } | null;
  fileUrl?: string | null;
  className?: string;
  compact?: boolean;
}

function detectLanguage(code: string): string {
  if (/^(import|from|def |class |print\()/.test(code)) return 'python';
  if (/^(public\s+class|import\s+java)/.test(code)) return 'java';
  if (/^#include|int\s+main\s*\(/.test(code)) return 'cpp';
  if (/^(const |let |var |function |import |export )/.test(code)) return 'javascript';
  return 'plaintext';
}

function getFileType(url: string): 'pdf' | 'image' | 'docx' | 'unknown' {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(jpe?g|png|gif|webp|svg|bmp)$/.test(lower)) return 'image';
  if (/\.(docx?)$/.test(lower)) return 'docx';
  return 'unknown';
}

function TextPreview({ content }: { content: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card dark:bg-muted/10 p-5 overflow-auto max-h-[500px]">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <FileText className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-widest">Text Submission</span>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {content}
      </div>
    </div>
  );
}

function CodePreview({ code, language }: { code: string; language?: string }) {
  const lang = language || detectLanguage(code);
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1e1e] border-b border-zinc-700">
        <Code2 className="w-4 h-4 text-zinc-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Code Submission</span>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">
          {lang}
        </span>
      </div>
      <MonacoEditor
        height="360px"
        language={lang}
        value={code}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          fontSize: 13,
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          contextmenu: false,
        }}
      />
    </div>
  );
}

function TerminalOutput({ stdout, stderr, executionTime }: {
  stdout?: string;
  stderr?: string;
  executionTime?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-700 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-b border-zinc-700">
        <Terminal className="w-4 h-4 text-zinc-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Program Output</span>
        {executionTime && (
          <span className="ml-auto text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">
            {executionTime}s
          </span>
        )}
      </div>
      <div className="bg-zinc-950 p-4 min-h-[120px] max-h-[320px] overflow-auto">
        <div className="font-mono text-xs leading-relaxed space-y-2">
          <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2">$ Running code...</div>
          {stdout && (
            <div>
              <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Output:</div>
              <pre className="text-zinc-200 whitespace-pre-wrap">{stdout}</pre>
            </div>
          )}
          {stderr && (
            <div>
              <div className="text-red-500 text-[10px] uppercase tracking-widest mb-1 mt-2">Errors:</div>
              <pre className="text-red-400 whitespace-pre-wrap">{stderr}</pre>
            </div>
          )}
          {!stdout && !stderr && (
            <pre className="text-zinc-500">(no output)</pre>
          )}
        </div>
        {executionTime && (
          <div className="mt-3 pt-2 border-t border-zinc-800">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              Execution time: {executionTime}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PdfPreview({ url }: { url: string }) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 dark:bg-muted/10 border-b border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <File className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">PDF Document</span>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
            <Download className="w-3 h-3" /> Download
          </Button>
        </a>
      </div>
      <iframe
        src={url}
        className="w-full h-[500px] bg-white"
        title="PDF Preview"
      />
    </div>
  );
}

function ImagePreview({ url }: { url: string }) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 dark:bg-muted/10 border-b border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Image className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Image Submission</span>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
            <Eye className="w-3 h-3" /> Full Size
          </Button>
        </a>
      </div>
      <div className="p-4 flex items-center justify-center bg-muted/10 dark:bg-muted/5 min-h-[200px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Submission" className="max-w-full max-h-[460px] rounded-lg shadow-sm object-contain" />
      </div>
    </div>
  );
}

function FileDownloadFallback({ url }: { url: string }) {
  const filename = url.split('/').pop() || 'submission-file';
  return (
    <div className="rounded-xl border border-border/50 bg-card dark:bg-muted/10 p-6 flex flex-col items-center justify-center gap-3 min-h-[160px]">
      <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-full">
        <File className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{filename}</p>
      <p className="text-xs text-muted-foreground">Preview not available for this file type</p>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
          <Download className="w-3.5 h-3.5" /> Download File
        </Button>
      </a>
    </div>
  );
}

export function SubmissionPreview({ answers, fileUrl, className, compact }: SubmissionPreviewProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'code' | 'file' | 'output'>('text');

  const hasText = !!answers?.textContent?.trim();
  const hasCode = !!answers?.codeContent?.trim();
  const hasFile = !!fileUrl;
  const hasOutput = !!(answers?.executionResult?.stdout || answers?.executionResult?.stderr);

  // Determine which tabs to show
  const tabs: { key: 'text' | 'code' | 'file' | 'output'; label: string; icon: React.ReactNode }[] = [];
  if (hasText) tabs.push({ key: 'text', label: 'Text', icon: <FileText className="w-3.5 h-3.5" /> });
  if (hasCode) tabs.push({ key: 'code', label: 'Code', icon: <Code2 className="w-3.5 h-3.5" /> });
  if (hasFile) tabs.push({ key: 'file', label: 'File', icon: <File className="w-3.5 h-3.5" /> });
  if (hasOutput) tabs.push({ key: 'output', label: 'Output', icon: <Terminal className="w-3.5 h-3.5" /> });

  // Auto-select first available tab
  const validTab = tabs.find(t => t.key === activeTab) ? activeTab : tabs[0]?.key || 'text';

  if (tabs.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border/50 bg-card dark:bg-muted/10 p-6 flex flex-col items-center justify-center gap-2 min-h-[120px]', className)}>
        <div className="p-3 bg-muted/50 dark:bg-muted/30 rounded-full">
          <FileText className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">No submission content available</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Tab bar - only show if more than one tab */}
      {tabs.length > 1 && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 dark:bg-muted/20 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                validTab === tab.key
                  ? 'bg-card dark:bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {validTab === 'text' && hasText && (
        <TextPreview content={answers!.textContent!} />
      )}
      {validTab === 'code' && hasCode && (
        <CodePreview code={answers!.codeContent!} language={answers?.language} />
      )}
      {validTab === 'file' && hasFile && (() => {
        const fileType = getFileType(fileUrl!);
        switch (fileType) {
          case 'pdf': return <PdfPreview url={fileUrl!} />;
          case 'image': return <ImagePreview url={fileUrl!} />;
          default: return <FileDownloadFallback url={fileUrl!} />;
        }
      })()}
      {validTab === 'output' && hasOutput && (
        <TerminalOutput
          stdout={answers!.executionResult!.stdout}
          stderr={answers!.executionResult!.stderr}
          executionTime={answers!.executionResult!.executionTime}
        />
      )}
    </div>
  );
}
