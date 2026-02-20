import { create } from 'zustand';
import type { Course, Subject, Topic } from '@/services/curriculumService';
import type { MasteryOverview } from '@/services/masteryService';

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

interface CourseStore {
  // Data
  courses: Course[];
  subjectsByCourse: Record<string, Subject[]>;
  topicsBySubject: Record<string, Topic[]>;
  masteryByCourse: Record<string, MasteryOverview>;

  // Selection (used by AI Tutor + Practice)
  selectedCourseId: string | null;
  selectedTopicId: string | null;

  // Loading
  coursesLoaded: boolean;

  // Actions
  setCourses: (courses: Course[]) => void;
  setSubjects: (courseId: string, subjects: Subject[]) => void;
  setTopics: (subjectId: string, topics: Topic[]) => void;
  setCourseMastery: (courseId: string, mastery: MasteryOverview) => void;
  setSelectedCourse: (id: string | null) => void;
  setSelectedTopic: (id: string | null) => void;

  /** Flat list of every topic across all loaded courses — used by AI Tutor topic picker */
  getAllTopics: () => (Topic & { courseId: string; courseName: string; subjectName?: string })[];

  /** Topics for a specific course, flattened across its subjects */
  getTopicsForCourse: (courseId: string) => (Topic & { subjectId: string })[];

  reset: () => void;
}

// ──────────────────────────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────────────────────────

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  subjectsByCourse: {},
  topicsBySubject: {},
  masteryByCourse: {},
  selectedCourseId: null,
  selectedTopicId: null,
  coursesLoaded: false,

  setCourses: (courses) => set({ courses, coursesLoaded: true }),

  setSubjects: (courseId, subjects) =>
    set((state) => ({
      subjectsByCourse: { ...state.subjectsByCourse, [courseId]: subjects },
    })),

  setTopics: (subjectId, topics) =>
    set((state) => ({
      topicsBySubject: { ...state.topicsBySubject, [subjectId]: topics },
    })),

  setCourseMastery: (courseId, mastery) =>
    set((state) => ({
      masteryByCourse: { ...state.masteryByCourse, [courseId]: mastery },
    })),

  setSelectedCourse: (id) => set({ selectedCourseId: id }),
  setSelectedTopic: (id) => set({ selectedTopicId: id }),

  getAllTopics: () => {
    const { courses, subjectsByCourse, topicsBySubject } = get();
    const result: (Topic & { courseId: string; courseName: string; subjectName?: string })[] = [];
    for (const course of courses) {
      const subjects = subjectsByCourse[course.id] ?? [];
      for (const subject of subjects) {
        const topics = topicsBySubject[subject.id] ?? [];
        for (const topic of topics) {
          result.push({
            ...topic,
            courseId: course.id,
            courseName: course.name,
            subjectName: subject.name,
          });
        }
      }
    }
    return result;
  },

  getTopicsForCourse: (courseId) => {
    const { subjectsByCourse, topicsBySubject } = get();
    const subjects = subjectsByCourse[courseId] ?? [];
    const result: (Topic & { subjectId: string })[] = [];
    for (const subject of subjects) {
      const topics = topicsBySubject[subject.id] ?? [];
      for (const topic of topics) {
        result.push({ ...topic, subjectId: subject.id });
      }
    }
    return result;
  },

  reset: () =>
    set({
      courses: [],
      subjectsByCourse: {},
      topicsBySubject: {},
      masteryByCourse: {},
      selectedCourseId: null,
      selectedTopicId: null,
      coursesLoaded: false,
    }),
}));
