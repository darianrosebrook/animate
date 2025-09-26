/**
 * @fileoverview Transform Node Implementation
 * @author @darianrosebrook
 */

import {
  SceneNode,
  NodeType,
  PropertyMap,
  PropertyValue,
  Time,
  EvaluationContext,
  Point3D,
  Point2D,
  Transform,
  Result,
} from '@/types'

/**
 * Transform node that handles position, rotation, scale, and anchor point
 */
export class TransformNode implements SceneNode {
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
    this.type = NodeType.Transform

    // Set default transform properties if not provided
    const defaultProperties: PropertyMap = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      anchorPoint: { x: 0, y: 0 },
      opacity: 1.0,
      ...properties,
    }

    this.properties = defaultProperties
    this.children = children
    this.parent = parent
  }

  /**
   * Evaluate the transform node at a specific time
   */
  evaluate(time: Time, context: EvaluationContext): Result<Transform> {
    try {
      // Get transform properties with defaults
      const position = this.getPropertyValue<Point3D>('position', { x: 0, y: 0, z: 0 }, time, context)
      const rotation = this.getPropertyValue<Point3D>('rotation', { x: 0, y: 0, z: 0 }, time, context)
      const scale = this.getPropertyValue<Point3D>('scale', { x: 1, y: 1, z: 1 }, time, context)
      const anchorPoint = this.getPropertyValue<Point2D>('anchorPoint', { x: 0, y: 0 }, time, context)
      const opacity = this.getPropertyValue<number>('opacity', 1.0, time, context)

      const transform: Transform = {
        position,
        rotation,
        scale,
        anchorPoint,
        opacity,
      }

      return { success: true, data: transform }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSFORM_EVALUATION_ERROR',
          message: `Failed to evaluate transform node '${this.id}': ${error}`,
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
    // Handle Point3D interpolation
    if (typeof startValue === 'object' && 'x' in startValue && 'y' in startValue && 'z' in startValue) {
      return {
        x: startValue.x + t * (endValue.x - startValue.x),
        y: startValue.y + t * (endValue.y - startValue.y),
        z: startValue.z + t * (endValue.z - startValue.z),
      }
    }

    // Handle Point2D interpolation
    if (typeof startValue === 'object' && 'x' in startValue && 'y' in startValue) {
      return {
        x: startValue.x + t * (endValue.x - startValue.x),
        y: startValue.y + t * (endValue.y - startValue.y),
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

    // Default: return end value (for non-interpolatable types)
    return endValue
  }

  /**
   * Create a copy of this node with updated properties
   */
  withProperties(newProperties: PropertyMap): TransformNode {
    return new TransformNode(
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
  withChildren(newChildren: SceneNode[]): TransformNode {
    return new TransformNode(
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
  withParent(newParent: SceneNode): TransformNode {
    return new TransformNode(
      this.id,
      this.name,
      this.properties,
      this.children,
      newParent
    )
  }
}

/**
 * Factory function to create transform nodes
 */
export function createTransformNode(
  id: string,
  name: string,
  properties: PropertyMap = {},
  children: SceneNode[] = []
): TransformNode {
  return new TransformNode(id, name, properties, children)
}

/**
 * Factory function to create transform nodes with common presets
 */
export function createTransformNodeWithDefaults(
  id: string,
  name: string = 'Transform',
  position: Point3D = { x: 0, y: 0, z: 0 },
  scale: Point3D = { x: 1, y: 1, z: 1 },
  rotation: Point3D = { x: 0, y: 0, z: 0 }
): TransformNode {
  const properties: PropertyMap = {
    position,
    scale,
    rotation,
    anchorPoint: { x: 0, y: 0 },
    opacity: 1.0,
  }

  return new TransformNode(id, name, properties)
}
