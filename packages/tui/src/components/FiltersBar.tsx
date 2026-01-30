import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppStore } from '../store.js';
import type { AppInfo } from '@katasumi/core';

interface FiltersBarProps {
  onQuickSearchChange: (query: string) => void;
  selectedApp?: AppInfo | null;
}

export function FiltersBar({ onQuickSearchChange, selectedApp }: FiltersBarProps) {
  const focusSection = useAppStore((state) => state.focusSection);
  const setInputMode = useAppStore((state) => state.setInputMode);
  const setFocusSection = useAppStore((state) => state.setFocusSection);
  const quickSearchQuery = useAppStore((state) => state.quickSearchQuery);
  const filters = useAppStore((state) => state.filters);
  const results = useAppStore((state) => state.results);
  
  const isFocused = focusSection === 'filters';

  // Update input mode when focus changes
  React.useEffect(() => {
    setInputMode(isFocused);
  }, [isFocused, setInputMode]);

  useInput(
    (input, key) => {
      if (!isFocused) return;

      if (key.escape) {
        // Exit input mode and allow navigation
        setFocusSection('results');
      } else if (key.return) {
        // Execute search and exit input mode
        setFocusSection('results');
      } else if (key.backspace || key.delete) {
        onQuickSearchChange(quickSearchQuery.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        onQuickSearchChange(quickSearchQuery + input);
      }
    },
    { isActive: isFocused }
  );

  const searchLabel = selectedApp 
    ? `Search shortcuts for ${selectedApp.displayName}`
    : 'Quick Search';
  
  const placeholderText = selectedApp 
    ? `Search shortcuts for ${selectedApp.displayName}...`
    : 'Type to search...';

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={isFocused ? 'cyan' : 'white'} paddingX={1}>
      <Box>
        <Text bold color={isFocused ? 'cyan' : 'white'}>
          {searchLabel} {isFocused && '(INPUT MODE)'}
        </Text>
        <Text> - </Text>
        <Text dimColor>Results: {results.length}</Text>
      </Box>

      <Box marginTop={1} gap={2}>
        <Box>
          <Text dimColor>Context: </Text>
          <Text>{filters.context || 'All'}</Text>
        </Box>
        <Box>
          <Text dimColor>Category: </Text>
          <Text>{filters.category || 'All'}</Text>
        </Box>
        <Box>
          <Text dimColor>Tags: </Text>
          <Text>{filters.tags.length > 0 ? filters.tags.join(', ') : 'None'}</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text bold={isFocused} backgroundColor={isFocused ? 'blue' : undefined}>
          Query: <Text color={isFocused ? 'yellow' : 'white'}>{quickSearchQuery || (isFocused ? placeholderText : '_')}</Text>
        </Text>
      </Box>
      
      {isFocused && (
        <Box marginTop={1}>
          <Text dimColor>Esc: navigate | Enter: apply | /: search</Text>
        </Box>
      )}
    </Box>
  );
}
