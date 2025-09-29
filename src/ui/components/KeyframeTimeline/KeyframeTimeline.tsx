import React, { useState, useRef, useCallback } from 'react'
import { Play, Pause, Square, Plus } from 'lucide-react'
import { SceneNode } from '@/types'
import './KeyframeTimeline.css'

interface KeyframeTimelineProps {
  layers: SceneNode[]
  currentTime: number
  duration: number
  isPlaying: boolean
  onTimeChange: (time: number) => void
  onKeyframeAdd: (layerId: string, time: number) => void
  onPlayPause: () => void
}

export function KeyframeTimeline({
  layers,
  currentTime,
  duration,
  isPlaying,
  onTimeChange,
  onKeyframeAdd,
  onPlayPause,
}: KeyframeTimelineProps) {
  const [isDragging, setIsDragging] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  const _timeToPixel = useCallback(
    (time: number) => {
      if (!timelineRef.current) return 0
      const rect = timelineRef.current.getBoundingClientRect()
      return (time / duration) * rect.width
    },
    [duration]
  )

  const pixelToTime = useCallback(
    (pixel: number) => {
      if (!timelineRef.current) return 0
      const rect = timelineRef.current.getBoundingClientRect()
      return (pixel / rect.width) * duration
    },
    [duration]
  )

  const handleTimelineClick = useCallback(
    (event: React.MouseEvent) => {
      if (!timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const time = pixelToTime(x)

      onTimeChange(Math.max(0, Math.min(duration, time)))
    },
    [pixelToTime, duration, onTimeChange]
  )

  const handleScrubberMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true)
    event.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const time = Math.max(0, Math.min(duration, pixelToTime(x)))

      onTimeChange(time)
    },
    [isDragging, pixelToTime, duration, onTimeChange]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add mouse move/up listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handlePlayPause = () => {
    onPlayPause()
  }

  const handleStop = () => {
    onTimeChange(0)
  }

  const handleAddKeyframe = () => {
    if (layers.length > 0) {
      onKeyframeAdd(layers[0].id, currentTime)
    }
  }

  return (
    <div className="keyframe-timeline">
      {/* Timeline Controls */}
      <div className="timeline-controls">
        <button className="timeline-btn" onClick={handlePlayPause}>
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button className="timeline-btn" onClick={handleStop}>
          <Square size={14} />
        </button>
        <button className="timeline-btn" onClick={handleAddKeyframe}>
          <Plus size={14} />
        </button>
        <span className="time-display">
          {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
        </span>
      </div>

      {/* Timeline Ruler */}
      <div className="timeline-ruler">
        {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
          <div
            key={i}
            className="ruler-mark"
            style={{ left: `${(i / duration) * 100}%` }}
          >
            <span className="ruler-label">{i}s</span>
          </div>
        ))}
      </div>

      {/* Main Timeline */}
      <div
        className="timeline-track"
        ref={timelineRef}
        onClick={handleTimelineClick}
      >
        {/* Timeline Background */}
        <div className="timeline-background"></div>

        {/* Keyframe Markers */}
        <div className="keyframe-markers">
          {layers.map((layer) => (
            <div key={layer.id} className="layer-keyframes">
              {/* Mock keyframes for demo */}
              <div
                className="keyframe-marker"
                style={{ left: `${(1 / duration) * 100}%` }}
                title={`Layer: ${layer.name}`}
              ></div>
              <div
                className="keyframe-marker active"
                style={{ left: `${(currentTime / duration) * 100}%` }}
                title={`Layer: ${layer.name} (Current)`}
              ></div>
            </div>
          ))}
        </div>

        {/* Timeline Scrubber */}
        <div
          className="timeline-scrubber"
          style={{ left: `${(currentTime / duration) * 100}%` }}
          onMouseDown={handleScrubberMouseDown}
        >
          <div className="scrubber-handle"></div>
        </div>
      </div>

      {/* Layer Tracks */}
      <div className="layer-tracks">
        {layers.map((layer) => (
          <div key={layer.id} className="layer-track">
            <div className="layer-name">{layer.name}</div>
            <div className="layer-properties">
              {/* Property keyframes would go here */}
              <div className="property-track">
                <span className="property-name">Position</span>
                <div className="property-keyframes">
                  <div
                    className="property-keyframe"
                    style={{ left: '20%' }}
                  ></div>
                  <div
                    className="property-keyframe active"
                    style={{ left: '60%' }}
                  ></div>
                </div>
              </div>
              <div className="property-track">
                <span className="property-name">Opacity</span>
                <div className="property-keyframes">
                  <div
                    className="property-keyframe"
                    style={{ left: '40%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
