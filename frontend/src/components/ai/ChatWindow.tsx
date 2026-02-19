'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from './MessageBubble';
import { VoiceInput } from './VoiceInput';
import { aiService } from '@/services/aiService';
import { useVoice } from '@/hooks/useVoice';
import { Send, Loader2, BookOpen, Volume2, VolumeX } from 'lucide-react';

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
  const [input, setInput] = useState('');
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

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'student',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleVoiceResult = (text: string) => {
    sendMessage(text);
  };

  const modeLabel = mode === 'assessment' ? 'Assessment Mode (Hints Only)' :
    mode === 'practice' ? 'Practice Mode' : 'Learning Mode';

  const modeBadgeColor = mode === 'assessment' ? 'bg-warning/20 text-warning' :
    mode === 'practice' ? 'bg-primary/10 text-primary' :
    'bg-success/20 text-success';

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{topicName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={autoSpeak ? 'Auto-speak on (click to disable)' : 'Auto-speak off (click to enable)'}
              onClick={() => { if (isSpeaking) stopSpeaking(); setAutoSpeak(v => !v); }}
            >
              {autoSpeak ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <span className={`text-xs px-2 py-1 rounded-full ${modeBadgeColor}`}>
              {modeLabel}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Ask a question about {topicName}</p>
            <p className="text-xs mt-1">
              {mode === 'assessment'
                ? 'I can only provide hints during assessments'
                : 'I will explain using your curriculum materials'}
            </p>
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <VoiceInput onResult={handleVoiceResult} />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'assessment'
                ? 'Ask for a hint...'
                : 'Ask a question...'
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
