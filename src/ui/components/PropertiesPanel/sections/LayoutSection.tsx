import React from 'react'
import { SceneNode } from '@/types'

interface LayoutSectionProps {
  layer: SceneNode
  onUpdate: (updates: Partial<SceneNode>) => void
}

export function LayoutSection({ layer, onUpdate }: LayoutSectionProps) {
  const size = layer.properties as any // Using any for now to access width/height

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    onUpdate({
      properties: { ...layer.properties, [dimension]: value },
    })
  }

  return (
    <div className="properties-section">
      <div className="section-header">
        <h4>Layout</h4>
      </div>
      <div className="layout-controls">
        <div className="control-group">
          <label>W</label>
          <input
            type="number"
            value={Math.round(size.width || 100)}
            onChange={(e) =>
              handleSizeChange('width', parseFloat(e.target.value) || 100)
            }
            step="1"
          />
        </div>
        <div className="control-group">
          <label>H</label>
          <input
            type="number"
            value={Math.round(size.height || 100)}
            onChange={(e) =>
              handleSizeChange('height', parseFloat(e.target.value) || 100)
            }
            step="1"
          />
        </div>
        <div className="size-info">
          <span>
            {Math.round(size.width || 100)} × {Math.round(size.height || 100)}
          </span>
        </div>
      </div>
    </div>
  )
}
