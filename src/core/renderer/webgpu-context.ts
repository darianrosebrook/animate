/**
 * @fileoverview WebGPU Context Management
 * @author @darianrosebrook
 */

import { Result, AnimatorError } from '@/types'

/**
 * WebGPU rendering context and device management
 */
export class WebGPUContext {
  private device: GPUDevice | null = null
  private context: GPUCanvasContext | null = null
  private adapter: GPUAdapter | null = null
  private canvas: HTMLCanvasElement | null = null
  private format: GPUTextureFormat = 'bgra8unorm'

  /**
   * Initialize WebGPU context with canvas
   */
  async initialize(canvas: HTMLCanvasElement): Promise<Result<boolean>> {
    try {
      // Check for WebGPU support
      if (!navigator.gpu) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_NOT_SUPPORTED',
            message: 'WebGPU is not supported in this browser. Please use Chrome, Firefox, or Safari Technology Preview.',
          },
        }
      }

      // Get GPU adapter
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      })

      if (!this.adapter) {
        return {
          success: false,
          error: {
            code: 'ADAPTER_NOT_FOUND',
            message: 'Failed to find a suitable GPU adapter.',
          },
        }
      }

      // Request device
      this.device = await this.adapter.requestDevice({
        requiredFeatures: [],
        requiredLimits: {},
      })

      if (!this.device) {
        return {
          success: false,
          error: {
            code: 'DEVICE_REQUEST_FAILED',
            message: 'Failed to request GPU device.',
          },
        }
      }

      // Set up canvas context
      this.canvas = canvas
      this.context = canvas.getContext('webgpu') as GPUCanvasContext

      if (!this.context) {
        return {
          success: false,
          error: {
            code: 'CANVAS_CONTEXT_FAILED',
            message: 'Failed to get WebGPU canvas context.',
          },
        }
      }

      // Configure canvas format
      this.format = navigator.gpu.getPreferredCanvasFormat()
      this.context.configure({
        device: this.device,
        format: this.format,
        alphaMode: 'premultiplied',
      })

      console.log('✅ WebGPU context initialized successfully')
      console.log(`   Adapter: ${this.adapter.name}`)
      console.log(`   Device: ${this.device.name || 'Unknown'}`)
      console.log(`   Canvas Format: ${this.format}`)

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'WEBGPU_INITIALIZATION_ERROR',
          message: `Failed to initialize WebGPU: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get the GPU device
   */
  getDevice(): GPUDevice | null {
    return this.device
  }

  /**
   * Get the canvas context
   */
  getContext(): GPUCanvasContext | null {
    return this.context
  }

  /**
   * Get the canvas
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas
  }

  /**
   * Get the preferred texture format
   */
  getFormat(): GPUTextureFormat {
    return this.format
  }

  /**
   * Create a GPU buffer
   */
  createBuffer(
    usage: GPUBufferUsageFlags,
    data: ArrayBuffer | ArrayBufferView,
    label?: string
  ): GPUBuffer | null {
    if (!this.device) {
      console.error('WebGPU device not initialized')
      return null
    }

    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage,
      mappedAtCreation: true,
      label,
    })

    // Copy data to buffer
    const dstBuffer = buffer.getMappedRange()
    new Uint8Array(dstBuffer).set(new Uint8Array(data))
    buffer.unmap()

    return buffer
  }

  /**
   * Create a GPU texture
   */
  createTexture(
    width: number,
    height: number,
    format: GPUTextureFormat = this.format,
    usage: GPUTextureUsageFlags = GPUTextureUsage.RENDER_ATTACHMENT,
    label?: string
  ): GPUTexture | null {
    if (!this.device) {
      console.error('WebGPU device not initialized')
      return null
    }

    return this.device.createTexture({
      size: [width, height],
      format,
      usage,
      label,
    })
  }

  /**
   * Create a GPU sampler
   */
  createSampler(
    options: GPUSamplerDescriptor = {}
  ): GPUSampler | null {
    if (!this.device) {
      console.error('WebGPU device not initialized')
      return null
    }

    return this.device.createSampler({
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      magFilter: 'linear',
      minFilter: 'linear',
      ...options,
    })
  }

  /**
   * Create a render pipeline
   */
  createRenderPipeline(
    vertexShader: string,
    fragmentShader: string,
    bindGroupLayouts: GPUBindGroupLayout[] = [],
    targets: GPUColorTargetState[] = [{
      format: this.format,
    }]
  ): GPURenderPipeline | null {
    if (!this.device) {
      console.error('WebGPU device not initialized')
      return null
    }

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts,
    })

    const vertexModule = this.device.createShaderModule({
      code: vertexShader,
    })

    const fragmentModule = this.device.createShaderModule({
      code: fragmentShader,
    })

    return this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertexModule,
        entryPoint: 'main',
      },
      fragment: {
        module: fragmentModule,
        entryPoint: 'main',
        targets,
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none',
      },
    })
  }

  /**
   * Create a bind group layout
   */
  createBindGroupLayout(
    entries: GPUBindGroupLayoutEntry[]
  ): GPUBindGroupLayout | null {
    if (!this.device) {
      console.error('WebGPU device not initialized')
      return null
    }

    return this.device.createBindGroupLayout({
      entries,
    })
  }

  /**
   * Create a bind group
   */
  createBindGroup(
    layout: GPUBindGroupLayout,
    entries: GPUBindGroupEntry[]
  ): GPUBindGroup | null {
    if (!this.device) {
      console.error('WebGPU device not initialized')
      return null
    }

    return this.device.createBindGroup({
      layout,
      entries,
    })
  }

  /**
   * Create a command encoder
   */
  createCommandEncoder(label?: string): GPUCommandEncoder | null {
    if (!this.device) {
      console.error('WebGPU device not initialized')
      return null
    }

    return this.device.createCommandEncoder({
      label,
    })
  }

  /**
   * Submit commands to the GPU queue
   */
  submitCommands(commands: GPUCommandBuffer[]): void {
    if (!this.device) {
      console.error('WebGPU device not initialized')
      return
    }

    this.device.queue.submit(commands)
  }

  /**
   * Resize canvas and update context
   */
  resize(width: number, height: number): void {
    if (!this.canvas || !this.context) {
      console.error('Canvas not initialized')
      return
    }

    this.canvas.width = width
    this.canvas.height = height

    // Reconfigure context with new size
    this.context.configure({
      device: this.device!,
      format: this.format,
      alphaMode: 'premultiplied',
    })
  }

  /**
   * Get current canvas size
   */
  getSize(): { width: number; height: number } {
    if (!this.canvas) {
      return { width: 0, height: 0 }
    }

    return {
      width: this.canvas.width,
      height: this.canvas.height,
    }
  }

  /**
   * Check if WebGPU is supported
   */
  static isSupported(): boolean {
    return 'gpu' in navigator
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
    try {
      if (!WebGPUContext.isSupported()) {
        return {
          supported: false,
          error: 'WebGPU not supported in this browser',
        }
      }

      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      })

      if (!adapter) {
        return {
          supported: false,
          error: 'No suitable GPU adapter found',
        }
      }

      const device = await adapter.requestDevice()

      return {
        supported: true,
        adapterInfo: adapter.name,
        deviceInfo: device.name || 'Unknown GPU',
      }
    } catch (error) {
      return {
        supported: false,
        error: `WebGPU initialization failed: ${error}`,
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Note: WebGPU resources are automatically garbage collected
    // when references are dropped. Explicit cleanup is generally
    // not needed, but we can add it here for completeness.
    this.device = null
    this.context = null
    this.adapter = null
    this.canvas = null
  }
}
