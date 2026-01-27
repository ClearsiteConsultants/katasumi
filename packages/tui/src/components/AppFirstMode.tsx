import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppInfo, DatabaseAdapter, Shortcut } from '@katasumi/core';
import { SQLiteAdapter } from '@katasumi/core';
import { useAppStore } from '../store.js';
import { AppSelector } from './AppSelector.js';
import { FiltersBar } from './FiltersBar.js';
import { ResultsList } from './ResultsList.js';
import * as path from 'path';
import * as fs from 'fs';

interface AppFirstModeProps {
  selectedApp: AppInfo | null;
  view: 'search' | 'results' | 'detail';
}

// Singleton database adapter
let dbAdapter: DatabaseAdapter | null = null;

function getDbAdapter(): DatabaseAdapter {
  if (!dbAdapter) {
    // Try to find the core database
    const possiblePaths = [
      path.join(__dirname, '..', '..', '..', 'core', 'data', 'shortcuts.db'),
      path.join(process.cwd(), 'packages', 'core', 'data', 'shortcuts.db'),
      path.join(__dirname, '..', '..', 'core', 'data', 'shortcuts.db'),
    ];

    let coreDbPath = possiblePaths.find((p) => fs.existsSync(p));

    if (!coreDbPath) {
      // Fallback: create an in-memory adapter with no data
      console.error('Warning: Core database not found. Using empty adapter.');
      coreDbPath = ':memory:';
    }

    dbAdapter = new SQLiteAdapter(coreDbPath);
  }
  return dbAdapter;
}

export function AppFirstMode({ selectedApp, view }: AppFirstModeProps) {
  const availableApps = useAppStore((state) => state.availableApps);
  const setAvailableApps = useAppStore((state) => state.setAvailableApps);
  const appQuery = useAppStore((state) => state.appQuery);
  const setAppQuery = useAppStore((state) => state.setAppQuery);
  const selectedAppIndex = useAppStore((state) => state.selectedAppIndex);
  const setSelectedAppIndex = useAppStore((state) => state.setSelectedAppIndex);
  const selectApp = useAppStore((state) => state.selectApp);
  const quickSearchQuery = useAppStore((state) => state.quickSearchQuery);
  const setQuickSearchQuery = useAppStore((state) => state.setQuickSearchQuery);
  const focusSection = useAppStore((state) => state.focusSection);
  const setFocusSection = useAppStore((state) => state.setFocusSection);
  const results = useAppStore((state) => state.results);
  const setResults = useAppStore((state) => state.setResults);
  const filters = useAppStore((state) => state.filters);
  const platform = useAppStore((state) => state.platform);

  const [loading, setLoading] = useState(true);

  // Load available apps on mount
  useEffect(() => {
    const loadApps = async () => {
      try {
        const adapter = getDbAdapter();
        const apps = await adapter.getApps();
        setAvailableApps(apps);
      } catch (error) {
        console.error('Error loading apps:', error);
        setAvailableApps([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (availableApps.length === 0) {
      loadApps();
    } else {
      setLoading(false);
    }
  }, [availableApps.length, setAvailableApps]);

  // Load shortcuts when app is selected
  useEffect(() => {
    if (!selectedApp) return;

    const loadShortcuts = async () => {
      try {
        const adapter = getDbAdapter();
        const shortcuts = await adapter.getShortcutsByApp(selectedApp.name);
        setResults(shortcuts);
      } catch (error) {
        console.error('Error loading shortcuts:', error);
        setResults([]);
      }
    };

    loadShortcuts();
  }, [selectedApp, setResults]);

  // Handle F2/F3 navigation
  useEffect(() => {
    const handleKeypress = (str: string, key: any) => {
      if (key && key.name === 'f2' && selectedApp) {
        // F2: Return to app selector
        selectApp(null);
        setAppQuery('');
        setQuickSearchQuery('');
        setFocusSection('app-selector');
      } else if (key && key.name === 'f3' && selectedApp) {
        // F3: Focus filters bar
        setFocusSection('filters');
      }
    };

    if (process.stdin.isTTY) {
      process.stdin.on('keypress', handleKeypress);
      return () => {
        process.stdin.removeListener('keypress', handleKeypress);
      };
    }
  }, [selectedApp, selectApp, setAppQuery, setQuickSearchQuery, setFocusSection]);

  // Handle Escape to return to app selector
  useInput((input, key) => {
    if (key.escape && selectedApp) {
      selectApp(null);
      setAppQuery('');
      setQuickSearchQuery('');
      setFocusSection('app-selector');
    }
  });

  if (loading) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        marginY={1}
      >
        <Text>Loading apps...</Text>
      </Box>
    );
  }

  if (!selectedApp) {
    // Show app selector
    return (
      <Box flexDirection="column" marginY={1}>
        <AppSelector
          apps={availableApps}
          query={appQuery}
          selectedIndex={selectedAppIndex}
          onSelectApp={selectApp}
          onQueryChange={setAppQuery}
          onIndexChange={setSelectedAppIndex}
        />
      </Box>
    );
  }

  // Show filters and results
  return (
    <Box flexDirection="column" marginY={1} gap={1}>
      <Box flexDirection="column">
        <Text>
          App: <Text bold color="cyan">{selectedApp.displayName}</Text>
          {' '}
          <Text dimColor>({selectedApp.shortcutCount} shortcuts)</Text>
          {' '}
          <Text dimColor>Press F2 to change app</Text>
        </Text>
      </Box>

      <FiltersBar onQuickSearchChange={setQuickSearchQuery} />
      
      <ResultsList
        results={results}
        platform={platform}
        quickSearchQuery={quickSearchQuery}
      />
    </Box>
  );
}

