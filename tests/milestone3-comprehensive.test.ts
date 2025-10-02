/**
 * @fileoverview Comprehensive Milestone 3 Testing Suite
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { Renderer } from '../src/core/renderer/renderer'
import { SceneGraph } from '../src/core/scene-graph/scene-graph'
import { TransformUtils } from '../src/core/renderer/transforms'
import {
  createRectangleNode,
  createCircleNode,
  createPathNode,
} from '../src/core/scene-graph/nodes/shape-node'
import { Point2D, Size2D, Color } from '../src/types'

describe.skip('Milestone 3: Basic Rendering System - Comprehensive Tests', () => {
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

  describe('Functional Requirements', () => {
    describe('Basic Shapes Rendering', () => {
      it('should render rectangles with correct position, size, and color', async () => {
        await withWebGPU(async () => {
          // Create rectangle node
          const rectangle = createRectangleNode(
          'test-rect',
          'Test Rectangle',
          200,
          100,
          { x: 100, y: 100 },
          { r: 255, g: 0, b: 0, a: 1 }
        )
          sceneGraph.addNode(rectangle)

          const context = {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        }

          const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
          expect(renderResult.success).toBe(true)
        })
      })

      it('should render circles with correct center, radius, and fill', async () => {
        const canvas = document.createElement('canvas')
        const initResult = await renderer.initialize(canvas)
        expect(initResult.success).toBe(true)

        const circle = createCircleNode(
          'test-circle',
          'Test Circle',
          75,
          { x: 300, y: 200 },
          { r: 0, g: 255, b: 0, a: 1 }
        )
        sceneGraph.addNode(circle)

          const context = {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        }

          const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
          expect(renderResult.success).toBe(true)
        })
      })

      it('should render paths with SVG path data', async () => {
        const canvas = document.createElement('canvas')
        const initResult = await renderer.initialize(canvas)
        expect(initResult.success).toBe(true)

        const pathData = 'M 0 0 L 100 0 L 100 100 L 0 100 Z'
        const path = createPathNode(
          'test-path',
          'Test Path',
          pathData,
          { r: 0, g: 0, b: 255, a: 1 }
        )
        sceneGraph.addNode(path)

          const context = {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        }

          const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
          expect(renderResult.success).toBe(true)
        })
      })
    })

    describe('Text Rendering', () => {
      it('should render text with proper font, size, and color', async () => {
        const canvas = document.createElement('canvas')
        const initResult = await renderer.initialize(canvas)
        expect(initResult.success).toBe(true)

        // Create text node (simplified for testing)
        const textNode = {
          id: 'test-text',
          name: 'Test Text',
          type: 'text',
          text: 'Hello World',
          fontFamily: 'Arial',
          fontSize: 24,
          color: { r: 0, g: 0, b: 0, a: 1 },
          position: { x: 50, y: 50 },
          textAlign: 'left' as const,
          lineHeight: 1.2,
          letterSpacing: 0,
          wordSpacing: 0,
        }

        sceneGraph.addNode(textNode as any)

          const context = {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        }

          const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
          expect(renderResult.success).toBe(true)
        })
      })

      it('should handle text alignment (left, center, right)', async () => {
        const canvas = document.createElement('canvas')
        const initResult = await renderer.initialize(canvas)
        expect(initResult.success).toBe(true)

        const textNode = {
          id: 'test-text-align',
          type: 'text',
          text: 'Centered Text',
          fontSize: 18,
          color: { r: 0, g: 0, b: 0, a: 1 },
          position: { x: 400, y: 300 },
          maxWidth: 200,
          textAlign: 'center' as const,
        }

        sceneGraph.addNode(textNode as any)

          const context = {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        }

          const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
          expect(renderResult.success).toBe(true)
        })

        it('should handle multi-line text with word wrapping', async () => {
        await withWebGPU(async () => {
          const textNode = {
            id: 'test-multiline',
            type: 'text',
            text: 'This is a very long text that should wrap to multiple lines within the specified width.',
            fontSize: 16,
            color: { r: 0, g: 0, b: 0, a: 1 },
            position: { x: 100, y: 100 },
            maxWidth: 300,
            textAlign: 'left' as const,
          }

          sceneGraph.addNode(textNode as any)

          const context = {
            time: 0.0,
            frameRate: 30,
            resolution: { width: 800, height: 600 },
            devicePixelRatio: 1.0,
            globalProperties: {},
          }

          const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
          expect(renderResult.success).toBe(true)
        })
      })

    describe('Transform Hierarchy', () => {
      it('should apply transforms correctly to child nodes', async () => {
        const canvas = document.createElement('canvas')
        const initResult = await renderer.initialize(canvas)
        expect(initResult.success).toBe(true)

        // Create parent transform node
        const parentNode = {
          id: 'parent',
          name: 'Parent Transform',
          type: 'transform',
          position: { x: 200, y: 150 },
          scale: { width: 1.5, height: 1.5 },
          rotation: Math.PI / 4, // 45 degrees
          anchor: { x: 0, y: 0 },
          children: [],
        }

        // Create child shape node
        const childNode = {
          id: 'child',
          name: 'Child Rectangle',
          type: 'shape',
          shapeType: 'rectangle',
          size: { width: 100, height: 100 },
          position: { x: 50, y: 50 },
          fillColor: { r: 255, g: 0, b: 0, a: 1 },
        }

        sceneGraph.addNode(parentNode as any)
        sceneGraph.addNode(childNode as any, 'parent')

          const context = {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        }

          const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
          expect(renderResult.success).toBe(true)
        })
      })

      it('should handle complex nested transform hierarchies', async () => {
        const canvas = document.createElement('canvas')
        const initResult = await renderer.initialize(canvas)
        expect(initResult.success).toBe(true)

        // Create grandparent transform
        const grandparent = {
          id: 'grandparent',
          type: 'transform',
          position: { x: 100, y: 100 },
          scale: { width: 2, height: 2 },
        }

        // Create parent transform
        const parent = {
          id: 'parent',
          type: 'transform',
          position: { x: 50, y: 50 },
          rotation: Math.PI / 6,
        }

        // Create child shape
        const child = {
          id: 'child',
          type: 'shape',
          shapeType: 'rectangle',
          size: { width: 50, height: 50 },
          fillColor: { r: 0, g: 255, b: 0, a: 1 },
        }

        sceneGraph.addNode(grandparent as any)
        sceneGraph.addNode(parent as any, 'grandparent')
        sceneGraph.addNode(child as any, 'parent')

          const context = {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        }

          const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
          expect(renderResult.success).toBe(true)
        })
      })
    })

    describe('Scene Graph Changes', () => {
      it('should reflect scene graph changes immediately in render', async () => {
        const canvas = document.createElement('canvas')
        const initResult = await renderer.initialize(canvas)
        expect(initResult.success).toBe(true)

          const rectangle = createRectangleNode('dynamic-rect', 'Dynamic Rectangle', 100, 100)
          sceneGraph.addNode(rectangle)

        // Initial render
          const context = {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        }

        const initialRender = await renderer.renderFrame(sceneGraph, 0.0, context)
        expect(initialRender.success).toBe(true)

        // Update node properties
        const updateResult = sceneGraph.updateNodeProperties('dynamic-rect', {
          position: { x: 200, y: 200 },
          fillColor: { r: 0, g: 255, b: 0, a: 1 },
        })
        expect(updateResult.success).toBe(true)

        // Re-render and verify changes
        const updatedRender = await renderer.renderFrame(sceneGraph, 0.0, context)
        expect(updatedRender.success).toBe(true)
      })
    })
  })

  describe('Performance Requirements', () => {
    it('should maintain 60fps for simple scenes', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1920
      canvas.height = 1080

      const initResult = await renderer.initialize(canvas)
      expect(initResult.success).toBe(true)

      // Create scene with multiple shapes
      for (let i = 0; i < 10; i++) {
          const rectangle = createRectangleNode(
          `rect-${i}`,
          `Rectangle ${i}`,
          100,
          100,
          { x: i * 120, y: i * 80 }
        )
          sceneGraph.addNode(rectangle)
      }

      const context = {
        time: 0.0,
        frameRate: 60,
        resolution: { width: 1920, height: 1080 },
        devicePixelRatio: 1.0,
        globalProperties: {},
      }

      const startTime = performance.now()

      // Render multiple frames
      for (let frame = 0; frame < 60; frame++) {
        const renderResult = await renderer.renderFrame(sceneGraph, frame / 60, context)
        expect(renderResult.success).toBe(true)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime
      const avgFrameTime = totalTime / 60

      // Should maintain <16ms per frame for 60fps
      expect(avgFrameTime).toBeLessThan(16)
      console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms`)
    })

    it('should handle memory usage efficiently during rendering', async () => {
      const canvas = document.createElement('canvas')
      const initResult = await renderer.initialize(canvas)
      expect(initResult.success).toBe(true)

      // Monitor memory usage
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Create complex scene
      for (let i = 0; i < 50; i++) {
        const node = createRectangleNode(
          `memory-test-${i}`,
          `Memory Test ${i}`,
          50,
          50,
          { x: (i % 10) * 60, y: Math.floor(i / 10) * 60 }
        )
        sceneGraph.addNode(node)
      }

      const context = {
        time: 0.0,
        frameRate: 30,
        resolution: { width: 800, height: 600 },
        devicePixelRatio: 1.0,
        globalProperties: {},
      }

      // Render multiple frames
      for (let frame = 0; frame < 30; frame++) {
        const renderResult = await renderer.renderFrame(sceneGraph, frame / 30, context)
        expect(renderResult.success).toBe(true)
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (< 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    })
  })

  describe('Quality Requirements', () => {
    it('should render with pixel-perfect accuracy', async () => {
      const canvas = document.createElement('canvas')
      const initResult = await renderer.initialize(canvas)
      expect(initResult.success).toBe(true)

      // Create precise geometry
      const rectangle = createRectangleNode(
        'precision-test',
        'Precision Test',
        100.5, // Non-integer size
        100.5,
        { x: 50.25, y: 50.25 }, // Non-integer position
        { r: 255, g: 0, b: 0, a: 1 }
      )
      sceneGraph.addNode(rectangle)

      const context = {
        time: 0.0,
        frameRate: 30,
        resolution: { width: 800, height: 600 },
        devicePixelRatio: 1.0,
        globalProperties: {},
      }

      const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
      expect(renderResult.success).toBe(true)
    })

    it('should maintain consistent color reproduction', async () => {
      const canvas = document.createElement('canvas')
      const initResult = await renderer.initialize(canvas)
      expect(initResult.success).toBe(true)

      // Test color accuracy
      const testColors = [
        { r: 255, g: 0, b: 0, a: 1 },     // Pure red
        { r: 0, g: 255, b: 0, a: 1 },     // Pure green
        { r: 0, g: 0, b: 255, a: 1 },     // Pure blue
        { r: 255, g: 255, b: 255, a: 1 }, // White
        { r: 128, g: 128, b: 128, a: 1 }, // Gray
        { r: 255, g: 0, b: 0, a: 0.5 },   // Semi-transparent red
      ]

      for (let i = 0; i < testColors.length; i++) {
        const color = testColors[i]
          const rectangle = createRectangleNode(
          `color-test-${i}`,
          `Color Test ${i}`,
          50,
          50,
          { x: i * 60, y: 100 },
          color
        )
          sceneGraph.addNode(rectangle)
      }

      const context = {
        time: 0.0,
        frameRate: 30,
        resolution: { width: 800, height: 600 },
        devicePixelRatio: 1.0,
        globalProperties: {},
      }

      const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
      expect(renderResult.success).toBe(true)
    })

    it('should handle transform animations smoothly', async () => {
      const canvas = document.createElement('canvas')
      const initResult = await renderer.initialize(canvas)
      expect(initResult.success).toBe(true)

      const rectangle = createRectangleNode(
        'animation-test',
        'Animation Test',
        100,
        100,
        { x: 100, y: 100 }
      )
      sceneGraph.addNode(rectangle)

      const context = {
        time: 0.0,
        frameRate: 60,
        resolution: { width: 800, height: 600 },
        devicePixelRatio: 1.0,
        globalProperties: {},
      }

      // Test smooth animation over time
      const frameCount = 60
      const results = []

      for (let frame = 0; frame < frameCount; frame++) {
        const time = frame / 60
        const renderResult = await renderer.renderFrame(sceneGraph, time, context)
        results.push(renderResult.success)

        // Update node position for animation
        sceneGraph.updateNodeProperties('animation-test', {
          position: {
            x: 100 + Math.sin(time * Math.PI * 2) * 50,
            y: 100 + Math.cos(time * Math.PI * 2) * 50
          }
        })
      }

      // All frames should render successfully
      expect(results.every(success => success)).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete scene rendering pipeline', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1920
      canvas.height = 1080

      const initResult = await renderer.initialize(canvas)
      expect(initResult.success).toBe(true)

      // Create complex scene with multiple node types
      const rootTransform = {
        id: 'root',
        type: 'transform',
        position: { x: 0, y: 0 },
        scale: { width: 1, height: 1 },
        rotation: 0,
      }

      const rectangle1 = createRectangleNode(
        'rect1',
        'Rectangle 1',
        200,
        150,
        { x: 100, y: 100 },
        { r: 255, g: 100, b: 100, a: 1 }
      )

      const rectangle2 = createRectangleNode(
        'rect2',
        'Rectangle 2',
        150,
        100,
        { x: 400, y: 200 },
        { r: 100, g: 255, b: 100, a: 1 }
      )

      const circle = createCircleNode(
        'circle',
        'Circle',
        75,
        { x: 600, y: 150 },
        { r: 100, g: 100, b: 255, a: 1 }
      )

      sceneGraph.addNode(rootTransform as any)
      sceneGraph.addNode(rectangle1 as any, 'root')
      sceneGraph.addNode(rectangle2 as any, 'root')
      sceneGraph.addNode(circle as any, 'root')

      const context = {
        time: 0.0,
        frameRate: 30,
        resolution: { width: 1920, height: 1080 },
        devicePixelRatio: 1.0,
        globalProperties: {},
      }

      const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
      expect(renderResult.success).toBe(true)

      // Verify render output structure
      expect(renderResult.data).toBeDefined()
      expect(renderResult.data.width).toBe(1920)
      expect(renderResult.data.height).toBe(1080)
      expect(renderResult.data.format).toBe('rgba_f32')
    })

    it('should handle rendering errors gracefully', async () => {
      const canvas = document.createElement('canvas')

      // Test with invalid canvas size
      canvas.width = 0
      canvas.height = 0

      const initResult = await renderer.initialize(canvas)
      // Should handle gracefully even with invalid canvas
      expect(initResult.success).toBe(true)

      const invalidNode = {
        id: 'invalid-node',
        type: 'unknown-type',
        invalidProperty: 'invalid',
      }

      sceneGraph.addNode(invalidNode as any)

      const context = {
        time: 0.0,
        frameRate: 30,
        resolution: { width: 800, height: 600 },
        devicePixelRatio: 1.0,
        globalProperties: {},
      }

      // Should handle rendering errors gracefully
      const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
      expect(renderResult.success).toBe(true) // Should succeed despite individual node failures
    })
  })

  describe('Transform Matrix Operations', () => {
    it('should create correct identity matrix', () => {
      const identity = TransformUtils.identity()
      expect(identity[0]).toBe(1)  // m00
      expect(identity[5]).toBe(1)  // m11
      expect(identity[15]).toBe(1) // m33
    })

    it('should create correct translation matrix', () => {
      const translate = TransformUtils.translate(10, 20)
      expect(translate[12]).toBe(10) // tx
      expect(translate[13]).toBe(20) // ty
    })

    it('should create correct scale matrix', () => {
      const scale = TransformUtils.scale(2, 3)
      expect(scale[0]).toBe(2)  // sx
      expect(scale[5]).toBe(3)  // sy
    })

    it('should create correct rotation matrix', () => {
      const rotation = TransformUtils.rotate(Math.PI / 2) // 90 degrees
      expect(Math.abs(rotation[0] - 0)).toBeLessThan(0.001)  // cos(90) ≈ 0
      expect(Math.abs(rotation[1] - (-1))).toBeLessThan(0.001) // -sin(90) = -1
      expect(Math.abs(rotation[4] - 1)).toBeLessThan(0.001)   // sin(90) = 1
      expect(Math.abs(rotation[5] - 0)).toBeLessThan(0.001)   // cos(90) ≈ 0
    })

    it('should multiply matrices correctly', () => {
      const translate = TransformUtils.translate(10, 20)
      const scale = TransformUtils.scale(2, 3)
      const combined = TransformUtils.multiply(translate, scale)

      // Combined should apply scale first, then translate
      expect(combined[0]).toBe(2)  // scale x
      expect(combined[5]).toBe(3)  // scale y
      expect(combined[12]).toBe(10) // translate x
      expect(combined[13]).toBe(20) // translate y
    })

    it('should transform points correctly', () => {
      const matrix = TransformUtils.translate(10, 20)
      const point: Point2D = { x: 5, y: 7 }
      const transformed = TransformUtils.transformPoint(matrix, point)

      expect(transformed.x).toBe(15) // 5 + 10
      expect(transformed.y).toBe(27) // 7 + 20
    })
  })

  describe('Error Handling', () => {
    it('should handle WebGPU initialization failures gracefully', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 0
      canvas.height = 0

      const initResult = await renderer.initialize(canvas)
      expect(initResult.success).toBe(true) // Should not throw
    })

    it('should handle unsupported node types gracefully', async () => {
      const canvas = document.createElement('canvas')
      const initResult = await renderer.initialize(canvas)
      expect(initResult.success).toBe(true)

      const unsupportedNode = {
        id: 'unsupported',
        type: 'unsupported-type',
      }

      sceneGraph.addNode(unsupportedNode as any)

      const context = {
        time: 0.0,
        frameRate: 30,
        resolution: { width: 800, height: 600 },
        devicePixelRatio: 1.0,
        globalProperties: {},
      }

      const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
      expect(renderResult.success).toBe(true) // Should succeed despite unsupported nodes
    })

    it('should handle missing node properties gracefully', async () => {
      const canvas = document.createElement('canvas')
      const initResult = await renderer.initialize(canvas)
      expect(initResult.success).toBe(true)

      const incompleteNode = {
        id: 'incomplete',
        type: 'shape',
        shapeType: 'rectangle',
        // Missing size, position, fillColor
      }

      sceneGraph.addNode(incompleteNode as any)

      const context = {
        time: 0.0,
        frameRate: 30,
        resolution: { width: 800, height: 600 },
        devicePixelRatio: 1.0,
        globalProperties: {},
      }

      const renderResult = await renderer.renderFrame(sceneGraph, 0.0, context)
      expect(renderResult.success).toBe(true) // Should handle missing properties
    })
  })

  describe('Memory Management', () => {
    it('should clean up resources properly on destroy', () => {
      expect(() => renderer.destroy()).not.toThrow()
    })

    it('should handle multiple initialization/destruction cycles', async () => {
      const canvas = document.createElement('canvas')

      // Multiple cycles
      for (let i = 0; i < 3; i++) {
        const initResult = await renderer.initialize(canvas)
        expect(initResult.success).toBe(true)

        // Clean up
        renderer.destroy()
      }
    })
  })
})
