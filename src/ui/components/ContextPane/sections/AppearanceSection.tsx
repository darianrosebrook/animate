/**
 * @fileoverview Appearance section for the Context Pane
 * @author @darianrosebrook
 */

import React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { SceneNode, BlendMode } from '@/types'

interface AppearanceSectionProps {
  layer: SceneNode
  onUpdate: (updates: Partial<SceneNode>) => void
  onPopoverOpen: (
    type: 'color' | 'gradient' | 'curve',
    target: HTMLElement,
    data?: any
  ) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function AppearanceSection({
  layer,
  onUpdate,
  _onPopoverOpen,
  isCollapsed,
  onToggleCollapse,
}: AppearanceSectionProps) {
  const opacity = (layer.properties.opacity as number) || 1
  const visible = (layer.properties.visible as boolean) ?? true
  const blendMode = (layer.properties.blendMode as string) || 'normal'

  const handleOpacityChange = (value: number) => {
    onUpdate({
      properties: {
        ...layer.properties,
        opacity: Math.max(0, Math.min(1, value)),
      },
    })
  }

  const handleVisibilityToggle = () => {
    onUpdate({
      properties: { ...layer.properties, visible: !visible },
    })
  }

  const handleBlendModeChange = (newBlendMode: BlendMode) => {
    onUpdate({
      properties: { ...layer.properties, blendMode: newBlendMode },
    })
  }

  const blendModes: string[] = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'soft-light',
    'hard-light',
    'color-dodge',
    'color-burn',
    'darken',
    'lighten',
    'difference',
    'exclusion',
  ]

  return (
    <div className={`properties-section ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={onToggleCollapse}>
        <h4>Appearance</h4>
        <button className={`section-toggle ${isCollapsed ? 'active' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className="section-content">
          {/* Visibility Toggle */}
          <div className="control-group">
            <label>Visibility</label>
            <button
              className="btn-icon"
              title={visible ? 'Hide layer' : 'Show layer'}
              onClick={handleVisibilityToggle}
            >
              {visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          {/* Opacity Control */}
          <div className="control-group">
            <label>Opacity</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) =>
                  handleOpacityChange(parseFloat(e.target.value))
                }
                style={{ flex: 1 }}
              />
              <span className="value-display">
                {Math.round(opacity * 100)}%
              </span>
            </div>
          </div>

          {/* Blend Mode */}
          <div className="control-group">
            <label>Blend Mode</label>
            <select
              value={blendMode}
              onChange={(e) =>
                handleBlendModeChange(e.target.value as BlendMode)
              }
            >
              {blendModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
