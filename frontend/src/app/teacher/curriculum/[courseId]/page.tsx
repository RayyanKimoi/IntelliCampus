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
import { Textarea } from '@/components/ui/textarea';
import { chapterCurriculumService, Chapter } from '@/services/chapterCurriculumService';
import { Plus, ChevronLeft, FileText, Edit2, Trash2, GripVertical } from 'lucide-react';
import { FaBook } from 'react-icons/fa';

export default function CourseChaptersPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadChapters();
  }, [courseId]);

  const loadChapters = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await chapterCurriculumService.getCourseChapters(courseId);
      setChapters(data.chapters);
      setCourseName(data.courseName);
    } catch (err: any) {
      setError(err?.message || 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChapter = async () => {
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      await chapterCurriculumService.createChapter({
        courseId,
        name: formData.name,
        description: formData.description,
        orderIndex: chapters.length,
      });
      await loadChapters();
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
    } catch (err: any) {
      alert(err?.message || 'Failed to create chapter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditChapter = async () => {
    if (!selectedChapter || !formData.name.trim()) return;
    setSubmitting(true);
    try {
      await chapterCurriculumService.updateChapter(selectedChapter.id, {
        name: formData.name,
        description: formData.description,
      });
      await loadChapters();
      setShowEditModal(false);
      setSelectedChapter(null);
      setFormData({ name: '', description: '' });
    } catch (err: any) {
      alert(err?.message || 'Failed to update chapter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChapter = async () => {
    if (!selectedChapter) return;
    setSubmitting(true);
    try {
      await chapterCurriculumService.deleteChapter(selectedChapter.id);
      await loadChapters();
      setShowDeleteModal(false);
      setSelectedChapter(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete chapter');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setFormData({ name: chapter.name, description: chapter.description || '' });
    setShowEditModal(true);
  };

  const openDeleteModal = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setShowDeleteModal(true);
  };

  const handleChapterClick = (chapterId: string) => {
    router.push(`/teacher/curriculum/${courseId}/${chapterId}`);
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
              onClick={() => router.push('/teacher/curriculum')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{courseName}</h1>
              <p className="text-muted-foreground mt-1">Manage chapters and learning materials</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
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
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : chapters.length === 0 ? (
          /* Empty state */
          <Card className="text-center py-16">
            <CardContent>
              <FaBook className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Chapters Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Start organizing your course by creating chapters. Each chapter can contain multiple learning materials.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Chapter
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Chapters list */
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {chapters.map((chapter) => (
              <motion.div
                key={chapter.id}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                }}
              >
                <Card className="group hover:shadow-md hover:border-primary/40 transition-all">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleChapterClick(chapter.id)}>
                      <GripVertical className="h-5 w-5 text-muted-foreground/40" />
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FaBook className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {chapter.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                          {chapter.description || 'No description'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {chapter._count?.content || 0} {chapter._count?.content === 1 ? 'file' : 'files'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(chapter);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(chapter);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Create Chapter Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chapter</DialogTitle>
            <DialogDescription>Add a new chapter to organize your course materials</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Chapter Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Introduction to React"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this chapter"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateChapter} disabled={!formData.name.trim() || submitting}>
              {submitting ? 'Creating...' : 'Create Chapter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Chapter Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
            <DialogDescription>Update chapter information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Chapter Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditChapter} disabled={!formData.name.trim() || submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chapter Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chapter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedChapter?.name}"? This will also delete all content within this chapter. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteChapter} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Chapter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
