/**
 * usePenTool - Custom hook for managing pen tool state and path creation
 * @author @darianrosebrook
 *
 * Handles:
 * - Pen tool drawing state
 * - Path creation and editing
 * - Control point manipulation
 * - SVG path generation
 */

import { useState, useCallback } from 'react'
import { SceneNode, Point2D, NodeType, ToolType } from '@/types'
import { canvasToWorld } from '../canvas/selection-utils'

export interface PenToolState {
  isDrawing: boolean
  currentPath: Point2D[]
  previewPoint: Point2D | null
  isClosingPath: boolean
  editingPathId: string | null
  editingControlPoint: number | null
  isDraggingControlPoint: boolean
}

export interface UsePenToolOptions {
  scene: { layers: SceneNode[] } | null
  zoom: number
  pan: { x: number; y: number }
  activeTool: ToolType | null
  onLayerUpdate: (layerId: string, updates: Partial<SceneNode>) => void
}

export interface UsePenToolReturn {
  penToolState: PenToolState
  setPenToolState: React.Dispatch<React.SetStateAction<PenToolState>>
  handlePenToolDown: (e: React.MouseEvent, worldPos: Point2D) => void
  handlePenToolMove: (e: React.MouseEvent, canvasPos: Point2D) => void
  handlePenToolUp: (e: React.MouseEvent) => void
  handlePathClick: (e: React.MouseEvent, pathId: string) => void
  handleControlPointMouseDown: (
    e: React.MouseEvent,
    pathId: string,
    controlPointIndex: number
  ) => void
  handleControlPointMove: (e: React.MouseEvent, canvasPos: Point2D) => void
  handleControlPointUp: () => void
  generateSVGPathFromPoints: (points: Point2D[]) => string
  parsePathData: (pathData: string) => Point2D[]
}

/**
 * Generate SVG path string from array of points
 *
 * @param points - Array of 2D points
 * @returns SVG path data string
 */
function generateSVGPathFromPoints(points: Point2D[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) {
    // Simple line for two points
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let path = `M ${points[0].x} ${points[0].y}`

  // Create smooth curves using quadratic Bézier curves
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]

    // Calculate control point for smooth curve
    const controlX = current.x
    const controlY = current.y

    path += ` Q ${controlX} ${controlY} ${next.x} ${next.y}`
  }

  // Connect the last point
  const last = points[points.length - 1]
  path += ` L ${last.x} ${last.y}`

  return path
}

/**
 * Parse SVG path data string into array of points
 * Simplified parser for demo purposes
 *
 * @param pathData - SVG path data string
 * @returns Array of 2D points
 */
function parsePathData(_pathData: string): Point2D[] {
  // Simple parser for SVG path data
  // For now, just return an empty array - in a real implementation,
  // this would parse the path commands and extract point coordinates
  return []
}

/**
 * Find path node by ID in scene
 *
 * @param scene - Scene containing layers
 * @param pathId - Path node ID to find
 * @returns Found path node or null
 */
function findPathNodeById(
  scene: { layers: SceneNode[] } | null,
  pathId: string
): SceneNode | null {
  if (!scene) return null

  const findInNode = (node: SceneNode): SceneNode | null => {
    if (node.id === pathId) return node
    for (const child of node.children) {
      const found = findInNode(child)
      if (found) return found
    }
    return null
  }

  // Search through all layers
  for (const layer of scene.layers) {
    const found = findInNode(layer)
    if (found) return found
  }

  // Fallback: search first layer as root
  if (scene.layers.length > 0) {
    return findInNode(scene.layers[0])
  }

  return null
}

/**
 * Custom hook for pen tool management
 *
 * @param options - Configuration options for pen tool behavior
 * @returns Pen tool state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   penToolState,
 *   handlePenToolDown,
 *   handlePenToolMove,
 *   handlePenToolUp
 * } = usePenTool({
 *   scene,
 *   zoom,
 *   pan,
 *   activeTool,
 *   onLayerUpdate,
 *   setIsDraggingNode
 * })
 * ```
 */
export function usePenTool({
  scene,
  zoom,
  pan,
  activeTool,
  onLayerUpdate,
}: UsePenToolOptions): UsePenToolReturn {
  const [penToolState, setPenToolState] = useState<PenToolState>({
    isDrawing: false,
    currentPath: [],
    previewPoint: null,
    isClosingPath: false,
    editingPathId: null,
    editingControlPoint: null,
    isDraggingControlPoint: false,
  })

  // Pen tool down handler
  const handlePenToolDown = useCallback(
    (_e: React.MouseEvent, worldPos: Point2D) => {
      if (penToolState.isDrawing) {
        // Add point to existing path
        setPenToolState((prev) => ({
          ...prev,
          currentPath: [...prev.currentPath, worldPos],
          previewPoint: null,
          isClosingPath: false,
          editingPathId: null,
          editingControlPoint: null,
          isDraggingControlPoint: false,
        }))
      } else {
        // Start new path
        setPenToolState({
          isDrawing: true,
          currentPath: [worldPos],
          previewPoint: null,
          isClosingPath: false,
          editingPathId: null,
          editingControlPoint: null,
          isDraggingControlPoint: false,
        })
      }
    },
    [penToolState.isDrawing]
  )

  // Pen tool move handler
  const handlePenToolMove = useCallback(
    (_e: React.MouseEvent, canvasPos: Point2D) => {
      if (!penToolState.isDrawing) return

      const worldPos = canvasToWorld(canvasPos, zoom, pan)
      setPenToolState((prev) => ({
        ...prev,
        previewPoint: worldPos,
      }))
    },
    [penToolState.isDrawing, zoom, pan]
  )

  // Pen tool up handler
  const handlePenToolUp = useCallback(
    (_e: React.MouseEvent) => {
      if (!penToolState.isDrawing || penToolState.currentPath.length < 2) {
        // Finish drawing without creating a path
        setPenToolState({
          isDrawing: false,
          currentPath: [],
          previewPoint: null,
          isClosingPath: false,
          editingPathId: null,
          editingControlPoint: null,
          isDraggingControlPoint: false,
        })
        return
      }

      // Create path from points
      const pathData = generateSVGPathFromPoints(penToolState.currentPath)
      const newPathNode: SceneNode = {
        id: `path-${Date.now()}`,
        name: 'Path',
        type: NodeType.Path,
        properties: {
          pathData,
          fillColor: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
          strokeColor: { r: 0, g: 0, b: 0, a: 1 },
          strokeWidth: 2,
          fillRule: 'nonzero',
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          strokeMiterLimit: 4,
          position: { x: 0, y: 0 },
          scale: { x: 1, y: 1 },
          rotation: 0,
          visible: true,
          opacity: 1,
        },
        children: [],
      }

      // Add to scene
      if (scene) {
        scene.layers.push(newPathNode)
      }

      // Reset pen tool state
      setPenToolState({
        isDrawing: false,
        currentPath: [],
        previewPoint: null,
        isClosingPath: false,
        editingPathId: null,
        editingControlPoint: null,
        isDraggingControlPoint: false,
      })

      onLayerUpdate(newPathNode.id, {
        properties: {
          ...newPathNode.properties,
          pathData,
        },
      })
    },
    [penToolState, scene, onLayerUpdate]
  )

  // Path click handler for editing
  const handlePathClick = useCallback(
    (e: React.MouseEvent, pathId: string) => {
      if (activeTool !== ToolType.Pen) return

      e.stopPropagation()

      // Start editing this path
      setPenToolState((prev) => ({
        ...prev,
        editingPathId: pathId,
        isDrawing: false,
        currentPath: [], // Clear drawing state
      }))
    },
    [activeTool]
  )

  // Control point mouse down handler
  const handleControlPointMouseDown = useCallback(
    (e: React.MouseEvent, pathId: string, controlPointIndex: number) => {
      if (activeTool !== ToolType.Pen) return

      e.stopPropagation()

      setPenToolState((prev) => ({
        ...prev,
        editingPathId: pathId,
        editingControlPoint: controlPointIndex,
        isDraggingControlPoint: true,
      }))
    },
    [activeTool]
  )

  // Control point move handler
  const handleControlPointMove = useCallback(
    (_e: React.MouseEvent, canvasPos: Point2D) => {
      if (
        !penToolState.isDraggingControlPoint ||
        penToolState.editingPathId === null
      )
        return

      const worldPos = canvasToWorld(canvasPos, zoom, pan)

      // Update the control point position
      const pathNode = findPathNodeById(scene, penToolState.editingPathId)
      if (pathNode && pathNode.properties.pathData) {
        const pathDataValue = pathNode.properties.pathData
        if (typeof pathDataValue === 'string') {
          const updatedPoints = parsePathData(pathDataValue)
          if (
            penToolState.editingControlPoint !== null &&
            updatedPoints[penToolState.editingControlPoint]
          ) {
            updatedPoints[penToolState.editingControlPoint] = worldPos

            const newPathData = generateSVGPathFromPoints(updatedPoints)
            onLayerUpdate(pathNode.id, {
              properties: {
                ...pathNode.properties,
                pathData: newPathData,
              },
            })
          }
        }
      }
    },
    [penToolState, scene, zoom, pan, onLayerUpdate]
  )

  // Control point up handler
  const handleControlPointUp = useCallback(() => {
    setPenToolState((prev) => ({
      ...prev,
      editingControlPoint: null,
      isDraggingControlPoint: false,
    }))
  }, [])

  return {
    penToolState,
    setPenToolState,
    handlePenToolDown,
    handlePenToolMove,
    handlePenToolUp,
    handlePathClick,
    handleControlPointMouseDown,
    handleControlPointMove,
    handleControlPointUp,
    generateSVGPathFromPoints,
    parsePathData,
  }
}
