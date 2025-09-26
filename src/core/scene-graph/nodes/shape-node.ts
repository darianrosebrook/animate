/**
 * @fileoverview Shape Node Implementation
 * @author @darianrosebrook
 */

import {
  SceneNode,
  NodeType,
  PropertyMap,
  PropertyValue,
  Time,
  EvaluationContext,
  Point2D,
  Size2D,
  Color,
  Result,
} from '@/types'

/**
 * Shape types supported by the shape node
 */
export enum ShapeType {
  Rectangle = 'rectangle',
  Circle = 'circle',
  Ellipse = 'ellipse',
  Triangle = 'triangle',
  Polygon = 'polygon',
  Path = 'path',
}

/**
 * Shape properties interface
 */
export interface ShapeProperties {
  shapeType: ShapeType
  size: Size2D
  position: Point2D
  fillColor: Color
  strokeColor: Color
  strokeWidth: number
  cornerRadius?: number
  pathData?: string
  vertices?: Point2D[]
}

/**
 * Shape node that handles 2D geometric shapes
 */
export class ShapeNode implements SceneNode {
  readonly id: string
  readonly name: string
  readonly type: NodeType
  readonly properties: PropertyMap
  readonly children: SceneNode[]
  readonly parent?: SceneNode

  constructor(
    id: string,
    name: string,
    properties: PropertyMap = {},
    children: SceneNode[] = [],
    parent?: SceneNode
  ) {
    this.id = id
    this.name = name
    this.type = NodeType.Shape
    this.properties = properties
    this.children = children
    this.parent = parent
  }

  /**
   * Evaluate the shape node at a specific time
   */
  evaluate(time: Time, context: EvaluationContext): Result<ShapeProperties> {
    try {
      // Get shape properties with defaults
      const shapeType = this.getPropertyValue<ShapeType>('shapeType', ShapeType.Rectangle, time, context)
      const size = this.getPropertyValue<Size2D>('size', { width: 100, height: 100 }, time, context)
      const position = this.getPropertyValue<Point2D>('position', { x: 0, y: 0 }, time, context)
      const fillColor = this.getPropertyValue<Color>('fillColor', { r: 255, g: 255, b: 255, a: 1 }, time, context)
      const strokeColor = this.getPropertyValue<Color>('strokeColor', { r: 0, g: 0, b: 0, a: 1 }, time, context)
      const strokeWidth = this.getPropertyValue<number>('strokeWidth', 1, time, context)
      const cornerRadius = this.getPropertyValue<number>('cornerRadius', 0, time, context)
      const pathData = this.getPropertyValue<string>('pathData', '', time, context)
      const vertices = this.getPropertyValue<Point2D[]>('vertices', [], time, context)

      const shapeProperties: ShapeProperties = {
        shapeType,
        size,
        position,
        fillColor,
        strokeColor,
        strokeWidth,
        cornerRadius,
        pathData,
        vertices,
      }

      return { success: true, data: shapeProperties }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SHAPE_EVALUATION_ERROR',
          message: `Failed to evaluate shape node '${this.id}': ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get a property value with type conversion and time evaluation
   */
  private getPropertyValue<T>(
    propertyName: string,
    defaultValue: T,
    time: Time,
    context: EvaluationContext
  ): T {
    const value = this.properties[propertyName]

    if (value === undefined) {
      return defaultValue
    }

    // Handle animation curves
    if (value && typeof value === 'object' && 'keyframes' in value) {
      return this.evaluateAnimationCurve(value, time, context)
    }

    // Handle static values
    return value as T
  }

  /**
   * Evaluate an animation curve at a specific time
   */
  private evaluateAnimationCurve(
    curve: any,
    time: Time,
    context: EvaluationContext
  ): any {
    if (!curve.keyframes || curve.keyframes.length === 0) {
      return undefined
    }

    // Simple linear interpolation for now
    const keyframes = curve.keyframes.sort((a: any, b: any) => a.time - b.time)

    // Find the appropriate keyframe segment
    let startKeyframe = keyframes[0]
    let endKeyframe = keyframes[keyframes.length - 1]

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        startKeyframe = keyframes[i]
        endKeyframe = keyframes[i + 1]
        break
      }
    }

    // Linear interpolation
    const t = (time - startKeyframe.time) / (endKeyframe.time - startKeyframe.time)
    const interpolatedValue = this.interpolateValues(startKeyframe.value, endKeyframe.value, t)

    return interpolatedValue
  }

  /**
   * Interpolate between two values based on their types
   */
  private interpolateValues(startValue: any, endValue: any, t: number): any {
    // Handle Point2D interpolation
    if (typeof startValue === 'object' && 'x' in startValue && 'y' in startValue) {
      return {
        x: startValue.x + t * (endValue.x - startValue.x),
        y: startValue.y + t * (endValue.y - startValue.y),
      }
    }

    // Handle Size2D interpolation
    if (typeof startValue === 'object' && 'width' in startValue && 'height' in startValue) {
      return {
        width: startValue.width + t * (endValue.width - startValue.width),
        height: startValue.height + t * (endValue.height - startValue.height),
      }
    }

    // Handle Color interpolation
    if (typeof startValue === 'object' && 'r' in startValue && 'g' in startValue && 'b' in startValue) {
      return {
        r: startValue.r + t * (endValue.r - startValue.r),
        g: startValue.g + t * (endValue.g - startValue.g),
        b: startValue.b + t * (endValue.b - startValue.b),
        a: (startValue.a || 1) + t * ((endValue.a || 1) - (startValue.a || 1)),
      }
    }

    // Handle scalar interpolation
    if (typeof startValue === 'number' && typeof endValue === 'number') {
      return startValue + t * (endValue - startValue)
    }

    // Handle array interpolation (for vertices)
    if (Array.isArray(startValue) && Array.isArray(endValue)) {
      if (startValue.length === 0) return endValue
      if (endValue.length === 0) return startValue

      const result: any[] = []
      const maxLength = Math.max(startValue.length, endValue.length)

      for (let i = 0; i < maxLength; i++) {
        const startItem = startValue[i] || startValue[0]
        const endItem = endValue[i] || endValue[0]
        result.push(this.interpolateValues(startItem, endItem, t))
      }

      return result
    }

    // Default: return end value (for non-interpolatable types)
    return endValue
  }

  /**
   * Create a copy of this node with updated properties
   */
  withProperties(newProperties: PropertyMap): ShapeNode {
    return new ShapeNode(
      this.id,
      this.name,
      { ...this.properties, ...newProperties },
      this.children,
      this.parent
    )
  }

  /**
   * Create a copy of this node with new children
   */
  withChildren(newChildren: SceneNode[]): ShapeNode {
    return new ShapeNode(
      this.id,
      this.name,
      this.properties,
      newChildren,
      this.parent
    )
  }

  /**
   * Create a copy of this node with a new parent
   */
  withParent(newParent: SceneNode): ShapeNode {
    return new ShapeNode(
      this.id,
      this.name,
      this.properties,
      this.children,
      newParent
    )
  }
}

/**
 * Factory function to create shape nodes
 */
export function createShapeNode(
  id: string,
  name: string,
  shapeType: ShapeType = ShapeType.Rectangle,
  properties: PropertyMap = {},
  children: SceneNode[] = []
): ShapeNode {
  const defaultProperties: PropertyMap = {
    shapeType,
    size: { width: 100, height: 100 },
    position: { x: 0, y: 0 },
    fillColor: { r: 255, g: 255, b: 255, a: 1 },
    strokeColor: { r: 0, g: 0, b: 0, a: 1 },
    strokeWidth: 1,
    ...properties,
  }

  return new ShapeNode(id, name, defaultProperties, children)
}

/**
 * Factory function to create rectangle shapes
 */
export function createRectangleNode(
  id: string,
  name: string = 'Rectangle',
  width: number = 100,
  height: number = 100,
  position: Point2D = { x: 0, y: 0 },
  fillColor: Color = { r: 255, g: 255, b: 255, a: 1 }
): ShapeNode {
  const properties: PropertyMap = {
    shapeType: ShapeType.Rectangle,
    size: { width, height },
    position,
    fillColor,
    strokeColor: { r: 0, g: 0, b: 0, a: 1 },
    strokeWidth: 1,
  }

  return new ShapeNode(id, name, properties)
}

/**
 * Factory function to create circle shapes
 */
export function createCircleNode(
  id: string,
  name: string = 'Circle',
  radius: number = 50,
  position: Point2D = { x: 0, y: 0 },
  fillColor: Color = { r: 255, g: 255, b: 255, a: 1 }
): ShapeNode {
  const properties: PropertyMap = {
    shapeType: ShapeType.Circle,
    size: { width: radius * 2, height: radius * 2 },
    position,
    fillColor,
    strokeColor: { r: 0, g: 0, b: 0, a: 1 },
    strokeWidth: 1,
  }

  return new ShapeNode(id, name, properties)
}

/**
 * Factory function to create path shapes from SVG path data
 */
export function createPathNode(
  id: string,
  name: string = 'Path',
  pathData: string,
  fillColor: Color = { r: 255, g: 255, b: 255, a: 1 },
  strokeColor: Color = { r: 0, g: 0, b: 0, a: 1 }
): ShapeNode {
  const properties: PropertyMap = {
    shapeType: ShapeType.Path,
    pathData,
    position: { x: 0, y: 0 },
    fillColor,
    strokeColor,
    strokeWidth: 1,
  }

  return new ShapeNode(id, name, properties)
}

