/**
 * @fileoverview Core Timeline System Types and Interfaces
 * @author @darianrosebrook
 */

import { Time, Result } from '@/types'

/**
 * Timeline playback states
 */
export enum PlaybackState {
  Stopped = 'stopped',
  Playing = 'playing',
  Paused = 'paused',
  Scrubbing = 'scrubbing',
}

/**
 * Interpolation modes for animation curves
 */
export enum InterpolationMode {
  Linear = 'linear',
  Bezier = 'bezier',
  Stepped = 'stepped',
  Smooth = 'smooth',
}

/**
 * Easing function types
 */
export enum EasingType {
  Linear = 'linear',
  EaseIn = 'easeIn',
  EaseOut = 'easeOut',
  EaseInOut = 'easeInOut',
  Bezier = 'bezier',
  Step = 'step',
}

/**
 * Timeline track types
 */
export enum TrackType {
  Property = 'property',
  Audio = 'audio',
  Video = 'video',
  Effect = 'effect',
}

/**
 * Keyframe data structure
 */
export interface Keyframe {
  id: string
  time: Time
  value: any
  interpolation: InterpolationMode
  easing?: BezierCurve
  selected?: boolean
}

/**
 * Bezier curve for custom easing
 */
export interface BezierCurve {
  p1x: number
  p1y: number
  p2x: number
  p2y: number
}

/**
 * Animation curve for smooth interpolation
 */
export interface AnimationCurve {
  keyframes: Keyframe[]
  evaluate(time: Time): any
  getTangentAt(time: Time): { in: number; out: number }
  addKeyframe(keyframe: Keyframe): void
  removeKeyframe(keyframeId: string): void
  updateKeyframe(keyframeId: string, updates: Partial<Keyframe>): void
}

/**
 * Timeline track for organizing keyframes
 */
export interface TimelineTrack {
  id: string
  name: string
  type: TrackType
  targetNodeId?: string
  propertyPath?: string
  keyframes: Keyframe[]
  enabled: boolean
  locked: boolean
  muted?: boolean
  color?: string
  height?: number
}

/**
 * Timeline marker for navigation and synchronization
 */
export interface TimelineMarker {
  id: string
  time: Time
  name: string
  color?: string
  type?: 'chapter' | 'sync' | 'note'
}

/**
 * Playback configuration
 */
export interface PlaybackConfig {
  startTime: Time
  endTime: Time
  loop: boolean
  speed: number
  frameStep?: number
}

/**
 * Timeline selection state
 */
export interface TimelineSelection {
  tracks: string[]
  keyframes: string[]
  timeRange?: { start: Time; end: Time }
}

/**
 * Core timeline data structure
 */
export interface Timeline {
  id: string
  name: string
  duration: Time
  frameRate: number
  currentTime: Time
  playbackState: PlaybackState
  tracks: TimelineTrack[]
  markers: TimelineMarker[]
  selection: TimelineSelection
  playbackConfig: PlaybackConfig

  // Core methods
  addTrack(track: Omit<TimelineTrack, 'id'>): Result<TimelineTrack>
  removeTrack(trackId: string): Result<boolean>
  updateTrack(
    trackId: string,
    updates: Partial<TimelineTrack>
  ): Result<TimelineTrack>

  addKeyframe(trackId: string, keyframe: Omit<Keyframe, 'id'>): Result<Keyframe>
  removeKeyframe(trackId: string, keyframeId: string): Result<boolean>
  updateKeyframe(
    trackId: string,
    keyframeId: string,
    updates: Partial<Keyframe>
  ): Result<Keyframe>

  addMarker(marker: Omit<TimelineMarker, 'id'>): Result<TimelineMarker>
  removeMarker(markerId: string): Result<boolean>

  setCurrentTime(time: Time): Result<void>
  setPlaybackState(state: PlaybackState): Result<void>
  setPlaybackConfig(config: Partial<PlaybackConfig>): Result<void>

  evaluate(time: Time): Result<Map<string, any>>
  getTrackById(trackId: string): TimelineTrack | null
  getKeyframeAtTime(trackId: string, time: Time): Keyframe | null
}

/**
 * Timeline controller for playback and editing
 */
export interface TimelineController {
  timeline: Timeline

  // Playback control
  play(): Result<void>
  pause(): Result<void>
  stop(): Result<void>
  seek(time: Time): Result<void>
  scrub(time: Time): Result<void>

  // Editing operations
  selectTracks(trackIds: string[]): Result<void>
  selectKeyframes(keyframeIds: string[]): Result<void>
  selectTimeRange(start: Time, end: Time): Result<void>
  clearSelection(): Result<void>

  // Bulk operations
  moveSelectedKeyframes(deltaTime: Time): Result<void>
  scaleSelectedKeyframes(factor: number, origin?: Time): Result<void>
  deleteSelectedKeyframes(): Result<void>
  duplicateSelectedKeyframes(): Result<void>

  // Undo/Redo
  canUndo(): boolean
  canRedo(): boolean
  undo(): Result<void>
  redo(): Result<void>
}

/**
 * Animation curve evaluator
 */
export interface CurveEvaluator {
  evaluateLinear(keyframes: Keyframe[], time: Time): any
  evaluateBezier(keyframes: Keyframe[], time: Time): any
  evaluateStepped(keyframes: Keyframe[], time: Time): any
  evaluateSmooth(keyframes: Keyframe[], time: Time): any
}

/**
 * Timeline event types
 */
export interface TimelineEvent {
  type:
    | 'track_added'
    | 'track_removed'
    | 'keyframe_added'
    | 'keyframe_removed'
    | 'keyframe_updated'
    | 'time_changed'
    | 'playback_state_changed'
  timelineId: string
  data: any
  timestamp: number
}

/**
 * Timeline event listener
 */
export type TimelineEventListener = (event: TimelineEvent) => void

/**
 * Timeline history for undo/redo
 */
export interface TimelineHistory {
  canUndo(): boolean
  canRedo(): boolean
  undo(): Result<void>
  redo(): Result<void>
  pushState(state: any): void
  clear(): void
}

/**
 * Timeline performance metrics
 */
export interface TimelineMetrics {
  frameTimeMs: number
  evaluationTimeMs: number
  renderTimeMs: number
  memoryUsageMB: number
  keyframeCount: number
  trackCount: number
}

/**
 * Timeline cache for performance optimization
 */
export interface TimelineCache {
  get(time: Time): any | null
  set(time: Time, value: any): void
  clear(): void
  getStats(): { size: number; hitRate: number }
}

/**
 * Timeline renderer interface for UI integration
 */
export interface TimelineRenderer {
  renderTimeline(
    timeline: Timeline,
    viewport: { width: number; height: number }
  ): void
  renderTrack(track: TimelineTrack, yOffset: number): void
  renderKeyframe(
    keyframe: Keyframe,
    track: TimelineTrack,
    x: number,
    y: number
  ): void
  renderCurve(curve: AnimationCurve, track: TimelineTrack): void
  renderPlayhead(time: Time, x: number): void
  renderSelection(selection: TimelineSelection): void
}
