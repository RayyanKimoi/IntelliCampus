'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, setAuth, logout, setLoading } =
    useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      if (token && !user) {
        try {
          const response = await authService.getMe();
          if (response.data) {
            setAuth(response.data, token);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    if (response.data) {
      setAuth(response.data.user, response.data.token);

      // Redirect based on role
      switch (response.data.user.role) {
        case 'student':
          router.push('/student');
          break;
        case 'teacher':
          router.push('/teacher');
          break;
        case 'admin':
          router.push('/admin');
          break;
      }
    }
    return response;
  };

  const handleRegister = async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    institutionId: string;
  }) => {
    const response = await authService.register(data);
    if (response.data) {
      setAuth(response.data.user, response.data.token);
      router.push(`/${response.data.user.role}`);
    }
    return response;
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}
