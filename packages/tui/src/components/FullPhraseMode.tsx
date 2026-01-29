import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Shortcut, Platform, DatabaseAdapter } from '@katasumi/core';
import { SQLiteAdapter, KeywordSearchEngine } from '@katasumi/core';
import { useAppStore } from '../store.js';
import type { PlatformOption } from '../store.js';
import { DetailView } from './DetailView.js';
import { logError, getUserFriendlyMessage } from '../utils/error-logger.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface FullPhraseModeProps {
  aiEnabled: boolean;
  view: 'search' | 'results' | 'detail';
}

interface GroupedResult {
  app: string;
  shortcuts: Shortcut[];
}

// Singleton database adapter
let dbAdapter: DatabaseAdapter | null = null;

function getDbAdapter(): DatabaseAdapter {
  if (!dbAdapter) {
    // Resolve path from the monorepo root
    const possiblePaths = [
      path.resolve(__dirname, '..', '..', '..', 'core', 'data', 'shortcuts.db'),
      path.resolve(__dirname, '..', 'core', 'data', 'shortcuts.db'),
      path.resolve(process.cwd(), '..', 'core', 'data', 'shortcuts.db'),
      path.resolve(process.cwd(), 'packages', 'core', 'data', 'shortcuts.db'),
    ];

    let coreDbPath = possiblePaths.find((p) => fs.existsSync(p));

    if (!coreDbPath) {
      console.error('❌ Core database not found.');
      coreDbPath = ':memory:';
    }

    const userDbPath = path.join(process.env.HOME || '~', '.katasumi', 'user-data.db');
    dbAdapter = new SQLiteAdapter(coreDbPath, userDbPath);
  }
  return dbAdapter;
}

export function FullPhraseMode({ aiEnabled, view }: FullPhraseModeProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Shortcut[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const platform = useAppStore((state) => state.platform);
  const selectedShortcut = useAppStore((state) => state.selectedShortcut);
  const selectShortcut = useAppStore((state) => state.selectShortcut);
  
  const terminalSize = useTerminalSize();

  // Handle keyboard input for the search field
  useInput((input, key) => {
    if (view === 'detail') {
      // Let DetailView handle input when in detail view
      return;
    }

    if (key.return) {
      // If Enter is pressed and there are results, show detail of selected result
      if (results.length > 0 && selectedIndex < results.length) {
        selectShortcut(results[selectedIndex]);
      } else if (query.trim().length > 0) {
        // Trigger search on Enter if no results
        performSearch(query);
      }
    } else if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(results.length - 1, prev + 1));
    } else if (key.backspace || key.delete) {
      // Handle backspace
      setQuery(prev => prev.slice(0, -1));
      setSelectedIndex(0);
    } else if (!key.ctrl && !key.meta && input.length === 1) {
      // Handle regular character input
      setQuery(prev => prev + input);
      setSelectedIndex(0);
    }
  });

  // Auto-search with debounce
  useEffect(() => {
    if (query.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        performSearch(query);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [query, aiEnabled, platform]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    setError(null);
    try {
      const adapter = getDbAdapter();
      const searchEngine = new KeywordSearchEngine(adapter);
      
      // Convert PlatformOption to Platform (undefined for 'all')
      const platformFilter: Platform | undefined = platform === 'all' ? undefined : platform;
      
      // Use keyword search for now (AI search would go here if aiEnabled)
      const searchResults = await searchEngine.fuzzySearch(
        searchQuery,
        { platform: platformFilter },
        30 // Get top 30 results across all apps
      );
      
      setResults(searchResults);
    } catch (error) {
      const friendlyMessage = getUserFriendlyMessage(error);
      setError(friendlyMessage);
      logError(`Error performing search for query: ${searchQuery}`, error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Group results by app
  const groupResultsByApp = (shortcuts: Shortcut[]): GroupedResult[] => {
    const grouped = shortcuts.reduce((acc, shortcut) => {
      if (!acc[shortcut.app]) {
        acc[shortcut.app] = [];
      }
      acc[shortcut.app].push(shortcut);
      return acc;
    }, {} as Record<string, Shortcut[]>);

    return Object.entries(grouped).map(([app, shortcuts]) => ({
      app,
      shortcuts,
    }));
  };

  const getKeysForPlatform = (shortcut: Shortcut): string => {
    switch (platform) {
      case 'mac':
        return shortcut.keys.mac || shortcut.keys.linux || shortcut.keys.windows || 'N/A';
      case 'windows':
        return shortcut.keys.windows || shortcut.keys.linux || 'N/A';
      case 'linux':
        return shortcut.keys.linux || shortcut.keys.windows || 'N/A';
      default:
        return 'N/A';
    }
  };

  // Show detail view if a shortcut is selected
  if (view === 'detail' && selectedShortcut) {
    return (
      <DetailView
        shortcut={selectedShortcut}
        platform={platform}
        onBack={() => selectShortcut(null)}
        dbAdapter={getDbAdapter()}
      />
    );
  }

  if (view === 'search' || view === 'results') {
    const groupedResults = groupResultsByApp(results);
    const maxVisibleResults = terminalSize.availableRows;

    // Show terminal size warnings
    if (terminalSize.isTooSmall) {
      return (
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor="yellow"
          paddingX={2}
          paddingY={1}
          marginY={1}
        >
          <Text color="yellow" bold>⚠ Terminal too small</Text>
          <Text color="yellow">Please resize your terminal to at least 20 rows (current: {terminalSize.rows})</Text>
        </Box>
      );
    }

    if (terminalSize.isTooNarrow) {
      return (
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor="yellow"
          paddingX={2}
          paddingY={1}
          marginY={1}
        >
          <Text color="yellow" bold>⚠ Terminal too narrow</Text>
          <Text color="yellow">Please resize your terminal to at least 80 columns (current: {terminalSize.columns})</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" marginY={1}>
        {/* Search Input Box */}
        <Box
          flexDirection="column"
          borderStyle="single"
          paddingX={2}
          paddingY={1}
        >
          <Text bold>Search across all apps</Text>
          <Box marginTop={1}>
            <Text dimColor>Type to search, press Enter to trigger search manually</Text>
          </Box>
          <Box marginTop={1}>
            <Text>Query: </Text>
            <Text bold color="cyan">{query || '_'}</Text>
          </Box>
        </Box>

        {/* AI Status Indicator */}
        <Box marginTop={1} paddingX={2}>
          {aiEnabled ? (
            <Text color="green">
              💡 AI Insight: Results are ranked by AI for better relevance
            </Text>
          ) : (
            <Text color="yellow">
              ⚡ Keyword search only - exact matches and fuzzy search
            </Text>
          )}
        </Box>

        {/* Results */}
        {error ? (
          <Box marginTop={1} paddingX={2} borderStyle="single" borderColor="red">
            <Text color="red" bold>Error: </Text>
            <Text color="red">{error}</Text>
            <Box marginTop={1}>
              <Text dimColor>Check ~/.katasumi/error.log for details</Text>
            </Box>
          </Box>
        ) : isSearching ? (
          <Box marginTop={1} paddingX={2}>
            <Text dimColor>Searching...</Text>
          </Box>
        ) : results.length > 0 ? (
          <Box flexDirection="column" marginTop={1}>
            <Box paddingX={2} marginBottom={1}>
              <Text dimColor>Use ↑↓ to navigate, Enter to view details</Text>
            </Box>
            {results.slice(0, maxVisibleResults).map((shortcut, index) => {
              const keys = getKeysForPlatform(shortcut);
              const context = shortcut.context ? `[${shortcut.context}]` : '';
              const isSelected = index === selectedIndex;
              
              return (
                <Box key={shortcut.id} paddingX={2}>
                  <Text inverse={isSelected}>
                    {isSelected ? '▶ ' : '  '}
                  </Text>
                  <Box width={15}>
                    <Text color="cyan" bold inverse={isSelected}>{shortcut.app}</Text>
                  </Box>
                  <Box width={25}>
                    <Text color="yellow" inverse={isSelected}>{keys}</Text>
                  </Box>
                  <Box width={35}>
                    <Text inverse={isSelected}>{shortcut.action}</Text>
                  </Box>
                  {context && (
                    <Box>
                      <Text dimColor={!isSelected} inverse={isSelected}>{context}</Text>
                    </Box>
                  )}
                </Box>
              );
            })}
            {results.length > maxVisibleResults && (
              <Box paddingX={2}>
                <Text dimColor>... {results.length - maxVisibleResults} more results (scroll with ↑↓)</Text>
              </Box>
            )}
          </Box>
        ) : query.trim().length > 0 ? (
          <Box marginTop={1} paddingX={2}>
            <Text dimColor>No results found for "{query}". Try a different search query.</Text>
          </Box>
        ) : null}
      </Box>
    );
  }

  return null;
}
