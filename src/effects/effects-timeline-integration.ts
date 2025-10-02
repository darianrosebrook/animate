/**
 * @fileoverview Effects Timeline Integration
 * @description Integration between effects system and timeline for parameter animation
 * @author @darianrosebrook
 */

import { Result, Time } from '../types'
import { Timeline, TimelineTrack, Keyframe, TrackType, InterpolationMode } from '../timeline/timeline-types'
import { 
  EffectInstance, 
  EffectParameters,
  GlowParameters,
  GaussianBlurParameters,
  BrightnessContrastParameters,
  LevelsParameters,
  CurvesParameters
} from '../types/effects'
import { EffectsSystem } from './effects-system'
import { logger } from '../core/logging/logger'

/**
 * Effect parameter animation track
 */
export interface EffectParameterTrack {
  effectId: string
  parameterName: string
  timelineTrack: TimelineTrack
  keyframes: Keyframe[]
}

/**
 * Effect timeline integration manager
 */
export class EffectsTimelineIntegration {
  private effectsSystem: EffectsSystem
  private timeline: Timeline
  private effectTracks: Map<string, EffectParameterTrack[]> = new Map()
  private parameterAnimations: Map<string, Map<string, any>> = new Map()

  constructor(effectsSystem: EffectsSystem, timeline: Timeline) {
    this.effectsSystem = effectsSystem
    this.timeline = timeline
  }

  /**
   * Initialize effects timeline integration
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      logger.info('Initializing effects timeline integration')
      
      // Set up timeline event listeners
      this.timeline.addEventListener('timeChanged', this.handleTimeChange.bind(this))
      this.timeline.addEventListener('trackAdded', this.handleTrackAdded.bind(this))
      this.timeline.addEventListener('trackRemoved', this.handleTrackRemoved.bind(this))
      this.timeline.addEventListener('keyframeAdded', this.handleKeyframeAdded.bind(this))
      this.timeline.addEventListener('keyframeRemoved', this.handleKeyframeRemoved.bind(this))
      
      logger.info('✅ Effects timeline integration initialized successfully')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EFFECTS_TIMELINE_INIT_ERROR',
          message: `Failed to initialize effects timeline integration: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Create effect parameter track
   */
  createEffectParameterTrack(
    effectId: string,
    parameterName: string,
    initialValue: any
  ): Result<EffectParameterTrack> {
    try {
      // Create timeline track for effect parameter
      const trackId = `effect_${effectId}_${parameterName}`
      const track: TimelineTrack = {
        id: trackId,
        name: `${effectId} - ${parameterName}`,
        type: TrackType.Effect,
        targetNodeId: effectId,
        propertyPath: parameterName,
        keyframes: [],
        enabled: true,
        locked: false,
        color: this.getParameterColor(parameterName),
        height: 40,
      }

      // Add initial keyframe at time 0
      const initialKeyframe: Keyframe = {
        id: `${trackId}_initial`,
        time: 0,
        value: initialValue,
        interpolation: InterpolationMode.Linear,
      }

      track.keyframes.push(initialKeyframe)

      // Create effect parameter track
      const effectTrack: EffectParameterTrack = {
        effectId,
        parameterName,
        timelineTrack: track,
        keyframes: [initialKeyframe],
      }

      // Store the track
      if (!this.effectTracks.has(effectId)) {
        this.effectTracks.set(effectId, [])
      }
      this.effectTracks.get(effectId)!.push(effectTrack)

      // Add track to timeline
      this.timeline.addTrack(track)

      logger.info(`Created effect parameter track: ${trackId}`)
      return { success: true, data: effectTrack }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_EFFECT_TRACK_ERROR',
          message: `Failed to create effect parameter track: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Add keyframe to effect parameter
   */
  addEffectKeyframe(
    effectId: string,
    parameterName: string,
    time: Time,
    value: any,
    interpolation: InterpolationMode = InterpolationMode.Linear
  ): Result<Keyframe> {
    try {
      const effectTracks = this.effectTracks.get(effectId)
      if (!effectTracks) {
        return {
          success: false,
          error: {
            code: 'EFFECT_NOT_FOUND',
            message: `Effect ${effectId} not found`,
          },
        }
      }

      const parameterTrack = effectTracks.find(track => track.parameterName === parameterName)
      if (!parameterTrack) {
        return {
          success: false,
          error: {
            code: 'PARAMETER_TRACK_NOT_FOUND',
            message: `Parameter track ${parameterName} not found for effect ${effectId}`,
          },
        }
      }

      // Create new keyframe
      const keyframeId = `${effectId}_${parameterName}_${time}`
      const keyframe: Keyframe = {
        id: keyframeId,
        time,
        value,
        interpolation,
      }

      // Add keyframe to timeline track
      this.timeline.addKeyframe(parameterTrack.timelineTrack.id, keyframe)

      // Update local keyframes
      parameterTrack.keyframes.push(keyframe)
      parameterTrack.keyframes.sort((a, b) => a.time - b.time)

      logger.info(`Added effect keyframe: ${keyframeId} at time ${time}`)
      return { success: true, data: keyframe }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADD_EFFECT_KEYFRAME_ERROR',
          message: `Failed to add effect keyframe: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Remove keyframe from effect parameter
   */
  removeEffectKeyframe(
    effectId: string,
    parameterName: string,
    keyframeId: string
  ): Result<boolean> {
    try {
      const effectTracks = this.effectTracks.get(effectId)
      if (!effectTracks) {
        return {
          success: false,
          error: {
            code: 'EFFECT_NOT_FOUND',
            message: `Effect ${effectId} not found`,
          },
        }
      }

      const parameterTrack = effectTracks.find(track => track.parameterName === parameterName)
      if (!parameterTrack) {
        return {
          success: false,
          error: {
            code: 'PARAMETER_TRACK_NOT_FOUND',
            message: `Parameter track ${parameterName} not found for effect ${effectId}`,
          },
        }
      }

      // Remove keyframe from timeline track
      this.timeline.removeKeyframe(parameterTrack.timelineTrack.id, keyframeId)

      // Update local keyframes
      parameterTrack.keyframes = parameterTrack.keyframes.filter(kf => kf.id !== keyframeId)

      logger.info(`Removed effect keyframe: ${keyframeId}`)
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REMOVE_EFFECT_KEYFRAME_ERROR',
          message: `Failed to remove effect keyframe: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Update effect parameters based on current timeline time
   */
  updateEffectParameters(time: Time): Result<boolean> {
    try {
      for (const [effectId, parameterTracks] of this.effectTracks) {
        const effect = this.effectsSystem.getEffect(effectId)
        if (!effect) continue

        const updatedParameters: Partial<EffectParameters> = {}

        for (const parameterTrack of parameterTracks) {
          const animatedValue = this.evaluateParameterAtTime(parameterTrack, time)
          if (animatedValue !== undefined) {
            updatedParameters[parameterTrack.parameterName as keyof EffectParameters] = animatedValue
          }
        }

        // Update effect parameters
        if (Object.keys(updatedParameters).length > 0) {
          this.effectsSystem.updateEffectParameters(effectId, updatedParameters)
        }
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_EFFECT_PARAMETERS_ERROR',
          message: `Failed to update effect parameters: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get effect parameter tracks
   */
  getEffectParameterTracks(effectId: string): EffectParameterTrack[] {
    return this.effectTracks.get(effectId) || []
  }

  /**
   * Remove effect and all its parameter tracks
   */
  removeEffect(effectId: string): Result<boolean> {
    try {
      const parameterTracks = this.effectTracks.get(effectId)
      if (!parameterTracks) {
        return {
          success: false,
          error: {
            code: 'EFFECT_NOT_FOUND',
            message: `Effect ${effectId} not found`,
          },
        }
      }

      // Remove all parameter tracks from timeline
      for (const parameterTrack of parameterTracks) {
        this.timeline.removeTrack(parameterTrack.timelineTrack.id)
      }

      // Remove from local storage
      this.effectTracks.delete(effectId)

      logger.info(`Removed effect and all parameter tracks: ${effectId}`)
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REMOVE_EFFECT_ERROR',
          message: `Failed to remove effect: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Handle timeline time changes
   */
  private handleTimeChange(event: { time: Time }): void {
    this.updateEffectParameters(event.time)
  }

  /**
   * Handle track added events
   */
  private handleTrackAdded(event: { track: TimelineTrack }): void {
    if (event.track.type === TrackType.Effect) {
      logger.info(`Effect track added: ${event.track.id}`)
    }
  }

  /**
   * Handle track removed events
   */
  private handleTrackRemoved(event: { trackId: string }): void {
    // Find and remove from local storage
    for (const [effectId, parameterTracks] of this.effectTracks) {
      const index = parameterTracks.findIndex(track => track.timelineTrack.id === event.trackId)
      if (index !== -1) {
        parameterTracks.splice(index, 1)
        logger.info(`Effect parameter track removed: ${event.trackId}`)
        break
      }
    }
  }

  /**
   * Handle keyframe added events
   */
  private handleKeyframeAdded(event: { trackId: string; keyframe: Keyframe }): void {
    // Find the parameter track and update local keyframes
    for (const [effectId, parameterTracks] of this.effectTracks) {
      const parameterTrack = parameterTracks.find(track => track.timelineTrack.id === event.trackId)
      if (parameterTrack) {
        parameterTrack.keyframes.push(event.keyframe)
        parameterTrack.keyframes.sort((a, b) => a.time - b.time)
        logger.info(`Effect keyframe added: ${event.keyframe.id}`)
        break
      }
    }
  }

  /**
   * Handle keyframe removed events
   */
  private handleKeyframeRemoved(event: { trackId: string; keyframeId: string }): void {
    // Find the parameter track and update local keyframes
    for (const [effectId, parameterTracks] of this.effectTracks) {
      const parameterTrack = parameterTracks.find(track => track.timelineTrack.id === event.trackId)
      if (parameterTrack) {
        parameterTrack.keyframes = parameterTrack.keyframes.filter(kf => kf.id !== event.keyframeId)
        logger.info(`Effect keyframe removed: ${event.keyframeId}`)
        break
      }
    }
  }

  /**
   * Evaluate parameter value at specific time
   */
  private evaluateParameterAtTime(parameterTrack: EffectParameterTrack, time: Time): any {
    const keyframes = parameterTrack.keyframes
    if (keyframes.length === 0) return undefined

    // Find surrounding keyframes
    let beforeKeyframe: Keyframe | undefined
    let afterKeyframe: Keyframe | undefined

    for (let i = 0; i < keyframes.length; i++) {
      const keyframe = keyframes[i]
      if (keyframe.time <= time) {
        beforeKeyframe = keyframe
      }
      if (keyframe.time >= time && !afterKeyframe) {
        afterKeyframe = keyframe
        break
      }
    }

    // Handle edge cases
    if (!beforeKeyframe && !afterKeyframe) return undefined
    if (!beforeKeyframe) return afterKeyframe!.value
    if (!afterKeyframe) return beforeKeyframe.value
    if (beforeKeyframe.time === afterKeyframe.time) return beforeKeyframe.value

    // Interpolate between keyframes
    const t = (time - beforeKeyframe.time) / (afterKeyframe.time - beforeKeyframe.time)
    
    switch (beforeKeyframe.interpolation) {
      case InterpolationMode.Linear:
        return this.linearInterpolation(beforeKeyframe.value, afterKeyframe.value, t)
      case InterpolationMode.Bezier:
        return this.bezierInterpolation(beforeKeyframe.value, afterKeyframe.value, t, beforeKeyframe.easing)
      case InterpolationMode.Stepped:
        return beforeKeyframe.value
      case InterpolationMode.Smooth:
        return this.smoothInterpolation(beforeKeyframe.value, afterKeyframe.value, t)
      default:
        return this.linearInterpolation(beforeKeyframe.value, afterKeyframe.value, t)
    }
  }

  /**
   * Linear interpolation
   */
  private linearInterpolation(a: any, b: any, t: number): any {
    if (typeof a === 'number' && typeof b === 'number') {
      return a + (b - a) * t
    }
    // For non-numeric values, return the closer keyframe
    return t < 0.5 ? a : b
  }

  /**
   * Bezier interpolation
   */
  private bezierInterpolation(a: any, b: any, t: number, easing?: any): any {
    // Simplified bezier interpolation
    if (typeof a === 'number' && typeof b === 'number') {
      const easedT = this.easeInOutCubic(t)
      return a + (b - a) * easedT
    }
    return t < 0.5 ? a : b
  }

  /**
   * Smooth interpolation
   */
  private smoothInterpolation(a: any, b: any, t: number): any {
    if (typeof a === 'number' && typeof b === 'number') {
      const smoothT = t * t * (3 - 2 * t) // Smoothstep function
      return a + (b - a) * smoothT
    }
    return t < 0.5 ? a : b
  }

  /**
   * Ease in-out cubic function
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * Get parameter color for timeline track
   */
  private getParameterColor(parameterName: string): string {
    const colorMap: Record<string, string> = {
      // Glow parameters
      intensity: '#FF6B35',
      radius: '#4ECDC4',
      color: '#45B7D1',
      threshold: '#96CEB4',
      
      // Blur parameters
      sigma: '#FECA57',
      iterations: '#FF9FF3',
      angle: '#54A0FF',
      distance: '#5F27CD',
      
      // Color correction parameters
      brightness: '#FFD93D',
      contrast: '#6BCF7F',
      gamma: '#4D96FF',
      inputBlack: '#2C2C54',
      inputWhite: '#F8F8FF',
      outputBlack: '#2C2C54',
      outputWhite: '#F8F8FF',
    }
    
    return colorMap[parameterName] || '#95A5A6'
  }

  /**
   * Destroy the integration
   */
  destroy(): void {
    // Remove event listeners
    this.timeline.removeEventListener('timeChanged', this.handleTimeChange.bind(this))
    this.timeline.removeEventListener('trackAdded', this.handleTrackAdded.bind(this))
    this.timeline.removeEventListener('trackRemoved', this.handleTrackRemoved.bind(this))
    this.timeline.removeEventListener('keyframeAdded', this.handleKeyframeAdded.bind(this))
    this.timeline.removeEventListener('keyframeRemoved', this.handleKeyframeRemoved.bind(this))
    
    // Clear local storage
    this.effectTracks.clear()
    this.parameterAnimations.clear()
    
    logger.info('Effects timeline integration destroyed')
  }
}

/**
 * Create default effect parameter tracks for common effects
 */
export function createDefaultEffectTracks(
  integration: EffectsTimelineIntegration,
  effectId: string,
  effectType: string
): Result<EffectParameterTrack[]> {
  try {
    const tracks: EffectParameterTrack[] = []

    switch (effectType) {
      case 'glow':
        // Create tracks for glow parameters
        integration.createEffectParameterTrack(effectId, 'intensity', 1.0)
        integration.createEffectParameterTrack(effectId, 'radius', 10)
        integration.createEffectParameterTrack(effectId, 'threshold', 0.5)
        break

      case 'gaussianBlur':
        // Create tracks for blur parameters
        integration.createEffectParameterTrack(effectId, 'radius', 5)
        integration.createEffectParameterTrack(effectId, 'sigma', 1.67)
        break

      case 'brightnessContrast':
        // Create tracks for brightness/contrast parameters
        integration.createEffectParameterTrack(effectId, 'brightness', 0)
        integration.createEffectParameterTrack(effectId, 'contrast', 1)
        break

      case 'levels':
        // Create tracks for levels parameters
        integration.createEffectParameterTrack(effectId, 'inputBlack', 0)
        integration.createEffectParameterTrack(effectId, 'inputWhite', 1)
        integration.createEffectParameterTrack(effectId, 'gamma', 1)
        integration.createEffectParameterTrack(effectId, 'outputBlack', 0)
        integration.createEffectParameterTrack(effectId, 'outputWhite', 1)
        break
    }

    return { success: true, data: tracks }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CREATE_DEFAULT_TRACKS_ERROR',
        message: `Failed to create default effect tracks: ${error}`,
        stack: error instanceof Error ? error.stack : undefined,
      },
    }
  }
}
