import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useTimelineContainer } from '../hooks/use-timeline-container'
import { TimelineTrack } from './TimelineTrack'
import { TimelineRuler } from './TimelineRuler'
import { TimelineScrubber } from './TimelineScrubber'
import { TimelineControls } from './TimelineControls'
import { CurveEditor } from './CurveEditor'
import { DopeSheet } from './DopeSheet'
import './TimelinePanel.css'

export interface TimelineKeyframe {
  id: string
  time: number
  value:
    | number
    | { x: number; y: number }
    | { r: number; g: number; b: number; a: number }
  interpolation:
    | 'linear'
    | 'ease'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'bezier'
  easing?: { x1: number; y1: number; x2: number; y2: number }
  selected: boolean
}

export interface TimelineTrack {
  id: string
  name: string
  type: 'position' | 'scale' | 'rotation' | 'opacity' | 'color' | 'effect'
  targetNodeId: string
  propertyPath: string
  keyframes: TimelineKeyframe[]
  enabled: boolean
  locked: boolean
  color?: string
  expanded: boolean
}

export interface TimelineState {
  currentTime: number
  duration: number
  frameRate: number
  isPlaying: boolean
  zoom: number
  playbackSpeed: number
  loopEnabled: boolean
  tracks: TimelineTrack[]
  selectedKeyframes: Set<string>
  clipboard: TimelineKeyframe[]
}

export interface TimelinePanelProps {
  timeline: TimelineState
  onTimelineChange: (updates: Partial<TimelineState>) => void
  onKeyframeSelect: (keyframeIds: string[]) => void
  onKeyframeMove: (keyframeId: string, newTime: number) => void
  onKeyframeAdd: (trackId: string, time: number, value: any) => void
  onKeyframeDelete: (keyframeIds: string[]) => void
  onTrackToggle: (trackId: string, enabled: boolean) => void
  onTrackExpand: (trackId: string, expanded: boolean) => void
  onPlaybackSpeedChange?: (speed: number) => void
  onLoopToggle?: () => void
  className?: string
}

export function TimelinePanel({
  timeline,
  onTimelineChange,
  onKeyframeSelect,
  onKeyframeMove,
  onKeyframeAdd,
  onKeyframeDelete,
  onTrackToggle,
  onTrackExpand,
  onPlaybackSpeedChange,
  onLoopToggle,
  className = '',
}: TimelinePanelProps) {
  const { containerRef, containerWidth } = useTimelineContainer()
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [_isResizing, _setIsResizing] = useState(false)
  const [showCurveEditor, setShowCurveEditor] = useState(false)

  // Accessibility features
  const [reducedMotion, setReducedMotion] = useState(false)
  const [keyboardNavigation, _setKeyboardNavigation] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!timelineRef.current || !keyboardNavigation) return

      const step = 1 / timeline.frameRate // One frame step

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          onTimelineChange({
            currentTime: Math.max(0, timeline.currentTime - step),
          })
          announceToScreenReader(
            `Moved to ${formatTime(Math.max(0, timeline.currentTime - step))}`
          )
          break
        case 'ArrowRight':
          event.preventDefault()
          onTimelineChange({
            currentTime: Math.min(
              timeline.duration,
              timeline.currentTime + step
            ),
          })
          announceToScreenReader(
            `Moved to ${formatTime(Math.min(timeline.duration, timeline.currentTime + step))}`
          )
          break
        case 'Home':
          event.preventDefault()
          onTimelineChange({ currentTime: 0 })
          announceToScreenReader('Moved to start')
          break
        case 'End':
          event.preventDefault()
          onTimelineChange({ currentTime: timeline.duration })
          announceToScreenReader('Moved to end')
          break
        case ' ': // Spacebar
          event.preventDefault()
          onTimelineChange({ isPlaying: !timeline.isPlaying })
          announceToScreenReader(timeline.isPlaying ? 'Paused' : 'Playing')
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [timeline, keyboardNavigation, onTimelineChange])

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    announcement.textContent = message

    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }, [])

  // Format time for accessibility
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const frames = Math.floor((time % 1) * timeline.frameRate)
    return `${minutes}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }
  const [selectedTrackForCurve, setSelectedTrackForCurve] = useState<
    string | null
  >(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'dope-sheet'>(
    'timeline'
  )

  // Convert time to pixel position
  const timeToPixel = useCallback(
    (time: number) => {
      return (time / timeline.duration) * containerWidth * timeline.zoom
    },
    [timeline.duration, timeline.zoom, containerWidth]
  )

  // Convert pixel position to time
  const pixelToTime = useCallback(
    (pixel: number) => {
      return (pixel / containerWidth / timeline.zoom) * timeline.duration
    },
    [timeline.duration, timeline.zoom, containerWidth]
  )

  // Handle timeline click to add keyframe
  const handleTimelineClick = useCallback(
    (event: React.MouseEvent) => {
      if (!timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const time = pixelToTime(x)

      // Add keyframe to selected track
      const selectedTrack = timeline.tracks.find((track) => track.expanded)
      if (selectedTrack) {
        onKeyframeAdd(selectedTrack.id, time, 0)
      }
    },
    [pixelToTime, timeline.tracks, onKeyframeAdd]
  )

  // Handle scrubber drag
  const handleScrubberMouseDown = useCallback(
    (event: React.MouseEvent) => {
      setIsDragging(true)
      setDragOffset(event.clientX - timeToPixel(timeline.currentTime))
      event.preventDefault()
    },
    [timeline.currentTime, timeToPixel]
  )

  // Handle scrubber drag move
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left - dragOffset
      const newTime = Math.max(0, Math.min(timeline.duration, pixelToTime(x)))

      onTimelineChange({ currentTime: newTime })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, pixelToTime, timeline.duration, onTimelineChange])

  // Handle zoom
  const handleZoom = useCallback(
    (delta: number) => {
      const newZoom = Math.max(0.1, Math.min(10, timeline.zoom + delta))
      onTimelineChange({ zoom: newZoom })
    },
    [timeline.zoom, onTimelineChange]
  )

  // Handle playback controls
  const handlePlayPause = useCallback(() => {
    onTimelineChange({ isPlaying: !timeline.isPlaying })
  }, [timeline.isPlaying, onTimelineChange])

  const handleStop = useCallback(() => {
    onTimelineChange({ isPlaying: false, currentTime: 0 })
  }, [onTimelineChange])

  const handleRewind = useCallback(() => {
    onTimelineChange({
      currentTime: Math.max(0, timeline.currentTime - 1 / timeline.frameRate),
    })
  }, [timeline.currentTime, timeline.frameRate, onTimelineChange])

  const handleFastForward = useCallback(() => {
    onTimelineChange({
      currentTime: Math.min(
        timeline.duration,
        timeline.currentTime + 1 / timeline.frameRate
      ),
    })
  }, [
    timeline.currentTime,
    timeline.duration,
    timeline.frameRate,
    onTimelineChange,
  ])

  const openCurveEditor = useCallback((trackId: string) => {
    setSelectedTrackForCurve(trackId)
    setShowCurveEditor(true)
  }, [])

  const closeCurveEditor = useCallback(() => {
    setShowCurveEditor(false)
    setSelectedTrackForCurve(null)
  }, [])

  const handleCurvePointsChange = useCallback(
    (points: any[]) => {
      if (!selectedTrackForCurve) return

      // Convert curve points back to keyframes
      const keyframes = points.map((point, index) => ({
        id: `curve-keyframe-${index}`,
        time: point.time,
        value: point.value,
        interpolation: point.interpolation,
        easing: point.easing,
        selected: false,
      }))

      // Update the track with new keyframes
      const updatedTracks = timeline.tracks.map((track) =>
        track.id === selectedTrackForCurve ? { ...track, keyframes } : track
      )

      onTimelineChange({ tracks: updatedTracks })
    },
    [selectedTrackForCurve, timeline.tracks, onTimelineChange]
  )

  const handleCurvePointAdd = useCallback((time: number, value: number) => {
    // This would add a new keyframe at the specified time/value
    console.log('Add curve point:', time, value)
  }, [])

  return (
    <div
      className={`timeline-panel ${className}`}
      ref={containerRef}
      role="application"
      aria-label="Motion Graphics Timeline"
      aria-describedby="timeline-help"
    >
      {/* Hidden help text for screen readers */}
      <div id="timeline-help" className="sr-only">
        Use arrow keys to navigate timeline. Spacebar to play/pause. Home/End
        for start/end.
      </div>

      {/* Timeline Controls */}
      <TimelineControls
        isPlaying={timeline.isPlaying}
        currentTime={timeline.currentTime}
        duration={timeline.duration}
        frameRate={timeline.frameRate}
        zoom={timeline.zoom}
        playbackSpeed={timeline.playbackSpeed}
        onPlayPause={handlePlayPause}
        reducedMotion={reducedMotion}
        onStop={handleStop}
        onRewind={handleRewind}
        onFastForward={handleFastForward}
        onZoom={handleZoom}
        onPlaybackSpeedChange={(speed) => {
          onPlaybackSpeedChange?.(speed)
          announceToScreenReader(`Playback speed changed to ${speed}x`)
        }}
        onLoopToggle={onLoopToggle ? () => onLoopToggle() : undefined}
        loopEnabled={timeline.loopEnabled}
      />

      {/* Timeline Header */}
      <div className="timeline-header">
        <div className="timeline-info">
          <span className="frame-rate">{timeline.frameRate} fps</span>
          <span className="duration">{timeline.duration.toFixed(2)}s</span>
          <span className="current-time">
            {timeline.currentTime.toFixed(2)}s
          </span>
        </div>

        <div className="timeline-controls-group">
          <div className="view-mode-controls">
            <button
              className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
              title="Timeline View"
            >
              Timeline
            </button>
            <button
              className={`view-btn ${viewMode === 'dope-sheet' ? 'active' : ''}`}
              onClick={() => setViewMode('dope-sheet')}
              title="Dope Sheet View"
            >
              Dope Sheet
            </button>
          </div>

          <div className="timeline-zoom">
            <button
              className="zoom-btn"
              onClick={() => handleZoom(-0.1)}
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="zoom-level">
              {(timeline.zoom * 100).toFixed(0)}%
            </span>
            <button
              className="zoom-btn"
              onClick={() => handleZoom(0.1)}
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      {viewMode === 'timeline' && (
        <div className="timeline-content" ref={timelineRef}>
          {/* Timeline Ruler */}
          <TimelineRuler
            duration={timeline.duration}
            frameRate={timeline.frameRate}
            zoom={timeline.zoom}
            currentTime={timeline.currentTime}
            containerWidth={containerWidth}
          />

          {/* Timeline Scrubber */}
          <TimelineScrubber
            currentTime={timeline.currentTime}
            duration={timeline.duration}
            zoom={timeline.zoom}
            containerWidth={containerWidth}
            isDragging={isDragging}
            onMouseDown={handleScrubberMouseDown}
          />

          {/* Timeline Tracks */}
          <div className="timeline-tracks">
            {timeline.tracks.map((track) => (
              <TimelineTrack
                key={track.id}
                track={track}
                timeline={timeline}
                timeToPixel={timeToPixel}
                containerWidth={containerWidth}
                onTrackToggle={(enabled) => onTrackToggle(track.id, enabled)}
                onTrackExpand={(expanded) => onTrackExpand(track.id, expanded)}
                onKeyframeSelect={(keyframeIds) =>
                  onKeyframeSelect(keyframeIds)
                }
                onKeyframeMove={(keyframeId, newTime) =>
                  onKeyframeMove(keyframeId, newTime)
                }
                onKeyframeAdd={(time, value) =>
                  onKeyframeAdd(track.id, time, value)
                }
                onKeyframeDelete={(keyframeIds) =>
                  onKeyframeDelete(keyframeIds)
                }
                onCurveEditorOpen={openCurveEditor}
              />
            ))}
          </div>

          {/* Timeline Background (click to add keyframes) */}
          <div
            className="timeline-background"
            onClick={handleTimelineClick}
            style={{ cursor: 'crosshair' }}
          />
        </div>
      )}

      {/* Dope Sheet View */}
      {viewMode === 'dope-sheet' && (
        <DopeSheet
          tracks={timeline.tracks.map((track) => ({
            id: track.id,
            name: track.name,
            keyframes: track.keyframes.map((kf) => ({
              id: kf.id,
              trackId: track.id,
              time: kf.time,
              value: kf.value,
              selected: timeline.selectedKeyframes.has(kf.id),
            })),
            color: track.color || '#4ade80',
            enabled: track.enabled,
          }))}
          duration={timeline.duration}
          currentTime={timeline.currentTime}
          zoom={timeline.zoom}
          selectedKeyframes={timeline.selectedKeyframes}
          onKeyframeSelect={onKeyframeSelect}
          onKeyframeMove={onKeyframeMove}
          onKeyframeDelete={onKeyframeDelete}
          onKeyframesAdd={(trackId, time, count) => {
            for (let i = 0; i < count; i++) {
              onKeyframeAdd(trackId, time, 0)
            }
          }}
        />
      )}

      {/* Curve Editor Modal */}
      {showCurveEditor && selectedTrackForCurve && (
        <div className="curve-editor-modal">
          <div className="curve-editor-modal-content">
            <div className="curve-editor-header">
              <h3>Curve Editor</h3>
              <button onClick={closeCurveEditor} className="close-btn">
                ×
              </button>
            </div>
            <div className="curve-editor-body">
              <CurveEditor
                points={(() => {
                  const track = timeline.tracks.find(
                    (t) => t.id === selectedTrackForCurve
                  )
                  if (!track) return []
                  return track.keyframes.map((kf) => ({
                    time: kf.time,
                    value: typeof kf.value === 'number' ? kf.value : 0.5,
                    interpolation:
                      kf.interpolation === 'bezier' ? 'bezier' : 'linear',
                    easing: kf.easing,
                  }))
                })()}
                duration={timeline.duration}
                height={300}
                onPointsChange={handleCurvePointsChange}
                onPointAdd={handleCurvePointAdd}
              />
            </div>
          </div>
        </div>
      )}

      {/* Timeline Footer */}
      <div className="timeline-footer">
        <div className="timeline-stats">
          <span>{timeline.tracks.length} tracks</span>
          <span>
            {timeline.tracks.reduce(
              (sum, track) => sum + track.keyframes.length,
              0
            )}{' '}
            keyframes
          </span>
          <span>{timeline.selectedKeyframes.size} selected</span>
        </div>
      </div>
    </div>
  )
}
