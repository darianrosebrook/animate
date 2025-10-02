/**
 * SceneEditorCanvas - Precise per-scene editing canvas with overlays and selection
 * @author @darianrosebrook
 *
 * This component has been refactored to use extracted custom hooks and components
 * for better maintainability and code organization.
 */

import React, { useRef, useCallback } from 'react'
import { Project, Scene, SceneNode, ToolType } from '@/types'
import { calculateUnionBounds, canvasToWorld } from '../selection-utils'
import { useCanvasSelection } from '@/ui/hooks/useCanvasSelection'
import { useCanvasPanZoom } from '@/ui/hooks/useCanvasPanZoom'
import { usePenTool } from '@/ui/hooks/usePenTool'
import { useTransformHandles } from '@/ui/hooks/useTransformHandles'
import { SelectionBox } from '@/ui/components/SelectionBox/SelectionBox'
import { TransformHandles } from '@/ui/components/TransformHandles/TransformHandles'

export interface SceneEditorCanvasProps {
  _project: Project
  scene: Scene | null
  selectedLayers: SceneNode[]
  activeTool: ToolType | null
  overlays: {
    grid: boolean
    guides: boolean
    outlines: boolean
    rulers: boolean
    safeZones: boolean
  }
  zoom: number
  pan: { x: number; y: number }
  onZoom: (z: number) => void
  onPan: (pan: { x: number; y: number }) => void
  onLayerSelect: (layerIds: string[]) => void
  onLayerUpdate: (layerId: string, updates: Partial<SceneNode>) => void
  onSelectionChange?: (selectedIds: Set<string>) => void
  _onZoomToFit?: (layerIds: string[]) => void
  setZoom?: (zoom: number) => void
  setPan?: (pan: { x: number; y: number }) => void
}

/**
 * SceneEditorCanvas - Refactored component using custom hooks
 *
 * This component now delegates most of its logic to custom hooks:
 * - useCanvasSelection: Handles all selection-related state and interactions
 * - useCanvasPanZoom: Manages pan and zoom behavior
 * - usePenTool: Manages pen tool state and path creation
 * - useTransformHandles: Handles transform handle interactions
 *
 * Visual components:
 * - SelectionBox: Renders selection rectangles
 * - TransformHandles: Renders interactive transform handles
 */
export function SceneEditorCanvas({
  _project,
  scene,
  selectedLayers,
  activeTool,
  overlays,
  zoom,
  pan,
  onZoom,
  onPan,
  onLayerSelect,
  onLayerUpdate,
  onSelectionChange,
  _onZoomToFit,
  setPan,
}: SceneEditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Custom hooks for feature-specific logic
  const selection = useCanvasSelection({
    selectedLayers,
    scene,
    zoom,
    pan,
    onLayerSelect,
    onSelectionChange,
  })

  const panZoom = useCanvasPanZoom({
    zoom,
    pan,
    onZoom,
    onPan,
    setPan,
    containerRef,
  })

  const penTool = usePenTool({
    scene,
    zoom,
    pan,
    activeTool,
    onLayerUpdate,
  })

  const transforms = useTransformHandles({
    selectedLayers,
    onLayerUpdate,
  })

  // Calculate union bounds for selected nodes
  const unionBounds =
    selectedLayers.length > 0 ? calculateUnionBounds(selectedLayers) : null

  const selectedNodes = selectedLayers.filter((layer) =>
    selection.selectionState.selectedNodeIds.has(layer.id)
  )

  // Main mouse event handler - delegates to appropriate tool
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!scene || !activeTool) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const canvasPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      const worldPos = canvasToWorld(canvasPos, zoom, pan)

      switch (activeTool) {
        case ToolType.Select:
          selection.handleSelectToolDown(e, worldPos)
          break
        case ToolType.Hand:
          panZoom.handleHandToolDown(e)
          break
        case ToolType.Pen:
          penTool.handlePenToolDown(e, worldPos)
          break
        default:
          break
      }
    },
    [scene, activeTool, zoom, pan, selection, panZoom, penTool]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!scene || !activeTool) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const canvasPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      switch (activeTool) {
        case ToolType.Select:
          selection.handleSelectToolMove(e, canvasPos)
          break
        case ToolType.Hand:
          panZoom.handleHandToolMove(e)
          break
        case ToolType.Pen:
          penTool.handlePenToolMove(e, canvasPos)
          break
        default:
          break
      }
    },
    [scene, activeTool, selection, panZoom, penTool]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!activeTool) return

      switch (activeTool) {
        case ToolType.Select:
          selection.handleSelectToolUp()
          break
        case ToolType.Hand:
          panZoom.handleHandToolUp()
          break
        case ToolType.Pen:
          penTool.handlePenToolUp(e)
          break
        default:
          break
      }
    },
    [activeTool, selection, panZoom, penTool]
  )

  // Render scene layers
  const renderSceneLayers = () => {
    if (!scene) return null

    return scene.layers.map((layer) => {
      const isSelected = selection.selectionState.selectedNodeIds.has(layer.id)

      // Get layer properties with safe defaults
      const backgroundColor = layer.properties.backgroundColor ?? 'transparent'
      const fillColor = layer.properties.fillColor
      const pathData = layer.properties.pathData

      // Type guard for color
      const isColor = (
        value: unknown
      ): value is { r: number; g: number; b: number; a?: number } => {
        return (
          typeof value === 'object' &&
          value !== null &&
          'r' in value &&
          'g' in value &&
          'b' in value
        )
      }

      const defaultFillColor = { r: 0.5, g: 0.5, b: 0.5, a: 1 }
      const color = isColor(fillColor) ? fillColor : defaultFillColor

      return (
        <div
          key={layer.id}
          className={`scene-layer ${isSelected ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {/* Render based on layer type */}
          {layer.type === 'shape' && (
            <div
              style={{
                position: 'absolute',
                backgroundColor:
                  typeof backgroundColor === 'string'
                    ? backgroundColor
                    : 'transparent',
                border: isSelected ? '2px solid #007acc' : 'none',
              }}
            />
          )}

          {layer.type === 'path' &&
            pathData &&
            typeof pathData === 'string' && (
              <svg
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
              >
                <path
                  d={pathData}
                  fill={`rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a ?? 1})`}
                  stroke={isSelected ? '#007acc' : '#000'}
                  strokeWidth={2}
                />
              </svg>
            )}
        </div>
      )
    })
  }

  // Render pen tool preview
  const renderPenToolPreview = () => {
    if (activeTool !== ToolType.Pen || !penTool.penToolState.isDrawing)
      return null

    return (
      <svg
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 1002,
        }}
      >
        <path
          d={penTool.generateSVGPathFromPoints(
            penTool.penToolState.currentPath
          )}
          fill="none"
          stroke="#0066ff"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.8"
        />
        {/* Preview line to cursor */}
        {penTool.penToolState.previewPoint &&
          penTool.penToolState.currentPath.length > 0 && (
            <line
              x1={
                penTool.penToolState.currentPath[
                  penTool.penToolState.currentPath.length - 1
                ].x
              }
              y1={
                penTool.penToolState.currentPath[
                  penTool.penToolState.currentPath.length - 1
                ].y
              }
              x2={penTool.penToolState.previewPoint.x}
              y2={penTool.penToolState.previewPoint.y}
              stroke="#0066ff"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.6"
            />
          )}
      </svg>
    )
  }

  return (
    <div
      ref={containerRef}
      className="scene-editor-canvas"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: activeTool === ToolType.Hand ? 'grab' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={contentRef}
        className="scene-content"
        style={{
          position: 'absolute',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: 1920,
          height: 1080,
        }}
      >
        {/* Render scene layers */}
        {renderSceneLayers()}

        {/* Selection box */}
        <SelectionBox
          dragSelectionBox={selection.selectionState.dragSelectionBox}
          unionBounds={unionBounds}
          isDragging={selection.selectionState.isDragging}
        />

        {/* Transform handles */}
        <TransformHandles
          unionBounds={unionBounds}
          hasSelection={selectedNodes.length > 0}
          onHandleMouseDown={transforms.handleTransformHandleMouseDown}
        />

        {/* Pen tool preview */}
        {renderPenToolPreview()}
      </div>

      {/* Overlays */}
      {overlays.grid && (
        <div
          className="grid-overlay"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {/* Grid implementation */}
        </div>
      )}

      {overlays.guides && (
        <div
          className="guides-overlay"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {/* Guides implementation */}
        </div>
      )}

      {overlays.rulers && (
        <div
          className="rulers-overlay"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {/* Rulers implementation */}
        </div>
      )}

      {overlays.safeZones && (
        <div
          className="safe-zones-overlay"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {/* Safe zones implementation */}
        </div>
      )}
    </div>
  )
}
