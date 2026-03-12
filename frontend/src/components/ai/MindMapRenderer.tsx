'use client';

import { useEffect, useRef, useState } from 'react';

interface MindMapRendererProps {
  chart: string;
}

let idCounter = 0;

export function MindMapRenderer({ chart }: MindMapRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef<string>(`mindmap-${++idCounter}`);

  useEffect(() => {
    if (!containerRef.current || !chart) return;

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;

        const isDark = document.documentElement.classList.contains('dark');

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'base',
          themeVariables: {
            primaryColor: '#2563eb',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#1e40af',
            lineColor: '#3b82f6',
            fontSize: '14px',
          },
          mindmap: {
            padding: 20,
          },
        });

        // mermaid.render requires a unique id each time
        const uid = `${idRef.current}-${Date.now()}`;
        const { svg } = await mermaid.render(uid, chart);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Make SVG responsive
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
          }
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('MindMapRenderer error:', err);
          setError('Failed to render mind map diagram.');
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mindmap-container overflow-x-auto"
      style={{ minHeight: '120px' }}
    />
  );
}
