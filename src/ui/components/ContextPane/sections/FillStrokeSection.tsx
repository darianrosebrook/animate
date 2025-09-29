/**
 * @fileoverview Fill and Stroke section for the Context Pane
 * @author @darianrosebrook
 */

import React from 'react'
import { Palette, Minus } from 'lucide-react'
import { SceneNode, Color } from '@/types'

interface FillStrokeSectionProps {
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

export function FillStrokeSection({
  layer,
  onUpdate,
  onPopoverOpen,
  isCollapsed,
  onToggleCollapse,
}: FillStrokeSectionProps) {
  const fill = (layer.properties.fill as Color) || {
    r: 255,
    g: 255,
    b: 255,
    a: 1,
  }
  const stroke = (layer.properties.stroke as any) || null
  const strokeWidth = (layer.properties.strokeWidth as number) || 0

  const handleFillClick = (event: React.MouseEvent) => {
    onPopoverOpen('color', event.currentTarget as HTMLElement, fill)
  }

  const handleStrokeWidthChange = (value: number) => {
    onUpdate({
      properties: { ...layer.properties, strokeWidth: Math.max(0, value) },
    })
  }

  const handleStrokeClick = (event: React.MouseEvent) => {
    if (stroke) {
      onPopoverOpen('color', event.currentTarget as HTMLElement, stroke)
    }
  }

  return (
    <div className={`properties-section ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={onToggleCollapse}>
        <h4>Fill & Stroke</h4>
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
          {/* Fill */}
          <div className="control-group">
            <label>Fill</label>
            <button
              className="color-preview-btn"
              onClick={handleFillClick}
              title="Edit fill color"
            >
              <div
                className="color-preview"
                style={{
                  background: `rgba(${fill.r}, ${fill.g}, ${fill.b}, ${fill.a})`,
                }}
              />
              <Palette size={14} />
            </button>
          </div>

          {/* Stroke */}
          <div className="control-group">
            <label>Stroke</label>
            <div className="stroke-controls">
              <div className="stroke-color">
                <button
                  className="color-preview-btn"
                  onClick={handleStrokeClick}
                  title="Edit stroke color"
                  disabled={!stroke}
                >
                  <div
                    className="color-preview"
                    style={{
                      background: stroke
                        ? `rgba(${stroke.r}, ${stroke.g}, ${stroke.b}, ${stroke.a})`
                        : 'transparent',
                      border: stroke
                        ? 'none'
                        : '1px dashed rgba(255, 255, 255, 0.3)',
                    }}
                  />
                  <Minus size={14} />
                </button>
              </div>
              <div className="stroke-width">
                <input
                  type="number"
                  value={strokeWidth}
                  onChange={(e) =>
                    handleStrokeWidthChange(parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  max="100"
                  step="1"
                  placeholder="Width"
                />
                <span className="unit">px</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
