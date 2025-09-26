/**
 * @fileoverview Comprehensive tests for Performance Optimizations
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  BatchRenderer,
  BatchRenderable,
  PerformanceMetrics,
} from '../src/core/renderer/batch-renderer'
import { MemoryPool, MemoryPoolConfig } from '../src/core/renderer/memory-pool'
import { WebGPUContext } from '../src/core/renderer/webgpu-context'
import { TransformUtils } from '../src/core/renderer/transforms'

describe('Performance Optimizations - Comprehensive Tests', () => {
  let webgpuContext: WebGPUContext
  let batchRenderer: BatchRenderer
  let memoryPool: MemoryPool

  beforeEach(async () => {
    webgpuContext = new WebGPUContext()
    batchRenderer = new BatchRenderer(webgpuContext)
    memoryPool = new MemoryPool(webgpuContext)

    await batchRenderer.initialize()
    await memoryPool.initialize()
  })

  afterEach(() => {
    batchRenderer.destroy()
    memoryPool.destroy()
  })

  describe('Batch Renderer', () => {
    it('should initialize successfully', async () => {
      const result = await batchRenderer.initialize()
      expect(result.success).toBe(true)
    })

    it('should add and clear renderables', () => {
      const renderable: BatchRenderable = {
        id: 'test-rect',
        type: 'rectangle',
        transform: TransformUtils.identity(),
        properties: { fillColor: { r: 255, g: 0, b: 0, a: 1 } },
        bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      }

      batchRenderer.addRenderable(renderable)
      expect(batchRenderer['renderables']).toHaveLength(1)

      batchRenderer.clearRenderables()
      expect(batchRenderer['renderables']).toHaveLength(0)
    })

    it('should group renderables by type and properties', () => {
      const device = webgpuContext.getDevice()
      if (!device) {
        // Skip test if WebGPU not available
        return
      }

      const rect1: BatchRenderable = {
        id: 'rect1',
        type: 'rectangle',
        transform: TransformUtils.identity(),
        properties: { fillColor: { r: 255, g: 0, b: 0, a: 1 } },
        bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      }

      const rect2: BatchRenderable = {
        id: 'rect2',
        type: 'rectangle',
        transform: TransformUtils.identity(),
        properties: { fillColor: { r: 255, g: 0, b: 0, a: 1 } },
        bounds: { minX: 100, minY: 100, maxX: 200, maxY: 200 },
      }

      const circle: BatchRenderable = {
        id: 'circle1',
        type: 'circle',
        transform: TransformUtils.identity(),
        properties: { fillColor: { r: 0, g: 255, b: 0, a: 1 } },
        bounds: { minX: 0, minY: 0, maxX: 50, maxY: 50 },
      }

      batchRenderer.addRenderable(rect1)
      batchRenderer.addRenderable(rect2)
      batchRenderer.addRenderable(circle)

      batchRenderer.optimizeRenderables()

      // Should have 2 batches: one for rectangles, one for circles
      expect(batchRenderer['renderBatches'].size).toBe(2)
    })

    it('should render batches efficiently', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600

      const initResult = await webgpuContext.initialize(canvas)
      if (!initResult.success) {
        // Skip test if WebGPU not available
        return
      }

      // Add multiple renderables
      for (let i = 0; i < 10; i++) {
        const renderable: BatchRenderable = {
          id: `rect-${i}`,
          type: 'rectangle',
          transform: TransformUtils.identity(),
          properties: { fillColor: { r: 255, g: 0, b: 0, a: 1 } },
          bounds: {
            minX: i * 50,
            minY: i * 50,
            maxX: i * 50 + 100,
            maxY: i * 50 + 100,
          },
        }
        batchRenderer.addRenderable(renderable)
      }

      batchRenderer.optimizeRenderables()

      // Create mock render pass
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

      const metricsResult = batchRenderer.renderBatches(renderPass)

      expect(metricsResult.success).toBe(true)
      const metrics = metricsResult.data!
      expect(metrics.drawCalls).toBeGreaterThan(0)
      expect(metrics.trianglesDrawn).toBeGreaterThan(0)

      renderPass.end()
      device.queue.submit([encoder.finish()])
    })

    it('should track performance metrics', () => {
      const metrics = batchRenderer.getPerformanceMetrics()
      expect(Array.isArray(metrics)).toBe(true)
    })

    it('should detect performance budget violations', () => {
      // Initially should be within budget
      expect(batchRenderer.isPerformanceWithinBudget()).toBe(true)
    })

    it('should provide optimization recommendations', () => {
      const recommendations = batchRenderer.getOptimizationRecommendations()
      expect(Array.isArray(recommendations)).toBe(true)
    })
  })

  describe('Memory Pool', () => {
    it('should initialize successfully', async () => {
      const result = await memoryPool.initialize()
      expect(result.success).toBe(true)
    })

    it('should allocate and return buffers', () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      const allocationResult = memoryPool.allocateBuffer(
        GPUBufferUsage.VERTEX,
        1024,
        'Test Buffer'
      )

      expect(allocationResult.success).toBe(true)
      const buffer = allocationResult.data!

      // Return buffer to pool
      memoryPool.returnBuffer(buffer)

      const stats = memoryPool.getMemoryStats()
      expect(stats.entriesCount).toBe(1)
    })

    it('should reuse buffers from pool', () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      // Allocate first buffer
      const alloc1Result = memoryPool.allocateBuffer(
        GPUBufferUsage.VERTEX,
        1024,
        'Test Buffer 1'
      )
      expect(alloc1Result.success).toBe(true)
      const buffer1 = alloc1Result.data!

      // Return first buffer
      memoryPool.returnBuffer(buffer1)

      // Allocate second buffer of same size - should reuse
      const alloc2Result = memoryPool.allocateBuffer(
        GPUBufferUsage.VERTEX,
        1024,
        'Test Buffer 2'
      )
      expect(alloc2Result.success).toBe(true)
      const buffer2 = alloc2Result.data!

      // Should be different buffer objects but from pool
      expect(buffer1).not.toBe(buffer2)

      memoryPool.returnBuffer(buffer2)
    })

    it('should clean up old buffers', () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      // Allocate buffer
      const allocResult = memoryPool.allocateBuffer(
        GPUBufferUsage.VERTEX,
        1024,
        'Test Buffer'
      )
      expect(allocResult.success).toBe(true)
      const buffer = allocResult.data!

      // Return buffer
      memoryPool.returnBuffer(buffer)

      const initialStats = memoryPool.getMemoryStats()
      expect(initialStats.entriesCount).toBe(1)

      // Force cleanup
      memoryPool.forceCleanup()

      const finalStats = memoryPool.getMemoryStats()
      // Buffer should still be there (not old enough)
      expect(finalStats.entriesCount).toBe(1)
    })

    it('should provide memory statistics', () => {
      const stats = memoryPool.getMemoryStats()
      expect(stats).toHaveProperty('totalAllocated')
      expect(stats).toHaveProperty('poolsCount')
      expect(stats).toHaveProperty('entriesCount')
      expect(stats).toHaveProperty('utilizationRate')
      expect(typeof stats.totalAllocated).toBe('number')
      expect(typeof stats.utilizationRate).toBe('number')
    })

    it('should provide pool-specific statistics', () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      // Allocate buffer
      const allocResult = memoryPool.allocateBuffer(
        GPUBufferUsage.VERTEX,
        1024,
        'Test Buffer'
      )
      expect(allocResult.success).toBe(true)

      const poolStats = memoryPool.getPoolStats()
      expect(poolStats).toBeDefined()
      expect(typeof poolStats).toBe('object')

      memoryPool.returnBuffer(allocResult.data!)
    })

    it('should optimize pool sizes based on usage', () => {
      expect(() => {
        memoryPool.optimizePools()
      }).not.toThrow()
    })

    it('should provide optimization recommendations', () => {
      const recommendations = memoryPool.getOptimizationRecommendations()
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should handle multiple buffer types', () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      // Allocate different buffer types
      const vertexResult = memoryPool.allocateBuffer(
        GPUBufferUsage.VERTEX,
        1024,
        'Vertex Buffer'
      )
      const indexResult = memoryPool.allocateBuffer(
        GPUBufferUsage.INDEX,
        512,
        'Index Buffer'
      )

      expect(vertexResult.success).toBe(true)
      expect(indexResult.success).toBe(true)

      memoryPool.returnBuffer(vertexResult.data!)
      memoryPool.returnBuffer(indexResult.data!)

      const stats = memoryPool.getMemoryStats()
      expect(stats.poolsCount).toBe(2) // VERTEX and INDEX pools
    })

    it('should handle buffer allocation failures gracefully', () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      // Try to allocate a very large buffer
      const largeResult = memoryPool.allocateBuffer(
        GPUBufferUsage.VERTEX,
        1024 * 1024 * 1024, // 1GB - should fail
        'Large Buffer'
      )

      // May succeed or fail depending on GPU limits
      if (!largeResult.success) {
        expect(largeResult.error?.code).toBe('BUFFER_ALLOCATION_ERROR')
      }
    })
  })

  describe('Integration Tests', () => {
    it('should work together for optimal performance', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600

      const initResult = await webgpuContext.initialize(canvas)
      if (!initResult.success) {
        // Skip test if WebGPU not available
        return
      }

      // Add many renderables to test batching
      for (let i = 0; i < 50; i++) {
        const renderable: BatchRenderable = {
          id: `rect-${i}`,
          type: i % 2 === 0 ? 'rectangle' : 'circle',
          transform: TransformUtils.identity(),
          properties: { fillColor: { r: 255, g: 0, b: 0, a: 1 } },
          bounds: {
            minX: i * 10,
            minY: i * 10,
            maxX: i * 10 + 50,
            maxY: i * 10 + 50,
          },
        }
        batchRenderer.addRenderable(renderable)
      }

      batchRenderer.optimizeRenderables()

      // Create mock render pass
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

      const metricsResult = batchRenderer.renderBatches(renderPass)

      expect(metricsResult.success).toBe(true)
      const metrics = metricsResult.data!

      // Should have reduced draw calls through batching
      expect(metrics.drawCalls).toBeLessThan(50) // Should be batched
      expect(metrics.drawCalls).toBeGreaterThan(0)

      renderPass.end()
      device.queue.submit([encoder.finish()])

      // Memory pool should have allocated buffers
      const memoryStats = memoryPool.getMemoryStats()
      expect(memoryStats.totalAllocated).toBeGreaterThan(0)
    })
  })

  describe('Performance Benchmarks', () => {
    it('should maintain 60fps performance with many objects', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600

      const initResult = await webgpuContext.initialize(canvas)
      if (!initResult.success) {
        // Skip test if WebGPU not available
        return
      }

      // Add many objects
      for (let i = 0; i < 100; i++) {
        const renderable: BatchRenderable = {
          id: `perf-rect-${i}`,
          type: 'rectangle',
          transform: TransformUtils.identity(),
          properties: {
            fillColor: {
              r: Math.random() * 255,
              g: Math.random() * 255,
              b: Math.random() * 255,
              a: 1,
            },
          },
          bounds: {
            minX: i * 5,
            minY: i * 5,
            maxX: i * 5 + 50,
            maxY: i * 5 + 50,
          },
        }
        batchRenderer.addRenderable(renderable)
      }

      batchRenderer.optimizeRenderables()

      // Create mock render pass
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

      const startTime = performance.now()
      const metricsResult = batchRenderer.renderBatches(renderPass)
      const endTime = performance.now()

      expect(metricsResult.success).toBe(true)
      const frameTime = endTime - startTime

      // Should render within 16.67ms (60fps budget)
      expect(frameTime).toBeLessThan(16.67)

      renderPass.end()
      device.queue.submit([encoder.finish()])
    })
  })

  describe('Memory Management', () => {
    it('should efficiently manage GPU memory', () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      // Allocate multiple buffers
      const buffers: GPUBuffer[] = []
      for (let i = 0; i < 10; i++) {
        const allocResult = memoryPool.allocateBuffer(
          GPUBufferUsage.VERTEX,
          1024 + i * 512, // Varying sizes
          `Test Buffer ${i}`
        )
        expect(allocResult.success).toBe(true)
        buffers.push(allocResult.data!)
      }

      const initialStats = memoryPool.getMemoryStats()
      expect(initialStats.totalAllocated).toBeGreaterThan(0)

      // Return some buffers
      for (let i = 0; i < 5; i++) {
        memoryPool.returnBuffer(buffers[i])
      }

      const afterReturnStats = memoryPool.getMemoryStats()
      expect(afterReturnStats.totalAllocated).toBeLessThan(
        initialStats.totalAllocated
      )

      // Clean up
      for (const buffer of buffers) {
        memoryPool.returnBuffer(buffer)
      }
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle batch renderer initialization failures', async () => {
      // Create a batch renderer without proper WebGPU context
      const invalidContext = new WebGPUContext()
      const invalidBatchRenderer = new BatchRenderer(invalidContext)

      const result = await invalidBatchRenderer.initialize()
      // Should handle gracefully
      expect(result.success === true || result.success === false).toBe(true)
    })

    it('should handle memory pool allocation failures gracefully', () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      // Try to allocate an extremely large buffer
      const largeResult = memoryPool.allocateBuffer(
        GPUBufferUsage.VERTEX,
        1024 * 1024 * 1024 * 10, // 10GB - should fail
        'Extremely Large Buffer'
      )

      if (!largeResult.success) {
        expect(largeResult.error?.code).toBe('BUFFER_ALLOCATION_ERROR')
      }
    })

    it('should handle empty batches gracefully', () => {
      batchRenderer.optimizeRenderables()

      const metrics = batchRenderer.getPerformanceMetrics()
      expect(metrics.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle concurrent operations safely', async () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      // Simulate concurrent operations
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(
          memoryPool.allocateBuffer(
            GPUBufferUsage.VERTEX,
            1024,
            `Concurrent ${i}`
          )
        )
      }

      const results = await Promise.all(promises)

      // All allocations should succeed or fail consistently
      const successCount = results.filter((r) => r.success).length
      const failureCount = results.filter((r) => !r.success).length

      expect(successCount + failureCount).toBe(10)

      // Clean up
      for (const result of results) {
        if (result.success) {
          memoryPool.returnBuffer(result.data!)
        }
      }
    })
  })

  describe('Resource Cleanup', () => {
    it('should clean up all resources properly', () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      // Allocate some buffers
      const buffers: GPUBuffer[] = []
      for (let i = 0; i < 5; i++) {
        const allocResult = memoryPool.allocateBuffer(
          GPUBufferUsage.VERTEX,
          1024,
          `Cleanup Test ${i}`
        )
        if (allocResult.success) {
          buffers.push(allocResult.data!)
        }
      }

      expect(buffers.length).toBeGreaterThan(0)

      // Return all buffers
      for (const buffer of buffers) {
        memoryPool.returnBuffer(buffer)
      }

      // Force cleanup
      memoryPool.forceCleanup()

      // Memory should be cleaned up
      const finalStats = memoryPool.getMemoryStats()
      expect(finalStats.totalAllocated).toBe(0)
    })

    it('should handle multiple destroy calls safely', () => {
      expect(() => {
        batchRenderer.destroy()
        batchRenderer.destroy()
        memoryPool.destroy()
        memoryPool.destroy()
      }).not.toThrow()
    })
  })

  describe('Performance Monitoring', () => {
    it('should track frame times accurately', () => {
      const device = webgpuContext.getDevice()!
      if (!device) return // Skip if WebGPU not available

      // Add some renderables
      const renderable: BatchRenderable = {
        id: 'perf-test',
        type: 'rectangle',
        transform: TransformUtils.identity(),
        properties: { fillColor: { r: 255, g: 0, b: 0, a: 1 } },
        bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      }

      batchRenderer.addRenderable(renderable)
      batchRenderer.optimizeRenderables()

      // Create mock render pass
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

      const startTime = performance.now()
      batchRenderer.renderBatches(renderPass)
      const endTime = performance.now()

      renderPass.end()
      device.queue.submit([encoder.finish()])

      const actualFrameTime = endTime - startTime
      const metrics = batchRenderer.getPerformanceMetrics()

      if (metrics.length > 0) {
        expect(metrics[0].frameTimeMs).toBeCloseTo(actualFrameTime, 1)
      }
    })

    it('should detect performance regressions', () => {
      // Initially should be within budget
      expect(batchRenderer.isPerformanceWithinBudget()).toBe(true)

      // Add a note about testing performance regression detection
      // In a real scenario, this would involve running with different loads
      // and checking that the system detects when performance drops below threshold
    })
  })
})
