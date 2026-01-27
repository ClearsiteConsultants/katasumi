import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Shortcut, Platform, DatabaseAdapter } from '@katasumi/core';
import type { PlatformOption } from '../store.js';
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
          .slice(0, 5)
          .map(item => item.shortcut);
        
        setRelatedShortcuts(scored);
      } catch (error) {
        console.error('Error loading related shortcuts:', error);
        setRelatedShortcuts([]);
      }
    };

    loadRelated();
  }, [shortcut, dbAdapter]);

  // Handle keyboard input
  useInput((input, key) => {
    if (key.escape) {
      onBack();
    } else if (input === 'c' || input === 'C') {
      // Copy keys to clipboard
      handleCopy();
    } else if (input === 'o' || input === 'O') {
      // Open source URL
      handleOpenUrl();
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

  return (
    <Box flexDirection="column" marginY={1}>
      {/* Header */}
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
      >
        <Box>
          <Text bold color="cyan">{shortcut.app.toUpperCase()}</Text>
          {shortcut.context && (
            <>
              <Text> › </Text>
              <Text color="yellow">{shortcut.context}</Text>
            </>
          )}
          {shortcut.category && (
            <>
              <Text> › </Text>
              <Text dimColor>{shortcut.category}</Text>
            </>
          )}
        </Box>
      </Box>

      {/* Action */}
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        marginTop={1}
      >
        <Text bold>Action:</Text>
        <Text color="green" bold>  {shortcut.action}</Text>
      </Box>

      {/* Keys for all platforms */}
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        marginTop={1}
      >
        <Text bold>Keyboard Shortcuts:</Text>
        <Box marginTop={1} flexDirection="column">
          <Box>
            <Box width={12}>
              <Text color={platform === 'mac' ? 'cyan' : 'gray'}>macOS:</Text>
            </Box>
            <Text color={platform === 'mac' ? 'yellow' : 'gray'}>{allKeys.mac}</Text>
          </Box>
          <Box>
            <Box width={12}>
              <Text color={platform === 'windows' ? 'cyan' : 'gray'}>Windows:</Text>
            </Box>
            <Text color={platform === 'windows' ? 'yellow' : 'gray'}>{allKeys.windows}</Text>
          </Box>
          <Box>
            <Box width={12}>
              <Text color={platform === 'linux' ? 'cyan' : 'gray'}>Linux:</Text>
            </Box>
            <Text color={platform === 'linux' ? 'yellow' : 'gray'}>{allKeys.linux}</Text>
          </Box>
        </Box>
      </Box>

      {/* Tags */}
      {shortcut.tags.length > 0 && (
        <Box
          flexDirection="column"
          borderStyle="single"
          paddingX={2}
          paddingY={1}
          marginTop={1}
        >
          <Text bold>Tags:</Text>
          <Text>  {shortcut.tags.join(', ')}</Text>
        </Box>
      )}

      {/* Source */}
      {shortcut.source && (
        <Box
          flexDirection="column"
          borderStyle="single"
          paddingX={2}
          paddingY={1}
          marginTop={1}
        >
          <Text bold>Source:</Text>
          <Box marginTop={1}>
            <Text>  Type: {shortcut.source.type}</Text>
          </Box>
          {shortcut.source.url && (
            <Box>
              <Text>  URL: </Text>
              <Text color="blue" dimColor>{shortcut.source.url}</Text>
            </Box>
          )}
          {shortcut.source.confidence && (
            <Box>
              <Text>  Confidence: {Math.round(shortcut.source.confidence * 100)}%</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Related shortcuts */}
      {relatedShortcuts.length > 0 && (
        <Box
          flexDirection="column"
          borderStyle="single"
          paddingX={2}
          paddingY={1}
          marginTop={1}
        >
          <Text bold>Related Shortcuts:</Text>
          <Box flexDirection="column" marginTop={1}>
            {relatedShortcuts.map((related) => {
              const relatedKeys = platform === 'all' 
                ? (related.keys.mac || related.keys.windows || related.keys.linux || 'N/A')
                : (related.keys[platform as Platform] || related.keys.linux || related.keys.windows || 'N/A');
              return (
                <Box key={related.id}>
                  <Box width={20}>
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
        <Box marginTop={1}>
          {copyStatus && <Text color="green">{copyStatus}</Text>}
          {urlOpenStatus && <Text color="green">{urlOpenStatus}</Text>}
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} borderStyle="single" paddingX={2}>
        <Text>
          <Text bold color="cyan">c</Text>
          <Text dimColor>:copy </Text>
          <Text bold color="cyan">o</Text>
          <Text dimColor>:open-url </Text>
          <Text bold color="cyan">Esc</Text>
          <Text dimColor>:back</Text>
        </Text>
      </Box>
    </Box>
  );
}
