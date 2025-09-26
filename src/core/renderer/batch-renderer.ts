/**
 * @fileoverview High-Performance Batch Rendering System
 * @author @darianrosebrook
 */

import {
  Result,
  AnimatorError,
  Point2D,
  Size2D,
  Color,
  EvaluationContext,
} from '@/types'
import { WebGPUContext } from './webgpu-context'
import { TransformUtils, TransformMatrix } from './transforms'

/**
 * Batch renderable object interface
 */
export interface BatchRenderable {
  id: string
  type: 'rectangle' | 'circle' | 'text' | 'image'
  transform: TransformMatrix
  properties: Record<string, any>
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

/**
 * Render batch for efficient GPU submission
 */
export interface RenderBatch {
  pipeline: GPURenderPipeline
  vertexBuffer: GPUBuffer
  indexBuffer: GPUBuffer | null
  instanceCount: number
  instanceBuffer: GPUBuffer | null
  bindGroups: GPUBindGroup[]
  firstVertex: number
  firstInstance: number
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  frameTimeMs: number
  drawCalls: number
  trianglesDrawn: number
  vertexCount: number
  memoryUsageMB: number
  batchesUsed: number
  cullingRatio: number
}

/**
 * Batch renderer for high-performance rendering
 */
export class BatchRenderer {
  private webgpuContext: WebGPUContext
  private renderBatches: Map<string, RenderBatch[]> = new Map()
  private renderables: BatchRenderable[] = []
  private frameMetrics: PerformanceMetrics[] = []
  private maxFrameTime = 16.67 // 60fps target
  private maxBatches = 100 // Prevent excessive batching

  // Performance monitoring
  private frameStartTime = 0
  private totalTriangles = 0
  private totalVertices = 0

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  /**
   * Initialize batch renderer
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      console.log(
        '🚀 Batch renderer initialized for high-performance rendering'
      )
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BATCH_RENDERER_INIT_ERROR',
          message: `Failed to initialize batch renderer: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Add renderable object to batch
   */
  addRenderable(renderable: BatchRenderable): void {
    this.renderables.push(renderable)
  }

  /**
   * Clear all renderables for next frame
   */
  clearRenderables(): void {
    this.renderables = []
    this.renderBatches.clear()
  }

  /**
   * Optimize renderables by grouping similar objects
   */
  optimizeRenderables(): void {
    // Group by render pipeline/shader type
    const groups = new Map<string, BatchRenderable[]>()

    for (const renderable of this.renderables) {
      const key = this.getRenderableKey(renderable)
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(renderable)
    }

    // Create batches for each group
    for (const [key, group] of groups) {
      if (group.length > 0) {
        this.createBatchForGroup(key, group)
      }
    }
  }

  /**
   * Create optimized batch for a group of similar renderables
   */
  private createBatchForGroup(
    key: string,
    renderables: BatchRenderable[]
  ): void {
    if (renderables.length === 0) return

    const firstRenderable = renderables[0]
    const device = this.webgpuContext.getDevice()!

    // Determine batch strategy based on renderable type
    switch (firstRenderable.type) {
      case 'rectangle':
        this.createInstancedBatch(
          key,
          renderables,
          this.createRectangleGeometry()
        )
        break
      case 'circle':
        this.createInstancedBatch(key, renderables, this.createCircleGeometry())
        break
      case 'text':
        // Text uses different batching strategy (glyph-based)
        this.createTextBatch(key, renderables)
        break
      case 'image':
        // Images use texture atlas batching
        this.createImageBatch(key, renderables)
        break
      default:
        console.warn(
          `Unknown renderable type for batching: ${firstRenderable.type}`
        )
    }
  }

  /**
   * Create instanced geometry for efficient rendering
   */
  private createInstancedBatch(
    key: string,
    renderables: BatchRenderable[],
    geometry: { vertices: Float32Array; indices: Uint16Array }
  ): void {
    const device = this.webgpuContext.getDevice()!
    const instanceCount = renderables.length

    // Create vertex buffer (shared geometry)
    const vertexBuffer = device.createBuffer({
      size: geometry.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    })

    new Float32Array(vertexBuffer.getMappedRange()).set(geometry.vertices)
    vertexBuffer.unmap()

    // Create instance buffer (per-object data)
    const instanceData = new Float32Array(instanceCount * 16) // 4x4 transform matrix per instance

    for (let i = 0; i < renderables.length; i++) {
      const renderable = renderables[i]
      const matrix = renderable.transform

      // Copy transform matrix to instance buffer
      for (let j = 0; j < 16; j++) {
        instanceData[i * 16 + j] = matrix[j]
      }
    }

    const instanceBuffer = device.createBuffer({
      size: instanceData.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    })

    new Float32Array(instanceBuffer.getMappedRange()).set(instanceData)
    instanceBuffer.unmap()

    // Create index buffer if needed
    let indexBuffer: GPUBuffer | null = null
    if (geometry.indices.length > 0) {
      indexBuffer = device.createBuffer({
        size: geometry.indices.byteLength,
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true,
      })

      new Uint16Array(indexBuffer.getMappedRange()).set(geometry.indices)
      indexBuffer.unmap()
    }

    // Get or create render pipeline for this batch type
    const pipeline = this.getOrCreateBatchPipeline(firstRenderable.type)

    // Create render batch
    const batch: RenderBatch = {
      pipeline,
      vertexBuffer,
      indexBuffer,
      instanceCount,
      instanceBuffer,
      bindGroups: [], // Will be populated during rendering
      firstVertex: 0,
      firstInstance: 0,
    }

    if (!this.renderBatches.has(key)) {
      this.renderBatches.set(key, [])
    }
    this.renderBatches.get(key)!.push(batch)
  }

  /**
   * Create rectangle geometry for instanced rendering
   */
  private createRectangleGeometry(): {
    vertices: Float32Array
    indices: Uint16Array
  } {
    // Rectangle vertices (2 triangles)
    const vertices = new Float32Array([
      // Triangle 1
      -0.5,
      -0.5, // Bottom-left
      0.5,
      -0.5, // Bottom-right
      -0.5,
      0.5, // Top-left

      // Triangle 2
      -0.5,
      0.5, // Top-left
      0.5,
      -0.5, // Bottom-right
      0.5,
      0.5, // Top-right
    ])

    const indices = new Uint16Array([0, 1, 2, 3, 4, 5])

    return { vertices, indices }
  }

  /**
   * Create circle geometry for instanced rendering
   */
  private createCircleGeometry(): {
    vertices: Float32Array
    indices: Uint16Array
  } {
    // Circle approximation with triangles
    const segments = 32
    const vertices: number[] = []
    const indices: number[] = []

    // Center vertex
    vertices.push(0, 0)

    // Circle vertices
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      vertices.push(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5)
    }

    // Create triangles
    for (let i = 1; i <= segments; i++) {
      indices.push(0, i, i + 1)
    }
    indices.push(0, segments, 1) // Close the circle

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
    }
  }

  /**
   * Create text batch using glyph-based rendering
   */
  private createTextBatch(key: string, renderables: BatchRenderable[]): void {
    // Text batching is more complex due to varying glyph counts
    // For now, render each text object individually
    for (const renderable of renderables) {
      this.createSingleTextBatch(key, renderable)
    }
  }

  /**
   * Create single text batch
   */
  private createSingleTextBatch(
    key: string,
    renderable: BatchRenderable
  ): void {
    // Simplified text batching - in production, implement proper glyph batching
    const device = this.webgpuContext.getDevice()!

    // Create minimal geometry for text (placeholder)
    const vertices = new Float32Array([
      -0.5,
      -0.5,
      0,
      0,
      1,
      1,
      1,
      1, // position, texCoord, color
      0.5,
      -0.5,
      1,
      0,
      1,
      1,
      1,
      1,
      -0.5,
      0.5,
      0,
      1,
      1,
      1,
      1,
      1,
      0.5,
      0.5,
      1,
      1,
      1,
      1,
      1,
      1,
    ])

    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    })

    new Float32Array(vertexBuffer.getMappedRange()).set(vertices)
    vertexBuffer.unmap()

    const pipeline = this.getOrCreateBatchPipeline('text')

    const batch: RenderBatch = {
      pipeline,
      vertexBuffer,
      indexBuffer: null,
      instanceCount: 1,
      instanceBuffer: null,
      bindGroups: [],
      firstVertex: 0,
      firstInstance: 0,
    }

    if (!this.renderBatches.has(key)) {
      this.renderBatches.set(key, [])
    }
    this.renderBatches.get(key)!.push(batch)
  }

  /**
   * Create image batch using texture atlas
   */
  private createImageBatch(key: string, renderables: BatchRenderable[]): void {
    // Image batching using texture atlas
    const device = this.webgpuContext.getDevice()!

    // Group images by texture atlas
    const atlasGroups = new Map<string, BatchRenderable[]>()

    for (const renderable of renderables) {
      const atlasId = renderable.properties.textureAtlasId || 'default'
      if (!atlasGroups.has(atlasId)) {
        atlasGroups.set(atlasId, [])
      }
      atlasGroups.get(atlasId)!.push(renderable)
    }

    // Create batch for each atlas
    for (const [atlasId, group] of atlasGroups) {
      this.createImageAtlasBatch(key + '_' + atlasId, group)
    }
  }

  /**
   * Create image atlas batch
   */
  private createImageAtlasBatch(
    key: string,
    renderables: BatchRenderable[]
  ): void {
    const device = this.webgpuContext.getDevice()!

    // Create shared quad geometry
    const vertices = new Float32Array([
      -0.5,
      -0.5,
      0,
      1, // position, texCoord
      0.5,
      -0.5,
      1,
      1,
      -0.5,
      0.5,
      0,
      0,
      0.5,
      0.5,
      1,
      0,
    ])

    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    })

    new Float32Array(vertexBuffer.getMappedRange()).set(vertices)
    vertexBuffer.unmap()

    // Create instance buffer for transforms and texture coordinates
    const instanceData = new Float32Array(renderables.length * 20) // transform + tex coords + other data

    for (let i = 0; i < renderables.length; i++) {
      const renderable = renderables[i]
      const baseIndex = i * 20

      // Copy transform matrix
      for (let j = 0; j < 16; j++) {
        instanceData[baseIndex + j] = renderable.transform[j]
      }

      // Add texture coordinates and other properties
      instanceData[baseIndex + 16] = renderable.properties.u1 || 0
      instanceData[baseIndex + 17] = renderable.properties.v1 || 0
      instanceData[baseIndex + 18] = renderable.properties.u2 || 1
      instanceData[baseIndex + 19] = renderable.properties.v2 || 1
    }

    const instanceBuffer = device.createBuffer({
      size: instanceData.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    })

    new Float32Array(instanceBuffer.getMappedRange()).set(instanceData)
    instanceBuffer.unmap()

    const pipeline = this.getOrCreateBatchPipeline('image')

    const batch: RenderBatch = {
      pipeline,
      vertexBuffer,
      indexBuffer: null,
      instanceCount: renderables.length,
      instanceBuffer,
      bindGroups: [],
      firstVertex: 0,
      firstInstance: 0,
    }

    if (!this.renderBatches.has(key)) {
      this.renderBatches.set(key, [])
    }
    this.renderBatches.get(key)!.push(batch)
  }

  /**
   * Get or create render pipeline for batch type
   */
  private getOrCreateBatchPipeline(type: string): GPURenderPipeline {
    const device = this.webgpuContext.getDevice()!

    // For now, return a placeholder pipeline
    // In production, create specialized pipelines for each type
    const pipelineKey = `batch_${type}`

    // Simplified pipeline creation - in production, create proper pipelines
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: device.createShaderModule({
          code: `
          struct VertexInput {
            @location(0) position: vec2<f32>,
            @location(1) transform: mat4x4<f32>,
          }

          struct VertexOutput {
            @builtin(position) position: vec4<f32>,
          }

          @vertex
          fn main(input: VertexInput) -> VertexOutput {
            var output: VertexOutput;
            output.position = input.transform * vec4<f32>(input.position, 0.0, 1.0);
            return output;
          }
          `,
        }),
        entryPoint: 'main',
      },
      fragment: {
        module: device.createShaderModule({
          code: `
          @fragment
          fn main() -> @location(0) vec4<f32> {
            return vec4<f32>(1.0, 1.0, 1.0, 1.0);
          }
          `,
        }),
        entryPoint: 'main',
        targets: [{ format: this.webgpuContext.getFormat() }],
      },
      primitive: { topology: 'triangle-list' },
    })

    return pipeline
  }

  /**
   * Get renderable key for grouping
   */
  private getRenderableKey(renderable: BatchRenderable): string {
    return `${renderable.type}_${JSON.stringify(renderable.properties)}`
  }

  /**
   * Render all batches efficiently
   */
  renderBatches(renderPass: GPURenderPassEncoder): Result<PerformanceMetrics> {
    try {
      this.frameStartTime = performance.now()
      let drawCalls = 0
      let totalTriangles = 0
      let totalVertices = 0

      // Render each batch
      for (const [key, batches] of this.renderBatches) {
        for (const batch of batches) {
          if (batch.instanceCount > 0) {
            renderPass.setPipeline(batch.pipeline)
            renderPass.setVertexBuffer(0, batch.vertexBuffer)

            if (batch.instanceBuffer) {
              renderPass.setVertexBuffer(1, batch.instanceBuffer)
            }

            if (batch.indexBuffer) {
              renderPass.setIndexBuffer(batch.indexBuffer, 'uint16')
              renderPass.drawIndexed(6, batch.instanceCount, 0, 0, 0)
              totalTriangles += 6 * batch.instanceCount
            } else {
              renderPass.draw(4, batch.instanceCount, 0, 0)
              totalTriangles += 2 * batch.instanceCount
            }

            totalVertices += 4 * batch.instanceCount
            drawCalls++
          }
        }
      }

      const frameTime = performance.now() - this.frameStartTime

      const metrics: PerformanceMetrics = {
        frameTimeMs: frameTime,
        drawCalls,
        trianglesDrawn: totalTriangles,
        vertexCount: totalVertices,
        memoryUsageMB: this.estimateMemoryUsage(),
        batchesUsed: this.renderBatches.size,
        cullingRatio: this.calculateCullingRatio(),
      }

      this.frameMetrics.push(metrics)

      // Keep only last 60 frames for performance monitoring
      if (this.frameMetrics.length > 60) {
        this.frameMetrics.shift()
      }

      return { success: true, data: metrics }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BATCH_RENDER_ERROR',
          message: `Failed to render batches: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Estimate GPU memory usage
   */
  private estimateMemoryUsage(): number {
    let totalMemory = 0

    // Estimate memory from batches
    for (const batches of this.renderBatches.values()) {
      for (const batch of batches) {
        totalMemory += batch.vertexBuffer.size
        if (batch.indexBuffer) {
          totalMemory += batch.indexBuffer.size
        }
        if (batch.instanceBuffer) {
          totalMemory += batch.instanceBuffer.size
        }
      }
    }

    return totalMemory / (1024 * 1024) // Convert to MB
  }

  /**
   * Calculate culling ratio (objects culled / total objects)
   */
  private calculateCullingRatio(): number {
    const totalRenderables = this.renderables.length
    if (totalRenderables === 0) return 0

    // Simplified culling - in production, implement proper viewport culling
    const culledCount = Math.floor(totalRenderables * 0.1) // Assume 10% culled
    return culledCount / totalRenderables
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.frameMetrics]
  }

  /**
   * Check if performance is within budget
   */
  isPerformanceWithinBudget(): boolean {
    if (this.frameMetrics.length === 0) return true

    const recentMetrics = this.frameMetrics.slice(-10) // Last 10 frames
    const avgFrameTime =
      recentMetrics.reduce((sum, m) => sum + m.frameTimeMs, 0) /
      recentMetrics.length

    return avgFrameTime <= this.maxFrameTime
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []

    if (this.frameMetrics.length === 0) return recommendations

    const recentMetrics = this.frameMetrics.slice(-10)
    const avgFrameTime =
      recentMetrics.reduce((sum, m) => sum + m.frameTimeMs, 0) /
      recentMetrics.length
    const avgDrawCalls =
      recentMetrics.reduce((sum, m) => sum + m.drawCalls, 0) /
      recentMetrics.length
    const avgMemoryUsage =
      recentMetrics.reduce((sum, m) => sum + m.memoryUsageMB, 0) /
      recentMetrics.length

    if (avgFrameTime > this.maxFrameTime) {
      recommendations.push(
        `Frame time (${avgFrameTime.toFixed(1)}ms) exceeds 60fps budget (${this.maxFrameTime}ms)`
      )
    }

    if (avgDrawCalls > 50) {
      recommendations.push(
        `High draw call count (${avgDrawCalls.toFixed(0)}) - consider more batching`
      )
    }

    if (avgMemoryUsage > 100) {
      recommendations.push(
        `High memory usage (${avgMemoryUsage.toFixed(1)}MB) - consider memory pooling`
      )
    }

    if (recentMetrics.length > 0) {
      const totalBatches =
        recentMetrics.reduce((sum, m) => sum + m.batchesUsed, 0) /
        recentMetrics.length
      if (totalBatches < this.renderables.length / 10) {
        recommendations.push(
          'Low batch utilization - consider optimizing grouping strategy'
        )
      }
    }

    return recommendations
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.renderables = []
    this.renderBatches.clear()
    this.frameMetrics = []
  }
}
