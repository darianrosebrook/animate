/**
 * @fileoverview Color Picker Popover for the Context Pane
 * @author @darianrosebrook
 */

import React, { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { Color } from '@/types'

interface ColorPickerPopoverProps {
  target: HTMLElement
  initialColor: Color
  onColorChange: (color: Color) => void
  onClose: () => void
}

export function ColorPickerPopover({
  target,
  initialColor,
  onColorChange,
  onClose,
}: ColorPickerPopoverProps) {
  const [color, setColor] = useState<Color>(initialColor)
  const [activeTab, setActiveTab] = useState<'swatches' | 'hsl' | 'rgb'>(
    'swatches'
  )

  const handleColorChange = useCallback(
    (newColor: Color) => {
      setColor(newColor)
      onColorChange(newColor)
    },
    [onColorChange]
  )

  const handleHexChange = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const a = hex.length > 7 ? parseInt(hex.slice(7, 9), 16) / 255 : 1

    handleColorChange({ r, g, b, a })
  }

  const predefinedColors = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500',
    '#800080',
    '#FFC0CB',
    '#A52A2A',
    '#808080',
    '#C0C0C0',
    '#000080',
  ]

  return (
    <div className="popover-overlay" onClick={onClose}>
      <div
        className="color-picker-popover"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: target.getBoundingClientRect().right + 10,
          top: target.getBoundingClientRect().top,
          zIndex: 1001,
        }}
      >
        <div className="popover-header">
          <h4>Color Picker</h4>
          <button className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="popover-content">
          {/* Tabs */}
          <div className="popover-tabs">
            <button
              className={`popover-tab ${activeTab === 'swatches' ? 'active' : ''}`}
              onClick={() => setActiveTab('swatches')}
            >
              Swatches
            </button>
            <button
              className={`popover-tab ${activeTab === 'hsl' ? 'active' : ''}`}
              onClick={() => setActiveTab('hsl')}
            >
              HSL
            </button>
            <button
              className={`popover-tab ${activeTab === 'rgb' ? 'active' : ''}`}
              onClick={() => setActiveTab('rgb')}
            >
              RGB
            </button>
          </div>

          {/* Current Color Preview */}
          <div className="current-color">
            <div
              className="color-preview-large"
              style={{
                background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
              }}
            />
            <div className="color-values">
              <input
                type="text"
                value={`#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#000000"
              />
              <div className="rgb-values">
                <span>R: {color.r}</span>
                <span>G: {color.g}</span>
                <span>B: {color.b}</span>
                <span>A: {Math.round((color.a || 1) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'swatches' && (
            <div className="color-swatches">
              <div className="swatches-grid">
                {predefinedColors.map((hexColor) => (
                  <button
                    key={hexColor}
                    className="color-swatch"
                    style={{ background: hexColor }}
                    onClick={() => handleHexChange(hexColor)}
                    title={hexColor}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rgb' && (
            <div className="color-controls">
              <div className="control-group">
                <label>Red</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.r}
                  onChange={(e) =>
                    handleColorChange({ ...color, r: parseInt(e.target.value) })
                  }
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={color.r}
                  onChange={(e) =>
                    handleColorChange({
                      ...color,
                      r: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="control-group">
                <label>Green</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.g}
                  onChange={(e) =>
                    handleColorChange({ ...color, g: parseInt(e.target.value) })
                  }
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={color.g}
                  onChange={(e) =>
                    handleColorChange({
                      ...color,
                      g: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="control-group">
                <label>Blue</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.b}
                  onChange={(e) =>
                    handleColorChange({ ...color, b: parseInt(e.target.value) })
                  }
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={color.b}
                  onChange={(e) =>
                    handleColorChange({
                      ...color,
                      b: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="control-group">
                <label>Alpha</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={color.a}
                  onChange={(e) =>
                    handleColorChange({
                      ...color,
                      a: parseFloat(e.target.value),
                    })
                  }
                />
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={color.a}
                  onChange={(e) =>
                    handleColorChange({
                      ...color,
                      a: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          )}

          {activeTab === 'hsl' && (
            <div className="color-controls">
              <div className="control-group">
                <label>Hue</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={Math.round(
                    (color.r * 0.3 + color.g * 0.59 + color.b * 0.11) * 360
                  )}
                  onChange={(e) => {
                    // Simplified HSL conversion - in real implementation would use proper conversion
                    const hue = parseInt(e.target.value)
                    handleColorChange({
                      ...color,
                      r: Math.round((hue * 255) / 360),
                    })
                  }}
                />
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={Math.round(
                    (color.r * 0.3 + color.g * 0.59 + color.b * 0.11) * 360
                  )}
                  onChange={(e) => {
                    const hue = parseInt(e.target.value) || 0
                    handleColorChange({
                      ...color,
                      r: Math.round((hue * 255) / 360),
                    })
                  }}
                />
              </div>
              <div className="control-group">
                <label>Saturation</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={50}
                  onChange={(e) => {
                    // Simplified - in real implementation would calculate proper saturation
                  }}
                />
                <input type="number" min="0" max="100" value={50} />
              </div>
              <div className="control-group">
                <label>Lightness</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={50}
                  onChange={(e) => {
                    // Simplified - in real implementation would calculate proper lightness
                  }}
                />
                <input type="number" min="0" max="100" value={50} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
