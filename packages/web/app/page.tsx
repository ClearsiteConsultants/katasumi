'use client'

import { AppFirstMode } from '@/components/AppFirstMode'
import { FullPhraseMode } from '@/components/FullPhraseMode'
import { HelpOverlay } from '@/components/HelpOverlay'
import { PlatformSelector } from '@/components/PlatformSelector'
import { SettingsOverlay } from '@/components/SettingsOverlay'
import { useStore } from '@/lib/store'
import { useEffect } from 'react'

export default function Home() {
  const mode = useStore((state) => state.mode)
  const showHelp = useStore((state) => state.showHelp)
  const showPlatformSelector = useStore((state) => state.showPlatformSelector)
  const showSettings = useStore((state) => state.showSettings)
  const selectedShortcut = useStore((state) => state.selectedShortcut)
  const toggleMode = useStore((state) => state.toggleMode)
  const toggleAI = useStore((state) => state.toggleAI)
  const setShowHelp = useStore((state) => state.setShowHelp)
  const setShowPlatformSelector = useStore((state) => state.setShowPlatformSelector)
  const setShowSettings = useStore((state) => state.setShowSettings)
  const selectShortcut = useStore((state) => state.selectShortcut)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      
      // Tab - Toggle mode (only if not typing)
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isTyping) {
        e.preventDefault()
        toggleMode()
      }
      
      // / - Focus search input (only if not typing)
      if (e.key === '/' && !isTyping) {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        searchInput?.focus()
      }
      
      // Cmd/Ctrl+A - Toggle AI
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        toggleAI()
      }
      
      // Cmd/Ctrl+P - Platform selector
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setShowPlatformSelector(true)
      }
      
      // ? - Help overlay (only if not typing)
      if (e.key === '?' && !isTyping) {
        e.preventDefault()
        setShowHelp(true)
      }
      
      // Cmd/Ctrl+, - Settings
      if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowSettings(true)
      }
      
      // Escape - Close overlays
      if (e.key === 'Escape') {
        if (selectedShortcut) {
          selectShortcut(null)
        } else if (showHelp || showPlatformSelector || showSettings) {
          setShowHelp(false)
          setShowPlatformSelector(false)
          setShowSettings(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleMode, toggleAI, setShowHelp, setShowPlatformSelector, setShowSettings, selectedShortcut, selectShortcut, showHelp, showPlatformSelector, showSettings])

  return (
    <>
      {mode === 'app-first' ? <AppFirstMode /> : <FullPhraseMode />}
      {showHelp && <HelpOverlay />}
      {showPlatformSelector && <PlatformSelector />}
      {showSettings && <SettingsOverlay />}
    </>
  )
}
