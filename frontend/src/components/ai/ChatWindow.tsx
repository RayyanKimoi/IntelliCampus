'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './MessageBubble';
import { aiService } from '@/services/aiService';
import { useVoice } from '@/hooks/useVoice';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { Volume2, VolumeX } from 'lucide-react';
import { FaBook } from 'react-icons/fa';

interface Message {
  id: string;
  sender: 'student' | 'ai';
  text: string;
  responseType?: string;
  timestamp: Date;
}

interface ChatWindowProps {
  courseId: string;
  topicId: string;
  topicName: string;
  mode: 'learning' | 'assessment' | 'practice';
}

export function ChatWindow({ courseId, topicId, topicName, mode }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, stopSpeaking, isSpeaking } = useVoice();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string, _files?: File[]) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'student',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await aiService.chat({
        sessionId: sessionId || undefined,
        courseId,
        topicId,
        message: text.trim(),
        mode,
      });

      if (response.data) {
        if (!sessionId) {
          setSessionId(response.data.sessionId);
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: response.data.message,
          responseType: response.data.responseType,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        if (autoSpeak) {
          speak(response.data.message);
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Sorry, I encountered an error: ${error.message}`,
        responseType: 'error',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const modeLabel = mode === 'assessment' ? 'Assessment Mode (Hints Only)' :
    mode === 'practice' ? 'Practice Mode' : 'Learning Mode';

  const modeBadgeColor = mode === 'assessment' ? 'bg-warning/20 text-warning' :
    mode === 'practice' ? 'bg-primary/10 text-primary' :
    'bg-success/20 text-success';

  return (
        <Card className="flex flex-col h-full overflow-hidden border-0 bg-card">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <CardHeader
        className="border-b border-border pb-3 shrink-0"
        style={{ background: 'linear-gradient(180deg, rgba(0,110,178,0.06) 0%, transparent 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg,#002F4C,#006EB2)' }}
            >
              <FaBook className="h-3.5 w-3.5 text-white" />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">{topicName}</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              title={autoSpeak ? 'Auto-speak on (click to disable)' : 'Auto-speak off (click to enable)'}
              onClick={() => { if (isSpeaking) stopSpeaking(); setAutoSpeak(v => !v); }}
            >
              {autoSpeak
                ? <Volume2 className="h-4 w-4 text-[#006EB2]" />
                : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>

            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${modeBadgeColor}`}
            >
              {modeLabel}
            </span>
          </div>
        </div>
      </CardHeader>

      {/* ── Messages area ───────────────────────────────────────────────── */}
      <CardContent
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,110,178,0.18) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0',
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg,rgba(0,47,76,0.08),rgba(0,110,178,0.12))' }}
            >
              <FaBook className="h-7 w-7 text-[#006EB2]/60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Ask about {topicName}</p>
              <p className="text-xs mt-1 text-slate-400">
                {mode === 'assessment'
                  ? 'I can only provide hints during assessments'
                  : "I'll explain using only your curriculum materials"}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onSpeak={msg.sender === 'ai' ? () => speak(msg.text) : undefined}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5 px-1">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg,#002F4C,#006EB2)' }}
            >
              <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            </div>
            <div className="flex gap-1 items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-[#006EB2]/50 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#006EB2]/50 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#006EB2]/50 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* ── Prompt input ────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border p-3">
        <PromptInputBox
          onSend={sendMessage}
          isLoading={isLoading}
          placeholder={
            mode === 'assessment'
              ? 'Ask for a hint…'
              : 'Ask anything about your curriculum…'
          }
          disabled={false}
        />
      </div>
    </Card>
  );
}
