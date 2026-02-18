import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeTab: 'learning' | 'assessment' | 'insights';
  theme: 'light' | 'dark';
  isMobile: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: 'learning' | 'assessment' | 'insights') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setIsMobile: (isMobile: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeTab: 'learning',
  theme: 'light',
  isMobile: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => set({ theme }),
  setIsMobile: (isMobile) => set({ isMobile }),
}));
