/**
 * @fileoverview useCanvasPanZoom Hook Tests
 * @description Unit tests for canvas pan and zoom functionality
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCanvasPanZoom } from '../../src/ui/hooks/useCanvasPanZoom'

describe('useCanvasPanZoom', () => {
  let mockOnZoom: ReturnType<typeof vi.fn>
  let mockOnPan: ReturnType<typeof vi.fn>
  let mockSetPan: ReturnType<typeof vi.fn>
  let containerRef: React.RefObject<HTMLDivElement>

  beforeEach(() => {
    mockOnZoom = vi.fn()
    mockOnPan = vi.fn()
    mockSetPan = vi.fn()
    containerRef = { current: document.createElement('div') }
  })

  it('should initialize with provided zoom and pan values', () => {
    const { result } = renderHook(() =>
      useCanvasPanZoom({
        zoom: 1.5,
        pan: { x: 100, y: 200 },
        onZoom: mockOnZoom,
        onPan: mockOnPan,
        setPan: mockSetPan,
        containerRef,
      })
    )

    expect(result.current.zoom).toBe(1.5)
    expect(result.current.pan).toEqual({ x: 100, y: 200 })
  })

  it('should return correct hook structure', () => {
    const { result } = renderHook(() =>
      useCanvasPanZoom({
        zoom: 1,
        pan: { x: 0, y: 0 },
        onZoom: mockOnZoom,
        onPan: mockOnPan,
        containerRef,
      })
    )

    expect(result.current).toHaveProperty('zoom')
    expect(result.current).toHaveProperty('pan')
    expect(result.current).toHaveProperty('isPanningRef')
    expect(result.current).toHaveProperty('lastPosRef')
    expect(result.current).toHaveProperty('handleHandToolDown')
    expect(result.current).toHaveProperty('handleHandToolMove')
    expect(result.current).toHaveProperty('handleHandToolUp')
  })

  it('should handle hand tool down event', () => {
    const { result } = renderHook(() =>
      useCanvasPanZoom({
        zoom: 1,
        pan: { x: 0, y: 0 },
        onZoom: mockOnZoom,
        onPan: mockOnPan,
        containerRef,
      })
    )

    const mockEvent = {
      clientX: 100,
      clientY: 150,
    } as React.MouseEvent

    act(() => {
      result.current.handleHandToolDown(mockEvent)
    })

    expect(result.current.isPanningRef.current).toBe(true)
    expect(result.current.lastPosRef.current).toEqual({ x: 100, y: 150 })
  })

  it('should handle hand tool move event', () => {
    const { result } = renderHook(() =>
      useCanvasPanZoom({
        zoom: 1,
        pan: { x: 0, y: 0 },
        onZoom: mockOnZoom,
        onPan: mockOnPan,
        setPan: mockSetPan,
        containerRef,
      })
    )

    // Set up initial state
    act(() => {
      result.current.isPanningRef.current = true
      result.current.lastPosRef.current = { x: 100, y: 150 }
    })

    const mockEvent = {
      clientX: 150,
      clientY: 200,
    } as React.MouseEvent

    act(() => {
      result.current.handleHandToolMove(mockEvent)
    })

    expect(mockOnPan).toHaveBeenCalledWith({ x: 50, y: 50 })
  })

  it('should handle hand tool up event', () => {
    const { result } = renderHook(() =>
      useCanvasPanZoom({
        zoom: 1,
        pan: { x: 0, y: 0 },
        onZoom: mockOnZoom,
        onPan: mockOnPan,
        containerRef,
      })
    )

    // Set up panning state
    act(() => {
      result.current.isPanningRef.current = true
    })

    act(() => {
      result.current.handleHandToolUp()
    })

    expect(result.current.isPanningRef.current).toBe(false)
  })

  it('should not pan when not in panning state', () => {
    const { result } = renderHook(() =>
      useCanvasPanZoom({
        zoom: 1,
        pan: { x: 0, y: 0 },
        onZoom: mockOnZoom,
        onPan: mockOnPan,
        setPan: mockSetPan,
        containerRef,
      })
    )

    const mockEvent = {
      clientX: 150,
      clientY: 200,
    } as React.MouseEvent

    act(() => {
      result.current.handleHandToolMove(mockEvent)
    })

    expect(mockSetPan).not.toHaveBeenCalled()
  })

  it('should handle zoom changes correctly', () => {
    const { result, rerender } = renderHook(
      ({ zoom }) =>
        useCanvasPanZoom({
          zoom,
          pan: { x: 0, y: 0 },
          onZoom: mockOnZoom,
          onPan: mockOnPan,
          containerRef,
        }),
      { initialProps: { zoom: 1 } }
    )

    expect(result.current.zoom).toBe(1)

    rerender({ zoom: 2 })
    expect(result.current.zoom).toBe(2)
  })

  it('should handle pan changes correctly', () => {
    const { result, rerender } = renderHook(
      ({ pan }) =>
        useCanvasPanZoom({
          zoom: 1,
          pan,
          onZoom: mockOnZoom,
          onPan: mockOnPan,
          containerRef,
        }),
      { initialProps: { pan: { x: 0, y: 0 } } }
    )

    expect(result.current.pan).toEqual({ x: 0, y: 0 })

    rerender({ pan: { x: 100, y: 200 } })
    expect(result.current.pan).toEqual({ x: 100, y: 200 })
  })

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() =>
      useCanvasPanZoom({
        zoom: 1,
        pan: { x: 0, y: 0 },
        onZoom: mockOnZoom,
        onPan: mockOnPan,
        containerRef,
      })
    )

    // Should not throw any errors on unmount
    expect(() => unmount()).not.toThrow()
  })
})
