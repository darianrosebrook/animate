import React from 'react'
import { SceneNode, Color } from '@/types'

interface FillSectionProps {
  layer: SceneNode
  onUpdate: (updates: Partial<SceneNode>) => void
}

export function FillSection({ layer }: FillSectionProps) {
  const fillColor = (layer.properties.fillColor as Color) || {
    r: 0.5,
    g: 0.5,
    b: 0.5,
    a: 1,
  }

  return (
    <div className="properties-section">
      <div className="section-header">
        <h4>Fill</h4>
      </div>
      <div className="fill-controls">
        <div
          className="color-preview"
          style={{
            backgroundColor: `rgba(${Math.round(fillColor.r * 255)}, ${Math.round(fillColor.g * 255)}, ${Math.round(fillColor.b * 255)}, ${fillColor.a})`,
          }}
        ></div>
        <div className="control-group">
          <label>Color</label>
          <input
            type="color"
            defaultValue={`#${Math.round(fillColor.r * 255)
              .toString(16)
              .padStart(2, '0')}${Math.round(fillColor.g * 255)
              .toString(16)
              .padStart(2, '0')}${Math.round(fillColor.b * 255)
              .toString(16)
              .padStart(2, '0')}`}
          />
        </div>
      </div>
    </div>
  )
}
