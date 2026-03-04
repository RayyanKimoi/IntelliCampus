'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teacherService } from '@/services/teacherService';
import {
  ShieldAlert, AlertTriangle, Zap, Clock, ChevronDown,
  ChevronUp, Loader2, AlertCircle, Filter, User,
} from 'lucide-react';
import { MOCK_INTEGRITY_FLAGS } from '@/lib/mockData';

// ───────────────────────────── Types
interface IntegrityFlag {
  attemptId: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignmentId: string;
  assignmentTitle: string;
  avgTimeSec: number;
  correctRate: number;
  totalQuestions: number;
  flags: string[];
  createdAt: string;
}

// ───────────────────────────── Helpers
type Severity = 'high' | 'medium' | 'low';

function getSeverity(flag: IntegrityFlag): Severity {
  if (flag.flags.includes('high_anomaly')) return 'high';
  if (flag.flags.includes('rapid_guessing') && flag.avgTimeSec < 3) return 'high';
  if (flag.flags.includes('rapid_guessing')) return 'medium';
  return 'low';
}

function SeverityBadge({ sev }: { sev: Severity }) {
  const styles: Record<Severity, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[sev]}`}>
      {sev}
    </span>
  );
}

function FlagBadge({ flag }: { flag: string }) {
  if (flag === 'rapid_guessing')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
        <Zap className="w-3 h-3" /> Rapid Guessing
      </span>
    );
  if (flag === 'high_anomaly')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
        <AlertTriangle className="w-3 h-3" /> High Anomaly
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
      {flag}
    </span>
  );
}

// ───────────────────────────── Page
export default function IntegrityPage() {
  const [flags, setFlags] = useState<IntegrityFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | Severity>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await teacherService.getIntegrityFlags();
      const data = result ?? [];
      setFlags(data.length > 0 ? data : (MOCK_INTEGRITY_FLAGS as any[]));
    } catch {
      setFlags(MOCK_INTEGRITY_FLAGS as any[]);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Enhance with severity
  const enriched = flags.map(f => ({ ...f, severity: getSeverity(f) }));
  const filtered = filterSeverity === 'all' ? enriched : enriched.filter(f => f.severity === filterSeverity);

  const highCount = enriched.filter(f => f.severity === 'high').length;
  const medCount = enriched.filter(f => f.severity === 'medium').length;
  const lowCount = enriched.filter(f => f.severity === 'low').length;

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrity & Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">
            Flagged attempts with suspicious timing patterns — rapid guessing and statistical anomalies.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'High Risk', value: highCount, colour: 'text-red-600', bg: 'bg-red-50 border-red-200' },
            { label: 'Medium Risk', value: medCount, colour: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
            { label: 'Low Risk', value: lowCount, colour: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
          ].map(stat => (
            <div key={stat.label} className={`border rounded-xl p-4 text-center ${stat.bg}`}>
              <p className={`text-2xl font-bold ${stat.colour}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          {(['all', 'high', 'medium', 'low'] as const).map(s => (
            <button key={s} onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${filterSeverity === s ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} flagged attempt{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No integrity flags found.</p>
            <p className="text-sm mt-1">All submissions look clean 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(flag => (
              <div key={flag.attemptId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{flag.userName}</p>
                    <p className="text-xs text-gray-500 truncate">{flag.assignmentTitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SeverityBadge sev={flag.severity} />
                    <div className="flex gap-1 flex-wrap">
                      {flag.flags.map(f => <FlagBadge key={f} flag={f} />)}
                    </div>
                    <button onClick={() => setExpandedId(expandedId === flag.attemptId ? null : flag.attemptId)}
                      className="text-gray-400 hover:text-gray-700">
                      {expandedId === flag.attemptId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedId === flag.attemptId && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs">Avg Time/Question</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{flag.avgTimeSec}s</p>
                        {flag.avgTimeSec < 5 && <p className="text-xs text-red-500 mt-0.5">Below 5s threshold</p>}
                      </div>
                      <div className="bg-white border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-xs">Correct Rate</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{flag.correctRate}%</p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Total Questions</p>
                        <p className="text-xl font-bold text-gray-900">{flag.totalQuestions}</p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Submitted</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(flag.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {flag.userEmail}
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="font-medium">Attempt ID:</span>
                      <code className="text-xs bg-gray-200 px-1 rounded">{flag.attemptId}</code>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
