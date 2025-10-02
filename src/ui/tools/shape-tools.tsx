/**
 * @fileoverview Shape Creation and Editing Tools
 * @description Interactive tools for creating and manipulating 2D shapes
 * @author @darianrosebrook
 */

import React, { useState, useCallback, useRef } from 'react'
import { Tool, ToolType } from '@/types'
import {
  ShapeNode,
  ShapeNodeFactory,
  ShapeNodeType,
} from '@/core/scene-graph/shapes/shape-node'
import { Point2D } from '@/types'

/**
 * Shape tool state
 */
export interface ShapeToolState {
  activeShapeType: ShapeNodeType | null
  isCreating: boolean
  currentShape: ShapeNode | null
  startPoint: Point2D | null
  currentPoint: Point2D | null
  previewShape: ShapeNode | null
}

/**
 * Shape tool props
 */
export interface ShapeToolProps {
  activeTool: ToolType | null
  onShapeCreate: (shape: ShapeNode) => void
  onShapeUpdate: (shapeId: string, updates: any) => void
  zoom: number
  pan: { x: number; y: number }
  snapToGrid: boolean
  gridSize: number
}

/**
 * Shape creation tool component
 */
export function ShapeCreationTool({
  activeTool,
  onShapeCreate,
  onShapeUpdate,
  zoom,
  pan,
  snapToGrid,
  gridSize,
}: ShapeToolProps) {
  const [toolState, setToolState] = useState<ShapeToolState>({
    activeShapeType: null,
    isCreating: false,
    currentShape: null,
    startPoint: null,
    currentPoint: null,
    previewShape: null,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  /**
   * Handle mouse down for shape creation
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!activeTool || !isShapeTool(activeTool)) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const canvasPoint = {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      }

      // Snap to grid if enabled
      const snappedPoint = snapToGrid
        ? {
            x: Math.round(canvasPoint.x / gridSize) * gridSize,
            y: Math.round(canvasPoint.y / gridSize) * gridSize,
          }
        : canvasPoint

      const shapeType = getShapeTypeFromTool(activeTool)
      if (!shapeType) return

      // Create initial shape
      const shape = createInitialShape(shapeType, snappedPoint)
      if (!shape) return

      setToolState((prev) => ({
        ...prev,
        activeShapeType: shapeType,
        isCreating: true,
        currentShape: shape,
        startPoint: snappedPoint,
        currentPoint: snappedPoint,
        previewShape: shape,
      }))
    },
    [activeTool, zoom, pan, snapToGrid, gridSize]
  )

  /**
   * Handle mouse move during shape creation
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (
        !toolState.isCreating ||
        !toolState.currentShape ||
        !containerRef.current
      )
        return

      const rect = containerRef.current.getBoundingClientRect()
      const canvasPoint = {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      }

      // Snap to grid if enabled
      const snappedPoint = snapToGrid
        ? {
            x: Math.round(canvasPoint.x / gridSize) * gridSize,
            y: Math.round(canvasPoint.y / gridSize) * gridSize,
          }
        : canvasPoint

      // Update shape based on current tool
      const updatedShape = updateShapeForTool(
        toolState.currentShape,
        toolState.startPoint!,
        snappedPoint,
        toolState.activeShapeType!
      )

      setToolState((prev) => ({
        ...prev,
        currentPoint: snappedPoint,
        previewShape: updatedShape,
      }))
    },
    [toolState, zoom, pan, snapToGrid, gridSize]
  )

  /**
   * Handle mouse up to complete shape creation
   */
  const handleMouseUp = useCallback(() => {
    if (!toolState.isCreating || !toolState.previewShape) return

    // Finalize the shape
    onShapeCreate(toolState.previewShape)

    // Reset tool state
    setToolState({
      activeShapeType: null,
      isCreating: false,
      currentShape: null,
      startPoint: null,
      currentPoint: null,
      previewShape: null,
    })
  }, [toolState, onShapeCreate])

  /**
   * Handle keyboard events for shape creation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && toolState.isCreating) {
        // Cancel shape creation
        setToolState({
          activeShapeType: null,
          isCreating: false,
          currentShape: null,
          startPoint: null,
          currentPoint: null,
          previewShape: null,
        })
      }
    },
    [toolState]
  )

  return (
    <div
      ref={containerRef}
      className="shape-tool-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: activeTool && isShapeTool(activeTool) ? 'auto' : 'none',
        cursor: getShapeToolCursor(activeTool),
      }}
    >
      {/* Preview shape rendering would go here */}
      {toolState.previewShape && (
        <ShapePreview shape={toolState.previewShape} />
      )}
    </div>
  )
}

/**
 * Shape preview component for showing shape being created
 */
function ShapePreview({ shape }: { shape: ShapeNode }) {
  // This would render the shape preview during creation
  // For now, return null as we need to implement the actual rendering
  return null
}

/**
 * Check if tool is a shape creation tool
 */
function isShapeTool(tool: ToolType): boolean {
  return [
    ToolType.Shape,
    // Add specific shape tools when implemented
  ].includes(tool)
}

/**
 * Get shape type from tool
 */
function getShapeTypeFromTool(tool: ToolType): ShapeNodeType | null {
  switch (tool) {
    case ToolType.Shape:
      return ShapeNodeType.RECTANGLE // Default shape
    default:
      return null
  }
}

/**
 * Get cursor for shape tool
 */
function getShapeToolCursor(tool: ToolType | null): string {
  if (!tool || !isShapeTool(tool)) return 'default'

  return 'crosshair'
}

/**
 * Create initial shape based on type and start point
 */
function createInitialShape(
  shapeType: ShapeNodeType,
  startPoint: Point2D
): ShapeNode | null {
  switch (shapeType) {
    case ShapeNodeType.RECTANGLE:
      return ShapeNode.createRectangle(
        `rectangle_${Date.now()}`,
        'Rectangle',
        startPoint,
        { width: 0, height: 0 } // Will be updated during mouse move
      )

    case ShapeNodeType.ELLIPSE:
      return ShapeNode.createEllipse(
        `ellipse_${Date.now()}`,
        'Ellipse',
        startPoint,
        { width: 0, height: 0 } // Will be updated during mouse move
      )

    case ShapeNodeType.PATH:
      return ShapeNode.createPath(`path_${Date.now()}`, 'Path', [
        { point: startPoint, type: 'corner' as any },
      ])

    default:
      return null
  }
}

/**
 * Update shape based on tool type and mouse movement
 */
function updateShapeForTool(
  shape: ShapeNode,
  startPoint: Point2D,
  currentPoint: Point2D,
  shapeType: ShapeNodeType
): ShapeNode {
  const width = Math.abs(currentPoint.x - startPoint.x)
  const height = Math.abs(currentPoint.y - startPoint.y)
  const position = {
    x: Math.min(startPoint.x, currentPoint.x) + width / 2,
    y: Math.min(startPoint.y, currentPoint.y) + height / 2,
  }

  switch (shapeType) {
    case ShapeNodeType.RECTANGLE:
      const rectangle = shape.shape as any
      return new ShapeNode(
        shape.id,
        shape.name,
        shape.shapeType,
        {
          ...rectangle,
          position,
          size: { width, height },
        },
        shape.properties
      )

    case ShapeNodeType.ELLIPSE:
      const ellipse = shape.shape as any
      return new ShapeNode(
        shape.id,
        shape.name,
        shape.shapeType,
        {
          ...ellipse,
          position,
          size: { width, height },
        },
        shape.properties
      )

    case ShapeNodeType.PATH:
      // For path tools, we'd add vertices as the user clicks
      // For now, return the original shape
      return shape

    default:
      return shape
  }
}

/**
 * Shape tool palette component
 */
export function ShapeToolPalette({
  activeTool,
  onToolSelect,
}: {
  activeTool: ToolType | null
  onToolSelect: (tool: ToolType) => void
}) {
  const shapeTools = [
    {
      type: ToolType.Shape,
      name: 'Rectangle',
      icon: '⬜',
      shortcut: 'R',
    },
    // Add more shape tools as implemented
  ]

  return (
    <div className="shape-tool-palette">
      {shapeTools.map((tool) => (
        <button
          key={tool.type}
          className={`shape-tool-button ${activeTool === tool.type ? 'active' : ''}`}
          onClick={() => onToolSelect(tool.type)}
          title={`${tool.name} (${tool.shortcut})`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  )
}

/**
 * Shape properties panel for editing shape attributes
 */
export function ShapePropertiesPanel({
  selectedShape,
  onShapeUpdate,
}: {
  selectedShape: ShapeNode | null
  onShapeUpdate: (updates: any) => void
}) {
  if (!selectedShape) {
    return <div className="shape-properties-empty">No shape selected</div>
  }

  const handlePropertyChange = (property: string, value: any) => {
    onShapeUpdate({ [property]: value })
  }

  return (
    <div className="shape-properties-panel">
      <h3>Shape Properties</h3>

      <div className="property-group">
        <label>Position</label>
        <div className="property-inputs">
          <input
            type="number"
            value={selectedShape.shape.position?.x || 0}
            onChange={(e) =>
              handlePropertyChange('position.x', parseFloat(e.target.value))
            }
            step="0.1"
          />
          <input
            type="number"
            value={selectedShape.shape.position?.y || 0}
            onChange={(e) =>
              handlePropertyChange('position.y', parseFloat(e.target.value))
            }
            step="0.1"
          />
        </div>
      </div>

      <div className="property-group">
        <label>Size</label>
        <div className="property-inputs">
          <input
            type="number"
            value={selectedShape.shape.size?.width || 0}
            onChange={(e) =>
              handlePropertyChange('size.width', parseFloat(e.target.value))
            }
            step="0.1"
          />
          <input
            type="number"
            value={selectedShape.shape.size?.height || 0}
            onChange={(e) =>
              handlePropertyChange('size.height', parseFloat(e.target.value))
            }
            step="0.1"
          />
        </div>
      </div>

      <div className="property-group">
        <label>Rotation</label>
        <input
          type="number"
          value={selectedShape.shape.rotation || 0}
          onChange={(e) =>
            handlePropertyChange('rotation', parseFloat(e.target.value))
          }
          step="0.1"
        />
      </div>

      {/* Shape-specific properties would go here */}
      {selectedShape.shapeType === ShapeNodeType.RECTANGLE && (
        <div className="property-group">
          <label>Corner Radius</label>
          <input
            type="number"
            value={(selectedShape.shape as any).cornerRadius || 0}
            onChange={(e) =>
              handlePropertyChange('cornerRadius', parseFloat(e.target.value))
            }
            min="0"
            step="0.1"
          />
        </div>
      )}

      {selectedShape.shapeType === ShapeNodeType.ELLIPSE && (
        <div className="property-group">
          <label>Inner Radius</label>
          <input
            type="number"
            value={(selectedShape.shape as any).innerRadius || 0}
            onChange={(e) =>
              handlePropertyChange('innerRadius', parseFloat(e.target.value))
            }
            min="0"
            max="1"
            step="0.01"
          />
        </div>
      )}
    </div>
  )
}

/**
 * Shape preset browser for quick shape creation
 */
export function ShapePresetBrowser({
  onShapeSelect,
}: {
  onShapeSelect: (shape: ShapeNode) => void
}) {
  // TODO: Implement shape presets system
  const presets = [
    {
      id: 'basic-rectangle',
      name: 'Rectangle',
      category: 'basic',
      shape: ShapeNode.createRectangle(
        'preset-rect',
        'Rectangle',
        { x: 0, y: 0 },
        { width: 100, height: 100 }
      ),
    },
    {
      id: 'basic-ellipse',
      name: 'Ellipse',
      category: 'basic',
      shape: ShapeNode.createEllipse(
        'preset-ellipse',
        'Ellipse',
        { x: 0, y: 0 },
        { width: 100, height: 100 }
      ),
    },
  ]

  return (
    <div className="shape-preset-browser">
      <h3>Shape Presets</h3>
      <div className="preset-grid">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="preset-item"
            onClick={() => onShapeSelect(preset.shape)}
          >
            <div className="preset-icon">⬜</div>
            <div className="preset-name">{preset.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Advanced shape editing tools
 */
export function AdvancedShapeTools({
  selectedShape,
  onShapeOperation,
}: {
  selectedShape: ShapeNode | null
  onShapeOperation: (operation: string, params?: any) => void
}) {
  if (!selectedShape) return null

  const operations = [
    { id: 'convert-to-path', name: 'Convert to Path', icon: '📝' },
    { id: 'simplify-path', name: 'Simplify Path', icon: '✂️' },
    { id: 'add-rounded-corners', name: 'Rounded Corners', icon: '⭕' },
    { id: 'boolean-union', name: 'Boolean Union', icon: '🔗' },
    { id: 'boolean-difference', name: 'Boolean Difference', icon: '➖' },
  ]

  return (
    <div className="advanced-shape-tools">
      <h4>Shape Operations</h4>
      <div className="tool-buttons">
        {operations.map((op) => (
          <button
            key={op.id}
            className="shape-operation-button"
            onClick={() => onShapeOperation(op.id)}
            title={op.name}
          >
            {op.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
