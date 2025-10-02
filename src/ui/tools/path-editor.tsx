/**
 * @fileoverview Advanced Path Editing Tools
 * @description Interactive bezier curve path editing with control points
 * @author @darianrosebrook
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ShapeNode, ShapeNodeType } from '@/core/scene-graph/shapes/shape-node'
import {
  PathVertex,
  PathVertexType,
  Point2D,
} from '@/core/scene-graph/shapes/shape-types'
import { ToolType } from '@/types'

/**
 * Path editing state
 */
export interface PathEditState {
  selectedPath: ShapeNode | null
  selectedVertex: number | null
  selectedHandle: 'in' | 'out' | null
  isDragging: boolean
  dragStart: Point2D | null
  previewPath: PathVertex[] | null
  showControlPoints: boolean
  snapToGrid: boolean
  gridSize: number
}

/**
 * Path editor props
 */
export interface PathEditorProps {
  selectedShape: ShapeNode | null
  onPathUpdate: (pathId: string, vertices: PathVertex[]) => void
  zoom: number
  pan: { x: number; y: number }
  snapToGrid: boolean
  gridSize: number
  activeTool: ToolType | null
}

/**
 * Advanced path editor component
 */
export function PathEditor({
  selectedShape,
  onPathUpdate,
  zoom,
  pan,
  snapToGrid,
  gridSize,
  activeTool,
}: PathEditorProps) {
  const [editState, setEditState] = useState<PathEditState>({
    selectedPath: null,
    selectedVertex: null,
    selectedHandle: null,
    isDragging: false,
    dragStart: null,
    previewPath: null,
    showControlPoints: true,
    snapToGrid,
    gridSize,
  })

  const containerRef = useRef<SVGSVGElement>(null)

  // Update edit state when shape selection changes
  useEffect(() => {
    if (selectedShape && selectedShape.shapeType === ShapeNodeType.PATH) {
      setEditState((prev) => ({
        ...prev,
        selectedPath: selectedShape,
      }))
    } else {
      setEditState((prev) => ({
        ...prev,
        selectedPath: null,
        selectedVertex: null,
        selectedHandle: null,
      }))
    }
  }, [selectedShape])

  /**
   * Handle vertex selection
   */
  const handleVertexSelect = useCallback(
    (vertexIndex: number, e: React.MouseEvent) => {
      e.stopPropagation()

      setEditState((prev) => ({
        ...prev,
        selectedVertex: vertexIndex,
        selectedHandle: null,
      }))
    },
    []
  )

  /**
   * Handle handle selection
   */
  const handleHandleSelect = useCallback(
    (vertexIndex: number, handleType: 'in' | 'out', e: React.MouseEvent) => {
      e.stopPropagation()

      setEditState((prev) => ({
        ...prev,
        selectedVertex: vertexIndex,
        selectedHandle: handleType,
      }))
    },
    []
  )

  /**
   * Handle vertex drag start
   */
  const handleVertexDragStart = useCallback(
    (vertexIndex: number, e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const worldPoint = screenToWorld(
        { x: e.clientX - rect.left, y: e.clientY - rect.top },
        zoom,
        pan
      )

      setEditState((prev) => ({
        ...prev,
        isDragging: true,
        dragStart: worldPoint,
      }))
    },
    [zoom, pan]
  )

  /**
   * Handle vertex drag move
   */
  const handleVertexDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (
        !editState.isDragging ||
        editState.selectedVertex === null ||
        !editState.selectedPath
      )
        return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const worldPoint = screenToWorld(
        { x: e.clientX - rect.left, y: e.clientY - rect.top },
        zoom,
        pan
      )

      // Snap to grid if enabled
      const snappedPoint = editState.snapToGrid
        ? snapPointToGrid(worldPoint, editState.gridSize)
        : worldPoint

      // Update vertex position
      const pathShape = editState.selectedPath.shape as any
      const updatedVertices = [...pathShape.vertices]

      if (editState.selectedHandle === 'in') {
        // Update incoming handle
        updatedVertices[editState.selectedVertex] = {
          ...updatedVertices[editState.selectedVertex],
          inHandle: snappedPoint,
        }
      } else if (editState.selectedHandle === 'out') {
        // Update outgoing handle
        updatedVertices[editState.selectedVertex] = {
          ...updatedVertices[editState.selectedVertex],
          outHandle: snappedPoint,
        }
      } else {
        // Update vertex point
        updatedVertices[editState.selectedVertex] = {
          ...updatedVertices[editState.selectedVertex],
          point: snappedPoint,
        }
      }

      // Update preview
      setEditState((prev) => ({
        ...prev,
        previewPath: updatedVertices,
      }))
    },
    [editState, zoom, pan]
  )

  /**
   * Handle vertex drag end
   */
  const handleVertexDragEnd = useCallback(() => {
    if (!editState.previewPath || !editState.selectedPath) return

    // Apply the changes
    onPathUpdate(editState.selectedPath.id, editState.previewPath)

    setEditState((prev) => ({
      ...prev,
      isDragging: false,
      dragStart: null,
      previewPath: null,
    }))
  }, [editState, onPathUpdate])

  /**
   * Handle path click to add new vertex
   */
  const handlePathClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== ToolType.Pen || !editState.selectedPath) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const worldPoint = screenToWorld(
        { x: e.clientX - rect.left, y: e.clientY - rect.top },
        zoom,
        pan
      )

      // Snap to grid if enabled
      const snappedPoint = editState.snapToGrid
        ? snapPointToGrid(worldPoint, editState.gridSize)
        : worldPoint

      // Add new vertex
      const pathShape = editState.selectedPath.shape as any
      const updatedVertices = [
        ...pathShape.vertices,
        {
          point: snappedPoint,
          type: PathVertexType.CORNER,
        },
      ]

      onPathUpdate(editState.selectedPath.id, updatedVertices)
    },
    [activeTool, editState, zoom, pan, onPathUpdate]
  )

  /**
   * Convert screen coordinates to world coordinates
   */
  const screenToWorld = (
    screenPoint: Point2D,
    zoom: number,
    pan: Point2D
  ): Point2D => {
    return {
      x: (screenPoint.x - pan.x) / zoom,
      y: (screenPoint.y - pan.y) / zoom,
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  const worldToScreen = (
    worldPoint: Point2D,
    zoom: number,
    pan: Point2D
  ): Point2D => {
    return {
      x: worldPoint.x * zoom + pan.x,
      y: worldPoint.y * zoom + pan.y,
    }
  }

  /**
   * Snap point to grid
   */
  const snapPointToGrid = (point: Point2D, gridSize: number): Point2D => {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    }
  }

  /**
   * Render path vertices and control points
   */
  const renderPathVertices = () => {
    if (
      !editState.selectedPath ||
      editState.selectedPath.shapeType !== ShapeNodeType.PATH
    )
      return null

    const pathShape = editState.selectedPath.shape as any
    const vertices = editState.previewPath || pathShape.vertices

    return (
      <g className="path-vertices">
        {vertices.map((vertex: PathVertex, index: number) => {
          const screenPoint = worldToScreen(vertex.point, zoom, pan)
          const isSelected = index === editState.selectedVertex

          return (
            <g key={`vertex-${index}`}>
              {/* Vertex point */}
              <circle
                cx={screenPoint.x}
                cy={screenPoint.y}
                r={isSelected ? 6 : 4}
                fill={isSelected ? '#007acc' : '#fff'}
                stroke={isSelected ? '#007acc' : '#666'}
                strokeWidth={isSelected ? 2 : 1}
                className={`path-vertex ${isSelected ? 'selected' : ''}`}
                onMouseDown={(e) => handleVertexSelect(index, e)}
                onMouseUp={handleVertexDragEnd}
                style={{ cursor: 'pointer' }}
              />

              {/* Control handles */}
              {editState.showControlPoints && (
                <>
                  {vertex.inHandle && (
                    <>
                      {/* In handle line */}
                      <line
                        x1={screenPoint.x}
                        y1={screenPoint.y}
                        x2={worldToScreen(vertex.inHandle, zoom, pan).x}
                        y2={worldToScreen(vertex.inHandle, zoom, pan).y}
                        stroke="#999"
                        strokeWidth={1}
                        strokeDasharray="2,2"
                      />
                      {/* In handle point */}
                      <circle
                        cx={worldToScreen(vertex.inHandle, zoom, pan).x}
                        cy={worldToScreen(vertex.inHandle, zoom, pan).y}
                        r={3}
                        fill="#ff6b35"
                        stroke="#fff"
                        strokeWidth={1}
                        className="control-handle in-handle"
                        onMouseDown={(e) => handleHandleSelect(index, 'in', e)}
                        style={{ cursor: 'pointer' }}
                      />
                    </>
                  )}

                  {vertex.outHandle && (
                    <>
                      {/* Out handle line */}
                      <line
                        x1={screenPoint.x}
                        y1={screenPoint.y}
                        x2={worldToScreen(vertex.outHandle, zoom, pan).x}
                        y2={worldToScreen(vertex.outHandle, zoom, pan).y}
                        stroke="#999"
                        strokeWidth={1}
                        strokeDasharray="2,2"
                      />
                      {/* Out handle point */}
                      <circle
                        cx={worldToScreen(vertex.outHandle, zoom, pan).x}
                        cy={worldToScreen(vertex.outHandle, zoom, pan).y}
                        r={3}
                        fill="#ff6b35"
                        stroke="#fff"
                        strokeWidth={1}
                        className="control-handle out-handle"
                        onMouseDown={(e) => handleHandleSelect(index, 'out', e)}
                        style={{ cursor: 'pointer' }}
                      />
                    </>
                  )}
                </>
              )}
            </g>
          )
        })}
      </g>
    )
  }

  /**
   * Render the path curve
   */
  const renderPathCurve = () => {
    if (
      !editState.selectedPath ||
      editState.selectedPath.shapeType !== ShapeNodeType.PATH
    )
      return null

    const pathShape = editState.selectedPath.shape as any
    const vertices = editState.previewPath || pathShape.vertices

    if (vertices.length === 0) return null

    // Generate SVG path data
    const pathData = generateSVGPath(vertices, pathShape.closed)

    return (
      <path
        d={pathData}
        fill="none"
        stroke="#007acc"
        strokeWidth={2 / zoom} // Scale stroke width with zoom
        className="path-curve"
        onClick={handlePathClick}
        style={{
          cursor: activeTool === ToolType.Pen ? 'crosshair' : 'default',
        }}
      />
    )
  }

  /**
   * Generate SVG path data from vertices
   */
  const generateSVGPath = (vertices: PathVertex[], closed: boolean): string => {
    if (vertices.length === 0) return ''

    let path = `M ${vertices[0].point.x} ${vertices[0].point.y}`

    for (let i = 1; i < vertices.length; i++) {
      const vertex = vertices[i]
      const prevVertex = vertices[i - 1]

      if (vertex.type === PathVertexType.CORNER) {
        path += ` L ${vertex.point.x} ${vertex.point.y}`
      } else {
        // For smooth and symmetric vertices, we'd calculate bezier curves
        // For now, use simple lines
        path += ` L ${vertex.point.x} ${vertex.point.y}`
      }
    }

    if (closed && vertices.length > 2) {
      path += ' Z'
    }

    return path
  }

  if (
    !editState.selectedPath ||
    editState.selectedPath.shapeType !== ShapeNodeType.PATH
  ) {
    return null
  }

  return (
    <svg
      ref={containerRef}
      className="path-editor"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      onMouseMove={editState.isDragging ? handleVertexDragMove : undefined}
      onMouseUp={editState.isDragging ? handleVertexDragEnd : undefined}
    >
      {/* Path curve */}
      {renderPathCurve()}

      {/* Path vertices and control points */}
      {editState.showControlPoints && renderPathVertices()}
    </svg>
  )
}

/**
 * Path editing toolbar
 */
export function PathEditToolbar({
  editState,
  onToggleControlPoints,
  onConvertVertexType,
  onAddVertex,
  onDeleteVertex,
}: {
  editState: PathEditState
  onToggleControlPoints: () => void
  onConvertVertexType: (type: PathVertexType) => void
  onAddVertex: () => void
  onDeleteVertex: () => void
}) {
  return (
    <div className="path-edit-toolbar">
      <button
        className={`toolbar-button ${editState.showControlPoints ? 'active' : ''}`}
        onClick={onToggleControlPoints}
        title="Toggle Control Points"
      >
        🎛️
      </button>

      <div className="vertex-type-buttons">
        <button
          className={`toolbar-button ${editState.selectedVertex !== null ? 'active' : ''}`}
          onClick={() => onConvertVertexType(PathVertexType.CORNER)}
          title="Corner Vertex"
        >
          ⬜
        </button>
        <button
          className={`toolbar-button ${editState.selectedVertex !== null ? 'active' : ''}`}
          onClick={() => onConvertVertexType(PathVertexType.SMOOTH)}
          title="Smooth Vertex"
        >
          🔄
        </button>
        <button
          className={`toolbar-button ${editState.selectedVertex !== null ? 'active' : ''}`}
          onClick={() => onConvertVertexType(PathVertexType.SYMMETRIC)}
          title="Symmetric Vertex"
        >
          ⚖️
        </button>
      </div>

      <button
        className="toolbar-button"
        onClick={onAddVertex}
        title="Add Vertex"
        disabled={editState.selectedPath === null}
      >
        ➕
      </button>

      <button
        className="toolbar-button"
        onClick={onDeleteVertex}
        title="Delete Vertex"
        disabled={editState.selectedVertex === null}
      >
        ➖
      </button>
    </div>
  )
}

/**
 * Path properties panel for detailed editing
 */
export function PathPropertiesPanel({
  selectedPath,
  onPathUpdate,
}: {
  selectedPath: ShapeNode | null
  onPathUpdate: (updates: any) => void
}) {
  if (!selectedPath || selectedPath.shapeType !== ShapeNodeType.PATH) {
    return (
      <div className="path-properties-empty">
        Select a path to edit properties
      </div>
    )
  }

  const pathShape = selectedPath.shape as any

  const handlePropertyChange = (property: string, value: any) => {
    onPathUpdate({ [property]: value })
  }

  return (
    <div className="path-properties-panel">
      <h3>Path Properties</h3>

      <div className="property-group">
        <label>Path Closed</label>
        <input
          type="checkbox"
          checked={pathShape.closed || false}
          onChange={(e) => handlePropertyChange('closed', e.target.checked)}
        />
      </div>

      <div className="property-group">
        <label>Fill Rule</label>
        <select
          value={pathShape.fillRule || 'nonzero'}
          onChange={(e) => handlePropertyChange('fillRule', e.target.value)}
        >
          <option value="nonzero">Non-zero</option>
          <option value="evenodd">Even-odd</option>
        </select>
      </div>

      <div className="property-group">
        <label>Vertices</label>
        <div className="vertex-count">
          {pathShape.vertices?.length || 0} vertices
        </div>
      </div>

      <div className="property-group">
        <label>Path Length</label>
        <div className="path-length">
          {calculatePathLength(pathShape.vertices || []).toFixed(2)} units
        </div>
      </div>
    </div>
  )
}

/**
 * Calculate total path length
 */
function calculatePathLength(vertices: PathVertex[]): number {
  if (vertices.length < 2) return 0

  let totalLength = 0

  for (let i = 1; i < vertices.length; i++) {
    const prev = vertices[i - 1].point
    const current = vertices[i].point
    const dx = current.x - prev.x
    const dy = current.y - prev.y
    totalLength += Math.sqrt(dx * dx + dy * dy)
  }

  return totalLength
}
