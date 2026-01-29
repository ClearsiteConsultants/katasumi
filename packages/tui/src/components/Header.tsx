import React from 'react';
import { Box, Text } from 'ink';
import type { PlatformOption } from '../store.js';
import { isAIConfigured } from '../utils/config.js';

interface HeaderProps {
  mode: 'app-first' | 'full-phrase';
  platform: PlatformOption;
  aiEnabled: boolean;
}

function getPlatformDisplay(platform: PlatformOption): string {
  switch (platform) {
    case 'mac':
      return 'macOS';
    case 'windows':
      return 'Windows';
    case 'linux':
      return 'Linux';
    case 'all':
      return 'All Platforms';
    default:
      return 'Unknown';
  }
}

export function Header({ mode, platform, aiEnabled }: HeaderProps) {
  const modeDisplay = mode === 'app-first' ? 'App-First' : 'Full-Phrase';
  const aiConfigured = isAIConfigured();
  const aiStatus = aiEnabled ? 'ON' : (aiConfigured ? 'OFF' : 'OFF - Not Configured');
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
