/**
 * @fileoverview Animation Properties section for the Context Pane
 * @author @darianrosebrook
 */

import React from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { SceneNode } from '@/types'

interface AnimationPropertiesSectionProps {
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

export function AnimationPropertiesSection({
  _layer,
  _onUpdate,
  _onPopoverOpen,
  isCollapsed,
  onToggleCollapse,
}: AnimationPropertiesSectionProps) {
  return (
    <div className={`properties-section ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={onToggleCollapse}>
        <h4>Animation Properties</h4>
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
            <label>Animation State</label>
            <div className="animation-controls">
              <button className="btn-icon" title="Play animation">
                <Play size={16} />
              </button>
              <button className="btn-icon" title="Pause animation">
                <Pause size={16} />
              </button>
              <button className="btn-icon" title="Reset animation">
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>Duration</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                defaultValue={2.0}
                step="0.1"
                min="0"
                style={{ flex: 1 }}
              />
              <span className="unit">s</span>
            </div>
          </div>

          <div className="control-group">
            <label>Delay</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                defaultValue={0}
                step="0.1"
                min="0"
                style={{ flex: 1 }}
              />
              <span className="unit">s</span>
            </div>
          </div>

          <div className="control-group">
            <label>Easing</label>
            <select defaultValue="ease-out">
              <option value="linear">Linear</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In Out</option>
              <option value="bounce">Bounce</option>
              <option value="elastic">Elastic</option>
            </select>
          </div>

          <div className="control-group">
            <label>Loop</label>
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Loop animation</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
