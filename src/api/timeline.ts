/**
 * @fileoverview Timeline and Animation API
 * @description Comprehensive animation system with keyframes, curves, and playback control
 * @author @darianrosebrook
 */

import type {
  Time,
  FrameRate,
  Keyframe,
  BezierCurve,
  Result,
  TimelineMetadata,
  PlaybackState,
  TrackProperties,
} from './animator-api'
import { InterpolationMode } from './animator-api'

/**
 * Timeline and animation management interface
 */
export interface TimelineAPI {
  // Timeline lifecycle
  createTimeline(
    name: string,
    duration: Time,
    frameRate: FrameRate
  ): Promise<Timeline>
  cloneTimeline(timelineId: string, name?: string): Promise<Timeline>
  deleteTimeline(
    timelineId: string
  ): Promise<Result<boolean, 'TIMELINE_NOT_FOUND' | 'HAS_TRACKS'>>

  // Timeline retrieval
  getTimeline(timelineId: string): Promise<Timeline | null>
  getTimelines(): Promise<Timeline[]>
  updateTimeline(
    timelineId: string,
    updates: Partial<Timeline>
  ): Promise<Result<Timeline, 'TIMELINE_NOT_FOUND'>>

  // Track retrieval
  getTrack(timelineId: string, trackId: string): Promise<TimelineTrack | null>
  getTracks(timelineId: string): Promise<TimelineTrack[]>

  // Playback control
  play(
    timelineId: string,
    options?: PlaybackOptions
  ): Promise<Result<void, 'TIMELINE_NOT_FOUND'>>
  pause(timelineId: string): Promise<Result<void, 'TIMELINE_NOT_FOUND'>>
  stop(timelineId: string): Promise<Result<void, 'TIMELINE_NOT_FOUND'>>
  seek(
    timelineId: string,
    time: Time,
    options?: SeekOptions
  ): Promise<Result<void, 'TIMELINE_NOT_FOUND' | 'INVALID_TIME'>>

  // Track management
  createTrack(
    timelineId: string,
    type: TrackType,
    name: string,
    properties?: TrackProperties
  ): Promise<TimelineTrack>
  getTracks(timelineId: string): Promise<TimelineTrack[]>
  updateTrack(
    trackId: string,
    updates: Partial<TimelineTrack>
  ): Promise<Result<TimelineTrack, 'TRACK_NOT_FOUND'>>
  deleteTrack(
    trackId: string
  ): Promise<Result<boolean, 'TRACK_NOT_FOUND' | 'TRACK_IN_USE'>>
  reorderTracks(timelineId: string, trackIds: string[]): Promise<void>

  // Keyframe management
  addKeyframe(
    trackId: string,
    keyframe: Keyframe
  ): Promise<Result<Keyframe, 'TRACK_NOT_FOUND' | 'INVALID_KEYFRAME'>>
  updateKeyframe(
    trackId: string,
    time: Time,
    updates: Partial<Keyframe>
  ): Promise<Result<Keyframe, 'TRACK_NOT_FOUND' | 'KEYFRAME_NOT_FOUND'>>
  removeKeyframe(
    trackId: string,
    time: Time
  ): Promise<Result<boolean, 'TRACK_NOT_FOUND' | 'KEYFRAME_NOT_FOUND'>>
  getKeyframes(trackId: string, timeRange?: TimeRange): Promise<Keyframe[]>

  // Animation curves and interpolation
  setInterpolation(
    trackId: string,
    interpolation: InterpolationMode
  ): Promise<Result<void, 'TRACK_NOT_FOUND'>>
  setEasing(
    trackId: string,
    time: Time,
    easing: BezierCurve
  ): Promise<Result<void, 'TRACK_NOT_FOUND' | 'KEYFRAME_NOT_FOUND'>>
  optimizeKeyframes(
    trackId: string,
    tolerance?: number
  ): Promise<Result<number, 'TRACK_NOT_FOUND'>>

  // Markers and annotations
  addMarker(
    timelineId: string,
    marker: TimelineMarker
  ): Promise<Result<TimelineMarker, 'TIMELINE_NOT_FOUND' | 'INVALID_MARKER'>>
  updateMarker(
    markerId: string,
    updates: Partial<TimelineMarker>
  ): Promise<Result<TimelineMarker, 'MARKER_NOT_FOUND'>>
  removeMarker(markerId: string): Promise<Result<boolean, 'MARKER_NOT_FOUND'>>
  getMarkers(
    timelineId: string,
    timeRange?: TimeRange
  ): Promise<TimelineMarker[]>

  // Timeline operations
  duplicateTimeline(
    timelineId: string,
    timeRange: TimeRange
  ): Promise<Result<Timeline, 'TIMELINE_NOT_FOUND'>>
  splitTimeline(
    timelineId: string,
    splitTime: Time
  ): Promise<
    Result<[Timeline, Timeline], 'TIMELINE_NOT_FOUND' | 'INVALID_SPLIT_TIME'>
  >
  mergeTimelines(
    timelineIds: string[]
  ): Promise<Result<Timeline, 'TIMELINE_NOT_FOUND' | 'INCOMPATIBLE_TIMELINES'>>

  // Events and subscriptions
  subscribeToTimelineChanges(
    timelineId: string,
    callback: (changes: TimelineChange[]) => void
  ): Promise<UnsubscribeFn>
  subscribeToPlaybackChanges(
    timelineId: string,
    callback: (state: PlaybackState) => void
  ): Promise<UnsubscribeFn>
  subscribeToKeyframesChanges(
    trackId: string,
    callback: (changes: KeyframeChange[]) => void
  ): Promise<UnsubscribeFn>
}

/**
 * Core timeline data structures
 */
export interface Timeline {
  id: string
  name: string
  duration: Time
  frameRate: FrameRate
  tracks: TimelineTrack[]
  markers: TimelineMarker[]
  playbackState: PlaybackState
  settings: TimelineSettings
  metadata: TimelineMetadata
}

export interface TimelineTrack {
  id: string
  name: string
  type: TrackType
  targetPath: string // Path to animated property (e.g., "nodes.shape_1.transform.position.x")
  keyframes: Keyframe[]
  enabled: boolean
  locked: boolean
  muted: boolean
  solo: boolean
  color: string
  height: number // Visual height in timeline
  properties: TrackProperties
}

export enum TrackType {
  Property = 'property', // Animate node properties
  Audio = 'audio', // Audio track
  Video = 'video', // Video track
  Data = 'data', // Custom data track
  Expression = 'expression', // Expression-driven animation
  Constraint = 'constraint', // Constraint animation
}

export interface TimelineTrackProperties {
  interpolation: InterpolationMode
  extrapolation: ExtrapolationMode
  keyframesOptimization: boolean
  autoKeyframes: boolean
  blendMode: BlendMode
}

export enum ExtrapolationMode {
  Hold = 'hold', // Hold first/last value
  Loop = 'loop', // Loop animation
  PingPong = 'ping_pong', // Ping-pong animation
  Linear = 'linear', // Continue with linear extrapolation
  None = 'none', // No extrapolation
}

// Use BlendMode from effects module instead of defining our own
import { BlendMode } from '../types/effects'
import { logger } from '@/core/logging/logger'

export { BlendMode }

/**
 * Timeline markers and annotations
 */
export interface TimelineMarker {
  id: string
  time: Time
  duration?: Time
  name: string
  color: string
  type: MarkerType
  description?: string
  metadata: Record<string, any>
}

export enum MarkerType {
  Chapter = 'chapter', // Chapter/section marker
  Cue = 'cue', // Audio/video cue point
  Comment = 'comment', // Comment marker
  Sync = 'sync', // Synchronization point
  Loop = 'loop', // Loop start/end
  Custom = 'custom', // Custom marker type
}

/**
 * Playback control and state
 */
export interface PlaybackOptions {
  startTime?: Time
  endTime?: Time
  loop?: boolean
  playbackRate?: number
  pingPong?: boolean
  syncToAudio?: boolean
}

export interface SeekOptions {
  smooth?: boolean
  snapToKeyframe?: boolean
  snapTolerance?: Time
}

export interface TimelinePlaybackState {
  isPlaying: boolean
  currentTime: Time
  playbackRate: number
  loop: boolean
  pingPong: boolean
  direction: PlaybackDirection
  audioSync: boolean
}

export enum PlaybackDirection {
  Forward = 1,
  Backward = -1,
}

/**
 * Timeline settings and configuration
 */
export interface TimelineSettings {
  snapToGrid: boolean
  gridSize: Time
  autoScroll: boolean
  showWaveforms: boolean
  showKeyframes: boolean
  zoom: number
  verticalScroll: number
  horizontalScroll: number
}

// TimelineMetadata is imported from main types

/**
 * Animation curve and interpolation system
 */
export interface AnimationCurve {
  keyframes: Keyframe[]
  interpolation: InterpolationMode
  extrapolation: ExtrapolationMode
  segments: AnimationSegment[]
}

export interface AnimationSegment {
  startTime: Time
  endTime: Time
  startValue: any
  endValue: any
  interpolation: InterpolationMode
  easing?: BezierCurve
}

/**
 * Advanced timeline operations
 */
export interface AdvancedTimelineAPI {
  // Animation utilities
  bakeAnimation(
    trackId: string,
    timeRange: TimeRange,
    step?: Time
  ): Promise<Keyframe[]>
  retimeAnimation(
    trackId: string,
    timeMap: Map<Time, Time>
  ): Promise<Result<void, 'TRACK_NOT_FOUND'>>
  reverseAnimation(
    trackId: string,
    timeRange?: TimeRange
  ): Promise<Result<void, 'TRACK_NOT_FOUND'>>
  scaleAnimation(
    trackId: string,
    scaleFactor: number,
    pivotTime?: Time
  ): Promise<Result<void, 'TRACK_NOT_FOUND'>>

  // Curve operations
  smoothCurve(
    trackId: string,
    tension?: number
  ): Promise<Result<void, 'TRACK_NOT_FOUND'>>
  simplifyCurve(
    trackId: string,
    tolerance: number
  ): Promise<Result<number, 'TRACK_NOT_FOUND'>>
  fitCurve(
    trackId: string,
    points: Array<{ time: Time; value: any }>
  ): Promise<Result<Keyframe[], 'TRACK_NOT_FOUND'>>

  // Expression and scripting
  setExpression(
    trackId: string,
    expression: string
  ): Promise<Result<void, 'TRACK_NOT_FOUND' | 'INVALID_EXPRESSION'>>
  getExpression(trackId: string): Promise<string | null>
  evaluateExpression(
    trackId: string,
    time: Time
  ): Promise<Result<any, 'TRACK_NOT_FOUND' | 'EVALUATION_ERROR'>>

  // Audio synchronization
  analyzeAudio(audioTrackId: string): Promise<AudioAnalysis>
  syncToAudio(
    trackId: string,
    audioTrackId: string
  ): Promise<Result<void, 'TRACK_NOT_FOUND' | 'AUDIO_TRACK_NOT_FOUND'>>
  createBeatMarkers(
    audioTrackId: string,
    sensitivity?: number
  ): Promise<TimelineMarker[]>

  // Performance optimization
  optimizeTimeline(timelineId: string): Promise<OptimizationResult>
  getTimelineMetrics(timelineId: string): Promise<TimelineMetrics>
  compressTimeline(
    timelineId: string,
    quality?: CompressionQuality
  ): Promise<Result<number, 'TIMELINE_NOT_FOUND'>>
}

/**
 * Audio analysis for synchronization
 */
export interface AudioAnalysis {
  duration: Time
  sampleRate: number
  channels: number
  beats: BeatMarker[]
  transients: TransientMarker[]
  frequencyBands: FrequencyBand[]
  loudness: LoudnessData
}

export interface BeatMarker {
  time: Time
  confidence: number
  strength: number
}

export interface TransientMarker {
  time: Time
  frequency: number
  strength: number
}

export interface FrequencyBand {
  startFreq: number
  endFreq: number
  data: number[] // RMS values over time
}

export interface LoudnessData {
  integrated: number // LUFS
  range: number // LRA
  truePeak: number // dBTP
  momentary: number[] // Over time
  shortTerm: number[] // Over time
}

/**
 * Timeline optimization and metrics
 */
export interface OptimizationResult {
  keyframesRemoved: number
  tracksOptimized: number
  memorySaved: number
  performanceImprovement: number
  warnings: string[]
}

export interface TimelineMetrics {
  totalKeyframes: number
  activeTracks: number
  memoryUsage: number
  evaluationTime: number
  cacheHitRate: number
  complexity: AnimationComplexity
}

export enum AnimationComplexity {
  Low = 'low', // Simple animations, few keyframes
  Medium = 'medium', // Moderate complexity
  High = 'high', // Complex animations, many keyframes
  Extreme = 'extreme', // Very complex, may cause performance issues
}

export enum CompressionQuality {
  Lossless = 'lossless',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

/**
 * Time range utilities
 */
export interface TimeRange {
  start: Time
  end: Time
  duration: Time
}

export const TimeRangeUtils = {
  create: (start: Time, end: Time): TimeRange => ({
    start,
    end,
    duration: end - start,
  }),

  contains: (range: TimeRange, time: Time): boolean =>
    time >= range.start && time <= range.end,

  overlaps: (range1: TimeRange, range2: TimeRange): boolean =>
    range1.start < range2.end && range2.start < range1.end,

  intersection: (range1: TimeRange, range2: TimeRange): TimeRange | null => {
    const start = Math.max(range1.start, range2.start)
    const end = Math.min(range1.end, range2.end)
    return start < end ? { start, end, duration: end - start } : null
  },

  union: (ranges: TimeRange[]): TimeRange => {
    if (ranges.length === 0) throw new Error('Cannot union empty ranges')
    const sorted = [...ranges].sort((a, b) => a.start - b.start)
    let result = sorted[0]

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start <= result.end) {
        result = {
          start: result.start,
          end: Math.max(result.end, sorted[i].end),
          duration: Math.max(result.end, sorted[i].end) - result.start,
        }
      } else {
        break
      }
    }

    return result
  },
}

/**
 * Keyframe utilities
 */
export const KeyframeUtils = {
  /**
   * Create a keyframe with validation
   */
  create: <T>(
    time: Time,
    value: T,
    interpolation: InterpolationMode = InterpolationMode.Linear
  ): Keyframe => {
    if (time < 0) throw new Error('Keyframe time must be non-negative')
    return { time, value, interpolation }
  },

  /**
   * Sort keyframes by time
   */
  sort: (keyframes: Keyframe[]): Keyframe[] =>
    [...keyframes].sort((a, b) => a.time - b.time),

  /**
   * Find keyframe at or before time
   */
  findAtOrBefore: (keyframes: Keyframe[], time: Time): Keyframe | null => {
    const sorted = KeyframeUtils.sort(keyframes)
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].time <= time) return sorted[i]
    }
    return null
  },

  /**
   * Find keyframe at or after time
   */
  findAtOrAfter: (keyframes: Keyframe[], time: Time): Keyframe | null => {
    const sorted = KeyframeUtils.sort(keyframes)
    for (const keyframe of sorted) {
      if (keyframe.time >= time) return keyframe
    }
    return null
  },

  /**
   * Interpolate between two keyframes
   */
  interpolate: (
    from: Keyframe,
    to: Keyframe,
    time: Time,
    interpolation?: InterpolationMode
  ): any => {
    const t = (time - from.time) / (to.time - from.time)
    const method = interpolation || from.interpolation

    switch (method) {
      case InterpolationMode.Linear:
        return KeyframeUtils.lerp(from.value, to.value, t)

      case InterpolationMode.Bezier:
        return KeyframeUtils.bezierInterpolate(
          from.value,
          to.value,
          t,
          from.easing,
          to.easing
        )

      case InterpolationMode.Stepped:
        return t < 1 ? from.value : to.value

      case InterpolationMode.Smooth:
        return KeyframeUtils.smoothInterpolate(from.value, to.value, t)

      default:
        return KeyframeUtils.lerp(from.value, to.value, t)
    }
  },

  /**
   * Linear interpolation between values
   */
  lerp: (from: any, to: any, t: number): any => {
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * t
    }

    if (
      typeof from === 'object' &&
      from !== null &&
      typeof to === 'object' &&
      to !== null
    ) {
      if (
        from.x !== undefined &&
        from.y !== undefined &&
        to.x !== undefined &&
        to.y !== undefined
      ) {
        return {
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
        }
      }

      if (
        from.r !== undefined &&
        from.g !== undefined &&
        from.b !== undefined
      ) {
        return {
          r: from.r + (to.r - from.r) * t,
          g: from.g + (to.g - from.g) * t,
          b: from.b + (to.b - from.b) * t,
          a: (from.a || 1) + ((to.a || 1) - (from.a || 1)) * t,
        }
      }
    }

    return from
  },

  /**
   * Bezier curve interpolation
   */
  bezierInterpolate: (
    from: any,
    to: any,
    t: number,
    _fromEasing?: BezierCurve,
    _toEasing?: BezierCurve
  ): any => {
    // Simplified bezier interpolation - real implementation would use proper curve math
    const easedT = t * t * (3 - 2 * t) // Smoothstep approximation
    return KeyframeUtils.lerp(from, to, easedT)
  },

  /**
   * Smooth interpolation using cubic function
   */
  smoothInterpolate: (from: any, to: any, t: number): any => {
    const easedT = t * t * (3 - 2 * t) // Smoothstep
    return KeyframeUtils.lerp(from, to, easedT)
  },
}

/**
 * Timeline change tracking
 */
export interface TimelineChange {
  id: string
  type: TimelineChangeType
  timelineId: string
  trackId?: string
  time?: Time
  oldValue?: any
  newValue?: any
  timestamp: Date
  author: string
}

export enum TimelineChangeType {
  TimelineCreated = 'timeline_created',
  TimelineUpdated = 'timeline_updated',
  TimelineDeleted = 'timeline_deleted',
  TrackAdded = 'track_added',
  TrackUpdated = 'track_updated',
  TrackRemoved = 'track_removed',
  KeyframeAdded = 'keyframe_added',
  KeyframeUpdated = 'keyframe_updated',
  KeyframeRemoved = 'keyframe_removed',
  MarkerAdded = 'marker_added',
  MarkerUpdated = 'marker_updated',
  MarkerRemoved = 'marker_removed',
  PlaybackStarted = 'playback_started',
  PlaybackPaused = 'playback_paused',
  PlaybackStopped = 'playback_stopped',
  PlaybackSeeked = 'playback_seeked',
}

export interface KeyframeChange {
  trackId: string
  time: Time
  type: KeyframeChangeType
  oldKeyframe?: Keyframe
  newKeyframe?: Keyframe
  timestamp: Date
}

export enum KeyframeChangeType {
  Added = 'added',
  Updated = 'updated',
  Removed = 'removed',
  Moved = 'moved',
}

/**
 * Timeline implementation with in-memory storage
 */
export class TimelineManager implements TimelineAPI {
  private timelines: Map<string, Timeline> = new Map()
  private nextId = 1

  async createTimeline(
    name: string,
    duration: Time,
    frameRate: FrameRate
  ): Promise<Timeline> {
    const id = `timeline_${this.nextId++}`
    const now = new Date()
    const timeline: Timeline = {
      id,
      name,
      duration,
      frameRate,
      tracks: [],
      markers: [],
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        playbackSpeed: 1,
        loop: false,
      },
      settings: {
        snapToGrid: true,
        gridSize: 1 / frameRate,
        autoScroll: true,
        showWaveforms: true,
        showKeyframes: true,
        zoom: 1,
        verticalScroll: 0,
        horizontalScroll: 0,
      },
      metadata: {
        createdAt: now,
        modifiedAt: now,
        version: '1.0.0',
      },
    }

    this.timelines.set(id, timeline)
    return timeline
  }

  async getTimeline(timelineId: string): Promise<Timeline | null> {
    return this.timelines.get(timelineId) || null
  }

  async updateTimeline(
    timelineId: string,
    updates: Partial<Timeline>
  ): Promise<Result<Timeline, 'TIMELINE_NOT_FOUND'>> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      return { success: false, error: 'TIMELINE_NOT_FOUND' }
    }

    const updatedTimeline = { ...timeline, ...updates }
    this.timelines.set(timelineId, updatedTimeline)
    return { success: true, data: updatedTimeline }
  }

  async deleteTimeline(
    timelineId: string
  ): Promise<Result<boolean, 'TIMELINE_NOT_FOUND' | 'HAS_TRACKS'>> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      return { success: false, error: 'TIMELINE_NOT_FOUND' }
    }

    if (timeline.tracks.length > 0) {
      return { success: false, error: 'HAS_TRACKS' }
    }

    this.timelines.delete(timelineId)
    return { success: true, data: true }
  }

  async play(
    timelineId: string,
    _options?: PlaybackOptions
  ): Promise<Result<void, 'TIMELINE_NOT_FOUND'>> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      return { success: false, error: 'TIMELINE_NOT_FOUND' }
    }

    // Basic playback implementation - in production would handle audio sync
    logger.info(`Playing timeline ${timelineId}`)
    return { success: true, data: undefined }
  }

  async pause(timelineId: string): Promise<Result<void, 'TIMELINE_NOT_FOUND'>> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      return { success: false, error: 'TIMELINE_NOT_FOUND' }
    }

    logger.info(`Pausing timeline ${timelineId}`)
    return { success: true, data: undefined }
  }

  async stop(timelineId: string): Promise<Result<void, 'TIMELINE_NOT_FOUND'>> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      return { success: false, error: 'TIMELINE_NOT_FOUND' }
    }

    logger.info(`Stopping timeline ${timelineId}`)
    return { success: true, data: undefined }
  }

  async seek(
    timelineId: string,
    time: Time,
    _options?: SeekOptions
  ): Promise<Result<void, 'TIMELINE_NOT_FOUND' | 'INVALID_TIME'>> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      return { success: false, error: 'TIMELINE_NOT_FOUND' }
    }

    if (time < 0 || time > timeline.duration) {
      return { success: false, error: 'INVALID_TIME' }
    }

    logger.info(`Seeking timeline ${timelineId} to ${time}`)
    return { success: true, data: undefined }
  }

  async createTrack(
    timelineId: string,
    type: TrackType,
    name: string,
    _properties?: TrackProperties
  ): Promise<TimelineTrack> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      throw new Error('Timeline not found')
    }

    const track: TimelineTrack = {
      id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      targetPath: '', // TODO: Set appropriate target path
      keyframes: [],
      enabled: true,
      locked: false,
      muted: false,
      solo: false,
      color: '#007acc',
      height: 40,
      properties: {
        volume: 1,
        blendMode: 'replace' as BlendMode,
        opacity: 1,
        visible: true,
      },
    }

    timeline.tracks.push(track)
    return track
  }

  async getTracks(timelineId: string): Promise<TimelineTrack[]> {
    const timeline = this.timelines.get(timelineId)
    return timeline ? timeline.tracks : []
  }

  async getTrack(
    timelineId: string,
    trackId: string
  ): Promise<TimelineTrack | null> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) return null
    return timeline.tracks.find((track) => track.id === trackId) || null
  }

  async updateTrack(
    trackId: string,
    updates: Partial<TimelineTrack>
  ): Promise<Result<TimelineTrack, 'TRACK_NOT_FOUND'>> {
    for (const timeline of this.timelines.values()) {
      const trackIndex = timeline.tracks.findIndex((t) => t.id === trackId)
      if (trackIndex !== -1) {
        const updatedTrack = { ...timeline.tracks[trackIndex], ...updates }
        timeline.tracks[trackIndex] = updatedTrack
        return { success: true, data: updatedTrack }
      }
    }
    return { success: false, error: 'TRACK_NOT_FOUND' }
  }

  async deleteTrack(
    trackId: string
  ): Promise<Result<boolean, 'TRACK_NOT_FOUND' | 'TRACK_IN_USE'>> {
    for (const timeline of this.timelines.values()) {
      const trackIndex = timeline.tracks.findIndex((t) => t.id === trackId)
      if (trackIndex !== -1) {
        timeline.tracks.splice(trackIndex, 1)
        return { success: true, data: true }
      }
    }
    return { success: false, error: 'TRACK_NOT_FOUND' }
  }

  async reorderTracks(timelineId: string, trackIds: string[]): Promise<void> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      throw new Error('Timeline not found')
    }

    const reorderedTracks = trackIds
      .map((id) => timeline.tracks.find((t) => t.id === id))
      .filter((track) => track !== undefined) as TimelineTrack[]

    timeline.tracks = reorderedTracks
  }

  async addKeyframe(
    trackId: string,
    keyframe: Keyframe
  ): Promise<Result<Keyframe, 'TRACK_NOT_FOUND' | 'INVALID_KEYFRAME'>> {
    for (const timeline of this.timelines.values()) {
      const track = timeline.tracks.find((t) => t.id === trackId)
      if (track) {
        if (keyframe.time < 0 || keyframe.time > timeline.duration) {
          return { success: false, error: 'INVALID_KEYFRAME' }
        }

        track.keyframes.push(keyframe)
        track.keyframes.sort((a, b) => a.time - b.time)
        return { success: true, data: keyframe }
      }
    }
    return { success: false, error: 'TRACK_NOT_FOUND' }
  }

  async updateKeyframe(
    trackId: string,
    time: Time,
    updates: Partial<Keyframe>
  ): Promise<Result<Keyframe, 'TRACK_NOT_FOUND' | 'KEYFRAME_NOT_FOUND'>> {
    for (const timeline of this.timelines.values()) {
      const track = timeline.tracks.find((t) => t.id === trackId)
      if (track) {
        const keyframeIndex = track.keyframes.findIndex((k) => k.time === time)
        if (keyframeIndex !== -1) {
          const updatedKeyframe = {
            ...track.keyframes[keyframeIndex],
            ...updates,
          }
          track.keyframes[keyframeIndex] = updatedKeyframe
          return { success: true, data: updatedKeyframe }
        }
        return { success: false, error: 'KEYFRAME_NOT_FOUND' }
      }
    }
    return { success: false, error: 'TRACK_NOT_FOUND' }
  }

  async removeKeyframe(
    trackId: string,
    time: Time
  ): Promise<Result<boolean, 'TRACK_NOT_FOUND' | 'KEYFRAME_NOT_FOUND'>> {
    for (const timeline of this.timelines.values()) {
      const track = timeline.tracks.find((t) => t.id === trackId)
      if (track) {
        const keyframeIndex = track.keyframes.findIndex((k) => k.time === time)
        if (keyframeIndex !== -1) {
          track.keyframes.splice(keyframeIndex, 1)
          return { success: true, data: true }
        }
        return { success: false, error: 'KEYFRAME_NOT_FOUND' }
      }
    }
    return { success: false, error: 'TRACK_NOT_FOUND' }
  }

  async getKeyframes(
    trackId: string,
    timeRange?: TimeRange
  ): Promise<Keyframe[]> {
    for (const timeline of this.timelines.values()) {
      const track = timeline.tracks.find((t) => t.id === trackId)
      if (track) {
        let keyframes = track.keyframes

        if (timeRange) {
          keyframes = keyframes.filter(
            (k) => k.time >= timeRange.start && k.time <= timeRange.end
          )
        }

        return keyframes
      }
    }
    return []
  }

  async setInterpolation(
    trackId: string,
    interpolation: InterpolationMode
  ): Promise<Result<void, 'TRACK_NOT_FOUND'>> {
    for (const timeline of this.timelines.values()) {
      const track = timeline.tracks.find((t) => t.id === trackId)
      if (track) {
        track.keyframes.forEach((keyframe) => {
          keyframe.interpolation = interpolation
        })
        return { success: true, data: undefined }
      }
    }
    return { success: false, error: 'TRACK_NOT_FOUND' }
  }

  async setEasing(
    trackId: string,
    time: Time,
    _easing: BezierCurve
  ): Promise<Result<void, 'TRACK_NOT_FOUND' | 'KEYFRAME_NOT_FOUND'>> {
    for (const timeline of this.timelines.values()) {
      const track = timeline.tracks.find((t) => t.id === trackId)
      if (track) {
        const keyframe = track.keyframes.find((k) => k.time === time)
        if (keyframe) {
          // Note: Keyframe interface may need to be extended to include easing
          logger.info(`Setting easing for keyframe at ${time}`)
          return { success: true, data: undefined }
        }
        return { success: false, error: 'KEYFRAME_NOT_FOUND' }
      }
    }
    return { success: false, error: 'TRACK_NOT_FOUND' }
  }

  async optimizeKeyframes(
    trackId: string,
    _tolerance?: number
  ): Promise<Result<number, 'TRACK_NOT_FOUND'>> {
    for (const timeline of this.timelines.values()) {
      const track = timeline.tracks.find((t) => t.id === trackId)
      if (track) {
        const originalCount = track.keyframes.length
        // Simple optimization: remove duplicate keyframes at same time
        const uniqueKeyframes = track.keyframes.filter(
          (keyframe, index, arr) =>
            arr.findIndex((k) => k.time === keyframe.time) === index
        )
        track.keyframes = uniqueKeyframes
        const removedCount = originalCount - uniqueKeyframes.length
        return { success: true, data: removedCount }
      }
    }
    return { success: false, error: 'TRACK_NOT_FOUND' }
  }

  async addMarker(
    timelineId: string,
    marker: TimelineMarker
  ): Promise<Result<TimelineMarker, 'TIMELINE_NOT_FOUND' | 'INVALID_MARKER'>> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      return { success: false, error: 'TIMELINE_NOT_FOUND' }
    }

    if (marker.time < 0 || marker.time > timeline.duration) {
      return { success: false, error: 'INVALID_MARKER' }
    }

    const newMarker: TimelineMarker = {
      id: `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      time: marker.time,
      name: marker.name,
      color: marker.color,
      type: MarkerType.Comment,
      metadata: {},
    }

    timeline.markers.push(newMarker)
    timeline.markers.sort((a, b) => a.time - b.time)
    return { success: true, data: newMarker }
  }

  async updateMarker(
    markerId: string,
    updates: Partial<TimelineMarker>
  ): Promise<Result<TimelineMarker, 'MARKER_NOT_FOUND'>> {
    for (const timeline of this.timelines.values()) {
      const markerIndex = timeline.markers.findIndex(
        (m) => m.time === parseFloat(markerId)
      )
      if (markerIndex !== -1) {
        const updatedMarker = { ...timeline.markers[markerIndex], ...updates }
        timeline.markers[markerIndex] = updatedMarker
        return { success: true, data: updatedMarker }
      }
    }
    return { success: false, error: 'MARKER_NOT_FOUND' }
  }

  async removeMarker(
    markerId: string
  ): Promise<Result<boolean, 'MARKER_NOT_FOUND'>> {
    for (const timeline of this.timelines.values()) {
      const markerIndex = timeline.markers.findIndex(
        (m) => m.time === parseFloat(markerId)
      )
      if (markerIndex !== -1) {
        timeline.markers.splice(markerIndex, 1)
        return { success: true, data: true }
      }
    }
    return { success: false, error: 'MARKER_NOT_FOUND' }
  }

  async getMarkers(
    timelineId: string,
    timeRange?: TimeRange
  ): Promise<TimelineMarker[]> {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      return []
    }

    let markers = timeline.markers

    if (timeRange) {
      markers = markers.filter(
        (m) => m.time >= timeRange.start && m.time <= timeRange.end
      )
    }

    return markers
  }

  async duplicateTimeline(
    timelineId: string,
    timeRange: TimeRange
  ): Promise<Result<Timeline, 'TIMELINE_NOT_FOUND'>> {
    const originalTimeline = this.timelines.get(timelineId)
    if (!originalTimeline) {
      return { success: false, error: 'TIMELINE_NOT_FOUND' }
    }

    const newId = `timeline_${this.nextId++}`
    const newTimeline: Timeline = {
      id: newId,
      name: `${originalTimeline.name || 'Timeline'} (Duplicated)`,
      duration: timeRange.end - timeRange.start,
      frameRate: originalTimeline.frameRate,
      tracks: originalTimeline.tracks.map((track) => ({
        ...track,
        keyframes: track.keyframes
          .filter((k) => k.time >= timeRange.start && k.time <= timeRange.end)
          .map((k) => ({ ...k, time: k.time - timeRange.start })),
      })),
      markers: originalTimeline.markers
        .filter((m) => m.time >= timeRange.start && m.time <= timeRange.end)
        .map((m) => ({ ...m, time: m.time - timeRange.start })),
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        playbackSpeed: 1,
        loop: false,
      },
      settings: originalTimeline.settings || {
        snapToGrid: true,
        gridSize: 1 / originalTimeline.frameRate,
        autoScroll: true,
        showWaveforms: true,
        showKeyframes: true,
        zoom: 1,
        verticalScroll: 0,
        horizontalScroll: 0,
      },
      metadata: {
        createdAt: new Date(),
        modifiedAt: new Date(),
        version: '1.0.0',
      },
    }

    this.timelines.set(newId, newTimeline)
    return { success: true, data: newTimeline }
  }

  async splitTimeline(
    timelineId: string,
    splitTime: Time
  ): Promise<
    Result<[Timeline, Timeline], 'TIMELINE_NOT_FOUND' | 'INVALID_SPLIT_TIME'>
  > {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      return { success: false, error: 'TIMELINE_NOT_FOUND' }
    }

    if (splitTime < 0 || splitTime > timeline.duration) {
      return { success: false, error: 'INVALID_SPLIT_TIME' }
    }

    const firstTimeline: Timeline = {
      id: `timeline_${this.nextId++}`,
      name: `${timeline.name || 'Timeline'} (Part 1)`,
      duration: splitTime,
      frameRate: timeline.frameRate,
      tracks: timeline.tracks.map((track) => ({
        ...track,
        keyframes: track.keyframes.filter((k) => k.time <= splitTime),
      })),
      markers: timeline.markers.filter((m) => m.time <= splitTime),
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        playbackSpeed: 1,
        loop: false,
      },
      settings: timeline.settings || {
        snapToGrid: true,
        gridSize: 1 / timeline.frameRate,
        autoScroll: true,
        showWaveforms: true,
        showKeyframes: true,
        zoom: 1,
        verticalScroll: 0,
        horizontalScroll: 0,
      },
      metadata: {
        createdAt: new Date(),
        modifiedAt: new Date(),
        version: '1.0.0',
      },
    }

    const secondTimeline: Timeline = {
      id: `timeline_${this.nextId++}`,
      name: `${timeline.name || 'Timeline'} (Part 2)`,
      duration: timeline.duration - splitTime,
      frameRate: timeline.frameRate,
      tracks: timeline.tracks.map((track) => ({
        ...track,
        keyframes: track.keyframes
          .filter((k) => k.time > splitTime)
          .map((k) => ({ ...k, time: k.time - splitTime })),
      })),
      markers: timeline.markers
        .filter((m) => m.time > splitTime)
        .map((m) => ({ ...m, time: m.time - splitTime })),
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        playbackSpeed: 1,
        loop: false,
      },
      settings: timeline.settings || {
        snapToGrid: true,
        gridSize: 1 / timeline.frameRate,
        autoScroll: true,
        showWaveforms: true,
        showKeyframes: true,
        zoom: 1,
        verticalScroll: 0,
        horizontalScroll: 0,
      },
      metadata: {
        createdAt: new Date(),
        modifiedAt: new Date(),
        version: '1.0.0',
      },
    }

    return { success: true, data: [firstTimeline, secondTimeline] }
  }

  async mergeTimelines(
    timelineIds: string[]
  ): Promise<
    Result<Timeline, 'TIMELINE_NOT_FOUND' | 'INCOMPATIBLE_TIMELINES'>
  > {
    const timelines = timelineIds
      .map((id) => this.timelines.get(id))
      .filter((timeline) => timeline !== undefined) as Timeline[]

    if (timelines.length !== timelineIds.length) {
      return { success: false, error: 'TIMELINE_NOT_FOUND' }
    }

    // Check if all timelines have the same frame rate
    const frameRates = [...new Set(timelines.map((t) => t.frameRate))]
    if (frameRates.length > 1) {
      return { success: false, error: 'INCOMPATIBLE_TIMELINES' }
    }

    const mergedTimeline: Timeline = {
      id: `timeline_${this.nextId++}`,
      name: 'Merged Timeline',
      duration: Math.max(...timelines.map((t) => t.duration)),
      frameRate: frameRates[0],
      tracks: timelines.flatMap((timeline) => timeline.tracks),
      markers: timelines.flatMap((timeline) => timeline.markers),
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        playbackSpeed: 1,
        loop: false,
      },
      settings: {
        snapToGrid: true,
        gridSize: 1 / frameRates[0],
        autoScroll: true,
        showWaveforms: true,
        showKeyframes: true,
        zoom: 1,
        verticalScroll: 0,
        horizontalScroll: 0,
      },
      metadata: {
        createdAt: new Date(),
        modifiedAt: new Date(),
        version: '1.0.0',
      },
    }

    return { success: true, data: mergedTimeline }
  }

  async subscribeToTimelineChanges(
    timelineId: string,
    _callback: (changes: TimelineChange[]) => void
  ): Promise<UnsubscribeFn> {
    // Basic subscription implementation - in production would use proper event system
    logger.info(`Subscribed to timeline changes for ${timelineId}`)
    return () => {
      logger.info(`Unsubscribed from timeline changes for ${timelineId}`)
    }
  }

  async subscribeToPlaybackChanges(
    timelineId: string,
    _callback: (state: PlaybackState) => void
  ): Promise<UnsubscribeFn> {
    // Basic subscription implementation - in production would use proper event system
    logger.info(`Subscribed to playback changes for ${timelineId}`)
    return () => {
      logger.info(`Unsubscribed from playback changes for ${timelineId}`)
    }
  }

  async subscribeToKeyframesChanges(
    trackId: string,
    _callback: (changes: KeyframeChange[]) => void
  ): Promise<UnsubscribeFn> {
    // Basic subscription implementation - in production would use proper event system
    logger.info(`Subscribed to keyframe changes for ${trackId}`)
    return () => {
      logger.info(`Unsubscribed from keyframe changes for ${trackId}`)
    }
  }

  async cloneTimeline(timelineId: string, name?: string): Promise<Timeline> {
    const originalTimeline = this.timelines.get(timelineId)
    if (!originalTimeline) {
      throw new Error(`Timeline ${timelineId} not found`)
    }

    const clonedId = `timeline_${this.nextId++}`
    const clonedTimeline: Timeline = {
      ...originalTimeline,
      id: clonedId,
      name: name || `${originalTimeline.name} (Copy)`,
      metadata: {
        ...originalTimeline.metadata,
        createdAt: new Date(),
        modifiedAt: new Date(),
        version: '1.0.0',
      },
      tracks: originalTimeline.tracks.map((track) => ({
        ...track,
        id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        keyframes: track.keyframes.map((keyframe) => ({
          ...keyframe,
          id: `keyframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        })),
      })),
      markers: originalTimeline.markers.map((marker) => ({
        ...marker,
        id: `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })),
    }

    this.timelines.set(clonedId, clonedTimeline)
    return clonedTimeline
  }

  async getTimelines(): Promise<Timeline[]> {
    return Array.from(this.timelines.values())
  }
}

/**
 * Timeline error types
 */
export class TimelineError extends Error {
  constructor(
    message: string,
    public code: string,
    public timelineId?: string,
    public trackId?: string
  ) {
    super(message)
    this.name = 'TimelineError'
  }
}

export const TimelineErrorCodes = {
  TIMELINE_NOT_FOUND: 'TIMELINE_NOT_FOUND',
  TRACK_NOT_FOUND: 'TRACK_NOT_FOUND',
  KEYFRAME_NOT_FOUND: 'KEYFRAME_NOT_FOUND',
  INVALID_TIME: 'INVALID_TIME',
  INVALID_KEYFRAME: 'INVALID_KEYFRAME',
  INVALID_MARKER: 'INVALID_MARKER',
  INVALID_SPLIT_TIME: 'INVALID_SPLIT_TIME',
  HAS_TRACKS: 'HAS_TRACKS',
  TRACK_IN_USE: 'TRACK_IN_USE',
  INCOMPATIBLE_TIMELINES: 'INCOMPATIBLE_TIMELINES',
} as const

export type TimelineErrorCode =
  (typeof TimelineErrorCodes)[keyof typeof TimelineErrorCodes]

export type UnsubscribeFn = () => void
