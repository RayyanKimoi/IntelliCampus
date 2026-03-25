'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIntegrityMonitor, ViolationType } from '@/hooks/useIntegrityMonitor';
import { api } from '@/services/apiClient';
import {
  Shield,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Eye,
  Copy,
  Maximize,
  MonitorX,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Violation type labels ─────────────────────────────────────────

const VIOLATION_LABELS: Record<ViolationType, string> = {
  fullscreen_exit: 'Left fullscreen mode',
  tab_switch: 'Switched browser tab',
  window_blur: 'Switched window focus',
  copy_paste: 'Copy/paste attempt detected',
  keyboard_shortcut: 'Restricted keyboard shortcut',
  context_menu: 'Right-click menu blocked',
  devtools: 'Developer tools detected',
};

// ─── Integrity Rules Modal ─────────────────────────────────────────

function IntegrityRulesModal({
  onAccept,
  onCancel,
}: {
  onAccept: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Integrity Mode</h2>
              <p className="text-sm opacity-90">This assessment requires integrity monitoring</p>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            To maintain academic integrity, the following restrictions will be enforced during this
            assessment:
          </p>

          <div className="space-y-3">
            <RuleItem icon={Maximize} text="Do not leave fullscreen mode" />
            <RuleItem icon={Eye} text="Do not switch browser tabs" />
            <RuleItem icon={MonitorX} text="Do not switch to other windows" />
            <RuleItem icon={Copy} text="Do not copy or paste content" />
            <RuleItem icon={ShieldAlert} text="Do not open developer tools" />
          </div>

          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-700 dark:text-red-400">Violation Policy</p>
                <p className="text-red-600 dark:text-red-400/80 mt-1">
                  First violation → Warning notification
                  <br />
                  Second violation → Automatic assessment rejection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t px-6 py-4 bg-muted/20 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onAccept}
            className="bg-amber-600 hover:bg-amber-700 gap-2"
          >
            <Shield className="h-4 w-4" />
            Start Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}

function RuleItem({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 border border-border/60 px-4 py-2.5">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// ─── Warning Modal ─────────────────────────────────────────────────

function ViolationWarningModal({
  violationType,
  violations,
  maxViolations,
  onDismiss,
}: {
  violationType: ViolationType | null;
  violations: number;
  maxViolations: number;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Integrity Violation</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm">
            You attempted a restricted action
            {violationType ? `: ${VIOLATION_LABELS[violationType]}` : ''}.
          </p>

          <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Violations
            </span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
              {violations} / {maxViolations}
            </span>
          </div>

          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            Next violation will automatically terminate your assessment.
          </p>
        </div>

        <div className="border-t px-6 py-4 bg-muted/20 flex justify-end">
          <Button onClick={onDismiss} className="gap-2">
            Continue Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Termination Modal ─────────────────────────────────────────────

function TerminationModal({
  redirectPath,
}: {
  redirectPath: string;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-red-600 to-red-500 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <ShieldX className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Assessment Terminated</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm">
            Your assessment was automatically rejected due to multiple integrity violations.
          </p>

          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
              Assessment rejected due to integrity violations.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            If you believe this was an error, please contact your instructor.
          </p>
        </div>

        <div className="border-t px-6 py-4 bg-muted/20 flex justify-end">
          <Button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
              }
              router.push(redirectPath);
            }}
            variant="destructive"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── IntegrityGuard Component ──────────────────────────────────────

interface IntegrityGuardProps {
  children: React.ReactNode;
  /** The attempt ID to track violations against */
  attemptId: string | null;
  /** Type of assessment for redirect path */
  assessmentType: 'assignment' | 'quiz';
  /** Whether to show the rules modal before starting */
  showRulesFirst?: boolean;
  /** Called when integrity mode activates (after user accepts rules) */
  onActivate?: () => void;
  /** Called when the attempt is terminated */
  onTerminate?: () => void;
  /** Custom redirect path on termination (default derived from assessmentType) */
  redirectPath?: string;
  /** Set to true to enable integrity monitoring. When showRulesFirst=true, enabling shows the rules modal first. */
  enabled?: boolean;
}

export function IntegrityGuard({
  children,
  attemptId,
  assessmentType,
  showRulesFirst = true,
  onActivate,
  onTerminate: onTerminateProp,
  redirectPath,
  enabled = true,
}: IntegrityGuardProps) {
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);

  const defaultRedirect =
    assessmentType === 'quiz'
      ? '/student/assessment/quizzes'
      : '/student/assignments';

  const finalRedirectPath = redirectPath ?? defaultRedirect;

  // Use a ref to track attemptId for async callbacks
  const attemptIdRef = React.useRef(attemptId);
  attemptIdRef.current = attemptId;

  const handleViolation = useCallback(
    async (type: ViolationType, count: number) => {
      const id = attemptIdRef.current;
      if (id) {
        try {
          await api.post(`/student/attempts/${id}/violation`, { type, count });
        } catch {
          // Non-critical
        }
      }
    },
    [],
  );

  const handleTerminate = useCallback(async () => {
    const id = attemptIdRef.current;
    if (id) {
      try {
        await api.post(`/student/attempts/${id}/reject`, {
          reason: 'integrity_violation',
        });
      } catch {
        // Non-critical
      }
    }
    onTerminateProp?.();
  }, [onTerminateProp]);

  const { state, dismissWarning } = useIntegrityMonitor({
    active: monitoringActive,
    maxViolations: 2,
    onViolation: handleViolation,
    onTerminate: handleTerminate,
  });

  // When enabled becomes true, show rules or start monitoring
  useEffect(() => {
    if (!enabled) return;
    if (showRulesFirst && !monitoringActive) {
      setShowRulesModal(true);
    } else if (!showRulesFirst) {
      setMonitoringActive(true);
    }
  }, [enabled]);

  const handleAcceptRules = useCallback(() => {
    setShowRulesModal(false);
    setMonitoringActive(true);
    onActivate?.();
  }, [onActivate]);

  const handleCancelRules = useCallback(() => {
    setShowRulesModal(false);
  }, []);

  return (
    <>
      {children}

      {/* Rules modal */}
      {showRulesModal && (
        <IntegrityRulesModal
          onAccept={handleAcceptRules}
          onCancel={handleCancelRules}
        />
      )}

      {/* Warning modal */}
      {state.showWarning && (
        <ViolationWarningModal
          violationType={state.lastViolationType}
          violations={state.violations}
          maxViolations={state.maxViolations}
          onDismiss={dismissWarning}
        />
      )}

      {/* Termination modal */}
      {state.showTermination && (
        <TerminationModal redirectPath={finalRedirectPath} />
      )}
    </>
  );
}

export default IntegrityGuard;
