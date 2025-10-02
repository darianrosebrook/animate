import React from 'react'
import { SceneNode } from '@/types'

interface EffectsSectionProps {
  layer: SceneNode
}

export function EffectsSection({ layer: _layer }: EffectsSectionProps) {
  return (
    <div className="properties-section">
      <div className="section-header">
        <h4>Effects</h4>
        <button className="add-btn">+</button>
      </div>
      <div className="effects-controls">
        <p>Visual effects will be implemented here</p>
      </div>
    </div>
  )
}
