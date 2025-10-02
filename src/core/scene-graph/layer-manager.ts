/**
 * @fileoverview Advanced Layer Management System
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { logger } from '@/core/logging/logger'
import {
  SceneNode,
  Transform,
  BlendMode,
  LayerMask,
  LayerConstraint,
  LayerGroup,
  LayerHierarchy,
  LayerOperation,
  LayerValidation,
} from './scene-graph-types'

/**
 * Advanced layer management system with grouping, masking, and blending
 */
export class LayerManager {
  private sceneGraph: any // SceneGraph instance
  private layerHierarchy: Map<string, LayerHierarchy> = new Map()
  private layerGroups: Map<string, LayerGroup> = new Map()
  private activeMasks: Map<string, LayerMask[]> = new Map()
  private blendModes: Map<string, BlendMode> = new Map()

  constructor(sceneGraph: any) {
    this.sceneGraph = sceneGraph
  }

  /**
   * Create a new layer group
   */
  async createGroup(
    name: string,
    layerIds: string[],
    options: {
      collapsed?: boolean
      transformShared?: boolean
      blendMode?: BlendMode
      parentId?: string
    } = {}
  ): Promise<Result<LayerGroup>> {
    try {
      logger.info(`📁 Creating layer group: ${name}`)

      // Validate that all layers exist
      const layers = layerIds
        .map((id) => this.sceneGraph.getNode(id))
        .filter(Boolean)
      if (layers.length !== layerIds.length) {
        return {
          success: false,
          error: {
            code: 'INVALID_LAYER_IDS',
            message: 'Some layer IDs do not exist',
          },
        }
      }

      // Create group node
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const groupNode = await this.sceneGraph.createNode({
        type: 'group',
        name,
        children: layerIds,
        transform: {
          position: { x: 0, y: 0 },
          rotation: 0,
          scale: { x: 1, y: 1 },
          opacity: 1,
        },
        blendMode: options.blendMode || 'normal',
        collapsed: options.collapsed || false,
        transformShared: options.transformShared || true,
      })

      if (!groupNode.success) {
        return groupNode
      }

      const group: LayerGroup = {
        id: groupId,
        name,
        layerIds,
        nodeId: groupNode.data.id,
        collapsed: options.collapsed || false,
        transformShared: options.transformShared || true,
        blendMode: options.blendMode || 'normal',
        parentId: options.parentId,
        createdAt: new Date(),
        lastModified: new Date(),
      }

      this.layerGroups.set(groupId, group)

      // Update layer hierarchy
      await this.updateLayerHierarchy(groupId, layerIds)

      // Apply group transform if shared
      if (group.transformShared) {
        await this.applyGroupTransform(groupId)
      }

      logger.info(`✅ Layer group created: ${name} (${groupId})`)
      return { success: true, data: group }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GROUP_CREATION_ERROR',
          message: `Failed to create layer group: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Add a mask to a layer
   */
  async addMask(
    layerId: string,
    maskType: 'shape' | 'luminance' | 'alpha',
    maskData: {
      path?: { x: number; y: number }[]
      feather?: number
      opacity?: number
      inverted?: boolean
      expansion?: number
    }
  ): Promise<Result<LayerMask>> {
    try {
      logger.info(`🎭 Adding mask to layer: ${layerId}`)

      const layer = this.sceneGraph.getNode(layerId)
      if (!layer) {
        return {
          success: false,
          error: {
            code: 'LAYER_NOT_FOUND',
            message: `Layer ${layerId} not found`,
          },
        }
      }

      const maskId = `mask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const mask: LayerMask = {
        id: maskId,
        type: maskType,
        path: maskData.path || [],
        feather: maskData.feather || 0,
        opacity: maskData.opacity || 1,
        inverted: maskData.inverted || false,
        expansion: maskData.expansion || 0,
        enabled: true,
        createdAt: new Date(),
      }

      // Add mask to layer
      if (!layer.data.masks) {
        layer.data.masks = []
      }
      layer.data.masks.push(mask)

      // Update active masks
      if (!this.activeMasks.has(layerId)) {
        this.activeMasks.set(layerId, [])
      }
      this.activeMasks.get(layerId)!.push(mask)

      // Update scene graph
      await this.sceneGraph.updateNode(layerId, { masks: layer.data.masks })

      logger.info(`✅ Mask added to layer: ${layerId} (${maskId})`)
      return { success: true, data: mask }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MASK_CREATION_ERROR',
          message: `Failed to add mask: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Set blending mode for a layer
   */
  async setBlendMode(
    layerId: string,
    blendMode: BlendMode
  ): Promise<Result<boolean>> {
    try {
      logger.info(`🎨 Setting blend mode for layer: ${layerId} = ${blendMode}`)

      const layer = this.sceneGraph.getNode(layerId)
      if (!layer) {
        return {
          success: false,
          error: {
            code: 'LAYER_NOT_FOUND',
            message: `Layer ${layerId} not found`,
          },
        }
      }

      // Update blend mode
      layer.data.blendMode = blendMode
      this.blendModes.set(layerId, blendMode)

      // Update scene graph
      await this.sceneGraph.updateNode(layerId, { blendMode })

      logger.info(`✅ Blend mode set: ${layerId} = ${blendMode}`)
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BLEND_MODE_ERROR',
          message: `Failed to set blend mode: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Add a constraint to a layer
   */
  async addConstraint(
    layerId: string,
    constraint: {
      type: 'position' | 'scale' | 'rotation' | 'distance' | 'angle'
      targetId: string
      offset?: { x: number; y: number; z: number }
      influence?: number
    }
  ): Promise<Result<LayerConstraint>> {
    try {
      logger.info(`🔗 Adding constraint to layer: ${layerId}`)

      const layer = this.sceneGraph.getNode(layerId)
      if (!layer) {
        return {
          success: false,
          error: {
            code: 'LAYER_NOT_FOUND',
            message: `Layer ${layerId} not found`,
          },
        }
      }

      // Validate target exists
      const target = this.sceneGraph.getNode(constraint.targetId)
      if (!target) {
        return {
          success: false,
          error: {
            code: 'TARGET_NOT_FOUND',
            message: `Target layer ${constraint.targetId} not found`,
          },
        }
      }

      const constraintId = `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const layerConstraint: LayerConstraint = {
        id: constraintId,
        type: constraint.type,
        targetId: constraint.targetId,
        offset: constraint.offset || { x: 0, y: 0, z: 0 },
        influence: constraint.influence || 1.0,
        enabled: true,
        createdAt: new Date(),
      }

      // Add constraint to layer
      if (!layer.data.constraints) {
        layer.data.constraints = []
      }
      layer.data.constraints.push(layerConstraint)

      // Update scene graph
      await this.sceneGraph.updateNode(layerId, {
        constraints: layer.data.constraints,
      })

      logger.info(`✅ Constraint added: ${layerId} -> ${constraint.targetId}`)
      return { success: true, data: layerConstraint }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONSTRAINT_ERROR',
          message: `Failed to add constraint: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Move layers within the hierarchy
   */
  async moveLayers(
    layerIds: string[],
    targetParentId?: string,
    insertBefore?: string
  ): Promise<Result<boolean>> {
    try {
      logger.info(`📦 Moving layers: ${layerIds.join(', ')}`)

      for (const layerId of layerIds) {
        const layer = this.sceneGraph.getNode(layerId)
        if (!layer) {
          logger.warn(`Layer ${layerId} not found, skipping`)
          continue
        }

        // Update parent-child relationships
        if (targetParentId) {
          // Move to new parent
          await this.sceneGraph.moveNode(layerId, targetParentId, insertBefore)
        } else if (insertBefore) {
          // Reorder within current parent
          await this.sceneGraph.reorderNode(layerId, insertBefore)
        }

        // Update hierarchy tracking
        await this.updateLayerHierarchyAfterMove(layerId)
      }

      logger.info(`✅ Layers moved successfully`)
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOVE_ERROR',
          message: `Failed to move layers: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Validate layer hierarchy for consistency
   */
  async validateHierarchy(): Promise<Result<LayerValidation>> {
    try {
      logger.info('🔍 Validating layer hierarchy...')

      const issues: string[] = []
      const circularRefs: string[] = []
      const orphanedLayers: string[] = []

      // Check for circular references
      for (const [groupId, group] of this.layerGroups) {
        if (this.hasCircularReference(groupId, new Set())) {
          circularRefs.push(groupId)
        }
      }

      // Check for orphaned layers
      for (const layerId of this.sceneGraph.getAllNodeIds()) {
        const layer = this.sceneGraph.getNode(layerId)
        if (layer && !layer.data.parentId && layer.data.type !== 'root') {
          orphanedLayers.push(layerId)
        }
      }

      // Check mask validity
      for (const [layerId, masks] of this.activeMasks) {
        for (const mask of masks) {
          if (mask.path && mask.path.length < 3) {
            issues.push(`Invalid mask path on layer ${layerId}`)
          }
        }
      }

      // Check constraint validity
      for (const layerId of this.sceneGraph.getAllNodeIds()) {
        const layer = this.sceneGraph.getNode(layerId)
        if (layer?.data.constraints) {
          for (const constraint of layer.data.constraints) {
            if (!this.sceneGraph.getNode(constraint.targetId)) {
              issues.push(`Invalid constraint target on layer ${layerId}`)
            }
          }
        }
      }

      const validation: LayerValidation = {
        valid: issues.length === 0 && circularRefs.length === 0,
        issues,
        circularReferences: circularRefs,
        orphanedLayers,
        warnings: [],
      }

      logger.info(
        `✅ Hierarchy validation complete: ${validation.valid ? 'VALID' : 'INVALID'}`
      )
      return { success: true, data: validation }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Failed to validate hierarchy: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get layer hierarchy information
   */
  getLayerHierarchy(layerId?: string): LayerHierarchy[] {
    if (layerId) {
      return this.layerHierarchy.get(layerId)
        ? [this.layerHierarchy.get(layerId)!]
        : []
    }
    return Array.from(this.layerHierarchy.values())
  }

  /**
   * Get layer group information
   */
  getLayerGroup(groupId: string): LayerGroup | null {
    return this.layerGroups.get(groupId) || null
  }

  /**
   * Get active masks for a layer
   */
  getLayerMasks(layerId: string): LayerMask[] {
    return this.activeMasks.get(layerId) || []
  }

  /**
   * Get blend mode for a layer
   */
  getLayerBlendMode(layerId: string): BlendMode {
    return this.blendModes.get(layerId) || 'normal'
  }

  private async updateLayerHierarchy(
    groupId: string,
    layerIds: string[]
  ): Promise<void> {
    const hierarchy: LayerHierarchy = {
      groupId,
      layerIds,
      depth: this.calculateHierarchyDepth(groupId),
      children: [],
      parentId: null,
    }

    this.layerHierarchy.set(groupId, hierarchy)

    // Update child hierarchies
    for (const layerId of layerIds) {
      if (this.layerGroups.has(layerId)) {
        hierarchy.children.push(layerId)
      }
    }
  }

  private async updateLayerHierarchyAfterMove(layerId: string): Promise<void> {
    // Recalculate hierarchy for moved layer and its descendants
    const affectedGroups = this.findAffectedGroups(layerId)
    for (const groupId of affectedGroups) {
      const group = this.layerGroups.get(groupId)
      if (group) {
        await this.updateLayerHierarchy(groupId, group.layerIds)
      }
    }
  }

  private calculateHierarchyDepth(groupId: string): number {
    let depth = 0
    let currentId = groupId

    while (currentId) {
      const group = this.layerGroups.get(currentId)
      if (!group?.parentId) break

      depth++
      currentId = group.parentId
    }

    return depth
  }

  private hasCircularReference(groupId: string, visited: Set<string>): boolean {
    if (visited.has(groupId)) {
      return true
    }

    visited.add(groupId)
    const group = this.layerGroups.get(groupId)

    if (group?.parentId) {
      return this.hasCircularReference(group.parentId, new Set(visited))
    }

    return false
  }

  private findAffectedGroups(layerId: string): string[] {
    const affected: string[] = []

    for (const [groupId, group] of this.layerGroups) {
      if (group.layerIds.includes(layerId)) {
        affected.push(groupId)
      }
    }

    return affected
  }

  private async applyGroupTransform(groupId: string): Promise<void> {
    const group = this.layerGroups.get(groupId)
    if (!group) return

    const groupNode = this.sceneGraph.getNode(group.nodeId)
    if (!groupNode) return

    // Apply group transform to all child layers
    for (const layerId of group.layerIds) {
      const layer = this.sceneGraph.getNode(layerId)
      if (layer) {
        // Combine group transform with layer transform
        const combinedTransform = this.combineTransforms(
          groupNode.data.transform,
          layer.data.transform
        )

        await this.sceneGraph.updateNode(layerId, {
          transform: combinedTransform,
        })
      }
    }
  }

  private combineTransforms(
    parentTransform: Transform,
    childTransform: Transform
  ): Transform {
    // Apply parent transform to child transform
    const combinedPosition = {
      x:
        parentTransform.position.x +
        childTransform.position.x * parentTransform.scale.x,
      y:
        parentTransform.position.y +
        childTransform.position.y * parentTransform.scale.y,
    }

    const combinedScale = {
      x: parentTransform.scale.x * childTransform.scale.x,
      y: parentTransform.scale.y * childTransform.scale.y,
    }

    const combinedRotation = parentTransform.rotation + childTransform.rotation
    const combinedOpacity = parentTransform.opacity * childTransform.opacity

    return {
      position: combinedPosition,
      rotation: combinedRotation,
      scale: combinedScale,
      opacity: combinedOpacity,
    }
  }

  /**
   * Destroy layer manager and clean up resources
   */
  destroy(): void {
    this.layerHierarchy.clear()
    this.layerGroups.clear()
    this.activeMasks.clear()
    this.blendModes.clear()

    logger.info('🧹 Layer manager destroyed')
  }
}
