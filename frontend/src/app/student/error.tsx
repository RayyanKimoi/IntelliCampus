'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Student section error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="mb-2 text-xl font-bold">Something went wrong</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          We couldn&apos;t load this page. Please try again.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => (window.location.href = '/student')}>
            Dashboard
          </Button>
          <Button onClick={reset}>Retry</Button>
        </div>
      </div>
    </div>
  );
}
