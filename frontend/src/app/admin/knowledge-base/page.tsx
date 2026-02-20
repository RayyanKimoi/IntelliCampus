'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Database, Upload, FileText, Search, Trash2, RefreshCw,
  CheckCircle2, AlertTriangle, Clock, Cpu, BookOpen, Layers,
} from 'lucide-react';

interface KBDocument {
  id: string;
  title: string;
  subject: string;
  chunks: number;
  status: 'indexed' | 'processing' | 'failed';
  uploadedAt: string;
  sizeKb: number;
}

const MOCK_DOCS: KBDocument[] = [
  { id: '1', title: 'Sorting Algorithms – Lecture Notes', subject: 'Algorithms', chunks: 24, status: 'indexed', uploadedAt: '2026-02-10', sizeKb: 142 },
  { id: '2', title: 'OOP Design Patterns', subject: 'OOP', chunks: 31, status: 'indexed', uploadedAt: '2026-02-12', sizeKb: 210 },
  { id: '3', title: 'Graph Theory Reference', subject: 'Mathematics', chunks: 18, status: 'indexed', uploadedAt: '2026-02-14', sizeKb: 98 },
  { id: '4', title: 'Data Structures Compendium', subject: 'CS101', chunks: 0, status: 'processing', uploadedAt: '2026-02-19', sizeKb: 330 },
  { id: '5', title: 'Network Protocols Guide', subject: 'Networking', chunks: 0, status: 'failed', uploadedAt: '2026-02-18', sizeKb: 56 },
  { id: '6', title: 'Discrete Mathematics Workbook', subject: 'Mathematics', chunks: 45, status: 'indexed', uploadedAt: '2026-02-08', sizeKb: 275 },
  { id: '7', title: 'REST API Best Practices', subject: 'Web Dev', chunks: 12, status: 'indexed', uploadedAt: '2026-02-15', sizeKb: 74 },
];

const STATUS_META = {
  indexed:    { label: 'Indexed',    color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',  icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  processing: { label: 'Processing', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',  icon: <Clock className="h-3.5 w-3.5 animate-spin" /> },
  failed:     { label: 'Failed',     color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',          icon: <AlertTriangle className="h-3.5 w-3.5" /> },
};

export default function AdminKnowledgeBasePage() {
  const [docs, setDocs] = useState<KBDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setDocs(MOCK_DOCS);
      setLoading(false);
    }, 600);
  }, []);

  const filtered = search
    ? docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.subject.toLowerCase().includes(search.toLowerCase()))
    : docs;

  const indexed = docs.filter(d => d.status === 'indexed');
  const totalChunks = indexed.reduce((s, d) => s + d.chunks, 0);
  const totalSizeMb = (docs.reduce((s, d) => s + d.sizeKb, 0) / 1024).toFixed(1);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
            <p className="text-muted-foreground">Manage AI training documents and vector store embeddings.</p>
          </div>
          <Button className="w-fit">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <FileText className="h-4 w-4 text-primary" />, label: 'Total Documents', value: loading ? '—' : docs.length, sub: 'uploaded files' },
            { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'Indexed', value: loading ? '—' : indexed.length, sub: 'ready for AI retrieval' },
            { icon: <Layers className="h-4 w-4 text-violet-500" />, label: 'Total Chunks', value: loading ? '—' : totalChunks.toLocaleString(), sub: 'vector embeddings' },
            { icon: <Database className="h-4 w-4 text-amber-500" />, label: 'Storage Used', value: loading ? '—' : `${totalSizeMb} MB`, sub: 'raw document size' },
          ].map(({ icon, label, value, sub }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                {icon}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Vector Store Health */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Vector Store Status
              </CardTitle>
              <CardDescription>Pinecone index health and embedding coverage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: 'Index Fill Rate',        value: 78, color: '[&>*]:bg-primary' },
                { label: 'Embedding Coverage',     value: 91, color: '[&>*]:bg-green-500' },
                { label: 'Query Latency (p95)',     value: 62, color: '[&>*]:bg-amber-500', suffix: '  ~240ms' },
                { label: 'Retrieval Accuracy',      value: 88, color: '[&>*]:bg-violet-500' },
              ].map(({ label, value, color, suffix }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold tabular-nums">{value}%{suffix ?? ''}</span>
                  </div>
                  <Progress value={value} className={`h-2 ${color}`} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                By Subject
              </CardTitle>
              <CardDescription>Document count per subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
              ) : (
                Object.entries(
                  docs.reduce<Record<string, number>>((acc, d) => {
                    acc[d.subject] = (acc[d.subject] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([subject, count]) => (
                  <div key={subject} className="flex items-center justify-between">
                    <span className="text-sm">{subject}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Document table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Document Library</CardTitle>
                <CardDescription>All uploaded curriculum documents</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search documents..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No documents found.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map(doc => {
                  const s = STATUS_META[doc.status];
                  return (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.subject} · {doc.sizeKb} KB · {doc.uploadedAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={`flex items-center gap-1 text-xs ${s.color}`}>
                          {s.icon}{s.label}
                        </Badge>
                        {doc.status === 'indexed' && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">{doc.chunks} chunks</span>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
