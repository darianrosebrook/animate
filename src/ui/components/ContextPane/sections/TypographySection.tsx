/**
 * @fileoverview Typography section for the Context Pane
 * @author @darianrosebrook
 */

import React from 'react'
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react'
import { SceneNode, NodeType } from '@/types'

interface TypographySectionProps {
  layer: SceneNode
  onUpdate: (updates: Partial<SceneNode>) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function TypographySection({
  layer,
  onUpdate,
  isCollapsed,
  onToggleCollapse,
}: TypographySectionProps) {
  // Only show for text layers
  if (layer.type !== NodeType.Text) return null

  const fontFamily = (layer.properties.fontFamily as string) || 'Inter'
  const fontSize = (layer.properties.fontSize as number) || 16
  const lineHeight = (layer.properties.lineHeight as number) || 1.2
  const letterSpacing = (layer.properties.letterSpacing as number) || 0
  const fontWeight = (layer.properties.fontWeight as string) || 'normal'
  const fontStyle = (layer.properties.fontStyle as string) || 'normal'
  const textAlign = (layer.properties.textAlign as string) || 'left'

  const handleFontChange = (property: string, value: any) => {
    onUpdate({
      properties: { ...layer.properties, [property]: value },
    })
  }

  const fontWeights = [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: 'normal', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' },
  ]

  const fontStyles = [
    { value: 'normal', label: 'Normal' },
    { value: 'italic', label: 'Italic' },
    { value: 'oblique', label: 'Oblique' },
  ]

  const textAlignments = [
    { value: 'left', icon: AlignLeft, label: 'Left' },
    { value: 'center', icon: AlignCenter, label: 'Center' },
    { value: 'right', icon: AlignRight, label: 'Right' },
    { value: 'justify', icon: AlignJustify, label: 'Justify' },
  ]

  return (
    <div className={`properties-section ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={onToggleCollapse}>
        <h4>Typography</h4>
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
          {/* Font Family */}
          <div className="control-group">
            <label>Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => handleFontChange('fontFamily', e.target.value)}
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="control-group">
            <label>Size</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={fontSize}
                onChange={(e) =>
                  handleFontChange('fontSize', parseFloat(e.target.value) || 0)
                }
                min="1"
                max="500"
                step="1"
                style={{ flex: 1 }}
              />
              <span className="unit">px</span>
            </div>
          </div>

          {/* Line Height */}
          <div className="control-group">
            <label>Line Height</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={lineHeight}
                onChange={(e) =>
                  handleFontChange(
                    'lineHeight',
                    parseFloat(e.target.value) || 0
                  )
                }
                min="0.5"
                max="3"
                step="0.1"
                style={{ flex: 1 }}
              />
              <span className="value-display">
                {Math.round(lineHeight * 100)}%
              </span>
            </div>
          </div>

          {/* Letter Spacing */}
          <div className="control-group">
            <label>Letter Spacing</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={letterSpacing}
                onChange={(e) =>
                  handleFontChange(
                    'letterSpacing',
                    parseFloat(e.target.value) || 0
                  )
                }
                min="-10"
                max="10"
                step="0.1"
                style={{ flex: 1 }}
              />
              <span className="unit">px</span>
            </div>
          </div>

          {/* Font Weight & Style */}
          <div className="control-group">
            <div className="control-grid control-grid-2">
              <div>
                <label>Weight</label>
                <select
                  value={fontWeight}
                  onChange={(e) =>
                    handleFontChange('fontWeight', e.target.value)
                  }
                >
                  {fontWeights.map((weight) => (
                    <option key={weight.value} value={weight.value}>
                      {weight.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Style</label>
                <select
                  value={fontStyle}
                  onChange={(e) =>
                    handleFontChange('fontStyle', e.target.value)
                  }
                >
                  {fontStyles.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Text Alignment */}
          <div className="control-group">
            <label>Alignment</label>
            <div className="alignment-controls">
              {textAlignments.map((alignment) => {
                const IconComponent = alignment.icon
                return (
                  <button
                    key={alignment.value}
                    className={`btn-icon ${textAlign === alignment.value ? 'active' : ''}`}
                    title={alignment.label}
                    onClick={() =>
                      handleFontChange('textAlign', alignment.value)
                    }
                  >
                    <IconComponent size={16} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
