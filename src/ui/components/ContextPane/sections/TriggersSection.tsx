/**
 * @fileoverview Triggers section for the Context Pane
 * @author @darianrosebrook
 */

import React from 'react'
import { Zap, Plus } from 'lucide-react'
import { SceneNode, Scene } from '@/types'

interface TriggersSectionProps {
  layer: SceneNode
  scene: Scene | null
  onUpdate: (updates: Partial<SceneNode>) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function TriggersSection({
  layer,
  scene,
  onUpdate,
  isCollapsed,
  onToggleCollapse,
}: TriggersSectionProps) {
  return (
    <div className={`properties-section ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={onToggleCollapse}>
        <h4>Triggers</h4>
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
            <label>Event Triggers</label>
            <div className="triggers-list">
              <div className="trigger-item">
                <div className="trigger-info">
                  <span className="trigger-event">On Click</span>
                  <span className="trigger-action">Play animation</span>
                </div>
                <button className="btn-icon" title="Edit trigger">
                  <Zap size={14} />
                </button>
              </div>
              <div className="trigger-item">
                <div className="trigger-info">
                  <span className="trigger-event">On Hover</span>
                  <span className="trigger-action">Show tooltip</span>
                </div>
                <button className="btn-icon" title="Edit trigger">
                  <Zap size={14} />
                </button>
              </div>
            </div>
            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Plus size={14} />
              Add Trigger
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
