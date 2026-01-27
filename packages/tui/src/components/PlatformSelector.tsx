import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import type { Platform } from '@katasumi/core';

export type PlatformOption = Platform | 'all';

interface PlatformSelectorProps {
  currentPlatform: PlatformOption;
  onSelect: (platform: PlatformOption) => void;
  onClose: () => void;
}

const PLATFORMS: PlatformOption[] = ['mac', 'windows', 'linux', 'all'];

const PLATFORM_LABELS: Record<PlatformOption, string> = {
  mac: 'macOS',
  windows: 'Windows',
  linux: 'Linux',
  all: 'All Platforms',
};

export function PlatformSelector({
  currentPlatform,
  onSelect,
  onClose,
}: PlatformSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(
    PLATFORMS.indexOf(currentPlatform)
  );

  useInput((input, key) => {
    if (key.escape) {
      onClose();
    } else if (key.return) {
      onSelect(PLATFORMS[selectedIndex]);
    } else if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : PLATFORMS.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < PLATFORMS.length - 1 ? prev + 1 : 0));
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      padding={1}
      width={30}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Select Platform
        </Text>
      </Box>

      {PLATFORMS.map((platform, index) => {
        const isSelected = index === selectedIndex;
        const isCurrent = platform === currentPlatform;

        return (
          <Box key={platform} marginBottom={0}>
            <Text
              color={isSelected ? 'cyan' : undefined}
              bold={isSelected}
              dimColor={!isSelected}
            >
              {isSelected ? '▸ ' : '  '}
              {PLATFORM_LABELS[platform]}
              {isCurrent && !isSelected ? ' ✓' : ''}
              {isCurrent && isSelected ? ' ✓' : ''}
            </Text>
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>
          ↑/↓ Navigate · Enter Select · Esc Close
        </Text>
      </Box>
    </Box>
  );
}
