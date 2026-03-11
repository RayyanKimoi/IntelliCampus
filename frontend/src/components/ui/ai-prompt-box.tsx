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
  const recognitionRef = useRef<any>(null);
  const interimTranscriptRef = useRef<string>('');
  const retryCountRef = useRef<number>(0);
  const maxRetries = 2;

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

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Monitor online/offline status during recording
  useEffect(() => {
    if (!isRecording) return;

    const handleOffline = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      alert('Internet connection lost. Speech recognition has been stopped.');
    };

    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, [isRecording]);

  // Voice recording with Speech-to-Text
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      retryCountRef.current = 0;
      return;
    }

    // Start recording
    startRecognition();
  };

  const startRecognition = () => {
    setIsRecording(true);
    
    try {
      // Check browser compatibility
      const userAgent = navigator.userAgent.toLowerCase();
      const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
      const isEdge = userAgent.includes('edg');
      const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
      
      if (!isChrome && !isEdge && !isSafari) {
        setIsRecording(false);
        alert('⚠️ Speech recognition works best in Chrome or Edge.\n\nYour current browser may not support this feature. Please use:\n• Google Chrome\n• Microsoft Edge\n• Safari (on Mac)');
        return;
      }

      // Check if online
      if (!navigator.onLine) {
        setIsRecording(false);
        alert('You are offline. Speech recognition requires an internet connection.');
        return;
      }

      // Check if Speech Recognition is supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setIsRecording(false);
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      // Test internet connectivity to Google
      console.log('Testing connection to Google Speech API...');
      fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' })
        .then(() => console.log('✓ Google is reachable'))
        .catch((err) => {
          console.error('✗ Cannot reach Google:', err);
          setIsRecording(false);
          alert(
            '⚠️ Cannot reach Google servers.\n\n' +
            'Speech recognition needs internet access to Google.\n\n' +
            'Possible issues:\n' +
            '• Firewall blocking Google\n' +
            '• VPN or proxy restrictions\n' +
            '• Browser extensions blocking requests\n' +
            '• Antivirus blocking connections\n\n' +
            'Try:\n' +
            '1. Disable VPN/proxy temporarily\n' +
            '2. Disable browser extensions\n' +
            '3. Check firewall settings\n' +
            '4. Use a different network'
          );
        });

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      let finalTranscript = value; // Start with existing text

      recognition.onstart = () => {
        console.log('✓ Speech recognition started successfully');
        setIsRecording(true);
        interimTranscriptRef.current = '';
        retryCountRef.current = 0; // Reset retry count on successful start
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            // Final result - append to permanent text
            finalTranscript += (finalTranscript ? ' ' : '') + transcript;
            setValue(finalTranscript);
          } else {
            // Interim result - temporary display
            interimTranscript += transcript;
          }
        }
        
        // Update interim display
        interimTranscriptRef.current = interimTranscript;
        if (interimTranscript) {
          const displayText = finalTranscript + (finalTranscript ? ' ' : '') + interimTranscript;
          setValue(displayText);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, event);
        
        // Handle different error types
        if (event.error === 'no-speech') {
          // User didn't speak - silent fail, just stop
          console.log('No speech detected');
          setIsRecording(false);
          return;
        } else if (event.error === 'aborted') {
          // User manually stopped - expected behavior
          console.log('Recognition aborted by user');
          setIsRecording(false);
          return;
        } else if (event.error === 'audio-capture') {
          setIsRecording(false);
          alert('Microphone not detected. Please check your microphone connection and try again.');
        } else if (event.error === 'not-allowed') {
          setIsRecording(false);
          alert('Microphone access denied. Please allow microphone access in your browser settings and reload the page.');
        } else if (event.error === 'network') {
          // Network error - IMMEDIATE issue with Google Speech API
          console.error('Network error - Cannot connect to Google Speech API');
          console.log('This happens immediately, suggesting firewall/network blocking');
          
          setIsRecording(false);
          retryCountRef.current = 0;
          
          alert(
            'NETWORK ERROR: Cannot connect to Google Speech Service\n\n' +
            'WHY THIS HAPPENS:\n' +
            'Speech recognition uses Google servers. Your network/firewall is blocking the connection.\n\n' +
            'SOLUTIONS:\n' +
            '1. Disable VPN if using one\n' +
            '2. Try a different network (mobile hotspot)\n' +
            '3. Check if Google.com is accessible\n' +
            '4. Disable antivirus/firewall temporarily\n' +
            '5. Try a different browser (Chrome works best)\n' +
            '6. Disable browser extensions\n\n' +
            'ALTERNATIVE:\n' +
            'Type your question instead of speaking.'
          );
        } else if (event.error === 'service-not-allowed') {
          setIsRecording(false);
          alert('Speech recognition service is not allowed. This might be due to browser settings or extensions blocking the service.');
        } else {
          setIsRecording(false);
          alert(`Speech recognition error: ${event.error}. Please try again or type your message instead.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        interimTranscriptRef.current = '';
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsRecording(false);
      alert('Failed to start speech recognition. Please check your microphone permissions and try again.');
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
        focused || isRecording
          ? 'border-[#006EB2]/60 shadow-[0_0_0_3px_rgba(0,110,178,0.12)]'
          : 'border-border shadow-sm',
        isRecording && 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        className,
      )}
    >
      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 border border-red-500/20">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-600">Listening...</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Speak clearly • Requires internet connection
          </span>
        </div>
      )}
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
