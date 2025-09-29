/**
 * @fileoverview New Item Menu component for the Left Panel
 * @author @darianrosebrook
 */

import React from 'react'
import {
  Plus,
  ChevronDown,
  Image,
  Type,
  Square,
  Circle,
  Layers,
  Folder,
} from 'lucide-react'
import { ViewMode, NodeType } from '@/types'

interface NewItemMenuProps {
  isOpen: boolean
  onToggle: () => void
  viewMode: ViewMode
  onSceneAdd: () => void
  onLayerAdd: (type: NodeType) => void
}

export function NewItemMenu({
  isOpen,
  onToggle,
  viewMode,
  onSceneAdd,
  onLayerAdd,
}: NewItemMenuProps) {
  const handleLayerAdd = (type: NodeType) => {
    onLayerAdd(type)
    onToggle()
  }

  const layerTypes = [
    { type: NodeType.Text, icon: Type, label: 'Text', shortcut: 'T' },
    { type: NodeType.Shape, icon: Square, label: 'Rectangle', shortcut: 'R' },
    { type: NodeType.Shape, icon: Circle, label: 'Ellipse', shortcut: 'E' },
    { type: NodeType.Media, icon: Image, label: 'Image/Video', shortcut: 'I' },
    { type: NodeType.Group, icon: Folder, label: 'Group', shortcut: 'G' },
  ]

  return (
    <div className="new-item-menu">
      <button
        className={`new-item-btn ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
        title={
          viewMode === ViewMode.SceneByScene
            ? 'Add scene or section'
            : 'Add layer'
        }
      >
        <Plus size={16} />
        <span>New</span>
        <ChevronDown
          size={12}
          className={`chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="new-item-dropdown">
          {viewMode === ViewMode.SceneByScene ? (
            // Storyboard mode - scenes and sections
            <>
              <button className="dropdown-item" onClick={onSceneAdd}>
                <Layers size={14} />
                <span>New Scene</span>
                <span className="shortcut">⌘N</span>
              </button>
              <button className="dropdown-item" disabled>
                <Folder size={14} />
                <span>New Section</span>
                <span className="shortcut">⌘⇧N</span>
              </button>
            </>
          ) : (
            // Scene editor mode - layers
            <>
              {layerTypes.map((layerType) => {
                const IconComponent = layerType.icon
                return (
                  <button
                    key={layerType.type}
                    className="dropdown-item"
                    onClick={() => handleLayerAdd(layerType.type)}
                  >
                    <IconComponent size={14} />
                    <span>{layerType.label}</span>
                    <span className="shortcut">{layerType.shortcut}</span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
