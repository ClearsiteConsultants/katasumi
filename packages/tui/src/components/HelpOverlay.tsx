import React from 'react';
import { Box, Text } from 'ink';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

interface HelpOverlayProps {
  onClose: () => void;
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  const terminalSize = useTerminalSize();
  
  // Show warning if terminal is too small
  if (terminalSize.isTooSmall || terminalSize.isTooNarrow) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="yellow"
        paddingX={2}
        paddingY={1}
      >
        <Text color="yellow" bold>⚠ Terminal too small to show help</Text>
        <Text color="yellow">
          {terminalSize.isTooSmall && `Resize to at least 20 rows (current: ${terminalSize.rows})`}
          {terminalSize.isTooNarrow && `Resize to at least 80 columns (current: ${terminalSize.columns})`}
        </Text>
        <Box marginTop={1}>
          <Text dimColor>[Esc] Close</Text>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
    >
      <Text bold color="yellow">
        Keyboard Shortcuts
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Global:</Text>
        <Text>  Ctrl+C / q       Quit</Text>
        <Text>  ?                Show this help</Text>
        <Text>  a                Toggle AI</Text>
        <Text>  p                Platform selector</Text>
        <Text dimColor />
        <Text bold>Navigation:</Text>
        <Text>  /                Focus search</Text>
        <Text>  ↑↓               Navigate results (single step)</Text>
        <Text>  Ctrl+U           Scroll up half page</Text>
        <Text>  Ctrl+D           Scroll down half page</Text>
        <Text>  Ctrl+B           Scroll up full page</Text>
        <Text>  Ctrl+F           Scroll down full page</Text>
        <Text>  Enter            Select / Show details</Text>
        <Text>  Esc              Back / Close / Unfocus</Text>
        <Text dimColor />
        <Text bold>Search Modes:</Text>
        <Text>  Tab              Toggle App-First ↔ Full-Phrase</Text>
        <Text>  g                Go to app selector (App-First)</Text>
        <Text>  f                Focus filters (App-First)</Text>
        <Text dimColor />
        <Text bold>Detail View:</Text>
        <Text>  c                Copy keys to clipboard</Text>
        <Text>  o                Open documentation URL</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>[Esc] Close Help</Text>
      </Box>
    </Box>
  );
}
