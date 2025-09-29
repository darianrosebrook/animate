import React from 'react'
import { SceneNode } from '@/types'
import { PositionSection } from './sections/PositionSection'
import { LayoutSection } from './sections/LayoutSection'
import { AppearanceSection } from './sections/AppearanceSection'
import { TypographySection } from './sections/TypographySection'
import { FillSection } from './sections/FillSection'
import { StrokeSection } from './sections/StrokeSection'
import { EffectsSection } from './sections/EffectsSection'

interface DesignPanelProps {
  selectedLayers: SceneNode[]
  onLayerUpdate: (layerId: string, updates: Partial<SceneNode>) => void
}

export function DesignPanel({
  selectedLayers,
  onLayerUpdate,
}: DesignPanelProps) {
  if (selectedLayers.length === 0) {
    return (
      <div className="design-panel-empty">
        <p>Select a layer to edit its properties</p>
      </div>
    )
  }

  const layer = selectedLayers[0] // For now, work with single selection

  return (
    <div className="design-panel">
      {/* Composition Style Section */}
      <div className="properties-section">
        <div className="section-header">
          <h4>Composition Style</h4>
        </div>
        <div className="composition-style-grid">
          <div className="composition-item">
            <div className="composition-preview">
              <div className="composition-box"></div>
            </div>
            <span className="composition-name">Scene Style</span>
          </div>
        </div>
      </div>

      {/* Position Section */}
      <PositionSection
        layer={layer}
        onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
      />

      {/* Layout Section */}
      <LayoutSection
        layer={layer}
        onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
      />

      {/* Appearance Section */}
      <AppearanceSection
        layer={layer}
        onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
      />

      {/* Typography Section (for text layers) */}
      {layer.type === 'text' && (
        <TypographySection
          layer={layer}
          onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
        />
      )}

      {/* Fill Section */}
      <FillSection
        layer={layer}
        onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
      />

      {/* Stroke Section */}
      <StrokeSection
        layer={layer}
        onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
      />

      {/* Effects Section */}
      <EffectsSection
        layer={layer}
        onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
      />

      {/* Export Section */}
      <div className="properties-section">
        <div className="section-header">
          <h4>Export</h4>
          <button className="add-btn">+</button>
        </div>
      </div>
    </div>
  )
}
