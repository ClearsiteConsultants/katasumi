import React, { useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppInfo } from '@katasumi/core';
import { useAppStore } from '../store.js';
import { debugLog } from '../utils/debug-logger.js';

interface AppSelectorProps {
  apps: AppInfo[];
  query: string;
  selectedIndex: number;
  onSelectApp: (app: AppInfo) => void;
  onQueryChange: (query: string) => void;
  onIndexChange: (index: number) => void;
  maxVisibleApps?: number;
}

// Simple fuzzy match function
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === lowerQuery.length;
}

export function AppSelector({
  apps,
  query,
  selectedIndex,
  onSelectApp,
  onQueryChange,
  onIndexChange,
  maxVisibleApps = 10,
}: AppSelectorProps) {
  const focusSection = useAppStore((state) => state.focusSection);
  const setInputMode = useAppStore((state) => state.setInputMode);
  const isFocused = focusSection === 'app-selector';

  // Update input mode when focus changes
  useEffect(() => {
    setInputMode(isFocused);
  }, [isFocused, setInputMode]);

  // Filter apps with fuzzy matching
  const filteredApps = apps.filter((app) =>
    fuzzyMatch(app.displayName, query) || fuzzyMatch(app.name, query)
  );

  useInput(
    (input, key) => {
      if (!isFocused) return;

      if (key.return) {
        // Select app on Enter
        if (filteredApps[selectedIndex]) {
          onSelectApp(filteredApps[selectedIndex]);
        }
      } else if (key.upArrow) {
        // Navigate up
        onIndexChange(Math.max(0, selectedIndex - 1));
      } else if (key.downArrow) {
        // Navigate down
        onIndexChange(Math.min(filteredApps.length - 1, selectedIndex + 1));
      } else if (key.backspace || key.delete) {
        // Handle backspace
        onQueryChange(query.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        // Add character to query
        onQueryChange(query + input);
      }
    },
    { isActive: isFocused }
  );

  // Auto-adjust selected index when filtered list changes
  useEffect(() => {
    if (selectedIndex >= filteredApps.length && filteredApps.length > 0) {
      onIndexChange(filteredApps.length - 1);
    }
  }, [filteredApps.length, selectedIndex, onIndexChange]);

  // Debug: Log on mount
  useEffect(() => {
    debugLog('📱 AppSelector MOUNTED');
  }, []);

  // Debug: Log app selector state on changes
  useEffect(() => {
    debugLog('📱 AppSelector render/update:');
    debugLog(`  Total apps: ${apps.length}`);
    debugLog(`  Filtered apps: ${filteredApps.length}`);
    debugLog(`  Query: "${query}"`);
    debugLog(`  Max visible: ${maxVisibleApps}`);
    debugLog(`  Displaying: ${Math.min(maxVisibleApps, filteredApps.length)} apps`);
    debugLog(`  Should fill vertical space with height="100%"`);
  }, [apps.length, filteredApps.length, query, maxVisibleApps]);

  // Additional debug at render time (not in useEffect)
  debugLog(`📱 AppSelector RENDERING - filteredApps: ${filteredApps.length}, maxVisible: ${maxVisibleApps}`);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={isFocused ? 'cyan' : 'white'} paddingX={1} height="100%">
      <Box flexShrink={0}>
        <Text bold color={isFocused ? 'cyan' : 'white'}>
          Select App {isFocused && '(F2)'}
        </Text>
      </Box>
      
      <Box flexShrink={0}>
        <Text>
          Search: <Text color="yellow">{query || '_'}</Text>
        </Text>
      </Box>

      <Box flexDirection="column" flexGrow={1}>
        {filteredApps.length === 0 ? (
          <Text dimColor>
            {query 
              ? `No apps match your search "${query}". Try a different query.`
              : 'No apps found in database.'}
          </Text>
        ) : (
          filteredApps.slice(0, maxVisibleApps).map((app, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Box key={app.id}>
                <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                  {isSelected ? '► ' : '  '}
                  {app.displayName}
                </Text>
                <Text dimColor> ({app.shortcutCount} shortcuts)</Text>
              </Box>
            );
          })
        )}
        {filteredApps.length > maxVisibleApps && (
          <Box flexShrink={0}>
            <Text dimColor>... and {filteredApps.length - maxVisibleApps} more</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
