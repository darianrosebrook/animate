/**
 * @fileoverview Canvas Selection Utilities
 * @author @darianrosebrook
 */

import { SceneNode, Point2D, Rectangle } from '@/types'

/**
 * Selection state for canvas interactions
 */
export interface CanvasSelectionState {
  selectedNodeIds: Set<string>
  dragSelectionBox: Rectangle | null
  isDragging: boolean
  lastClickPosition: Point2D | null
  multiSelectMode: boolean
}

/**
 * Hit test result for canvas objects
 */
export interface HitTestResult {
  nodeId: string | null
  hitPoint: Point2D
  distance: number
  isInside: boolean
}

/**
 * Calculate bounding box for a scene node
 */
export function calculateNodeBounds(node: SceneNode): Rectangle {
  const bounds = node.bounds || { minX: 0, minY: 0, maxX: 100, maxY: 100 }

  return {
    minX: bounds.minX,
    minY: bounds.minY,
    maxX: bounds.maxX,
    maxY: bounds.maxY,
  }
}

/**
 * Calculate union bounding box for multiple nodes
 */
export function calculateUnionBounds(nodes: SceneNode[]): Rectangle | null {
  if (nodes.length === 0) return null

  const bounds = nodes.map(calculateNodeBounds)
  const minX = Math.min(...bounds.map((b) => b.minX))
  const minY = Math.min(...bounds.map((b) => b.minY))
  const maxX = Math.max(...bounds.map((b) => b.maxX))
  const maxY = Math.max(...bounds.map((b) => b.maxY))

  return {
    minX,
    minY,
    maxX,
    maxY,
  }
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRectangle(point: Point2D, rect: Rectangle): boolean {
  return (
    point.x >= rect.minX &&
    point.x <= rect.maxX &&
    point.y >= rect.minY &&
    point.y <= rect.maxY
  )
}

/**
 * Check if two rectangles intersect
 */
export function rectanglesIntersect(a: Rectangle, b: Rectangle): boolean {
  return !(
    a.maxX < b.minX ||
    b.maxX < a.minX ||
    a.maxY < b.minY ||
    b.maxY < a.minY
  )
}

/**
 * Calculate distance from point to rectangle
 */
export function distanceToRectangle(point: Point2D, rect: Rectangle): number {
  const dx = Math.max(rect.minX - point.x, 0, point.x - rect.maxX)
  const dy = Math.max(rect.minY - point.y, 0, point.y - rect.maxY)
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Hit test a single node
 */
export function hitTestNode(point: Point2D, node: SceneNode): HitTestResult {
  const bounds = calculateNodeBounds(node)

  // Check if point is inside bounds
  const isInside = pointInRectangle(point, bounds)

  // Calculate distance (for edge cases)
  const distance = isInside ? 0 : distanceToRectangle(point, bounds)

  return {
    nodeId: node.id,
    hitPoint: point,
    distance,
    isInside,
  }
}

/**
 * Hit test multiple nodes and return closest hit
 */
export function hitTestNodes(
  point: Point2D,
  nodes: SceneNode[]
): HitTestResult {
  let bestResult: HitTestResult | null = null

  for (const node of nodes) {
    const result = hitTestNode(point, node)

    // Prefer inside hits over outside hits
    if (result.isInside) {
      return result
    }

    // For outside hits, choose the closest
    if (!bestResult || result.distance < bestResult.distance) {
      bestResult = result
    }
  }

  return (
    bestResult || {
      nodeId: null,
      hitPoint: point,
      distance: Infinity,
      isInside: false,
    }
  )
}

/**
 * Calculate selection rectangle from drag start/end points
 */
export function calculateSelectionRectangle(
  start: Point2D,
  end: Point2D
): Rectangle {
  const minX = Math.min(start.x, end.x)
  const minY = Math.min(start.y, end.y)
  const maxX = Math.max(start.x, end.x)
  const maxY = Math.max(start.y, end.y)

  return { minX, minY, maxX, maxY }
}

/**
 * Find nodes within a selection rectangle
 */
export function findNodesInSelection(
  nodes: SceneNode[],
  selectionRect: Rectangle
): string[] {
  return nodes
    .filter((node) => {
      const nodeBounds = calculateNodeBounds(node)
      return rectanglesIntersect(selectionRect, nodeBounds)
    })
    .map((node) => node.id)
}

/**
 * Transform canvas coordinates to world coordinates
 */
export function canvasToWorld(
  canvasPoint: Point2D,
  zoom: number,
  pan: Point2D
): Point2D {
  return {
    x: (canvasPoint.x - pan.x) / zoom,
    y: (canvasPoint.y - pan.y) / zoom,
  }
}

/**
 * Transform world coordinates to canvas coordinates
 */
export function worldToCanvas(
  worldPoint: Point2D,
  zoom: number,
  pan: Point2D
): Point2D {
  return {
    x: worldPoint.x * zoom + pan.x,
    y: worldPoint.y * zoom + pan.y,
  }
}
