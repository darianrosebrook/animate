import React, { useState, useRef, useCallback } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  Edit3,
  Plus,
} from 'lucide-react'
import {
  TimelineKeyframe,
  TimelineTrack as TimelineTrackType,
  TimelineState,
} from './TimelinePanel'
import { ContextMenu, ContextMenuItem } from '@/ui/components/ContextMenu'
import './TimelineTrack.css'
import { logger } from '@/core/logging/logger'

export interface TimelineTrackProps {
  track: TimelineTrackType
  timeline: TimelineState
  timeToPixel: (time: number) => number
  containerWidth: number
  onTrackToggle: (enabled: boolean) => void
  onTrackExpand: (expanded: boolean) => void
  onKeyframeSelect: (keyframeIds: string[]) => void
  onKeyframeMove: (keyframeId: string, newTime: number) => void
  onKeyframeAdd: (time: number, value: any) => void
  onKeyframeDelete: (keyframeIds: string[]) => void
  onCurveEditorOpen?: (trackId: string) => void
  className?: string
}

export function TimelineTrack({
  track,
  timeline,
  timeToPixel,
  containerWidth,
  onTrackToggle,
  onTrackExpand,
  onKeyframeSelect,
  onKeyframeMove,
  onKeyframeAdd,
  onKeyframeDelete,
  onCurveEditorOpen,
  className = '',
}: TimelineTrackProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragKeyframe, setDragKeyframe] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    items: ContextMenuItem[]
  } | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  //TODO: Handle isDragging, dragKeyframe, dragOffset, onKeyframeMove
  logger.warn(
    'Unused variables: isDragging, dragKeyframe, dragOffset, onKeyframeMove',
    { isDragging, dragKeyframe, dragOffset, onKeyframeMove }
  )

  // Handle keyframe click
  const handleKeyframeClick = useCallback(
    (event: React.MouseEvent, keyframe: TimelineKeyframe) => {
      event.stopPropagation()

      const isSelected = timeline.selectedKeyframes.has(keyframe.id)
      const newSelection = new Set(timeline.selectedKeyframes)

      if (event.ctrlKey || event.metaKey) {
        // Multi-select
        if (isSelected) {
          newSelection.delete(keyframe.id)
        } else {
          newSelection.add(keyframe.id)
        }
      } else {
        // Single select
        newSelection.clear()
        newSelection.add(keyframe.id)
      }

      onKeyframeSelect(Array.from(newSelection))
    },
    [timeline.selectedKeyframes, onKeyframeSelect]
  )

  // Handle keyframe mouse down for dragging
  const handleKeyframeMouseDown = useCallback(
    (event: React.MouseEvent, keyframe: TimelineKeyframe) => {
      if (event.button !== 0) return // Only left click

      setIsDragging(true)
      setDragKeyframe(keyframe.id)

      const rect = trackRef.current?.getBoundingClientRect()
      if (rect) {
        const keyframeX = timeToPixel(keyframe.time)
        setDragOffset(event.clientX - rect.left - keyframeX)
      }

      event.stopPropagation()
    },
    [timeToPixel]
  )

  // Handle keyframe right click
  const handleKeyframeContextMenu = useCallback(
    (event: React.MouseEvent, keyframe: TimelineKeyframe) => {
      event.preventDefault()
      event.stopPropagation()

      const menuItems: ContextMenuItem[] = [
        {
          id: 'copy-keyframe',
          label: 'Copy Keyframe',
          icon: <Copy size={14} />,
          action: () => {
            // PLACEHOLDER: Keyframe copying logic - requires clipboard management system
            throw new Error(
              'PLACEHOLDER: Keyframe copying not implemented - requires clipboard management system integration'
            )
          },
        },
        {
          id: 'paste-keyframe',
          label: 'Paste Keyframe',
          icon: <Plus size={14} />,
          action: () => {
            // PLACEHOLDER: Keyframe pasting logic - requires clipboard management system
            throw new Error(
              'PLACEHOLDER: Keyframe pasting not implemented - requires clipboard management system integration'
            )
          },
        },
        {
          id: 'delete-keyframe',
          label: 'Delete Keyframe',
          icon: <Trash2 size={14} />,
          action: () => onKeyframeDelete([keyframe.id]),
        },
        {
          id: 'duplicate-keyframe',
          label: 'Duplicate Keyframe',
          icon: <Copy size={14} />,
          action: () => {
            // PLACEHOLDER: Keyframe duplication logic - requires timeline state management
            throw new Error(
              'PLACEHOLDER: Keyframe duplication not implemented - requires timeline state management and keyframe creation'
            )
          },
        },
      ]

      setContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        items: menuItems,
      })
    },
    [onKeyframeDelete]
  )

  // Handle track click to add keyframe
  const handleTrackClick = useCallback(
    (event: React.MouseEvent) => {
      if (!trackRef.current || !track.expanded) return

      const rect = trackRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const time = x / (containerWidth / timeline.duration) / timeline.zoom

      onKeyframeAdd(time, 0)
    },
    [track, timeline, onKeyframeAdd, containerWidth]
  )

  // Handle track context menu
  const handleTrackContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()

      const menuItems: ContextMenuItem[] = [
        {
          id: 'rename-track',
          label: 'Rename Track',
          icon: <Edit3 size={14} />,
          action: () => {
            // PLACEHOLDER: Track renaming logic - requires track state management
            throw new Error(
              'PLACEHOLDER: Track renaming not implemented - requires track state management and validation'
            )
          },
        },
        {
          id: 'delete-track',
          label: 'Delete Track',
          icon: <Trash2 size={14} />,
          action: () => {
            // PLACEHOLDER: Track deletion logic - requires timeline state management and cleanup
            throw new Error(
              'PLACEHOLDER: Track deletion not implemented - requires timeline state management and resource cleanup'
            )
          },
        },
        {
          id: 'duplicate-track',
          label: 'Duplicate Track',
          icon: <Copy size={14} />,
          action: () => {
            // PLACEHOLDER: Track duplication logic - requires timeline state management
            throw new Error(
              'PLACEHOLDER: Track duplication not implemented - requires timeline state management and track creation'
            )
          },
        },
        {
          id: 'add-keyframe',
          label: 'Add Keyframe',
          icon: <Plus size={14} />,
          action: () => {
            // PLACEHOLDER: Keyframe addition logic - requires timeline state management
            throw new Error(
              'PLACEHOLDER: Keyframe addition not implemented - requires timeline state management and keyframe creation'
            )
          },
        },
      ]

      setContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        items: menuItems,
      })
    },
    [track.id]
  )

  // PLACEHOLDER: Selected keyframes functionality - requires timeline selection state management
  // const _selectedKeyframes = track.keyframes.filter((k) =>
  //   timeline.selectedKeyframes.has(k.id)
  // )

  return (
    <div
      className={`timeline-track ${track.expanded ? 'expanded' : 'collapsed'} ${className}`}
      ref={trackRef}
    >
      {/* Track Header */}
      <div
        className="track-header"
        onClick={() => onTrackExpand(!track.expanded)}
        onContextMenu={handleTrackContextMenu}
      >
        <div className="track-controls">
          <button
            className="track-toggle"
            onClick={(e) => {
              e.stopPropagation()
              onTrackToggle(!track.enabled)
            }}
            title={track.enabled ? 'Disable track' : 'Enable track'}
          >
            {track.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          <button
            className="track-lock"
            onClick={(e) => {
              e.stopPropagation()
              // Toggle lock state
            }}
            title={track.locked ? 'Unlock track' : 'Lock track'}
          >
            {track.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        </div>

        <div className="track-info">
          <span className="track-name">{track.name}</span>
          <span className="track-type">{track.type}</span>
        </div>

        <div className="track-actions">
          {onCurveEditorOpen && track.keyframes.length > 0 && (
            <button
              className="track-curve-editor"
              title="Edit curve"
              onClick={(e) => {
                e.stopPropagation()
                onCurveEditorOpen(track.id)
              }}
            >
              📈
            </button>
          )}

          <button
            className="track-menu"
            onClick={(e) => {
              e.stopPropagation()
              handleTrackContextMenu(e)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              handleTrackContextMenu(e)
            }}
            title="Track options"
          >
            <MoreHorizontal size={14} />
          </button>

          <button
            className="track-expand"
            title={track.expanded ? 'Collapse track' : 'Expand track'}
          >
            {track.expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Track Content */}
      {track.expanded && (
        <div className="track-content" onClick={handleTrackClick}>
          {/* Keyframes */}
          <div className="track-keyframes">
            {track.keyframes.map((keyframe) => {
              const pixelX = timeToPixel(keyframe.time)
              const isSelected = timeline.selectedKeyframes.has(keyframe.id)

              return (
                <div
                  key={keyframe.id}
                  className={`keyframe ${isSelected ? 'selected' : ''}`}
                  style={{ left: `${pixelX}px` }}
                  onClick={(e) => handleKeyframeClick(e, keyframe)}
                  onMouseDown={(e) => handleKeyframeMouseDown(e, keyframe)}
                  onContextMenu={(e) => handleKeyframeContextMenu(e, keyframe)}
                >
                  <div className="keyframe-handle" />
                  <div className="keyframe-line" />
                  {isSelected && <div className="keyframe-selection" />}
                </div>
              )
            })}
          </div>

          {/* Keyframe curve preview */}
          <div className="track-curve">
            <svg className="curve-svg" width="100%" height="40">
              <path
                d={generateCurvePath(track.keyframes, containerWidth)}
                className="curve-path"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          items={contextMenu.items}
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onItemSelect={(item) => {
            // Handle menu item selection if needed
            logger.info('Selected menu item:', item.id)
          }}
        />
      )}
    </div>
  )
}

// Helper function to generate SVG path for keyframe curve
function generateCurvePath(
  keyframes: TimelineKeyframe[],
  containerWidth: number
): string {
  if (keyframes.length < 2) return ''

  let path = `M 0 20`

  for (let i = 0; i < keyframes.length - 1; i++) {
    const current = keyframes[i]
    const next = keyframes[i + 1]

    // Simple linear interpolation for now
    const x1 = (current.time / 10) * containerWidth // Scale to container width (assuming 10s duration)
    const y1 = 20 - (typeof current.value === 'number' ? current.value * 20 : 0)
    const x2 = (next.time / 10) * containerWidth
    const y2 = 20 - (typeof next.value === 'number' ? next.value * 20 : 0)

    path += ` L ${x1} ${y1} L ${x2} ${y2}`
  }

  return path
}
