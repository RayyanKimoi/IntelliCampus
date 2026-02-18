'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useVoice } from '@/hooks/useVoice';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onResult: (text: string) => void;
}

export function VoiceInput({ onResult }: VoiceInputProps) {
  const { isListening, isSupported, startListening, stopListening } = useVoice({
    onResult,
  });

  if (!isSupported) return null;

  return (
    <Button
      type="button"
      size="icon"
      variant={isListening ? 'destructive' : 'outline'}
      onClick={isListening ? stopListening : startListening}
      className={cn(isListening && 'animate-pulse-glow')}
      title={isListening ? 'Stop listening' : 'Start voice input'}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
