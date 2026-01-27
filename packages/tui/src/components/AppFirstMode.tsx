import React from 'react';
import { Box, Text } from 'ink';
import type { AppInfo } from '@katasumi/core';

interface AppFirstModeProps {
  selectedApp: AppInfo | null;
  view: 'search' | 'results' | 'detail';
}

export function AppFirstMode({ selectedApp, view }: AppFirstModeProps) {
  if (!selectedApp) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        marginY={1}
      >
        <Text bold>Select App</Text>
        <Box marginTop={1}>
          <Text dimColor>
            Start typing to search for an app...
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            (App selector will be implemented in next phase)
          </Text>
        </Box>
      </Box>
    );
  }

  if (view === 'results') {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        marginY={1}
      >
        <Text>
          App: <Text bold color="cyan">{selectedApp.displayName}</Text>
          {' '}
          ({selectedApp.shortcutCount} shortcuts)
        </Text>
        <Box marginTop={1}>
          <Text dimColor>
            Search and filter features will be implemented in next phase
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
}
