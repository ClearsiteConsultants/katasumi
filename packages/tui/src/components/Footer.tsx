import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import { debugLog } from '../utils/debug-logger.js';

interface FooterProps {
  mode: 'app-first' | 'full-phrase';
}

export function Footer({ mode }: FooterProps) {
  const commonShortcuts = '[Ctrl+C] Quitx | [?] Help | [Tab] Switch Mode | [a] Toggle AI | [p] Platform';
  const modeSpecific =
    mode === 'app-first'
      ? ' | [g] Go to App | [f] Filters'
      : '';

  // Debug: Track footer rendering
  useEffect(() => {
    debugLog('👟 Footer render:');
    debugLog(`  Mode: ${mode}`);
    debugLog(`  Height: 3 rows (1 marginTop + 2 border box)`);
    debugLog(`  Mode-specific shortcuts: ${modeSpecific ? 'YES' : 'NO'}`);
  }, [mode, modeSpecific]);

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
      <Text dimColor>
        {commonShortcuts}
        {modeSpecific}
      </Text>
    </Box>
  );
}
