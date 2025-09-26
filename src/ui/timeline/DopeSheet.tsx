import React, { useState, useRef, useCallback, useEffect } from 'react'
import './DopeSheet.css'

export interface DopeSheetKeyframe {
  id: string
  trackId: string
  time: number
  value: any
  selected: boolean
}

export interface DopeSheetTrack {
  id: string
  name: string
  keyframes: DopeSheetKeyframe[]
  color: string
  enabled: boolean
}

export interface DopeSheetProps {
  tracks: DopeSheetTrack[]
  duration: number
  currentTime: number
  zoom: number
  selectedKeyframes: Set<string>
  onKeyframeSelect: (keyframeIds: string[]) => void
  onKeyframeMove: (keyframeId: string, newTime: number) => void
  onKeyframeDelete: (keyframeIds: string[]) => void
  onKeyframesAdd: (trackId: string, time: number, count: number) => void
  className?: string
}

export function DopeSheet({
  tracks,
  duration,
  currentTime,
  zoom,
  selectedKeyframes,
  onKeyframeSelect,
  onKeyframeMove,
  onKeyframeDelete,
  onKeyframesAdd,
  className = '',
}: DopeSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragKeyframe, setDragKeyframe] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [selectionRect, setSelectionRect] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  // Convert time to pixel position
  const timeToPixel = useCallback(
    (time: number) => {
      return (time / duration) * 800 * zoom
    },
    [duration, zoom]
  )

  // Handle keyframe click
  const handleKeyframeClick = useCallback(
    (event: React.MouseEvent, keyframe: DopeSheetKeyframe) => {
      event.stopPropagation()

      const isSelected = selectedKeyframes.has(keyframe.id)
      const newSelection = new Set(selectedKeyframes)

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
    [selectedKeyframes, onKeyframeSelect]
  )

  // Handle keyframe mouse down for dragging
  const handleKeyframeMouseDown = useCallback(
    (event: React.MouseEvent, keyframe: DopeSheetKeyframe) => {
      if (event.button !== 0) return

      setIsDragging(true)
      setDragKeyframe(keyframe.id)

      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const keyframeX = timeToPixel(keyframe.time)
        setDragOffset(event.clientX - rect.left - keyframeX)
      }

      event.stopPropagation()
    },
    [timeToPixel]
  )

  // Handle mouse move during drag
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !dragKeyframe || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left - dragOffset
      const newTime = Math.max(0, Math.min(duration, x / (800 * zoom)))

      onKeyframeMove(dragKeyframe, newTime)
    },
    [isDragging, dragKeyframe, dragOffset, duration, zoom, onKeyframeMove]
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragKeyframe(null)
    setDragOffset(0)
  }, [])

  // Handle selection rectangle
  const handleContainerMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.target !== event.currentTarget) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const startX = event.clientX - rect.left
      const startY = event.clientY - rect.top

      setSelectionRect({ x: startX, y: startY, width: 0, height: 0 })

      const handleSelectionMouseMove = (moveEvent: MouseEvent) => {
        if (!rect) return

        const currentX = moveEvent.clientX - rect.left
        const currentY = moveEvent.clientY - rect.top

        setSelectionRect({
          x: Math.min(startX, currentX),
          y: Math.min(startY, currentY),
          width: Math.abs(currentX - startX),
          height: Math.abs(currentY - startY),
        })
      }

      const handleSelectionMouseUp = () => {
        // Select keyframes within the selection rectangle
        if (
          selectionRect &&
          selectionRect.width > 5 &&
          selectionRect.height > 5
        ) {
          const selectedIds: string[] = []

          tracks.forEach((track) => {
            track.keyframes.forEach((keyframe) => {
              const keyframeX = timeToPixel(keyframe.time)
              const keyframeY = getTrackY(track.id)

              if (
                keyframeX >= selectionRect.x &&
                keyframeX <= selectionRect.x + selectionRect.width &&
                keyframeY >= selectionRect.y &&
                keyframeY <= selectionRect.y + selectionRect.height
              ) {
                selectedIds.push(keyframe.id)
              }
            })
          })

          if (selectedIds.length > 0) {
            onKeyframeSelect(selectedIds)
          }
        }

        setSelectionRect(null)
        document.removeEventListener('mousemove', handleSelectionMouseMove)
        document.removeEventListener('mouseup', handleSelectionMouseUp)
      }

      document.addEventListener('mousemove', handleSelectionMouseMove)
      document.addEventListener('mouseup', handleSelectionMouseUp)
    },
    [tracks, timeToPixel, onKeyframeSelect, selectionRect]
  )

  // Add drag event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Get Y position for a track
  const getTrackY = (trackId: string) => {
    const trackIndex = tracks.findIndex((t) => t.id === trackId)
    return trackIndex * 30 + 40 // 30px per track + header offset
  }

  // Handle keyframe deletion
  const handleKeyframeDelete = useCallback(
    (event: React.MouseEvent, keyframe: DopeSheetKeyframe) => {
      event.stopPropagation()
      onKeyframeDelete([keyframe.id])
    },
    [onKeyframeDelete]
  )

  return (
    <div
      className={`dope-sheet ${className}`}
      ref={containerRef}
      onMouseDown={handleContainerMouseDown}
    >
      {/* Header */}
      <div className="dope-sheet-header">
        <div className="header-time">Time</div>
        <div className="header-tracks">Tracks</div>
      </div>

      {/* Time ruler */}
      <div className="dope-sheet-ruler">
        {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
          <div
            key={i}
            className="ruler-tick"
            style={{ left: `${timeToPixel(i)}px` }}
          >
            <div className="tick-line" />
            <div className="tick-label">{i}s</div>
          </div>
        ))}
      </div>

      {/* Current time indicator */}
      <div
        className="current-time-indicator"
        style={{ left: `${timeToPixel(currentTime)}px` }}
      >
        <div className="time-line" />
      </div>

      {/* Tracks */}
      <div className="dope-sheet-tracks">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`dope-sheet-track ${track.enabled ? '' : 'disabled'}`}
            style={{ top: `${getTrackY(track.id)}px` }}
          >
            {/* Track header */}
            <div className="track-header">
              <div
                className="track-color"
                style={{ backgroundColor: track.color }}
              />
              <div className="track-name">{track.name}</div>
              <div className="track-controls">
                <button
                  className="add-keyframe-btn"
                  title="Add keyframe"
                  onClick={() => onKeyframesAdd(track.id, currentTime, 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Keyframes */}
            <div className="track-keyframes">
              {track.keyframes.map((keyframe) => (
                <div
                  key={keyframe.id}
                  className={`keyframe ${selectedKeyframes.has(keyframe.id) ? 'selected' : ''}`}
                  style={{ left: `${timeToPixel(keyframe.time)}px` }}
                  onMouseDown={(e) => handleKeyframeMouseDown(e, keyframe)}
                  onClick={(e) => handleKeyframeClick(e, keyframe)}
                  onContextMenu={(e) => handleKeyframeDelete(e, keyframe)}
                  title={`Time: ${keyframe.time.toFixed(2)}s, Value: ${JSON.stringify(keyframe.value)}`}
                >
                  <div className="keyframe-dot" />
                  <div className="keyframe-time">
                    {keyframe.time.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selection rectangle */}
      {selectionRect && (
        <div
          className="selection-rectangle"
          style={{
            left: `${selectionRect.x}px`,
            top: `${selectionRect.y}px`,
            width: `${selectionRect.width}px`,
            height: `${selectionRect.height}px`,
          }}
        />
      )}
    </div>
  )
}

