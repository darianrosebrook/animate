import React from 'react'
import {
  MousePointer,
  Square,
  Circle,
  Type,
  Image,
  Minus,
  Move,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
} from 'lucide-react'
import { UIMode } from '@/types'
import './FloatingToolbar.css'

interface FloatingToolbarProps {
  mode: UIMode
  isPlaying: boolean
  onModeChange: (mode: UIMode) => void
  onPlayPause: () => void
  onStop: () => void
  onAddKeyframe: () => void
}

export function FloatingToolbar({
  mode,
  isPlaying,
  onModeChange,
  onPlayPause,
  onStop,
  onAddKeyframe,
}: FloatingToolbarProps) {
  const designTools = [
    { icon: <MousePointer size={20} />, label: 'Select', id: 'select' },
    { icon: <Square size={20} />, label: 'Rectangle', id: 'rectangle' },
    { icon: <Circle size={20} />, label: 'Ellipse', id: 'ellipse' },
    { icon: <Type size={20} />, label: 'Text', id: 'text' },
    { icon: <Image size={20} />, label: 'Image', id: 'image' },
    { icon: <Minus size={20} />, label: 'Line', id: 'line' },
  ]

  const animationTools = [
    { icon: <MousePointer size={20} />, label: 'Select', id: 'select' },
    { icon: <Move size={20} />, label: 'Transform', id: 'transform' },
    { icon: <RotateCw size={20} />, label: 'Rotate', id: 'rotate' },
    { icon: <FlipHorizontal size={20} />, label: 'Flip H', id: 'flip-h' },
    { icon: <FlipVertical size={20} />, label: 'Flip V', id: 'flip-v' },
  ]

  const animationControls = [
    { icon: <SkipBack size={20} />, label: 'Previous Frame', id: 'prev-frame' },
    {
      icon: isPlaying ? <Pause size={20} /> : <Play size={20} />,
      label: isPlaying ? 'Pause' : 'Play',
      id: 'play-pause',
      action: onPlayPause,
    },
    { icon: <Square size={20} />, label: 'Stop', id: 'stop', action: onStop },
    { icon: <SkipForward size={20} />, label: 'Next Frame', id: 'next-frame' },
    {
      icon: <Plus size={20} />,
      label: 'Add Keyframe',
      id: 'add-keyframe',
      action: onAddKeyframe,
    },
  ]

  const alignmentTools = [
    { icon: <AlignLeft size={20} />, label: 'Align Left', id: 'align-left' },
    {
      icon: <AlignCenter size={20} />,
      label: 'Align Center',
      id: 'align-center',
    },
    { icon: <AlignRight size={20} />, label: 'Align Right', id: 'align-right' },
    {
      icon: <AlignStartVertical size={20} />,
      label: 'Align Top',
      id: 'align-top',
    },
    {
      icon: <AlignCenterVertical size={20} />,
      label: 'Align Middle',
      id: 'align-middle',
    },
    {
      icon: <AlignEndVertical size={20} />,
      label: 'Align Bottom',
      id: 'align-bottom',
    },
  ]

  const currentTools = mode === UIMode.Design ? designTools : animationTools

  return (
    <div className="floating-toolbar">
      {/* Main Tools */}
      <div className="toolbar-section">
        {currentTools.map((tool) => (
          <button key={tool.id} className="toolbar-btn" title={tool.label}>
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Alignment Tools (Design Mode) */}
      {mode === UIMode.Design && (
        <div className="toolbar-section">
          <div className="section-divider"></div>
          {alignmentTools.map((tool) => (
            <button key={tool.id} className="toolbar-btn" title={tool.label}>
              {tool.icon}
            </button>
          ))}
        </div>
      )}

      {/* Animation Controls (Animation Mode) */}
      {mode === UIMode.Animate && (
        <div className="toolbar-section">
          <div className="section-divider"></div>
          {animationControls.map((control) => (
            <button
              key={control.id}
              className="toolbar-btn"
              title={control.label}
              onClick={control.action}
            >
              {control.icon}
            </button>
          ))}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="toolbar-section mode-toggle">
        <div className="section-divider"></div>
        <button
          className={`mode-btn ${mode === UIMode.Design ? 'active' : ''}`}
          onClick={() => onModeChange(UIMode.Design)}
          title="Design Mode"
        >
          Design
        </button>
        <button
          className={`mode-btn ${mode === UIMode.Animate ? 'active' : ''}`}
          onClick={() => onModeChange(UIMode.Animate)}
          title="Animation Mode"
        >
          Animate
        </button>
      </div>
    </div>
  )
}
