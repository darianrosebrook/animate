/**
 * @fileoverview Core Effects System Types and Interfaces
 * @author @darianrosebrook
 */

import { Time } from './index'

/**
 * Core effect types supported by the system
 */
export enum EffectType {
  // Blur Effects (Tier 1)
  GAUSSIAN_BLUR = 'gaussian_blur',
  MOTION_BLUR = 'motion_blur',
  RADIAL_BLUR = 'radial_blur',
  BOX_BLUR = 'box_blur',
  GLOW = 'glow',

  // Color Correction Effects (Tier 1)
  BRIGHTNESS_CONTRAST = 'brightness_contrast',
  LEVELS = 'levels',
  CURVES = 'curves',
  COLOR_BALANCE = 'color_balance',
  HUE_SATURATION = 'hue_saturation',
  COLOR_LOOKUP_TABLE = 'color_lookup_table',

  // Distortion Effects (Tier 1)
  WAVE = 'wave',
  RIPPLE = 'ripple',
  DISPLACEMENT = 'displacement',
  LENS_DISTORTION = 'lens_distortion',

  // Keying Effects (Tier 2)
  CHROMA_KEY = 'chroma_key',
  LUMA_KEY = 'luma_key',
  DIFFERENCE_KEY = 'difference_key',
  COLOR_DIFFERENCE_KEY = 'color_difference_key',

  // Generation Effects (Tier 2)
  NOISE = 'noise',
  FRACTAL_NOISE = 'fractal_noise',
  GRADIENT = 'gradient',
  SOLID_COLOR = 'solid_color',
  CHECKERBOARD = 'checkerboard',

  // Blend Mode Effects (Tier 2)
  SCREEN = 'screen',
  MULTIPLY = 'multiply',
  OVERLAY = 'overlay',
  ADD = 'add',
  SUBTRACT = 'subtract',
  COLOR_DODGE = 'color_dodge',
  COLOR_BURN = 'color_burn',

  // Time-based Effects (Tier 2)
  ECHO = 'echo',
  TRAILS = 'trails',
  SPEED_RAMP = 'speed_ramp',
  TIME_DISPLACEMENT = 'time_displacement',

  // Stylization Effects (Tier 3)
  CARTOON = 'cartoon',
  POSTERIZE = 'posterize',
  EMBOSS = 'emboss',
  FIND_EDGES = 'find_edges',
  SHARPEN = 'sharpen',

  // Mask and Matte Effects (Tier 3)
  TRACK_MATTE = 'track_matte',
  LUMA_MATTE = 'luma_matte',
  STENCIL_MATTE = 'stencil_matte',
}

/**
 * Blend modes for effect composition
 */
export enum BlendMode {
  NORMAL = 'normal',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  COLOR_DODGE = 'color_dodge',
  COLOR_BURN = 'color_burn',
  HARD_LIGHT = 'hard_light',
  SOFT_LIGHT = 'soft_light',
  DIFFERENCE = 'difference',
  EXCLUSION = 'exclusion',
  HUE = 'hue',
  SATURATION = 'saturation',
  COLOR = 'color',
  LUMINOSITY = 'luminosity',
  ADD = 'add',
  SUBTRACT = 'subtract',
}

/**
 * Base interface for all effect parameters
 */
export interface BaseEffectParameters {
  enabled?: boolean
  opacity?: number
  blendMode?: BlendMode
  mask?: MaskReference
}

/**
 * Gaussian Blur effect parameters
 */
export interface GaussianBlurParameters extends BaseEffectParameters {
  radius: number // Kernel radius (0.1 to 100)
  sigma?: number // Standard deviation (auto-calculated if not provided)
  quality?: 'low' | 'medium' | 'high' // Shader quality preset
}

/**
 * Motion Blur effect parameters
 */
export interface MotionBlurParameters extends BaseEffectParameters {
  angle: number // Direction angle in degrees (0-360)
  distance: number // Blur distance (0-100)
  steps?: number // Number of blur steps (2-32)
  shutterAngle?: number // Camera shutter angle simulation (0-360)
}

/**
 * Radial Blur effect parameters
 */
export interface RadialBlurParameters extends BaseEffectParameters {
  centerX: number // Center X coordinate (0-1, normalized)
  centerY: number // Center Y coordinate (0-1, normalized)
  amount: number // Blur amount (0-100)
  type: 'zoom' | 'spin' // Blur type
}

/**
 * Box Blur effect parameters
 */
export interface BoxBlurParameters extends BaseEffectParameters {
  radius: number // Blur radius (1-50)
  iterations?: number // Number of blur passes (1-5)
}

/**
 * Glow effect parameters
 */
export interface GlowParameters extends BaseEffectParameters {
  intensity: number // Glow intensity (0.0 - 2.0)
  radius: number // Glow radius (1 - 100 pixels)
  color: { r: number; g: number; b: number } // RGB color tint (0-255)
  quality: 'low' | 'medium' | 'high' | 'ultra' // Shader quality preset (1-4)
  threshold?: number // Brightness threshold for glow (0-255)
  innerGlow?: boolean // Apply glow to inside of shape
}

/**
 * Brightness/Contrast effect parameters
 */
export interface BrightnessContrastParameters extends BaseEffectParameters {
  brightness: number // Brightness adjustment (-100 to 100)
  contrast: number // Contrast adjustment (-100 to 100)
  preserveLuminosity?: boolean // Preserve original luminosity
}

/**
 * Levels effect parameters
 */
export interface LevelsParameters extends BaseEffectParameters {
  inputBlack: number // Input black point (0-255)
  inputWhite: number // Input white point (0-255)
  gamma: number // Gamma correction (0.1-10)
  outputBlack: number // Output black point (0-255)
  outputWhite: number // Output white point (0-255)
  channel?: 'rgb' | 'red' | 'green' | 'blue' // Channel to affect
}

/**
 * Curves effect parameters
 */
export interface CurvesParameters extends BaseEffectParameters {
  redCurve: CurvePoint[] // Red channel curve points
  greenCurve: CurvePoint[] // Green channel curve points
  blueCurve: CurvePoint[] // Blue channel curve points
  masterCurve?: CurvePoint[] // Master curve affecting all channels
}

/**
 * Color Balance effect parameters
 */
export interface ColorBalanceParameters extends BaseEffectParameters {
  shadowsCyanRed: number // Cyan-Red in shadows (-100 to 100)
  shadowsMagentaGreen: number // Magenta-Green in shadows (-100 to 100)
  shadowsYellowBlue: number // Yellow-Blue in shadows (-100 to 100)
  midtonesCyanRed: number // Cyan-Red in midtones (-100 to 100)
  midtonesMagentaGreen: number // Magenta-Green in midtones (-100 to 100)
  midtonesYellowBlue: number // Yellow-Blue in midtones (-100 to 100)
  highlightsCyanRed: number // Cyan-Red in highlights (-100 to 100)
  highlightsMagentaGreen: number // Magenta-Green in highlights (-100 to 100)
  highlightsYellowBlue: number // Yellow-Blue in highlights (-100 to 100)
  preserveLuminosity?: boolean // Preserve overall luminosity
}

/**
 * Hue/Saturation effect parameters
 */
export interface HueSaturationParameters extends BaseEffectParameters {
  hue: number // Hue shift (-180 to 180)
  saturation: number // Saturation adjustment (-100 to 100)
  lightness: number // Lightness adjustment (-100 to 100)
  colorize?: boolean // Apply as colorize effect
  range?: ColorRange // Color range to affect
}

/**
 * Color Lookup Table effect parameters
 */
export interface ColorLookupTableParameters extends BaseEffectParameters {
  lutData: Uint8Array | Float32Array // 3D LUT data (33x33x33 typically)
  lutSize?: number // LUT dimensions (8, 16, 32, 64)
  intensity?: number // LUT intensity (0-100)
  interpolation?: 'nearest' | 'trilinear' | 'tetrahedral' // Interpolation method
}

/**
 * Wave distortion parameters
 */
export interface WaveParameters extends BaseEffectParameters {
  waveType: 'sine' | 'triangle' | 'square' | 'sawtooth' // Wave shape
  amplitude: number // Wave amplitude (0-100)
  frequency: number // Wave frequency (0.1-50)
  phase: number // Wave phase (0-360)
  direction: number // Wave direction (0-360)
}

/**
 * Ripple distortion parameters
 */
export interface RippleParameters extends BaseEffectParameters {
  centerX: number // Ripple center X (0-1)
  centerY: number // Ripple center Y (0-1)
  amplitude: number // Ripple amplitude (0-100)
  frequency: number // Ripple frequency (0.1-20)
  decay?: number // Distance-based amplitude decay (0-1)
  phase?: number // Animation phase offset
}

/**
 * Displacement effect parameters
 */
export interface DisplacementParameters extends BaseEffectParameters {
  displacementMap?: string // Reference to displacement texture
  displacementAmount: number // Displacement strength (0-100)
  horizontalScale: number // Horizontal displacement scale (-200 to 200)
  verticalScale: number // Vertical displacement scale (-200 to 200)
  displacementType?: 'horizontal' | 'vertical' | 'both'
}

/**
 * Lens Distortion parameters
 */
export interface LensDistortionParameters extends BaseEffectParameters {
  k1: number // Radial distortion coefficient 1
  k2: number // Radial distortion coefficient 2
  k3?: number // Radial distortion coefficient 3
  p1?: number // Tangential distortion coefficient 1
  p2?: number // Tangential distortion coefficient 2
  scale?: number // Scale factor (0.1-5)
  centerX?: number // Distortion center X (0-1)
  centerY?: number // Distortion center Y (0-1)
}

/**
 * Chroma Key parameters
 */
export interface ChromaKeyParameters extends BaseEffectParameters {
  keyColor: { r: number; g: number; b: number } // Key color in RGB (0-1)
  tolerance: number // Color tolerance (0-100)
  edgeThin?: number // Edge thinning (0-100)
  edgeFeather?: number // Edge feathering (0-100)
  spillSuppression?: number // Color spill suppression (0-100)
  alphaOperation?: 'normal' | 'min' | 'max' | 'screen'
}

/**
 * Luma Key parameters
 */
export interface LumaKeyParameters extends BaseEffectParameters {
  threshold: number // Luminance threshold (0-255)
  tolerance: number // Luminance tolerance (0-128)
  softness?: number // Key softness (0-100)
  invert?: boolean // Invert the key
}

/**
 * Difference Key parameters
 */
export interface DifferenceKeyParameters extends BaseEffectParameters {
  differenceLayer?: string // Reference layer for difference calculation
  tolerance: number // Difference tolerance (0-100)
  softness?: number // Key softness (0-100)
}

/**
 * Color Difference Key parameters
 */
export interface ColorDifferenceKeyParameters extends BaseEffectParameters {
  keyColor: { r: number; g: number; b: number } // Key color
  tolerance: number // Color tolerance (0-100)
  edgeThin?: number // Edge thinning (0-100)
  edgeFeather?: number // Edge feathering (0-100)
}

/**
 * Noise effect parameters
 */
export interface NoiseParameters extends BaseEffectParameters {
  noiseType: 'perlin' | 'simplex' | 'worley' | 'random' // Noise algorithm
  scale: number // Noise scale (0.1-100)
  intensity: number // Noise intensity (0-100)
  seed?: number // Random seed for deterministic noise
  octaves?: number // Number of octaves for fractal noise
  persistence?: number // Persistence for fractal noise
  lacunarity?: number // Lacunarity for fractal noise
}

/**
 * Fractal Noise parameters
 */
export interface FractalNoiseParameters extends NoiseParameters {
  turbulence?: number // Turbulence amount (0-100)
  contrast?: number // Contrast adjustment (0-100)
  brightness?: number // Brightness adjustment (-100 to 100)
  invert?: boolean // Invert the noise pattern
}

/**
 * Gradient parameters
 */
export interface GradientParameters extends BaseEffectParameters {
  type: 'linear' | 'radial' | 'conical' | 'diamond' // Gradient type
  startColor: { r: number; g: number; b: number; a: number } // Start color
  endColor: { r: number; g: number; b: number; a: number } // End color
  startX?: number // Start point X (0-1)
  startY?: number // Start point Y (0-1)
  endX?: number // End point X (0-1)
  endY?: number // End point Y (0-1)
  midpoints?: GradientStop[] // Intermediate color stops
}

/**
 * Solid Color parameters
 */
export interface SolidColorParameters extends BaseEffectParameters {
  color: { r: number; g: number; b: number; a: number } // Solid color
}

/**
 * Checkerboard parameters
 */
export interface CheckerboardParameters extends BaseEffectParameters {
  color1: { r: number; g: number; b: number; a: number } // First color
  color2: { r: number; g: number; b: number; a: number } // Second color
  size: number // Checker size in pixels (1-100)
  softness?: number // Edge softness (0-100)
}

/**
 * Echo effect parameters
 */
export interface EchoParameters extends BaseEffectParameters {
  delay: number // Echo delay in frames (1-120)
  decay: number // Echo decay (0-100)
  count?: number // Number of echoes (1-10)
  blendMode?: BlendMode // Blend mode for echoes
}

/**
 * Trails effect parameters
 */
export interface TrailsParameters extends BaseEffectParameters {
  duration: number // Trail duration in frames (1-60)
  opacity: number // Trail opacity (0-100)
  blendMode?: BlendMode // Blend mode for trails
}

/**
 * Speed Ramp parameters
 */
export interface SpeedRampParameters extends BaseEffectParameters {
  speedCurve: CurvePoint[] // Speed curve over time
  maintainPitch?: boolean // Audio pitch correction
  frameBlending?: boolean // Frame blending for smooth motion
}

/**
 * Time Displacement parameters
 */
export interface TimeDisplacementParameters extends BaseEffectParameters {
  displacementMap?: string // Displacement texture reference
  maxDisplacement: number // Maximum time displacement (0-10 seconds)
  horizontalScale: number // Horizontal displacement scale (-200 to 200)
  verticalScale: number // Vertical displacement scale (-200 to 200)
}

/**
 * Cartoon effect parameters
 */
export interface CartoonParameters extends BaseEffectParameters {
  levels: number // Number of color levels (2-32)
  edgeSensitivity: number // Edge detection sensitivity (0-100)
  edgeThickness: number // Edge line thickness (0.1-10)
  edgeColor: { r: number; g: number; b: number } // Edge color
  fillColor?: { r: number; g: number; b: number } // Fill color override
}

/**
 * Posterize effect parameters
 */
export interface PosterizeParameters extends BaseEffectParameters {
  levels: number // Number of color levels (2-32)
  gamma?: number // Gamma correction (0.1-10)
}

/**
 * Emboss effect parameters
 */
export interface EmbossParameters extends BaseEffectParameters {
  angle: number // Light direction angle (0-360)
  elevation: number // Light elevation (0-90)
  intensity: number // Emboss intensity (0-100)
  blendMode?: BlendMode // Blend mode for emboss
}

/**
 * Find Edges effect parameters
 */
export interface FindEdgesParameters extends BaseEffectParameters {
  threshold: number // Edge detection threshold (0-100)
  thickness: number // Edge thickness (0.1-10)
  color: { r: number; g: number; b: number } // Edge color
  backgroundColor?: { r: number; g: number; b: number } // Background color
}

/**
 * Sharpen effect parameters
 */
export interface SharpenParameters extends BaseEffectParameters {
  amount: number // Sharpen amount (0-500)
  radius: number // Sharpen radius (0.1-10)
  threshold?: number // Sharpen threshold (0-255)
}

/**
 * Track Matte parameters
 */
export interface TrackMatteParameters extends BaseEffectParameters {
  matteLayer: string // Reference to matte layer
  invert?: boolean // Invert the matte
  preMultiply?: boolean // Pre-multiply alpha
  matteChannel?: 'luma' | 'alpha' | 'red' | 'green' | 'blue' // Matte channel
}

/**
 * Luma Matte parameters
 */
export interface LumaMatteParameters extends BaseEffectParameters {
  threshold: number // Luminance threshold (0-255)
  tolerance: number // Luminance tolerance (0-128)
  softness?: number // Matte softness (0-100)
  invert?: boolean // Invert the matte
}

/**
 * Stencil Matte parameters
 */
export interface StencilMatteParameters extends BaseEffectParameters {
  matteLayer: string // Reference to stencil layer
  operation: 'intersect' | 'subtract' | 'difference' | 'union' // Boolean operation
  invert?: boolean // Invert the stencil
}

/**
 * Union type for all effect parameters
 */
export type EffectParameters =
  | GaussianBlurParameters
  | MotionBlurParameters
  | RadialBlurParameters
  | BoxBlurParameters
  | GlowParameters
  | BrightnessContrastParameters
  | LevelsParameters
  | CurvesParameters
  | ColorBalanceParameters
  | HueSaturationParameters
  | ColorLookupTableParameters
  | WaveParameters
  | RippleParameters
  | DisplacementParameters
  | LensDistortionParameters
  | ChromaKeyParameters
  | LumaKeyParameters
  | DifferenceKeyParameters
  | ColorDifferenceKeyParameters
  | NoiseParameters
  | FractalNoiseParameters
  | GradientParameters
  | SolidColorParameters
  | CheckerboardParameters
  | EchoParameters
  | TrailsParameters
  | SpeedRampParameters
  | TimeDisplacementParameters
  | CartoonParameters
  | PosterizeParameters
  | EmbossParameters
  | FindEdgesParameters
  | SharpenParameters
  | TrackMatteParameters
  | LumaMatteParameters
  | StencilMatteParameters

/**
 * Curve point for animation curves
 */
export interface CurvePoint {
  time: number // Time position (0-1)
  value: number // Value at this point
  interpolation?: 'linear' | 'bezier' | 'hold'
  tangentIn?: number // Bezier tangent in
  tangentOut?: number // Bezier tangent out
}

/**
 * Color range for hue/saturation effects
 */
export interface ColorRange {
  hueMin: number // Minimum hue (0-360)
  hueMax: number // Maximum hue (0-360)
  saturationMin: number // Minimum saturation (0-100)
  saturationMax: number // Maximum saturation (0-100)
  lightnessMin: number // Minimum lightness (0-100)
  lightnessMax: number // Maximum lightness (0-100)
}

/**
 * Gradient stop for multi-stop gradients
 */
export interface GradientStop {
  position: number // Position along gradient (0-1)
  color: { r: number; g: number; b: number; a: number } // Color at this position
  midpoint?: number // Midpoint between stops (0-1)
}

/**
 * Mask reference for effect masking
 */
export interface MaskReference {
  maskLayer: string // Reference to mask layer
  maskChannel?: 'luma' | 'alpha' | 'red' | 'green' | 'blue'
  invert?: boolean // Invert the mask
  feather?: number // Mask feathering (0-100)
}

/**
 * Performance settings for effects
 */
export interface PerformanceSettings {
  quality?: 'low' | 'medium' | 'high' // Render quality preset
  maxMemoryMB?: number // Maximum GPU memory usage
  adaptiveQuality?: boolean // Enable adaptive quality reduction
  cacheEnabled?: boolean // Enable result caching
  shaderPrecision?: 'fp16' | 'fp32' // Floating point precision
}

/**
 * EffectNode definition for scene graph integration
 */
export interface EffectNode {
  id: string
  type: EffectType
  name?: string
  parameters: EffectParameters
  enabled: boolean
  blendMode: BlendMode
  mask?: MaskReference
  performanceSettings: PerformanceSettings
  createdAt: Time
  updatedAt: Time
}

/**
 * Effect evaluation context
 */
export interface EffectEvaluationContext {
  time: number
  frameRate: number
  resolution: { width: number; height: number }
  inputTexture?: GPUTexture
  outputTexture?: GPUTexture
  previousFrame?: GPUTexture
  audioData?: Float32Array
  metadata?: Record<string, unknown>
}

/**
 * Effect render result
 */
export interface EffectRenderResult {
  success: boolean
  outputTexture?: GPUTexture
  renderTimeMs: number
  memoryUsageMB: number
  error?: string
  warnings?: string[]
}

/**
 * Effect shader information
 */
export interface EffectShaderInfo {
  vertexShader: string
  fragmentShader: string
  uniforms: Record<string, unknown>
  textures: string[]
  computePipeline?: boolean
  workgroupSize?: { x: number; y: number; z: number }
}

/**
 * Effect capability information
 */
export interface EffectCapabilities {
  supportsRealTime: boolean
  minRenderTimeMs: number
  maxMemoryMB: number
  requiredFeatures: string[]
  optionalFeatures: string[]
  performanceProfiles: Record<string, PerformanceSettings>
}

/**
 * Effect validation result
 */
export interface EffectValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  performanceImpact: {
    estimatedRenderTimeMs: number
    estimatedMemoryMB: number
    performanceTier: 'low' | 'medium' | 'high'
  }
}

/**
 * Effect preview information
 */
export interface EffectPreview {
  thumbnail: Uint8Array // Preview image data
  parameters: Partial<EffectParameters>
  renderTimeMs: number
  quality: 'low' | 'medium' | 'high'
}
