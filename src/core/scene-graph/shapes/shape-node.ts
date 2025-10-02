/**
 * @fileoverview Shape Node Implementation
 * @description Scene graph nodes for 2D shapes with full animation support
 * @author @darianrosebrook
 */

import { Result, Time } from '@/types'
import {
  SceneNode,
  NodeType,
  PropertyMap,
  PropertyValue,
} from '../scene-graph-types'
import {
  RectangleShape,
  EllipseShape,
  PathShape,
  ShapeFill,
  ShapeStroke,
  ShapeBounds,
  ShapeCreationParams,
} from './shape-types'
import { ShapeGeometryGenerator } from './shape-geometry'

/**
 * Shape node types
 */
export enum ShapeNodeType {
  RECTANGLE = 'rectangle',
  ELLIPSE = 'ellipse',
  PATH = 'path',
  POLYGON = 'polygon',
  STAR = 'star',
}

/**
 * Shape node implementation
 */
export class ShapeNode implements SceneNode {
  readonly id: string
  readonly name: string
  readonly type: NodeType = NodeType.Shape

  // Shape-specific properties
  shapeType: ShapeNodeType
  shape: RectangleShape | EllipseShape | PathShape
  bounds: ShapeBounds

  // Standard node properties
  properties: PropertyMap
  children: SceneNode[] = []
  parent?: SceneNode

  // Animation state
  private keyframes: Map<string, any[]> = new Map()
  private currentValues: Map<string, any> = new Map()

  constructor(
    id: string,
    name: string,
    shapeType: ShapeNodeType,
    shape: RectangleShape | EllipseShape | PathShape,
    properties: PropertyMap = {}
  ) {
    this.id = id
    this.name = name
    this.shapeType = shapeType
    this.shape = shape
    this.properties = { ...properties }
    this.bounds = this.calculateBounds()

    // Initialize current values from properties
    this.initializeCurrentValues()
  }

  /**
   * Create a rectangle shape node
   */
  static createRectangle(
    id: string,
    name: string,
    position: { x: number; y: number },
    size: { width: number; height: number },
    properties: PropertyMap = {}
  ): ShapeNode {
    const shape: RectangleShape = {
      position,
      size,
      rotation: 0,
      cornerType: 'square' as any,
      fill: {
        type: 'solid' as any,
        color: { r: 255, g: 255, b: 255, a: 1 },
      },
      stroke: null,
    }

    return new ShapeNode(id, name, ShapeNodeType.RECTANGLE, shape, properties)
  }

  /**
   * Create an ellipse shape node
   */
  static createEllipse(
    id: string,
    name: string,
    position: { x: number; y: number },
    size: { width: number; height: number },
    properties: PropertyMap = {}
  ): ShapeNode {
    const shape: EllipseShape = {
      position,
      size,
      rotation: 0,
      fill: {
        type: 'solid' as any,
        color: { r: 255, g: 255, b: 255, a: 1 },
      },
      stroke: null,
    }

    return new ShapeNode(id, name, ShapeNodeType.ELLIPSE, shape, properties)
  }

  /**
   * Create a path shape node
   */
  static createPath(
    id: string,
    name: string,
    vertices: any[] = [],
    closed: boolean = false,
    properties: PropertyMap = {}
  ): ShapeNode {
    const shape: PathShape = {
      vertices: vertices,
      closed,
      fill: {
        type: 'solid' as any,
        color: { r: 255, g: 255, b: 255, a: 1 },
      },
      stroke: null,
    }

    return new ShapeNode(id, name, ShapeNodeType.PATH, shape, properties)
  }

  /**
   * Update shape properties
   */
  updateShape(
    updates: Partial<RectangleShape | EllipseShape | PathShape>
  ): void {
    if (this.isRectangleShape(this.shape)) {
      this.shape = { ...this.shape, ...updates } as RectangleShape
    } else if (this.isEllipseShape(this.shape)) {
      this.shape = { ...this.shape, ...updates } as EllipseShape
    } else if (this.isPathShape(this.shape)) {
      this.shape = { ...this.shape, ...updates } as PathShape
    }

    this.bounds = this.calculateBounds()
  }

  /**
   * Update node properties
   */
  updateProperties(updates: PropertyMap): void {
    this.properties = { ...this.properties, ...updates }
    this.updateCurrentValues()
  }

  /**
   * Get property value at specific time
   */
  getPropertyAtTime(propertyName: string, time: Time): PropertyValue {
    // Check for keyframes first
    const keyframes = this.keyframes.get(propertyName)
    if (keyframes && keyframes.length > 0) {
      // Find the appropriate keyframe and interpolate
      return this.interpolateKeyframe(keyframes, time)
    }

    // Return current value or property value
    return this.currentValues.get(propertyName) ?? this.properties[propertyName]
  }

  /**
   * Set keyframe for property
   */
  setKeyframe(propertyName: string, time: Time, value: PropertyValue): void {
    if (!this.keyframes.has(propertyName)) {
      this.keyframes.set(propertyName, [])
    }

    const keyframes = this.keyframes.get(propertyName)!
    const existingIndex = keyframes.findIndex((kf) => kf.time === time)

    if (existingIndex >= 0) {
      keyframes[existingIndex] = { time, value }
    } else {
      keyframes.push({ time, value })
      keyframes.sort((a, b) => a.time - b.time)
    }
  }

  /**
   * Remove keyframe
   */
  removeKeyframe(propertyName: string, time: Time): void {
    const keyframes = this.keyframes.get(propertyName)
    if (keyframes) {
      const index = keyframes.findIndex((kf) => kf.time === time)
      if (index >= 0) {
        keyframes.splice(index, 1)
      }
    }
  }

  /**
   * Get all keyframes for a property
   */
  getKeyframes(propertyName: string): any[] {
    return this.keyframes.get(propertyName) || []
  }

  /**
   * Calculate shape bounds
   */
  private calculateBounds(): ShapeBounds {
    if (this.isRectangleShape(this.shape)) {
      const { position, size } = this.shape
      return {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      }
    } else if (this.isEllipseShape(this.shape)) {
      const { position, size } = this.shape
      return {
        x: position.x - size.width / 2,
        y: position.y - size.height / 2,
        width: size.width,
        height: size.height,
      }
    } else if (this.isPathShape(this.shape)) {
      return ShapeGeometryGenerator.calculatePathBounds(this.shape.vertices)
    }

    return { x: 0, y: 0, width: 0, height: 0 }
  }

  /**
   * Initialize current values from properties
   */
  private initializeCurrentValues(): void {
    // Initialize common transform properties
    this.currentValues.set(
      'position',
      this.properties.position || { x: 0, y: 0 }
    )
    this.currentValues.set('scale', this.properties.scale || { x: 1, y: 1 })
    this.currentValues.set('rotation', this.properties.rotation || 0)
    this.currentValues.set('opacity', this.properties.opacity || 1)

    // Initialize shape-specific properties
    if (this.isRectangleShape(this.shape)) {
      this.currentValues.set('cornerRadius', this.shape.cornerRadius || 0)
    }
  }

  /**
   * Update current values from properties
   */
  private updateCurrentValues(): void {
    Object.keys(this.properties).forEach((key) => {
      this.currentValues.set(key, this.properties[key])
    })
  }

  /**
   * Interpolate between keyframes
   */
  private interpolateKeyframe(keyframes: any[], time: Time): PropertyValue {
    if (keyframes.length === 0) {
      return this.properties[Object.keys(this.properties)[0]] || 0
    }

    if (keyframes.length === 1) {
      return keyframes[0].value
    }

    // Find the two keyframes to interpolate between
    let beforeIndex = -1
    let afterIndex = -1

    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].time <= time) {
        beforeIndex = i
      }
      if (keyframes[i].time >= time && afterIndex === -1) {
        afterIndex = i
        break
      }
    }

    if (beforeIndex === -1) {
      return keyframes[0].value
    }

    if (afterIndex === -1) {
      return keyframes[keyframes.length - 1].value
    }

    const before = keyframes[beforeIndex]
    const after = keyframes[afterIndex]

    if (before.time === after.time) {
      return before.value
    }

    // Linear interpolation for now
    const t = (time - before.time) / (after.time - before.time)
    return this.lerp(before.value, after.value, t)
  }

  /**
   * Linear interpolation between two values
   */
  private lerp(a: any, b: any, t: number): PropertyValue {
    if (typeof a === 'number' && typeof b === 'number') {
      return a + (b - a) * t
    }

    if (
      typeof a === 'object' &&
      a !== null &&
      typeof b === 'object' &&
      b !== null
    ) {
      if ('x' in a && 'y' in a && 'x' in b && 'y' in b) {
        // Point interpolation
        return {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
        }
      }
    }

    return a
  }

  /**
   * Type guards for shape types
   */
  private isRectangleShape(shape: any): shape is RectangleShape {
    return shape && 'cornerType' in shape
  }

  private isEllipseShape(shape: any): shape is EllipseShape {
    return shape && 'innerRadius' in shape
  }

  private isPathShape(shape: any): shape is PathShape {
    return shape && 'vertices' in shape
  }

  /**
   * Get shape bounds
   */
  getBounds(): ShapeBounds {
    return this.bounds
  }

  /**
   * Check if point is inside shape
   */
  containsPoint(point: { x: number; y: number }): boolean {
    // Simplified hit testing - in a full implementation, this would use proper geometry
    return (
      point.x >= this.bounds.x &&
      point.x <= this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y <= this.bounds.y + this.bounds.height
    )
  }

  /**
   * Clone the shape node
   */
  clone(newId?: string): ShapeNode {
    const cloned = new ShapeNode(
      newId || `${this.id}_clone`,
      `${this.name} Copy`,
      this.shapeType,
      JSON.parse(JSON.stringify(this.shape)), // Deep clone shape
      { ...this.properties }
    )

    cloned.keyframes = new Map(this.keyframes)
    cloned.currentValues = new Map(this.currentValues)

    return cloned
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      shapeType: this.shapeType,
      shape: this.shape,
      properties: this.properties,
      keyframes: Array.from(this.keyframes.entries()),
      bounds: this.bounds,
    }
  }

  /**
   * Create shape node from JSON
   */
  static fromJSON(data: any): ShapeNode {
    const node = new ShapeNode(
      data.id,
      data.name,
      data.shapeType,
      data.shape,
      data.properties
    )

    node.keyframes = new Map(data.keyframes || [])
    node.bounds = data.bounds

    return node
  }
}

/**
 * Shape node factory for creating different shape types
 */
export class ShapeNodeFactory {
  /**
   * Create shape node from creation parameters
   */
  static createFromParams(params: ShapeCreationParams): ShapeNode {
    switch (params.type) {
      case 'rectangle':
        return ShapeNode.createRectangle(
          `shape_${Date.now()}`,
          'Rectangle',
          params.position,
          params.size || { width: 100, height: 100 }
        )

      case 'ellipse':
        return ShapeNode.createEllipse(
          `shape_${Date.now()}`,
          'Ellipse',
          params.position,
          params.size || { width: 100, height: 100 }
        )

      case 'path':
        return ShapeNode.createPath(
          `shape_${Date.now()}`,
          'Path',
          params.vertices || [],
          false
        )

      default:
        throw new Error(`Unsupported shape type: ${params.type}`)
    }
  }

  /**
   * Create shape from SVG path data
   */
  static createFromSVGPath(pathData: string, name: string = 'Path'): ShapeNode {
    // Parse SVG path and create vertices
    // For now, return a simple path
    return ShapeNode.createPath(`shape_${Date.now()}`, name, [], false)
  }

  /**
   * Create shape from preset
   */
  static createFromPreset(presetId: string): ShapeNode {
    // TODO: Implement preset system
    return ShapeNode.createRectangle(
      `shape_${Date.now()}`,
      'Preset Shape',
      { x: 0, y: 0 },
      { width: 100, height: 100 }
    )
  }
}

/**
 * Shape manipulation utilities
 */
export class ShapeManipulator {
  /**
   * Apply boolean operation to two shapes
   */
  static booleanOperation(
    shape1: ShapeNode,
    shape2: ShapeNode,
    operation: 'union' | 'intersection' | 'difference'
  ): ShapeNode | null {
    // For now, return the first shape
    // TODO: Implement proper boolean operations
    return shape1
  }

  /**
   * Convert shape to path for editing
   */
  static convertToPath(shapeNode: ShapeNode): ShapeNode {
    // TODO: Implement shape-to-path conversion
    return shapeNode
  }

  /**
   * Simplify path by removing unnecessary vertices
   */
  static simplifyPath(shapeNode: ShapeNode, tolerance: number = 1): ShapeNode {
    // TODO: Implement path simplification
    return shapeNode
  }

  /**
   * Add rounded corners to rectangle
   */
  static addRoundedCorners(shapeNode: ShapeNode, radius: number): ShapeNode {
    if (shapeNode.shapeType === ShapeNodeType.RECTANGLE) {
      const rectangle = shapeNode.shape as RectangleShape
      shapeNode.updateShape({
        ...rectangle,
        cornerType: 'rounded' as any,
        cornerRadius: radius,
      })
    }

    return shapeNode
  }

  /**
   * Convert ellipse to path for editing
   */
  static ellipseToPath(shapeNode: ShapeNode): ShapeNode {
    if (shapeNode.shapeType === ShapeNodeType.ELLIPSE) {
      // TODO: Implement ellipse to path conversion
      return shapeNode
    }

    return shapeNode
  }
}
