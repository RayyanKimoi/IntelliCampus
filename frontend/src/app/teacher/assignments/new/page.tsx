'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, PlusCircle, ClipboardList, Trash2 } from 'lucide-react';
import { teacherService } from '@/services/teacherService';

interface QuestionForm {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
}

export default function NewAssignmentPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [strictMode, setStrictMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Question builder
  const [assignmentId, setAssignmentId] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [currentQ, setCurrentQ] = useState<QuestionForm>({
    questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A',
  });
  const [addingQ, setAddingQ] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await teacherService.getCourses();
        setCourses(Array.isArray((res as any)?.data || res) ? ((res as any)?.data || res) : []);
      } catch {}
    }
    load();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedCourse || !dueDate) {
      setError('Title, course, and due date are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await teacherService.createAssignment(selectedCourse, {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        strictMode,
      });
      const d = (res as any)?.data || res;
      setAssignmentId(d.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!currentQ.questionText.trim() || !currentQ.optionA || !currentQ.optionB) return;
    setAddingQ(true);
    try {
      await teacherService.addQuestion(assignmentId, {
        questionText: currentQ.questionText,
        optionA: currentQ.optionA,
        optionB: currentQ.optionB,
        optionC: currentQ.optionC,
        optionD: currentQ.optionD,
        correctOption: currentQ.correctOption,
      });
      setQuestions([...questions, currentQ]);
      setCurrentQ({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' });
    } catch (err: any) {
      alert(err.message || 'Failed to add question');
    } finally {
      setAddingQ(false);
    }
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" onClick={() => router.push('/teacher/assignments')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {!assignmentId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Create Assignment
              </CardTitle>
              <CardDescription>Create an assignment and then add questions to it.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Course *</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Midterm Exam - Module 1" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Instructions for students..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={strictMode} onCheckedChange={setStrictMode} />
                  <Label>Strict Exam Mode (blocks AI assistance during the test)</Label>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Assignment
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Assignment Created!</CardTitle>
                <CardDescription>Now add questions to &ldquo;{title}&rdquo;</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge>{questions.length} questions added</Badge>

                {/* Added questions list */}
                {questions.length > 0 && (
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <div key={i} className="p-3 border rounded-lg text-sm">
                        <span className="font-medium">Q{i + 1}:</span> {q.questionText}
                        <span className="ml-2 text-muted-foreground">(Answer: {q.correctOption})</span>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Add question form */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Add Question</h3>
                  <div className="space-y-2">
                    <Label>Question Text *</Label>
                    <Textarea
                      value={currentQ.questionText}
                      onChange={e => setCurrentQ({ ...currentQ, questionText: e.target.value })}
                      placeholder="Enter your question..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Option A *</Label>
                      <Input value={currentQ.optionA} onChange={e => setCurrentQ({ ...currentQ, optionA: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Option B *</Label>
                      <Input value={currentQ.optionB} onChange={e => setCurrentQ({ ...currentQ, optionB: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Option C</Label>
                      <Input value={currentQ.optionC} onChange={e => setCurrentQ({ ...currentQ, optionC: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Option D</Label>
                      <Input value={currentQ.optionD} onChange={e => setCurrentQ({ ...currentQ, optionD: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Correct Answer *</Label>
                    <Select value={currentQ.correctOption} onValueChange={v => setCurrentQ({ ...currentQ, correctOption: v })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addQuestion} disabled={addingQ || !currentQ.questionText.trim()}>
                    {addingQ ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                    Add Question
                  </Button>
                </div>

                <Separator />

                <Button onClick={() => router.push('/teacher/assignments')} className="w-full">
                  Done — Back to Assignments
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
