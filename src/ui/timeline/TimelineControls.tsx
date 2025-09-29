// TODO: Use React for JSX
// import React from 'react'
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Volume2,
} from 'lucide-react'
import './TimelineControls.css'

export interface TimelineControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  frameRate: number
  zoom: number
  playbackSpeed: number
  onPlayPause: () => void
  onStop: () => void
  onRewind: () => void
  onFastForward: () => void
  onZoom: (delta: number) => void
  onPlaybackSpeedChange: (speed: number) => void
  onLoopToggle?: () => void
  loopEnabled?: boolean
  className?: string
}

export function TimelineControls({
  isPlaying,
  currentTime,
  duration,
  frameRate,
  zoom,
  playbackSpeed,
  onPlayPause,
  onStop,
  onRewind,
  onFastForward,
  onZoom,
  onPlaybackSpeedChange,
  onLoopToggle,
  loopEnabled = false,
  className = '',
}: TimelineControlsProps) {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const frames = Math.floor((time % 1) * frameRate)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`timeline-controls ${className}`}>
      <div className="transport-controls">
        <button className="control-btn" onClick={onRewind} title="Rewind (←)">
          <SkipBack size={16} />
        </button>

        <button
          className="control-btn play-btn"
          onClick={onPlayPause}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button className="control-btn" onClick={onStop} title="Stop (Enter)">
          <Square size={16} />
        </button>

        <button
          className="control-btn"
          onClick={onFastForward}
          title="Fast Forward (→)"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <div className="time-display">
        <span className="current-time">{formatTime(currentTime)}</span>
        <span className="separator">/</span>
        <span className="total-time">{formatTime(duration)}</span>
      </div>

      <div className="progress-bar">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="zoom-controls">
        <button
          className="zoom-btn"
          onClick={() => onZoom(-0.1)}
          title="Zoom Out (-)"
        >
          <ZoomOut size={14} />
        </button>

        <span className="zoom-level">{(zoom * 100).toFixed(0)}%</span>

        <button
          className="zoom-btn"
          onClick={() => onZoom(0.1)}
          title="Zoom In (+)"
        >
          <ZoomIn size={14} />
        </button>
      </div>

      <div className="frame-rate">
        <Volume2 size={14} />
        <span>{frameRate} fps</span>
      </div>

      <div className="playback-speed">
        <select
          value={playbackSpeed}
          onChange={(e) => onPlaybackSpeedChange(parseFloat(e.target.value))}
          className="speed-select"
        >
          <option value={0.25}>0.25x</option>
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </div>

      {onLoopToggle && (
        <div className="loop-control">
          <button
            className={`loop-btn ${loopEnabled ? 'active' : ''}`}
            onClick={onLoopToggle}
            title={loopEnabled ? 'Disable loop' : 'Enable loop'}
          >
            🔄
          </button>
        </div>
      )}
    </div>
  )
}
