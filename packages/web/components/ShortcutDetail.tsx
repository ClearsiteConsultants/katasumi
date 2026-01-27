'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { Shortcut } from '@katasumi/core'
import { useStore } from '@/lib/store'

export function ShortcutDetail() {
  const shortcut = useStore((state) => state.selectedShortcut)
  const selectShortcut = useStore((state) => state.selectShortcut)
  const platform = useStore((state) => state.platform)
  const results = useStore((state) => state.results)
  const [copied, setCopied] = useState(false)

  const getKeysForPlatform = () => {
    if (!shortcut) return ''
    if (platform === 'all') {
      return shortcut.keys.mac || shortcut.keys.windows || shortcut.keys.linux || ''
    }
    if (platform === 'mac') return shortcut.keys.mac || ''
    if (platform === 'windows') return shortcut.keys.windows || ''
    if (platform === 'linux') return shortcut.keys.linux || ''
    return ''
  }

  const copyToClipboard = async () => {
    const keys = getKeysForPlatform()
    if (!keys) return
    
    try {
      await navigator.clipboard.writeText(keys)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const openDocs = () => {
    if (shortcut?.source?.url) {
      window.open(shortcut.source.url, '_blank', 'noopener,noreferrer')
    }
  }

  // Find related shortcuts (same app and category)
  const getRelatedShortcuts = (): Shortcut[] => {
    if (!shortcut) return []
    return results
      .filter((s) => 
        s.id !== shortcut.id && 
        s.app === shortcut.app && 
        s.category === shortcut.category
      )
      .slice(0, 5) // Limit to 5 related shortcuts
  }

  const relatedShortcuts = getRelatedShortcuts()

  return (
    <Dialog.Root open={!!shortcut} onOpenChange={(open) => !open && selectShortcut(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-3xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {shortcut && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {shortcut.app}
                  </span>
                  {shortcut.category && (
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      • {shortcut.category}
                    </span>
                  )}
                </div>
                <Dialog.Title className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {shortcut.action}
                </Dialog.Title>
                {shortcut.context && (
                  <Dialog.Description className="text-gray-600 dark:text-gray-400">
                    {shortcut.context}
                  </Dialog.Description>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Keyboard Shortcut
                </h3>
                <div className="flex items-center gap-3">
                  <kbd className="kbd text-2xl px-6 py-3">
                    {getKeysForPlatform()}
                  </kbd>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                  {shortcut.source?.url && (
                    <button
                      onClick={openDocs}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors"
                    >
                      Open Docs
                    </button>
                  )}
                </div>
              </div>

              {(shortcut.keys.mac || shortcut.keys.windows || shortcut.keys.linux) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Platform Variants
                  </h3>
                  <div className="space-y-2">
                    {shortcut.keys.mac && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-20">macOS:</span>
                        <kbd className="kbd">{shortcut.keys.mac}</kbd>
                      </div>
                    )}
                    {shortcut.keys.windows && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Windows:</span>
                        <kbd className="kbd">{shortcut.keys.windows}</kbd>
                      </div>
                    )}
                    {shortcut.keys.linux && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Linux:</span>
                        <kbd className="kbd">{shortcut.keys.linux}</kbd>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {shortcut.tags && shortcut.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {shortcut.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {relatedShortcuts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Related Shortcuts
                  </h3>
                  <div className="space-y-2">
                    {relatedShortcuts.map((related) => (
                      <button
                        key={related.id}
                        onClick={() => selectShortcut(related)}
                        className="w-full text-left px-4 py-2 rounded border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-gray-900 dark:text-white font-medium">
                            {related.action}
                          </span>
                          <kbd className="kbd text-xs flex-shrink-0">
                            {platform === 'all'
                              ? related.keys.mac || related.keys.windows || related.keys.linux || ''
                              : platform === 'mac' ? related.keys.mac || ''
                              : platform === 'windows' ? related.keys.windows || ''
                              : related.keys.linux || ''
                            }
                          </kbd>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {shortcut.source && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Source
                  </h3>
                  <a
                    href={shortcut.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
                  >
                    {shortcut.source.url}
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Type: {shortcut.source.type} • Confidence: {(shortcut.source.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              )}

              <Dialog.Close asChild>
                <button
                  className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-900 dark:focus:ring-gray-800 dark:data-[state=open]:bg-gray-800"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </Dialog.Close>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
