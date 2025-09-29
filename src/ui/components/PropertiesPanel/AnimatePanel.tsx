import React from 'react'
import { SceneNode } from '@/types'

interface AnimatePanelProps {
  selectedLayers: SceneNode[]
}

export function AnimatePanel({ selectedLayers }: AnimatePanelProps) {
  if (selectedLayers.length === 0) {
    return (
      <div className="animate-panel-empty">
        <p>Select a layer to edit its animation properties</p>
      </div>
    )
  }

  const _layer = selectedLayers[0] // For now, work with single selection

  return (
    <div className="animate-panel">
      {/* Animation Progress Indicator */}
      <div className="animation-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.round(Math.random() * 100)}%` }}
          ></div>
        </div>
        <span className="progress-text">80%</span>
      </div>

      {/* Keyframe Timeline Section */}
      <div className="properties-section">
        <div className="section-header">
          <h4>Keyframes</h4>
          <button className="add-btn">+</button>
        </div>
        <div className="keyframe-timeline">
          <div className="timeline-scrubber"></div>
          <div className="keyframe-markers">
            {/* Placeholder for keyframe markers */}
            <div className="keyframe-marker" style={{ left: '10%' }}></div>
            <div className="keyframe-marker" style={{ left: '30%' }}></div>
            <div
              className="keyframe-marker active"
              style={{ left: '60%' }}
            ></div>
          </div>
        </div>
      </div>

      {/* Animation Curves Section */}
      <div className="properties-section">
        <div className="section-header">
          <h4>Animation Curves</h4>
        </div>
        <div className="curve-presets">
          <button className="curve-preset">Ease In</button>
          <button className="curve-preset active">Ease Out</button>
          <button className="curve-preset">Linear</button>
          <button className="curve-preset">Bounce</button>
        </div>
      </div>

      {/* Transform Animation Section */}
      <div className="properties-section">
        <div className="section-header">
          <h4>Transform</h4>
        </div>
        <div className="transform-controls">
          <div className="control-group">
            <label>Position X</label>
            <input type="number" defaultValue={0} step="1" />
          </div>
          <div className="control-group">
            <label>Position Y</label>
            <input type="number" defaultValue={0} step="1" />
          </div>
          <div className="control-group">
            <label>Scale X</label>
            <input type="number" defaultValue={100} step="1" />
          </div>
          <div className="control-group">
            <label>Scale Y</label>
            <input type="number" defaultValue={100} step="1" />
          </div>
          <div className="control-group">
            <label>Rotation</label>
            <input type="number" defaultValue={0} step="1" />
          </div>
        </div>
      </div>

      {/* Opacity Animation Section */}
      <div className="properties-section">
        <div className="section-header">
          <h4>Opacity</h4>
        </div>
        <div className="control-group">
          <label>Opacity</label>
          <input type="range" min="0" max="100" defaultValue={100} />
          <span className="value">100%</span>
        </div>
      </div>

      {/* Effects Animation Section */}
      <div className="properties-section">
        <div className="section-header">
          <h4>Effects</h4>
          <button className="add-btn">+</button>
        </div>
        <div className="effects-list">
          <div className="effect-item">
            <span className="effect-name">Blur</span>
            <div className="effect-controls">
              <input type="range" min="0" max="20" defaultValue={5} />
              <span className="value">5px</span>
            </div>
          </div>
          <div className="effect-item">
            <span className="effect-name">Glow</span>
            <div className="effect-controls">
              <input type="range" min="0" max="50" defaultValue={10} />
              <span className="value">10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timing Section */}
      <div className="properties-section">
        <div className="section-header">
          <h4>Timing</h4>
        </div>
        <div className="timing-controls">
          <div className="control-group">
            <label>Duration</label>
            <input type="number" defaultValue={2.0} step="0.1" />
            <span className="unit">s</span>
          </div>
          <div className="control-group">
            <label>Delay</label>
            <input type="number" defaultValue={0} step="0.1" />
            <span className="unit">s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
