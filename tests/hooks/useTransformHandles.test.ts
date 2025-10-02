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
      clientX: 150,
      clientY: 150,
    } as React.MouseEvent

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

  it('should handle transform handle mouse move', () => {
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
        handleType: 'corner bottom-right',
        startPoint: { x: 100, y: 100 },
      })
    })

    const mockEvent = {
      clientX: 250,
      clientY: 250,
    } as React.MouseEvent

    act(() => {
      result.current.handleTransformHandleMouseMove(mockEvent)
    })

    // Should call onLayerUpdate for the selected layer
    expect(mockOnLayerUpdate).toHaveBeenCalledWith('layer1', expect.any(Object))
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

  it('should not update layers when not transforming', () => {
    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: mockSelectedLayers,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    const mockEvent = {
      clientX: 150,
      clientY: 150,
    } as React.MouseEvent

    act(() => {
      result.current.handleTransformHandleMouseMove(mockEvent)
    })

    expect(mockOnLayerUpdate).not.toHaveBeenCalled()
  })

  it('should handle multiple selected layers', () => {
    const layers = [
      {
        id: 'layer1',
        name: 'Layer 1',
        type: NodeType.Shape,
        properties: {
          position: { x: 100, y: 100 },
          scale: { x: 1, y: 1 },
        },
        children: [],
        bounds: { minX: 100, minY: 100, maxX: 200, maxY: 200 },
      },
      {
        id: 'layer2',
        name: 'Layer 2',
        type: NodeType.Shape,
        properties: {
          position: { x: 300, y: 100 },
          scale: { x: 1, y: 1 },
        },
        children: [],
        bounds: { minX: 300, minY: 100, maxX: 400, maxY: 200 },
      },
    ]

    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: layers,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    const mockEvent = {
      clientX: 150,
      clientY: 150,
    } as React.MouseEvent

    act(() => {
      result.current.setTransformState({
        isTransforming: true,
        handleType: 'corner top-left',
        startPoint: { x: 100, y: 100 },
      })
      result.current.handleTransformHandleMouseMove(mockEvent)
    })

    // Should call onLayerUpdate for both layers
    expect(mockOnLayerUpdate).toHaveBeenCalledTimes(2)
    expect(mockOnLayerUpdate).toHaveBeenCalledWith('layer1', expect.any(Object))
    expect(mockOnLayerUpdate).toHaveBeenCalledWith('layer2', expect.any(Object))
  })

  it('should handle empty selected layers', () => {
    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: [],
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    const mockEvent = {
      clientX: 150,
      clientY: 150,
    } as React.MouseEvent

    act(() => {
      result.current.handleTransformHandleMouseDown(
        mockEvent,
        'corner top-left'
      )
    })

    expect(result.current.transformState.isTransforming).toBe(false)
    expect(result.current.transformState.handleType).toBe(null)
  })

  it('should update transform state correctly', () => {
    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: mockSelectedLayers,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    const newState = {
      isTransforming: true,
      handleType: 'edge right',
      startPoint: { x: 200, y: 150 },
    }

    act(() => {
      result.current.setTransformState(newState)
    })

    expect(result.current.transformState).toEqual(newState)
  })

  it('should calculate transform correctly for different handle types', () => {
    const { result } = renderHook(() =>
      useTransformHandles({
        selectedLayers: mockSelectedLayers,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    // Test corner handle transformation
    act(() => {
      result.current.setTransformState({
        isTransforming: true,
        handleType: 'corner bottom-right',
        startPoint: { x: 200, y: 200 },
      })
    })

    const mockEvent = {
      clientX: 250,
      clientY: 250,
    } as React.MouseEvent

    act(() => {
      result.current.handleTransformHandleMouseMove(mockEvent)
    })

    expect(mockOnLayerUpdate).toHaveBeenCalledWith('layer1', expect.any(Object))
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() =>
      useTransformHandles({
        selectedLayers: mockSelectedLayers,
        onLayerUpdate: mockOnLayerUpdate,
      })
    )

    // Should not throw any errors on unmount
    expect(() => unmount()).not.toThrow()
  })
})
