import React from 'react';
import { Box, Text } from 'ink';
import type { Platform } from '@katasumi/core';

interface HeaderProps {
  mode: 'app-first' | 'full-phrase';
  platform: Platform;
  aiEnabled: boolean;
}

function getPlatformDisplay(platform: Platform): string {
  switch (platform) {
    case 'mac':
      return 'macOS';
    case 'windows':
      return 'Windows';
    case 'linux':
      return 'Linux';
    default:
      return 'Unknown';
  }
}

export function Header({ mode, platform, aiEnabled }: HeaderProps) {
  const modeDisplay = mode === 'app-first' ? 'App-First' : 'Full-Phrase';
  const aiStatus = aiEnabled ? 'ON' : 'OFF';
  const platformDisplay = getPlatformDisplay(platform);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          Katasumi v1.0
        </Text>
      </Box>
      <Box paddingX={1}>
        <Text>
          Mode: <Text bold color="green">[{modeDisplay}]</Text>
          {' | '}
          Platform: <Text bold>{platformDisplay}</Text>
          {' | '}
          AI: <Text bold color={aiEnabled ? 'green' : 'gray'}>{aiStatus}</Text>
        </Text>
      </Box>
    </Box>
  );
}
