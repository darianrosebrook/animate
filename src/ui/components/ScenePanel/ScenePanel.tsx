import React, { useState } from 'react'
import { Plus, Image, Type, Square, Circle } from 'lucide-react'
import { Scene, SceneNode, NodeType } from '@/types'
import './ScenePanel.css'

interface ScenePanelProps {
  scenes: Scene[]
  currentSceneId: string | null
  onSceneSelect: (sceneId: string) => void
  onSceneAdd: () => void
  onLayerAdd: (sceneId: string, layer: SceneNode) => void
  onLayerSelect: (layerIds: string[]) => void
  selectedLayerIds: string[]
}

export function ScenePanel({
  scenes,
  currentSceneId,
  onSceneSelect,
  onSceneAdd,
  onLayerAdd,
  onLayerSelect,
  selectedLayerIds,
}: ScenePanelProps) {
  const [isAddingLayer, setIsAddingLayer] = useState(false)

  const handleLayerAdd = (type: NodeType) => {
    if (!currentSceneId) return

    const layer = createLayerByType(type)
    onLayerAdd(currentSceneId, layer)
    setIsAddingLayer(false)
  }

  const handleLayerSelect = (layerId: string, event: React.MouseEvent) => {
    event.stopPropagation()

    if (event.metaKey || event.ctrlKey) {
      // Multi-select
      const newSelection = selectedLayerIds.includes(layerId)
        ? selectedLayerIds.filter((id) => id !== layerId)
        : [...selectedLayerIds, layerId]
      onLayerSelect(newSelection)
    } else {
      // Single select
      onLayerSelect([layerId])
    }
  }

  return (
    <div className="scene-panel">
      {/* Header */}
      <div className="scene-panel-header">
        <h3>Scenes</h3>
        <button className="add-scene-btn" onClick={onSceneAdd}>
          <Plus size={16} />
          New Scene
        </button>
      </div>

      {/* Scene List */}
      <div className="scenes-list">
        {scenes.map((scene, index) => (
          <div key={scene.id} className="scene-item">
            <div
              className={`scene-thumbnail ${currentSceneId === scene.id ? 'active' : ''}`}
              onClick={() => onSceneSelect(scene.id)}
            >
              <div className="scene-number">{index + 1}</div>
              {scene.thumbnail ? (
                <img src={scene.thumbnail} alt={scene.name} />
              ) : (
                <div className="scene-placeholder">
                  <Image size={24} />
                </div>
              )}
            </div>

            {/* Layer List for Current Scene */}
            {currentSceneId === scene.id && (
              <div className="layers-list">
                {scene.layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`layer-item ${
                      selectedLayerIds.includes(layer.id) ? 'selected' : ''
                    }`}
                    onClick={(e) => handleLayerSelect(layer.id, e)}
                  >
                    <div className="layer-icon">{getLayerIcon(layer.type)}</div>
                    <div className="layer-info">
                      <div className="layer-name">{layer.name}</div>
                      <div className="layer-type">{layer.type}</div>
                    </div>
                    <div className="layer-controls">
                      <button className="layer-visibility">
                        {layer.properties.visible !== false ? '👁' : '👁‍🗨'}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Layer Button */}
                <div className="add-layer-section">
                  <button
                    className="add-layer-btn"
                    onClick={() => setIsAddingLayer(!isAddingLayer)}
                  >
                    <Plus size={14} />
                    Add layer
                  </button>

                  {isAddingLayer && (
                    <div className="layer-type-selector">
                      <button onClick={() => handleLayerAdd(NodeType.Shape)}>
                        <Square size={16} />
                        Rectangle
                      </button>
                      <button onClick={() => handleLayerAdd(NodeType.Shape)}>
                        <Circle size={16} />
                        Ellipse
                      </button>
                      <button onClick={() => handleLayerAdd(NodeType.Text)}>
                        <Type size={16} />
                        Text
                      </button>
                      <button onClick={() => handleLayerAdd(NodeType.Media)}>
                        <Image size={16} />
                        Image/Video
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function createLayerByType(type: NodeType): SceneNode {
  const id = `layer-${Date.now()}`
  const baseLayer = {
    id,
    name: `${type} ${Math.floor(Math.random() * 1000)}`,
    type,
    properties: {
      visible: true,
      opacity: 1,
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
    },
    children: [],
  }

  switch (type) {
    case NodeType.Text:
      return {
        ...baseLayer,
        properties: {
          ...baseLayer.properties,
          text: 'Text Layer',
          fontSize: 24,
          fontFamily: 'Inter',
          fillColor: { r: 0, g: 0, b: 0, a: 1 },
        },
      }

    case NodeType.Shape:
      return {
        ...baseLayer,
        properties: {
          ...baseLayer.properties,
          shapeType: 'rectangle',
          width: 100,
          height: 100,
          fillColor: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
          strokeColor: { r: 0, g: 0, b: 0, a: 1 },
          strokeWidth: 2,
        },
      }

    default:
      return baseLayer
  }
}

function getLayerIcon(type: NodeType): React.ReactNode {
  switch (type) {
    case NodeType.Text:
      return <Type size={14} />
    case NodeType.Shape:
      return <Square size={14} />
    case NodeType.Media:
      return <Image size={14} />
    default:
      return <div className="layer-icon-placeholder" />
  }
}
