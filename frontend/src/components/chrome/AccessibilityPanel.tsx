'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAccessibility } from '@/hooks/useAccessibility';
import { Accessibility, Type, Eye, Focus, Layers, ZoomIn } from 'lucide-react';

const FONT_SIZES = [
  { label: 'Normal (100%)', value: 1.0 },
  { label: 'Large (110%)',  value: 1.1 },
  { label: 'XL (125%)',     value: 1.25 },
  { label: 'XXL (150%)',    value: 1.5 },
];

const TOGGLES = [
  {
    key: 'adhdMode'     as const,
    icon: <Layers className="h-3.5 w-3.5" />,
    label: 'Simple UI',
    desc: 'Flat, decluttered layout',
  },
  {
    key: 'dyslexiaFont' as const,
    icon: <Type className="h-3.5 w-3.5" />,
    label: 'Dyslexia Font',
    desc: 'Cascadia Mono typeface',
  },
  {
    key: 'highContrast' as const,
    icon: <Eye className="h-3.5 w-3.5" />,
    label: 'High Contrast',
    desc: 'Enhanced for colour blindness',
  },
  {
    key: 'focusMode'    as const,
    icon: <Focus className="h-3.5 w-3.5" />,
    label: 'Focus Mode',
    desc: 'Collapse sidebar, hide distractions',
  },
];

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const { settings, updateSetting } = useAccessibility();
  const panelRef   = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const anyActive =
    (settings?.adhdMode || settings?.dyslexiaFont || settings?.highContrast ||
     settings?.focusMode || (settings?.fontScale ?? 1) !== 1);

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        variant={open ? 'secondary' : 'ghost'}
        size="icon"
        className={`h-8 w-8 relative ${anyActive ? 'text-primary' : ''}`}
        aria-label="Accessibility options"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Accessibility className="h-4 w-4" />
        {anyActive && (
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary" />
        )}
      </Button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility settings"
          className="absolute right-0 top-10 z-[99] w-72 rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
            <Accessibility className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Accessibility</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Font Size */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <ZoomIn className="h-3.5 w-3.5" />
                Font Size
              </Label>
              <select
                value={settings?.fontScale ?? 1.0}
                onChange={(e) => updateSetting('fontScale', parseFloat(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {FONT_SIZES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Separator />

            {/* Toggle rows */}
            <div className="space-y-3">
              {TOGGLES.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      {row.icon}
                      {row.label}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{row.desc}</p>
                  </div>
                  <Switch
                    checked={settings?.[row.key] ?? false}
                    onCheckedChange={(v) => updateSetting(row.key, v)}
                    className="shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
