/**
 * SelectionBox - Visual component for drag selection rectangle and selection bounds
 * @author @darianrosebrook
 *
 * Displays:
 * - Drag selection box during selection
 * - Union bounds of selected nodes
 * - Visual feedback for selection state
 */

import React from 'react'
import { Rectangle } from '@/types'
import './SelectionBox.css'

export interface SelectionBoxProps {
  /** Drag selection rectangle (shown while dragging) */
  dragSelectionBox: Rectangle | null
  /** Union bounds of all selected nodes */
  unionBounds: Rectangle | null
  /** Whether selection is currently being dragged */
  isDragging: boolean
}

/**
 * SelectionBox component
 *
 * Renders the visual selection indicators on the canvas
 *
 * @param props - Selection box configuration
 * @returns React component
 *
 * @example
 * ```tsx
 * <SelectionBox
 *   dragSelectionBox={selectionState.dragSelectionBox}
 *   unionBounds={unionBounds}
 *   isDragging={selectionState.isDragging}
 * />
 * ```
 */
export function SelectionBox({
  dragSelectionBox,
  unionBounds,
  isDragging,
}: SelectionBoxProps) {
  return (
    <>
      {/* Selection bounding box for selected nodes */}
      {unionBounds && !isDragging && (
        <div
          className="selection-bounds"
          style={{
            position: 'absolute',
            left: unionBounds.minX,
            top: unionBounds.minY,
            width: unionBounds.maxX - unionBounds.minX,
            height: unionBounds.maxY - unionBounds.minY,
            border: '2px solid #007acc',
            backgroundColor: 'rgba(0, 122, 204, 0.1)',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      )}

      {/* Drag selection box shown while selecting */}
      {dragSelectionBox && isDragging && (
        <div
          className="drag-selection"
          style={{
            position: 'absolute',
            left: dragSelectionBox.minX,
            top: dragSelectionBox.minY,
            width: dragSelectionBox.maxX - dragSelectionBox.minX,
            height: dragSelectionBox.maxY - dragSelectionBox.minY,
            border: '2px dashed #007acc',
            backgroundColor: 'rgba(0, 122, 204, 0.1)',
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}
    </>
  )
}
