/**
 * SceneEditorCanvas - precise per-scene editing canvas with overlays and selection
 * @author @darianrosebrook
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Project, Scene, SceneNode } from '@/types'

export interface SceneEditorCanvasProps {
  project: Project
  scene: Scene | null
  selectedLayers: SceneNode[]
  overlays: {
    grid: boolean
    guides: boolean
    outlines: boolean
    rulers: boolean
    safeZones: boolean
  }
  zoom: number
  onZoom: (z: number) => void
  onLayerSelect: (layerIds: string[]) => void
  onLayerUpdate: (layerId: string, updates: Partial<SceneNode>) => void
}

export function SceneEditorCanvas({
  project,
  scene,
  selectedLayers,
  overlays,
  zoom,
  onZoom,
  onLayerSelect,
  onLayerUpdate,
}: SceneEditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Mouse wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = -Math.sign(e.deltaY) * 0.1
        onZoom(Math.max(0.05, Math.min(8, zoom * (1 + delta))))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel as any)
  }, [zoom, onZoom])

  // Spacebar pan
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space') isPanningRef.current = true
    }
    const up = () => {
      isPanningRef.current = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const startPan = useCallback((e: React.MouseEvent) => {
    if (!isPanningRef.current) return
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - lastPosRef.current.x
      const dy = ev.clientY - lastPosRef.current.y
      lastPosRef.current = { x: ev.clientX, y: ev.clientY }
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [])

  // Draw grid as background using CSS gradients for performance
  const gridStyle: React.CSSProperties = overlays.grid
    ? {
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '20px 20px, 20px 20px',
      }
    : {}

  return (
    <div
      ref={containerRef}
      className="scene-editor-canvas"
      onMouseDown={startPan}
    >
      <div
        ref={contentRef}
        className="scene-editor-content"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          ...gridStyle,
        }}
      >
        {/* Scene safe rectangle */}
        {scene && (
          <div className="scene-frame" style={{ width: 1280, height: 720 }} />
        )}

        {/* Selected layer overlays (placeholder) */}
        {selectedLayers.map((layer) => (
          <div key={layer.id} className="selection-box" title={layer.name} />
        ))}
      </div>

      {/* Rulers (basic) */}
      {overlays.rulers && (
        <>
          <div className="ruler horizontal" />
          <div className="ruler vertical" />
        </>
      )}
    </div>
  )
}
