import React from 'react'
import './TimelineScrubber.css'

export interface TimelineScrubberProps {
  currentTime: number
  duration: number
  zoom: number
  containerWidth: number
  isDragging: boolean
  onMouseDown: (event: React.MouseEvent) => void
  className?: string
}

export function TimelineScrubber({
  currentTime,
  duration,
  zoom,
  containerWidth,
  isDragging,
  onMouseDown,
  className = '',
}: TimelineScrubberProps) {
  const pixelPosition = (currentTime / duration) * containerWidth * zoom

  return (
    <div
      className={`timeline-scrubber ${isDragging ? 'dragging' : ''} ${className}`}
      style={{ left: `${pixelPosition}px` }}
      onMouseDown={onMouseDown}
    >
      <div className="scrubber-handle" />
      <div className="scrubber-line" />
    </div>
  )
}
