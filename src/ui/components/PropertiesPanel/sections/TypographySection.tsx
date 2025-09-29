import React from 'react'
import { SceneNode } from '@/types'

interface TypographySectionProps {
  layer: SceneNode
  onUpdate: (updates: Partial<SceneNode>) => void
}

export function TypographySection({ layer }: TypographySectionProps) {
  return (
    <div className="properties-section">
      <div className="section-header">
        <h4>Typography</h4>
      </div>
      <div className="typography-controls">
        <div className="control-group">
          <label>Font</label>
          <select defaultValue="Inter">
            <option>Inter</option>
            <option>Roboto</option>
            <option>Helvetica</option>
          </select>
        </div>
        <div className="control-group">
          <label>Size</label>
          <input type="number" defaultValue={24} step="1" />
        </div>
        <div className="control-group">
          <label>Weight</label>
          <select defaultValue="normal">
            <option>Light</option>
            <option>Normal</option>
            <option>Bold</option>
          </select>
        </div>
      </div>
    </div>
  )
}
