import React, { useEffect } from 'react';
import { useInput } from 'ink';

interface GlobalKeybindingsProps {
  onToggleMode: () => void;
  onToggleAI: () => void;
  onShowHelp: () => void;
  onQuit: () => void;
}

export function GlobalKeybindings({
  onToggleMode,
  onToggleAI,
  onShowHelp,
  onQuit,
}: GlobalKeybindingsProps) {
  useInput((input, key) => {
    // Quit on Ctrl+C or q
    if (key.ctrl && input === 'c') {
      onQuit();
    } else if (input === 'q') {
      onQuit();
    }
    // Help on ?
    else if (input === '?') {
      onShowHelp();
    }
    // Toggle mode on Tab
    else if (key.tab) {
      onToggleMode();
    }
  });

  // Handle F-keys via process stdin
  useEffect(() => {
    const handleKeypress = (str: string, key: any) => {
      if (key && key.name === 'f4') {
        onToggleAI();
      }
    };

    if (process.stdin.isTTY) {
      process.stdin.on('keypress', handleKeypress);
      return () => {
        process.stdin.removeListener('keypress', handleKeypress);
      };
    }
  }, [onToggleAI]);

  return null;
}
