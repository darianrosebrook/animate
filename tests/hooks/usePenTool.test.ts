/**
 * @fileoverview usePenTool Hook Tests
 * @description Unit tests for pen tool functionality
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePenTool } from '../../src/ui/hooks/usePenTool'
import { ToolType, NodeType } from '../../src/types'

// Mock the canvasToWorld utility
vi.mock('../../src/ui/canvas/selection-utils', () => ({
  canvasToWorld: vi.fn((point, zoom, pan) => ({
    x: point.x / zoom - pan.x,
    y: point.y / zoom - pan.y,
  })),
}))

describe('usePenTool', () => {
  let mockOnPathCreate: ReturnType<typeof vi.fn>
  let mockOnPathUpdate: ReturnType<typeof vi.fn>
  let mockOnPathComplete: ReturnType<typeof vi.fn>
  let mockOnSelectionChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnPathCreate = vi.fn()
    mockOnPathUpdate = vi.fn()
    mockOnPathComplete = vi.fn()
    mockOnSelectionChange = vi.fn()
  })

  it('should initialize with default pen tool state', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    expect(result.current.isDrawing).toBe(false)
    expect(result.current.currentPath).toEqual([])
    expect(result.current.previewPoint).toBe(null)
    expect(result.current.isClosingPath).toBe(false)
    expect(result.current.editingPathId).toBe(null)
    expect(result.current.editingControlPoint).toBe(null)
    expect(result.current.isDraggingControlPoint).toBe(false)
  })

  it('should return correct hook structure', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    expect(result.current).toHaveProperty('isDrawing')
    expect(result.current).toHaveProperty('currentPath')
    expect(result.current).toHaveProperty('previewPoint')
    expect(result.current).toHaveProperty('isClosingPath')
    expect(result.current).toHaveProperty('editingPathId')
    expect(result.current).toHaveProperty('editingControlPoint')
    expect(result.current).toHaveProperty('isDraggingControlPoint')
    expect(result.current).toHaveProperty('startDrawing')
    expect(result.current).toHaveProperty('continueDrawing')
    expect(result.current).toHaveProperty('finishDrawing')
    expect(result.current).toHaveProperty('cancelDrawing')
    expect(result.current).toHaveProperty('handlePointClick')
    expect(result.current).toHaveProperty('handleControlPointDrag')
    expect(result.current).toHaveProperty('generateSVGPath')
    expect(result.current).toHaveProperty('getPathBounds')
  })

  it('should start drawing when startDrawing is called', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    const point = { x: 100, y: 150 }

    act(() => {
      result.current.startDrawing(point)
    })

    expect(result.current.isDrawing).toBe(true)
    expect(result.current.currentPath).toEqual([point])
    expect(result.current.previewPoint).toBe(null)
  })

  it('should continue drawing when continueDrawing is called', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    const point1 = { x: 100, y: 150 }
    const point2 = { x: 200, y: 250 }

    act(() => {
      result.current.startDrawing(point1)
      result.current.continueDrawing(point2)
    })

    expect(result.current.isDrawing).toBe(true)
    expect(result.current.currentPath).toEqual([point1, point2])
  })

  it('should finish drawing when finishDrawing is called', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    const point1 = { x: 100, y: 150 }
    const point2 = { x: 200, y: 250 }

    act(() => {
      result.current.startDrawing(point1)
      result.current.continueDrawing(point2)
      result.current.finishDrawing()
    })

    expect(result.current.isDrawing).toBe(false)
    expect(result.current.currentPath).toEqual([])
    expect(mockOnPathComplete).toHaveBeenCalledWith([point1, point2])
  })

  it('should cancel drawing when cancelDrawing is called', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    const point = { x: 100, y: 150 }

    act(() => {
      result.current.startDrawing(point)
      result.current.cancelDrawing()
    })

    expect(result.current.isDrawing).toBe(false)
    expect(result.current.currentPath).toEqual([])
    expect(mockOnPathComplete).not.toHaveBeenCalled()
  })

  it('should generate SVG path correctly', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    const points = [
      { x: 100, y: 150 },
      { x: 200, y: 250 },
      { x: 300, y: 100 },
    ]

    let svgPath: string
    act(() => {
      svgPath = result.current.generateSVGPath(points)
    })

    expect(svgPath).toBe('M 100 150 L 200 250 L 300 100')
  })

  it('should generate SVG path for single point', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    const points = [{ x: 100, y: 150 }]

    let svgPath: string
    act(() => {
      svgPath = result.current.generateSVGPath(points)
    })

    expect(svgPath).toBe('M 100 150')
  })

  it('should generate SVG path for empty points', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    let svgPath: string
    act(() => {
      svgPath = result.current.generateSVGPath([])
    })

    expect(svgPath).toBe('')
  })

  it('should calculate path bounds correctly', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    const points = [
      { x: 100, y: 150 },
      { x: 200, y: 250 },
      { x: 300, y: 100 },
    ]

    let bounds: { minX: number; minY: number; maxX: number; maxY: number }
    act(() => {
      bounds = result.current.getPathBounds(points)
    })

    expect(bounds).toEqual({
      minX: 100,
      minY: 100,
      maxX: 300,
      maxY: 250,
    })
  })

  it('should handle empty points in bounds calculation', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    let bounds: { minX: number; minY: number; maxX: number; maxY: number }
    act(() => {
      bounds = result.current.getPathBounds([])
    })

    expect(bounds).toEqual({
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    })
  })

  it('should handle point click when not drawing', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    const point = { x: 100, y: 150 }

    act(() => {
      result.current.handlePointClick(point)
    })

    expect(result.current.isDrawing).toBe(true)
    expect(result.current.currentPath).toEqual([point])
  })

  it('should handle point click when drawing (close path)', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    const point1 = { x: 100, y: 150 }
    const point2 = { x: 200, y: 250 }

    act(() => {
      result.current.startDrawing(point1)
      result.current.continueDrawing(point2)
      result.current.handlePointClick(point1) // Click on first point to close
    })

    expect(result.current.isDrawing).toBe(false)
    expect(result.current.isClosingPath).toBe(true)
    expect(mockOnPathComplete).toHaveBeenCalledWith([point1, point2, point1])
  })

  it('should handle control point drag', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    act(() => {
      result.current.handleControlPointDrag(0, { x: 110, y: 160 })
    })

    expect(result.current.editingControlPoint).toBe(0)
    expect(result.current.isDraggingControlPoint).toBe(true)
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        selectedLayers: [],
        onPathCreate: mockOnPathCreate,
        onPathUpdate: mockOnPathUpdate,
        onPathComplete: mockOnPathComplete,
        onSelectionChange: mockOnSelectionChange,
      })
    )

    // Should not throw any errors on unmount
    expect(() => unmount()).not.toThrow()
  })
})
