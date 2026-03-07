import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  institutionId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
}



export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      _hasHydrated: false,

      setAuth: (user, token) => {
        console.log('[AuthStore] setAuth called:', { userName: user.name, userRole: user.role });
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setUser: (user) => {
        console.log('[AuthStore] setUser called:', { userName: user.name });
        set({ user });
      },

      logout: () => {
        console.log('[AuthStore] logout called');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) => {
        console.log('[AuthStore] setLoading:', loading);
        set({ isLoading: loading });
      },
      
      setHasHydrated: (hydrated) => {
        console.log('[AuthStore] setHasHydrated:', hydrated);
        set({ _hasHydrated: hydrated });
      },
    }),
    {
      name: 'intellicampus-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        console.log('[AuthStore] Rehydration starting...');
        return (state, error) => {
          if (error) {
            console.error('[AuthStore] Rehydration error:', error);
            return;
          }
          
          // After rehydration completes
          console.log('[AuthStore] Rehydration complete:', {
            hasUser: !!state?.user,
            hasToken: !!state?.token,
            isAuthenticated: state?.isAuthenticated,
            userEmail: state?.user?.email
          });
          
          // Mutate state directly in the rehydration callback
          // This is the correct way according to Zustand persist docs
          if (state) {
            // Always mark hydration as complete and stop loading
            state.isLoading = false;
            state._hasHydrated = true;
          }
        };
      },
    }
  )
);
