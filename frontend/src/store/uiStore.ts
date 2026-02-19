import { create } from 'zustand';

export type ActiveMode = 'learning' | 'assessment' | 'insights';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeTab: ActiveMode;
  theme: 'light' | 'dark';
  isMobile: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: ActiveMode) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setIsMobile: (isMobile: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeTab: 'learning',
  theme: 'light',
  isMobile: false,

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
      sidebarCollapsed: state.sidebarOpen ? true : false,
    })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => set({ theme }),
  setIsMobile: (isMobile) => set({ isMobile }),
}));
