/**
 * @fileoverview Core Timeline Implementation
 * @author @darianrosebrook
 */

import { Result, Time } from '@/types'
import { logger } from '@/core/logging/logger'
import {
  Timeline as ITimeline,
  TimelineTrack,
  Keyframe,
  TimelineMarker,
  PlaybackState,
  InterpolationMode,
  TimelineSelection,
  PlaybackConfig,
  TimelineEvent,
  TimelineEventListener,
} from './timeline-types'

/**
 * Core timeline implementation with keyframe editing and playback
 */
export class Timeline implements ITimeline {
  id: string
  name: string
  duration: Time
  frameRate: number
  currentTime: Time = 0
  playbackState: PlaybackState = PlaybackState.Stopped
  tracks: TimelineTrack[] = []
  markers: TimelineMarker[] = []
  selection: TimelineSelection = { tracks: [], keyframes: [] }
  playbackConfig: PlaybackConfig = {
    startTime: 0,
    endTime: 10,
    loop: false,
    speed: 1.0,
  }

  private eventListeners: TimelineEventListener[] = []
  private nextId = 0

  constructor(
    id: string,
    name: string,
    duration: Time = 10.0,
    frameRate: number = 30.0
  ) {
    this.id = id
    this.name = name
    this.duration = duration
    this.frameRate = frameRate
    this.playbackConfig.endTime = duration
  }

  // Track management
  addTrack(track: Omit<TimelineTrack, 'id'>): Result<TimelineTrack> {
    try {
      const newTrack: TimelineTrack = {
        ...track,
        id: `track_${this.nextId++}`,
        keyframes: track.keyframes || [],
        enabled: track.enabled ?? true,
        locked: track.locked ?? false,
      }

      this.tracks.push(newTrack)
      this.emitEvent({
        type: 'track_added',
        timelineId: this.id,
        data: { track: newTrack },
        timestamp: Date.now(),
      })

      return { success: true, data: newTrack }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRACK_ADD_ERROR',
          message: `Failed to add track: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  removeTrack(trackId: string): Result<boolean> {
    try {
      const index = this.tracks.findIndex((t) => t.id === trackId)
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'TRACK_NOT_FOUND',
            message: `Track with id '${trackId}' not found`,
          },
        }
      }

      const removedTrack = this.tracks.splice(index, 1)[0]
      this.emitEvent({
        type: 'track_removed',
        timelineId: this.id,
        data: { track: removedTrack },
        timestamp: Date.now(),
      })

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRACK_REMOVE_ERROR',
          message: `Failed to remove track: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  updateTrack(
    trackId: string,
    updates: Partial<TimelineTrack>
  ): Result<TimelineTrack> {
    try {
      const track = this.tracks.find((t) => t.id === trackId)
      if (!track) {
        return {
          success: false,
          error: {
            code: 'TRACK_NOT_FOUND',
            message: `Track with id '${trackId}' not found`,
          },
        }
      }

      const updatedTrack = { ...track, ...updates }
      Object.assign(track, updates)

      return { success: true, data: updatedTrack }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRACK_UPDATE_ERROR',
          message: `Failed to update track: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  // Keyframe management
  addKeyframe(
    trackId: string,
    keyframe: Omit<Keyframe, 'id'>
  ): Result<Keyframe> {
    try {
      const track = this.getTrackById(trackId)
      if (!track) {
        return {
          success: false,
          error: {
            code: 'TRACK_NOT_FOUND',
            message: `Track with id '${trackId}' not found`,
          },
        }
      }

      const newKeyframe: Keyframe = {
        id: `keyframe_${this.nextId++}`,
        selected: false,
        ...keyframe,
      }

      track.keyframes.push(newKeyframe)
      track.keyframes.sort((a, b) => a.time - b.time)

      this.emitEvent({
        type: 'keyframe_added',
        timelineId: this.id,
        data: { trackId, keyframe: newKeyframe },
        timestamp: Date.now(),
      })

      return { success: true, data: newKeyframe }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'KEYFRAME_ADD_ERROR',
          message: `Failed to add keyframe: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  removeKeyframe(trackId: string, keyframeId: string): Result<boolean> {
    try {
      const track = this.getTrackById(trackId)
      if (!track) {
        return {
          success: false,
          error: {
            code: 'TRACK_NOT_FOUND',
            message: `Track with id '${trackId}' not found`,
          },
        }
      }

      const index = track.keyframes.findIndex((k) => k.id === keyframeId)
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'KEYFRAME_NOT_FOUND',
            message: `Keyframe with id '${keyframeId}' not found`,
          },
        }
      }

      const removedKeyframe = track.keyframes.splice(index, 1)[0]
      this.emitEvent({
        type: 'keyframe_removed',
        timelineId: this.id,
        data: { trackId, keyframe: removedKeyframe },
        timestamp: Date.now(),
      })

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'KEYFRAME_REMOVE_ERROR',
          message: `Failed to remove keyframe: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  updateKeyframe(
    trackId: string,
    keyframeId: string,
    updates: Partial<Keyframe>
  ): Result<Keyframe> {
    try {
      const track = this.getTrackById(trackId)
      if (!track) {
        return {
          success: false,
          error: {
            code: 'TRACK_NOT_FOUND',
            message: `Track with id '${trackId}' not found`,
          },
        }
      }

      const keyframe = track.keyframes.find((k) => k.id === keyframeId)
      if (!keyframe) {
        return {
          success: false,
          error: {
            code: 'KEYFRAME_NOT_FOUND',
            message: `Keyframe with id '${keyframeId}' not found`,
          },
        }
      }

      const updatedKeyframe = { ...keyframe, ...updates }
      Object.assign(keyframe, updates)

      // Re-sort keyframes after time change
      if (updates.time !== undefined) {
        track.keyframes.sort((a, b) => a.time - b.time)
      }

      this.emitEvent({
        type: 'keyframe_updated',
        timelineId: this.id,
        data: { trackId, keyframe: updatedKeyframe },
        timestamp: Date.now(),
      })

      return { success: true, data: updatedKeyframe }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'KEYFRAME_UPDATE_ERROR',
          message: `Failed to update keyframe: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  // Marker management
  addMarker(marker: Omit<TimelineMarker, 'id'>): Result<TimelineMarker> {
    try {
      const newMarker: TimelineMarker = {
        id: `marker_${this.nextId++}`,
        ...marker,
      }

      this.markers.push(newMarker)
      this.markers.sort((a, b) => a.time - b.time)

      return { success: true, data: newMarker }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MARKER_ADD_ERROR',
          message: `Failed to add marker: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  removeMarker(markerId: string): Result<boolean> {
    try {
      const index = this.markers.findIndex((m) => m.id === markerId)
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'MARKER_NOT_FOUND',
            message: `Marker with id '${markerId}' not found`,
          },
        }
      }

      this.markers.splice(index, 1)
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MARKER_REMOVE_ERROR',
          message: `Failed to remove marker: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  // Playback control
  setCurrentTime(time: Time): Result<void> {
    try {
      this.currentTime = Math.max(0, Math.min(time, this.duration))
      this.emitEvent({
        type: 'time_changed',
        timelineId: this.id,
        data: { time: this.currentTime },
        timestamp: Date.now(),
      })

      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TIME_SET_ERROR',
          message: `Failed to set current time: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  setPlaybackState(state: PlaybackState): Result<void> {
    try {
      const oldState = this.playbackState
      this.playbackState = state

      this.emitEvent({
        type: 'playback_state_changed',
        timelineId: this.id,
        data: { oldState, newState: state },
        timestamp: Date.now(),
      })

      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLAYBACK_STATE_ERROR',
          message: `Failed to set playback state: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  setPlaybackConfig(config: Partial<PlaybackConfig>): Result<void> {
    try {
      this.playbackConfig = { ...this.playbackConfig, ...config }
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLAYBACK_CONFIG_ERROR',
          message: `Failed to set playback config: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  // Evaluation and querying
  evaluate(time: Time): Result<Map<string, any>> {
    try {
      const values = new Map<string, any>()

      for (const track of this.tracks) {
        if (!track.enabled) continue

        const value = this.evaluateTrack(track, time)
        if (track.targetNodeId && track.propertyPath) {
          const key = `${track.targetNodeId}.${track.propertyPath}`
          values.set(key, value)
        }
      }

      return { success: true, data: values }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EVALUATION_ERROR',
          message: `Failed to evaluate timeline: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getTrackById(trackId: string): TimelineTrack | null {
    return this.tracks.find((t) => t.id === trackId) || null
  }

  getKeyframeAtTime(trackId: string, time: Time): Keyframe | null {
    const track = this.getTrackById(trackId)
    if (!track) return null

    // Find the keyframe at or before the given time
    const keyframes = track.keyframes
      .filter((k) => k.time <= time)
      .sort((a, b) => b.time - a.time)

    return keyframes[0] || null
  }

  // Event system
  addEventListener(listener: TimelineEventListener): void {
    this.eventListeners.push(listener)
  }

  removeEventListener(listener: TimelineEventListener): void {
    const index = this.eventListeners.indexOf(listener)
    if (index !== -1) {
      this.eventListeners.splice(index, 1)
    }
  }

  private emitEvent(event: TimelineEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event)
      } catch (error) {
        logger.error('Timeline event listener error:', error)
      }
    }
  }

  // Private helper methods
  private evaluateTrack(track: TimelineTrack, time: Time): any {
    const keyframes = track.keyframes
    if (keyframes.length === 0) return undefined

    // Find relevant keyframes
    const currentKeyframe = keyframes.find((k) => k.time === time)
    if (currentKeyframe) return currentKeyframe.value

    const beforeKeyframe = keyframes.filter((k) => k.time < time).pop()
    const afterKeyframe = keyframes.find((k) => k.time > time)

    if (!beforeKeyframe) return keyframes[0].value
    if (!afterKeyframe) return beforeKeyframe.value

    // Interpolate between keyframes
    const dt = afterKeyframe.time - beforeKeyframe.time
    if (dt === 0) return beforeKeyframe.value

    const progress = (time - beforeKeyframe.time) / dt
    return this.interpolateValues(
      beforeKeyframe.value,
      afterKeyframe.value,
      progress,
      beforeKeyframe.interpolation
    )
  }

  private interpolateValues(
    startValue: any,
    endValue: any,
    progress: number,
    interpolation: InterpolationMode
  ): any {
    if (typeof startValue === 'number' && typeof endValue === 'number') {
      switch (interpolation) {
        case InterpolationMode.Linear:
          return startValue + (endValue - startValue) * progress

        case InterpolationMode.Stepped:
          return startValue

        case InterpolationMode.Bezier:
        case InterpolationMode.Smooth:
          // Simplified smooth interpolation
          const smoothProgress = progress * progress * (3 - 2 * progress)
          return startValue + (endValue - startValue) * smoothProgress

        default:
          return startValue + (endValue - startValue) * progress
      }
    }

    // Handle object interpolation
    if (
      startValue &&
      endValue &&
      typeof startValue === 'object' &&
      typeof endValue === 'object'
    ) {
      // Handle point interpolation
      if ('x' in startValue && 'y' in endValue) {
        return {
          x: this.interpolateValues(
            startValue.x,
            endValue.x,
            progress,
            interpolation
          ),
          y: this.interpolateValues(
            startValue.y,
            endValue.y,
            progress,
            interpolation
          ),
        }
      }

      // Handle color interpolation
      if ('r' in startValue && 'g' in endValue && 'b' in endValue) {
        return {
          r: this.interpolateValues(
            startValue.r,
            endValue.r,
            progress,
            interpolation
          ),
          g: this.interpolateValues(
            startValue.g,
            endValue.g,
            progress,
            interpolation
          ),
          b: this.interpolateValues(
            startValue.b,
            endValue.b,
            progress,
            interpolation
          ),
          a: this.interpolateValues(
            startValue.a ?? 1,
            endValue.a ?? 1,
            progress,
            interpolation
          ),
        }
      }
    }

    // For non-numeric values, return start value (could be enhanced)
    return startValue
  }

  // Utility methods
  getFrameAtTime(time: Time): number {
    return Math.round(time * this.frameRate)
  }

  getTimeAtFrame(frame: number): Time {
    return frame / this.frameRate
  }

  getTotalFrames(): number {
    return Math.round(this.duration * this.frameRate)
  }

  clone(): Timeline {
    const cloned = new Timeline(
      this.id,
      this.name,
      this.duration,
      this.frameRate
    )
    cloned.currentTime = this.currentTime
    cloned.playbackState = this.playbackState
    cloned.tracks = this.tracks.map((track) => ({
      ...track,
      keyframes: [...track.keyframes],
    }))
    cloned.markers = [...this.markers]
    cloned.selection = { ...this.selection }
    cloned.playbackConfig = { ...this.playbackConfig }

    return cloned
  }
}
