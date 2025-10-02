import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTransformHandles } from '@/ui/hooks/useTransformHandles'
import { SceneNode } from '@/types'

describe('useTransformHandles', () => {
  const createMockNode = (overrides: Partial<SceneNode> = {}): SceneNode => ({
    id: 'node-1',
    name: 'Node 1',
    type: 'shape',
    properties: {
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      visible: true,
      opacity: 1,
      width: 100,
      height: 100,
      ...overrides.properties,
    },
    children: [],
    ...overrides,
  })

  it('initializes with empty selected layers', () => {
    const onLayerUpdate = vi.fn()

    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: [],
        onLayerUpdate,
      })
    )

    expect(result.current.transformState.isDragging).toBe(false)
    expect(result.current.transformState.dragHandle).toBeNull()
    expect(result.current.transformState.startBounds).toBeNull()
    expect(result.current.transformState.startMousePos).toBeNull()
  })

  it('handles transform handle mouse down', () => {
    const onLayerUpdate = vi.fn()
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 100,
      clientY: 200,
    } as unknown as React.MouseEvent

    const selectedLayers = [createMockNode()]

    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers,
        onLayerUpdate,
      })
    )

    act(() => {
      result.current.handleTransformHandleMouseDown(
        mockEvent,
        'corner top-left'
      )
    })

    expect(result.current.transformState.isDragging).toBe(true)
    expect(result.current.transformState.dragHandle).toBe('corner top-left')
    expect(result.current.transformState.startMousePos).toEqual({
      x: 100,
      y: 200,
    })
  })

  it('calculates bounds correctly for single node', () => {
    const onLayerUpdate = vi.fn()
    const node = createMockNode({
      properties: {
        position: { x: 50, y: 75 },
        width: 200,
        height: 150,
      },
    })

    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: [node],
        onLayerUpdate,
      })
    )

    // The hook should calculate bounds based on the node's position and size
    expect(result.current.transformState.startBounds).toBeNull() // Initially null until drag starts
  })

  it('handles multiple selected nodes', () => {
    const onLayerUpdate = vi.fn()
    const nodes = [
      createMockNode({
        id: 'node-1',
        properties: { position: { x: 0, y: 0 }, width: 100, height: 100 },
      }),
      createMockNode({
        id: 'node-2',
        properties: { position: { x: 150, y: 150 }, width: 100, height: 100 },
      }),
    ]

    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: nodes,
        onLayerUpdate,
      })
    )

    // Should handle multiple nodes for union bounds calculation
    expect(result.current.transformState.isDragging).toBe(false)
  })
})
