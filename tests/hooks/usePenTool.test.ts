import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePenTool } from '@/ui/hooks/usePenTool'
import { ToolType } from '@/types'

describe('usePenTool', () => {
  const mockScene = {
    layers: [
      {
        id: 'layer-1',
        name: 'Layer 1',
        type: 'shape' as const,
        properties: {},
        children: [],
      },
    ],
  }

  it('initializes with default pen tool state', () => {
    const onLayerUpdate = vi.fn()

    const { result } = renderHook(() =>
      usePenTool({
        scene: mockScene,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        onLayerUpdate,
      })
    )

    expect(result.current.penToolState.isDrawing).toBe(false)
    expect(result.current.penToolState.currentPath).toEqual([])
    expect(result.current.penToolState.previewPoint).toBeNull()
    expect(result.current.penToolState.isClosingPath).toBe(false)
    expect(result.current.penToolState.editingPathId).toBeNull()
    expect(result.current.penToolState.editingControlPoint).toBeNull()
    expect(result.current.penToolState.isDraggingControlPoint).toBe(false)
  })

  it('starts drawing when pen tool is active and mouse down occurs', () => {
    const onLayerUpdate = vi.fn()
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent

    const { result } = renderHook(() =>
      usePenTool({
        scene: mockScene,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        onLayerUpdate,
      })
    )

    act(() => {
      result.current.handlePenToolDown(mockEvent, { x: 100, y: 200 })
    })

    expect(result.current.penToolState.isDrawing).toBe(true)
    expect(result.current.penToolState.currentPath).toEqual([
      { x: 100, y: 200 },
    ])
  })

  it('generates SVG path from points correctly', () => {
    const onLayerUpdate = vi.fn()

    const { result } = renderHook(() =>
      usePenTool({
        scene: mockScene,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        onLayerUpdate,
      })
    )

    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]

    const path = result.current.generateSVGPathFromPoints(points)
    expect(path).toContain('M 0 0')
    expect(path).toContain('L 100 0')
    expect(path).toContain('L 100 100')
  })

  it('handles empty points array', () => {
    const onLayerUpdate = vi.fn()

    const { result } = renderHook(() =>
      usePenTool({
        scene: mockScene,
        zoom: 1,
        pan: { x: 0, y: 0 },
        activeTool: ToolType.Pen,
        onLayerUpdate,
      })
    )

    const path = result.current.generateSVGPathFromPoints([])
    expect(path).toBe('')
  })
})
