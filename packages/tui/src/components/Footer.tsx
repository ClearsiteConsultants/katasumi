import React from 'react';
import { Box, Text } from 'ink';

interface FooterProps {
  mode: 'app-first' | 'full-phrase';
}

export function Footer({ mode }: FooterProps) {
  const commonShortcuts = '[Ctrl+C] Quit | [?] Help | [Tab] Switch Mode | [F4] Toggle AI';
  const modeSpecific =
    mode === 'app-first'
      ? ' | [F2] Change App | [F3] Filters'
      : ' | [F5] Platform';

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
      <Text dimColor>
        {commonShortcuts}
        {modeSpecific}
      </Text>
    </Box>
  );
}
