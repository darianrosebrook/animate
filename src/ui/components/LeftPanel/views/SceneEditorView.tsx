/**
 * @fileoverview Scene Editor View for the Left Panel
 * @author @darianrosebrook
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit3,
  Move,
  Folder,
  FolderOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { Scene, SceneNode, NodeType } from '@/types'

interface SceneEditorViewProps {
  scene: Scene | null
  selectedLayers: SceneNode[]
  onLayerSelect: (layerIds: string[]) => void
  onLayerUpdate: (layerId: string, updates: Partial<SceneNode>) => void
  onLayerDelete: (layerId: string) => void
  onLayerReorder: (sceneId: string, layerIds: string[]) => void
  onLayerReparent: (layerId: string, newParentId: string | null) => void
  onContextMenu: (
    type: 'scene' | 'layer' | 'section',
    target: HTMLElement,
    data?: any
  ) => void
  getLayerIcon: (type: NodeType) => React.ReactNode
  getLayerBadge: (layer: SceneNode) => any[]
  getFilteredLayers: (scene: Scene) => SceneNode[]
}

interface LayerTreeNode extends SceneNode {
  depth: number
  isExpanded: boolean
  children: LayerTreeNode[]
}

export function SceneEditorView({
  scene,
  selectedLayers,
  onLayerSelect,
  onLayerUpdate,
  onLayerDelete,
  onLayerReorder,
  onLayerReparent,
  onContextMenu,
  getLayerIcon,
  getLayerBadge,
  getFilteredLayers,
}: SceneEditorViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null)
  const [dragOverInfo, setDragOverInfo] = useState<{
    layerId: string | null
    position: 'before' | 'inside' | 'after'
  }>({ layerId: null, position: 'before' })

  // Build tree structure from flat layer list
  const layerTree = useMemo(() => {
    if (!scene) return []

    const filteredLayers = getFilteredLayers(scene)
    const nodeMap = new Map<string, LayerTreeNode>()
    const roots: LayerTreeNode[] = []

    // First pass: create all nodes
    filteredLayers.forEach((layer) => {
      const treeNode: LayerTreeNode = {
        ...layer,
        depth: 0,
        isExpanded: expandedNodes.has(layer.id),
        children: [],
      }
      nodeMap.set(layer.id, treeNode)
    })

    // Second pass: build hierarchy
    filteredLayers.forEach((layer) => {
      const treeNode = nodeMap.get(layer.id)!
      const parentId = layer.parent?.id || null

      if (parentId && nodeMap.has(parentId)) {
        const parent = nodeMap.get(parentId)!
        parent.children.push(treeNode)
        treeNode.depth = parent.depth + 1
      } else {
        roots.push(treeNode)
      }
    })

    return roots
  }, [scene, getFilteredLayers, expandedNodes])

  const toggleExpanded = useCallback((layerId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(layerId)) {
        newSet.delete(layerId)
      } else {
        newSet.add(layerId)
      }
      return newSet
    })
  }, [])

  const handleLayerClick = useCallback(
    (layer: SceneNode, event: React.MouseEvent) => {
      event.stopPropagation()

      if (event.metaKey || event.ctrlKey) {
        // Multi-select
        const isSelected = selectedLayers.some((l) => l.id === layer.id)
        if (isSelected) {
          onLayerSelect(
            selectedLayers.filter((l) => l.id !== layer.id).map((l) => l.id)
          )
        } else {
          onLayerSelect([...selectedLayers.map((l) => l.id), layer.id])
        }
      } else {
        // Single select
        onLayerSelect([layer.id])
      }
    },
    [selectedLayers, onLayerSelect]
  )

  const handleContextMenu = useCallback(
    (layer: SceneNode, event: React.MouseEvent) => {
      event.preventDefault()
      onContextMenu('layer', event.currentTarget as HTMLElement, {
        layerId: layer.id,
      })
    },
    [onContextMenu]
  )

  const handleDragStart = useCallback((layerId: string) => {
    setDraggedLayerId(layerId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedLayerId(null)
    setDragOverInfo({ layerId: null, position: 'before' })
  }, [])

  const handleDragOver = useCallback(
    (
      layerId: string,
      position: 'before' | 'inside' | 'after',
      event: React.DragEvent
    ) => {
      event.preventDefault()
      setDragOverInfo({ layerId, position })
    },
    []
  )

  const handleDrop = useCallback(
    (
      targetLayerId: string,
      position: 'before' | 'inside' | 'after',
      event: React.DragEvent
    ) => {
      event.preventDefault()

      if (!draggedLayerId || draggedLayerId === targetLayerId) {
        setDragOverInfo({ layerId: null, position: 'before' })
        return
      }

      if (position === 'inside') {
        // Reparent to target layer
        onLayerReparent(draggedLayerId, targetLayerId)
      } else {
        // Reorder within same parent
        const targetLayer = findLayerById(scene?.layers || [], targetLayerId)
        const draggedLayer = findLayerById(scene?.layers || [], draggedLayerId)

        if (
          targetLayer &&
          draggedLayer &&
          targetLayer.parent?.id === draggedLayer.parent?.id
        ) {
          const parentId = targetLayer.parent?.id
          const siblings = (scene?.layers || []).filter(
            (l) => l.parent?.id === parentId
          )

          let newOrder: SceneNode[] = []
          const targetIndex = siblings.findIndex((l) => l.id === targetLayerId)
          const draggedIndex = siblings.findIndex(
            (l) => l.id === draggedLayerId
          )

          if (position === 'before') {
            newOrder = [...siblings]
            const [dragged] = newOrder.splice(draggedIndex, 1)
            newOrder.splice(targetIndex, 0, dragged)
          } else if (position === 'after') {
            newOrder = [...siblings]
            const [dragged] = newOrder.splice(draggedIndex, 1)
            newOrder.splice(targetIndex + 1, 0, dragged)
          }

          onLayerReorder(
            scene!.id,
            newOrder.map((l) => l.id)
          )
        }
      }

      setDragOverInfo({ layerId: null, position: 'before' })
    },
    [draggedLayerId, scene, onLayerReparent, onLayerReorder]
  )

  const findLayerById = (layers: SceneNode[], id: string): SceneNode | null => {
    for (const layer of layers) {
      if (layer.id === id) return layer
      if (layer.children.length > 0) {
        const found = findLayerById(layer.children, id)
        if (found) return found
      }
    }
    return null
  }

  const renderLayerNode = (node: LayerTreeNode, index: number) => {
    const isSelected = selectedLayers.some((l) => l.id === node.id)
    const isDragged = node.id === draggedLayerId
    const isDragOver = dragOverInfo.layerId === node.id
    const hasChildren = node.children.length > 0

    return (
      <div key={node.id}>
        <div
          className={`layer-node ${isSelected ? 'selected' : ''} ${isDragged ? 'dragged' : ''} ${
            isDragOver ? `drag-over-${dragOverInfo.position}` : ''
          }`}
          style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
          draggable
          onDragStart={() => handleDragStart(node.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(node.id, 'inside', e)}
          onClick={(e) => handleLayerClick(node, e)}
          onContextMenu={(e) => handleContextMenu(node, e)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              className="expand-btn"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(node.id)
              }}
            >
              {node.isExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
            </button>
          )}

          {/* Layer Icon */}
          <div className="layer-icon">{getLayerIcon(node.type)}</div>

          {/* Layer Info */}
          <div className="layer-info">
            <div className="layer-name">{node.name}</div>
            <div className="layer-type">{node.type}</div>
          </div>

          {/* Badges */}
          <div className="layer-badges">
            {getLayerBadge(node).map((badge, badgeIndex) => (
              <div
                key={badgeIndex}
                className={`layer-badge ${badge.type}`}
                title={badge.title}
              >
                {badge.icon}
              </div>
            ))}
          </div>

          {/* Context Menu Trigger */}
          <button
            className="layer-menu-trigger"
            onClick={(e) => {
              e.stopPropagation()
              handleContextMenu(node, e)
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Children */}
        {hasChildren && node.isExpanded && (
          <div className="layer-children">
            {node.children.map((child, childIndex) =>
              renderLayerNode(child, childIndex)
            )}
          </div>
        )}

        {/* Drop Zones */}
        {isDragOver && (
          <>
            {dragOverInfo.position === 'before' && (
              <div
                className="drop-zone before"
                onDragOver={(e) => handleDragOver(node.id, 'before', e)}
                onDrop={(e) => handleDrop(node.id, 'before', e)}
              />
            )}
            {dragOverInfo.position === 'after' && (
              <div
                className="drop-zone after"
                onDragOver={(e) => handleDragOver(node.id, 'after', e)}
                onDrop={(e) => handleDrop(node.id, 'after', e)}
              />
            )}
          </>
        )}
      </div>
    )
  }

  if (!scene) {
    return (
      <div className="scene-editor-empty">
        <div className="empty-state">
          <Folder size={48} />
          <h3>No scene selected</h3>
          <p>Select a scene to edit its layers</p>
        </div>
      </div>
    )
  }

  return (
    <div className="scene-editor-view">
      {layerTree.length === 0 ? (
        <div className="scene-editor-empty">
          <div className="empty-state">
            <Folder size={48} />
            <h3>No layers yet</h3>
            <p>Add layers to build your scene</p>
          </div>
        </div>
      ) : (
        <div className="layer-tree">
          {layerTree.map((node, index) => renderLayerNode(node, index))}
        </div>
      )}
    </div>
  )
}
