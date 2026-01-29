import React from 'react';
import { useInput } from 'ink';
import { useAppStore } from '../store.js';

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
  const isInputMode = useAppStore((state) => state.isInputMode);

  useInput((input, key) => {
    // Always allow Ctrl+C to quit
    if (key.ctrl && input === 'c') {
      onQuit();
      return;
    }

    // Always allow Tab to toggle mode
    if (key.tab) {
      onToggleMode();
      return;
    }

    // Skip other global shortcuts when in input mode
    if (isInputMode) {
      return;
    }

    // Navigation mode shortcuts (only active when NOT in input mode)
    if (input === 'q') {
      onQuit();
    } else if (input === '?') {
      onShowHelp();
    } else if (input === 'a') {
      onToggleAI();
    } else if (input === 'p') {
      onShowPlatformSelector();
    }
  });

  return null;
}
