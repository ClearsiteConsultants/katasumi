import { create } from 'zustand';
import type { Platform, Shortcut, AppInfo } from '@katasumi/core';

interface AppState {
  // UI State
  mode: 'app-first' | 'full-phrase';
  view: 'search' | 'results' | 'detail';
  platform: Platform;
  aiEnabled: boolean;

  // Search State
  selectedApp: AppInfo | null;
  query: string;
  filters: {
    context: string | null;
    category: string | null;
    tags: string[];
  };
  results: Shortcut[];
  selectedShortcut: Shortcut | null;

  // Actions
  setMode: (mode: 'app-first' | 'full-phrase') => void;
  toggleMode: () => void;
  setView: (view: 'search' | 'results' | 'detail') => void;
  setPlatform: (platform: Platform) => void;
  toggleAI: () => void;
  selectApp: (app: AppInfo | null) => void;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<AppState['filters']>) => void;
  setResults: (results: Shortcut[]) => void;
  selectShortcut: (shortcut: Shortcut | null) => void;
}

function detectPlatform(): Platform {
  switch (process.platform) {
    case 'darwin':
      return 'mac';
    case 'win32':
      return 'windows';
    default:
      return 'linux';
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'app-first',
  view: 'search',
  platform: detectPlatform(),
  aiEnabled: false,
  selectedApp: null,
  query: '',
  filters: { context: null, category: null, tags: [] },
  results: [],
  selectedShortcut: null,

  setMode: (mode) => set({ mode, view: 'search' }),
  toggleMode: () => {
    const currentMode = get().mode;
    set({ mode: currentMode === 'app-first' ? 'full-phrase' : 'app-first', view: 'search' });
  },
  setView: (view) => set({ view }),
  setPlatform: (platform) => set({ platform }),
  toggleAI: () => set((state) => ({ aiEnabled: !state.aiEnabled })),
  selectApp: (app) => set({ selectedApp: app, view: app ? 'results' : 'search' }),
  setQuery: (query) => set({ query }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setResults: (results) => set({ results }),
  selectShortcut: (shortcut) => set({ selectedShortcut: shortcut, view: shortcut ? 'detail' : 'results' }),
}));
