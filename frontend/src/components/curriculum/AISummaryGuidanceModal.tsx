'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Lightbulb, BrainCircuit } from 'lucide-react';

interface AISummaryGuidanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialNotes?: string;
  chapterName?: string;
  onSave: (notes: string) => Promise<void>;
}

export function AISummaryGuidanceModal({
  open,
  onOpenChange,
  initialNotes = '',
  chapterName,
  onSave,
}: AISummaryGuidanceModalProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync notes when modal re-opens with new initial value
  useEffect(() => {
    if (open) {
      setNotes(initialNotes);
      setSaved(false);
    }
  }, [open, initialNotes]);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSave(notes.trim());
      setSaved(true);
      setTimeout(() => onOpenChange(false), 800);
    } catch (err: any) {
      alert(err?.message || 'Failed to save notes');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <DialogTitle className="text-lg font-bold">AI Summary Guidance</DialogTitle>
          </div>
          <DialogDescription>
            Write key points that the AI should emphasise when generating summaries for students studying{' '}
            {chapterName ? <strong>{chapterName}</strong> : 'this chapter'}.
          </DialogDescription>
        </DialogHeader>

        {/* Context hint */}
        <div className="flex items-start gap-2.5 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-3.5 py-3 text-sm text-violet-800 dark:text-violet-300">
          <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-violet-500" />
          <p>
            These notes are fed into the RAG pipeline so the AI gives students focused, relevant summaries aligned with your teaching goals — not generic textbook content.
          </p>
        </div>

        {/* Notes textarea */}
        <div className="space-y-1.5">
          <Label htmlFor="teacher-notes" className="text-sm font-medium">
            Important Points
          </Label>
          <Textarea
            id="teacher-notes"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
            placeholder={`• Focus on the difference between arrays and linked lists\n• Highlight time complexity differences\n• Include insertion and deletion examples\n• Emphasise real-world use cases`}
            rows={8}
            className="resize-none font-mono text-sm leading-relaxed"
          />
          <p className="text-xs text-muted-foreground text-right">{notes.length} characters</p>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-2"
            onClick={handleSave}
            disabled={submitting}
          >
            {saved ? (
              <>✓ Saved</>
            ) : submitting ? (
              'Saving...'
            ) : (
              <>
                <BrainCircuit className="h-4 w-4" />
                Save Guidance
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
