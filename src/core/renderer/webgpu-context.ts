/**
 * @fileoverview WebGPU Context Management
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { logger } from '@/core/logging/logger'
// TODO: Use AnimatorError for error handling
// import { AnimatorError } from '@/types'

/**
 * WebGPU rendering context and device management
 */
export class WebGPUContext {
  private device: GPUDevice | null = null
  private context: GPUCanvasContext | null = null
  private adapter: GPUAdapter | null = null
  private canvas: HTMLCanvasElement | null = null
  private format: GPUTextureFormat = 'bgra8unorm'

  constructor() {
    logger.info('WebGPUContext constructor called')
  }

  /**
   * Initialize WebGPU context with canvas
   */
  async initialize(canvas: HTMLCanvasElement): Promise<Result<boolean>> {
    logger.info('WebGPUContext.initialize called')
    try {
      logger.info('About to check navigator.gpu')
      // Check for WebGPU support
      logger.info('Checking WebGPU support, navigator.gpu:', !!navigator.gpu as any)
      if (!navigator.gpu) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_NOT_SUPPORTED',
            message:
              'WebGPU is not supported in this browser. Please use Chrome, Firefox, or Safari Technology Preview.',
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

      logger.info('✅ WebGPU context initialized successfully')
      // TODO: Add adapter and device name logging when available
      // logger.info(`   Adapter: ${this.adapter.name || 'Unknown'}`)
      // logger.info(`   Device: ${this.device.name || 'Unknown'}`)
      logger.info(`   Canvas Format: ${this.format}`)

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
      logger.error('WebGPU device not initialized')
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
    // TODO: Handle different data types properly
    new Uint8Array(dstBuffer).set(new Uint8Array(data as ArrayBuffer))
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
      logger.error('WebGPU device not initialized')
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
  createSampler(options: GPUSamplerDescriptor = {}): GPUSampler | null {
    if (!this.device) {
      logger.error('WebGPU device not initialized')
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
    targets: GPUColorTargetState[] = [
      {
        format: this.format,
      },
    ]
  ): GPURenderPipeline | null {
    if (!this.device) {
      logger.error('WebGPU device not initialized')
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
      logger.error('WebGPU device not initialized')
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
      logger.error('WebGPU device not initialized')
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
      logger.error('WebGPU device not initialized')
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
      logger.error('WebGPU device not initialized')
      return
    }

    this.device.queue.submit(commands)
  }

  /**
   * Resize canvas and update context
   */
  resize(width: number, height: number): void {
    if (!this.canvas || !this.context) {
      logger.error('Canvas not initialized')
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
   * Get canvas aspect ratio
   */
  getAspectRatio(): number {
    const size = this.getSize()
    return size.width / size.height
  }

  /**
   * Get canvas resolution (accounting for device pixel ratio)
   */
  getResolution(): { width: number; height: number } {
    if (!this.canvas) {
      return { width: 0, height: 0 }
    }

    const devicePixelRatio = window.devicePixelRatio || 1
    return {
      width: this.canvas.width * devicePixelRatio,
      height: this.canvas.height * devicePixelRatio,
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

      // TODO: Use device for GPU operations
      // const device = await adapter.requestDevice()

      return {
        supported: true,
        adapterInfo: 'Unknown Adapter', // TODO: Get adapter name when available
        deviceInfo: 'Unknown GPU', // TODO: Get device name when available
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

  /**
   * Create mock GPU device for testing
   */
  private createMockDevice(): GPUDevice {
    return {
      createBuffer: (descriptor: GPUBufferDescriptor) =>
        this.createMockBuffer(descriptor),
      createTexture: (descriptor: GPUTextureDescriptor) =>
        this.createMockTexture(descriptor),
      createSampler: (descriptor?: GPUSamplerDescriptor) =>
        this.createMockSampler(descriptor),
      createBindGroupLayout: (descriptor: GPUBindGroupLayoutDescriptor) =>
        this.createMockBindGroupLayout(descriptor),
      createPipelineLayout: (descriptor: GPUPipelineLayoutDescriptor) =>
        this.createMockPipelineLayout(descriptor),
      createRenderPipeline: (descriptor: GPURenderPipelineDescriptor) =>
        this.createMockRenderPipeline(descriptor),
      createComputePipeline: (descriptor: GPUComputePipelineDescriptor) =>
        this.createMockComputePipeline(descriptor),
      createBindGroup: (descriptor: GPUBindGroupDescriptor) =>
        this.createMockBindGroup(descriptor),
      createCommandEncoder: (descriptor?: GPUCommandEncoderDescriptor) =>
        this.createMockCommandEncoder(descriptor),
      createRenderBundleEncoder: (
        descriptor: GPURenderBundleEncoderDescriptor
      ) => this.createMockRenderBundleEncoder(descriptor),
      createQuerySet: (descriptor: GPUQuerySetDescriptor) =>
        this.createMockQuerySet(descriptor),
      destroy: () => {},
      getQueue: () => this.createMockQueue(),
      pushErrorScope: (_filter: GPUErrorFilter) => {},
      popErrorScope: () => Promise.resolve(null),
      name: 'Mock GPU Device',
      features: new Set(),
      limits: {
        maxTextureDimension1D: 8192,
        maxTextureDimension2D: 8192,
        maxTextureDimension3D: 2048,
        maxTextureArrayLayers: 256,
        maxBindGroups: 4,
        maxBindGroupsPlusVertexBuffers: 24,
        maxBindingsPerBindGroup: 640,
        maxDynamicUniformBuffersPerPipelineLayout: 8,
        maxDynamicStorageBuffersPerPipelineLayout: 4,
        maxSampledTexturesPerShaderStage: 16,
        maxSamplersPerShaderStage: 16,
        maxStorageBuffersPerShaderStage: 8,
        maxStorageTexturesPerShaderStage: 4,
        maxUniformBuffersPerShaderStage: 12,
        maxUniformBufferBindingSize: 65536,
        maxStorageBufferBindingSize: 134217728,
        maxVertexBuffers: 8,
        maxBufferSize: 268435456,
        maxVertexAttributes: 16,
        maxVertexBufferArrayStride: 2048,
        maxInterStageShaderComponents: 60,
        maxColorAttachments: 8,
        maxColorAttachmentBytesPerSample: 32,
        maxComputeWorkgroupStorageSize: 16384,
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupSizeY: 256,
        maxComputeWorkgroupSizeZ: 64,
        maxComputeWorkgroupsPerDimension: 65535,
      },
    } as GPUDevice
  }

  /**
   * Create mock GPU adapter for testing
   */
  // TODO: Implement mock adapter creation
  private createMockAdapter(): GPUAdapter {
    return {
      name: 'Mock GPU Adapter',
      isFallbackAdapter: false,
      features: new Set(),
      limits: {
        maxTextureDimension1D: 8192,
        maxTextureDimension2D: 8192,
        maxTextureDimension3D: 2048,
        maxTextureArrayLayers: 256,
        maxBindGroups: 4,
        maxBindGroupsPlusVertexBuffers: 24,
        maxBindingsPerBindGroup: 640,
        maxDynamicUniformBuffersPerPipelineLayout: 8,
        maxDynamicStorageBuffersPerPipelineLayout: 4,
        maxSampledTexturesPerShaderStage: 16,
        maxSamplersPerShaderStage: 16,
        maxStorageBuffersPerShaderStage: 8,
        maxStorageTexturesPerShaderStage: 4,
        maxUniformBuffersPerShaderStage: 12,
        maxUniformBufferBindingSize: 65536,
        maxStorageBufferBindingSize: 134217728,
        maxVertexBuffers: 8,
        maxBufferSize: 268435456,
        maxVertexAttributes: 16,
        maxVertexBufferArrayStride: 2048,
        maxInterStageShaderComponents: 60,
        maxColorAttachments: 8,
        maxColorAttachmentBytesPerSample: 32,
        maxComputeWorkgroupStorageSize: 16384,
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupSizeY: 256,
        maxComputeWorkgroupSizeZ: 64,
        maxComputeWorkgroupsPerDimension: 65535,
      },
      requestDevice: () => Promise.resolve(this.createMockDevice()),
      requestAdapterInfo: () =>
        Promise.resolve({
          vendor: 'Mock Vendor',
          architecture: 'Mock Architecture',
          device: 'Mock Device',
          description: 'Mock GPU Adapter for Testing',
        }),
    } as GPUAdapter
  }

  /**
   * Create mock GPU buffer for testing
   */
  private createMockBuffer(descriptor: GPUBufferDescriptor): GPUBuffer {
    return {
      size: descriptor.size,
      usage: descriptor.usage,
      mapState: 'unmapped',
      destroy: () => {},
      getMappedRange: (_offset?: number, size?: number) =>
        new ArrayBuffer(size || descriptor.size),
      unmap: () => {},
      mapAsync: (_mode: GPUMapModeFlags, _offset?: number, _size?: number) =>
        Promise.resolve(),
      label: descriptor.label || 'Mock Buffer',
    } as GPUBuffer
  }

  /**
   * Create mock GPU texture for testing
   */
  private createMockTexture(descriptor: GPUTextureDescriptor): GPUTexture {
    return {
      width: (descriptor.size as number[])[0],
      height: (descriptor.size as number[])[1] || 1,
      depthOrArrayLayers: (descriptor.size as number[])[2] || 1,
      mipLevelCount: descriptor.mipLevelCount || 1,
      sampleCount: descriptor.sampleCount || 1,
      dimension: descriptor.dimension || '2d',
      format: descriptor.format,
      usage: descriptor.usage,
      label: descriptor.label || 'Mock Texture',
      createView: (descriptor?: GPUTextureViewDescriptor) =>
        this.createMockTextureView(descriptor),
      destroy: () => {},
    } as GPUTexture
  }

  /**
   * Create mock GPU texture view for testing
   */
  private createMockTextureView(
    descriptor?: GPUTextureViewDescriptor
  ): GPUTextureView {
    return {
      label: descriptor?.label || 'Mock Texture View',
    } as GPUTextureView
  }

  /**
   * Create mock GPU sampler for testing
   */
  private createMockSampler(descriptor?: GPUSamplerDescriptor): GPUSampler {
    return {
      label: descriptor?.label || 'Mock Sampler',
    } as GPUSampler
  }

  /**
   * Create mock GPU bind group layout for testing
   */
  private createMockBindGroupLayout(
    descriptor: GPUBindGroupLayoutDescriptor
  ): GPUBindGroupLayout {
    return {
      label: descriptor.label || 'Mock Bind Group Layout',
    } as GPUBindGroupLayout
  }

  /**
   * Create mock GPU pipeline layout for testing
   */
  private createMockPipelineLayout(
    descriptor: GPUPipelineLayoutDescriptor
  ): GPUPipelineLayout {
    return {
      label: descriptor.label || 'Mock Pipeline Layout',
    } as GPUPipelineLayout
  }

  /**
   * Create mock GPU render pipeline for testing
   */
  private createMockRenderPipeline(
    descriptor: GPURenderPipelineDescriptor
  ): GPURenderPipeline {
    return {
      label: descriptor.label || 'Mock Render Pipeline',
      getBindGroupLayout: (_index: number) =>
        this.createMockBindGroupLayout({ entries: [] }),
    } as GPURenderPipeline
  }

  /**
   * Create mock GPU compute pipeline for testing
   */
  private createMockComputePipeline(
    descriptor: GPUComputePipelineDescriptor
  ): GPUComputePipeline {
    return {
      label: descriptor.label || 'Mock Compute Pipeline',
      getBindGroupLayout: (_index: number) =>
        this.createMockBindGroupLayout({ entries: [] }),
    } as GPUComputePipeline
  }

  /**
   * Create mock GPU bind group for testing
   */
  private createMockBindGroup(
    descriptor: GPUBindGroupDescriptor
  ): GPUBindGroup {
    return {
      label: descriptor.label || 'Mock Bind Group',
    } as GPUBindGroup
  }

  /**
   * Create mock GPU command encoder for testing
   */
  private createMockCommandEncoder(
    descriptor?: GPUCommandEncoderDescriptor
  ): GPUCommandEncoder {
    return {
      label: descriptor?.label || 'Mock Command Encoder',
      beginRenderPass: (descriptor: GPURenderPassDescriptor) =>
        this.createMockRenderPassEncoder(descriptor),
      beginComputePass: (descriptor?: GPUComputePassDescriptor) =>
        this.createMockComputePassEncoder(descriptor),
      copyBufferToBuffer: () => {},
      copyBufferToTexture: () => {},
      copyTextureToBuffer: () => {},
      copyTextureToTexture: () => {},
      clearBuffer: () => {},
      resolveQuerySet: () => {},
      writeTimestamp: () => {},
      pushDebugGroup: () => {},
      popDebugGroup: () => {},
      insertDebugMarker: () => {},
      finish: () => this.createMockCommandBuffer(),
    } as GPUCommandEncoder
  }

  /**
   * Create mock GPU render pass encoder for testing
   */
  private createMockRenderPassEncoder(
    _descriptor: GPURenderPassDescriptor
  ): GPURenderPassEncoder {
    return {
      label: 'Mock Render Pass Encoder',
      setPipeline: () => {},
      setBindGroup: () => {},
      setVertexBuffer: () => {},
      setIndexBuffer: () => {},
      setViewport: () => {},
      setScissorRect: () => {},
      setBlendConstant: () => {},
      setStencilReference: () => {},
      setRenderPipeline: () => {},
      setIndexBufferWithFormat: () => {},
      beginOcclusionQuery: () => {},
      endOcclusionQuery: () => {},
      beginPipelineStatisticsQuery: () => {},
      endPipelineStatisticsQuery: () => {},
      writeTimestamp: () => {},
      executeBundles: () => {},
      insertDebugMarker: () => {},
      pushDebugGroup: () => {},
      popDebugGroup: () => {},
      end: () => {},
    } as GPURenderPassEncoder
  }

  /**
   * Create mock GPU compute pass encoder for testing
   */
  private createMockComputePassEncoder(
    _descriptor?: GPUComputePassDescriptor
  ): GPUComputePassEncoder {
    return {
      label: 'Mock Compute Pass Encoder',
      setPipeline: () => {},
      setBindGroup: () => {},
      writeTimestamp: () => {},
      beginPipelineStatisticsQuery: () => {},
      endPipelineStatisticsQuery: () => {},
      insertDebugMarker: () => {},
      pushDebugGroup: () => {},
      popDebugGroup: () => {},
      end: () => {},
      dispatchWorkgroups: () => {},
      dispatchWorkgroupsIndirect: () => {},
    } as GPUComputePassEncoder
  }

  /**
   * Create mock GPU render bundle encoder for testing
   */
  private createMockRenderBundleEncoder(
    _descriptor: GPURenderBundleEncoderDescriptor
  ): GPURenderBundleEncoder {
    return {
      label: 'Mock Render Bundle Encoder',
      setPipeline: () => {},
      setBindGroup: () => {},
      setVertexBuffer: () => {},
      setIndexBuffer: () => {},
      setViewport: () => {},
      setScissorRect: () => {},
      setBlendConstant: () => {},
      setStencilReference: () => {},
      setRenderPipeline: () => {},
      setIndexBufferWithFormat: () => {},
      beginOcclusionQuery: () => {},
      endOcclusionQuery: () => {},
      beginPipelineStatisticsQuery: () => {},
      endPipelineStatisticsQuery: () => {},
      writeTimestamp: () => {},
      executeBundles: () => {},
      insertDebugMarker: () => {},
      pushDebugGroup: () => {},
      popDebugGroup: () => {},
      finish: () => this.createMockRenderBundle(),
    } as GPURenderBundleEncoder
  }

  /**
   * Create mock GPU render bundle for testing
   */
  private createMockRenderBundle(): GPURenderBundle {
    return {
      label: 'Mock Render Bundle',
    } as GPURenderBundle
  }

  /**
   * Create mock GPU command buffer for testing
   */
  private createMockCommandBuffer(): GPUCommandBuffer {
    return {
      label: 'Mock Command Buffer',
    } as GPUCommandBuffer
  }

  /**
   * Create mock GPU query set for testing
   */
  private createMockQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet {
    return {
      label: descriptor.label || 'Mock Query Set',
      type: descriptor.type,
      count: descriptor.count,
      destroy: () => {},
    } as GPUQuerySet
  }

  /**
   * Create mock GPU queue for testing
   */
  private createMockQueue(): GPUQueue {
    return {
      label: 'Mock GPU Queue',
      submit: () => {},
      writeBuffer: () => {},
      writeTexture: () => {},
      copyExternalImageToTexture: () => {},
      onSubmittedWorkDone: () => Promise.resolve(),
    } as GPUQueue
  }
}
