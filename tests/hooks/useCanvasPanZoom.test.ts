import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCanvasPanZoom } from '@/ui/hooks/useCanvasPanZoom'

describe('useCanvasPanZoom', () => {
  it('initializes with provided zoom and pan values', () => {
    const onZoom = vi.fn()
    const onPan = vi.fn()
    const containerRef = { current: null }

    const { result } = renderHook(() =>
      useCanvasPanZoom({
        zoom: 1.5,
        pan: { x: 100, y: 200 },
        onZoom,
        onPan,
        setPan: undefined,
        containerRef,
      })
    )

    expect(result.current.zoom).toBe(1.5)
    expect(result.current.pan).toEqual({ x: 100, y: 200 })
  })

  it('handles zoom changes', () => {
    const onZoom = vi.fn()
    const onPan = vi.fn()
    const containerRef = { current: null }

    const { result } = renderHook(() =>
      useCanvasPanZoom({
        zoom: 1,
        pan: { x: 0, y: 0 },
        onZoom,
        onPan,
        setPan: undefined,
        containerRef,
      })
    )

    act(() => {
      result.current.handleZoom(2)
    })

    expect(onZoom).toHaveBeenCalledWith(2)
  })

  it('handles pan changes', () => {
    const onZoom = vi.fn()
    const onPan = vi.fn()
    const containerRef = { current: null }

    const { result } = renderHook(() =>
      useCanvasPanZoom({
        zoom: 1,
        pan: { x: 0, y: 0 },
        onZoom,
        onPan,
        setPan: undefined,
        containerRef,
      })
    )

    act(() => {
      result.current.handlePan({ x: 50, y: 75 })
    })

    expect(onPan).toHaveBeenCalledWith({ x: 50, y: 75 })
  })
})
