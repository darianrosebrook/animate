/**
 * TransformHandles - Visual component for transform handles on selected nodes
 * @author @darianrosebrook
 *
 * Displays:
 * - Corner handles for scaling
 * - Edge handles for resizing
 * - Interactive handle elements
 */

import React from 'react'
import { Rectangle } from '@/types'
import './TransformHandles.css'

export interface TransformHandlesProps {
  /** Union bounds of selected nodes */
  unionBounds: Rectangle | null
  /** Whether any nodes are selected */
  hasSelection: boolean
  /** Mouse down handler for transform handles */
  onHandleMouseDown: (e: React.MouseEvent, handleType: string) => void
}

/**
 * TransformHandles component
 *
 * Renders interactive handles for transforming selected nodes
 *
 * @param props - Transform handles configuration
 * @returns React component
 *
 * @example
 * ```tsx
 * <TransformHandles
 *   unionBounds={unionBounds}
 *   hasSelection={selectedNodes.length > 0}
 *   onHandleMouseDown={handleTransformHandleMouseDown}
 * />
 * ```
 */
export function TransformHandles({
  unionBounds,
  hasSelection,
  onHandleMouseDown,
}: TransformHandlesProps) {
  if (!unionBounds || !hasSelection) {
    return null
  }

  const width = unionBounds.maxX - unionBounds.minX
  const height = unionBounds.maxY - unionBounds.minY

  return (
    <div
      className="transform-handles"
      style={{
        position: 'absolute',
        left: unionBounds.minX,
        top: unionBounds.minY,
        width,
        height,
        pointerEvents: 'none',
        zIndex: 1001,
      }}
    >
      {/* Corner handles */}
      <div
        className="transform-handle corner top-left"
        style={{ left: -4, top: -4 }}
        onMouseDown={(e) => onHandleMouseDown(e, 'corner top-left')}
      />
      <div
        className="transform-handle corner top-right"
        style={{ right: -4, top: -4 }}
        onMouseDown={(e) => onHandleMouseDown(e, 'corner top-right')}
      />
      <div
        className="transform-handle corner bottom-left"
        style={{ left: -4, bottom: -4 }}
        onMouseDown={(e) => onHandleMouseDown(e, 'corner bottom-left')}
      />
      <div
        className="transform-handle corner bottom-right"
        style={{ right: -4, bottom: -4 }}
        onMouseDown={(e) => onHandleMouseDown(e, 'corner bottom-right')}
      />

      {/* Edge handles */}
      <div
        className="transform-handle edge top"
        style={{ left: '50%', top: -4, transform: 'translateX(-50%)' }}
        onMouseDown={(e) => onHandleMouseDown(e, 'edge top')}
      />
      <div
        className="transform-handle edge bottom"
        style={{ left: '50%', bottom: -4, transform: 'translateX(-50%)' }}
        onMouseDown={(e) => onHandleMouseDown(e, 'edge bottom')}
      />
      <div
        className="transform-handle edge left"
        style={{ left: -4, top: '50%', transform: 'translateY(-50%)' }}
        onMouseDown={(e) => onHandleMouseDown(e, 'edge left')}
      />
      <div
        className="transform-handle edge right"
        style={{ right: -4, top: '50%', transform: 'translateY(-50%)' }}
        onMouseDown={(e) => onHandleMouseDown(e, 'edge right')}
      />
    </div>
  )
}
