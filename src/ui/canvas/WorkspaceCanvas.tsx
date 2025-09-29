/**
 * WorkspaceCanvas - orchestrates Scene Editor and Storyboard canvases
 * @author @darianrosebrook
 */

import React, { useMemo, useState, useCallback } from 'react'
import { Project, Scene, SceneNode, ViewMode } from '@/types'
import { SceneEditorCanvas } from './scene/SceneEditorCanvas'
import { StoryboardCanvas } from './storyboard/StoryboardCanvas'
import './WorkspaceCanvas.css'

export interface WorkspaceCanvasProps {
  project: Project
  currentScene: Scene | null
  selectedLayers: SceneNode[]
  onLayerSelect: (layerIds: string[]) => void
  onLayerUpdate: (layerId: string, updates: Partial<SceneNode>) => void
  onSceneReorder: (sceneIds: string[]) => void
  onSceneUpdate: (sceneId: string, updates: Partial<Scene>) => void
  className?: string
}

export function WorkspaceCanvas({
  project,
  currentScene,
  selectedLayers,
  onLayerSelect,
  onLayerUpdate,
  onSceneReorder,
  onSceneUpdate,
  className = '',
}: WorkspaceCanvasProps) {
  // Shared overlay visibility state
  const [overlays, setOverlays] = useState({
    grid: false,
    guides: false,
    outlines: true,
    rulers: false,
    safeZones: false,
  })

  const toggleOverlay = useCallback((key: keyof typeof overlays) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Zoom state
  const [zoom, setZoom] = useState(1)
  const handleZoom = useCallback((delta: number) => {
    setZoom((z) => Math.max(0.05, Math.min(8, z * (1 + delta))))
  }, [])

  const content = useMemo(() => {
    if (project.viewMode === ViewMode.SceneByScene) {
      return (
        <StoryboardCanvas
          project={project}
          overlays={overlays}
          zoom={zoom}
          onZoom={setZoom}
          onSceneReorder={onSceneReorder}
          onSceneUpdate={onSceneUpdate}
        />
      )
    }

    return (
      <SceneEditorCanvas
        project={project}
        scene={currentScene}
        selectedLayers={selectedLayers}
        overlays={overlays}
        zoom={zoom}
        onZoom={setZoom}
        onLayerSelect={onLayerSelect}
        onLayerUpdate={onLayerUpdate}
      />
    )
  }, [
    project,
    currentScene,
    selectedLayers,
    overlays,
    zoom,
    onLayerSelect,
    onLayerUpdate,
    onSceneReorder,
    onSceneUpdate,
  ])

  return (
    <div className={`workspace-canvas ${className}`} data-zoom={zoom}>
      {content}

      {/* Minimal overlay toggle HUD */}
      <div className="overlay-hud">
        <button
          className={overlays.grid ? 'active' : ''}
          onClick={() => toggleOverlay('grid')}
        >
          Grid (G)
        </button>
        <button
          className={overlays.guides ? 'active' : ''}
          onClick={() => toggleOverlay('guides')}
        >
          Guides (L)
        </button>
        <button
          className={overlays.outlines ? 'active' : ''}
          onClick={() => toggleOverlay('outlines')}
        >
          Outlines (O)
        </button>
        <button
          className={overlays.rulers ? 'active' : ''}
          onClick={() => toggleOverlay('rulers')}
        >
          Rulers (R)
        </button>
        <button
          className={overlays.safeZones ? 'active' : ''}
          onClick={() => toggleOverlay('safeZones')}
        >
          Safe (.)
        </button>
      </div>
    </div>
  )
}
