import React from 'react'
import { SceneNode } from '@/types'

interface AppearanceSectionProps {
  layer: SceneNode
  onUpdate: (updates: Partial<SceneNode>) => void
}

export function AppearanceSection({ layer, onUpdate }: AppearanceSectionProps) {
  const opacity = (layer.properties.opacity as number) || 1

  const handleOpacityChange = (value: number) => {
    onUpdate({
      properties: {
        ...layer.properties,
        opacity: Math.max(0, Math.min(1, value / 100)),
      },
    })
  }

  return (
    <div className="properties-section">
      <div className="section-header">
        <h4>Appearance</h4>
      </div>
      <div className="appearance-controls">
        <div className="control-group">
          <label>Opacity</label>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
          />
          <span className="value">{Math.round(opacity * 100)}%</span>
        </div>
      </div>
    </div>
  )
}
