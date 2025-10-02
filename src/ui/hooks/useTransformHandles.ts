/**
 * useTransformHandles - Custom hook for managing transform handle interactions
 * @author @darianrosebrook
 *
 * Handles:
 * - Transform handle state
 * - Corner and edge handle interactions
 * - Node transformation (scale/resize)
 * - Bounds updates
 */

import { useState, useCallback, useEffect } from 'react'
import { SceneNode, Point2D } from '@/types'

export interface TransformState {
  isTransforming: boolean
  handleType: string | null
  startPoint: Point2D | null
}

export interface UseTransformHandlesOptions {
  selectedLayers: SceneNode[]
  onLayerUpdate: (layerId: string, updates: Partial<SceneNode>) => void
}

export interface UseTransformHandlesReturn {
  transformState: TransformState
  setTransformState: React.Dispatch<React.SetStateAction<TransformState>>
  handleTransformHandleMouseDown: (
    e: React.MouseEvent,
    handleType: string
  ) => void
  handleTransformHandleMouseMove: (
    e: React.MouseEvent,
    selectedNodes: SceneNode[]
  ) => void
  handleTransformHandleMouseUp: () => void
}

/**
 * Custom hook for transform handle management
 *
 * @param options - Configuration options for transform handle behavior
 * @returns Transform state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   transformState,
 *   handleTransformHandleMouseDown,
 *   handleTransformHandleMouseMove,
 *   handleTransformHandleMouseUp
 * } = useTransformHandles({
 *   selectedLayers,
 *   onLayerUpdate
 * })
 * ```
 */
export function useTransformHandles({
  selectedLayers,
  onLayerUpdate,
}: UseTransformHandlesOptions): UseTransformHandlesReturn {
  const [transformState, setTransformState] = useState<TransformState>({
    isTransforming: false,
    handleType: null,
    startPoint: null,
  })

  // Transform handle mouse down
  const handleTransformHandleMouseDown = useCallback(
    (e: React.MouseEvent, handleType: string) => {
      e.stopPropagation()
      setTransformState({
        isTransforming: true,
        handleType,
        startPoint: { x: e.clientX, y: e.clientY },
      })
    },
    []
  )

  // Transform handle mouse move
  const handleTransformHandleMouseMove = useCallback(
    (e: React.MouseEvent, selectedNodes: SceneNode[]) => {
      if (!transformState.isTransforming || !transformState.startPoint) return

      const deltaX = e.clientX - transformState.startPoint.x
      const deltaY = e.clientY - transformState.startPoint.y

      // Apply transform to selected nodes
      selectedNodes.forEach((node) => {
        const currentBounds = node.bounds ?? {
          minX: 0,
          minY: 0,
          maxX: 100,
          maxY: 100,
        }
        let newBounds = { ...currentBounds }

        switch (transformState.handleType) {
          case 'corner top-left':
            newBounds = {
              minX: (currentBounds.minX ?? 0) + deltaX,
              minY: (currentBounds.minY ?? 0) + deltaY,
              maxX: currentBounds.maxX ?? 0,
              maxY: currentBounds.maxY ?? 0,
            }
            break
          case 'corner top-right':
            newBounds = {
              minX: currentBounds.minX ?? 0,
              minY: (currentBounds.minY ?? 0) + deltaY,
              maxX: (currentBounds.maxX ?? 0) + deltaX,
              maxY: currentBounds.maxY ?? 0,
            }
            break
          case 'corner bottom-left':
            newBounds = {
              minX: (currentBounds.minX ?? 0) + deltaX,
              minY: currentBounds.minY ?? 0,
              maxX: currentBounds.maxX ?? 0,
              maxY: (currentBounds.maxY ?? 0) + deltaY,
            }
            break
          case 'corner bottom-right':
            newBounds = {
              minX: currentBounds.minX ?? 0,
              minY: currentBounds.minY ?? 0,
              maxX: (currentBounds.maxX ?? 0) + deltaX,
              maxY: (currentBounds.maxY ?? 0) + deltaY,
            }
            break
          case 'edge top':
            newBounds = {
              minX: currentBounds.minX ?? 0,
              minY: (currentBounds.minY ?? 0) + deltaY,
              maxX: currentBounds.maxX ?? 0,
              maxY: currentBounds.maxY ?? 0,
            }
            break
          case 'edge bottom':
            newBounds = {
              minX: currentBounds.minX ?? 0,
              minY: currentBounds.minY ?? 0,
              maxX: currentBounds.maxX ?? 0,
              maxY: (currentBounds.maxY ?? 0) + deltaY,
            }
            break
          case 'edge left':
            newBounds = {
              minX: (currentBounds.minX ?? 0) + deltaX,
              minY: currentBounds.minY ?? 0,
              maxX: currentBounds.maxX ?? 0,
              maxY: currentBounds.maxY ?? 0,
            }
            break
          case 'edge right':
            newBounds = {
              minX: currentBounds.minX ?? 0,
              minY: currentBounds.minY ?? 0,
              maxX: (currentBounds.maxX ?? 0) + deltaX,
              maxY: currentBounds.maxY ?? 0,
            }
            break
        }

        onLayerUpdate(node.id, { bounds: newBounds })
      })

      setTransformState((prev) => ({
        ...prev,
        startPoint: { x: e.clientX, y: e.clientY },
      }))
    },
    [transformState, onLayerUpdate]
  )

  // Transform handle mouse up
  const handleTransformHandleMouseUp = useCallback(() => {
    setTransformState({
      isTransforming: false,
      handleType: null,
      startPoint: null,
    })
  }, [])

  // Add global transform event listeners
  useEffect(() => {
    if (transformState.isTransforming) {
      const handleMouseMove = (e: MouseEvent) => {
        const selectedNodes = selectedLayers.filter((layer) =>
          layer.id ? true : false
        )
        handleTransformHandleMouseMove(e as any, selectedNodes)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleTransformHandleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleTransformHandleMouseUp)
      }
    }
  }, [
    transformState.isTransforming,
    selectedLayers,
    handleTransformHandleMouseMove,
    handleTransformHandleMouseUp,
  ])

  return {
    transformState,
    setTransformState,
    handleTransformHandleMouseDown,
    handleTransformHandleMouseMove,
    handleTransformHandleMouseUp,
  }
}
