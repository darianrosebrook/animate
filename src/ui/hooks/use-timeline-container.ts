import { useState, useEffect, useRef } from 'react'

/**
 * Hook to get the timeline container width dynamically
 */
export function useTimelineContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(350) // Default timeline width

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }

    // Initial measurement
    updateWidth()

    // Set up resize observer for dynamic updates
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateWidth)
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current)
      }
      return () => resizeObserver.disconnect()
    } else {
      // Fallback for browsers without ResizeObserver
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }
  }, [])

  return { containerRef, containerWidth }
}

