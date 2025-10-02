/**
 * @fileoverview usePenTool Hook Tests
 * @description Unit tests for pen tool functionality
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePenTool } from '../../src/ui/hooks/usePenTool'
import { ToolType } from '../../src/types'

// Mock the canvasToWorld utility
vi.mock('../../src/ui/canvas/selection-utils', () => ({
  canvasToWorld: vi.fn((point, zoom, pan) => ({
    x: point.x / zoom - pan.x,
    y: point.y / zoom - pan.y,
  })),
}))

describe('usePenTool', () => {
  let mockOnLayerUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnLayerUpdate = vi.fn()
  })

  it('should initialize with default pen tool state', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    expect(result.current.penToolState.isDrawing).toBe(false)
    expect(result.current.penToolState.currentPath).toEqual([])
    expect(result.current.penToolState.previewPoint).toBe(null)
  })

  it('should return correct hook structure', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    expect(result.current.penToolState).toBeDefined()
    expect(typeof result.current.handlePenToolDown).toBe('function')
    expect(typeof result.current.handlePenToolMove).toBe('function')
    expect(typeof result.current.handlePenToolUp).toBe('function')
    expect(typeof result.current.generateSVGPathFromPoints).toBe('function')
  })

  it('should generate SVG path from points correctly', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]

    const path = result.current.generateSVGPathFromPoints(points)
    expect(path).toContain('M 0 0')
    expect(path).toContain('Q 100 0 100 100')
  })

  it('should handle pen tool mouse down', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 100,
      clientY: 200,
    } as unknown as React.MouseEvent

    act(() => {
      result.current.handlePenToolDown(mockEvent, { x: 100, y: 200 })
    })

    expect(result.current.penToolState.isDrawing).toBe(true)
  })

  it('should handle pen tool mouse move', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 150,
      clientY: 250,
    } as unknown as React.MouseEvent

    // Start drawing first
    act(() => {
      result.current.handlePenToolDown(mockEvent, { x: 150, y: 250 })
    })

    // Then move
    act(() => {
      result.current.handlePenToolMove(mockEvent, { x: 150, y: 250 })
    })

    expect(result.current.penToolState.currentPath.length).toBeGreaterThan(0)
  })

  it('should handle pen tool mouse up', () => {
    const { result } = renderHook(() =>
      usePenTool({
        scene: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 100,
      clientY: 200,
    } as unknown as React.MouseEvent

    // Start drawing
    act(() => {
      result.current.handlePenToolDown(mockEvent, { x: 100, y: 200 })
    })

    // Finish drawing
    act(() => {
      result.current.handlePenToolUp(mockEvent)
    })

    expect(result.current.penToolState.isDrawing).toBe(false)
  })
})
