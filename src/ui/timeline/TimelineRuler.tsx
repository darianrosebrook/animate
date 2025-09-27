import React from 'react'
import './TimelineRuler.css'

export interface TimelineRulerProps {
  duration: number
  frameRate: number
  zoom: number
  currentTime: number
  containerWidth: number
  className?: string
}

export function TimelineRuler({
  duration,
  frameRate,
  zoom,
  currentTime,
  containerWidth,
  className = '',
}: TimelineRulerProps) {
  // Generate time markers
  const generateMarkers = () => {
    const markers = []
    const totalFrames = duration * frameRate
    const _pixelsPerSecond = (containerWidth * zoom) / duration

    // Major markers (every second)
    for (let second = 0; second <= duration; second++) {
      const pixelX = (second / duration) * containerWidth * zoom
      markers.push({
        type: 'major' as const,
        time: second,
        pixelX,
        label: `${second}s`,
      })
    }

    // Minor markers (every frame)
    for (let frame = 0; frame <= totalFrames; frame++) {
      const time = frame / frameRate
      const pixelX = (time / duration) * containerWidth * zoom

      // Skip if too close to major marker
      const isNearMajor = markers.some(
        (marker) =>
          marker.type === 'major' && Math.abs(marker.pixelX - pixelX) < 5
      )

      if (!isNearMajor) {
        markers.push({
          type: 'minor' as const,
          time,
          pixelX,
          label: frame.toString(),
        })
      }
    }

    return markers.sort((a, b) => a.pixelX - b.pixelX)
  }

  const markers = generateMarkers()
  const currentTimePixel = (currentTime / duration) * containerWidth * zoom

  return (
    <div className={`timeline-ruler ${className}`}>
      <div className="ruler-markers">
        {markers.map((marker, index) => (
          <div
            key={index}
            className={`ruler-marker ruler-marker-${marker.type}`}
            style={{ left: `${marker.pixelX}px` }}
          >
            <div className="marker-line" />
            {marker.type === 'major' && (
              <div className="marker-label">{marker.label}</div>
            )}
          </div>
        ))}
      </div>

      {/* Current time indicator */}
      <div
        className="current-time-indicator"
        style={{ left: `${currentTimePixel}px` }}
      >
        <div className="time-line" />
        <div className="time-label">{currentTime.toFixed(2)}s</div>
      </div>
    </div>
  )
}
