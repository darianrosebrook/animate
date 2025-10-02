/**
 * @fileoverview Left Panel - Project Navigator and Hierarchy Inspector
 * @author @darianrosebrook
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  Layers,
  Image,
  Type,
  Square,
  Zap,
} from 'lucide-react'
import { Scene, SceneNode, NodeType, ViewMode, Project, UIMode } from '@/types'
import { StoryboardView } from './views/StoryboardView'
import { SceneEditorView } from './views/SceneEditorView'
import { AssetLibraryView } from './views/AssetLibraryView'
import { ContextMenu } from '../ContextMenu/ContextMenu'
import { SearchFilter } from './components/SearchFilter'
import { NewItemMenu } from './components/NewItemMenu'
import './LeftPanel.css'

export interface LeftPanelProps {
  project: Project
  currentScene: Scene | null
  selectedLayers: SceneNode[]
  viewMode: ViewMode
  mode: UIMode
  onViewModeChange: (mode: ViewMode) => void
  onSceneSelect: (sceneId: string) => void
  onSceneAdd: () => void
  onSceneUpdate: (sceneId: string, updates: Partial<Scene>) => void
  onSceneDelete: (sceneId: string) => void
  onSceneReorder: (sceneIds: string[]) => void
  onLayerAdd: (sceneId: string, layer: SceneNode, parentId?: string) => void
  onLayerUpdate: (layerId: string, updates: Partial<SceneNode>) => void
  onLayerDelete: (layerId: string) => void
  onLayerSelect: (layerIds: string[]) => void
  onLayerReorder: (sceneId: string, layerIds: string[]) => void
  onLayerReparent: (layerId: string, newParentId: string | null) => void
  onLayerRename?: (layerId: string, newName: string) => void
  onLayerZoomToFit?: (layerIds: string[]) => void
  onZoomToFit?: (layerIds: string[]) => void
  className?: string
}

type ContextMenuType = 'scene' | 'layer' | 'section' | null

interface ContextMenuState {
  type: ContextMenuType
  target: HTMLElement | null
  data?: any
}

export function LeftPanel({
  project,
  currentScene,
  selectedLayers,
  viewMode,
  _mode,
  onViewModeChange,
  onSceneSelect,
  onSceneAdd,
  onSceneUpdate,
  onSceneDelete,
  onSceneReorder,
  onLayerAdd,
  onLayerUpdate,
  onLayerDelete,
  onLayerSelect,
  onLayerReorder,
  onLayerReparent,
  _onLayerRename,
  _onLayerZoomToFit,
  _onZoomToFit,
  className = '',
}: LeftPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    type: null,
    target: null,
  })
  const [newItemMenuOpen, setNewItemMenuOpen] = useState(false)
  const [filterState, setFilterState] = useState({
    showHidden: false,
    showLocked: false,
    typeFilters: new Set<NodeType>(),
    statusFilters: new Set<string>(),
  })

  // Filter scenes based on search and filters
  const filteredScenes = useMemo(() => {
    let filtered = project.scenes

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (scene) =>
          scene.name.toLowerCase().includes(query) ||
          scene.id.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [project.scenes, searchQuery])

  // Filter layers based on search and filters
  const getFilteredLayers = useCallback(
    (scene: Scene) => {
      let layers = scene.layers

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        layers = layers.filter(
          (layer) =>
            layer.name.toLowerCase().includes(query) ||
            layer.type.toLowerCase().includes(query) ||
            layer.id.toLowerCase().includes(query)
        )
      }

      // Apply type filters
      if (filterState.typeFilters.size > 0) {
        layers = layers.filter((layer) =>
          filterState.typeFilters.has(layer.type)
        )
      }

      // Apply status filters
      if (!filterState.showHidden) {
        layers = layers.filter((layer) => layer.properties.visible !== false)
      }

      if (!filterState.showLocked) {
        layers = layers.filter((layer) => !layer.properties.locked)
      }

      return layers
    },
    [searchQuery, filterState]
  )

  const handleContextMenu = useCallback(
    (type: ContextMenuType, target: HTMLElement, data?: any) => {
      setContextMenu({ type, target, data })
    },
    []
  )

  const handleContextMenuClose = useCallback(() => {
    setContextMenu({ type: null, target: null })
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleFilterChange = useCallback(
    (newFilterState: typeof filterState) => {
      setFilterState(newFilterState)
    },
    []
  )

  const getLayerIcon = useCallback((type: NodeType) => {
    switch (type) {
      case NodeType.Text:
        return <Type size={14} />
      case NodeType.Shape:
        return <Square size={14} />
      case NodeType.Media:
        return <Image size={14} />
      case NodeType.Group:
        return <Folder size={14} />
      case NodeType.Effect:
        return <Zap size={14} />
      case NodeType.Camera:
        return <Camera size={14} />
      default:
        return <div className="layer-icon-placeholder" />
    }
  }, [])

  const getLayerBadge = useCallback(
    (
      layer: SceneNode
    ): Array<{ type: string; icon: React.ReactNode; title: string }> => {
      const badges: Array<{
        type: string
        icon: React.ReactNode
        title: string
      }> = []

      if (layer.properties.locked) {
        badges.push({ type: 'lock', icon: <Lock size={10} />, title: 'Locked' })
      }

      if (layer.properties.visible === false) {
        badges.push({
          type: 'hidden',
          icon: <EyeOff size={10} />,
          title: 'Hidden',
        })
      }

      if (layer.children.length > 0) {
        badges.push({
          type: 'children',
          icon: <span className="child-count">{layer.children.length}</span>,
          title: `${layer.children.length} children`,
        })
      }

      // Add more badge types as needed
      if (layer.type === NodeType.Text && layer.properties.fontSize) {
        badges.push({
          type: 'text-size',
          icon: (
            <span className="text-size">
              {String(layer.properties.fontSize)}px
            </span>
          ),
          title: `Font size: ${layer.properties.fontSize}px`,
        })
      }

      return badges
    },
    []
  )

  const getAssetIcon = useCallback((asset: Asset) => {
    switch (asset.type) {
      case AssetType.Image:
        return <Image size={14} />
      case AssetType.Video:
        return <Video size={14} />
      case AssetType.Audio:
        return <Mic size={14} />
      case AssetType.Font:
        return <Type size={14} />
      case AssetType.Template:
        return <FileText size={14} />
      case AssetType.Plugin:
        return <Zap size={14} />
      case AssetType.AnimationSequence:
        return <Play size={14} />
      case AssetType.Render:
        return <Monitor size={14} />
      case AssetType.Component:
        return <Square size={14} />
      default:
        return <div className="asset-icon-placeholder" />
    }
  }, [])

  const renderContextMenu = () => {
    if (!contextMenu.type || !contextMenu.target) return null

    switch (contextMenu.type) {
      case 'scene':
        return (
          <ContextMenu
            isOpen={true}
            position={{ x: 0, y: 0 }}
            items={[
              {
                id: 'duplicate',
                label: 'Duplicate',
                icon: <Copy size={14} />,
                action: () => {
                  // Handle duplicate scene
                  handleContextMenuClose()
                },
              },
              {
                id: 'rename',
                label: 'Rename',
                icon: <Edit3 size={14} />,
                action: () => {
                  // Handle rename scene
                  handleContextMenuClose()
                },
              },
              {
                id: 'move',
                label: 'Move to...',
                icon: <Move size={14} />,
                action: () => {
                  // Handle move scene
                  handleContextMenuClose()
                },
              },
              {
                id: 'separator',
                label: '',
                separator: true,
              },
              {
                id: 'delete',
                label: 'Delete',
                icon: <Trash2 size={14} />,
                action: () => {
                  if (contextMenu.data?.sceneId) {
                    onSceneDelete(contextMenu.data.sceneId)
                  }
                  handleContextMenuClose()
                },
              },
            ]}
            onClose={handleContextMenuClose}
          />
        )

      case 'layer':
        return (
          <ContextMenu
            isOpen={true}
            position={{ x: 0, y: 0 }}
            items={[
              {
                id: 'duplicate',
                label: 'Duplicate',
                icon: <Copy size={14} />,
                action: () => {
                  // Handle duplicate layer
                  handleContextMenuClose()
                },
              },
              {
                id: 'rename',
                label: 'Rename',
                icon: <Edit3 size={14} />,
                action: () => {
                  // Handle rename layer
                  handleContextMenuClose()
                },
              },
              {
                id: 'group',
                label: 'Group Selection',
                icon: <Folder size={14} />,
                action: () => {
                  // Handle group selection
                  handleContextMenuClose()
                },
              },
              {
                id: 'separator1',
                label: '',
                separator: true,
              },
              {
                id: 'visibility',
                label:
                  selectedLayers[0]?.properties.visible !== false
                    ? 'Hide'
                    : 'Show',
                icon:
                  selectedLayers[0]?.properties.visible !== false ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  ),
                action: () => {
                  const layer = selectedLayers[0]
                  if (layer) {
                    onLayerUpdate(layer.id, {
                      properties: {
                        ...layer.properties,
                        visible: !layer.properties.visible,
                      },
                    })
                  }
                  handleContextMenuClose()
                },
              },
              {
                id: 'lock',
                label: selectedLayers[0]?.properties.locked ? 'Unlock' : 'Lock',
                icon: selectedLayers[0]?.properties.locked ? (
                  <Unlock size={14} />
                ) : (
                  <Lock size={14} />
                ),
                action: () => {
                  const layer = selectedLayers[0]
                  if (layer) {
                    onLayerUpdate(layer.id, {
                      properties: {
                        ...layer.properties,
                        locked: !layer.properties.locked,
                      },
                    })
                  }
                  handleContextMenuClose()
                },
              },
              {
                id: 'separator2',
                label: '',
                separator: true,
              },
              {
                id: 'delete',
                label: 'Delete',
                icon: <Trash2 size={14} />,
                action: () => {
                  selectedLayers.forEach((layer) => {
                    onLayerDelete(layer.id)
                  })
                  handleContextMenuClose()
                },
              },
            ]}
            onClose={handleContextMenuClose}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className={`left-panel ${className}`}>
      {/* Header */}
      <div className="left-panel-header">
        <div className="project-info">
          <h2 className="project-name">{project.name}</h2>
          <button className="project-menu" title="Project options">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === ViewMode.SceneByScene ? 'active' : ''}`}
            onClick={() => onViewModeChange(ViewMode.SceneByScene)}
            title="Storyboard view"
          >
            <Layers size={16} />
            Storyboard
          </button>
          <button
            className={`view-mode-btn ${viewMode === ViewMode.Canvas ? 'active' : ''}`}
            onClick={() => onViewModeChange(ViewMode.Canvas)}
            title="Scene editor view"
          >
            <FileText size={16} />
            Scene Editor
          </button>
          <button
            className={`view-mode-btn ${viewMode === ViewMode.AssetsLibrary ? 'active' : ''}`}
            onClick={() => onViewModeChange(ViewMode.AssetsLibrary)}
            title="Assets and libraries"
          >
            <Folder size={16} />
            Assets
          </button>
        </div>

        {/* Search and Filter */}
        <SearchFilter
          query={searchQuery}
          onQueryChange={handleSearchChange}
          filterState={filterState}
          onFilterChange={handleFilterChange}
        />

        {/* New Item Button */}
        <NewItemMenu
          isOpen={newItemMenuOpen}
          onToggle={() => setNewItemMenuOpen(!newItemMenuOpen)}
          viewMode={viewMode}
          onSceneAdd={onSceneAdd}
          onLayerAdd={(type: NodeType) => {
            if (currentScene) {
              const layer = createLayerByType(type)
              onLayerAdd(currentScene.id, layer)
              setNewItemMenuOpen(false)
            }
          }}
        />
      </div>

      {/* Content Area */}
      <div className="left-panel-content">
        {viewMode === ViewMode.SceneByScene ? (
          <StoryboardView
            scenes={filteredScenes}
            currentSceneId={project.currentSceneId}
            onSceneSelect={onSceneSelect}
            onSceneUpdate={onSceneUpdate}
            onSceneReorder={onSceneReorder}
            onContextMenu={handleContextMenu}
            getLayerIcon={getLayerIcon}
            getLayerBadge={getLayerBadge}
          />
        ) : viewMode === ViewMode.Canvas ? (
          <SceneEditorView
            scene={currentScene}
            selectedLayers={selectedLayers}
            onLayerSelect={onLayerSelect}
            onLayerUpdate={onLayerUpdate}
            onLayerDelete={onLayerDelete}
            onLayerReorder={onLayerReorder}
            onLayerReparent={onLayerReparent}
            onContextMenu={handleContextMenu}
            getLayerIcon={getLayerIcon}
            getLayerBadge={getLayerBadge}
            getFilteredLayers={getFilteredLayers}
          />
        ) : (
          <AssetLibraryView
            assets={project.assets}
            libraries={project.libraries}
            onAssetSelect={(_assetId: string) => {
              // PLACEHOLDER: Asset selection logic - requires asset management system
              throw new Error(
                'PLACEHOLDER: Asset selection not implemented - requires asset management system integration'
              )
            }}
            onAssetAdd={(_asset: Asset) => {
              // PLACEHOLDER: Asset addition logic - requires asset management system
              throw new Error(
                'PLACEHOLDER: Asset addition not implemented - requires asset management system integration'
              )
            }}
            onLibraryConnect={(_libraryId: string) => {
              // PLACEHOLDER: Library connection logic - requires library management system
              throw new Error(
                'PLACEHOLDER: Library connection not implemented - requires library management system integration'
              )
            }}
            getAssetIcon={getAssetIcon}
          />
        )}
      </div>

      {/* Footer */}
      <div className="left-panel-footer">
        <div className="selection-info">
          {selectedLayers.length > 0 && (
            <span className="selection-count">
              {selectedLayers.length} selected
            </span>
          )}
        </div>
        <div className="batch-actions">
          {selectedLayers.length > 1 && (
            <>
              <button
                className="batch-action-btn"
                title="Batch operations"
                onClick={() => {
                  // Handle batch operations
                }}
              >
                <Settings size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {renderContextMenu()}
    </div>
  )
}

// Helper function to create layer by type
function createLayerByType(type: NodeType): SceneNode {
  const id = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const baseLayer: SceneNode = {
    id,
    name: `${type} ${Math.floor(Math.random() * 1000)}`,
    type,
    properties: {
      visible: true,
      opacity: 1,
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      locked: false,
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
          fill: { r: 0, g: 0, b: 0, a: 1 },
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
          fill: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
          stroke: { r: 0, g: 0, b: 0, a: 1 },
          strokeWidth: 2,
        },
      }

    case NodeType.Media:
      return {
        ...baseLayer,
        properties: {
          ...baseLayer.properties,
          mediaType: 'image',
          source: '',
          fit: 'contain',
        },
      }

    case NodeType.Group:
      return {
        ...baseLayer,
        properties: {
          ...baseLayer.properties,
          expanded: true,
        },
      }

    default:
      return baseLayer
  }
}
