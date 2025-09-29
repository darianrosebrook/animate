import React, { useState, useRef, useCallback, useEffect } from 'react'
import './CurveEditor.css'

export interface CurvePoint {
  time: number
  value: number
  interpolation: 'linear' | 'bezier' | 'stepped'
  easing?: {
    p1x: number
    p1y: number
    p2x: number
    p2y: number
  }
}

export interface CurveEditorProps {
  points: CurvePoint[]
  duration: number
  height: number
  onPointsChange: (points: CurvePoint[]) => void
  onPointAdd?: (time: number, value: number) => void
  onPointRemove?: (index: number) => void
  onPointUpdate?: (index: number, point: CurvePoint) => void
  className?: string
}

export function CurveEditor({
  points,
  duration,
  height,
  onPointsChange,
  onPointAdd,
  // TODO: Use onPointRemove and onPointUpdate for curve editing
  // onPointRemove,
  // onPointUpdate,
  className = '',
}: CurveEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPoint, setDragPoint] = useState<number | null>(null)
  const [dragHandle, setDragHandle] = useState<
    'point' | 'handle1' | 'handle2' | null
  >(null)
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)

  // Convert time/value to SVG coordinates
  const timeToX = useCallback(
    (time: number) => {
      return (time / duration) * 100
    },
    [duration]
  )

  const valueToY = useCallback(
    (value: number) => {
      return (1 - value) * height
    },
    [height]
  )

  // Convert SVG coordinates to time/value
  const xToTime = useCallback(
    (x: number) => {
      return (x / 100) * duration
    },
    [duration]
  )

  const yToValue = useCallback(
    (y: number) => {
      return 1 - y / height
    },
    [height]
  )

  // Generate SVG path for the curve
  const generateCurvePath = useCallback(() => {
    if (points.length === 0) return ''

    let path = ''

    // Start at first point
    const firstPoint = points[0]
    path += `M ${timeToX(firstPoint.time)},${valueToY(firstPoint.value)}`

    // Draw curve segments
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]

      switch (current.interpolation) {
        case 'linear':
          path += ` L ${timeToX(next.time)},${valueToY(next.value)}`
          break

        case 'bezier':
          if (current.easing && next.easing) {
            const cp1x = timeToX(current.time) + current.easing.p2x * 50
            const cp1y = valueToY(current.value) + current.easing.p2y * height
            const cp2x = timeToX(next.time) + next.easing.p1x * 50
            const cp2y = valueToY(next.value) + next.easing.p1y * height

            path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${timeToX(next.time)},${valueToY(next.value)}`
          } else {
            path += ` L ${timeToX(next.time)},${valueToY(next.value)}`
          }
          break

        case 'stepped':
          const midX = timeToX((current.time + next.time) / 2)
          path += ` L ${midX},${valueToY(current.value)} L ${timeToX(next.time)},${valueToY(current.value)}`
          break
      }
    }

    return path
  }, [points, timeToX, valueToY, duration, height])

  // Handle mouse down on curve
  const handleCurveMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * height

      const time = xToTime(x)
      const value = yToValue(y)

      // Add new point
      if (onPointAdd) {
        onPointAdd(time, value)
      }
    },
    [xToTime, yToValue, height, onPointAdd]
  )

  // Handle mouse down on point
  const handlePointMouseDown = useCallback(
    (event: React.MouseEvent, index: number) => {
      event.stopPropagation()

      setIsDragging(true)
      setDragPoint(index)
      setDragHandle('point')
      setSelectedPoint(index)
    },
    []
  )

  // Handle mouse down on bezier handles
  const handleHandleMouseDown = useCallback(
    (event: React.MouseEvent, index: number, handle: 'handle1' | 'handle2') => {
      event.stopPropagation()

      setIsDragging(true)
      setDragPoint(index)
      setDragHandle(handle)
      setSelectedPoint(index)
    },
    []
  )

  // Handle mouse move
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || dragPoint === null || !svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * height

      const newTime = Math.max(0, Math.min(duration, xToTime(x)))
      const newValue = Math.max(0, Math.min(1, yToValue(y)))

      const updatedPoints = [...points]

      if (dragHandle === 'point') {
        updatedPoints[dragPoint] = {
          ...updatedPoints[dragPoint],
          time: newTime,
          value: newValue,
        }
      } else if (dragHandle === 'handle1' || dragHandle === 'handle2') {
        const point = updatedPoints[dragPoint]
        if (point.interpolation === 'bezier') {
          const easing = point.easing || {
            p1x: 0.25,
            p1y: 0.1,
            p2x: 0.25,
            p2y: 1.0,
          }

          if (dragHandle === 'handle1') {
            easing.p1x = ((newTime - point.time) / duration) * 2
            easing.p1y = ((newValue - point.value) / 1) * 2
          } else {
            easing.p2x = ((newTime - point.time) / duration) * 2
            easing.p2y = ((newValue - point.value) / 1) * 2
          }

          updatedPoints[dragPoint] = {
            ...point,
            easing,
          }
        }
      }

      onPointsChange(updatedPoints)
    },
    [
      isDragging,
      dragPoint,
      dragHandle,
      points,
      duration,
      height,
      xToTime,
      yToValue,
      onPointsChange,
    ]
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragPoint(null)
    setDragHandle(null)
  }, [])

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const curvePath = generateCurvePath()

  return (
    <div className={`curve-editor ${className}`}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 100 ${height}`}
        onMouseDown={handleCurveMouseDown}
        className="curve-editor-svg"
      >
        {/* Grid lines */}
        <defs>
          <pattern
            id="grid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="#333"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height={height} fill="url(#grid)" />

        {/* Curve path */}
        <path
          d={curvePath}
          fill="none"
          stroke="#4ade80"
          strokeWidth="2"
          className="curve-path"
        />

        {/* Control points and handles */}
        {points.map((point, index) => (
          <g key={index}>
            {/* Main point */}
            <circle
              cx={timeToX(point.time)}
              cy={valueToY(point.value)}
              r={selectedPoint === index ? '6' : '4'}
              fill={selectedPoint === index ? '#fbbf24' : '#4ade80'}
              stroke="#fff"
              strokeWidth="2"
              className="curve-point"
              onMouseDown={(e) => handlePointMouseDown(e, index)}
              style={{ cursor: 'move' }}
            />

            {/* Bezier handles */}
            {point.interpolation === 'bezier' && point.easing && (
              <>
                {/* Handle 1 (from previous point) */}
                <circle
                  cx={timeToX(point.time) + point.easing.p1x * 50}
                  cy={valueToY(point.value) + point.easing.p1y * height}
                  r="3"
                  fill="#fbbf24"
                  className="curve-handle"
                  onMouseDown={(e) =>
                    handleHandleMouseDown(e, index, 'handle1')
                  }
                  style={{ cursor: 'move' }}
                />
                <line
                  x1={timeToX(point.time)}
                  y1={valueToY(point.value)}
                  x2={timeToX(point.time) + point.easing.p1x * 50}
                  y2={valueToY(point.value) + point.easing.p1y * height}
                  stroke="#fbbf24"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />

                {/* Handle 2 (to next point) */}
                <circle
                  cx={timeToX(point.time) + point.easing.p2x * 50}
                  cy={valueToY(point.value) + point.easing.p2y * height}
                  r="3"
                  fill="#fbbf24"
                  className="curve-handle"
                  onMouseDown={(e) =>
                    handleHandleMouseDown(e, index, 'handle2')
                  }
                  style={{ cursor: 'move' }}
                />
                <line
                  x1={timeToX(point.time)}
                  y1={valueToY(point.value)}
                  x2={timeToX(point.time) + point.easing.p2x * 50}
                  y2={valueToY(point.value) + point.easing.p2y * height}
                  stroke="#fbbf24"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              </>
            )}
          </g>
        ))}

        {/* Time/value axes */}
        <line
          x1="0"
          y1={height}
          x2="100"
          y2={height}
          stroke="#666"
          strokeWidth="1"
        />
        <line x1="0" y1="0" x2="0" y2={height} stroke="#666" strokeWidth="1" />

        {/* Time labels */}
        {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
          <g key={i}>
            <line
              x1={timeToX(i)}
              y1={height - 5}
              x2={timeToX(i)}
              y2={height}
              stroke="#666"
              strokeWidth="1"
            />
            <text
              x={timeToX(i)}
              y={height + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#999"
            >
              {i}s
            </text>
          </g>
        ))}

        {/* Value labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((value) => (
          <g key={value}>
            <line
              x1="0"
              y1={valueToY(value)}
              x2="5"
              y2={valueToY(value)}
              stroke="#666"
              strokeWidth="1"
            />
            <text
              x="-10"
              y={valueToY(value) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#999"
            >
              {value.toFixed(1)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
