/**
 * @fileoverview EffectNode implementation for the scene graph
 * @author @darianrosebrook
 */

import { v4 as uuidv4 } from 'uuid'
import {
  EffectNode as IEffectNode,
  EffectType,
  EffectParameters,
  BlendMode,
  PerformanceSettings,
  MaskReference,
  Time,
  Result,
  // TODO: Use AnimatorError for error handling
  // AnimatorError,
} from '@/types'

/**
 * EffectNode represents an effect applied to layers in the scene graph
 * Effects are GPU-accelerated and maintain deterministic rendering across platforms
 */
export class EffectNode implements IEffectNode {
  public readonly id: string
  public readonly type: EffectType
  public name?: string
  public parameters: EffectParameters
  public enabled: boolean
  public blendMode: BlendMode
  public mask?: MaskReference
  public performanceSettings: PerformanceSettings
  public readonly createdAt: Time
  public updatedAt: Time

  // Internal caching and performance tracking
  private lastRenderTime?: number
  private cacheKey?: string
  private renderCount = 0

  constructor(
    type: EffectType,
    parameters: EffectParameters,
    options: {
      name?: string
      enabled?: boolean
      blendMode?: BlendMode
      mask?: MaskReference
      performanceSettings?: PerformanceSettings
    } = {}
  ) {
    this.id = uuidv4()
    this.type = type
    this.name = options.name
    this.parameters = { ...parameters }
    this.enabled = options.enabled ?? true
    this.blendMode = options.blendMode ?? BlendMode.NORMAL
    this.mask = options.mask
    this.performanceSettings = {
      quality: 'high',
      maxMemoryMB: 256,
      adaptiveQuality: true,
      ...options.performanceSettings,
    }
    this.createdAt = Date.now()
    this.updatedAt = Date.now()

    // Generate initial cache key
    this.updateCacheKey()
  }

  /**
   * Update effect parameters with validation
   */
  updateParameters(newParameters: Partial<EffectParameters>): Result<boolean> {
    try {
      // Validate parameters based on effect type
      const validationResult = this.validateParameters(newParameters)
      if (!validationResult.success) {
        return validationResult
      }

      // Update parameters
      this.parameters = {
        ...this.parameters,
        ...(newParameters as EffectParameters),
      }
      this.updatedAt = Date.now()
      this.updateCacheKey()

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_UPDATE_FAILED',
          message: `Failed to update parameters: ${error}`,
          details: { effectType: this.type, parameters: newParameters },
        },
      }
    }
  }

  /**
   * Validate effect parameters based on effect type
   */
  private validateParameters(
    parameters: Partial<EffectParameters>
  ): Result<boolean> {
    // Base validation for all effects
    if (
      parameters.opacity !== undefined &&
      (parameters.opacity < 0 || parameters.opacity > 100)
    ) {
      return {
        success: false,
        error: {
          code: 'INVALID_OPACITY',
          message: 'Opacity must be between 0 and 100',
        },
      }
    }

    // Effect-specific validation
    switch (this.type) {
      case EffectType.GAUSSIAN_BLUR:
        if (
          (parameters as any).radius !== undefined &&
          ((parameters as any).radius < 0.1 || (parameters as any).radius > 100)
        ) {
          return {
            success: false,
            error: {
              code: 'INVALID_RADIUS',
              message: 'Gaussian blur radius must be between 0.1 and 100',
            },
          }
        }
        break

      case EffectType.LEVELS:
        if (
          (parameters as any).inputBlack !== undefined &&
          ((parameters as any).inputBlack < 0 ||
            (parameters as any).inputBlack > 255)
        ) {
          return {
            success: false,
            error: {
              code: 'INVALID_INPUT_BLACK',
              message: 'Input black point must be between 0 and 255',
            },
          }
        }
        if (
          (parameters as any).inputWhite !== undefined &&
          ((parameters as any).inputWhite < 0 ||
            (parameters as any).inputWhite > 255)
        ) {
          return {
            success: false,
            error: {
              code: 'INVALID_INPUT_WHITE',
              message: 'Input white point must be between 0 and 255',
            },
          }
        }
        break

      case EffectType.HUE_SATURATION:
        if (
          parameters.hue !== undefined &&
          (parameters.hue < -180 || parameters.hue > 180)
        ) {
          return {
            success: false,
            error: {
              code: 'INVALID_HUE',
              message: 'Hue shift must be between -180 and 180',
            },
          }
        }
        if (
          parameters.saturation !== undefined &&
          (parameters.saturation < -100 || parameters.saturation > 100)
        ) {
          return {
            success: false,
            error: {
              code: 'INVALID_SATURATION',
              message: 'Saturation adjustment must be between -100 and 100',
            },
          }
        }
        break
    }

    return { success: true, data: true }
  }

  /**
   * Generate cache key for effect caching
   */
  private updateCacheKey(): void {
    const keyData = {
      type: this.type,
      parameters: this.parameters,
      blendMode: this.blendMode,
      performanceSettings: this.performanceSettings,
    }
    this.cacheKey = btoa(JSON.stringify(keyData)).slice(0, 32)
  }

  /**
   * Get cache key for this effect instance
   */
  getCacheKey(): string {
    return this.cacheKey || ''
  }

  /**
   * Record render performance metrics
   */
  recordRender(renderTimeMs: number): void {
    this.lastRenderTime = renderTimeMs
    this.renderCount++

    // Adaptive quality adjustment based on performance
    if (this.performanceSettings.adaptiveQuality) {
      this.adaptQualityBasedOnPerformance(renderTimeMs)
    }
  }

  /**
   * Get last recorded render time
   */
  getLastRenderTime(): number | undefined {
    return this.lastRenderTime
  }

  /**
   * Get render count
   */
  getRenderCount(): number {
    return this.renderCount
  }

  /**
   * Adapt quality settings based on performance
   */
  private adaptQualityBasedOnPerformance(renderTimeMs: number): void {
    const targetTime = 16 // Target 16ms for 60fps

    if (
      renderTimeMs > targetTime * 2 &&
      this.performanceSettings.quality === 'high'
    ) {
      // Reduce quality if consistently slow
      this.performanceSettings.quality = 'medium'
    } else if (
      renderTimeMs < targetTime * 0.8 &&
      this.performanceSettings.quality === 'low'
    ) {
      // Increase quality if performing well
      this.performanceSettings.quality = 'medium'
    }
  }

  /**
   * Clone this effect node with new parameters
   */
  clone(newParameters?: Partial<EffectParameters>): EffectNode {
    const cloned = new EffectNode(this.type, this.parameters, {
      name: this.name,
      enabled: this.enabled,
      blendMode: this.blendMode,
      mask: this.mask,
      performanceSettings: { ...this.performanceSettings },
    })

    if (newParameters) {
      cloned.updateParameters(newParameters)
    }

    return cloned
  }

  /**
   * Serialize effect node to JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      parameters: this.parameters,
      enabled: this.enabled,
      blendMode: this.blendMode,
      mask: this.mask,
      performanceSettings: this.performanceSettings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: {
        cacheKey: this.cacheKey,
        lastRenderTime: this.lastRenderTime,
        renderCount: this.renderCount,
      },
    }
  }

  /**
   * Create effect node from JSON
   */
  static fromJSON(data: Record<string, unknown>): Result<EffectNode> {
    try {
      const node = new EffectNode(
        data.type as EffectType,
        data.parameters as EffectParameters,
        {
          name: data.name as string,
          enabled: data.enabled as boolean,
          blendMode: data.blendMode as BlendMode,
          mask: data.mask as MaskReference,
          performanceSettings: data.performanceSettings as PerformanceSettings,
        }
      )

      // Restore metadata
      if (data.metadata && typeof data.metadata === 'object') {
        const metadata = data.metadata as Record<string, unknown>
        node.lastRenderTime = metadata.lastRenderTime as number
        node.renderCount = metadata.renderCount as number
        node.cacheKey = metadata.cacheKey as string
      }

      return { success: true, data: node }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DESERIALIZATION_FAILED',
          message: `Failed to deserialize effect node: ${error}`,
          details: { data },
        },
      }
    }
  }

  /**
   * Get effect capabilities and requirements
   */
  getCapabilities(): {
    supportsRealTime: boolean
    minRenderTimeMs: number
    maxMemoryMB: number
    requiredFeatures: string[]
    optionalFeatures: string[]
  } {
    const baseCapabilities = {
      supportsRealTime: true,
      minRenderTimeMs: 2, // Most effects can render in < 2ms
      maxMemoryMB: this.performanceSettings.maxMemoryMB || 256,
      requiredFeatures: ['webgpu', 'compute-shaders'],
      optionalFeatures: ['shader-precompilation', 'adaptive-quality'],
    }

    // Effect-specific adjustments
    switch (this.type) {
      case EffectType.GAUSSIAN_BLUR:
        return {
          ...baseCapabilities,
          minRenderTimeMs: 4,
          maxMemoryMB: 128,
          requiredFeatures: [
            ...baseCapabilities.requiredFeatures,
            'large-kernels',
          ],
        }

      case EffectType.MOTION_BLUR:
        return {
          ...baseCapabilities,
          minRenderTimeMs: 6,
          maxMemoryMB: 64,
          requiredFeatures: [
            ...baseCapabilities.requiredFeatures,
            'frame-history',
          ],
        }

      case EffectType.COLOR_LOOKUP_TABLE:
        return {
          ...baseCapabilities,
          minRenderTimeMs: 3,
          maxMemoryMB: 32,
          requiredFeatures: [
            ...baseCapabilities.requiredFeatures,
            '3d-textures',
          ],
        }

      case EffectType.ECHO:
      case EffectType.TRAILS:
        return {
          ...baseCapabilities,
          minRenderTimeMs: 8,
          maxMemoryMB: 256,
          requiredFeatures: [
            ...baseCapabilities.requiredFeatures,
            'frame-history',
            'temporal-coherence',
          ],
        }

      default:
        return baseCapabilities
    }
  }

  /**
   * Check if effect supports real-time rendering
   */
  supportsRealTime(): boolean {
    return this.getCapabilities().supportsRealTime
  }

  /**
   * Get estimated memory usage for this effect
   */
  getEstimatedMemoryUsage(): number {
    return this.getCapabilities().maxMemoryMB
  }

  /**
   * Check if effect requires specific GPU features
   */
  requiresFeature(feature: string): boolean {
    return this.getCapabilities().requiredFeatures.includes(feature)
  }
}
