/**
 * @fileoverview Main Renderer Implementation
 * @author @darianrosebrook
 */

import {
  Result,
  AnimatorError,
  Time,
  EvaluationContext,
  SceneGraph,
  RenderOutput,
} from '@/types'
import { WebGPUContext } from './webgpu-context'
import {
  ShaderManager,
  rectangleVertexShader,
  rectangleFragmentShader,
  circleVertexShader,
  circleFragmentShader,
} from './shaders'
import { TextRenderer } from './text-renderer'
import { ImageRenderer, ImageProperties, BlendMode } from './image-renderer'
import { SVGPathRenderer, PathProperties } from './path-renderer'
import {
  BatchRenderer,
  BatchRenderable,
  PerformanceMetrics,
} from './batch-renderer'
import { TransformUtils, Transform2D } from './transforms'

/**
 * Main renderer that coordinates WebGPU rendering with the scene graph
 */
export class Renderer {
  private webgpuContext: WebGPUContext
  private shaderManager: ShaderManager
  private textRenderer: TextRenderer | null = null
  private imageRenderer: ImageRenderer | null = null
  private pathRenderer: SVGPathRenderer | null = null
  private batchRenderer: BatchRenderer | null = null
  private renderPipelines: Map<string, GPURenderPipeline> = new Map()
  private vertexBuffers: Map<string, GPUBuffer> = new Map()
  private indexBuffers: Map<string, GPUBuffer> = new Map()
  private uniformBuffers: Map<string, GPUBuffer> = new Map()

  // Performance settings
  private useBatching = true
  private performanceMode = true

  constructor() {
    this.webgpuContext = new WebGPUContext()
    this.shaderManager = new ShaderManager(this.webgpuContext.getDevice()!)
  }

  /**
   * Initialize the renderer with a canvas
   */
  async initialize(canvas: HTMLCanvasElement): Promise<Result<boolean>> {
    const result = await this.webgpuContext.initialize(canvas)

    if (!result.success) {
      return result
    }

    // Initialize shader manager with device
    this.shaderManager = new ShaderManager(this.webgpuContext.getDevice()!)

    // Initialize text renderer
    this.textRenderer = new TextRenderer(this.webgpuContext)
    const fontData = this.createDefaultFontData() // Placeholder font data
    const textResult = await this.textRenderer.initialize(fontData)
    if (!textResult.success) {
      console.warn('Text renderer initialization failed:', textResult.error)
      this.textRenderer = null
    }

    // Initialize image renderer
    this.imageRenderer = new ImageRenderer(this.webgpuContext)
    const imageResult = await this.imageRenderer.initialize()
    if (!imageResult.success) {
      console.warn('Image renderer initialization failed:', imageResult.error)
      this.imageRenderer = null
    }

    // Initialize path renderer
    this.pathRenderer = new SVGPathRenderer(this.webgpuContext)
    const pathResult = await this.pathRenderer.initialize()
    if (!pathResult.success) {
      console.warn('Path renderer initialization failed:', pathResult.error)
      this.pathRenderer = null
    }

    // Initialize batch renderer for high-performance rendering
    this.batchRenderer = new BatchRenderer(this.webgpuContext)
    const batchResult = await this.batchRenderer.initialize()
    if (!batchResult.success) {
      console.warn('Batch renderer initialization failed:', batchResult.error)
      this.batchRenderer = null
    }

    // Create basic render pipelines
    this.createBasicPipelines()

    console.log('✅ Renderer initialized successfully')
    return { success: true, data: true }
  }

  /**
   * Create basic render pipelines for common shapes
   */
  private createBasicPipelines(): void {
    if (!this.webgpuContext.getDevice()) {
      console.error('WebGPU device not available for pipeline creation')
      return
    }

    // Rectangle pipeline
    const rectPipeline = this.shaderManager.createPipeline(
      rectangleVertexShader,
      rectangleFragmentShader,
      [], // No bind group layouts for now
      [{ format: this.webgpuContext.getFormat() }]
    )

    if (rectPipeline) {
      this.renderPipelines.set('rectangle', rectPipeline)
    }

    // Circle pipeline
    const circlePipeline = this.shaderManager.createPipeline(
      circleVertexShader,
      circleFragmentShader,
      [],
      [{ format: this.webgpuContext.getFormat() }]
    )

    if (circlePipeline) {
      this.renderPipelines.set('circle', circlePipeline)
    }

    // Create vertex buffers for basic shapes
    this.createBasicGeometryBuffers()
  }

  /**
   * Create vertex and index buffers for basic 2D shapes
   */
  private createBasicGeometryBuffers(): void {
    if (!this.webgpuContext.getDevice()) {
      console.error('WebGPU device not available for buffer creation')
      return
    }

    // Rectangle vertices (2 triangles)
    const rectVertices = new Float32Array([
      // Triangle 1
      -0.5,
      -0.5,
      0.0,
      1.0, // Bottom-left
      0.5,
      -0.5,
      1.0,
      1.0, // Bottom-right
      -0.5,
      0.5,
      0.0,
      0.0, // Top-left

      // Triangle 2
      -0.5,
      0.5,
      0.0,
      0.0, // Top-left
      0.5,
      -0.5,
      1.0,
      1.0, // Bottom-right
      0.5,
      0.5,
      1.0,
      0.0, // Top-right
    ])

    const rectBuffer = this.webgpuContext.createBuffer(
      'vertex' as any,
      rectVertices,
      'Rectangle Vertices'
    )

    if (rectBuffer) {
      this.vertexBuffers.set('rectangle', rectBuffer)
    }

    // Circle vertices (approximated with triangle fan)
    const circleSegments = 32
    const circleVertices = new Float32Array((circleSegments + 2) * 4) // center + segments + tex coords

    // Center point
    circleVertices[0] = 0.0 // x
    circleVertices[1] = 0.0 // y
    circleVertices[2] = 0.5 // u
    circleVertices[3] = 0.5 // v

    // Generate circle points
    for (let i = 0; i <= circleSegments; i++) {
      const angle = (i / circleSegments) * Math.PI * 2
      const idx = (i + 1) * 4

      circleVertices[idx + 0] = Math.cos(angle) * 0.5 // x
      circleVertices[idx + 1] = Math.sin(angle) * 0.5 // y
      circleVertices[idx + 2] = Math.cos(angle) * 0.5 + 0.5 // u
      circleVertices[idx + 3] = Math.sin(angle) * 0.5 + 0.5 // v
    }

    const circleBuffer = this.webgpuContext.createBuffer(
      'vertex' as any,
      circleVertices,
      'Circle Vertices'
    )

    if (circleBuffer) {
      this.vertexBuffers.set('circle', circleBuffer)
    }
  }

  /**
   * Render a frame from the scene graph
   */
  async renderFrame(
    sceneGraph: SceneGraph,
    time: Time,
    context: EvaluationContext | RenderContext
  ): Promise<Result<RenderOutput>> {
    try {
      // Evaluate the scene graph
      const evaluationResult = sceneGraph.evaluate(
        time,
        context as EvaluationContext
      )
      if (!evaluationResult.success) {
        return evaluationResult
      }

      const evaluatedNodes = evaluationResult.data

      // Create command encoder
      const commandEncoder =
        this.webgpuContext.createCommandEncoder('Render Frame')
      if (!commandEncoder) {
        return {
          success: false,
          error: {
            code: 'COMMAND_ENCODER_FAILED',
            message: 'Failed to create command encoder',
          },
        }
      }

      // Begin render pass
      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: this.webgpuContext
              .getContext()!
              .getCurrentTexture()
              .createView(),
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          },
        ],
      }

      const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor)

      let performanceMetrics: PerformanceMetrics | null = null

      // Use high-performance batch rendering if enabled
      if (this.useBatching && this.batchRenderer && this.performanceMode) {
        performanceMetrics = await this.renderWithBatching(
          evaluatedNodes,
          renderPass
        )
      } else {
        // Use traditional rendering
        await this.renderTraditional(
          evaluatedNodes,
          renderPass,
          time,
          context as EvaluationContext
        )
      }

      renderPass.end()

      // Submit commands
      const commandBuffer = commandEncoder.finish()
      this.webgpuContext.submitCommands([commandBuffer])

      // Return render output
      const canvas = this.webgpuContext.getCanvas()!
      const context = this.webgpuContext.getContext()!
      const renderOutput: RenderOutput = {
        frameBuffer: context.getCurrentTexture(),
        width: canvas.width,
        height: canvas.height,
        format: 'rgba_f32',
      }

      return { success: true, data: renderOutput }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RENDER_ERROR',
          message: `Failed to render frame: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Render using high-performance batching system
   */
  private async renderWithBatching(
    nodes: any[],
    renderPass: GPURenderPassEncoder
  ): Promise<PerformanceMetrics | null> {
    if (!this.batchRenderer) return null

    try {
      // Clear previous frame's renderables
      this.batchRenderer.clearRenderables()

      // Convert scene nodes to batch renderables
      for (const node of nodes) {
        const batchRenderable = this.nodeToBatchRenderable(node)
        if (batchRenderable) {
          this.batchRenderer.addRenderable(batchRenderable)
        }
      }

      // Optimize renderables into batches
      this.batchRenderer.optimizeRenderables()

      // Render all batches
      const metricsResult = this.batchRenderer.renderBatches(renderPass)
      if (!metricsResult.success) {
        console.warn('Batch rendering failed:', metricsResult.error)
        return null
      }

      return metricsResult.data
    } catch (error) {
      console.warn('Batch rendering error:', error)
      return null
    }
  }

  /**
   * Render using traditional per-node rendering
   */
  private async renderTraditional(
    nodes: any[],
    renderPass: GPURenderPassEncoder,
    time: Time,
    context: EvaluationContext
  ): Promise<void> {
    for (const node of nodes) {
      const renderResult = await this.renderNode(
        node,
        renderPass,
        time,
        context
      )
      if (!renderResult.success) {
        console.warn(`Failed to render node ${node.id}:`, renderResult.error)
      }
    }
  }

  /**
   * Convert scene node to batch renderable
   */
  private nodeToBatchRenderable(node: any): BatchRenderable | null {
    // Create transform matrix for the node
    const transform2D: Transform2D = {
      position: node.position || { x: 0, y: 0 },
      scale: node.scale || { width: 1, height: 1 },
      rotation: node.rotation || 0,
      anchor: node.anchor || { x: 0, y: 0 },
      skewX: node.skewX || 0,
      skewY: node.skewY || 0,
    }

    const transformMatrix = TransformUtils.fromTransform(transform2D)

    // Calculate bounds
    const bounds = this.calculateNodeBounds(node)

    return {
      id: node.id,
      type: node.type === 'shape' ? node.shapeType || 'rectangle' : node.type,
      transform: transformMatrix,
      properties: node.properties || {},
      bounds,
    }
  }

  /**
   * Calculate bounding box for a node
   */
  private calculateNodeBounds(node: any): {
    minX: number
    minY: number
    maxX: number
    maxY: number
  } {
    // Simplified bounds calculation - in production, calculate based on actual geometry
    const size = node.size || { width: 100, height: 100 }
    const position = node.position || { x: 0, y: 0 }

    return {
      minX: position.x,
      minY: position.y,
      maxX: position.x + size.width,
      maxY: position.y + size.height,
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return this.batchRenderer?.getPerformanceMetrics() || []
  }

  /**
   * Check if performance is within budget
   */
  isPerformanceWithinBudget(): boolean {
    return this.batchRenderer?.isPerformanceWithinBudget() ?? true
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    return this.batchRenderer?.getOptimizationRecommendations() || []
  }

  /**
   * Enable or disable performance optimizations
   */
  setPerformanceMode(enabled: boolean): void {
    this.performanceMode = enabled
  }

  /**
   * Enable or disable batching
   */
  setBatchingEnabled(enabled: boolean): void {
    this.useBatching = enabled
  }

  /**
   * Render a single node
   */
  private async renderNode(
    node: any,
    renderPass: GPURenderPassEncoder,
    time: Time,
    context: EvaluationContext
  ): Promise<Result<boolean>> {
    try {
      // Handle text nodes separately
      if (node.type === 'text' && this.textRenderer) {
        const textProperties = {
          fontFamily: node.fontFamily || 'default',
          fontSize: node.fontSize || 16,
          fontWeight: node.fontWeight || 400,
          fontStyle: node.fontStyle || 'normal',
          color: node.color || { r: 0, g: 0, b: 0, a: 1 },
          position: node.position || { x: 0, y: 0 },
          maxWidth: node.maxWidth,
          textAlign: node.textAlign || 'left',
          lineHeight: node.lineHeight || 1.2,
          letterSpacing: node.letterSpacing || 0,
          wordSpacing: node.wordSpacing || 0,
        }

        const textResult = this.textRenderer.renderText(
          node.text || '',
          textProperties,
          renderPass
        )
        if (!textResult.success) {
          return textResult
        }
        return { success: true, data: true }
      }

      // Handle image nodes
      if (node.type === 'media' && this.imageRenderer && node.source) {
        const imageProperties = {
          source: node.source,
          position: node.position || { x: 0, y: 0 },
          size: node.size,
          opacity: node.opacity || 1,
          blendMode: node.blendMode || ('normal' as any),
          flipX: node.flipX || false,
          flipY: node.flipY || false,
          rotation: node.rotation || 0,
          scale: node.scale || { x: 1, y: 1 },
        }

        const imageResult = this.imageRenderer.renderImage(
          imageProperties,
          renderPass
        )
        if (!imageResult.success) {
          return imageResult
        }
        return { success: true, data: true }
      }

      // Handle path nodes
      if (
        node.type === 'shape' &&
        node.shapeType === 'path' &&
        this.pathRenderer &&
        node.pathData
      ) {
        const pathProperties: PathProperties = {
          pathData: node.pathData,
          fillColor: node.fillColor || { r: 255, g: 255, b: 255, a: 1 },
          strokeColor: node.strokeColor || { r: 0, g: 0, b: 0, a: 1 },
          strokeWidth: node.strokeWidth || 1,
          fillRule: node.fillRule || 'nonzero',
          strokeLineCap: node.strokeLineCap || 'butt',
          strokeLineJoin: node.strokeLineJoin || 'miter',
          strokeMiterLimit: node.strokeMiterLimit || 4,
          position: node.position || { x: 0, y: 0 },
          scale: node.scale || { x: 1, y: 1 },
          rotation: node.rotation || 0,
        }

        const pathResult = this.pathRenderer.renderPath(
          pathProperties,
          renderPass
        )
        if (!pathResult.success) {
          return pathResult
        }
        return { success: true, data: true }
      }

      // Handle shape nodes
      const { pipeline, vertexBuffer } = this.getRenderResourcesForNode(node)
      if (!pipeline || !vertexBuffer) {
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_NODE_TYPE',
            message: `No rendering support for node type: ${node.type}`,
          },
        }
      }

      // Set pipeline
      renderPass.setPipeline(pipeline)

      // Set vertex buffer
      renderPass.setVertexBuffer(0, vertexBuffer)

      // Create and set uniforms
      const uniformBuffer = this.createUniformBufferForNode(node)
      if (uniformBuffer) {
        renderPass.setBindGroup(
          0,
          this.createBindGroupForNode(pipeline, uniformBuffer)
        )
      }

      // Draw
      const vertexCount = this.getVertexCountForNode(node)
      renderPass.draw(vertexCount, 1, 0, 0)

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NODE_RENDER_ERROR',
          message: `Failed to render node ${node.id}: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get render resources (pipeline and buffers) for a node type
   */
  private getRenderResourcesForNode(node: any): {
    pipeline: GPURenderPipeline | null
    vertexBuffer: GPUBuffer | null
  } {
    switch (node.type) {
      case 'shape':
        if (node.shapeType === 'rectangle') {
          return {
            pipeline: this.renderPipelines.get('rectangle') || null,
            vertexBuffer: this.vertexBuffers.get('rectangle') || null,
          }
        } else if (node.shapeType === 'circle') {
          return {
            pipeline: this.renderPipelines.get('circle') || null,
            vertexBuffer: this.vertexBuffers.get('circle') || null,
          }
        } else if (node.shapeType === 'path') {
          // Path rendering is handled separately in renderNode
          return { pipeline: null, vertexBuffer: null }
        }
        break
      case 'text':
        // Text rendering is handled separately in renderNode
        return { pipeline: null, vertexBuffer: null }
      case 'media':
        // Image/media rendering is handled separately in renderNode
        return { pipeline: null, vertexBuffer: null }
      case 'path':
        // Path rendering is handled separately in renderNode
        return { pipeline: null, vertexBuffer: null }
    }

    return { pipeline: null, vertexBuffer: null }
  }

  /**
   * Create uniform buffer for a node
   */
  private createUniformBufferForNode(node: any): GPUBuffer | null {
    if (!this.webgpuContext.getDevice()) {
      return null
    }

    // Create transform from node properties
    const transform2D: Transform2D = {
      position: node.position || { x: 0, y: 0 },
      scale: node.scale || { width: 1, height: 1 },
      rotation: node.rotation || 0,
      anchor: node.anchor || { x: 0, y: 0 },
      skewX: node.skewX || 0,
      skewY: node.skewY || 0,
    }

    const transformMatrix = TransformUtils.fromTransform(transform2D)

    // Create uniforms based on node properties
    const uniforms = new Float32Array([
      // Transform matrix (4x4 = 16 floats)
      ...transformMatrix,
      // Color (RGBA)
      (node.fillColor?.r || 255) / 255,
      (node.fillColor?.g || 255) / 255,
      (node.fillColor?.b || 255) / 255,
      (node.fillColor?.a || 1) / 255,
      // Size
      node.size?.width || 100,
      node.size?.height || 100,
      // Additional properties for text and other nodes
      node.fontSize || 16,
      node.lineHeight || 1.2,
    ])

    return this.webgpuContext.createBuffer(
      GPUBufferUsage.UNIFORM,
      uniforms,
      `Uniforms for ${node.id}`
    )
  }

  /**
   * Create bind group for a node
   */
  private createBindGroupForNode(
    pipeline: GPURenderPipeline,
    uniformBuffer: GPUBuffer
  ): GPUBindGroup | null {
    if (!this.webgpuContext.getDevice()) {
      return null
    }

    const bindGroupLayout = pipeline.getBindGroupLayout(0)
    return this.webgpuContext.createBindGroup(bindGroupLayout, [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ])
  }

  /**
   * Get vertex count for a node type
   */
  private getVertexCountForNode(node: any): number {
    switch (node.type) {
      case 'shape':
        if (node.shapeType === 'rectangle') {
          return 6 // 2 triangles
        } else if (node.shapeType === 'circle') {
          return 34 // center + 32 segments + 1 duplicate for closing
        }
        break
    }
    return 0
  }

  /**
   * Resize the render viewport
   */
  resize(width: number, height: number): void {
    this.webgpuContext.resize(width, height)
  }

  /**
   * Get current viewport size
   */
  getSize(): { width: number; height: number } {
    return this.webgpuContext.getSize()
  }

  /**
   * Check if WebGPU is supported
   */
  static isSupported(): boolean {
    return WebGPUContext.isSupported()
  }

  /**
   * Get WebGPU support information
   */
  static async getSupportInfo(): Promise<{
    supported: boolean
    adapterInfo?: string
    deviceInfo?: string
    error?: string
  }> {
    return WebGPUContext.getSupportInfo()
  }

  /**
   * Create default font data (placeholder for real font loading)
   */
  private createDefaultFontData(): ArrayBuffer {
    // This is a placeholder - in a real implementation, we'd load
    // actual font data from TTF/OTF files or use a font library
    const fontData = new ArrayBuffer(1024)
    const view = new Uint8Array(fontData)

    // Fill with some basic pattern to simulate font data
    for (let i = 0; i < view.length; i++) {
      view[i] = (i * 37) % 256 // Pseudo-random pattern
    }

    return fontData
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.renderPipelines.clear()
    this.vertexBuffers.clear()
    this.indexBuffers.clear()
    this.uniformBuffers.clear()
    if (this.textRenderer) {
      this.textRenderer.destroy()
    }
    if (this.imageRenderer) {
      this.imageRenderer.destroy()
    }
    if (this.pathRenderer) {
      this.pathRenderer.destroy()
    }
    if (this.batchRenderer) {
      this.batchRenderer.destroy()
    }
    this.shaderManager.destroy()
    this.webgpuContext.destroy()
  }
}
