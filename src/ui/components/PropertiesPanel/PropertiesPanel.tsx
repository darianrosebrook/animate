import React, { useState } from 'react'
import { UIMode, SceneNode } from '@/types'
import { DesignPanel } from './DesignPanel'
import { AnimatePanel } from './AnimatePanel'
import './PropertiesPanel.css'

interface PropertiesPanelProps {
  mode: UIMode
  selectedLayers: SceneNode[]
  onLayerUpdate: (layerId: string, updates: Partial<SceneNode>) => void
}

export function PropertiesPanel({
  mode,
  selectedLayers,
  onLayerUpdate,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'design' | 'animate'>('design')

  // Auto-switch to appropriate tab based on mode
  React.useEffect(() => {
    if (mode === UIMode.Design && activeTab !== 'design') {
      setActiveTab('design')
    } else if (mode === UIMode.Animate && activeTab !== 'animate') {
      setActiveTab('animate')
    }
  }, [mode, activeTab])

  const handleTabClick = (tab: 'design' | 'animate') => {
    setActiveTab(tab)
  }

  return (
    <div className="properties-panel">
      {/* Tab Navigation */}
      <div className="properties-tabs">
        <button
          className={`properties-tab ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => handleTabClick('design')}
        >
          Design
        </button>
        <button
          className={`properties-tab ${activeTab === 'animate' ? 'active' : ''}`}
          onClick={() => handleTabClick('animate')}
        >
          Animate
          {selectedLayers.length > 0 && (
            <span className="tab-badge">
              {Math.round(Math.random() * 100)}%
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="properties-content">
        {activeTab === 'design' ? (
          <DesignPanel
            selectedLayers={selectedLayers}
            onLayerUpdate={onLayerUpdate}
          />
        ) : (
          <AnimatePanel
            selectedLayers={selectedLayers}
            onLayerUpdate={onLayerUpdate}
          />
        )}
      </div>
    </div>
  )
}
