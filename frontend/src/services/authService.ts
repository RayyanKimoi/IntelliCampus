import { api } from './apiClient';

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    institutionId: string;
  }) => api.post('/auth/register', data),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: {
    name?: string;
    avatarUrl?: string;
    yearOfStudy?: number;
    department?: string;
    bio?: string;
  }) => api.put('/auth/profile', data),
};
