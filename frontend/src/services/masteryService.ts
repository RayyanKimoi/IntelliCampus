import { api } from './apiClient';

export interface TopicMastery {
  topicId: string;
  topicName: string;
  subjectName: string;
  courseName: string;
  masteryLevel: number;
  lastAssessed?: string;
}

export interface MasteryOverview {
  overallMastery: number;
  byTopic: TopicMastery[];
  weakTopics: TopicMastery[];
}

export const masteryService = {
  getMyMastery: () => api.get<MasteryOverview>('/student/mastery'),

  getCourseMastery: (courseId: string) => api.get<MasteryOverview>(`/student/mastery/course/${courseId}`),

  getWeakTopics: () => api.get<TopicMastery[]>('/student/mastery/weak-topics'),
};
