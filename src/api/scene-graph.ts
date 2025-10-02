/**
 * @fileoverview Scene Graph API - Node hierarchy and property management
 * @description Detailed implementation of scene graph operations for the Animator platform
 * @author @darianrosebrook
 */

import type {
  BaseNode,
  NodeType,
  PropertyMap,
  PropertyValue,
  Time,
  SceneState,
  NodeState,
} from './animator-api'

/**
 * Scene graph manipulation class - implements the main API interface
 */
export class SceneGraph {
  private nodes: Map<string, BaseNode> = new Map()
  private rootNodes: BaseNode[] = []

  constructor() {
    // Initialize with empty scene
  }

  createNode(type: NodeType, parentId?: string): Promise<BaseNode> {
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const name = `${type}_${this.nodes.size + 1}`

    const node: BaseNode = {
      id,
      name,
      type,
      properties: {
        position: { x: 0, y: 0 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        opacity: 1,
        visible: true,
      },
      children: [],
      parent: parentId ? this.nodes.get(parentId) : undefined,
    }

    // Add to nodes map
    this.nodes.set(id, node)

    // Handle parent relationship
    if (parentId) {
      const parent = this.nodes.get(parentId)
      if (parent) {
        parent.children.push(node)
        node.parent = parent
      }
    } else {
      this.rootNodes.push(node)
    }

    return Promise.resolve(node)
  }

  getNode(nodeId: string): Promise<BaseNode | null> {
    return Promise.resolve(this.nodes.get(nodeId) || null)
  }

  updateNode(nodeId: string, updates: Partial<BaseNode>): Promise<BaseNode> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    const updatedNode = { ...node, ...updates }
    this.nodes.set(nodeId, updatedNode)
    return Promise.resolve(updatedNode)
  }

  deleteNode(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      return Promise.resolve(false)
    }

    // Remove from parent
    if (node.parent) {
      node.parent.children = node.parent.children.filter(
        (child) => child.id !== nodeId
      )
    } else {
      this.rootNodes = this.rootNodes.filter((n) => n.id !== nodeId)
    }

    // Remove children recursively
    for (const child of node.children) {
      this.deleteNode(child.id)
    }

    // Remove from nodes map
    this.nodes.delete(nodeId)
    return Promise.resolve(true)
  }

  setParent(nodeId: string, parentId: string | null): Promise<void> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    // Remove from current parent
    if (node.parent) {
      node.parent.children = node.parent.children.filter(
        (child) => child.id !== nodeId
      )
    } else {
      this.rootNodes = this.rootNodes.filter((n) => n.id !== nodeId)
    }

    // Set new parent
    if (parentId) {
      const parent = this.nodes.get(parentId)
      if (!parent) {
        throw new Error(`Parent ${parentId} not found`)
      }
      parent.children.push(node)
      node.parent = parent
    } else {
      this.rootNodes.push(node)
      node.parent = undefined
    }

    return Promise.resolve()
  }

  getChildren(nodeId: string): Promise<BaseNode[]> {
    const node = this.nodes.get(nodeId)
    return Promise.resolve(node ? node.children : [])
  }

  getAncestors(nodeId: string): Promise<BaseNode[]> {
    const ancestors: BaseNode[] = []
    const node = this.nodes.get(nodeId)

    let current = node?.parent
    while (current) {
      ancestors.unshift(current)
      current = current.parent
    }

    return Promise.resolve(ancestors)
  }

  getDescendants(nodeId: string): Promise<BaseNode[]> {
    const descendants: BaseNode[] = []
    const node = this.nodes.get(nodeId)

    if (node) {
      for (const child of node.children) {
        descendants.push(child)
        // TODO: Properly handle async descendant retrieval
        // const childDescendants = await this.getDescendants(child.id)
        // descendants.push(...childDescendants)
      }
    }

    return Promise.resolve(descendants)
  }

  setProperty(
    nodeId: string,
    key: string,
    value: PropertyValue
  ): Promise<void> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }
    node.properties[key] = value
    return Promise.resolve()
  }

  setProperties(nodeId: string, properties: PropertyMap): Promise<void> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }
    Object.assign(node.properties, properties)
    return Promise.resolve()
  }

  getProperty(nodeId: string, key: string): Promise<PropertyValue | undefined> {
    const node = this.nodes.get(nodeId)
    return Promise.resolve(node?.properties[key])
  }

  getProperties(nodeId: string): Promise<PropertyMap> {
    const node = this.nodes.get(nodeId)
    return Promise.resolve(node?.properties || {})
  }

  setKeyframe(
    nodeId: string,
    _propertyPath: string,
    _keyframe: Keyframe
  ): Promise<void> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    // TODO: Implement keyframe functionality when BaseNode supports keyframes
    // if (!node.keyframes[propertyPath]) {
    //   node.keyframes[propertyPath] = []
    // }
    // node.keyframes[propertyPath].push(keyframe)
    return Promise.resolve()
  }

  async removeKeyframe(
    nodeId: string,
    propertyPath: string,
    time: Time
  ): Promise<boolean> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      return false
    }

    // Get or initialize keyframes for this property
    const keyframes =
      (node.properties[`${propertyPath}_keyframes`] as any[]) || []
    const filteredKeyframes = keyframes.filter((k) => k.time !== time)

    // Update the keyframes
    node.properties = {
      ...node.properties,
      [`${propertyPath}_keyframes`]: filteredKeyframes,
    }

    this.nodes.set(nodeId, node)
    return true
  }

  async getKeyframes(nodeId: string, propertyPath: string): Promise<any[]> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      return []
    }

    const keyframes =
      (node.properties[`${propertyPath}_keyframes`] as any[]) || []
    return keyframes
  }

  async evaluate(time: Time): Promise<SceneState> {
    const sceneState: SceneState = {
      time,
      nodes: new Map(),
      globalProperties: {},
    }

    // TODO: Evaluate all root nodes when evaluateNode is implemented
    // for (const rootNode of this.rootNodes) {
    //   const nodeState = this.evaluateNode(rootNode, time)
    //   if (nodeState) {
    //     sceneState.nodes.set(rootNode.id, nodeState)
    //   }
    // }

    return Promise.resolve(sceneState)
  }

  async evaluateRange(
    startTime: Time,
    endTime: Time,
    step?: Time
  ): Promise<SceneState[]> {
    const states: SceneState[] = []
    const stepSize = step || 1000 // Default 1 second step

    for (let time = startTime; time <= endTime; time += stepSize) {
      const state = await this.evaluate(time)
      states.push(state)
    }

    return states
  }

  evaluateNode(node: BaseNode, time: Time): NodeState | null {
    // Evaluate node at specific time, applying keyframes and constraints
    const evaluatedProperties = { ...node.properties }
    const evaluatedTransform = {
      position: { x: 0, y: 0 },
      rotation: 0,
      scale: { x: 1, y: 1 },
      opacity: 1,
      anchorPoint: { x: 0, y: 0 },
    }

    // Apply keyframe interpolation for animated properties
    for (const [propertyPath, value] of Object.entries(evaluatedProperties)) {
      if (propertyPath.endsWith('_keyframes')) {
        const baseProperty = propertyPath.replace('_keyframes', '')
        const keyframes = value as any[]

        if (keyframes && keyframes.length > 0) {
          // Interpolate between keyframes
          const interpolatedValue = this.interpolateKeyframe(keyframes, time)
          evaluatedProperties[baseProperty] = interpolatedValue
        }
      }
    }

    return {
      nodeId: node.id,
      properties: evaluatedProperties,
      transform: evaluatedTransform,
      isVisible: true, // TODO: Implement visibility logic
      isSelected: false, // TODO: Implement selection logic
    }
  }

  private interpolateKeyframe(keyframes: any[], time: Time): any {
    if (keyframes.length === 0) return null
    if (keyframes.length === 1) return keyframes[0].value

    // Find the two keyframes to interpolate between
    let prevKeyframe = keyframes[0]
    let nextKeyframe = keyframes[0]

    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].time <= time) {
        prevKeyframe = keyframes[i]
      }
      if (
        keyframes[i].time >= time &&
        (!nextKeyframe || keyframes[i].time < nextKeyframe.time)
      ) {
        nextKeyframe = keyframes[i]
      }
    }

    // If we're before the first keyframe, return the first value
    if (time <= prevKeyframe.time) {
      return prevKeyframe.value
    }

    // If we're after the last keyframe, return the last value
    if (time >= nextKeyframe.time) {
      return nextKeyframe.value
    }

    // Interpolate between keyframes
    const t =
      (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time)
    return this.lerp(prevKeyframe.value, nextKeyframe.value, t)
  }

  private lerp(start: any, end: any, t: number): any {
    if (typeof start === 'number' && typeof end === 'number') {
      return start + (end - start) * t
    }

    if (
      typeof start === 'object' &&
      start !== null &&
      typeof end === 'object' &&
      end !== null
    ) {
      if ('x' in start && 'y' in end) {
        return {
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        }
      }
    }

    // Fallback to start value
    return start
  }
}
