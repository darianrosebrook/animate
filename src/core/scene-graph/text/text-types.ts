/**
 * @fileoverview Text Layer Types and Typography System
 * @description Core types for rich text rendering and animation
 * @author @darianrosebrook
 */

import { Point2D, Color } from '@/types'

/**
 * Text alignment options
 */
export enum TextAlign {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  JUSTIFY = 'justify',
}

/**
 * Text baseline options
 */
export enum TextBaseline {
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
  ALPHABETIC = 'alphabetic',
}

/**
 * Font style options
 */
export enum FontStyle {
  NORMAL = 'normal',
  ITALIC = 'italic',
  OBLIQUE = 'oblique',
}

/**
 * Font weight options
 */
export enum FontWeight {
  THIN = '100',
  EXTRA_LIGHT = '200',
  LIGHT = '300',
  NORMAL = '400',
  MEDIUM = '500',
  SEMI_BOLD = '600',
  BOLD = '700',
  EXTRA_BOLD = '800',
  BLACK = '900',
}

/**
 * Text decoration options
 */
export enum TextDecoration {
  NONE = 'none',
  UNDERLINE = 'underline',
  OVERLINE = 'overline',
  LINE_THROUGH = 'line-through',
}

/**
 * Text transform options
 */
export enum TextTransform {
  NONE = 'none',
  UPPERCASE = 'uppercase',
  LOWERCASE = 'lowercase',
  CAPITALIZE = 'capitalize',
}

/**
 * Font definition
 */
export interface FontDefinition {
  family: string
  style: FontStyle
  weight: FontWeight
  size: number
  lineHeight: number // Multiplier (1.2 = 120% of font size)
  letterSpacing: number // Additional spacing between characters
  wordSpacing: number // Additional spacing between words
}

/**
 * Text fill types
 */
export enum TextFillType {
  SOLID = 'solid',
  GRADIENT_LINEAR = 'gradient_linear',
  GRADIENT_RADIAL = 'gradient_radial',
  NONE = 'none',
}

/**
 * Text gradient definition
 */
export interface TextGradient {
  type: TextFillType.GRADIENT_LINEAR | TextFillType.GRADIENT_RADIAL
  stops: { position: number; color: Color }[]
  angle?: number // For linear gradients
  center?: Point2D // For radial gradients
  radius?: number // For radial gradients
}

/**
 * Text fill definition
 */
export type TextFill =
  | { type: TextFillType.SOLID; color: Color }
  | {
      type: TextFillType.GRADIENT_LINEAR | TextFillType.GRADIENT_RADIAL
      gradient: TextGradient
    }
  | { type: TextFillType.NONE }

/**
 * Text stroke definition
 */
export interface TextStroke {
  color: Color
  width: number
  opacity: number
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
}

/**
 * Text shadow definition
 */
export interface TextShadow {
  color: Color
  offsetX: number
  offsetY: number
  blurRadius: number
}

/**
 * Text layer definition
 */
export interface TextLayer {
  // Content
  text: string
  font: FontDefinition

  // Layout
  position: Point2D
  size?: Size2D // Constrained width/height for text boxes
  align: TextAlign
  baseline: TextBaseline

  // Styling
  fill: TextFill
  stroke: TextStroke | null
  shadow: TextShadow | null

  // Typography
  decoration: TextDecoration
  transform: TextTransform

  // Animation properties
  animateOnLoad: boolean
  typeOnSpeed: number // Characters per second
  tracking: number // Character spacing animation
  kerning: number // Pair kerning animation

  // Advanced features
  outlineWidth?: number
  outlineColor?: Color
  backgroundColor?: Color
  backgroundOpacity?: number
}

/**
 * Text animation types
 */
export enum TextAnimationType {
  TYPE_ON = 'type_on',
  FADE_IN = 'fade_in',
  SLIDE_IN = 'slide_in',
  SCALE_IN = 'scale_in',
  ROTATE_IN = 'rotate_in',
  CHARACTER_ANIMATE = 'character_animate',
  WORD_ANIMATE = 'word_animate',
  LINE_ANIMATE = 'line_animate',
}

/**
 * Text animation definition
 */
export interface TextAnimation {
  type: TextAnimationType
  duration: number // milliseconds
  delay: number // milliseconds
  easing: string // CSS easing function
  direction?:
    | 'left_to_right'
    | 'right_to_left'
    | 'top_to_bottom'
    | 'bottom_to_top'
  stagger?: number // Delay between characters/words/lines
}

/**
 * Text character data for animation
 */
export interface TextCharacter {
  char: string
  index: number
  position: Point2D
  bounds: { width: number; height: number }
  opacity: number
  scale: number
  rotation: number
  offset: Point2D
}

/**
 * Text line data for layout
 */
export interface TextLine {
  text: string
  startIndex: number
  endIndex: number
  baseline: number
  width: number
  height: number
}

/**
 * Text layout data
 */
export interface TextLayout {
  lines: TextLine[]
  totalWidth: number
  totalHeight: number
  characterData: TextCharacter[]
  wordCount: number
  characterCount: number
}

/**
 * Text rendering data for GPU
 */
export interface TextRenderData {
  vertices: Float32Array
  indices: Uint16Array
  textureCoords: Float32Array
  characterTransforms: Float32Array // Per-character transform matrices
  glyphData: Map<string, GlyphData>
}

/**
 * Glyph data for font rendering
 */
export interface GlyphData {
  char: string
  advance: number
  bearingX: number
  bearingY: number
  width: number
  height: number
  textureCoords: { x: number; y: number; width: number; height: number }
}

/**
 * Font metrics
 */
export interface FontMetrics {
  family: string
  style: FontStyle
  weight: FontWeight
  size: number
  ascent: number
  descent: number
  lineHeight: number
  capHeight: number
  xHeight: number
  unitsPerEm: number
  glyphs: Map<string, GlyphData>
}

/**
 * Text measurement result
 */
export interface TextMeasurement {
  width: number
  height: number
  lineCount: number
  characterCount: number
  wordCount: number
  layout: TextLayout
}

/**
 * Text selection range
 */
export interface TextSelection {
  startIndex: number
  endIndex: number
  startLine: number
  endLine: number
}

/**
 * Text editing operations
 */
export enum TextEditOperation {
  INSERT_TEXT = 'insert_text',
  DELETE_TEXT = 'delete_text',
  REPLACE_TEXT = 'replace_text',
  SET_FONT = 'set_font',
  SET_COLOR = 'set_color',
  SET_SIZE = 'set_size',
  SET_ALIGNMENT = 'set_alignment',
}

/**
 * Text edit command
 */
export interface TextEditCommand {
  operation: TextEditOperation
  position?: number
  text?: string
  length?: number
  oldValue?: any
  newValue?: any
  selection?: TextSelection
}

/**
 * Text editor state
 */
export interface TextEditorState {
  text: string
  selection: TextSelection | null
  cursorPosition: number
  isEditing: boolean
  undoStack: TextEditCommand[]
  redoStack: TextEditCommand[]
}

/**
 * Text animation state
 */
export interface TextAnimationState {
  isAnimating: boolean
  currentTime: number
  totalDuration: number
  visibleCharacters: number
  characterStates: Map<
    number,
    {
      opacity: number
      scale: number
      offset: Point2D
      rotation: number
    }
  >
}

/**
 * Text layer node definition
 */
export interface TextNode {
  id: string
  name: string
  type: 'text'
  layer: TextLayer
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  properties: {
    position: Point2D
    scale: Point2D
    rotation: number
    opacity: number
    visible: boolean
  }
  animations: TextAnimation[]
  animationState: TextAnimationState
  editorState?: TextEditorState
}

/**
 * Text preset definitions
 */
export interface TextPreset {
  id: string
  name: string
  category: 'heading' | 'body' | 'display' | 'caption' | 'custom'
  layer: TextLayer
  previewText?: string
  description?: string
  tags?: string[]
}

/**
 * Font library entry
 */
export interface FontLibraryEntry {
  id: string
  family: string
  style: FontStyle
  weight: FontWeight
  source: 'system' | 'web' | 'local'
  url?: string // For web fonts
  filePath?: string // For local fonts
  metrics?: FontMetrics
  isLoaded: boolean
  error?: string
}

/**
 * Text export options
 */
export interface TextExportOptions {
  format: 'svg' | 'pdf' | 'png' | 'jpeg'
  includeAnimations: boolean
  includeStyles: boolean
  resolution: number
  backgroundColor?: Color
  padding?: number
}

/**
 * Text rendering context
 */
export interface TextRenderContext {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D | WebGLRenderingContext
  fontLibrary: Map<string, FontLibraryEntry>
  scale: number
  antialias: boolean
  subpixelRendering: boolean
}

/**
 * Text performance metrics
 */
export interface TextPerformanceMetrics {
  layoutTime: number
  renderingTime: number
  glyphCacheHits: number
  glyphCacheMisses: number
  memoryUsage: number
  characterCount: number
}

/**
 * Text validation result
 */
export interface TextValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions?: string[]
  metrics?: TextMeasurement
}
