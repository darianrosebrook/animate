/**
 * @fileoverview Timeline History for Undo/Redo Operations
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { TimelineHistory as ITimelineHistory } from './timeline-types'
import { Timeline } from './timeline'

/**
 * Timeline history implementation for undo/redo functionality
 */
export class TimelineHistory implements ITimelineHistory {
  private history: Timeline[] = []
  private currentIndex = -1
  private maxHistorySize = 100

  canUndo(): boolean {
    return this.currentIndex > 0
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  undo(): Result<void> {
    try {
      if (!this.canUndo()) {
        return {
          success: false,
          error: {
            code: 'UNDO_NOT_AVAILABLE',
            message: 'No undo state available',
          },
        }
      }

      this.currentIndex--
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNDO_ERROR',
          message: `Failed to undo: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  redo(): Result<void> {
    try {
      if (!this.canRedo()) {
        return {
          success: false,
          error: {
            code: 'REDO_NOT_AVAILABLE',
            message: 'No redo state available',
          },
        }
      }

      this.currentIndex++
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REDO_ERROR',
          message: `Failed to redo: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  pushState(state: Timeline): void {
    try {
      // Remove any states after current index (when new changes are made after undo)
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1)
      }

      // Add new state
      this.history.push(state.clone())
      this.currentIndex++

      // Limit history size
      if (this.history.length > this.maxHistorySize) {
        this.history.shift()
        this.currentIndex--
      }
    } catch (error) {
      console.error('Failed to push history state:', error)
    }
  }

  clear(): void {
    this.history = []
    this.currentIndex = -1
  }

  getCurrentState(): Timeline | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null
    }
    return this.history[this.currentIndex]
  }

  getHistorySize(): number {
    return this.history.length
  }

  getCurrentIndex(): number {
    return this.currentIndex
  }

  setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size)

    // Trim history if needed
    if (this.history.length > this.maxHistorySize) {
      const excess = this.history.length - this.maxHistorySize
      this.history.splice(0, excess)
      this.currentIndex = Math.max(-1, this.currentIndex - excess)
    }
  }
}
