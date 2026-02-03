import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Shortcut, Platform, DatabaseAdapter } from '@katasumi/core';
import type { PlatformOption } from '../store.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import clipboard from 'clipboardy';
import open from 'open';

interface DetailViewProps {
  shortcut: Shortcut;
  platform: PlatformOption;
  onBack: () => void;
  dbAdapter: DatabaseAdapter;
}

export function DetailView({ shortcut, platform, onBack, dbAdapter }: DetailViewProps) {
  const [relatedShortcuts, setRelatedShortcuts] = useState<Shortcut[]>([]);
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [urlOpenStatus, setUrlOpenStatus] = useState<string>('');
  const [scrollOffset, setScrollOffset] = useState(0);
  const [atBoundary, setAtBoundary] = useState<'top' | 'bottom' | null>(null);
  
  const terminalSize = useTerminalSize();
  const maxRelatedShortcuts = Math.max(2, Math.min(5, Math.floor(terminalSize.availableRows / 3)));

  // Load related shortcuts
  useEffect(() => {
    const loadRelated = async () => {
      try {
        // Get shortcuts from the same app with similar category or tags
        const allShortcuts = await dbAdapter.getShortcutsByApp(shortcut.app);
        
        // Filter and score shortcuts
        const scored = allShortcuts
          .filter(s => s.id !== shortcut.id)
          .map(s => {
            let score = 0;
            // Same category
            if (s.category === shortcut.category && shortcut.category) score += 3;
            // Same context
            if (s.context === shortcut.context && shortcut.context) score += 2;
            // Shared tags
            const sharedTags = s.tags.filter(t => shortcut.tags.includes(t));
            score += sharedTags.length;
            return { shortcut: s, score };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, maxRelatedShortcuts)
          .map(item => item.shortcut);
        
        setRelatedShortcuts(scored);
      } catch (error) {
        console.error('Error loading related shortcuts:', error);
        setRelatedShortcuts([]);
      }
    };

    loadRelated();
  }, [shortcut, dbAdapter, maxRelatedShortcuts]);

  // Handle keyboard input
  useInput((input, key) => {
    const maxScroll = relatedShortcuts.length;
    const halfPage = Math.floor(maxRelatedShortcuts / 2);
    const fullPage = maxRelatedShortcuts;

    // Clear boundary feedback after a short delay
    const clearBoundary = () => {
      setTimeout(() => setAtBoundary(null), 1000);
    };

    if (key.escape) {
      onBack();
    } else if (input === 'c' || input === 'C') {
      // Copy keys to clipboard
      handleCopy();
    } else if (input === 'o' || input === 'O') {
      // Open source URL
      handleOpenUrl();
    } else if (key.upArrow) {
      setScrollOffset(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setScrollOffset(prev => Math.min(maxScroll, prev + 1));
    } else if (key.ctrl && input === 'u') {
      // Ctrl+U: Scroll up half page
      const newOffset = Math.max(0, scrollOffset - halfPage);
      if (newOffset === 0 && scrollOffset === 0) {
        setAtBoundary('top');
        clearBoundary();
      }
      setScrollOffset(newOffset);
    } else if (key.ctrl && input === 'd') {
      // Ctrl+D: Scroll down half page
      const newOffset = Math.min(maxScroll, scrollOffset + halfPage);
      if (newOffset === maxScroll && scrollOffset === maxScroll) {
        setAtBoundary('bottom');
        clearBoundary();
      }
      setScrollOffset(newOffset);
    } else if (key.ctrl && input === 'b') {
      // Ctrl+B: Scroll up full page
      const newOffset = Math.max(0, scrollOffset - fullPage);
      if (newOffset === 0 && scrollOffset === 0) {
        setAtBoundary('top');
        clearBoundary();
      }
      setScrollOffset(newOffset);
    } else if (key.ctrl && input === 'f') {
      // Ctrl+F: Scroll down full page
      const newOffset = Math.min(maxScroll, scrollOffset + fullPage);
      if (newOffset === maxScroll && scrollOffset === maxScroll) {
        setAtBoundary('bottom');
        clearBoundary();
      }
      setScrollOffset(newOffset);
    }
  });

  const handleCopy = async () => {
    try {
      const keys = getKeysForPlatform();
      if (keys !== 'N/A') {
        await clipboard.write(keys);
        setCopyStatus('✓ Copied to clipboard!');
        setTimeout(() => setCopyStatus(''), 2000);
      } else {
        setCopyStatus('⚠ No keys available for this platform');
        setTimeout(() => setCopyStatus(''), 2000);
      }
    } catch (error) {
      setCopyStatus('✗ Failed to copy');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const handleOpenUrl = async () => {
    try {
      if (shortcut.source?.url) {
        await open(shortcut.source.url);
        setUrlOpenStatus('✓ Opening URL in browser...');
        setTimeout(() => setUrlOpenStatus(''), 2000);
      } else {
        setUrlOpenStatus('⚠ No source URL available');
        setTimeout(() => setUrlOpenStatus(''), 2000);
      }
    } catch (error) {
      setUrlOpenStatus('✗ Failed to open URL');
      setTimeout(() => setUrlOpenStatus(''), 2000);
    }
  };

  const getKeysForPlatform = (): string => {
    if (platform === 'all') {
      // For "all", prefer mac, then windows, then linux
      return shortcut.keys.mac || shortcut.keys.windows || shortcut.keys.linux || 'N/A';
    }
    
    switch (platform) {
      case 'mac':
        return shortcut.keys.mac || shortcut.keys.linux || shortcut.keys.windows || 'N/A';
      case 'windows':
        return shortcut.keys.windows || shortcut.keys.linux || 'N/A';
      case 'linux':
        return shortcut.keys.linux || shortcut.keys.windows || 'N/A';
      default:
        return 'N/A';
    }
  };

  const getAllKeys = () => {
    return {
      mac: shortcut.keys.mac || 'N/A',
      windows: shortcut.keys.windows || 'N/A',
      linux: shortcut.keys.linux || 'N/A',
    };
  };

  const allKeys = getAllKeys();
  const currentKeys = getKeysForPlatform();
  
  // Show terminal size warnings
  if (terminalSize.isTooSmall) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="yellow"
        paddingX={2}
        paddingY={1}
        marginY={1}
      >
        <Text color="yellow" bold>⚠ Terminal too small</Text>
        <Text color="yellow">Please resize your terminal to at least 20 rows (current: {terminalSize.rows})</Text>
        <Box marginTop={1}>
          <Text dimColor>Press Esc to go back</Text>
        </Box>
      </Box>
    );
  }

  if (terminalSize.isTooNarrow) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="yellow"
        paddingX={2}
        paddingY={1}
        marginY={1}
      >
        <Text color="yellow" bold>⚠ Terminal too narrow</Text>
        <Text color="yellow">Please resize your terminal to at least 80 columns (current: {terminalSize.columns})</Text>
        <Box marginTop={1}>
          <Text dimColor>Press Esc to go back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      {/* Compact header with all main info */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1} flexShrink={0}>
        <Text bold color="cyan">{shortcut.app}</Text>
        {shortcut.context && (
          <>
            <Text dimColor> › </Text>
            <Text>{shortcut.context}</Text>
          </>
        )}
        {shortcut.category && (
          <>
            <Text dimColor> › </Text>
            <Text dimColor>{shortcut.category}</Text>
          </>
        )}
        <Text dimColor> | </Text>
        <Text color="green" bold>{shortcut.action}</Text>
      </Box>

      {/* Compact keys - all platforms in one box */}
      <Box borderStyle="single" paddingX={1} marginTop={1} flexShrink={0}>
        <Box gap={1}>
          <Text color={platform === 'mac' ? 'cyan' : 'gray'}>⌘</Text>
          <Text color={platform === 'mac' ? 'yellow' : 'gray'}>{allKeys.mac}</Text>
          <Text dimColor>|</Text>
          <Text color={platform === 'windows' ? 'cyan' : 'gray'}>⊞</Text>
          <Text color={platform === 'windows' ? 'yellow' : 'gray'}>{allKeys.windows}</Text>
          <Text dimColor>|</Text>
          <Text color={platform === 'linux' ? 'cyan' : 'gray'}>🐧</Text>
          <Text color={platform === 'linux' ? 'yellow' : 'gray'}>{allKeys.linux}</Text>
        </Box>
      </Box>

      {/* Compact metadata: tags + source in one line */}
      <Box paddingX={1} flexShrink={0}>
        {shortcut.tags.length > 0 && (
          <>
            <Text dimColor>Tags: </Text>
            <Text>{shortcut.tags.join(', ')}</Text>
            <Text dimColor> | </Text>
          </>
        )}
        {shortcut.source && (
          <>
            <Text dimColor>Src: {shortcut.source.type}</Text>
            {shortcut.source.url && (
              <>
                <Text dimColor> </Text>
                <Text color="blue" dimColor>(url)</Text>
              </>
            )}
          </>
        )}
      </Box>

      {/* Related shortcuts - scrollable area */}
      {relatedShortcuts.length > 0 && (
        <Box flexDirection="column" borderStyle="single" paddingX={1} marginTop={1} flexGrow={1}>
          <Box flexShrink={0}>
            <Text bold>Related ({relatedShortcuts.length}):</Text>
          </Box>
          <Box flexDirection="column">
            {relatedShortcuts.map((related) => {
              const relatedKeys = platform === 'all' 
                ? (related.keys.mac || related.keys.windows || related.keys.linux || 'N/A')
                : (related.keys[platform as Platform] || related.keys.linux || related.keys.windows || 'N/A');
              return (
                <Box key={related.id}>
                  <Box width={18}>
                    <Text color="yellow">{relatedKeys}</Text>
                  </Box>
                  <Text>{related.action}</Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Status messages */}
      {(copyStatus || urlOpenStatus) && (
        <Box paddingX={1} flexShrink={0}>
          {copyStatus && <Text color="green">{copyStatus}</Text>}
          {urlOpenStatus && <Text color="green">{urlOpenStatus}</Text>}
        </Box>
      )}

      {/* Compact footer */}
      <Box borderStyle="single" paddingX={1} justifyContent="space-between" flexShrink={0}>
        <Text dimColor>
          <Text bold color="cyan">c</Text>:copy <Text bold color="cyan">o</Text>:url <Text bold color="cyan">Esc</Text>:back
        </Text>
        {atBoundary && (
          <Text color="yellow">
            {atBoundary === 'top' ? '▲' : '▼'}
          </Text>
        )}
      </Box>
    </Box>
  );
}
