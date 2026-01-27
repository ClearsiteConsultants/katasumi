import React, { useEffect } from 'react';
import { useInput } from 'ink';

interface GlobalKeybindingsProps {
  onToggleMode: () => void;
  onToggleAI: () => void;
  onShowHelp: () => void;
  onShowPlatformSelector: () => void;
  onQuit: () => void;
}

export function GlobalKeybindings({
  onToggleMode,
  onToggleAI,
  onShowHelp,
  onShowPlatformSelector,
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
    // Platform selector on Cmd+P (meta+p)
    else if (key.meta && input === 'p') {
      onShowPlatformSelector();
    }
  });

  // Handle F-keys via process stdin
  useEffect(() => {
    const handleKeypress = (str: string, key: any) => {
      if (key && key.name === 'f4') {
        onToggleAI();
      } else if (key && key.name === 'f5') {
        onShowPlatformSelector();
      }
    };

    if (process.stdin.isTTY) {
      process.stdin.on('keypress', handleKeypress);
      return () => {
        process.stdin.removeListener('keypress', handleKeypress);
      };
    }
  }, [onToggleAI, onShowPlatformSelector]);

  return null;
}
