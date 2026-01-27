import React from 'react';
import { Box, Text } from 'ink';

interface FullPhraseModeProps {
  aiEnabled: boolean;
  view: 'search' | 'results' | 'detail';
}

export function FullPhraseMode({ aiEnabled, view }: FullPhraseModeProps) {
  if (view === 'search' || view === 'results') {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        marginY={1}
      >
        <Text bold>Natural Language Search</Text>
        <Box marginTop={1}>
          <Text dimColor>
            Type a question or phrase to search across all apps...
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            Example: "How do I split my screen vertically?"
          </Text>
        </Box>
        <Box marginTop={1}>
          {aiEnabled ? (
            <Text color="green">
              💡 AI search is enabled - results will be AI-ranked
            </Text>
          ) : (
            <Text color="yellow">
              ⚡ Keyword search only (no AI). Press F4 to enable AI search.
            </Text>
          )}
        </Box>
      </Box>
    );
  }

  return null;
}
