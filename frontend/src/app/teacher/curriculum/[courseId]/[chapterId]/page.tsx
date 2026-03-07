'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'motion/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { chapterCurriculumService, ChapterContent } from '@/services/chapterCurriculumService';
import {
  ChevronLeft,
  Upload,
  FileText,
  Download,
  Trash2,
  Edit2,
  File,
  FileCheck,
} from 'lucide-react';
import { FaFilePdf } from 'react-icons/fa';

export default function ChapterContentPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const chapterId = params.chapterId as string;

  const [content, setContent] = useState<ChapterContent[]>([]);
  const [chapterName, setChapterName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ChapterContent | null>(null);

  // Form states
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContent();
  }, [chapterId]);

  const loadContent = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await chapterCurriculumService.getChapterContent(chapterId);
      setContent(data.content);
      setChapterName(data.chapterName);
    } catch (err: any) {
      setError(err?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle.trim()) return;

    setSubmitting(true);
    try {
      // TODO: Implement actual file upload to storage
      // For now, using placeholder URL
      const placeholderUrl = `/uploads/${Date.now()}_${selectedFile.name}`;

      await chapterCurriculumService.uploadContent({
        chapterId,
        title: uploadTitle,
        fileUrl: placeholderUrl,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
      });

      await loadContent();
      setShowUploadModal(false);
      setUploadTitle('');
      setSelectedFile(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to upload content');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateContent = async () => {
    if (!selectedContent || !uploadTitle.trim()) return;

    setSubmitting(true);
    try {
      await chapterCurriculumService.updateContent(selectedContent.id, {
        title: uploadTitle,
      });

      await loadContent();
      setShowEditModal(false);
      setSelectedContent(null);
      setUploadTitle('');
    } catch (err: any) {
      alert(err?.message || 'Failed to update content');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedContent) return;

    setSubmitting(true);
    try {
      await chapterCurriculumService.deleteContent(selectedContent.id);
      await loadContent();
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
    setUploadTitle(item.title);
    setShowEditModal(true);
  };

  const openDeleteModal = (item: ChapterContent) => {
    setSelectedContent(item);
    setShowDeleteModal(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.includes('pdf')) return <FaFilePdf className="h-6 w-6 text-red-500" />;
    return <FileText className="h-6 w-6 text-blue-500" />;
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/teacher/curriculum/${courseId}`)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{chapterName}</h1>
              <p className="text-muted-foreground mt-1">Upload and manage learning materials</p>
            </div>
          </div>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Content
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : content.length === 0 ? (
          /* Empty state */
          <Card className="text-center py-16">
            <CardContent>
              <FileCheck className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Content Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Upload PDFs, documents, and other learning materials for this chapter.
              </p>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First File
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Content grid */
          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {content.map((item) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
                }}
              >
                <Card className="group hover:shadow-md hover:border-primary/40 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getFileIcon(item.fileType)}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDeleteModal(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-base line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {formatFileSize(item.fileSize)} • {new Date(item.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(item.fileUrl, '_blank')}
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Content</DialogTitle>
            <DialogDescription>
              Upload a PDF, document, or other learning material for this chapter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.ppt,.pptx"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., Chapter 1 - Introduction"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !uploadTitle.trim() || submitting}
            >
              {submitting ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>Update the title of this content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateContent} disabled={!uploadTitle.trim() || submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedContent?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
