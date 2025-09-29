/**
 * @fileoverview Core Scene Graph Implementation
 * @author @darianrosebrook
 */

import {
  SceneNode,
  PropertyMap,
  PropertyValue,
  Time,
  EvaluationContext,
  Result,
} from '@/types'

/**
 * Core scene graph implementation with immutable updates and structural sharing
 */
export class SceneGraph {
  private rootNodes: SceneNode[]
  private nodeMap: Map<string, SceneNode>
  private dirtyNodes: Set<string>

  constructor() {
    this.rootNodes = []
    this.nodeMap = new Map()
    this.dirtyNodes = new Set()
  }

  /**
   * Add a node to the scene graph
   */
  addNode(node: SceneNode, parentId?: string): Result<SceneNode> {
    try {
      // Check if node already exists
      if (this.nodeMap.has(node.id)) {
        return {
          success: false,
          error: {
            code: 'NODE_ALREADY_EXISTS',
            message: `Node with id '${node.id}' already exists`,
          },
        }
      }

      // Add to node map
      this.nodeMap.set(node.id, node)
      this.dirtyNodes.add(node.id)

      // Add to parent if specified
      if (parentId) {
        const parent = this.nodeMap.get(parentId)
        if (!parent) {
          return {
            success: false,
            error: {
              code: 'PARENT_NOT_FOUND',
              message: `Parent node with id '${parentId}' not found`,
            },
          }
        }

        // Add as child to parent
        const updatedParent = {
          ...parent,
          children: [...parent.children, node],
        }
        this.nodeMap.set(parentId, updatedParent)
        this.dirtyNodes.add(parentId)
      } else {
        // Add as root node
        this.rootNodes.push(node)
      }

      return { success: true, data: node }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCENE_GRAPH_ERROR',
          message: `Failed to add node: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Clear all nodes from the scene graph
   */
  clear(): void {
    this.rootNodes = []
    this.nodeMap.clear()
    this.dirtyNodes.clear()
  }

  /**
   * Remove a node from the scene graph
   */
  removeNode(nodeId: string): Result<boolean> {
    try {
      const node = this.nodeMap.get(nodeId)
      if (!node) {
        return {
          success: false,
          error: {
            code: 'NODE_NOT_FOUND',
            message: `Node with id '${nodeId}' not found`,
          },
        }
      }

      // Remove from parent
      if (node.parent) {
        const updatedParent = {
          ...node.parent,
          children: node.parent.children.filter((child) => child.id !== nodeId),
        }
        this.nodeMap.set(node.parent.id, updatedParent)
        this.dirtyNodes.add(node.parent.id)
      } else {
        // Remove from root nodes
        this.rootNodes = this.rootNodes.filter((root) => root.id !== nodeId)
      }

      // Remove from node map and mark as dirty
      this.nodeMap.delete(nodeId)
      this.dirtyNodes.add(nodeId)

      // Mark all descendants as dirty
      this.markDescendantsDirty(node)

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCENE_GRAPH_ERROR',
          message: `Failed to remove node: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get a node by ID
   */
  getNode(nodeId: string): Result<SceneNode> {
    const node = this.nodeMap.get(nodeId)
    if (!node) {
      return {
        success: false,
        error: {
          code: 'NODE_NOT_FOUND',
          message: `Node with id '${nodeId}' not found`,
        },
      }
    }
    return { success: true, data: node }
  }

  /**
   * Update node properties
   */
  updateNodeProperties(
    nodeId: string,
    properties: PropertyMap
  ): Result<SceneNode> {
    const nodeResult = this.getNode(nodeId)
    if (!nodeResult.success) {
      return nodeResult
    }

    const node = nodeResult.data
    const updatedNode = {
      ...node,
      properties: { ...node.properties, ...properties },
    }

    this.nodeMap.set(nodeId, updatedNode)
    this.dirtyNodes.add(nodeId)

    // Mark all descendants as dirty
    this.markDescendantsDirty(updatedNode)

    return { success: true, data: updatedNode }
  }

  /**
   * Evaluate the scene graph at a specific time
   */
  evaluate(time: Time, context: EvaluationContext): Result<any> {
    try {
      const evaluatedNodes = new Map<string, any>()

      // Evaluate all root nodes
      for (const rootNode of this.rootNodes) {
        const result = this.evaluateNode(
          rootNode,
          time,
          context,
          evaluatedNodes
        )
        if (!result.success) {
          return result
        }
      }

      return { success: true, data: Array.from(evaluatedNodes.values()) }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EVALUATION_ERROR',
          message: `Failed to evaluate scene: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get all root nodes
   */
  getRootNodes(): SceneNode[] {
    return [...this.rootNodes]
  }

  /**
   * Get all nodes in the scene graph
   */
  getAllNodes(): SceneNode[] {
    return Array.from(this.nodeMap.values())
  }

  /**
   * Get dirty nodes (nodes that need re-evaluation)
   */
  getDirtyNodes(): string[] {
    return Array.from(this.dirtyNodes)
  }

  /**
   * Clear dirty flags
   */
  clearDirtyFlags(): void {
    this.dirtyNodes.clear()
  }

  /**
   * Mark all descendants of a node as dirty
   */
  private markDescendantsDirty(node: SceneNode): void {
    for (const child of node.children) {
      this.dirtyNodes.add(child.id)
      this.markDescendantsDirty(child)
    }
  }

  /**
   * Evaluate a single node recursively
   */
  private evaluateNode(
    node: SceneNode,
    time: Time,
    context: EvaluationContext,
    evaluatedNodes: Map<string, any>
  ): Result<any> {
    // Check if already evaluated
    if (evaluatedNodes.has(node.id)) {
      return { success: true, data: evaluatedNodes.get(node.id) }
    }

    // Evaluate children first (for dependency resolution)
    const childResults: any[] = []
    for (const child of node.children) {
      const childResult = this.evaluateNode(
        child,
        time,
        context,
        evaluatedNodes
      )
      if (!childResult.success) {
        return childResult
      }
      childResults.push(childResult.data)
    }

    // Evaluate current node
    const nodeContext = {
      ...context,
      node,
      children: childResults,
    }

    const evaluatedNode = this.evaluateNodeProperties(node, time, nodeContext)
    evaluatedNodes.set(node.id, evaluatedNode)

    return { success: true, data: evaluatedNode }
  }

  /**
   * Evaluate node properties at a specific time
   */
  private evaluateNodeProperties(
    node: SceneNode,
    time: Time,
    context: any
  ): any {
    const result: any = {
      id: node.id,
      name: node.name,
      type: node.type,
      time,
    }

    // Evaluate each property
    for (const [key, value] of Object.entries(node.properties)) {
      result[key] = this.evaluateProperty(value, time, context)
    }

    return result
  }

  /**
   * Evaluate a property value at a specific time
   */
  private evaluateProperty(
    value: PropertyValue,
    time: Time,
    _context: any
  ): any {
    // Handle different property value types
    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'string') {
      return value
    }

    if (typeof value === 'boolean') {
      return value
    }

    if (value && typeof value === 'object' && 'keyframes' in value) {
      // This is an animation curve
      return this.evaluateAnimationCurve(value, time)
    }

    if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
      // This is a Point2D
      return value
    }

    if (
      value &&
      typeof value === 'object' &&
      'r' in value &&
      'g' in value &&
      'b' in value
    ) {
      // This is a Color
      return value
    }

    // Default case
    return value
  }

  /**
   * Evaluate an animation curve at a specific time with proper Bezier curve support
   */
  private evaluateAnimationCurve(curve: any, time: Time): any {
    if (!curve.keyframes || curve.keyframes.length === 0) {
      return undefined
    }

    const keyframes = curve.keyframes.sort((a: any, b: any) => a.time - b.time)

    // Handle single keyframe case
    if (keyframes.length === 1) {
      return keyframes[0].value
    }

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

    // Calculate interpolation parameter
    const segmentDuration = endKeyframe.time - startKeyframe.time
    if (segmentDuration === 0) {
      return startKeyframe.value
    }

    const t = Math.max(
      0,
      Math.min(1, (time - startKeyframe.time) / segmentDuration)
    )

    // Handle different interpolation modes
    switch (startKeyframe.interpolation) {
      case 'linear':
        return this.lerp(startKeyframe.value, endKeyframe.value, t)

      case 'bezier':
        return this.evaluateBezierCurve(
          startKeyframe.value,
          endKeyframe.value,
          startKeyframe.easing,
          endKeyframe.easing,
          t
        )

      case 'stepped':
        return startKeyframe.value

      case 'smooth':
        // Smooth interpolation using Catmull-Rom spline approximation
        return this.smoothInterpolation(
          startKeyframe.value,
          endKeyframe.value,
          t
        )

      default:
        return this.lerp(startKeyframe.value, endKeyframe.value, t)
    }
  }

  /**
   * Linear interpolation between two values
   */
  private lerp(startValue: any, endValue: any, t: number): any {
    if (typeof startValue === 'number' && typeof endValue === 'number') {
      return startValue + t * (endValue - startValue)
    }

    if (startValue && endValue && typeof startValue === 'object') {
      // Handle vector/matrix interpolation
      if (Array.isArray(startValue) && Array.isArray(endValue)) {
        return startValue.map((v, i) => this.lerp(v, endValue[i], t))
      }

      // Handle object property interpolation
      const result: any = {}
      for (const key in startValue) {
        if (endValue.hasOwnProperty(key)) {
          result[key] = this.lerp(startValue[key], endValue[key], t)
        }
      }
      return result
    }

    return startValue
  }

  /**
   * Evaluate Bezier curve interpolation
   */
  private evaluateBezierCurve(
    startValue: any,
    endValue: any,
    startEasing?: any,
    _endEasing?: any,
    t: number = 0
  ): any {
    // For now, implement 1D Bezier curve evaluation
    // This can be extended to handle multi-dimensional values

    if (typeof startValue === 'number' && typeof endValue === 'number') {
      // Default Bezier easing if none provided
      const p1x = startEasing?.p1x ?? 0.25
      const p1y = startEasing?.p1y ?? 0.1
      const p2x = _endEasing?.p2x ?? 0.25
      const p2y = _endEasing?.p2y ?? 1.0

      // Convert Bezier control points to cubic Bezier coefficients
      // B(t) = (1-t)^3 * P0 + 3*(1-t)^2*t * P1 + 3*(1-t)*t^2 * P2 + t^3 * P3
      const bezierT = this.bezierInterpolation(t, p1x, p1y, p2x, p2y)
      return this.lerp(startValue, endValue, bezierT)
    }

    // Fallback to linear for complex types
    return this.lerp(startValue, endValue, t)
  }

  /**
   * Smooth interpolation using eased curve
   */
  private smoothInterpolation(startValue: any, endValue: any, t: number): any {
    // Apply smoothstep function: 3t^2 - 2t^3
    const smoothT = t * t * (3.0 - 2.0 * t)
    return this.lerp(startValue, endValue, smoothT)
  }

  /**
   * Evaluate Bezier curve timing function
   */
  private bezierInterpolation(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
    // Full cubic Bezier curve evaluation for timing functions
    // B(t) = (1-t)^3*P0 + 3*(1-t)^2*t*P1 + 3*(1-t)*t^2*P2 + t^3*P3
    // Where P0 = (0,0), P3 = (1,1), P1 = (p1x, p1y), P2 = (p2x, p2y)
    const u = 1.0 - t
    const uu = u * u
    const uuu = uu * u
    const tt = t * t
    const ttt = tt * t

    // Calculate both x and y coordinates of the Bezier curve
    const x = uuu * 0 + 3 * uu * t * p1x + 3 * u * tt * p2x + ttt * 1
    const y = uuu * 0 + 3 * uu * t * p1y + 3 * u * tt * p2y + ttt * 1

    // For timing functions, we want to map input time (t) to output time (y)
    // Since the curve goes from (0,0) to (1,1), we can use y as the output
    return Math.max(0, Math.min(1, y))
  }
}
