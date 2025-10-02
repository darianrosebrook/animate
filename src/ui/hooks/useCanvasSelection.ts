/**
 * useCanvasSelection - Custom hook for managing canvas selection state
 * @author @darianrosebrook
 *
 * Handles:
 * - Selection state management
 * - Single and multi-select operations
 * - Drag selection box
 * - Selection synchronization with parent component
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { SceneNode, Point2D } from '@/types'
import {
  CanvasSelectionState,
  hitTestNodes,
  calculateSelectionRectangle,
  findNodesInSelection,
  canvasToWorld,
} from '../canvas/selection-utils'

export interface UseCanvasSelectionOptions {
  selectedLayers: SceneNode[]
  scene: { layers: SceneNode[] } | null
  zoom: number
  pan: { x: number; y: number }
  onLayerSelect: (layerIds: string[]) => void
  onSelectionChange?: (selectedIds: Set<string>) => void
}

export interface UseCanvasSelectionReturn {
  selectionState: CanvasSelectionState
  setSelectionState: React.Dispatch<React.SetStateAction<CanvasSelectionState>>
  dragStartRef: React.MutableRefObject<{ x: number; y: number } | null>
  handleSelectToolDown: (e: React.MouseEvent, worldPos: Point2D) => void
  handleSelectToolMove: (e: React.MouseEvent, canvasPos: Point2D) => void
  handleSelectToolUp: () => void
  handleCanvasClick: (
    e: React.MouseEvent,
    containerRef: React.RefObject<HTMLDivElement>
  ) => void
  handleCanvasMouseDown: (
    e: React.MouseEvent,
    containerRef: React.RefObject<HTMLDivElement>
  ) => void
  handleCanvasMouseMove: (
    e: React.MouseEvent,
    containerRef: React.RefObject<HTMLDivElement>
  ) => void
  handleCanvasMouseUp: () => void
}

/**
 * Custom hook for canvas selection management
 *
 * @param options - Configuration options for selection behavior
 * @returns Selection state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   selectionState,
 *   handleSelectToolDown,
 *   handleSelectToolMove,
 *   handleSelectToolUp
 * } = useCanvasSelection({
 *   selectedLayers,
 *   scene,
 *   zoom,
 *   pan,
 *   onLayerSelect,
 *   onSelectionChange
 * })
 * ```
 */
export function useCanvasSelection({
  selectedLayers,
  scene,
  zoom,
  pan,
  onLayerSelect,
  onSelectionChange,
}: UseCanvasSelectionOptions): UseCanvasSelectionReturn {
  // Selection state
  const [selectionState, setSelectionState] = useState<CanvasSelectionState>({
    selectedNodeIds: new Set(selectedLayers.map((l) => l.id)),
    dragSelectionBox: null,
    isDragging: false,
    lastClickPosition: null,
    multiSelectMode: false,
  })

  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  // Sync selection state with props
  useEffect(() => {
    setSelectionState((prev) => ({
      ...prev,
      selectedNodeIds: new Set(selectedLayers.map((layer) => layer.id)),
    }))
  }, [selectedLayers])

  // Select tool handlers
  const handleSelectToolDown = useCallback(
    (e: React.MouseEvent, worldPos: Point2D) => {
      if (e.metaKey || e.ctrlKey) {
        // Multi-select mode - toggle selection
        const hitResult = hitTestNodes(worldPos, scene?.layers || [])
        if (hitResult.nodeId) {
          setSelectionState((prev) => {
            const newSelected = new Set(prev.selectedNodeIds)
            if (newSelected.has(hitResult.nodeId!)) {
              newSelected.delete(hitResult.nodeId!)
            } else {
              newSelected.add(hitResult.nodeId!)
            }
            return { ...prev, selectedNodeIds: newSelected }
          })
          const selectedIds = Array.from(selectionState.selectedNodeIds)
          if (selectedIds.includes(hitResult.nodeId)) {
            onLayerSelect(selectedIds.filter((id) => id !== hitResult.nodeId))
          } else {
            onLayerSelect([...selectedIds, hitResult.nodeId])
          }
        }
      } else {
        // Start drag selection
        setSelectionState((prev) => ({
          ...prev,
          dragSelectionBox: {
            minX: worldPos.x,
            minY: worldPos.y,
            maxX: worldPos.x,
            maxY: worldPos.y,
          },
          isDragging: true,
        }))
      }
    },
    [scene, selectionState, onLayerSelect]
  )

  const handleSelectToolMove = useCallback(
    (_e: React.MouseEvent, canvasPos: Point2D) => {
      if (selectionState.dragSelectionBox) {
        const worldPos = canvasToWorld(canvasPos, zoom, pan)
        const startBox = selectionState.dragSelectionBox

        setSelectionState((prev) => ({
          ...prev,
          dragSelectionBox: {
            minX: Math.min(startBox.minX, worldPos.x),
            minY: Math.min(startBox.minY, worldPos.y),
            maxX: Math.max(startBox.minX, worldPos.x),
            maxY: Math.max(startBox.minY, worldPos.y),
          },
        }))
      }
    },
    [selectionState.dragSelectionBox, zoom, pan]
  )

  const handleSelectToolUp = useCallback(() => {
    if (selectionState.dragSelectionBox && scene?.layers) {
      // Find nodes in selection box
      const selectedIds = findNodesInSelection(
        scene.layers,
        selectionState.dragSelectionBox
      )

      setSelectionState((prev) => ({
        ...prev,
        selectedNodeIds: new Set(selectedIds),
        dragSelectionBox: null,
        isDragging: false,
      }))

      onLayerSelect(selectedIds)
    }
  }, [scene, selectionState.dragSelectionBox, onLayerSelect])

  // Canvas click handler for direct selection
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent, containerRef: React.RefObject<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const canvasPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      const worldPoint = canvasToWorld(canvasPoint, zoom, pan)

      if (!scene?.rootNode) return

      const hitResult = hitTestNodes(worldPoint, scene?.layers || [])

      if (hitResult.nodeId) {
        const newSelectedIds = new Set(selectionState.selectedNodeIds)

        if (e.shiftKey) {
          // Multi-select mode
          if (newSelectedIds.has(hitResult.nodeId)) {
            newSelectedIds.delete(hitResult.nodeId)
          } else {
            newSelectedIds.add(hitResult.nodeId)
          }
        } else {
          // Single select
          newSelectedIds.clear()
          newSelectedIds.add(hitResult.nodeId)
        }

        setSelectionState((prev) => ({
          ...prev,
          selectedNodeIds: newSelectedIds,
          lastClickPosition: canvasPoint,
        }))

        onLayerSelect(Array.from(newSelectedIds))
        onSelectionChange?.(newSelectedIds)
      } else if (!e.shiftKey) {
        // Clear selection if clicking empty space (not in multi-select mode)
        setSelectionState((prev) => ({
          ...prev,
          selectedNodeIds: new Set(),
          lastClickPosition: canvasPoint,
        }))
        onLayerSelect([])
        onSelectionChange?.(new Set())
      }
    },
    [
      scene,
      zoom,
      pan,
      selectionState.selectedNodeIds,
      onLayerSelect,
      onSelectionChange,
    ]
  )

  // Canvas mouse down handler for drag selection
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent, containerRef: React.RefObject<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const canvasPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      // Start drag selection if not clicking on a node
      if (!scene?.rootNode) return

      const worldPoint = canvasToWorld(canvasPoint, zoom, pan)
      const hitResult = hitTestNodes(worldPoint, scene?.layers || [])

      if (!hitResult.nodeId && !e.shiftKey) {
        // Start drag selection
        dragStartRef.current = canvasPoint
        setSelectionState((prev) => ({
          ...prev,
          isDragging: true,
        }))
      }
    },
    [scene, zoom, pan]
  )

  // Canvas mouse move handler for drag selection rectangle
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent, containerRef: React.RefObject<HTMLDivElement>) => {
      if (!selectionState.isDragging || !dragStartRef.current) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const currentPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      const selectionRect = calculateSelectionRectangle(
        dragStartRef.current,
        currentPoint
      )

      setSelectionState((prev) => ({
        ...prev,
        dragSelectionBox: selectionRect,
      }))
    },
    [selectionState.isDragging]
  )

  // Canvas mouse up handler to complete drag selection
  const handleCanvasMouseUp = useCallback(() => {
    if (!selectionState.isDragging || !dragStartRef.current) return

    const rect = dragStartRef.current
    if (!rect) return

    // Find nodes within selection rectangle
    if (scene?.rootNode && selectionState.dragSelectionBox) {
      const selectedIds = findNodesInSelection(
        scene.layers,
        selectionState.dragSelectionBox
      )

      const newSelectedIds = new Set(selectedIds)

      setSelectionState((prev) => ({
        ...prev,
        selectedNodeIds: newSelectedIds,
        isDragging: false,
        dragSelectionBox: null,
      }))

      onLayerSelect(Array.from(newSelectedIds))
      onSelectionChange?.(newSelectedIds)
    }

    dragStartRef.current = null
  }, [
    selectionState.isDragging,
    selectionState.dragSelectionBox,
    scene,
    onLayerSelect,
    onSelectionChange,
  ])

  return {
    selectionState,
    setSelectionState,
    dragStartRef,
    handleSelectToolDown,
    handleSelectToolMove,
    handleSelectToolUp,
    handleCanvasClick,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  }
}
