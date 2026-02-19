'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, Volume2 } from 'lucide-react';

interface MessageBubbleProps {
  message: {
    sender: 'student' | 'ai';
    text: string;
    responseType?: string;
    timestamp: Date;
  };
  onSpeak?: () => void;
}

export function MessageBubble({ message, onSpeak }: MessageBubbleProps) {
  const isAI = message.sender === 'ai';

  return (
    <div className={cn('flex gap-3', isAI ? 'justify-start' : 'justify-end')}>
      {isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3',
          isAI
            ? 'bg-muted text-foreground'
            : 'bg-primary text-primary-foreground',
          message.responseType === 'hint' && 'border-l-4 border-warning',
          message.responseType === 'restricted' && 'border-l-4 border-destructive'
        )}
      >
        {message.responseType === 'hint' && (
          <span className="text-xs font-medium text-warning block mb-1">
            Hint Mode
          </span>
        )}
        {message.responseType === 'restricted' && (
          <span className="text-xs font-medium text-destructive block mb-1">
            Restricted - Assessment Active
          </span>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <div className="flex items-center justify-between mt-1">
          <span className={cn(
            'text-[10px]',
            isAI ? 'text-muted-foreground' : 'text-primary-foreground/70'
          )}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isAI && onSpeak && (
            <button
              onClick={onSpeak}
              className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
              title="Read aloud"
              type="button"
            >
              <Volume2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {!isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
