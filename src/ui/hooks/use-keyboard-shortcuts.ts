/**
 * @fileoverview React hook for keyboard shortcuts integration
 * @author @darianrosebrook
 */

import { useEffect, useRef, useCallback } from 'react'
import { KeyboardShortcutsManager } from '@/core/keyboard-shortcuts'
import {
  KeyboardShortcut,
  ShortcutCategory,
  KeyboardShortcutAction,
} from '@/types'

/**
 * Hook for integrating keyboard shortcuts in React components
 */
export function useKeyboardShortcuts() {
  const managerRef = useRef<KeyboardShortcutsManager | null>(null)

  // Initialize manager on first use
  if (!managerRef.current) {
    managerRef.current = new KeyboardShortcutsManager()
  }

  const manager = managerRef.current

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manager.destroy()
    }
  }, [manager])

  return {
    // Core functionality
    registerShortcut: useCallback(
      (shortcut: KeyboardShortcut) => {
        manager.registerShortcut(shortcut)
      },
      [manager]
    ),

    unregisterShortcut: useCallback(
      (key: string) => {
        manager.unregisterShortcut(key)
      },
      [manager]
    ),

    setContext: useCallback(
      (context: string) => {
        manager.setContext(context)
      },
      [manager]
    ),

    setEnabled: useCallback(
      (enabled: boolean) => {
        manager.setEnabled(enabled)
      },
      [manager]
    ),

    // Getters
    getAllShortcuts: useCallback(() => {
      return manager.getAllShortcuts()
    }, [manager]),

    getShortcutsByCategory: useCallback(
      (category: ShortcutCategory) => {
        return manager.getShortcutsByCategory(category)
      },
      [manager]
    ),

    getShortcutsByContext: useCallback(
      (context: string) => {
        return manager.getShortcutsByContext(context)
      },
      [manager]
    ),

    getContext: useCallback(() => {
      return manager.getContext()
    }, [manager]),

    isEnabled: useCallback(() => {
      return manager.isShortcutsEnabled()
    }, [manager]),

    // Utilities
    exportConfiguration: useCallback(() => {
      return manager.exportConfiguration()
    }, [manager]),

    importConfiguration: useCallback(
      (shortcuts: KeyboardShortcut[]) => {
        manager.importConfiguration(shortcuts)
      },
      [manager]
    ),

    resetToDefaults: useCallback(() => {
      manager.resetToDefaults()
    }, [manager]),

    findConflicts: useCallback(() => {
      return manager.findConflicts()
    }, [manager]),

    validateShortcuts: useCallback(() => {
      return manager.validateShortcuts()
    }, [manager]),

    getShortcutsHelp: useCallback(() => {
      return manager.getShortcutsHelp()
    }, [manager]),

    // Action binding
    bindAction: useCallback(
      (shortcutKey: string, action: KeyboardShortcutAction) => {
        manager.bindAction(shortcutKey, action)
      },
      [manager]
    ),

    unbindAction: useCallback(
      (shortcutKey: string) => {
        manager.unbindAction(shortcutKey)
      },
      [manager]
    ),

    getBoundAction: useCallback(
      (shortcutKey: string) => {
        return manager.getBoundAction(shortcutKey)
      },
      [manager]
    ),

    // Remapping and customization
    remapShortcut: useCallback(
      (
        originalShortcutId: string,
        newKey: string,
        modifiers?: {
          ctrl?: boolean
          alt?: boolean
          shift?: boolean
          meta?: boolean
        }
      ) => {
        return manager.remapShortcut(originalShortcutId, newKey, modifiers)
      },
      [manager]
    ),

    addCustomShortcut: useCallback(
      (shortcut: KeyboardShortcut) => {
        return manager.addCustomShortcut(shortcut)
      },
      [manager]
    ),

    removeCustomShortcut: useCallback(
      (shortcutId: string) => {
        return manager.removeCustomShortcut(shortcutId)
      },
      [manager]
    ),

    getUserDefinedShortcuts: useCallback(() => {
      return manager.getUserDefinedShortcuts()
    }, [manager]),

    getEffectiveShortcut: useCallback(
      (shortcutId: string) => {
        return manager.getEffectiveShortcut(shortcutId)
      },
      [manager]
    ),

    isKeyCombinationAvailable: useCallback(
      (
        key: string,
        modifiers?: {
          ctrl?: boolean
          alt?: boolean
          shift?: boolean
          meta?: boolean
        }
      ) => {
        return manager.isKeyCombinationAvailable(key, modifiers)
      },
      [manager]
    ),

    getAvailableActions: useCallback(() => {
      return manager.getAvailableActions()
    }, [manager]),

    resetUserCustomizations: useCallback(() => {
      manager.resetUserCustomizations()
    }, [manager]),
  }
}

/**
 * Hook for handling keyboard shortcuts in a specific component context
 */
export function useKeyboardShortcutContext(context: string) {
  const { setContext } = useKeyboardShortcuts()

  useEffect(() => {
    setContext(context)
  }, [context, setContext])
}

/**
 * Hook for listening to keyboard shortcut events
 */
export function useKeyboardShortcutListener(
  callback: (shortcut: KeyboardShortcut, event: KeyboardEvent) => void
) {
  const callbackRef = useRef(callback)

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const handleShortcut = (event: CustomEvent) => {
      const { shortcut, originalEvent } = event.detail
      callbackRef.current(shortcut, originalEvent)
    }

    document.addEventListener(
      'keyboard-shortcut',
      handleShortcut as EventListener
    )

    return () => {
      document.removeEventListener(
        'keyboard-shortcut',
        handleShortcut as EventListener
      )
    }
  }, [])
}

/**
 * Hook for component-specific keyboard shortcuts
 */
export function useComponentKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  context?: string
) {
  const { registerShortcut, unregisterShortcut, setContext } =
    useKeyboardShortcuts()

  useEffect(() => {
    // Register shortcuts
    shortcuts.forEach((shortcut) => {
      registerShortcut(shortcut)
    })

    // Set context if provided
    if (context) {
      setContext(context)
    }

    // Cleanup function
    return () => {
      shortcuts.forEach((shortcut) => {
        const key = buildShortcutKey(shortcut)
        unregisterShortcut(key)
      })
    }
  }, [shortcuts, context, registerShortcut, unregisterShortcut, setContext])
}

/**
 * Utility function to build shortcut key (duplicated from manager for external use)
 */
function buildShortcutKey(shortcut: KeyboardShortcut): string {
  const parts = []

  if (shortcut.ctrl) parts.push('ctrl')
  if (shortcut.alt) parts.push('alt')
  if (shortcut.shift) parts.push('shift')
  if (shortcut.meta) parts.push('meta')

  parts.push(shortcut.key.toLowerCase())

  return parts.join('+')
}
