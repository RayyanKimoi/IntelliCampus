'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
} from 'react';
import { cn } from '@/lib/utils';
import {
  Send,
  Mic,
  MicOff,
  Search,
  Paperclip,
  X,
  ImageIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

interface PromptInputBoxProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function ToggleButton({
  active,
  activeColor,
  onClick,
  title,
  children,
}: {
  active: boolean;
  activeColor: string;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
        'border',
        active
          ? cn(activeColor, 'border-current/30 shadow-sm')
          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80',
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main PromptInputBox
// ─────────────────────────────────────────────────────────────────────────────

export function PromptInputBox({
  onSend,
  isLoading = false,
  placeholder = 'Ask anything about your curriculum…',
  className,
  disabled = false,
}: PromptInputBoxProps) {
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [focused, setFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const clamped = Math.min(el.scrollHeight, 200); // max ~7 lines
    el.style.height = `${clamped}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  // Voice recording
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        // For now we just show the mic as off; real STT wiring happens in ChatWindow
      };
      recorder.start();
      mediaRef.current = recorder;
      setIsRecording(true);
    } catch {
      // microphone not available
    }
  };

  // File attach
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const newFiles: AttachedFile[] = picked.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  // Send
  const handleSend = () => {
    if ((!value.trim() && files.length === 0) || isLoading || disabled) return;
    onSend(value.trim(), files.map((f) => f.file));
    setValue('');
    setFiles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (value.trim().length > 0 || files.length > 0) && !isLoading && !disabled;

  // ── JSX ──
  return (
    <div
      className={cn(
        'rounded-2xl border bg-card transition-all duration-200',
        focused
          ? 'border-[#006EB2]/60 shadow-[0_0_0_3px_rgba(0,110,178,0.12)]'
          : 'border-border shadow-sm',
        className,
      )}
    >
      {/* Attached file previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 pb-0">
          {files.map((f) => (
            <div
              key={f.id}
              className="group relative flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs text-muted-foreground"
            >
              {f.preview ? (
                <img
                  src={f.preview}
                  alt=""
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="max-w-[120px] truncate">{f.file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                className="ml-1 rounded p-0.5 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea */}
      <div className="px-4 pt-3 pb-1">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            'w-full resize-none bg-transparent text-sm text-foreground leading-relaxed',
            'placeholder:text-muted-foreground focus:outline-none disabled:opacity-50',
          )}
          style={{ minHeight: '36px', maxHeight: '200px' }}
        />
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-border" />

      {/* Bottom action bar */}
      <div className="flex items-center gap-1 px-3 py-2.5">
        {/* Left actions */}
        <div className="flex items-center gap-0.5">
          {/* Attach */}
          <button
            type="button"
            title="Attach file"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Voice */}
          <button
            type="button"
            title={isRecording ? 'Stop recording' : 'Voice input'}
            onClick={toggleRecording}
            disabled={disabled || isLoading}
            className={cn(
              'rounded-lg p-2 transition-colors disabled:opacity-40',
              isRecording
                ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4 animate-pulse" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Vertical separator */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* Mode toggles */}
        <div className="flex items-center gap-0.5">
          <ToggleButton
            active={searchActive}
            activeColor="text-[#006EB2] bg-[#006EB2]/10 dark:bg-[#006EB2]/20"
            onClick={() => setSearchActive((v) => !v)}
            title="Deep search mode"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
          </ToggleButton>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Send button */}
        <div className="relative">
          {/* Animated glow ring when ready to send */}
          {canSend && !isLoading && (
            <span
              className="absolute inset-0 rounded-xl animate-ping"
              style={{
                background: 'linear-gradient(135deg,#002F4C,#006EB2)',
                opacity: 0.35,
                animationDuration: '1.4s',
              }}
            />
          )}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'relative flex items-center justify-center rounded-xl h-9 w-9 transition-all duration-200',
              canSend
                ? 'shadow-md hover:scale-110 active:scale-95'
                : 'opacity-40 cursor-not-allowed',
            )}
            style={
              canSend
                ? { background: 'linear-gradient(135deg, #002F4C 0%, #006EB2 100%)' }
                : { background: 'hsl(var(--muted))' }
            }
            title="Send (↵)"
          >
            {isLoading ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Send
                className={cn('h-4 w-4', canSend ? 'text-white' : 'text-muted-foreground')}
                style={{ transform: 'translateX(0.5px)' }}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
