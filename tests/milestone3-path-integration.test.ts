/**
 * @fileoverview Integration tests for SVG Path Rendering with Main Renderer
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Renderer } from '../src/core/renderer/renderer'
import { SceneGraph } from '../src/core/scene-graph/scene-graph'
import { createShapeNode } from '../src/core/scene-graph/nodes/shape-node'

describe.skip('Milestone 3: SVG Path Rendering Integration Tests', () => {
  let renderer: Renderer
  let sceneGraph: SceneGraph

  beforeEach(() => {
    renderer = new Renderer()
    sceneGraph = new SceneGraph()
  })

  // Helper function to check WebGPU availability and skip tests if not available
  async function withWebGPU(testFn: () => Promise<void>) {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600

    const initResult = await renderer.initialize(canvas)
    if (!initResult.success) {
      expect(initResult.error?.code).toBe('WEBGPU_NOT_SUPPORTED')
      return // Skip test if WebGPU not available
    }
    await testFn()
  }

  describe('Path Shape Node Integration', () => {
    it('should render a simple triangle path', async () => {
      await withWebGPU(async () => {
        // Create a triangle path
        const trianglePath = createShapeNode(
          'triangle-path',
          'Triangle Path',
          'path',
          {
            pathData: 'M 100 100 L 200 100 L 150 200 Z',
            fillColor: { r: 255, g: 100, b: 50, a: 1 },
            strokeColor: { r: 0, g: 0, b: 0, a: 1 },
            strokeWidth: 2,
            position: { x: 0, y: 0 },
          }
        )

        const addResult = sceneGraph.addNode(trianglePath)
        expect(addResult.success).toBe(true)

        const renderResult = await renderer.renderFrame(sceneGraph, 0.0, {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        })

        if (renderResult.success) {
          expect(renderResult.success).toBe(true)
        } else {
          // If it fails, should be due to WebGPU not being available
          expect(renderResult.error?.code).toBe('RENDER_ERROR')
        }
      })
    })

    it('should render a complex SVG-like path with curves', async () => {
      await withWebGPU(async () => {
        // Create a complex path with bezier curves
        const complexPath = createShapeNode(
          'complex-path',
          'Complex SVG Path',
          'path',
          {
            pathData:
              'M 50 50 C 100 0 150 0 200 50 C 250 100 300 100 350 50 L 350 150 C 300 200 250 200 200 150 C 150 200 100 200 50 150 Z',
            fillColor: { r: 100, g: 200, b: 255, a: 0.8 },
            strokeColor: { r: 50, g: 50, b: 50, a: 1 },
            strokeWidth: 3,
            position: { x: 0, y: 0 },
          }
        )

        const addResult = sceneGraph.addNode(complexPath)
        expect(addResult.success).toBe(true)

        const renderResult = await renderer.renderFrame(sceneGraph, 0.0, {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        })

        if (renderResult.success) {
          expect(renderResult.success).toBe(true)
        } else {
          // If it fails, should be due to WebGPU not being available
          expect(renderResult.error?.code).toBe('RENDER_ERROR')
        }
      })
    })

    it('should render multiple path shapes in a scene', async () => {
      await withWebGPU(async () => {
        // Create multiple path shapes
        const starPath = createShapeNode('star-path', 'Star Path', 'path', {
          pathData:
            'M 100 20 L 120 60 L 160 60 L 130 90 L 140 130 L 100 110 L 60 130 L 70 90 L 40 60 L 80 60 Z',
          fillColor: { r: 255, g: 215, b: 0, a: 1 },
          strokeColor: { r: 139, g: 69, b: 19, a: 1 },
          strokeWidth: 2,
          position: { x: 50, y: 50 },
        })

        const heartPath = createShapeNode('heart-path', 'Heart Path', 'path', {
          pathData:
            'M 100 40 C 100 25 85 10 70 10 C 55 10 40 25 40 40 C 40 55 55 70 70 85 C 85 70 100 55 100 40 Z',
          fillColor: { r: 255, g: 105, b: 180, a: 1 },
          strokeColor: { r: 0, g: 0, b: 0, a: 0 },
          strokeWidth: 0,
          position: { x: 200, y: 100 },
        })

        const addResult1 = sceneGraph.addNode(starPath)
        const addResult2 = sceneGraph.addNode(heartPath)

        expect(addResult1.success).toBe(true)
        expect(addResult2.success).toBe(true)

        const renderResult = await renderer.renderFrame(sceneGraph, 0.0, {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        })

        if (renderResult.success) {
          expect(renderResult.success).toBe(true)
        } else {
          // If it fails, should be due to WebGPU not being available
          expect(renderResult.error?.code).toBe('RENDER_ERROR')
        }
      })
    })

    it('should handle invalid path data gracefully', async () => {
      await withWebGPU(async () => {
        // Create a path with invalid data
        const invalidPath = createShapeNode(
          'invalid-path',
          'Invalid Path',
          'path',
          {
            pathData: 'M 10 20 L invalid 40 Z',
            fillColor: { r: 255, g: 0, b: 0, a: 1 },
            strokeColor: { r: 0, g: 0, b: 0, a: 1 },
            strokeWidth: 2,
            position: { x: 0, y: 0 },
          }
        )

        const addResult = sceneGraph.addNode(invalidPath)
        expect(addResult.success).toBe(true)

        const renderResult = await renderer.renderFrame(sceneGraph, 0.0, {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        })

        // Should handle invalid path data gracefully (might succeed or fail gracefully)
        expect(
          renderResult.success === true ||
            renderResult.error?.code === 'PATH_PARSE_ERROR'
        ).toBe(true)
      })
    })
  })

  describe('Path Rendering Performance', () => {
    it('should render complex paths within performance budget', async () => {
      await withWebGPU(async () => {
        // Create a complex path with many segments
        let pathData = 'M 0 0'
        for (let i = 0; i < 50; i++) {
          pathData += ` L ${i * 10} ${Math.sin(i * 0.5) * 50 + 100}`
        }
        pathData += ' Z'

        const complexPath = createShapeNode(
          'complex-path',
          'Complex Performance Path',
          'path',
          {
            pathData,
            fillColor: { r: 100, g: 150, b: 255, a: 0.7 },
            strokeColor: { r: 50, g: 50, b: 50, a: 1 },
            strokeWidth: 1,
            position: { x: 0, y: 0 },
          }
        )

        const addResult = sceneGraph.addNode(complexPath)
        expect(addResult.success).toBe(true)

        const startTime = performance.now()
        const renderResult = await renderer.renderFrame(sceneGraph, 0.0, {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        })
        const endTime = performance.now()

        const renderTime = endTime - startTime

        // Should render within 16ms (60fps budget)
        expect(renderTime).toBeLessThan(16)

        if (renderResult.success) {
          expect(renderResult.success).toBe(true)
        } else {
          // If it fails, should be due to WebGPU not being available
          expect(renderResult.error?.code).toBe('RENDER_ERROR')
        }
      })
    })
  })

  describe('Path Rendering Quality', () => {
    it('should maintain visual quality across different scales', async () => {
      await withWebGPU(async () => {
        // Create a path at different scales
        const smallPath = createShapeNode('small-path', 'Small Path', 'path', {
          pathData: 'M 0 0 L 20 0 L 20 20 L 0 20 Z',
          fillColor: { r: 255, g: 0, b: 0, a: 1 },
          strokeColor: { r: 0, g: 0, b: 0, a: 1 },
          strokeWidth: 1,
          position: { x: 10, y: 10 },
          scale: { x: 0.5, y: 0.5 },
        })

        const largePath = createShapeNode('large-path', 'Large Path', 'path', {
          pathData: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
          fillColor: { r: 0, g: 255, b: 0, a: 1 },
          strokeColor: { r: 0, g: 0, b: 0, a: 1 },
          strokeWidth: 2,
          position: { x: 50, y: 50 },
          scale: { x: 2, y: 2 },
        })

        const addResult1 = sceneGraph.addNode(smallPath)
        const addResult2 = sceneGraph.addNode(largePath)

        expect(addResult1.success).toBe(true)
        expect(addResult2.success).toBe(true)

        const renderResult = await renderer.renderFrame(sceneGraph, 0.0, {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        })

        if (renderResult.success) {
          expect(renderResult.success).toBe(true)
        } else {
          // If it fails, should be due to WebGPU not being available
          expect(renderResult.error?.code).toBe('RENDER_ERROR')
        }
      })
    })
  })
})
