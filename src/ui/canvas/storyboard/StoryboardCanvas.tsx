/**
 * StoryboardCanvas - zoomable grid of scenes with drag-reorder support hooks
 * @author @darianrosebrook
 */

import React, { useRef, useState, useCallback } from 'react'
import { Project, Scene } from '@/types'

export interface StoryboardCanvasProps {
  project: Project
  overlays: {
    grid: boolean
    guides: boolean
    outlines: boolean
    rulers: boolean
    safeZones: boolean
  }
  zoom: number
  onZoom: (z: number) => void
  onSceneReorder: (sceneIds: string[]) => void
  onSceneUpdate: (sceneId: string, updates: Partial<Scene>) => void
}

export function StoryboardCanvas({
  project,
  overlays,
  zoom,
  onZoom,
  onSceneReorder,
  onSceneUpdate,
}: StoryboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = -Math.sign(e.deltaY) * 0.1
        onZoom(Math.max(0.05, Math.min(4, zoom * (1 + delta))))
      }
    },
    [zoom, onZoom]
  )

  const startDrag = (id: string) => setDraggedId(id)
  const endDrag = () => setDraggedId(null)
  const over = (index: number, e: React.DragEvent) => e.preventDefault()
  const drop = (index: number) => {
    if (!draggedId) return
    const scenes = [...project.scenes]
    const from = scenes.findIndex((s) => s.id === draggedId)
    if (from < 0) return
    const [drag] = scenes.splice(from, 1)
    scenes.splice(index, 0, drag)
    onSceneReorder(scenes.map((s) => s.id))
    setDraggedId(null)
  }

  return (
    <div className="storyboard-canvas" ref={containerRef} onWheel={onWheel}>
      <div
        className="storyboard-grid"
        style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}
      >
        {project.scenes.map((scene, i) => (
          <div
            key={scene.id}
            className={`storyboard-thumb ${draggedId === scene.id ? 'dragged' : ''}`}
            draggable
            onDragStart={() => startDrag(scene.id)}
            onDragEnd={endDrag}
            onDragOver={(e) => over(i, e)}
            onDrop={() => drop(i)}
          >
            <div className="thumb-frame" />
            <div className="thumb-title">{scene.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
