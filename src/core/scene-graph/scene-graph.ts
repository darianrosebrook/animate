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
  AnimatorError,
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
    context: any
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
   * Evaluate an animation curve at a specific time
   */
  private evaluateAnimationCurve(curve: any, time: Time): any {
    if (!curve.keyframes || curve.keyframes.length === 0) {
      return undefined
    }

    // Simple linear interpolation for now
    // TODO: Implement proper curve evaluation with bezier curves
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
    const t =
      (time - startKeyframe.time) / (endKeyframe.time - startKeyframe.time)
    const interpolatedValue =
      startKeyframe.value + t * (endKeyframe.value - startKeyframe.value)

    return interpolatedValue
  }
}
