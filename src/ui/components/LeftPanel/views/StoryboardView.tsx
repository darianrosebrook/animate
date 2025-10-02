/**
 * @fileoverview Storyboard View for the Left Panel
 * @author @darianrosebrook
 */

import React, { useState, useCallback } from 'react'
import { MoreHorizontal, Move, Layers, Image } from 'lucide-react'
import { Scene, NodeType, SceneNode } from '@/types'

interface StoryboardViewProps {
  scenes: Scene[]
  currentSceneId: string | null
  onSceneSelect: (sceneId: string) => void
  onSceneUpdate: (sceneId: string, updates: Partial<Scene>) => void
  onSceneReorder: (sceneIds: string[]) => void
  onContextMenu: (
    type: 'scene' | 'layer' | 'section',
    target: HTMLElement,
    data?: any
  ) => void
  getLayerIcon: (type: NodeType) => React.ReactNode
  getLayerBadge: (
    layer: SceneNode
  ) => Array<{ type: string; icon: React.ReactNode; title: string }>
}

export function StoryboardView({
  scenes,
  currentSceneId,
  onSceneSelect,
  _onSceneUpdate,
  onSceneReorder,
  onContextMenu,
  _getLayerIcon,
  _getLayerBadge,
}: StoryboardViewProps) {
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleSceneClick = useCallback(
    (scene: Scene) => {
      onSceneSelect(scene.id)
    },
    [onSceneSelect]
  )

  const handleContextMenu = useCallback(
    (scene: Scene, event: React.MouseEvent) => {
      event.preventDefault()
      onContextMenu('scene', event.currentTarget as HTMLElement, {
        sceneId: scene.id,
      })
    },
    [onContextMenu]
  )

  const handleDragStart = useCallback((sceneId: string) => {
    setDraggedSceneId(sceneId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedSceneId(null)
    setDragOverIndex(null)
  }, [])

  const handleDragOver = useCallback(
    (index: number, event: React.DragEvent) => {
      event.preventDefault()
      setDragOverIndex(index)
    },
    []
  )

  const handleDrop = useCallback(
    (dropIndex: number, event: React.DragEvent) => {
      event.preventDefault()

      if (!draggedSceneId || draggedSceneId === scenes[dropIndex]?.id) {
        setDragOverIndex(null)
        return
      }

      const dragIndex = scenes.findIndex((scene) => scene.id === draggedSceneId)
      if (dragIndex === -1) {
        setDragOverIndex(null)
        return
      }

      // Create new scene order
      const newScenes = [...scenes]
      const [draggedScene] = newScenes.splice(dragIndex, 1)
      newScenes.splice(dropIndex, 0, draggedScene)

      const newSceneIds = newScenes.map((scene) => scene.id)
      onSceneReorder(newSceneIds)

      setDragOverIndex(null)
    },
    [draggedSceneId, scenes, onSceneReorder]
  )

  const formatDuration = (duration: number) => {
    return `${duration.toFixed(1)}s`
  }

  const getSceneBadges = (
    scene: Scene
  ): Array<{ type: string; icon: React.ReactNode; title: string }> => {
    const badges: Array<{
      type: string
      icon: React.ReactNode
      title: string
    }> = []

    if (scene.id === currentSceneId) {
      badges.push({
        type: 'current',
        icon: <CheckCircle size={10} />,
        title: 'Current scene',
      })
    }

    // Add more badges based on scene properties
    if (scene.duration > 10) {
      badges.push({
        type: 'long',
        icon: <Clock size={10} />,
        title: 'Long scene',
      })
    }

    return badges
  }

  if (scenes.length === 0) {
    return (
      <div className="storyboard-empty">
        <div className="empty-state">
          <Layers size={48} />
          <h3>No scenes yet</h3>
          <p>Create your first scene to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="storyboard-view">
      {scenes.map((scene, index) => {
        const isCurrent = scene.id === currentSceneId
        const isDragged = scene.id === draggedSceneId
        const isDragOver = dragOverIndex === index

        return (
          <div
            key={scene.id}
            className={`scene-item ${isCurrent ? 'current' : ''} ${isDragged ? 'dragged' : ''} ${
              isDragOver ? 'drag-over' : ''
            }`}
            draggable
            onDragStart={() => handleDragStart(scene.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(index, e)}
            onDrop={(e) => handleDrop(index, e)}
            onClick={() => handleSceneClick(scene)}
            onContextMenu={(e) => handleContextMenu(scene, e)}
          >
            {/* Drag Handle */}
            <div className="scene-drag-handle">
              <Move size={12} />
            </div>

            {/* Scene Number */}
            <div className="scene-number">{index + 1}</div>

            {/* Thumbnail */}
            <div className="scene-thumbnail">
              {scene.thumbnail ? (
                <img src={scene.thumbnail} alt={scene.name} />
              ) : (
                <div className="scene-placeholder">
                  <Image size={24} />
                </div>
              )}
            </div>

            {/* Scene Info */}
            <div className="scene-info">
              <div className="scene-name">{scene.name}</div>
              <div className="scene-meta">
                <span className="scene-duration">
                  {formatDuration(scene.duration)}
                </span>
                {scene.frameRate && (
                  <span className="scene-framerate">{scene.frameRate}fps</span>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="scene-badges">
              {getSceneBadges(scene).map((badge, badgeIndex) => (
                <div
                  key={badgeIndex}
                  className={`scene-badge ${badge.type}`}
                  title={badge.title}
                >
                  {badge.icon}
                </div>
              ))}
            </div>

            {/* Context Menu Trigger */}
            <button
              className="scene-menu-trigger"
              onClick={(e) => {
                e.stopPropagation()
                handleContextMenu(scene, e)
              }}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        )
      })}

      {/* Drag Placeholder */}
      {dragOverIndex !== null && (
        <div className="drag-placeholder">Drop scene here</div>
      )}
    </div>
  )
}
