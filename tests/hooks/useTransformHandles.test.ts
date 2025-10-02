/**
 * @fileoverview useTransformHandles Hook Tests
 * @description Unit tests for transform handles functionality
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTransformHandles } from '../../src/ui/hooks/useTransformHandles'
import { SceneNode, NodeType } from '../../src/types'

describe('useTransformHandles', () => {
  let mockOnLayerUpdate: ReturnType<typeof vi.fn>
  let mockSelectedLayers: SceneNode[]

  beforeEach(() => {
    mockOnLayerUpdate = vi.fn()

    mockSelectedLayers = [
      {
        id: 'layer1',
        name: 'Test Layer',
        type: NodeType.Shape,
        properties: {
          position: { x: 100, y: 100 },
          scale: { x: 1, y: 1 },
          rotation: { x: 0, y: 0, z: 0 },
        },
        children: [],
        bounds: { minX: 100, minY: 100, maxX: 200, maxY: 200 },
      },
    ]
  })

  it('should initialize with default transform state', () => {
    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: mockSelectedLayers,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    expect(result.current.transformState.isTransforming).toBe(false)
    expect(result.current.transformState.handleType).toBe(null)
    expect(result.current.transformState.startPoint).toBe(null)
  })

  it('should return correct hook structure', () => {
    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: mockSelectedLayers,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    expect(result.current).toHaveProperty('transformState')
    expect(result.current).toHaveProperty('setTransformState')
    expect(result.current).toHaveProperty('handleTransformHandleMouseDown')
    expect(result.current).toHaveProperty('handleTransformHandleMouseMove')
    expect(result.current).toHaveProperty('handleTransformHandleMouseUp')
  })

  it('should handle transform handle mouse down', () => {
    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: mockSelectedLayers,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 150,
      clientY: 150,
    } as unknown as React.MouseEvent

    act(() => {
      result.current.handleTransformHandleMouseDown(
        mockEvent,
        'corner top-left'
      )
    })

    expect(result.current.transformState.isTransforming).toBe(true)
    expect(result.current.transformState.handleType).toBe('corner top-left')
    expect(result.current.transformState.startPoint).toEqual({ x: 150, y: 150 })
  })

  it('should handle transform handle mouse up', () => {
    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: mockSelectedLayers,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    // Set up initial transform state
    act(() => {
      result.current.setTransformState({
        isTransforming: true,
        handleType: 'edge top',
        startPoint: { x: 150, y: 150 },
      })
    })

    act(() => {
      result.current.handleTransformHandleMouseUp()
    })

    expect(result.current.transformState.isTransforming).toBe(false)
    expect(result.current.transformState.handleType).toBe(null)
    expect(result.current.transformState.startPoint).toBe(null)
  })

  it('should handle empty selected layers', () => {
    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: [],
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 150,
      clientY: 150,
    } as unknown as React.MouseEvent

    act(() => {
      result.current.handleTransformHandleMouseDown(
        mockEvent,
        'corner top-left'
      )
    })

    expect(result.current.transformState.isTransforming).toBe(true)
    expect(result.current.transformState.handleType).toBe('corner top-left')
  })
})
