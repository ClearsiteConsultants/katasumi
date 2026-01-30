'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'

export function AppSelector() {
  const [searchQuery, setSearchQuery] = useState('')
  const [apps, setApps] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const [isInputMode, setIsInputMode] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchApps() {
      try {
        const response = await fetch('/api/apps')
        const data = await response.json()
        setApps(data.apps || [])
      } catch (error) {
        console.error('Failed to fetch apps:', error)
        // Fallback to popular apps
        setApps(['vim', 'tmux', 'vscode', 'git', 'bash', 'macos', 'windows', 'gnome', 'chrome', 'firefox'])
      } finally {
        setLoading(false)
      }
    }
    fetchApps()
  }, [])

  const filteredApps = apps.filter((app) =>
    app.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectApp = (app: string) => {
    useStore.setState({ selectedApp: app })
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // In input mode
      if (isInputMode) {
        if (e.key === 'Enter' && filteredApps.length > 0) {
          e.preventDefault()
          // Select first matching app
          handleSelectApp(filteredApps[0])
        } else if (e.key === 'Escape') {
          e.preventDefault()
          // Exit input mode, enter navigation mode
          setIsInputMode(false)
          setFocusedIndex(0)
          inputRef.current?.blur()
        }
      } 
      // In navigation mode
      else {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setFocusedIndex((prev) => (prev + 1) % filteredApps.length)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setFocusedIndex((prev) => (prev - 1 + filteredApps.length) % filteredApps.length)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setFocusedIndex((prev) => (prev + 1) % filteredApps.length)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setFocusedIndex((prev) => (prev - 1 + filteredApps.length) % filteredApps.length)
        } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < filteredApps.length) {
          e.preventDefault()
          handleSelectApp(filteredApps[focusedIndex])
        } else if (e.key === 'Escape') {
          e.preventDefault()
          // Return to input mode
          setIsInputMode(true)
          setFocusedIndex(-1)
          inputRef.current?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isInputMode, focusedIndex, filteredApps])

  // Reset to input mode when search query changes
  useEffect(() => {
    if (searchQuery && !isInputMode) {
      setIsInputMode(true)
      setFocusedIndex(-1)
    }
  }, [searchQuery, isInputMode])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading applications...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search applications... (Press Enter to select first, Escape to navigate with arrows)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        autoFocus
      />
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredApps.map((app, index) => (
          <button
            key={app}
            onClick={() => handleSelectApp(app)}
            className={`px-6 py-4 rounded-lg border-2 transition-colors font-medium ${
              !isInputMode && focusedIndex === index
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/40 text-gray-900 dark:text-white ring-2 ring-primary-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-900 dark:text-white'
            }`}
          >
            {app}
          </button>
        ))}
      </div>
      {filteredApps.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
          No applications found
        </p>
      )}
    </div>
  )
}
