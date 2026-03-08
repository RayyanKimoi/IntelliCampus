'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { chapterCurriculumService, ChapterContent } from '@/services/chapterCurriculumService';
import { FileCard } from '@/components/curriculum/FileCard';
import { YouTubeCard } from '@/components/curriculum/YouTubeCard';
import { UploadModal } from '@/components/curriculum/UploadModal';
import { AISummaryGuidanceModal } from '@/components/curriculum/AISummaryGuidanceModal';
import { ChevronLeft, Upload, FileCheck, Sparkles, FileText, Video } from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';

export default function ChapterContentPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const chapterId = params.chapterId as string;

  const [content, setContent] = useState<ChapterContent[]>([]);
  const [chapterName, setChapterName] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal visibility
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalTab, setUploadModalTab] = useState<'file' | 'youtube'>('file');
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ChapterContent | null>(null);

  // Edit form
  const [editTitle, setEditTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Data loading ────────────────────────────────────────────────
  const loadContent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await chapterCurriculumService.getChapterContent(chapterId);
      setContent(data.content);
      setChapterName(data.chapterName);
      setTeacherNotes(data.teacherNotes || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // ── Upload handler (file) ────────────────────────────────────────
  const handleUploadFile = async (file: File, title: string) => {
    // Determine type from MIME
    const getType = (mimeType: string) => {
      if (mimeType.includes('pdf')) return 'pdf';
      if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
      if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'ppt';
      if (mimeType.includes('image')) return 'image';
      return 'pdf';
    };

    const newContent = await chapterCurriculumService.uploadFile({
      chapterId,
      title,
      fileUrl: `/uploads/${Date.now()}_${file.name}`,
      fileType: file.type,
      fileSize: file.size,
      type: getType(file.type),
    });

    // Optimistic update → prepend to list
    setContent((prev) => [newContent, ...prev]);
  };

  // ── Upload handler (YouTube) ─────────────────────────────────────
  const handleAddYouTube = async (youtubeUrl: string, title: string) => {
    const newContent = await chapterCurriculumService.addYoutubeVideo({
      chapterId,
      title,
      youtubeUrl,
    });
    setContent((prev) => [newContent, ...prev]);
  };

  // ── Teacher notes handler ────────────────────────────────────────
  const handleSaveNotes = async (notes: string) => {
    const result = await chapterCurriculumService.saveTeacherNotes(chapterId, notes);
    setTeacherNotes(result.teacherNotes);
  };

  // ── Edit content ─────────────────────────────────────────────────
  const handleUpdateContent = async () => {
    if (!selectedContent || !editTitle.trim()) return;
    setSubmitting(true);
    try {
      await chapterCurriculumService.updateContent(chapterId, selectedContent.id, { title: editTitle });
      setContent((prev) =>
        prev.map((item) =>
          item.id === selectedContent.id ? { ...item, title: editTitle } : item
        )
      );
      setShowEditModal(false);
      setSelectedContent(null);
      setEditTitle('');
    } catch (err: any) {
      alert(err?.message || 'Failed to update content');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete content ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedContent) return;
    setSubmitting(true);
    try {
      await chapterCurriculumService.deleteContent(chapterId, selectedContent.id);
      setContent((prev) => prev.filter((item) => item.id !== selectedContent.id));
      setShowDeleteModal(false);
      setSelectedContent(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete content');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (item: ChapterContent) => {
    setSelectedContent(item);
    setEditTitle(item.title);
    setShowEditModal(true);
  };

  const openDeleteModal = (item: ChapterContent) => {
    setSelectedContent(item);
    setShowDeleteModal(true);
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/teacher/curriculum/${courseId}`)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{chapterName || 'Chapter Content'}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Upload and manage learning materials for this chapter
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-900/20"
              onClick={() => setShowGuidanceModal(true)}
            >
              <Sparkles className="h-4 w-4" />
              AI Summary Guidance
              {teacherNotes && (
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 ml-0.5" />
              )}
            </Button>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────── */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="documents" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-full max-w-sm grid-cols-2 bg-muted dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl p-1 shadow-sm">
                <TabsTrigger
                  value="documents"
                  className="gap-2 rounded-lg font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-foreground dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground dark:text-slate-400 transition-all"
                >
                  <FileText className="h-4 w-4" />
                  Document Uploads
                </TabsTrigger>
                <TabsTrigger
                  value="videos"
                  className="gap-2 rounded-lg font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-foreground dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground dark:text-slate-400 transition-all"
                >
                  <FaYoutube className="h-4 w-4 text-red-500" />
                  Video Uploads
                </TabsTrigger>
              </TabsList>

              <Button onClick={() => setShowUploadModal(true)} className="gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
                <Upload className="h-4 w-4" />
                Upload New Content
              </Button>
            </div>

            <TabsContent value="documents" className="space-y-6 outline-none">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Documents</h2>
              </div>

              {content.filter((c) => c.type !== 'youtube').length === 0 ? (
                <Card className="text-center py-16 border-border dark:border-slate-800 bg-background/50 dark:bg-slate-900/50 shadow-sm border-dashed">
                  <CardContent>
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <FileCheck className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-base font-semibold mb-1">No documents uploaded</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                      Add PDFs, Word docs, PowerPoint slides, or images using the Upload New Content button above.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <motion.div
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  initial="hidden" animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                >
                  <AnimatePresence mode="popLayout">
                    {content.filter((c) => c.type !== 'youtube').map((item) => (
                      <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} transition={{ duration: 0.2 }}>
                        <FileCard item={item} onEdit={openEditModal} onDelete={openDeleteModal} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="videos" className="space-y-6 outline-none">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Videos</h2>
              </div>

              {content.filter((c) => c.type === 'youtube').length === 0 ? (
                <Card className="text-center py-16 border-border dark:border-slate-800 bg-background/50 dark:bg-slate-900/50 shadow-sm border-dashed">
                  <CardContent>
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                      <Video className="h-6 w-6 text-red-500 dark:text-red-400" />
                    </div>
                    <h3 className="text-base font-semibold mb-1">No videos added</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                      Paste a YouTube link to share lecture recordings or supplemental videos using the Upload New Content button above.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <motion.div
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  initial="hidden" animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                >
                  <AnimatePresence mode="popLayout">
                    {content.filter((c) => c.type === 'youtube').map((item) => (
                      <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} transition={{ duration: 0.2 }}>
                        <YouTubeCard item={item} onEdit={openEditModal} onDelete={openDeleteModal} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ── Upload Modal ───────────────────────────────────────── */}
      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadFile={handleUploadFile}
        onAddYouTube={handleAddYouTube}
        defaultTab={uploadModalTab}
      />

      {/* ── AI Summary Guidance Modal ──────────────────────────── */}
      <AISummaryGuidanceModal
        open={showGuidanceModal}
        onOpenChange={setShowGuidanceModal}
        initialNotes={teacherNotes}
        chapterName={chapterName}
        onSave={handleSaveNotes}
      />

      {/* ── Edit Content Modal ─────────────────────────────────── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>Update the title of this item</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateContent} disabled={!editTitle.trim() || submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedContent?.title}&rdquo;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
