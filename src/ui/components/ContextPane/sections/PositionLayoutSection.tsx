/**
 * @fileoverview Position and Layout section for the Context Pane
 * @author @darianrosebrook
 */

import React from 'react'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
} from 'lucide-react'
import { SceneNode, Point2D } from '@/types'

interface PositionLayoutSectionProps {
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

export function PositionLayoutSection({
  layer,
  onUpdate,
  _onPopoverOpen,
  isCollapsed,
  onToggleCollapse,
}: PositionLayoutSectionProps) {
  const position = (layer.properties.position as Point2D) || { x: 0, y: 0 }
  const scale = (layer.properties.scale as Point2D) || { x: 1, y: 1 }
  const rotation = (layer.properties.rotation as number) || 0
  const size = (layer.properties.size as any) || { width: 100, height: 100 }

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    const newPosition = { ...position, [axis]: value }
    onUpdate({
      properties: { ...layer.properties, position: newPosition },
    })
  }

  const handleScaleChange = (axis: 'x' | 'y', value: number) => {
    const newScale = { ...scale, [axis]: value }
    onUpdate({
      properties: { ...layer.properties, scale: newScale },
    })
  }

  const handleRotationChange = (value: number) => {
    onUpdate({
      properties: { ...layer.properties, rotation: value },
    })
  }

  const handleSizeChange = (axis: 'width' | 'height', value: number) => {
    const newSize = { ...size, [axis]: value }
    onUpdate({
      properties: { ...layer.properties, size: newSize },
    })
  }

  const handleAlignment = (_alignment: string) => {
    // PLACEHOLDER: Alignment logic - requires canvas bounds calculation and node positioning
    throw new Error(
      'PLACEHOLDER: Alignment logic not implemented - requires canvas bounds calculation and node positioning system'
    )
  }

  return (
    <div className={`properties-section ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={onToggleCollapse}>
        <h4>Position & Layout</h4>
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
          {/* Position Controls */}
          <div className="control-group">
            <label>Position</label>
            <div className="control-grid control-grid-2">
              <div>
                <input
                  type="number"
                  value={Math.round(position.x)}
                  onChange={(e) =>
                    handlePositionChange('x', parseFloat(e.target.value) || 0)
                  }
                  step="1"
                  placeholder="X"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={Math.round(position.y)}
                  onChange={(e) =>
                    handlePositionChange('y', parseFloat(e.target.value) || 0)
                  }
                  step="1"
                  placeholder="Y"
                />
              </div>
            </div>
          </div>

          {/* Size Controls */}
          <div className="control-group">
            <label>Size</label>
            <div className="control-grid control-grid-2">
              <div>
                <input
                  type="number"
                  value={Math.round(size.width)}
                  onChange={(e) =>
                    handleSizeChange('width', parseFloat(e.target.value) || 0)
                  }
                  step="1"
                  placeholder="W"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={Math.round(size.height)}
                  onChange={(e) =>
                    handleSizeChange('height', parseFloat(e.target.value) || 0)
                  }
                  step="1"
                  placeholder="H"
                />
              </div>
            </div>
          </div>

          {/* Scale Controls */}
          <div className="control-group">
            <label>Scale</label>
            <div className="control-grid control-grid-2">
              <div>
                <input
                  type="number"
                  value={Math.round(scale.x * 100)}
                  onChange={(e) =>
                    handleScaleChange(
                      'x',
                      (parseFloat(e.target.value) || 0) / 100
                    )
                  }
                  step="1"
                  min="0"
                  max="1000"
                  placeholder="X%"
                />
                <span className="unit">%</span>
              </div>
              <div>
                <input
                  type="number"
                  value={Math.round(scale.y * 100)}
                  onChange={(e) =>
                    handleScaleChange(
                      'y',
                      (parseFloat(e.target.value) || 0) / 100
                    )
                  }
                  step="1"
                  min="0"
                  max="1000"
                  placeholder="Y%"
                />
                <span className="unit">%</span>
              </div>
            </div>
            <div className="scale-uniform">
              <label>
                <input
                  type="checkbox"
                  defaultChecked={scale.x === scale.y}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const uniformScale = scale.x
                      handleScaleChange('y', uniformScale)
                    }
                  }}
                />
                Uniform scale
              </label>
            </div>
          </div>

          {/* Rotation Control */}
          <div className="control-group">
            <label>Rotation</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={Math.round(rotation)}
                onChange={(e) =>
                  handleRotationChange(parseFloat(e.target.value) || 0)
                }
                step="1"
                min="-360"
                max="360"
                style={{ flex: 1 }}
              />
              <span className="unit">°</span>
            </div>
          </div>

          {/* Anchor Point Controls */}
          <div className="control-group">
            <label>Anchor Point</label>
            <div className="anchor-controls">
              <div className="anchor-grid">
                {[
                  { label: 'Top Left', x: 0, y: 0 },
                  { label: 'Top Center', x: 0.5, y: 0 },
                  { label: 'Top Right', x: 1, y: 0 },
                  { label: 'Center Left', x: 0, y: 0.5 },
                  { label: 'Center', x: 0.5, y: 0.5 },
                  { label: 'Center Right', x: 1, y: 0.5 },
                  { label: 'Bottom Left', x: 0, y: 1 },
                  { label: 'Bottom Center', x: 0.5, y: 1 },
                  { label: 'Bottom Right', x: 1, y: 1 },
                ].map((anchor) => (
                  <button
                    key={`${anchor.x}-${anchor.y}`}
                    className="anchor-btn"
                    title={anchor.label}
                    onClick={() => {
                      onUpdate({
                        properties: {
                          ...layer.properties,
                          anchorPoint: { x: anchor.x, y: anchor.y },
                        },
                      })
                    }}
                  >
                    <div className="anchor-visual">
                      <div
                        className="anchor-point"
                        style={{
                          left: `${anchor.x * 100}%`,
                          top: `${anchor.y * 100}%`,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alignment Controls */}
          <div className="control-group">
            <label>Align</label>
            <div className="alignment-controls">
              <div className="alignment-row">
                <button
                  className="btn-icon"
                  title="Align Left"
                  onClick={() => handleAlignment('left')}
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  className="btn-icon"
                  title="Align Center"
                  onClick={() => handleAlignment('center')}
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  className="btn-icon"
                  title="Align Right"
                  onClick={() => handleAlignment('right')}
                >
                  <AlignRight size={16} />
                </button>
              </div>
              <div className="alignment-row">
                <button
                  className="btn-icon"
                  title="Align Top"
                  onClick={() => handleAlignment('top')}
                >
                  <AlignStartVertical size={16} />
                </button>
                <button
                  className="btn-icon"
                  title="Align Middle"
                  onClick={() => handleAlignment('middle')}
                >
                  <AlignCenterVertical size={16} />
                </button>
                <button
                  className="btn-icon"
                  title="Align Bottom"
                  onClick={() => handleAlignment('bottom')}
                >
                  <AlignEndVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
