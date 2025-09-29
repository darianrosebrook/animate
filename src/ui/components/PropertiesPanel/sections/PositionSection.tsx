import React from 'react'
import { SceneNode, Point2D } from '@/types'

interface PositionSectionProps {
  layer: SceneNode
  onUpdate: (updates: Partial<SceneNode>) => void
}

export function PositionSection({ layer, onUpdate }: PositionSectionProps) {
  const position = (layer.properties.position as Point2D) || { x: 0, y: 0 }

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    const newPosition = { ...position, [axis]: value }
    onUpdate({
      properties: { ...layer.properties, position: newPosition },
    })
  }

  return (
    <div className="properties-section">
      <div className="section-header">
        <h4>Position</h4>
      </div>
      <div className="position-controls">
        <div className="control-group">
          <label>X</label>
          <input
            type="number"
            value={Math.round(position.x)}
            onChange={(e) =>
              handlePositionChange('x', parseFloat(e.target.value) || 0)
            }
            step="1"
          />
        </div>
        <div className="control-group">
          <label>Y</label>
          <input
            type="number"
            value={Math.round(position.y)}
            onChange={(e) =>
              handlePositionChange('y', parseFloat(e.target.value) || 0)
            }
            step="1"
          />
        </div>
      </div>
    </div>
  )
}
