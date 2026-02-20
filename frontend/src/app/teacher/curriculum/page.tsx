'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teacherService } from '@/services/teacherService';
import {
  BookOpen, ChevronRight, Plus, Upload, FolderOpen,
  FileText, Layers, X, Check, AlertCircle, Loader2,
} from 'lucide-react';

// ───────────────────────────── Types
interface Course { id: string; name: string; description?: string; }
interface Subject { id: string; name: string; courseId: string; }
interface Topic { id: string; name: string; subjectId: string; }
interface ContentItem { id: string; title: string; contentText?: string; fileUrl?: string; createdAt: string; }

type ActiveTab = 'courses' | 'subjects' | 'topics';

// ───────────────────────────── Modal component
function Modal({ open, title, onClose, onSubmit, loading, children }: {
  open: boolean; title: string; onClose: () => void;
  onSubmit: () => void; loading: boolean; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">{children}</div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onSubmit} disabled={loading}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── Page
export default function CurriculumPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);

  // Form state
  const [form, setForm] = useState({ name: '', description: '', title: '', contentText: '' });

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teacherService.getCourses();
      setCourses(data ?? []);
    } catch { setError('Failed to load courses'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const loadSubjects = useCallback(async (courseId: string) => {
    setLoading(true);
    try {
      const data = await teacherService.getSubjects(courseId);
      setSubjects(data ?? []);
    } catch { setError('Failed to load subjects'); }
    finally { setLoading(false); }
  }, []);

  const loadTopics = useCallback(async (subjectId: string) => {
    setLoading(true);
    try {
      const data = await teacherService.getTopics(subjectId);
      setTopics(data ?? []);
    } catch { setError('Failed to load topics'); }
    finally { setLoading(false); }
  }, []);

  const loadContent = useCallback(async (topicId: string) => {
    setLoading(true);
    try {
      const data = await teacherService.getTopicContent(topicId);
      setContents(data ?? []);
    } catch { setContents([]); }
    finally { setLoading(false); }
  }, []);

  // ── Handlers
  function onSelectCourse(course: Course) {
    setSelectedCourse(course);
    setSelectedSubject(null);
    setSelectedTopic(null);
    setSubjects([]);
    setTopics([]);
    setContents([]);
    setActiveTab('subjects');
    loadSubjects(course.id);
  }

  function onSelectSubject(subject: Subject) {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    setTopics([]);
    setContents([]);
    setActiveTab('topics');
    loadTopics(subject.id);
  }

  function onSelectTopic(topic: Topic) {
    setSelectedTopic(topic);
    setContents([]);
    loadContent(topic.id);
  }

  async function createCourse() {
    setSaving(true);
    try {
      await teacherService.createCourse({ name: form.name, description: form.description });
      setShowCourseModal(false);
      setForm({ name: '', description: '', title: '', contentText: '' });
      loadCourses();
    } catch { setError('Failed to create course'); }
    finally { setSaving(false); }
  }

  async function createSubject() {
    if (!selectedCourse) return;
    setSaving(true);
    try {
      await teacherService.createSubject(selectedCourse.id, { name: form.name, description: '' });
      setShowSubjectModal(false);
      setForm({ name: '', description: '', title: '', contentText: '' });
      loadSubjects(selectedCourse.id);
    } catch { setError('Failed to create subject'); }
    finally { setSaving(false); }
  }

  async function createTopic() {
    if (!selectedSubject) return;
    setSaving(true);
    try {
      await teacherService.createTopic(selectedSubject.id, { name: form.name, description: '', difficultyLevel: 'medium', orderIndex: 0 });
      setShowTopicModal(false);
      setForm({ name: '', description: '', title: '', contentText: '' });
      loadTopics(selectedSubject.id);
    } catch { setError('Failed to create topic'); }
    finally { setSaving(false); }
  }

  async function uploadContent() {
    if (!selectedTopic) return;
    setSaving(true);
    try {
      await teacherService.uploadContent(selectedTopic.id, {
        content: form.contentText,
        contentType: 'text',
      });
      setShowContentModal(false);
      setForm({ name: '', description: '', title: '', contentText: '' });
      loadContent(selectedTopic.id);
    } catch { setError('Failed to upload content'); }
    finally { setSaving(false); }
  }

  // ── UI
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'subjects', label: 'Subjects', icon: <Layers className="w-4 h-4" /> },
    { id: 'topics', label: 'Topics & Content', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Curriculum & Knowledge Base</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your courses, subjects, topics and content materials.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Breadcrumb */}
        {(selectedCourse || selectedSubject || selectedTopic) && (
          <div className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
            <button onClick={() => { setActiveTab('courses'); setSelectedCourse(null); setSelectedSubject(null); setSelectedTopic(null); }}
              className="hover:text-blue-600">Courses</button>
            {selectedCourse && (
              <>
                <ChevronRight className="w-4 h-4" />
                <button onClick={() => { setActiveTab('subjects'); setSelectedSubject(null); setSelectedTopic(null); }}
                  className="hover:text-blue-600">{selectedCourse.name}</button>
              </>
            )}
            {selectedSubject && (
              <>
                <ChevronRight className="w-4 h-4" />
                <button onClick={() => { setActiveTab('topics'); setSelectedTopic(null); }}
                  className="hover:text-blue-600">{selectedSubject.name}</button>
              </>
            )}
            {selectedTopic && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-gray-800">{selectedTopic.name}</span>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* COURSES TAB */}
            {activeTab === 'courses' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-semibold text-gray-700">All Courses ({courses.length})</h2>
                  <button onClick={() => setShowCourseModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> New Course
                  </button>
                </div>
                {courses.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>No courses yet. Create your first course.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                      <div key={course.id} onClick={() => onSelectCourse(course)}
                        className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors mt-1" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mt-3">{course.name}</h3>
                        {course.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                        )}
                        <p className="text-xs text-blue-500 mt-3 font-medium">View Subjects →</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUBJECTS TAB */}
            {activeTab === 'subjects' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-semibold text-gray-700">
                    Subjects {selectedCourse ? `in ${selectedCourse.name}` : ''} ({subjects.length})
                  </h2>
                  <button onClick={() => setShowSubjectModal(true)} disabled={!selectedCourse}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    <Plus className="w-4 h-4" /> New Subject
                  </button>
                </div>
                {!selectedCourse ? (
                  <div className="text-center py-16 text-gray-400">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>Select a course first to view its subjects.</p>
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>No subjects yet. Add a subject to this course.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map(subject => (
                      <div key={subject.id} onClick={() => onSelectSubject(subject)}
                        className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                            <Layers className="w-5 h-5 text-purple-600" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors mt-1" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mt-3">{subject.name}</h3>
                        <p className="text-xs text-blue-500 mt-3 font-medium">View Topics →</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TOPICS TAB */}
            {activeTab === 'topics' && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Topic list */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-base font-semibold text-gray-700">Topics ({topics.length})</h2>
                    <button onClick={() => setShowTopicModal(true)} disabled={!selectedSubject}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  {!selectedSubject ? (
                    <p className="text-sm text-gray-400 py-8 text-center">Select a subject first.</p>
                  ) : topics.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">No topics yet.</p>
                  ) : (
                    topics.map(topic => (
                      <div key={topic.id} onClick={() => onSelectTopic(topic)}
                        className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all
                          ${selectedTopic?.id === topic.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-800">{topic.name}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Content panel */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-base font-semibold text-gray-700">
                      Content {selectedTopic ? `— ${selectedTopic.name}` : ''}
                    </h2>
                    <button onClick={() => setShowContentModal(true)} disabled={!selectedTopic}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                      <Upload className="w-4 h-4" /> Upload Content
                    </button>
                  </div>
                  {!selectedTopic ? (
                    <div className="text-center py-16 text-gray-400 border border-dashed rounded-xl">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>Select a topic to view its content.</p>
                    </div>
                  ) : contents.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 border border-dashed rounded-xl">
                      <Upload className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>No content uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contents.map(c => (
                        <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{c.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            {c.fileUrl && (
                              <a href={c.fileUrl} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline">View</a>
                            )}
                          </div>
                          {c.contentText && (
                            <p className="text-sm text-gray-600 mt-3 pl-11 line-clamp-3">{c.contentText}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <Modal open={showCourseModal} title="Create Course" onClose={() => setShowCourseModal(false)}
          onSubmit={createCourse} loading={saving}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Data Structures" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-20"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          </div>
        </Modal>

        <Modal open={showSubjectModal} title={`Add Subject to ${selectedCourse?.name}`}
          onClose={() => setShowSubjectModal(false)} onSubmit={createSubject} loading={saving}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sorting Algorithms" />
          </div>
        </Modal>

        <Modal open={showTopicModal} title={`Add Topic to ${selectedSubject?.name}`}
          onClose={() => setShowTopicModal(false)} onSubmit={createTopic} loading={saving}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Merge Sort" />
          </div>
        </Modal>

        <Modal open={showContentModal} title={`Upload Content — ${selectedTopic?.name}`}
          onClose={() => setShowContentModal(false)} onSubmit={uploadContent} loading={saving}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Lecture Notes" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Text</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-32"
              value={form.contentText} onChange={e => setForm(f => ({ ...f, contentText: e.target.value }))}
              placeholder="Paste your notes, summaries or content here…" />
          </div>
        </Modal>

      </div>
    </DashboardLayout>
  );
}
