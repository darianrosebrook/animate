/**
 * @fileoverview Core Effects System Types and Interfaces
 * @author @darianrosebrook
 */

import { Result, AnimatorError, Time, Point2D, Size2D, Color } from '@/types'

/**
 * Effect categories for organization
 */
export enum EffectCategory {
  Blur = 'blur',
  Color = 'color',
  Distortion = 'distortion',
  Generative = 'generative',
  Composite = 'composite',
}

/**
 * Blend modes for effect composition
 */
export enum BlendMode {
  Normal = 'normal',
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',
  Darken = 'darken',
  Lighten = 'lighten',
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn',
  HardLight = 'hard-light',
  SoftLight = 'soft-light',
  Difference = 'difference',
  Exclusion = 'exclusion',
  Hue = 'hue',
  Saturation = 'saturation',
  Color = 'color',
  Luminosity = 'luminosity',
}

/**
 * Effect parameter types
 */
export enum EffectParameterType {
  Float = 'float',
  Int = 'int',
  Color = 'color',
  Point = 'point',
  Size = 'size',
  Bool = 'bool',
  Enum = 'enum',
}

/**
 * Effect parameter definition
 */
export interface EffectParameterDefinition {
  name: string
  displayName: string
  type: EffectParameterType
  defaultValue: any
  min?: number
  max?: number
  step?: number
  options?: string[]
  description?: string
  animatable: boolean
}

/**
 * Effect type definition
 */
export interface EffectType {
  name: string
  displayName: string
  category: EffectCategory
  description: string
  parameters: EffectParameterDefinition[]
  shader: string
  passes: number
  performance: {
    estimatedRenderTimeMs: number
    memoryUsageMB: number
  }
}

/**
 * Effect instance with specific parameters
 */
export interface EffectInstance {
  id: string
  type: EffectType
  parameters: Record<string, any>
  enabled: boolean
  blendMode: BlendMode
  opacity: number
  mask?: MaskDefinition
  order: number
}

/**
 * Mask definition for effect masking
 */
export interface MaskDefinition {
  type: 'alpha' | 'luminance' | 'shape'
  source?: string
  shape?: ShapeMask
  inverted: boolean
}

/**
 * Shape mask definition
 */
export interface ShapeMask {
  type: 'rectangle' | 'ellipse' | 'path'
  bounds: { x: number; y: number; width: number; height: number }
  path?: string
}

/**
 * Effect evaluation context
 */
export interface EffectContext {
  time: Time
  inputTexture: GPUTexture
  outputTexture: GPUTexture
  parameters: Record<string, any>
  viewportSize: Size2D
}

/**
 * Effect renderer interface
 */
export interface EffectRenderer {
  renderEffect(effect: EffectInstance, context: EffectContext): Result<boolean>
  createEffectPipeline(effectType: EffectType): Result<GPURenderPipeline>
  destroyEffectPipeline(effectType: EffectType): void
}

/**
 * Effect composition system
 */
export interface EffectComposer {
  effects: EffectInstance[]
  inputTexture: GPUTexture | null
  outputTexture: GPUTexture | null

  addEffect(effect: EffectInstance): void
  removeEffect(effectId: string): void
  reorderEffects(effects: EffectInstance[]): void
  setInputTexture(texture: GPUTexture | null): void
  setOutputTexture(texture: GPUTexture | null): void
  compose(time: Time): Result<boolean>
}

/**
 * Effect parameter controller
 */
export interface EffectParameterController {
  effect: EffectInstance

  setParameter(name: string, value: any): Result<void>
  getParameter(name: string): any
  animateParameter(
    name: string,
    keyframes: { time: Time; value: any }[]
  ): Result<void>
  resetParameter(name: string): Result<void>
  validateParameter(name: string, value: any): Result<boolean>
}

/**
 * Effect preset system
 */
export interface EffectPreset {
  id: string
  name: string
  description?: string
  effectType: string
  parameters: Record<string, any>
  category: 'professional' | 'creative' | 'utility'
  thumbnail?: Uint8Array
}

/**
 * Effect library management
 */
export interface EffectLibrary {
  getEffectTypes(): EffectType[]
  getEffectType(name: string): EffectType | null
  getPresets(effectType?: string): EffectPreset[]
  savePreset(preset: EffectPreset): Result<void>
  deletePreset(presetId: string): Result<void>
  loadPreset(presetId: string): EffectPreset | null
}

/**
 * Effect performance monitor
 */
export interface EffectPerformanceMonitor {
  trackRenderTime(effectId: string, timeMs: number): void
  trackMemoryUsage(effectId: string, usageMB: number): void
  getAverageRenderTime(effectId: string): number
  getMemoryUsage(effectId: string): number
  getOverallPerformance(): {
    totalRenderTime: number
    averageFrameTime: number
    memoryUsage: number
    effectCount: number
  }
}

/**
 * Effect caching system
 */
export interface EffectCache {
  get(context: EffectContext): GPUTexture | null
  set(context: EffectContext, texture: GPUTexture): void
  invalidate(effectId: string): void
  clear(): void
  getStats(): {
    size: number
    hitRate: number
    memoryUsage: number
  }
}

/**
 * Effect validation system
 */
export interface EffectValidator {
  validateEffect(effect: EffectInstance): Result<boolean>
  validateParameters(
    effectType: EffectType,
    parameters: Record<string, any>
  ): Result<boolean>
  validateShader(shader: string): Result<boolean>
  validatePipeline(pipeline: GPURenderPipeline): Result<boolean>
}

/**
 * Effect system main interface
 */
export interface EffectSystem {
  renderer: EffectRenderer
  composer: EffectComposer
  library: EffectLibrary
  monitor: EffectPerformanceMonitor
  cache: EffectCache
  validator: EffectValidator

  initialize(): Result<boolean>
  createEffect(
    effectType: string,
    parameters?: Record<string, any>
  ): Result<EffectInstance>
  applyEffect(
    effect: EffectInstance,
    inputTexture: GPUTexture,
    time: Time
  ): Result<GPUTexture>
  destroy(): void
}
