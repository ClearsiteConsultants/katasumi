import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Shortcut, Platform } from '@katasumi/core';
import type { PlatformOption } from '../store.js';
import { useAppStore } from '../store.js';

interface ResultsListProps {
  results: Shortcut[];
  platform: PlatformOption;
  quickSearchQuery: string;
  onSelectShortcut?: (shortcut: Shortcut) => void;
  onFocusSearch?: () => void;
  maxVisibleResults?: number;
}

export function ResultsList({ results, platform, quickSearchQuery, onSelectShortcut, onFocusSearch, maxVisibleResults = 15 }: ResultsListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [atBoundary, setAtBoundary] = useState<'top' | 'bottom' | null>(null);

  // Filter results by quick search query
  const filteredResults = quickSearchQuery
    ? results.filter((shortcut) => {
        const searchText = `${shortcut.action} ${shortcut.context || ''} ${shortcut.category || ''}`.toLowerCase();
        return searchText.includes(quickSearchQuery.toLowerCase());
      })
    : results;

  const halfPage = Math.floor(maxVisibleResults / 2);
  const fullPage = maxVisibleResults;

  // Handle keyboard input for navigation
  useInput((input, key) => {
    const isInputMode = useAppStore.getState().isInputMode;
    
    // Allow "/" to focus search even in navigation mode
    if (!isInputMode && input === '/' && onFocusSearch) {
      onFocusSearch();
      return;
    }
    
    // Skip other navigation if in input mode
    if (isInputMode) {
      return;
    }

    // Clear boundary feedback after a short delay
    const clearBoundary = () => {
      setTimeout(() => setAtBoundary(null), 1000);
    };

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(filteredResults.length - 1, prev + 1));
    } else if (key.ctrl && input === 'u') {
      // Ctrl+U: Scroll up half page
      const newIndex = Math.max(0, selectedIndex - halfPage);
      if (newIndex === 0 && selectedIndex === 0) {
        setAtBoundary('top');
        clearBoundary();
      }
      setSelectedIndex(newIndex);
    } else if (key.ctrl && input === 'd') {
      // Ctrl+D: Scroll down half page
      const newIndex = Math.min(filteredResults.length - 1, selectedIndex + halfPage);
      if (newIndex === filteredResults.length - 1 && selectedIndex === filteredResults.length - 1) {
        setAtBoundary('bottom');
        clearBoundary();
      }
      setSelectedIndex(newIndex);
    } else if (key.ctrl && input === 'b') {
      // Ctrl+B: Scroll up full page
      const newIndex = Math.max(0, selectedIndex - fullPage);
      if (newIndex === 0 && selectedIndex === 0) {
        setAtBoundary('top');
        clearBoundary();
      }
      setSelectedIndex(newIndex);
    } else if (key.ctrl && input === 'f') {
      // Ctrl+F: Scroll down full page
      const newIndex = Math.min(filteredResults.length - 1, selectedIndex + fullPage);
      if (newIndex === filteredResults.length - 1 && selectedIndex === filteredResults.length - 1) {
        setAtBoundary('bottom');
        clearBoundary();
      }
      setSelectedIndex(newIndex);
    } else if (key.return && onSelectShortcut && filteredResults[selectedIndex]) {
      onSelectShortcut(filteredResults[selectedIndex]);
    }
  });

  const getKeysForPlatform = (shortcut: Shortcut): string => {
    if (platform === 'all') {
      // Show all available keys when "all" is selected
      const keys = [];
      if (shortcut.keys.mac) keys.push(`⌘ ${shortcut.keys.mac}`);
      if (shortcut.keys.windows) keys.push(`Win ${shortcut.keys.windows}`);
      if (shortcut.keys.linux) keys.push(`Linux ${shortcut.keys.linux}`);
      return keys.length > 0 ? keys.join(' | ') : 'N/A';
    }
    
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

  // Calculate visible range
  const startIndex = Math.max(0, selectedIndex - Math.floor(maxVisibleResults / 2));
  const endIndex = Math.min(filteredResults.length, startIndex + maxVisibleResults);
  const visibleResults = filteredResults.slice(startIndex, endIndex);
  const positionText = filteredResults.length > 0 
    ? `${selectedIndex + 1} of ${filteredResults.length}` 
    : '0 of 0';

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold>Results ({filteredResults.length}) - Use ↑↓ Ctrl+U/D/F/B, / to search, Enter for details</Text>
        {filteredResults.length > 0 && (
          <Text dimColor>[{positionText}]</Text>
        )}
      </Box>
      {atBoundary && (
        <Box marginTop={1}>
          <Text color="yellow">
            {atBoundary === 'top' ? '▲ At top of results' : '▼ At bottom of results'}
          </Text>
        </Box>
      )}
      
      {filteredResults.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor>
            {quickSearchQuery 
              ? `No shortcuts found for "${quickSearchQuery}". Try adjusting your search query.`
              : results.length === 0
                ? 'No shortcuts found. Try adjusting filters or search query.'
                : `No shortcuts match "${quickSearchQuery}".`}
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {visibleResults.map((shortcut, index) => {
            const keys = getKeysForPlatform(shortcut);
            const context = shortcut.context ? `[${shortcut.context}]` : '';
            const actualIndex = startIndex + index;
            const isSelected = actualIndex === selectedIndex;
            
            return (
              <Box key={shortcut.id}>
                <Text inverse={isSelected}>
                  {isSelected ? '▶ ' : '  '}
                </Text>
                <Box width={25}>
                  <Text color="yellow" inverse={isSelected}>{keys}</Text>
                </Box>
                <Box width={40}>
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
          {filteredResults.length > maxVisibleResults && (
            <Box marginTop={1}>
              <Text dimColor>
                Showing {startIndex + 1}-{endIndex} of {filteredResults.length} results
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
