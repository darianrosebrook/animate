/**
 * @fileoverview Keyboard shortcuts manager for Animator
 * @author @darianrosebrook
 */

import {
import { logger } from '@/core/logging/logger'
  KeyboardShortcut,
  KeyboardShortcutMap,
  ShortcutCategory,
  DEFAULT_KEYBOARD_SHORTCUTS,
  KeyboardShortcutAction,
} from '@/types'

/**
 * Keyboard event handler type
 */
export type KeyboardEventHandler = (event: KeyboardEvent) => void

/**
 * Keyboard shortcuts manager
 */
export class KeyboardShortcutsManager {
  private shortcuts: KeyboardShortcutMap = {}
  private eventListeners: KeyboardEventHandler[] = []
  private isEnabled: boolean = true
  private currentContext: string = 'global'
  private customActions: Map<string, KeyboardShortcutAction> = new Map()
  private userConfigurations: Map<string, KeyboardShortcut> = new Map()
  private readonly STORAGE_KEY = 'animator-keyboard-shortcuts'

  constructor() {
    this.loadDefaultShortcuts()
    this.loadUserConfiguration()
    this.setupGlobalListener()
  }

  /**
   * Load default keyboard shortcuts
   */
  private loadDefaultShortcuts(): void {
    const shortcutMap: KeyboardShortcutMap = {}

    for (let i = 0; i < DEFAULT_KEYBOARD_SHORTCUTS.length; i++) {
      const shortcut = DEFAULT_KEYBOARD_SHORTCUTS[i]
      // Generate a stable ID based on the shortcut properties
      const id = this.generateShortcutId(shortcut, i)
      const shortcutWithId = { ...shortcut, id }
      const key = this.getShortcutKey(shortcutWithId)
      shortcutMap[key] = shortcutWithId
    }

    this.shortcuts = shortcutMap
  }

  /**
   * Generate a stable ID for a shortcut based on its properties
   */
  private generateShortcutId(
    shortcut: KeyboardShortcut,
    index: number
  ): string {
    const parts: string[] = []

    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.alt) parts.push('alt')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.meta) parts.push('meta')

    parts.push(shortcut.key.toLowerCase())
    parts.push(shortcut.category)
    parts.push(index.toString())

    return parts.join('-').replace(/\s+/g, '-').toLowerCase()
  }

  /**
   * Generate a unique key for a shortcut combination
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = []

    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.alt) parts.push('alt')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.meta) parts.push('meta')

    parts.push(shortcut.key.toLowerCase())

    return parts.join('+')
  }

  /**
   * Setup global keyboard event listener
   */
  private setupGlobalListener(): void {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (!this.isEnabled) return

      const shortcut = this.matchShortcut(event)
      if (shortcut) {
        event.preventDefault()
        event.stopPropagation()

        // Execute the shortcut action
        await this.executeShortcut(shortcut, event)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
  }

  /**
   * Match keyboard event to a registered shortcut
   */
  private matchShortcut(event: KeyboardEvent): KeyboardShortcut | null {
    // Try exact match first
    const exactKey = this.buildShortcutKey(event)
    if (this.shortcuts[exactKey]) {
      const shortcut = this.shortcuts[exactKey]
      // Check if shortcut applies to current context
      if (shortcut.context && shortcut.context !== this.currentContext) {
        return null
      }
      return shortcut
    }

    return null
  }

  /**
   * Build shortcut key from keyboard event
   */
  private buildShortcutKey(event: KeyboardEvent): string {
    const parts: string[] = []

    if (event.ctrlKey || event.metaKey) parts.push('ctrl')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    if (event.metaKey) parts.push('meta')

    parts.push(event.key.toLowerCase())

    return parts.join('+')
  }

  /**
   * Execute a shortcut action
   */
  private async executeShortcut(
    shortcut: KeyboardShortcut,
    event: KeyboardEvent
  ): Promise<void> {
    // Execute custom action if available
    if (shortcut.action) {
      try {
        await shortcut.action(event)
      } catch (error) {
        logger.error('Error executing custom shortcut action:', error)
      }
    }

    // Emit custom event for the application to handle
    const customEvent = new CustomEvent('keyboard-shortcut', {
      detail: {
        shortcut,
        originalEvent: event,
      },
    })

    document.dispatchEvent(customEvent)

    // Also call registered listeners
    this.eventListeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        logger.error('Error in keyboard shortcut listener:', error)
      }
    })
  }

  /**
   * Register a custom keyboard shortcut
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut)
    this.shortcuts[key] = shortcut
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(key: string): void {
    delete this.shortcuts[key]
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Object.values(this.shortcuts)
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
    return Object.values(this.shortcuts).filter(
      (shortcut) => shortcut.category === category
    )
  }

  /**
   * Get shortcuts by context
   */
  getShortcutsByContext(context: string): KeyboardShortcut[] {
    return Object.values(this.shortcuts).filter(
      (shortcut) => !shortcut.context || shortcut.context === context
    )
  }

  /**
   * Set current context (for context-sensitive shortcuts)
   */
  setContext(context: string): void {
    this.currentContext = context
  }

  /**
   * Get current context
   */
  getContext(): string {
    return this.currentContext
  }

  /**
   * Enable/disable keyboard shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * Check if shortcuts are enabled
   */
  isShortcutsEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * Add custom event listener for shortcuts
   */
  addEventListener(listener: KeyboardEventHandler): void {
    this.eventListeners.push(listener)
  }

  /**
   * Remove custom event listener
   */
  removeEventListener(listener: KeyboardEventHandler): void {
    const index = this.eventListeners.indexOf(listener)
    if (index > -1) {
      this.eventListeners.splice(index, 1)
    }
  }

  /**
   * Export current shortcuts configuration
   */
  exportConfiguration(): KeyboardShortcut[] {
    return Object.values(this.shortcuts)
  }

  /**
   * Import shortcuts configuration
   */
  importConfiguration(shortcuts: KeyboardShortcut[]): void {
    const shortcutMap: KeyboardShortcutMap = {}

    for (const shortcut of shortcuts) {
      const key = this.getShortcutKey(shortcut)
      shortcutMap[key] = shortcut
    }

    this.shortcuts = shortcutMap
  }

  /**
   * Reset to default shortcuts
   */
  resetToDefaults(): void {
    this.loadDefaultShortcuts()
  }

  /**
   * Find conflicting shortcuts
   */
  findConflicts(): Array<{
    shortcut: KeyboardShortcut
    conflicts: KeyboardShortcut[]
  }> {
    const conflicts: Array<{
      shortcut: KeyboardShortcut
      conflicts: KeyboardShortcut[]
    }> = []
    const usedKeys = new Map<string, KeyboardShortcut[]>()

    for (const shortcut of Object.values(this.shortcuts)) {
      const key = this.getShortcutKey(shortcut)
      if (!usedKeys.has(key)) {
        usedKeys.set(key, [])
      }
      usedKeys.get(key)!.push(shortcut)
    }

    for (const [, shortcuts] of usedKeys.entries()) {
      if (shortcuts.length > 1) {
        conflicts.push({
          shortcut: shortcuts[0],
          conflicts: shortcuts.slice(1),
        })
      }
    }

    return conflicts
  }

  /**
   * Validate shortcut configuration
   */
  validateShortcuts(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const conflicts = this.findConflicts()

    if (conflicts.length > 0) {
      errors.push(`Found ${conflicts.length} shortcut conflicts`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get help text for shortcuts
   */
  getShortcutsHelp(): string {
    const categories = Object.values(ShortcutCategory)
    let help = '# Keyboard Shortcuts\n\n'

    for (const category of categories) {
      const shortcuts = this.getShortcutsByCategory(category)
      if (shortcuts.length === 0) continue

      help += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`

      for (const shortcut of shortcuts) {
        const keyCombo = this.formatShortcutKey(shortcut)
        help += `- **${keyCombo}**: ${shortcut.description}\n`
      }

      help += '\n'
    }

    return help
  }

  /**
   * Format shortcut key for display
   */
  private formatShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = []

    if (shortcut.meta) parts.push('Cmd')
    if (shortcut.ctrl) parts.push('Ctrl')
    if (shortcut.alt) parts.push('Alt')
    if (shortcut.shift) parts.push('Shift')

    // Format the main key
    let key = shortcut.key.toUpperCase()
    if (key === ' ') key = 'Space'
    if (key === 'ArrowLeft') key = '←'
    if (key === 'ArrowRight') key = '→'
    if (key === 'ArrowUp') key = '↑'
    if (key === 'ArrowDown') key = '↓'
    if (key === 'Delete') key = 'Del'
    if (key === 'Backspace') key = '⌫'

    parts.push(key)

    return parts.join(' + ')
  }

  /**
   * Bind a custom action to a shortcut
   */
  bindAction(shortcutKey: string, action: KeyboardShortcutAction): void {
    this.customActions.set(shortcutKey, action)
  }

  /**
   * Unbind a custom action from a shortcut
   */
  unbindAction(shortcutKey: string): void {
    this.customActions.delete(shortcutKey)
  }

  /**
   * Get the custom action bound to a shortcut
   */
  getBoundAction(shortcutKey: string): KeyboardShortcutAction | undefined {
    return this.customActions.get(shortcutKey)
  }

  /**
   * Remap a shortcut to a new key combination
   */
  remapShortcut(
    originalShortcutId: string,
    newKey: string,
    modifiers?: {
      ctrl?: boolean
      alt?: boolean
      shift?: boolean
      meta?: boolean
    }
  ): boolean {
    // Find the original shortcut
    const originalShortcut = Object.values(this.shortcuts).find(
      (shortcut) => shortcut.id === originalShortcutId
    )

    if (!originalShortcut) {
      return false
    }

    // Check for conflicts with the new key combination
    const newKeyCombo = this.buildShortcutKeyFromParts(newKey, modifiers)
    if (
      this.shortcuts[newKeyCombo] &&
      this.shortcuts[newKeyCombo].id !== originalShortcutId
    ) {
      return false // Conflict detected
    }

    // Create the remapped shortcut
    const remappedShortcut: KeyboardShortcut = {
      ...originalShortcut,
      key: newKey,
      ctrl: modifiers?.ctrl ?? originalShortcut.ctrl,
      alt: modifiers?.alt ?? originalShortcut.alt,
      shift: modifiers?.shift ?? originalShortcut.shift,
      meta: modifiers?.meta ?? originalShortcut.meta,
      userDefined: true,
    }

    // Remove the old shortcut
    const oldKeyCombo = this.getShortcutKey(originalShortcut)
    delete this.shortcuts[oldKeyCombo]

    // Add the new shortcut
    this.shortcuts[newKeyCombo] = remappedShortcut

    // Update user configuration
    this.userConfigurations.set(originalShortcutId, remappedShortcut)
    this.saveUserConfiguration()

    return true
  }

  /**
   * Add a completely custom shortcut
   */
  addCustomShortcut(shortcut: KeyboardShortcut): boolean {
    const shortcutKey = this.getShortcutKey(shortcut)

    // Check for conflicts
    if (this.shortcuts[shortcutKey]) {
      return false
    }

    // Generate an ID if not provided
    if (!shortcut.id) {
      shortcut.id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }

    shortcut.userDefined = true
    this.shortcuts[shortcutKey] = shortcut
    this.userConfigurations.set(shortcut.id, shortcut)
    this.saveUserConfiguration()

    return true
  }

  /**
   * Remove a custom shortcut
   */
  removeCustomShortcut(shortcutId: string): boolean {
    const shortcut = Object.values(this.shortcuts).find(
      (s) => s.id === shortcutId
    )
    if (!shortcut || !shortcut.userDefined) {
      return false
    }

    const shortcutKey = this.getShortcutKey(shortcut)
    delete this.shortcuts[shortcutKey]
    this.userConfigurations.delete(shortcutId)
    this.customActions.delete(shortcutKey)
    this.saveUserConfiguration()

    return true
  }

  /**
   * Get all user-defined shortcuts
   */
  getUserDefinedShortcuts(): KeyboardShortcut[] {
    return Object.values(this.shortcuts).filter(
      (shortcut) => shortcut.userDefined
    )
  }

  /**
   * Reset user customizations
   */
  resetUserCustomizations(): void {
    this.userConfigurations.clear()
    this.customActions.clear()
    this.loadDefaultShortcuts()
    this.saveUserConfiguration()
  }

  /**
   * Load user configuration from localStorage
   */
  private loadUserConfiguration(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      if (saved) {
        const config = JSON.parse(saved) as KeyboardShortcut[]
        this.importConfiguration(config)
      }
    } catch (error) {
      logger.warn('Failed to load keyboard shortcuts configuration:', error)
    }
  }

  /**
   * Save user configuration to localStorage
   */
  private saveUserConfiguration(): void {
    try {
      const config = this.exportConfiguration()
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      logger.warn('Failed to save keyboard shortcuts configuration:', error)
    }
  }

  /**
   * Build shortcut key from individual parts
   */
  private buildShortcutKeyFromParts(
    key: string,
    modifiers?: {
      ctrl?: boolean
      alt?: boolean
      shift?: boolean
      meta?: boolean
    }
  ): string {
    const parts = []

    if (modifiers?.ctrl) parts.push('ctrl')
    if (modifiers?.alt) parts.push('alt')
    if (modifiers?.shift) parts.push('shift')
    if (modifiers?.meta) parts.push('meta')

    parts.push(key.toLowerCase())
    return parts.join('+')
  }

  /**
   * Get effective shortcut (user-defined or default)
   */
  getEffectiveShortcut(shortcutId: string): KeyboardShortcut | null {
    // Check user configuration first
    const userShortcut = this.userConfigurations.get(shortcutId)
    if (userShortcut) {
      return userShortcut
    }

    // Fall back to default
    return (
      Object.values(this.shortcuts).find(
        (shortcut) => shortcut.id === shortcutId
      ) || null
    )
  }

  /**
   * Check if a key combination is available
   */
  isKeyCombinationAvailable(
    key: string,
    modifiers?: {
      ctrl?: boolean
      alt?: boolean
      shift?: boolean
      meta?: boolean
    }
  ): boolean {
    const keyCombo = this.buildShortcutKeyFromParts(key, modifiers)
    return !this.shortcuts[keyCombo]
  }

  /**
   * Get all available actions that can be bound to shortcuts
   */
  getAvailableActions(): Array<{
    id: string
    name: string
    description: string
  }> {
    // This would typically come from a registry of available actions
    // For now, return a basic set
    return [
      {
        id: 'new-composition',
        name: 'New Composition',
        description: 'Create a new composition',
      },
      {
        id: 'open-composition',
        name: 'Open Composition',
        description: 'Open an existing composition',
      },
      {
        id: 'save-composition',
        name: 'Save Composition',
        description: 'Save the current composition',
      },
      {
        id: 'export-composition',
        name: 'Export Composition',
        description: 'Export the composition',
      },
      { id: 'undo', name: 'Undo', description: 'Undo the last action' },
      { id: 'redo', name: 'Redo', description: 'Redo the last undone action' },
      { id: 'copy', name: 'Copy', description: 'Copy selected items' },
      { id: 'paste', name: 'Paste', description: 'Paste copied items' },
      { id: 'delete', name: 'Delete', description: 'Delete selected items' },
      {
        id: 'duplicate',
        name: 'Duplicate',
        description: 'Duplicate selected items',
      },
      { id: 'select-all', name: 'Select All', description: 'Select all items' },
      {
        id: 'deselect-all',
        name: 'Deselect All',
        description: 'Deselect all items',
      },
    ]
  }

  /**
   * Cleanup and destroy the manager
   */
  destroy(): void {
    this.eventListeners = []
    this.shortcuts = {}
    this.customActions.clear()
    this.userConfigurations.clear()
    this.isEnabled = false
  }
}
