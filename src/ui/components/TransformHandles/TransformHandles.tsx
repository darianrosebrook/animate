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
  /** Keyboard handler for accessibility */
  onKeyDown?: (e: React.KeyboardEvent, handleType: string) => void
  /** Currently focused handle for keyboard navigation */
  focusedHandle?: string | null
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
  onKeyDown,
  focusedHandle = null,
}: TransformHandlesProps) {
  if (!unionBounds || !hasSelection) {
    return null
  }

  const width = unionBounds.maxX - unionBounds.minX
  const height = unionBounds.maxY - unionBounds.minY

  const createHandle = (
    type: string,
    position: string,
    style: React.CSSProperties,
    ariaLabel: string
  ) => (
    <div
      className={`transform-handle ${type} ${position} ${focusedHandle === `${type} ${position}` ? 'focused' : ''}`}
      style={style}
      onMouseDown={(e) => onHandleMouseDown(e, `${type} ${position}`)}
      onKeyDown={
        onKeyDown ? (e) => onKeyDown(e, `${type} ${position}`) : undefined
      }
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-describedby="transform-handles-description"
    />
  )

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
      role="group"
      aria-label="Transform handles for selected elements"
    >
      {/* Hidden description for screen readers */}
      <div id="transform-handles-description" className="sr-only">
        Use transform handles to resize or scale selected elements. Press arrow
        keys to adjust, Enter to confirm, Escape to cancel.
      </div>

      {/* Corner handles */}
      {createHandle(
        'corner',
        'top-left',
        { left: -4, top: -4 },
        'Top-left corner handle: Scale from top-left'
      )}
      {createHandle(
        'corner',
        'top-right',
        { right: -4, top: -4 },
        'Top-right corner handle: Scale from top-right'
      )}
      {createHandle(
        'corner',
        'bottom-left',
        { left: -4, bottom: -4 },
        'Bottom-left corner handle: Scale from bottom-left'
      )}
      {createHandle(
        'corner',
        'bottom-right',
        { right: -4, bottom: -4 },
        'Bottom-right corner handle: Scale from bottom-right'
      )}

      {/* Edge handles */}
      {createHandle(
        'edge',
        'top',
        { left: '50%', top: -4, transform: 'translateX(-50%)' },
        'Top edge handle: Resize vertically from top'
      )}
      {createHandle(
        'edge',
        'bottom',
        { left: '50%', bottom: -4, transform: 'translateX(-50%)' },
        'Bottom edge handle: Resize vertically from bottom'
      )}
      {createHandle(
        'edge',
        'left',
        { left: -4, top: '50%', transform: 'translateY(-50%)' },
        'Left edge handle: Resize horizontally from left'
      )}
      {createHandle(
        'edge',
        'right',
        { right: -4, top: '50%', transform: 'translateY(-50%)' },
        'Right edge handle: Resize horizontally from right'
      )}
    </div>
  )
}
