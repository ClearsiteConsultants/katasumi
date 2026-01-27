import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppStore } from '../store.js';

interface FiltersBarProps {
  onQuickSearchChange: (query: string) => void;
}

export function FiltersBar({ onQuickSearchChange }: FiltersBarProps) {
  const focusSection = useAppStore((state) => state.focusSection);
  const quickSearchQuery = useAppStore((state) => state.quickSearchQuery);
  const filters = useAppStore((state) => state.filters);
  const results = useAppStore((state) => state.results);
  
  const isFocused = focusSection === 'filters';

  useInput(
    (input, key) => {
      if (!isFocused) return;

      if (key.backspace || key.delete) {
        onQuickSearchChange(quickSearchQuery.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        onQuickSearchChange(quickSearchQuery + input);
      }
    },
    { isActive: isFocused }
  );

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={isFocused ? 'cyan' : 'white'} paddingX={1}>
      <Box>
        <Text bold color={isFocused ? 'cyan' : 'white'}>
          Filters {isFocused && '(F3)'}
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
        <Text>
          Quick Search: <Text color="yellow">{quickSearchQuery || '_'}</Text>
        </Text>
      </Box>
    </Box>
  );
}
