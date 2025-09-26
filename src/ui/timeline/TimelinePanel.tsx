import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useTimelineContainer } from '@/ui/hooks/use-timeline-container'
import { TimelineTrack } from './TimelineTrack'
import { TimelineRuler } from './TimelineRuler'
import { TimelineScrubber } from './TimelineScrubber'
import { TimelineControls } from './TimelineControls'
import { CurveEditor } from './CurveEditor'
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
  className = '',
}: TimelinePanelProps) {
  const { containerRef, containerWidth } = useTimelineContainer()
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isResizing, setIsResizing] = useState(false)
  const [showCurveEditor, setShowCurveEditor] = useState(false)
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
    <div className={`timeline-panel ${className}`} ref={containerRef}>
      {/* Timeline Controls */}
      <TimelineControls
        isPlaying={timeline.isPlaying}
        currentTime={timeline.currentTime}
        duration={timeline.duration}
        frameRate={timeline.frameRate}
        zoom={timeline.zoom}
        playbackSpeed={timeline.playbackSpeed}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        onRewind={handleRewind}
        onFastForward={handleFastForward}
        onZoom={handleZoom}
        onPlaybackSpeedChange={(speed) => {
          if (onPlaybackSpeedChange) onPlaybackSpeedChange(speed)
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
