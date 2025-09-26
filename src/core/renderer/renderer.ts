/**
 * @fileoverview Main Renderer Implementation
 * @author @darianrosebrook
 */

import { Result, AnimatorError, Time, EvaluationContext, SceneGraph, RenderOutput } from '@/types'
import { WebGPUContext } from './webgpu-context'
import { ShaderManager, rectangleVertexShader, rectangleFragmentShader, circleVertexShader, circleFragmentShader } from './shaders'

/**
 * Main renderer that coordinates WebGPU rendering with the scene graph
 */
export class Renderer {
  private webgpuContext: WebGPUContext
  private shaderManager: ShaderManager
  private renderPipelines: Map<string, GPURenderPipeline> = new Map()
  private vertexBuffers: Map<string, GPUBuffer> = new Map()
  private indexBuffers: Map<string, GPUBuffer> = new Map()
  private uniformBuffers: Map<string, GPUBuffer> = new Map()

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
      -0.5, -0.5,  0.0, 1.0,  // Bottom-left
       0.5, -0.5,  1.0, 1.0,  // Bottom-right
      -0.5,  0.5,  0.0, 0.0,  // Top-left

      // Triangle 2
      -0.5,  0.5,  0.0, 0.0,  // Top-left
       0.5, -0.5,  1.0, 1.0,  // Bottom-right
       0.5,  0.5,  1.0, 0.0,  // Top-right
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
    circleVertices[0] = 0.0   // x
    circleVertices[1] = 0.0   // y
    circleVertices[2] = 0.5   // u
    circleVertices[3] = 0.5   // v

    // Generate circle points
    for (let i = 0; i <= circleSegments; i++) {
      const angle = (i / circleSegments) * Math.PI * 2
      const idx = (i + 1) * 4

      circleVertices[idx + 0] = Math.cos(angle) * 0.5     // x
      circleVertices[idx + 1] = Math.sin(angle) * 0.5     // y
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
    context: EvaluationContext
  ): Promise<Result<RenderOutput>> {
    try {
      // Evaluate the scene graph
      const evaluationResult = sceneGraph.evaluate(time, context)
      if (!evaluationResult.success) {
        return evaluationResult
      }

      const evaluatedNodes = evaluationResult.data

      // Create command encoder
      const commandEncoder = this.webgpuContext.createCommandEncoder('Render Frame')
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
        colorAttachments: [{
          view: this.webgpuContext.getContext()!.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        }],
      }

      const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor)

      // Render each node
      for (const node of evaluatedNodes) {
        const renderResult = this.renderNode(node, renderPass, time, context)
        if (!renderResult.success) {
          console.warn(`Failed to render node ${node.id}:`, renderResult.error)
        }
      }

      renderPass.end()

      // Submit commands
      const commandBuffer = commandEncoder.finish()
      this.webgpuContext.submitCommands([commandBuffer])

      // Return render output
      const canvas = this.webgpuContext.getCanvas()!
      const renderOutput: RenderOutput = {
        frameBuffer: canvas.getContext('webgpu')!.getCurrentTexture().getTexture(),
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
   * Render a single node
   */
  private renderNode(
    node: any,
    renderPass: GPURenderPassEncoder,
    time: Time,
    context: EvaluationContext
  ): Result<boolean> {
    try {
      // Get appropriate pipeline and geometry for node type
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
        renderPass.setBindGroup(0, this.createBindGroupForNode(pipeline, uniformBuffer))
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
        }
        break
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

    // Create basic transform matrix (identity for now)
    const transform = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ])

    // Create uniforms based on node properties
    const uniforms = new Float32Array([
      // Transform matrix (4x4 = 16 floats)
      ...transform,
      // Color (RGBA)
      (node.fillColor?.r || 255) / 255,
      (node.fillColor?.g || 255) / 255,
      (node.fillColor?.b || 255) / 255,
      (node.fillColor?.a || 1) / 255,
      // Size
      node.size?.width || 100,
      node.size?.height || 100,
      // Position
      node.position?.x || 0,
      node.position?.y || 0,
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
   * Clean up resources
   */
  destroy(): void {
    this.renderPipelines.clear()
    this.vertexBuffers.clear()
    this.indexBuffers.clear()
    this.uniformBuffers.clear()
    this.shaderManager.destroy()
    this.webgpuContext.destroy()
  }
}
