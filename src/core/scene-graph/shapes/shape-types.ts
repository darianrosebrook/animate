/**
 * @fileoverview Advanced Shape Types and Geometry System
 * @description Core shape definitions for 2D motion graphics
 * @author @darianrosebrook
 */

import { Point2D, Size2D, Color } from '@/types'

/**
 * Shape fill types
 */
export enum ShapeFillType {
  SOLID = 'solid',
  GRADIENT_LINEAR = 'gradient_linear',
  GRADIENT_RADIAL = 'gradient_radial',
  GRADIENT_DIAMOND = 'gradient_diamond',
  GRADIENT_CONICAL = 'gradient_conical',
  PATTERN = 'pattern',
  NONE = 'none',
}

/**
 * Shape stroke types
 */
export enum ShapeStrokeType {
  SOLID = 'solid',
  DASHED = 'dashed',
  DOTTED = 'dotted',
  NONE = 'none',
}

/**
 * Gradient stop point
 */
export interface GradientStop {
  position: number // 0-1
  color: Color
}

/**
 * Linear gradient definition
 */
export interface LinearGradient {
  startPoint: Point2D
  endPoint: Point2D
  stops: GradientStop[]
}

/**
 * Radial gradient definition
 */
export interface RadialGradient {
  centerPoint: Point2D
  radius: number
  stops: GradientStop[]
}

/**
 * Shape fill definition
 */
export type ShapeFill =
  | { type: ShapeFillType.SOLID; color: Color }
  | { type: ShapeFillType.GRADIENT_LINEAR; gradient: LinearGradient }
  | { type: ShapeFillType.GRADIENT_RADIAL; gradient: RadialGradient }
  | { type: ShapeFillType.NONE }

/**
 * Shape stroke definition
 */
export interface ShapeStroke {
  type: ShapeStrokeType
  color: Color
  width: number
  opacity: number
  dashPattern?: number[]
  dashOffset?: number
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
  miterLimit?: number
}

/**
 * Rectangle corner types
 */
export enum RectangleCornerType {
  SQUARE = 'square',
  ROUNDED = 'rounded',
  CHAMFERED = 'chamfered',
}

/**
 * Rectangle shape definition
 */
export interface RectangleShape {
  position: Point2D
  size: Size2D
  rotation: number
  cornerType: RectangleCornerType
  cornerRadius?: number // For rounded corners
  chamferSize?: number // For chamfered corners
  fill: ShapeFill
  stroke: ShapeStroke | null
}

/**
 * Ellipse shape definition
 */
export interface EllipseShape {
  position: Point2D
  size: Size2D
  rotation: number
  innerRadius?: number // For donut shapes (0-1 as percentage of outer radius)
  startAngle?: number // For arc shapes (0-360 degrees)
  endAngle?: number // For arc shapes (0-360 degrees)
  fill: ShapeFill
  stroke: ShapeStroke | null
}

/**
 * Path vertex types
 */
export enum PathVertexType {
  CORNER = 'corner',
  SMOOTH = 'smooth',
  SYMMETRIC = 'symmetric',
}

/**
 * Path vertex definition
 */
export interface PathVertex {
  point: Point2D
  type: PathVertexType
  inHandle?: Point2D // Control point for incoming bezier curve
  outHandle?: Point2D // Control point for outgoing bezier curve
}

/**
 * Path shape definition
 */
export interface PathShape {
  vertices: PathVertex[]
  closed: boolean
  fill: ShapeFill
  stroke: ShapeStroke | null
}

/**
 * Advanced path shape with boolean operations support
 */
export interface AdvancedPathShape {
  subpaths: PathShape[]
  fillRule: 'nonzero' | 'evenodd'
  fill: ShapeFill
  stroke: ShapeStroke | null
}

/**
 * Shape geometry data for rendering
 */
export interface ShapeGeometry {
  vertices: Float32Array
  indices?: Uint16Array
  vertexCount: number
  indexCount?: number
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
}

/**
 * Shape rendering data
 */
export interface ShapeRenderData {
  geometry: ShapeGeometry
  fillShader: string | null
  strokeShader: string | null
  uniforms: Record<string, any>
  transform: Float32Array // 4x4 transform matrix
}

/**
 * Shape manipulation operations
 */
export enum ShapeOperation {
  UNION = 'union',
  INTERSECTION = 'intersection',
  DIFFERENCE = 'difference',
  EXCLUDE = 'exclude',
}

/**
 * Shape manipulation result
 */
export interface ShapeManipulationResult {
  success: boolean
  newShape?: AdvancedPathShape
  error?: string
}

/**
 * Path editing operations
 */
export interface PathEditOperation {
  type: 'add_vertex' | 'remove_vertex' | 'move_vertex' | 'convert_vertex_type'
  vertexIndex?: number
  newVertex?: PathVertex
  position?: Point2D
}

/**
 * Shape bounds calculation
 */
export interface ShapeBounds {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

/**
 * Shape hit testing result
 */
export interface ShapeHitTestResult {
  hit: boolean
  shape?: RectangleShape | EllipseShape | PathShape
  distance?: number
  segmentIndex?: number // For path shapes
}

/**
 * Shape preset definitions
 */
export interface ShapePreset {
  id: string
  name: string
  category: 'basic' | 'advanced' | 'custom'
  shape: RectangleShape | EllipseShape | PathShape
  thumbnail?: string
  description?: string
  tags?: string[]
}

/**
 * Shape creation parameters
 */
export interface ShapeCreationParams {
  type: 'rectangle' | 'ellipse' | 'path'
  position: Point2D
  size?: Size2D
  pathData?: string // SVG path data
  vertices?: PathVertex[]
  preset?: ShapePreset
}

/**
 * Shape style inheritance
 */
export interface ShapeStyleInheritance {
  inheritFill: boolean
  inheritStroke: boolean
  inheritOpacity: boolean
  parentStyle?: {
    fill: ShapeFill
    stroke: ShapeStroke | null
    opacity: number
  }
}

/**
 * Advanced shape features for professional motion graphics
 */
export interface AdvancedShapeFeatures {
  // Boolean operations
  booleanOperations: boolean

  // Path editing
  pathEditing: boolean

  // Variable width strokes
  variableWidthStrokes: boolean

  // Gradient meshes
  gradientMeshes: boolean

  // Shape morphing
  morphingTargets: PathShape[]

  // Animation presets
  animationPresets: string[]

  // Style inheritance
  styleInheritance: ShapeStyleInheritance
}

/**
 * Shape system configuration
 */
export interface ShapeSystemConfig {
  defaultFill: ShapeFill
  defaultStroke: ShapeStroke
  snapToGrid: boolean
  gridSize: number
  enableBooleanOperations: boolean
  enablePathEditing: boolean
  maxUndoSteps: number
  performanceMode: 'quality' | 'speed' | 'balanced'
}

/**
 * Shape rendering modes for different quality levels
 */
export enum ShapeRenderMode {
  PREVIEW = 'preview', // Fast, lower quality for editing
  STANDARD = 'standard', // Balanced quality and performance
  HIGH_QUALITY = 'high_quality', // Best quality for final output
  WIREFRAME = 'wireframe', // Outline only for editing
}

/**
 * Shape animation data
 */
export interface ShapeAnimationData {
  morphTargets: PathShape[]
  morphWeights: number[]
  animationCurves: Map<string, any> // Property name -> animation curve
  keyframeData: Map<number, any> // Time -> property values
}

/**
 * Shape export options
 */
export interface ShapeExportOptions {
  format: 'svg' | 'pdf' | 'png' | 'jpeg'
  resolution: Size2D
  quality?: number // For lossy formats
  includeStyles: boolean
  flattenTransforms: boolean
  exportBounds: 'artboard' | 'selection' | 'visible'
}

/**
 * Shape validation result
 */
export interface ShapeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions?: string[]
}

/**
 * Performance metrics for shape operations
 */
export interface ShapePerformanceMetrics {
  geometryGenerationTime: number
  renderingTime: number
  memoryUsage: number
  vertexCount: number
  triangleCount: number
}
