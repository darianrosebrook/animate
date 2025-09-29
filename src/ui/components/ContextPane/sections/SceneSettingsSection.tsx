/**
 * @fileoverview Scene Settings section for the Context Pane
 * @author @darianrosebrook
 */

import React from 'react'
import { Settings, Palette } from 'lucide-react'
import { Scene } from '@/types'

interface SceneSettingsSectionProps {
  scene: Scene | null
  onUpdate: (updates: Partial<Scene>) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function SceneSettingsSection({
  scene,
  onUpdate,
  isCollapsed,
  onToggleCollapse,
}: SceneSettingsSectionProps) {
  if (!scene) {
    return (
      <div className="properties-section">
        <div className="section-header">
          <h4>Scene Settings</h4>
        </div>
        <div className="section-content">
          <p className="section-description">No scene selected</p>
        </div>
      </div>
    )
  }

  const handleDurationChange = (value: number) => {
    onUpdate({ duration: Math.max(0.1, value) })
  }

  const handleFrameRateChange = (value: number) => {
    onUpdate({ frameRate: Math.max(1, value) })
  }

  return (
    <div className={`properties-section ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={onToggleCollapse}>
        <h4>Scene Settings</h4>
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
          <div className="control-group">
            <label>Scene Name</label>
            <input
              type="text"
              value={scene.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Scene name"
            />
          </div>

          <div className="control-group">
            <label>Duration</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={scene.duration}
                onChange={(e) =>
                  handleDurationChange(parseFloat(e.target.value) || 0)
                }
                step="0.1"
                min="0.1"
                style={{ flex: 1 }}
              />
              <span className="unit">s</span>
            </div>
          </div>

          <div className="control-group">
            <label>Frame Rate</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={scene.frameRate}
                onChange={(e) =>
                  handleFrameRateChange(parseFloat(e.target.value) || 0)
                }
                step="1"
                min="1"
                max="120"
                style={{ flex: 1 }}
              />
              <span className="unit">fps</span>
            </div>
          </div>

          <div className="control-group">
            <label>Background</label>
            <button
              className="color-preview-btn"
              title="Edit background color"
              style={{ width: '100%' }}
            >
              <div
                className="color-preview"
                style={{
                  background: `rgba(20, 20, 20, 1)`,
                  flex: 1,
                }}
              />
              <Palette size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
