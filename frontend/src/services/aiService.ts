import { api } from './apiClient';

export const aiService = {
  chat: (data: {
    sessionId?: string;
    courseId: string;
    topicId: string;
    message: string;
    mode: 'learning' | 'assessment' | 'practice';
    isVoice?: boolean;
  }) => api.post('/ai/chat', data),

  getSessions: () => api.get('/ai/sessions'),

  getSessionHistory: (sessionId: string) =>
    api.get(`/ai/sessions/${sessionId}/history`),

  getTopicContext: (topicId: string) =>
    api.get(`/ai/context/${topicId}`),
};
