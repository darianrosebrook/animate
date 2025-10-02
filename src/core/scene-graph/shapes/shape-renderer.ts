/**
 * @fileoverview Shape Renderer Implementation
 * @description GPU-accelerated rendering of 2D shapes with WebGPU
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { WebGPUContext } from '../../renderer/webgpu-context'
import {
  ShapeRenderData,
  ShapeGeometry,
  RectangleShape,
  EllipseShape,
  PathShape,
} from './shape-types'
import { ShapeGeometryGenerator } from './shape-geometry'

/**
 * Shape rendering pipeline configuration
 */
export interface ShapeRenderPipeline {
  vertexShader: string
  fragmentShader: string
  bindGroupLayout: GPUBindGroupLayout
  pipeline: GPURenderPipeline
}

/**
 * Shape renderer implementation
 */
export class ShapeRenderer {
  private webgpuContext: WebGPUContext
  private device: GPUDevice | null = null

  // Rendering pipelines
  private rectanglePipeline: ShapeRenderPipeline | null = null
  private ellipsePipeline: ShapeRenderPipeline | null = null
  private pathPipeline: ShapeRenderPipeline | null = null

  // Common resources
  private vertexBuffer: GPUBuffer | null = null
  private indexBuffer: GPUBuffer | null = null
  private uniformBuffer: GPUBuffer | null = null

  // Shader modules
  private shapeVertexShader: GPUShaderModule | null = null
  private shapeFragmentShader: GPUShaderModule | null = null

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  /**
   * Initialize shape rendering pipelines
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      this.device = this.webgpuContext.getDevice()
      if (!this.device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for shape rendering',
          },
        }
      }

      // Create shader modules
      this.shapeVertexShader = this.device.createShaderModule({
        label: 'Shape Vertex Shader',
        code: this.getVertexShaderCode(),
      })

      this.shapeFragmentShader = this.device.createShaderModule({
        label: 'Shape Fragment Shader',
        code: this.getFragmentShaderCode(),
      })

      // Create bind group layout
      const bindGroupLayout = this.device.createBindGroupLayout({
        label: 'Shape Bind Group Layout',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
          },
        ],
      })

      // Create pipeline layout
      const pipelineLayout = this.device.createPipelineLayout({
        label: 'Shape Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout],
      })

      // Create rendering pipelines
      this.rectanglePipeline = {
        vertexShader: this.getRectangleVertexShader(),
        fragmentShader: this.getRectangleFragmentShader(),
        bindGroupLayout,
        pipeline: this.device.createRenderPipeline({
          label: 'Rectangle Shape Pipeline',
          layout: pipelineLayout,
          vertex: {
            module: this.shapeVertexShader,
            entryPoint: 'rectangleVertex',
            buffers: [
              {
                arrayStride: 16, // 4 floats * 4 bytes
                attributes: [
                  {
                    format: 'float32x2',
                    offset: 0,
                    shaderLocation: 0,
                  },
                  {
                    format: 'float32x2',
                    offset: 8,
                    shaderLocation: 1,
                  },
                ],
              },
            ],
          },
          fragment: {
            module: this.shapeFragmentShader,
            entryPoint: 'rectangleFragment',
            targets: [
              {
                format: 'bgra8unorm',
                blend: {
                  color: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one-minus-src-alpha',
                  },
                  alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                  },
                },
              },
            ],
          },
          primitive: {
            topology: 'triangle-list',
            cullMode: 'none',
          },
        }),
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SHAPE_RENDERER_INIT_ERROR',
          message: `Failed to initialize shape renderer: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Render a rectangle shape
   */
  renderRectangle(
    shape: RectangleShape,
    renderPass: GPURenderPassEncoder,
    transform: Float32Array
  ): void {
    if (!this.rectanglePipeline || !this.device) return

    // Generate geometry
    const geometry = ShapeGeometryGenerator.generateRectangleGeometry(shape)

    // Create vertex buffer if needed
    if (
      !this.vertexBuffer ||
      this.vertexBuffer.size < geometry.vertices.byteLength
    ) {
      this.vertexBuffer?.destroy()
      this.vertexBuffer = this.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      })
    }

    // Create index buffer if needed
    if (
      geometry.indices &&
      (!this.indexBuffer || this.indexBuffer.size < geometry.indices.byteLength)
    ) {
      this.indexBuffer?.destroy()
      this.indexBuffer = this.device.createBuffer({
        size: geometry.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      })
    }

    // Update buffers
    this.device.queue.writeBuffer(this.vertexBuffer, 0, geometry.vertices)
    if (geometry.indices) {
      this.device.queue.writeBuffer(this.indexBuffer!, 0, geometry.indices)
    }

    // Set up render state
    renderPass.setPipeline(this.rectanglePipeline.pipeline)
    renderPass.setVertexBuffer(0, this.vertexBuffer)

    if (this.indexBuffer && geometry.indices) {
      renderPass.setIndexBuffer(this.indexBuffer, 'uint16')
    }

    // Set up uniforms (simplified for now)
    const viewProjection = new Float32Array(16)
    viewProjection.fill(0)
    viewProjection[0] = 1 // Scale X
    viewProjection[5] = 1 // Scale Y
    viewProjection[10] = 1 // Scale Z
    viewProjection[15] = 1 // Translation W

    // Create bind group (simplified)
    const uniformBuffer = this.device.createBuffer({
      size: 64, // Space for view-projection and other uniforms
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    this.device.queue.writeBuffer(uniformBuffer, 0, viewProjection)

    const bindGroup = this.device.createBindGroup({
      layout: this.rectanglePipeline.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: uniformBuffer } },
      ],
    })

    renderPass.setBindGroup(0, bindGroup)

    // Draw
    if (geometry.indices) {
      renderPass.drawIndexed(geometry.indexCount!)
    } else {
      renderPass.draw(geometry.vertexCount)
    }
  }

  /**
   * Render an ellipse shape
   */
  renderEllipse(
    shape: EllipseShape,
    renderPass: GPURenderPassEncoder,
    transform: Float32Array
  ): void {
    // For now, use the rectangle pipeline as a placeholder
    // TODO: Implement proper ellipse rendering pipeline
    this.renderRectangle(
      {
        position: shape.position,
        size: shape.size,
        rotation: shape.rotation,
        cornerType: 'square' as any,
        fill: shape.fill,
        stroke: shape.stroke,
      },
      renderPass,
      transform
    )
  }

  /**
   * Render a path shape
   */
  renderPath(
    shape: PathShape,
    renderPass: GPURenderPassEncoder,
    transform: Float32Array
  ): void {
    // For now, use the rectangle pipeline as a placeholder
    // TODO: Implement proper path rendering with bezier curves
    this.renderRectangle(
      {
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        rotation: 0,
        cornerType: 'square' as any,
        fill: shape.fill,
        stroke: shape.stroke,
      },
      renderPass,
      transform
    )
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.vertexBuffer?.destroy()
    this.indexBuffer?.destroy()
    this.uniformBuffer?.destroy()
    this.vertexBuffer = null
    this.indexBuffer = null
    this.uniformBuffer = null
  }

  /**
   * Get vertex shader code for shapes
   */
  private getVertexShaderCode(): string {
    return `
      struct VertexInput {
        @location(0) position: vec2<f32>,
        @location(1) uv: vec2<f32>,
      }

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) uv: vec2<f32>,
      }

      @group(0) @binding(0) var<uniform> viewProjection: mat4x4<f32>

      @vertex
      fn rectangleVertex(input: VertexInput) -> VertexOutput {
        var output: VertexOutput
        output.position = viewProjection * vec4<f32>(input.position, 0.0, 1.0)
        output.uv = input.uv
        return output
      }
    `
  }

  /**
   * Get fragment shader code for shapes
   */
  private getFragmentShaderCode(): string {
    return `
      struct FragmentInput {
        @location(0) uv: vec2<f32>,
      }

      struct FragmentOutput {
        @location(0) color: vec4<f32>,
      }

      @group(0) @binding(1) var<uniform> shapeUniforms: vec4<f32>

      @fragment
      fn rectangleFragment(input: FragmentInput) -> FragmentOutput {
        var output: FragmentOutput

        // Simple solid color for now
        output.color = vec4<f32>(1.0, 0.0, 0.0, 1.0) // Red rectangle

        return output
      }
    `
  }

  /**
   * Get rectangle-specific vertex shader
   */
  private getRectangleVertexShader(): string {
    return `
      struct VertexInput {
        @location(0) position: vec2<f32>,
        @location(1) uv: vec2<f32>,
      }

      @group(0) @binding(0) var<uniform> transform: mat4x4<f32>

      @vertex
      fn main(input: VertexInput) -> @builtin(position) vec4<f32> {
        return transform * vec4<f32>(input.position, 0.0, 1.0)
      }
    `
  }

  /**
   * Get rectangle-specific fragment shader
   */
  private getRectangleFragmentShader(): string {
    return `
      @fragment
      fn main() -> @location(0) vec4<f32> {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0) // Red rectangle
      }
    `
  }
}
