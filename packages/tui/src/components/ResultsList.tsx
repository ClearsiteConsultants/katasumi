import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Shortcut, Platform } from '@katasumi/core';

interface ResultsListProps {
  results: Shortcut[];
  platform: Platform;
  quickSearchQuery: string;
  onSelectShortcut?: (shortcut: Shortcut) => void;
}

export function ResultsList({ results, platform, quickSearchQuery, onSelectShortcut }: ResultsListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter results by quick search query
  const filteredResults = quickSearchQuery
    ? results.filter((shortcut) => {
        const searchText = `${shortcut.action} ${shortcut.context || ''} ${shortcut.category || ''}`.toLowerCase();
        return searchText.includes(quickSearchQuery.toLowerCase());
      })
    : results;

  // Handle keyboard input for navigation
  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(filteredResults.length - 1, prev + 1));
    } else if (key.return && onSelectShortcut && filteredResults[selectedIndex]) {
      onSelectShortcut(filteredResults[selectedIndex]);
    }
  });

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

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text bold>Results ({filteredResults.length}) - Use ↑↓ arrows, Enter to view details</Text>
      
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
          {filteredResults.slice(0, 15).map((shortcut, index) => {
            const keys = getKeysForPlatform(shortcut);
            const context = shortcut.context ? `[${shortcut.context}]` : '';
            const isSelected = index === selectedIndex;
            
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
          {filteredResults.length > 15 && (
            <Text dimColor>... and {filteredResults.length - 15} more</Text>
          )}
        </Box>
      )}
    </Box>
  );
}
