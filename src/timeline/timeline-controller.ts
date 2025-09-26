/**
 * @fileoverview Timeline Controller for Playback and Editing Operations
 * @author @darianrosebrook
 */

import { Result, AnimatorError, Time } from '@/types'
import {
  TimelineController as ITimelineController,
  Timeline,
  PlaybackState,
  TimelineSelection,
  TimelineHistory,
  TimelineEventListener,
} from './timeline-types'

/**
 * Timeline controller implementation with playback and editing capabilities
 */
export class TimelineController implements ITimelineController {
  timeline: Timeline
  private history: TimelineHistory
  private playbackTimer: number | null = null
  private lastFrameTime = 0
  private frameInterval = 1000 / 60 // 60fps

  constructor(timeline: Timeline, history: TimelineHistory) {
    this.timeline = timeline
    this.history = history

    // Listen to timeline events
    this.timeline.addEventListener((event) => {
      this.onTimelineEvent(event)
    })
  }

  // Playback control
  play(): Result<void> {
    try {
      if (this.timeline.playbackState === PlaybackState.Playing) {
        return { success: true, data: undefined }
      }

      const result = this.timeline.setPlaybackState(PlaybackState.Playing)
      if (!result.success) return result

      this.startPlaybackLoop()
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLAYBACK_START_ERROR',
          message: `Failed to start playback: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  pause(): Result<void> {
    try {
      if (this.timeline.playbackState !== PlaybackState.Playing) {
        return { success: true, data: undefined }
      }

      const result = this.timeline.setPlaybackState(PlaybackState.Paused)
      if (!result.success) return result

      this.stopPlaybackLoop()
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLAYBACK_PAUSE_ERROR',
          message: `Failed to pause playback: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  stop(): Result<void> {
    try {
      this.stopPlaybackLoop()
      const result = this.timeline.setCurrentTime(0)
      if (!result.success) return result

      return this.timeline.setPlaybackState(PlaybackState.Stopped)
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLAYBACK_STOP_ERROR',
          message: `Failed to stop playback: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  seek(time: Time): Result<void> {
    try {
      const wasPlaying = this.timeline.playbackState === PlaybackState.Playing
      if (wasPlaying) {
        this.stopPlaybackLoop()
        this.timeline.setPlaybackState(PlaybackState.Stopped)
      }

      const result = this.timeline.setCurrentTime(time)
      if (!result.success) return result

      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SEEK_ERROR',
          message: `Failed to seek: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  scrub(time: Time): Result<void> {
    try {
      // Scrubbing is like seeking but with different state
      const result = this.timeline.setCurrentTime(time)
      if (!result.success) return result

      const scrubResult = this.timeline.setPlaybackState(
        PlaybackState.Scrubbing
      )
      return scrubResult
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCRUB_ERROR',
          message: `Failed to scrub: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  // Selection operations
  selectTracks(trackIds: string[]): Result<void> {
    try {
      this.timeline.selection.tracks = trackIds
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SELECTION_ERROR',
          message: `Failed to select tracks: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  selectKeyframes(keyframeIds: string[]): Result<void> {
    try {
      this.timeline.selection.keyframes = keyframeIds
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SELECTION_ERROR',
          message: `Failed to select keyframes: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  selectTimeRange(start: Time, end: Time): Result<void> {
    try {
      this.timeline.selection.timeRange = { start, end }
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SELECTION_ERROR',
          message: `Failed to select time range: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  clearSelection(): Result<void> {
    try {
      this.timeline.selection = { tracks: [], keyframes: [] }
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SELECTION_ERROR',
          message: `Failed to clear selection: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  // Bulk operations
  moveSelectedKeyframes(deltaTime: Time): Result<void> {
    try {
      const { keyframes: selectedKeyframeIds } = this.timeline.selection

      for (const keyframeId of selectedKeyframeIds) {
        // Find the keyframe across all tracks
        for (const track of this.timeline.tracks) {
          const keyframe = track.keyframes.find((k) => k.id === keyframeId)
          if (keyframe) {
            const newTime = Math.max(
              0,
              Math.min(keyframe.time + deltaTime, this.timeline.duration)
            )
            this.timeline.updateKeyframe(track.id, keyframeId, {
              time: newTime,
            })
          }
        }
      }

      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'KEYFRAME_MOVE_ERROR',
          message: `Failed to move keyframes: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  scaleSelectedKeyframes(factor: number, origin?: Time): Result<void> {
    try {
      const { keyframes: selectedKeyframeIds } = this.timeline.selection
      const originTime = origin ?? this.timeline.currentTime

      for (const keyframeId of selectedKeyframeIds) {
        // Find the keyframe across all tracks
        for (const track of this.timeline.tracks) {
          const keyframe = track.keyframes.find((k) => k.id === keyframeId)
          if (keyframe) {
            const newTime = originTime + (keyframe.time - originTime) * factor
            this.timeline.updateKeyframe(track.id, keyframeId, {
              time: newTime,
            })
          }
        }
      }

      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'KEYFRAME_SCALE_ERROR',
          message: `Failed to scale keyframes: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  deleteSelectedKeyframes(): Result<void> {
    try {
      const { keyframes: selectedKeyframeIds } = this.timeline.selection

      for (const keyframeId of selectedKeyframeIds) {
        // Find and remove the keyframe from its track
        for (const track of this.timeline.tracks) {
          if (track.keyframes.find((k) => k.id === keyframeId)) {
            this.timeline.removeKeyframe(track.id, keyframeId)
            break
          }
        }
      }

      this.clearSelection()
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'KEYFRAME_DELETE_ERROR',
          message: `Failed to delete keyframes: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  duplicateSelectedKeyframes(): Result<void> {
    try {
      const { keyframes: selectedKeyframeIds } = this.timeline.selection
      const duplicatedIds: string[] = []

      for (const keyframeId of selectedKeyframeIds) {
        // Find the keyframe across all tracks
        for (const track of this.timeline.tracks) {
          const keyframe = track.keyframes.find((k) => k.id === keyframeId)
          if (keyframe) {
            // Create a duplicate keyframe slightly offset in time
            const duplicateKeyframe = {
              time: keyframe.time + 0.1, // 0.1 second offset
              value: keyframe.value,
              interpolation: keyframe.interpolation,
              easing: keyframe.easing,
            }

            const result = this.timeline.addKeyframe(
              track.id,
              duplicateKeyframe
            )
            if (result.success) {
              duplicatedIds.push(result.data.id)
            }
          }
        }
      }

      // Select the duplicated keyframes
      this.timeline.selection.keyframes = duplicatedIds
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'KEYFRAME_DUPLICATE_ERROR',
          message: `Failed to duplicate keyframes: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  // Undo/Redo
  canUndo(): boolean {
    return this.history.canUndo()
  }

  canRedo(): boolean {
    return this.history.canRedo()
  }

  undo(): Result<void> {
    try {
      const result = this.history.undo()
      if (!result.success) return result

      // Restore timeline state from history
      // This would involve more complex state restoration in a full implementation

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
      const result = this.history.redo()
      if (!result.success) return result

      // Restore timeline state from history
      // This would involve more complex state restoration in a full implementation

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

  // Private methods
  private startPlaybackLoop(): void {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer)
    }

    this.lastFrameTime = performance.now()

    this.playbackTimer = window.setInterval(() => {
      const now = performance.now()
      const deltaTime = (now - this.lastFrameTime) / 1000
      this.lastFrameTime = now

      const newTime =
        this.timeline.currentTime +
        deltaTime * this.timeline.playbackConfig.speed

      if (newTime >= this.timeline.duration) {
        if (this.timeline.playbackConfig.loop) {
          this.timeline.setCurrentTime(newTime % this.timeline.duration)
        } else {
          this.timeline.setCurrentTime(this.timeline.duration)
          this.timeline.setPlaybackState(PlaybackState.Stopped)
          this.stopPlaybackLoop()
        }
      } else {
        this.timeline.setCurrentTime(newTime)
      }
    }, this.frameInterval)
  }

  private stopPlaybackLoop(): void {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer)
      this.playbackTimer = null
    }
  }

  private onTimelineEvent(event: any): void {
    // Handle timeline events (e.g., for saving state to history)
    // In a full implementation, this would trigger history saves

    switch (event.type) {
      case 'keyframe_added':
      case 'keyframe_removed':
      case 'keyframe_updated':
      case 'track_added':
      case 'track_removed':
        // Save state to history for undo/redo
        this.history.pushState(this.timeline.clone())
        break
    }
  }

  // Cleanup
  destroy(): void {
    this.stopPlaybackLoop()
    this.timeline.removeEventListener(
      this.onTimelineEvent as TimelineEventListener
    )
  }
}
