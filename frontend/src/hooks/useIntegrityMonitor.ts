'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type ViolationType =
  | 'fullscreen_exit'
  | 'tab_switch'
  | 'window_blur'
  | 'copy_paste'
  | 'keyboard_shortcut'
  | 'context_menu'
  | 'devtools';

export interface IntegrityState {
  violations: number;
  maxViolations: number;
  isActive: boolean;
  isTerminated: boolean;
  lastViolationType: ViolationType | null;
  showWarning: boolean;
  showTermination: boolean;
}

interface UseIntegrityMonitorOptions {
  /** When true, event listeners are registered and monitoring is active */
  active: boolean;
  maxViolations?: number;
  onViolation?: (type: ViolationType, count: number) => void;
  onTerminate?: () => void;
  /** Set false to skip fullscreen request */
  requestFullscreen?: boolean;
}

export function useIntegrityMonitor(options: UseIntegrityMonitorOptions) {
  const {
    active,
    maxViolations = 2,
    onViolation,
    onTerminate,
    requestFullscreen = true,
  } = options;

  const [state, setState] = useState<IntegrityState>({
    violations: 0,
    maxViolations,
    isActive: false,
    isTerminated: false,
    lastViolationType: null,
    showWarning: false,
    showTermination: false,
  });

  const violationCountRef = useRef(0);
  const terminatedRef = useRef(false);
  // Debounce rapid-fire events (e.g. blur + visibilitychange firing together)
  const lastViolationTime = useRef(0);
  // Stable callback refs to avoid re-registering listeners
  const onViolationRef = useRef(onViolation);
  const onTerminateRef = useRef(onTerminate);
  onViolationRef.current = onViolation;
  onTerminateRef.current = onTerminate;

  const dismissWarning = useCallback(() => {
    setState((prev) => ({ ...prev, showWarning: false }));
    // Re-enter fullscreen after warning dismissal
    if (requestFullscreen && document.fullscreenElement === null) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, [requestFullscreen]);

  // Register all event listeners when active
  useEffect(() => {
    if (!active) return;

    // Reset state when activating
    violationCountRef.current = 0;
    terminatedRef.current = false;
    setState({
      violations: 0,
      maxViolations,
      isActive: true,
      isTerminated: false,
      lastViolationType: null,
      showWarning: false,
      showTermination: false,
    });

    // Enter fullscreen
    if (requestFullscreen) {
      document.documentElement.requestFullscreen?.().catch(() => {
        console.warn('[IntegrityMonitor] Fullscreen request denied');
      });
    }

    function triggerViolation(type: ViolationType) {
      if (terminatedRef.current) return;

      // Debounce: ignore violations within 1s of each other
      const now = Date.now();
      if (now - lastViolationTime.current < 1000) return;
      lastViolationTime.current = now;

      violationCountRef.current += 1;
      const count = violationCountRef.current;

      onViolationRef.current?.(type, count);

      if (count >= maxViolations) {
        terminatedRef.current = true;
        setState((prev) => ({
          ...prev,
          violations: count,
          lastViolationType: type,
          isTerminated: true,
          showWarning: false,
          showTermination: true,
        }));
        onTerminateRef.current?.();
      } else {
        setState((prev) => ({
          ...prev,
          violations: count,
          lastViolationType: type,
          showWarning: true,
        }));
      }
    }

    // ── Fullscreen change ──────────────────────────────
    function handleFullscreenChange() {
      if (terminatedRef.current) return;
      if (document.fullscreenElement === null) {
        triggerViolation('fullscreen_exit');
      }
    }

    // ── Tab visibility ─────────────────────────────────
    function handleVisibilityChange() {
      if (terminatedRef.current) return;
      if (document.hidden) {
        triggerViolation('tab_switch');
      }
    }

    // ── Window blur ────────────────────────────────────
    function handleWindowBlur() {
      if (terminatedRef.current) return;
      triggerViolation('window_blur');
    }

    // ── Keyboard shortcuts ─────────────────────────────
    function handleKeydown(e: KeyboardEvent) {
      if (terminatedRef.current) return;

      // Block copy/paste/cut shortcuts
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'c' || key === 'v' || key === 'x') {
          // Allow inside Monaco editor (code submissions)
          const target = e.target as HTMLElement;
          if (target.closest('.monaco-editor')) return;

          e.preventDefault();
          triggerViolation('copy_paste');
          return;
        }

        // Block other cheat shortcuts: Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
          (e.shiftKey && (key === 'i' || key === 'j')) ||
          key === 'u'
        ) {
          e.preventDefault();
          triggerViolation('keyboard_shortcut');
          return;
        }
      }

      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolation('devtools');
      }
    }

    // ── Context menu ───────────────────────────────────
    function handleContextMenu(e: MouseEvent) {
      if (terminatedRef.current) return;
      // Allow context menu inside Monaco editor
      const target = e.target as HTMLElement;
      if (target.closest('.monaco-editor')) return;
      e.preventDefault();
      triggerViolation('context_menu');
    }

    // ── DevTools detection via size threshold ──────────
    const DEVTOOLS_THRESHOLD = 160;
    function checkDevTools() {
      if (terminatedRef.current) return;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > DEVTOOLS_THRESHOLD || heightDiff > DEVTOOLS_THRESHOLD) {
        triggerViolation('devtools');
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    const devtoolsTimer = setInterval(checkDevTools, 2000);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('keydown', handleKeydown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      clearInterval(devtoolsTimer);

      // Exit fullscreen on cleanup
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }

      setState((prev) => ({ ...prev, isActive: false }));
    };
  }, [active, maxViolations, requestFullscreen]);

  return {
    state,
    dismissWarning,
  };
}
