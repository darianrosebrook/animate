/**
 * useCanvasPanZoom - Custom hook for managing canvas pan and zoom
 * @author @darianrosebrook
 *
 * Handles:
 * - Mouse wheel zoom
 * - Hand tool panning
 * - Spacebar temporary pan
 * - Pan/zoom state synchronization
 */

import { useRef, useEffect, useCallback } from 'react'

export interface UseCanvasPanZoomOptions {
  zoom: number
  pan: { x: number; y: number }
  onZoom: (z: number) => void
  onPan: (pan: { x: number; y: number }) => void
  setPan?: (pan: { x: number; y: number }) => void
  containerRef: React.RefObject<HTMLDivElement>
}

export interface UseCanvasPanZoomReturn {
  isPanningRef: React.MutableRefObject<boolean>
  lastPosRef: React.MutableRefObject<{ x: number; y: number }>
  handleHandToolDown: (e: React.MouseEvent) => void
  handleHandToolMove: (e: React.MouseEvent) => void
  handleHandToolUp: () => void
  startPan: (e: React.MouseEvent) => void
}

/**
 * Custom hook for canvas pan and zoom management
 *
 * @param options - Configuration options for pan/zoom behavior
 * @returns Pan/zoom state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   isPanningRef,
 *   handleHandToolDown,
 *   handleHandToolMove,
 *   handleHandToolUp
 * } = useCanvasPanZoom({
 *   zoom,
 *   pan,
 *   onZoom,
 *   onPan,
 *   setPan,
 *   containerRef
 * })
 * ```
 */
export function useCanvasPanZoom({
  zoom,
  pan,
  onZoom,
  onPan,
  setPan,
  containerRef,
}: UseCanvasPanZoomOptions): UseCanvasPanZoomReturn {
  const isPanningRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Mouse wheel zoom with Ctrl/Cmd modifier
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = -Math.sign(e.deltaY) * 0.1
        onZoom(Math.max(0.05, Math.min(8, zoom * (1 + delta))))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel as any)
  }, [zoom, onZoom, containerRef])

  // Spacebar pan enablement
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space') isPanningRef.current = true
    }
    const up = () => {
      isPanningRef.current = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // Hand tool down handler
  const handleHandToolDown = useCallback((e: React.MouseEvent) => {
    isPanningRef.current = true
    lastPosRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  // Hand tool move handler
  const handleHandToolMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current) {
        const dx = e.clientX - lastPosRef.current.x
        const dy = e.clientY - lastPosRef.current.y
        lastPosRef.current = { x: e.clientX, y: e.clientY }
        onPan({ x: pan.x + dx, y: pan.y + dy })
      }
    },
    [pan, onPan]
  )

  // Hand tool up handler
  const handleHandToolUp = useCallback(() => {
    isPanningRef.current = false
  }, [])

  // Generic pan starter with event listeners
  const startPan = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanningRef.current) return
      lastPosRef.current = { x: e.clientX, y: e.clientY }
      const move = (ev: MouseEvent) => {
        const dx = ev.clientX - lastPosRef.current.x
        const dy = ev.clientY - lastPosRef.current.y
        lastPosRef.current = { x: ev.clientX, y: ev.clientY }
        setPan?.((p) => ({ x: p.x + dx, y: p.y + dy }))
      }
      const up = () => {
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
      }
      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', up)
    },
    [setPan]
  )

  return {
    isPanningRef,
    lastPosRef,
    handleHandToolDown,
    handleHandToolMove,
    handleHandToolUp,
    startPan,
  }
}
