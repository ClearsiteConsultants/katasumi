import React, { useState } from 'react';
import { Box } from 'ink';
import { useAppStore } from './store.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { AppFirstMode } from './components/AppFirstMode.js';
import { FullPhraseMode } from './components/FullPhraseMode.js';
import { GlobalKeybindings } from './components/GlobalKeybindings.js';
import { HelpOverlay } from './components/HelpOverlay.js';

export default function App() {
  const [showHelp, setShowHelp] = useState(false);
  const mode = useAppStore((state) => state.mode);
  const view = useAppStore((state) => state.view);
  const platform = useAppStore((state) => state.platform);
  const aiEnabled = useAppStore((state) => state.aiEnabled);
  const selectedApp = useAppStore((state) => state.selectedApp);
  const toggleMode = useAppStore((state) => state.toggleMode);
  const toggleAI = useAppStore((state) => state.toggleAI);

  const handleQuit = () => {
    process.exit(0);
  };

  const handleShowHelp = () => {
    setShowHelp(!showHelp);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Header mode={mode} platform={platform} aiEnabled={aiEnabled} />

      {showHelp ? (
        <HelpOverlay onClose={() => setShowHelp(false)} />
      ) : (
        <>
          {mode === 'app-first' ? (
            <AppFirstMode selectedApp={selectedApp} view={view} />
          ) : (
            <FullPhraseMode aiEnabled={aiEnabled} view={view} />
          )}
        </>
      )}

      <Footer mode={mode} />

      <GlobalKeybindings
        onToggleMode={toggleMode}
        onToggleAI={toggleAI}
        onShowHelp={handleShowHelp}
        onQuit={handleQuit}
      />
    </Box>
  );
}
