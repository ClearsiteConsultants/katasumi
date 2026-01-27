import { create } from 'zustand';
import type { Platform, Shortcut, AppInfo } from '@katasumi/core';
import { loadPlatform, savePlatform } from './utils/config.js';

export type PlatformOption = Platform | 'all';

type FocusSection = 'app-selector' | 'filters' | 'results';

interface AppState {
  // UI State
  mode: 'app-first' | 'full-phrase';
  view: 'search' | 'results' | 'detail';
  platform: PlatformOption;
  aiEnabled: boolean;

  // App-First Mode State
  focusSection: FocusSection;
  availableApps: AppInfo[];
  appQuery: string;
  selectedAppIndex: number;
  quickSearchQuery: string;

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
  setPlatform: (platform: PlatformOption) => void;
  toggleAI: () => void;
  
  // App-First Mode Actions
  setFocusSection: (section: FocusSection) => void;
  setAvailableApps: (apps: AppInfo[]) => void;
  setAppQuery: (query: string) => void;
  setSelectedAppIndex: (index: number) => void;
  setQuickSearchQuery: (query: string) => void;
  
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

function getInitialPlatform(): PlatformOption {
  return loadPlatform() || detectPlatform();
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'app-first',
  view: 'search',
  platform: getInitialPlatform(),
  aiEnabled: false,
  
  // App-First Mode State
  focusSection: 'app-selector',
  availableApps: [],
  appQuery: '',
  selectedAppIndex: 0,
  quickSearchQuery: '',
  
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
  setPlatform: (platform) => {
    savePlatform(platform);
    set({ platform });
  },
  toggleAI: () => set((state) => ({ aiEnabled: !state.aiEnabled })),
  
  // App-First Mode Actions
  setFocusSection: (section) => set({ focusSection: section }),
  setAvailableApps: (apps) => set({ availableApps: apps }),
  setAppQuery: (query) => set({ appQuery: query, selectedAppIndex: 0 }),
  setSelectedAppIndex: (index) => set({ selectedAppIndex: index }),
  setQuickSearchQuery: (query) => set({ quickSearchQuery: query }),
  
  selectApp: (app) => set({ selectedApp: app, view: app ? 'results' : 'search', focusSection: app ? 'filters' : 'app-selector' }),
  setQuery: (query) => set({ query }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setResults: (results) => set({ results }),
  selectShortcut: (shortcut) => set({ selectedShortcut: shortcut, view: shortcut ? 'detail' : 'results' }),
}));
