import React from 'react';
import { Box, Text } from 'ink';
import type { Shortcut, Platform } from '@katasumi/core';

interface ResultsListProps {
  results: Shortcut[];
  platform: Platform;
  quickSearchQuery: string;
}

export function ResultsList({ results, platform, quickSearchQuery }: ResultsListProps) {
  // Filter results by quick search query
  const filteredResults = quickSearchQuery
    ? results.filter((shortcut) => {
        const searchText = `${shortcut.action} ${shortcut.context || ''} ${shortcut.category || ''}`.toLowerCase();
        return searchText.includes(quickSearchQuery.toLowerCase());
      })
    : results;

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
      <Text bold>Results ({filteredResults.length})</Text>
      
      {filteredResults.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor>No shortcuts found</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {filteredResults.slice(0, 15).map((shortcut) => {
            const keys = getKeysForPlatform(shortcut);
            const context = shortcut.context ? `[${shortcut.context}]` : '';
            
            return (
              <Box key={shortcut.id}>
                <Box width={25}>
                  <Text color="yellow">{keys}</Text>
                </Box>
                <Box width={40}>
                  <Text>{shortcut.action}</Text>
                </Box>
                {context && (
                  <Box>
                    <Text dimColor>{context}</Text>
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
