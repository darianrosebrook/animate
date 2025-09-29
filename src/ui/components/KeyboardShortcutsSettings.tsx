/**
 * @fileoverview Keyboard shortcuts settings component
 * @author @darianrosebrook
 */

import React, { useState, useEffect } from 'react'
// TODO: Use useCallback for performance optimization
// import { useCallback } from 'react'
import {
  X,
  // TODO: Use Search icon for search functionality
  // Search,
  Edit,
  Trash2,
  Lightbulb,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { useKeyboardShortcuts } from '@/ui/hooks/use-keyboard-shortcuts'
import {
  KeyboardShortcut,
  ShortcutCategory,
  // TODO: Use KeyboardShortcutAction for action handling
  // KeyboardShortcutAction,
} from '@/types'

interface KeyboardShortcutsSettingsProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Keyboard shortcuts settings modal component
 */
export function KeyboardShortcutsSettings({
  isOpen,
  onClose,
}: KeyboardShortcutsSettingsProps) {
  const {
    getAllShortcuts,
    remapShortcut,
    addCustomShortcut,
    removeCustomShortcut,
    resetUserCustomizations,
    // TODO: Use these functions for keyboard shortcuts functionality
    // getShortcutsByCategory,
    // getUserDefinedShortcuts,
    // isKeyCombinationAvailable,
    // getAvailableActions,
    // getEffectiveShortcut,
  } = useKeyboardShortcuts()

  const [selectedCategory, setSelectedCategory] = useState<
    ShortcutCategory | 'all'
  >('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [newKeyCombo, setNewKeyCombo] = useState('')
  const [capturingKeys, setCapturingKeys] = useState(false)
  const [capturedKeys, setCapturedKeys] = useState<{
    key: string
    ctrl: boolean
    alt: boolean
    shift: boolean
    meta: boolean
  }>({ key: '', ctrl: false, alt: false, shift: false, meta: false })

  // Get shortcuts for the current filter
  const allShortcuts = getAllShortcuts()
  const filteredShortcuts = allShortcuts.filter((shortcut) => {
    const matchesSearch =
      searchTerm === '' ||
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === 'all' || shortcut.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Group shortcuts by category
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

  // Handle key capture for remapping
  useEffect(() => {
    if (!capturingKeys) return

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      setCapturedKeys({
        key: event.key.toLowerCase(),
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey,
      })
    }

    const handleKeyUp = (_event: KeyboardEvent) => {
      if (capturedKeys.key) {
        setNewKeyCombo(formatKeyCombination(capturedKeys))
        setCapturingKeys(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [capturingKeys, capturedKeys])

  const handleStartRemapping = (shortcutId: string) => {
    setEditingShortcut(shortcutId)
    setCapturingKeys(true)
    setNewKeyCombo('')
    setCapturedKeys({
      key: '',
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
    })
  }

  const handleConfirmRemapping = () => {
    if (!editingShortcut || !newKeyCombo) return

    const [key, ...modifiers] = newKeyCombo.split('+')
    const modifierObj: any = {}

    modifiers.forEach((mod) => {
      switch (mod.toLowerCase()) {
        case 'ctrl':
          modifierObj.ctrl = true
          break
        case 'alt':
          modifierObj.alt = true
          break
        case 'shift':
          modifierObj.shift = true
          break
        case 'cmd':
          modifierObj.meta = true
          break
      }
    })

    const success = remapShortcut(editingShortcut, key, modifierObj)

    if (success) {
      setEditingShortcut(null)
      setNewKeyCombo('')
    } else {
      alert(
        'Cannot remap to this key combination - it conflicts with another shortcut'
      )
    }
  }

  const handleCancelRemapping = () => {
    setEditingShortcut(null)
    setCapturingKeys(false)
    setNewKeyCombo('')
    setCapturedKeys({
      key: '',
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
    })
  }

  const handleAddCustomShortcut = () => {
    const newShortcut: KeyboardShortcut = {
      key: 'a',
      description: 'Custom Action',
      category: ShortcutCategory.General,
      userDefined: true,
      id: `custom-${Date.now()}`,
    }

    addCustomShortcut(newShortcut)
  }

  const handleRemoveShortcut = (shortcutId: string) => {
    if (confirm('Are you sure you want to remove this custom shortcut?')) {
      removeCustomShortcut(shortcutId)
    }
  }

  const formatKeyCombination = (keys: typeof capturedKeys) => {
    const parts = []
    if (keys.ctrl) parts.push('Ctrl')
    if (keys.alt) parts.push('Alt')
    if (keys.shift) parts.push('Shift')
    if (keys.meta) parts.push('Cmd')
    parts.push(keys.key.toUpperCase())
    return parts.join(' + ')
  }

  if (!isOpen) return null

  return (
    <div className="keyboard-shortcuts-settings-overlay" onClick={onClose}>
      <div
        className="keyboard-shortcuts-settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="keyboard-shortcuts-settings-header">
          <h2>Keyboard Shortcuts Settings</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="keyboard-shortcuts-settings-toolbar">
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

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

          <div className="toolbar-actions">
            <button
              className="btn btn-secondary"
              onClick={() => resetUserCustomizations()}
              title="Reset all customizations"
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddCustomShortcut}
              title="Add custom shortcut"
            >
              <Plus size={16} />
              Add Custom
            </button>
          </div>
        </div>

        <div className="keyboard-shortcuts-settings-content">
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
                    {categoryShortcuts.map((shortcut) => (
                      <div key={shortcut.id} className="shortcut-item">
                        <div className="shortcut-info">
                          <div className="shortcut-description">
                            {shortcut.description}
                            {shortcut.userDefined && (
                              <span className="user-defined-badge">Custom</span>
                            )}
                          </div>
                          {shortcut.context && (
                            <div className="shortcut-context">
                              {shortcut.context}
                            </div>
                          )}
                        </div>

                        <div className="shortcut-keys">
                          {editingShortcut === shortcut.id ? (
                            <div className="key-remapping">
                              {capturingKeys ? (
                                <div className="key-capture">
                                  <span className="capture-prompt">
                                    Press keys...
                                  </span>
                                  {newKeyCombo && (
                                    <kbd className="key new-key">
                                      {newKeyCombo}
                                    </kbd>
                                  )}
                                </div>
                              ) : (
                                <div className="key-input">
                                  <input
                                    type="text"
                                    value={newKeyCombo}
                                    onChange={(e) =>
                                      setNewKeyCombo(e.target.value)
                                    }
                                    placeholder="Enter key combination"
                                    className="key-input-field"
                                  />
                                  <button
                                    className="btn btn-small btn-primary"
                                    onClick={handleConfirmRemapping}
                                    disabled={!newKeyCombo}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn btn-small btn-secondary"
                                    onClick={handleCancelRemapping}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="current-keys">
                              {formatShortcutKey(shortcut)
                                .split(' + ')
                                .map((key, index) => (
                                  <React.Fragment key={index}>
                                    <kbd className="key">{key}</kbd>
                                    {index <
                                      formatShortcutKey(shortcut).split(' + ')
                                        .length -
                                        1 && (
                                      <span className="key-separator">+</span>
                                    )}
                                  </React.Fragment>
                                ))}
                            </div>
                          )}
                        </div>

                        <div className="shortcut-actions">
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => handleStartRemapping(shortcut.id!)}
                            title="Remap shortcut"
                          >
                            <Edit size={14} />
                          </button>
                          {shortcut.userDefined && (
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleRemoveShortcut(shortcut.id!)}
                              title="Remove custom shortcut"
                            >
                              <Trash2 size={14} />
                            </button>
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

        <div className="keyboard-shortcuts-settings-footer">
          <div className="settings-info">
            <p>
              <Lightbulb size={14} className="tip-icon" />
              <strong>Tip:</strong> Click the edit icon to remap shortcuts.
              Custom shortcuts can be removed with the trash icon.
            </p>
            <p>
              Changes are automatically saved and will persist across sessions.
            </p>
          </div>
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
