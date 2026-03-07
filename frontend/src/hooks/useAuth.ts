'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, setAuth, logout, setLoading } =
    useAuthStore();
  const router = useRouter();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      return;
    }
    
    const initAuth = async () => {
      // In development mode with mock auth, skip verification if already authenticated
      const isDevelopment = true; // Match authStore.ts setting
      if (isDevelopment && token && user) {
        console.log('[useAuth] Dev mode: Already have mock user, skipping verification');
        setLoading(false);
        hasInitializedRef.current = true;
        return;
      }

      // Only attempt to fetch user data if we have a token but no user
      if (token && !user) {
        try {
          const response = await authService.getMe();
          if (response.data) {
            setAuth(response.data, token);
          } else {
            // In dev mode, don't logout on verification failure
            if (!isDevelopment) {
              logout();
            } else {
              console.log('[useAuth] Dev mode: Verification failed but keeping mock auth');
              setLoading(false);
            }
          }
        } catch (error) {
          console.log('[useAuth] Auth verification error:', error);
          // In dev mode, don't logout on verification failure
          if (!isDevelopment) {
            logout();
          } else {
            console.log('[useAuth] Dev mode: Keeping mock auth despite error');
            setLoading(false);
          }
        }
      } else if (!token) {
        // No token means definitely not authenticated
        setLoading(false);
      }
      // If both token and user exist, do nothing - already authenticated
      hasInitializedRef.current = true;
    };

    initAuth();
  }, []); // Empty deps is intentional - only run once on mount

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
    role?: string;
    institutionId?: string;
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
