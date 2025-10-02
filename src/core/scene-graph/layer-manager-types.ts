/**
 * @fileoverview Layer Management System Types
 * @author @darianrosebrook
 */

import { BlendMode } from './scene-graph-types'

/**
 * Layer mask definition
 */
export interface LayerMask {
  id: string
  type: 'shape' | 'luminance' | 'alpha'
  path?: { x: number; y: number }[]
  feather: number
  opacity: number
  inverted: boolean
  expansion: number
  enabled: boolean
  createdAt: Date
}

/**
 * Layer constraint definition
 */
export interface LayerConstraint {
  id: string
  type: 'position' | 'scale' | 'rotation' | 'distance' | 'angle'
  targetId: string
  offset: { x: number; y: number; z: number }
  influence: number
  enabled: boolean
  createdAt: Date
}

/**
 * Layer group definition
 */
export interface LayerGroup {
  id: string
  name: string
  layerIds: string[]
  nodeId: string
  collapsed: boolean
  transformShared: boolean
  blendMode: BlendMode
  parentId?: string
  createdAt: Date
  lastModified: Date
}

/**
 * Layer hierarchy information
 */
export interface LayerHierarchy {
  groupId: string
  layerIds: string[]
  depth: number
  children: string[]
  parentId?: string
}

/**
 * Layer operation result
 */
export interface LayerOperation {
  success: boolean
  operation: 'create' | 'update' | 'delete' | 'move' | 'group' | 'ungroup'
  layerId: string
  groupId?: string
  timestamp: Date
  changes: Record<string, any>
}

/**
 * Layer validation result
 */
export interface LayerValidation {
  valid: boolean
  issues: string[]
  circularReferences: string[]
  orphanedLayers: string[]
  warnings: string[]
}

/**
 * Mask mode enumeration
 */
export enum MaskMode {
  Add = 'add',
  Subtract = 'subtract',
  Intersect = 'intersect',
  Difference = 'difference',
  None = 'none',
}

/**
 * Layer visibility state
 */
export interface LayerVisibility {
  layerId: string
  visible: boolean
  locked: boolean
  solo: boolean
  shy: boolean
}

/**
 * Layer selection state
 */
export interface LayerSelection {
  selectedLayerIds: string[]
  activeLayerId?: string
  selectionBounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * Layer transform constraint
 */
export interface TransformConstraint {
  type: 'min' | 'max' | 'expression'
  property: 'x' | 'y' | 'rotation' | 'scaleX' | 'scaleY' | 'opacity'
  value?: number
  expression?: string
  enabled: boolean
}

/**
 * Layer parenting relationship
 */
export interface LayerParenting {
  childId: string
  parentId: string
  inheritance: {
    transform: boolean
    opacity: boolean
    effects: boolean
    masks: boolean
  }
}

/**
 * Advanced layer properties
 */
export interface AdvancedLayerProperties {
  layerId: string
  quality: 'draft' | 'normal' | 'best'
  motionBlur: {
    enabled: boolean
    samples: number
    shutterAngle: number
  }
  timeRemapping: {
    enabled: boolean
    expression?: string
  }
  expressions: Record<string, string>
  guides: {
    enabled: boolean
    showRulers: boolean
    showGrid: boolean
    snapToGrid: boolean
  }
}

/**
 * Layer compositing options
 */
export interface LayerCompositing {
  layerId: string
  trackMatte?: {
    type: 'alpha' | 'luminance'
    targetId: string
  }
  stencil?: {
    enabled: boolean
    operation: 'keep' | 'zero' | 'replace' | 'incr' | 'decr' | 'invert'
    reference: number
    mask: number
  }
  preserveTransparency: boolean
  collapseTransform: boolean
}

/**
 * Layer animation state
 */
export interface LayerAnimationState {
  layerId: string
  currentTime: number
  isPlaying: boolean
  playbackSpeed: number
  loop: boolean
  workAreaStart?: number
  workAreaEnd?: number
}

/**
 * Layer management event types
 */
export enum LayerEventType {
  Created = 'layer:created',
  Updated = 'layer:updated',
  Deleted = 'layer:deleted',
  Moved = 'layer:moved',
  Grouped = 'layer:grouped',
  Ungrouped = 'layer:ungrouped',
  Masked = 'layer:masked',
  Blended = 'layer:blended',
  Constrained = 'layer:constrained',
}

/**
 * Layer management event
 */
export interface LayerEvent {
  type: LayerEventType
  layerId: string
  groupId?: string
  timestamp: Date
  data: Record<string, any>
  userId?: string
}

/**
 * Layer management statistics
 */
export interface LayerStatistics {
  totalLayers: number
  groupsCount: number
  maskedLayers: number
  constrainedLayers: number
  averageHierarchyDepth: number
  performanceMetrics: {
    renderTime: number
    memoryUsage: number
    operationLatency: number
  }
}
