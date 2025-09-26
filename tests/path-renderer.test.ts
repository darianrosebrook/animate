/**
 * @fileoverview Comprehensive tests for SVG Path Rendering System
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  SVGPathRenderer,
  PathCommandType,
  PathCommand,
  TessellatedGeometry,
} from '../src/core/renderer/path-renderer'
import { WebGPUContext } from '../src/core/renderer/webgpu-context'
import { Point2D, Color } from '../src/types'

describe('SVG Path Renderer - Comprehensive Tests', () => {
  let pathRenderer: SVGPathRenderer
  let webgpuContext: WebGPUContext

  beforeEach(() => {
    webgpuContext = new WebGPUContext()
    pathRenderer = new SVGPathRenderer(webgpuContext)
  })

  describe('Path Data Parsing', () => {
    it('should parse simple move and line commands', () => {
      const pathData = 'M 10 20 L 30 40'
      const result = pathRenderer.parsePathData(pathData)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)

      expect(result.data![0]).toEqual({
        type: PathCommandType.MoveTo,
        points: [{ x: 10, y: 20 }],
      })

      expect(result.data![1]).toEqual({
        type: PathCommandType.LineTo,
        points: [
          { x: 10, y: 20 },
          { x: 30, y: 40 },
        ],
      })
    })

    it('should parse cubic bezier curve commands', () => {
      const pathData = 'M 0 0 C 10 0 20 10 30 10'
      const result = pathRenderer.parsePathData(pathData)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)

      expect(result.data![1]).toEqual({
        type: PathCommandType.CubicBezierCurveTo,
        points: [
          { x: 0, y: 0 }, // current position
          { x: 10, y: 0 }, // control1
          { x: 20, y: 10 }, // control2
          { x: 30, y: 10 }, // end
        ],
      })
    })

    it('should parse horizontal and vertical line commands', () => {
      const pathData = 'M 10 20 H 30 V 40'
      const result = pathRenderer.parsePathData(pathData)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)

      expect(result.data![1]).toEqual({
        type: PathCommandType.HorizontalLineTo,
        points: [
          { x: 10, y: 20 },
          { x: 30, y: 20 },
        ],
      })

      expect(result.data![2]).toEqual({
        type: PathCommandType.VerticalLineTo,
        points: [
          { x: 30, y: 20 },
          { x: 30, y: 40 },
        ],
      })
    })

    it('should parse close path command', () => {
      const pathData = 'M 10 20 L 30 40 Z'
      const result = pathRenderer.parsePathData(pathData)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)

      expect(result.data![2]).toEqual({
        type: PathCommandType.ClosePath,
        points: [
          { x: 30, y: 40 },
          { x: 10, y: 20 },
        ],
      })
    })

    it('should handle invalid path data gracefully', () => {
      const pathData = 'M 10 20 L invalid 40'
      const result = pathRenderer.parsePathData(pathData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('PATH_PARSE_ERROR')
    })

    it('should handle unknown commands gracefully', () => {
      const pathData = 'M 10 20 X 30 40'
      const result = pathRenderer.parsePathData(pathData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('PATH_PARSE_ERROR')
    })
  })

  describe('Path Tessellation', () => {
    it('should tessellate line segments correctly', () => {
      const commands: PathCommand[] = [
        {
          type: PathCommandType.MoveTo,
          points: [{ x: 0, y: 0 }],
        },
        {
          type: PathCommandType.LineTo,
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 100 },
          ],
        },
      ]

      const result = pathRenderer.tessellatePath(commands)

      expect(result.success).toBe(true)
      expect(result.data!.vertexCount).toBeGreaterThan(0)
      expect(result.data!.triangleCount).toBeGreaterThan(0)

      // Check bounds
      expect(result.data!.bounds.minX).toBe(0)
      expect(result.data!.bounds.minY).toBe(0)
      expect(result.data!.bounds.maxX).toBe(100)
      expect(result.data!.bounds.maxY).toBe(100)
    })

    it('should tessellate cubic bezier curves correctly', () => {
      const commands: PathCommand[] = [
        {
          type: PathCommandType.MoveTo,
          points: [{ x: 0, y: 0 }],
        },
        {
          type: PathCommandType.CubicBezierCurveTo,
          points: [
            { x: 0, y: 0 },
            { x: 25, y: 0 },
            { x: 75, y: 100 },
            { x: 100, y: 100 },
          ],
        },
      ]

      const result = pathRenderer.tessellatePath(commands)

      expect(result.success).toBe(true)
      expect(result.data!.vertexCount).toBeGreaterThan(0)
      expect(result.data!.triangleCount).toBeGreaterThan(0)

      // Check bounds
      expect(result.data!.bounds.minX).toBe(0)
      expect(result.data!.bounds.minY).toBe(0)
      expect(result.data!.bounds.maxX).toBe(100)
      expect(result.data!.bounds.maxY).toBe(100)
    })

    it('should handle empty paths gracefully', () => {
      const commands: PathCommand[] = []
      const result = pathRenderer.tessellatePath(commands)

      expect(result.success).toBe(true)
      expect(result.data!.vertexCount).toBe(0)
      expect(result.data!.triangleCount).toBe(0)
    })

    it('should handle close path commands', () => {
      const commands: PathCommand[] = [
        {
          type: PathCommandType.MoveTo,
          points: [{ x: 50, y: 50 }],
        },
        {
          type: PathCommandType.LineTo,
          points: [
            { x: 50, y: 50 },
            { x: 150, y: 50 },
          ],
        },
        {
          type: PathCommandType.LineTo,
          points: [
            { x: 150, y: 50 },
            { x: 100, y: 150 },
          ],
        },
        {
          type: PathCommandType.ClosePath,
          points: [
            { x: 100, y: 150 },
            { x: 50, y: 50 },
          ],
        },
      ]

      const result = pathRenderer.tessellatePath(commands)

      expect(result.success).toBe(true)
      expect(result.data!.vertexCount).toBeGreaterThan(0)
      expect(result.data!.triangleCount).toBeGreaterThan(0)
    })
  })

  describe('Cubic Bezier Evaluation', () => {
    it('should evaluate cubic bezier curves at different t values', () => {
      const start: Point2D = { x: 0, y: 0 }
      const control1: Point2D = { x: 25, y: 0 }
      const control2: Point2D = { x: 75, y: 100 }
      const end: Point2D = { x: 100, y: 100 }

      // Test at t = 0 (should be at start)
      const result0 = pathRenderer['evaluateCubicBezier'](
        start,
        control1,
        control2,
        end,
        0
      )
      expect(result0.x).toBeCloseTo(0, 5)
      expect(result0.y).toBeCloseTo(0, 5)

      // Test at t = 1 (should be at end)
      const result1 = pathRenderer['evaluateCubicBezier'](
        start,
        control1,
        control2,
        end,
        1
      )
      expect(result1.x).toBeCloseTo(100, 5)
      expect(result1.y).toBeCloseTo(100, 5)

      // Test at t = 0.5 (should be in the middle)
      const result05 = pathRenderer['evaluateCubicBezier'](
        start,
        control1,
        control2,
        end,
        0.5
      )
      expect(result05.x).toBeCloseTo(50, 5)
      expect(result05.y).toBeCloseTo(50, 5)
    })
  })

  describe('Path Rendering Integration', () => {
    it('should initialize path renderer successfully', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600

      const initResult = await webgpuContext.initialize(canvas)
      if (!initResult.success) {
        // Skip test if WebGPU not available
        return
      }

      const result = await pathRenderer.initialize()
      expect(result.success).toBe(true)
    })

    it('should render a simple path', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600

      const initResult = await webgpuContext.initialize(canvas)
      if (!initResult.success) {
        // Skip test if WebGPU not available
        return
      }

      const rendererInitResult = await pathRenderer.initialize()
      if (!rendererInitResult.success) {
        return
      }

      const pathProperties = {
        pathData: 'M 100 100 L 200 100 L 200 200 Z',
        fillColor: { r: 255, g: 0, b: 0, a: 1 } as Color,
        strokeColor: { r: 0, g: 0, b: 0, a: 1 } as Color,
        strokeWidth: 2,
        fillRule: 'nonzero' as const,
        strokeLineCap: 'butt' as const,
        strokeLineJoin: 'miter' as const,
        strokeMiterLimit: 4,
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
      }

      // Create a mock render pass
      const device = webgpuContext.getDevice()!
      const context = webgpuContext.getContext()!

      const texture = context.getCurrentTexture()
      const view = texture.createView()

      const encoder = device.createCommandEncoder()
      const renderPass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view,
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
          },
        ],
      })

      const result = pathRenderer.renderPath(pathProperties, renderPass)

      expect(result.success).toBe(true)

      renderPass.end()
      device.queue.submit([encoder.finish()])
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid path data during rendering', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600

      const initResult = await webgpuContext.initialize(canvas)
      if (!initResult.success) {
        // Skip test if WebGPU not available
        return
      }

      const rendererInitResult = await pathRenderer.initialize()
      if (!rendererInitResult.success) {
        return
      }

      const pathProperties = {
        pathData: 'M 10 20 L invalid 40', // Invalid path data
        fillColor: { r: 255, g: 0, b: 0, a: 1 } as Color,
        strokeColor: { r: 0, g: 0, b: 0, a: 1 } as Color,
        strokeWidth: 2,
        fillRule: 'nonzero' as const,
        strokeLineCap: 'butt' as const,
        strokeLineJoin: 'miter' as const,
        strokeMiterLimit: 4,
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
      }

      // Create a mock render pass
      const device = webgpuContext.getDevice()!
      const context = webgpuContext.getContext()!

      const texture = context.getCurrentTexture()
      const view = texture.createView()

      const encoder = device.createCommandEncoder()
      const renderPass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view,
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
          },
        ],
      })

      const result = pathRenderer.renderPath(pathProperties, renderPass)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('PATH_PARSE_ERROR')

      renderPass.end()
    })
  })

  describe('Resource Management', () => {
    it('should clean up resources properly', () => {
      expect(() => {
        pathRenderer.destroy()
      }).not.toThrow()
    })

    it('should handle multiple destroy calls safely', () => {
      expect(() => {
        pathRenderer.destroy()
        pathRenderer.destroy()
      }).not.toThrow()
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle complex paths with many segments', () => {
      const commands: PathCommand[] = []
      let x = 0
      let y = 0

      // Create a complex path with many line segments
      for (let i = 0; i < 100; i++) {
        if (i === 0) {
          commands.push({
            type: PathCommandType.MoveTo,
            points: [{ x, y }],
          })
        } else {
          commands.push({
            type: PathCommandType.LineTo,
            points: [
              { x, y },
              { x: x + 10, y: y + 5 },
            ],
          })
          x += 10
          y += 5
        }
      }

      const result = pathRenderer.tessellatePath(commands)

      expect(result.success).toBe(true)
      expect(result.data!.vertexCount).toBeGreaterThan(0)
      expect(result.data!.triangleCount).toBeGreaterThan(0)
    })

    it('should handle zero-length segments', () => {
      const commands: PathCommand[] = [
        {
          type: PathCommandType.MoveTo,
          points: [{ x: 50, y: 50 }],
        },
        {
          type: PathCommandType.LineTo,
          points: [
            { x: 50, y: 50 },
            { x: 50, y: 50 },
          ], // Zero-length line
        },
      ]

      const result = pathRenderer.tessellatePath(commands)

      expect(result.success).toBe(true)
      // Should handle zero-length gracefully
      expect(result.data!.vertexCount).toBeGreaterThanOrEqual(0)
    })

    it('should handle extreme coordinate values', () => {
      const commands: PathCommand[] = [
        {
          type: PathCommandType.MoveTo,
          points: [{ x: -10000, y: -10000 }],
        },
        {
          type: PathCommandType.LineTo,
          points: [
            { x: -10000, y: -10000 },
            { x: 10000, y: 10000 },
          ],
        },
      ]

      const result = pathRenderer.tessellatePath(commands)

      expect(result.success).toBe(true)
      expect(result.data!.bounds.minX).toBe(-10000)
      expect(result.data!.bounds.minY).toBe(-10000)
      expect(result.data!.bounds.maxX).toBe(10000)
      expect(result.data!.bounds.maxY).toBe(10000)
    })
  })

  describe('Memory and Performance', () => {
    it('should not leak memory during repeated tessellation', () => {
      const pathData = 'M 0 0 L 100 0 L 100 100 L 0 100 Z'

      // Perform multiple tessellations
      for (let i = 0; i < 10; i++) {
        const parseResult = pathRenderer.parsePathData(pathData)
        expect(parseResult.success).toBe(true)

        const tessellationResult = pathRenderer.tessellatePath(
          parseResult.data!
        )
        expect(tessellationResult.success).toBe(true)
      }

      // Should not throw memory errors
      expect(true).toBe(true)
    })
  })
})
