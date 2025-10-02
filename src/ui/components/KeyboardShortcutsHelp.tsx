/**
 * @fileoverview Keyboard shortcuts help component
 * @author @darianrosebrook
 */

import React, { useState } from 'react'
import { X, Search, Lightbulb } from 'lucide-react'
import { useKeyboardShortcuts } from '@/ui/hooks/use-keyboard-shortcuts'
import { ShortcutCategory, KeyboardShortcut } from '@/types'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Keyboard shortcuts help modal component
 */
export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const { getAllShortcuts } = useKeyboardShortcuts()
  // PLACEHOLDER: Keyboard shortcuts help functionality - requires shortcuts help system
  // const { getShortcutsHelp } = useKeyboardShortcuts()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<
    ShortcutCategory | 'all'
  >('all')

  if (!isOpen) return null

  const shortcuts = getAllShortcuts()

  // Filter shortcuts based on search and category
  const filteredShortcuts = shortcuts.filter((shortcut) => {
    const matchesSearch =
      searchTerm === '' ||
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatShortcutKey(shortcut)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === 'all' || shortcut.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Group filtered shortcuts by category
  const groupedShortcuts = filteredShortcuts.reduce(
    (groups, shortcut) => {
      const category = shortcut.category
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(shortcut)
      return groups
    },
    {} as Record<ShortcutCategory, KeyboardShortcut[]>
  )

  const categories = Object.values(ShortcutCategory)

  return (
    <div className="keyboard-shortcuts-modal-overlay" onClick={onClose}>
      <div
        className="keyboard-shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="keyboard-shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="keyboard-shortcuts-filters">
          <div className="search-input-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-tabs">
            <button
              className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="keyboard-shortcuts-content">
          {Object.keys(groupedShortcuts).length === 0 ? (
            <div className="no-shortcuts">
              <p>No shortcuts found matching your criteria.</p>
            </div>
          ) : (
            Object.entries(groupedShortcuts).map(
              ([category, categoryShortcuts]) => (
                <div key={category} className="shortcuts-category">
                  <h3 className="category-title">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  <div className="shortcuts-list">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div key={index} className="shortcut-item">
                        <div className="shortcut-keys">
                          {formatShortcutKey(shortcut)
                            .split(' + ')
                            .map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                <kbd className="key">{key}</kbd>
                                {keyIndex <
                                  formatShortcutKey(shortcut).split(' + ')
                                    .length -
                                    1 && (
                                  <span className="key-separator">+</span>
                                )}
                              </React.Fragment>
                            ))}
                        </div>
                        <div className="shortcut-description">
                          {shortcut.description}
                          {shortcut.context && (
                            <span className="shortcut-context">
                              ({shortcut.context})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )
          )}
        </div>

        <div className="keyboard-shortcuts-footer">
          <p className="shortcuts-tip">
            <Lightbulb size={14} className="tip-icon" />
            Tip: Use <kbd className="key">?</kbd> to quickly access this help
            anytime
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Format shortcut key for display
 */
function formatShortcutKey(shortcut: KeyboardShortcut): string {
  const parts = []

  if (shortcut.meta) parts.push('Cmd')
  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.alt) parts.push('Alt')
  if (shortcut.shift) parts.push('Shift')

  // Format the main key
  let key = shortcut.key.toUpperCase()
  if (key === ' ') key = 'Space'
  if (key === 'ARROWLEFT') key = '←'
  if (key === 'ARROWRIGHT') key = '→'
  if (key === 'ARROWUP') key = '↑'
  if (key === 'ARROWDOWN') key = '↓'
  if (key === 'DELETE') key = 'Del'
  if (key === 'BACKSPACE') key = '⌫'
  if (key === 'ENTER') key = '↵'
  if (key === 'ESCAPE') key = 'Esc'
  if (key === 'TAB') key = 'Tab'

  parts.push(key)

  return parts.join(' + ')
}
