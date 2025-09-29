import React from 'react'
import { SceneNode } from '@/types'

interface StrokeSectionProps {
  layer: SceneNode
  onUpdate: (updates: Partial<SceneNode>) => void
}

export function StrokeSection({ layer }: StrokeSectionProps) {
  return (
    <div className="properties-section">
      <div className="section-header">
        <h4>Stroke</h4>
        <button className="add-btn">+</button>
      </div>
      <div className="stroke-controls">
        <p>Stroke properties will be implemented here</p>
      </div>
    </div>
  )
}
