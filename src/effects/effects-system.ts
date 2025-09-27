/**
 * @fileoverview Core Effects System Implementation
 * @author @darianrosebrook
 */

import { Result, Time, Size2D } from '@/types'
import { WebGPUContext } from '../core/renderer/webgpu-context'
import {
  EffectSystem as IEffectSystem,
  EffectInstance,
  EffectType,
  EffectContext,
  EffectRenderer,
  EffectComposer,
  EffectLibrary,
  EffectPerformanceMonitor as IEffectPerformanceMonitor,
  EffectCache as IEffectCache,
  EffectValidator as IEffectValidator,
  BlendMode,
} from './effects-types'
import { EffectsLibrary } from './effects-library'

/**
 * Core effects system implementation with GPU acceleration
 */
export class EffectsSystem implements IEffectSystem {
  renderer: EffectRenderer
  composer: EffectComposer
  library: EffectLibrary
  monitor: EffectPerformanceMonitor
  cache: EffectCache
  validator: EffectValidator

  private webgpuContext: WebGPUContext
  private effectPipelines: Map<string, GPURenderPipeline> = new Map()
  private nextEffectId = 0

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
    this.library = new EffectsLibrary()
    this.monitor = new EffectPerformanceMonitor()
    this.cache = new EffectCache()
    this.validator = new EffectValidator()
    // Initialize components in initialize() method to avoid forward reference issues
  }

  initialize(): Result<boolean> {
    console.log('EffectsSystem.initialize called')
    try {
      // Validate WebGPU context
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for effects system',
          },
        }
      }

      // Initialize components after class definitions are available
      this.renderer = new EffectRendererImpl(
        this.webgpuContext,
        this.library,
        this.cache,
        this.monitor
      )
      this.composer = new EffectComposerImpl(
        this.webgpuContext,
        this.renderer,
        this.monitor
      )

      // Initialize effect renderer
      const rendererResult = this.renderer.initialize()
      if (!rendererResult.success) {
        return rendererResult
      }

      console.log('✅ Effects system initialized successfully')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EFFECTS_INIT_ERROR',
          message: `Failed to initialize effects system: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  createEffect(
    effectType: string,
    parameters?: Record<string, any>
  ): Result<EffectInstance> {
    try {
      const effectTypeDef = this.library.getEffectType(effectType)
      if (!effectTypeDef) {
        return {
          success: false,
          error: {
            code: 'EFFECT_TYPE_NOT_FOUND',
            message: `Effect type '${effectType}' not found`,
          },
        }
      }

      // Validate parameters
      const validationResult = this.validator.validateParameters(
        effectTypeDef,
        parameters || {}
      )
      if (!validationResult.success) {
        return validationResult
      }

      const effect: EffectInstance = {
        id: `effect_${this.nextEffectId++}`,
        type: effectTypeDef,
        parameters: this.getDefaultParameters(effectTypeDef, parameters),
        enabled: true,
        blendMode: BlendMode.Normal,
        opacity: 1.0,
        order: this.composer.effects.length,
      }

      return { success: true, data: effect }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EFFECT_CREATE_ERROR',
          message: `Failed to create effect: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  applyEffect(
    effect: EffectInstance,
    inputTexture: GPUTexture,
    time: Time
  ): Result<GPUTexture> {
    try {
      if (!effect.enabled) {
        return { success: true, data: inputTexture }
      }

      const startTime = performance.now()

      // Create effect context
      const context: EffectContext = {
        time,
        inputTexture,
        outputTexture: this.createOutputTexture(inputTexture),
        parameters: effect.parameters,
        viewportSize: {
          width: inputTexture.width,
          height: inputTexture.height,
        },
      }

      // Render effect
      const renderResult = this.renderer.renderEffect(effect, context)
      if (!renderResult.success) {
        return renderResult
      }

      // Track performance
      const renderTime = performance.now() - startTime
      this.monitor.trackRenderTime(effect.id, renderTime)

      return { success: true, data: context.outputTexture }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EFFECT_APPLY_ERROR',
          message: `Failed to apply effect: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  destroy(): void {
    // Clean up effect pipelines
    for (const [effectType, pipeline] of this.effectPipelines) {
      this.renderer.destroyEffectPipeline({ name: effectType } as EffectType)
    }
    this.effectPipelines.clear()

    // Clear cache
    this.cache.clear()

    console.log('🧹 Effects system destroyed')
  }

  private getDefaultParameters(
    effectType: EffectType,
    userParameters?: Record<string, any>
  ): Record<string, any> {
    const parameters: Record<string, any> = {}

    for (const paramDef of effectType.parameters) {
      if (userParameters && userParameters[paramDef.name] !== undefined) {
        parameters[paramDef.name] = userParameters[paramDef.name]
      } else {
        parameters[paramDef.name] = paramDef.defaultValue
      }
    }

    return parameters
  }

  private createOutputTexture(inputTexture: GPUTexture): GPUTexture {
    const device = this.webgpuContext.getDevice()!
    return device.createTexture({
      size: [inputTexture.width, inputTexture.height],
      format: inputTexture.format,
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    })
  }
}

/**
 * Effect renderer implementation
 */
class EffectRendererImpl implements EffectRenderer {
  private webgpuContext: WebGPUContext
  private library: EffectLibrary
  private cache: EffectCache
  private monitor: EffectPerformanceMonitor
  private pipelines: Map<string, GPURenderPipeline> = new Map()

  constructor(
    webgpuContext: WebGPUContext,
    library: EffectLibrary,
    cache: EffectCache,
    monitor: EffectPerformanceMonitor
  ) {
    this.webgpuContext = webgpuContext
    this.library = library
    this.cache = cache
    this.monitor = monitor
  }

  initialize(): Result<boolean> {
    try {
      console.log('🚀 Effect renderer initialized')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RENDERER_INIT_ERROR',
          message: `Failed to initialize effect renderer: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  renderEffect(
    effect: EffectInstance,
    context: EffectContext
  ): Result<boolean> {
    try {
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for effect rendering',
          },
        }
      }

      // Get or create effect pipeline
      const pipeline = this.getOrCreatePipeline(effect.type)
      if (!pipeline) {
        return {
          success: false,
          error: {
            code: 'PIPELINE_CREATE_ERROR',
            message: `Failed to create pipeline for effect ${effect.type.name}`,
          },
        }
      }

      // Create command encoder
      const commandEncoder = device.createCommandEncoder({
        label: `Effect ${effect.type.name}`,
      })

      // Create bind groups for textures and parameters
      const bindGroups = this.createBindGroups(effect, context, pipeline)

      // Begin render pass
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.outputTexture.createView(),
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          },
        ],
      })

      renderPass.setPipeline(pipeline)

      // Set bind groups
      for (let i = 0; i < bindGroups.length; i++) {
        renderPass.setBindGroup(i, bindGroups[i])
      }

      // Draw full screen quad
      renderPass.draw(6, 1, 0, 0)
      renderPass.end()

      // Submit commands
      const commandBuffer = commandEncoder.finish()
      device.queue.submit([commandBuffer])

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EFFECT_RENDER_ERROR',
          message: `Failed to render effect: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  createEffectPipeline(effectType: EffectType): Result<GPURenderPipeline> {
    try {
      const device = this.webgpuContext.getDevice()!
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for pipeline creation',
          },
        }
      }

      // Create shader module
      const shaderModule = device.createShaderModule({
        code: effectType.shader,
      })

      // Create pipeline layout (simplified)
      const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [
          // Texture bind group layout
          device.createBindGroupLayout({
            entries: [
              {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: 'float' },
              },
              {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                storageTexture: {
                  access: 'write-only',
                  format: 'rgba8unorm',
                },
              },
            ],
          }),
          // Parameter bind group layout
          device.createBindGroupLayout({
            entries: [
              {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' },
              },
            ],
          }),
        ],
      })

      // Create render pipeline
      const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: device.createShaderModule({
            code: this.getQuadVertexShader(),
          }),
          entryPoint: 'main',
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'main',
          targets: [
            {
              format: 'rgba8unorm',
            },
          ],
        },
        primitive: {
          topology: 'triangle-list',
        },
      })

      this.pipelines.set(effectType.name, pipeline)
      return { success: true, data: pipeline }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PIPELINE_CREATE_ERROR',
          message: `Failed to create effect pipeline: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  destroyEffectPipeline(effectType: EffectType): void {
    const pipeline = this.pipelines.get(effectType.name)
    if (pipeline) {
      // In WebGPU, pipelines are managed by the device and don't need explicit destruction
      this.pipelines.delete(effectType.name)
    }
  }

  private getOrCreatePipeline(
    effectType: EffectType
  ): GPURenderPipeline | null {
    let pipeline = this.pipelines.get(effectType.name)
    if (!pipeline) {
      const result = this.createEffectPipeline(effectType)
      if (result.success) {
        pipeline = result.data
      }
    }
    return pipeline || null
  }

  private createBindGroups(
    effect: EffectInstance,
    context: EffectContext,
    pipeline: GPURenderPipeline
  ): GPUBindGroup[] {
    const device = this.webgpuContext.getDevice()!
    const bindGroups: GPUBindGroup[] = []

    // Create texture bind group
    const textureBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: context.inputTexture.createView(),
        },
        {
          binding: 1,
          resource: context.outputTexture.createView(),
        },
      ],
    })
    bindGroups.push(textureBindGroup)

    // Create parameter bind group
    const paramsBuffer = this.createParameterBuffer(effect, context)
    const paramBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: paramsBuffer,
          },
        },
      ],
    })
    bindGroups.push(paramBindGroup)

    return bindGroups
  }

  private createParameterBuffer(
    effect: EffectInstance,
    context: EffectContext
  ): GPUBuffer {
    const device = this.webgpuContext.getDevice()!

    // Create a buffer with effect parameters
    // This is a simplified implementation - in practice, you'd need to handle different parameter types
    const paramsData = new Float32Array(16) // 16 floats for various parameters

    // Fill with some parameter values (simplified)
    let index = 0
    for (const [key, value] of Object.entries(effect.parameters)) {
      if (typeof value === 'number') {
        paramsData[index] = value
        index++
        if (index >= 16) break
      }
    }

    const buffer = device.createBuffer({
      size: paramsData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    device.queue.writeBuffer(buffer, 0, paramsData)
    return buffer
  }

  private getQuadVertexShader(): string {
    return `
      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) uv: vec2<f32>,
      }

      @vertex
      fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
        var output: VertexOutput;

        // Full screen quad vertices
        let positions = array<vec2<f32>, 6>(
          vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
          vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
        );

        let uvs = array<vec2<f32>, 6>(
          vec2<f32>(0.0, 1.0), vec2<f32>(1.0, 1.0), vec2<f32>(0.0, 0.0),
          vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 1.0), vec2<f32>(1.0, 0.0)
        );

        output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
        output.uv = uvs[vertexIndex];

        return output;
      }
    `
  }
}

/**
 * Effect composer implementation
 */
class EffectComposerImpl implements EffectComposer {
  effects: EffectInstance[] = []
  inputTexture: GPUTexture | null = null
  outputTexture: GPUTexture | null = null

  private webgpuContext: WebGPUContext
  private renderer: EffectRenderer
  private monitor: EffectPerformanceMonitor

  constructor(
    webgpuContext: WebGPUContext,
    renderer: EffectRenderer,
    monitor: EffectPerformanceMonitor
  ) {
    this.webgpuContext = webgpuContext
    this.renderer = renderer
    this.monitor = monitor
  }

  addEffect(effect: EffectInstance): void {
    this.effects.push(effect)
    this.sortEffectsByOrder()
  }

  removeEffect(effectId: string): void {
    this.effects = this.effects.filter((e) => e.id !== effectId)
  }

  reorderEffects(effects: EffectInstance[]): void {
    this.effects = effects
  }

  setInputTexture(texture: GPUTexture): void {
    this.inputTexture = texture
  }

  setOutputTexture(texture: GPUTexture): void {
    this.outputTexture = texture
  }

  compose(time: Time): Result<boolean> {
    try {
      if (!this.inputTexture || !this.outputTexture) {
        return {
          success: false,
          error: {
            code: 'COMPOSER_SETUP_ERROR',
            message: 'Input or output texture not set',
          },
        }
      }

      let currentTexture = this.inputTexture

      for (const effect of this.effects) {
        if (!effect.enabled) continue

        // Apply effect to current texture
        const effectResult = this.renderer.renderEffect(effect, {
          time,
          inputTexture: currentTexture,
          outputTexture: this.createIntermediateTexture(),
          parameters: effect.parameters,
          viewportSize: {
            width: currentTexture.width,
            height: currentTexture.height,
          },
        })

        if (!effectResult.success) {
          return effectResult
        }

        currentTexture = this.createIntermediateTexture()
      }

      // Final composition (simplified)
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPOSER_ERROR',
          message: `Failed to compose effects: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private sortEffectsByOrder(): void {
    this.effects.sort((a, b) => a.order - b.order)
  }

  private createIntermediateTexture(): GPUTexture {
    const device = this.webgpuContext.getDevice()!
    if (!this.inputTexture) {
      throw new Error('Input texture not set')
    }

    return device.createTexture({
      size: [this.inputTexture.width, this.inputTexture.height],
      format: this.inputTexture.format,
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    })
  }
}

/**
 * Effect performance monitor implementation
 */
class EffectPerformanceMonitor implements EffectPerformanceMonitor {
  private renderTimes: Map<string, number[]> = new Map()
  private memoryUsage: Map<string, number> = new Map()

  trackRenderTime(effectId: string, timeMs: number): void {
    if (!this.renderTimes.has(effectId)) {
      this.renderTimes.set(effectId, [])
    }
    const times = this.renderTimes.get(effectId)!
    times.push(timeMs)

    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift()
    }
  }

  trackMemoryUsage(effectId: string, usageMB: number): void {
    this.memoryUsage.set(effectId, usageMB)
  }

  getAverageRenderTime(effectId: string): number {
    const times = this.renderTimes.get(effectId)
    if (!times || times.length === 0) return 0
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }

  getMemoryUsage(effectId: string): number {
    return this.memoryUsage.get(effectId) || 0
  }

  getOverallPerformance(): {
    totalRenderTime: number
    averageFrameTime: number
    memoryUsage: number
    effectCount: number
  } {
    let totalRenderTime = 0
    let effectCount = 0

    for (const times of this.renderTimes.values()) {
      totalRenderTime += times.reduce((sum, time) => sum + time, 0)
      effectCount += times.length
    }

    const averageFrameTime = effectCount > 0 ? totalRenderTime / effectCount : 0
    const memoryUsage = Array.from(this.memoryUsage.values()).reduce(
      (sum, usage) => sum + usage,
      0
    )

    return {
      totalRenderTime,
      averageFrameTime,
      memoryUsage,
      effectCount,
    }
  }
}

/**
 * Effect cache implementation
 */
class EffectCache implements EffectCache {
  private cache: Map<string, { texture: GPUTexture; timestamp: number }> =
    new Map()
  private maxSize = 50
  private maxAge = 5000 // 5 seconds

  get(context: EffectContext): GPUTexture | null {
    const key = this.getCacheKey(context)
    const entry = this.cache.get(key)

    if (entry && Date.now() - entry.timestamp < this.maxAge) {
      return entry.texture
    }

    return null
  }

  set(context: EffectContext, texture: GPUTexture): void {
    const key = this.getCacheKey(context)

    // Remove old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, { texture, timestamp: Date.now() })
  }

  invalidate(effectId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(effectId)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  getStats(): {
    size: number
    hitRate: number
    memoryUsage: number
  } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need hit/miss tracking
      memoryUsage: this.cache.size * 8, // Rough estimate
    }
  }

  private getCacheKey(context: EffectContext): string {
    // Simplified cache key - in practice, would need more sophisticated key generation
    return `${context.time}_${context.viewportSize.width}x${context.viewportSize.height}`
  }
}

/**
 * Effect validator implementation
 */
class EffectValidator implements EffectValidator {
  validateEffect(effect: EffectInstance): Result<boolean> {
    try {
      if (!effect.type) {
        return {
          success: false,
          error: {
            code: 'INVALID_EFFECT',
            message: 'Effect type is required',
          },
        }
      }

      const paramResult = this.validateParameters(
        effect.type,
        effect.parameters
      )
      if (!paramResult.success) {
        return paramResult
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Failed to validate effect: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  validateParameters(
    effectType: EffectType,
    parameters: Record<string, any>
  ): Result<boolean> {
    try {
      for (const paramDef of effectType.parameters) {
        const value = parameters[paramDef.name]

        if (value === undefined && paramDef.defaultValue === undefined) {
          return {
            success: false,
            error: {
              code: 'MISSING_PARAMETER',
              message: `Required parameter '${paramDef.name}' is missing`,
            },
          }
        }

        // Type validation (simplified)
        if (paramDef.type === 'float' && typeof value !== 'number') {
          return {
            success: false,
            error: {
              code: 'INVALID_PARAMETER_TYPE',
              message: `Parameter '${paramDef.name}' must be a number`,
            },
          }
        }

        // Range validation
        if (paramDef.min !== undefined && value < paramDef.min) {
          return {
            success: false,
            error: {
              code: 'PARAMETER_OUT_OF_RANGE',
              message: `Parameter '${paramDef.name}' is below minimum value ${paramDef.min}`,
            },
          }
        }

        if (paramDef.max !== undefined && value > paramDef.max) {
          return {
            success: false,
            error: {
              code: 'PARAMETER_OUT_OF_RANGE',
              message: `Parameter '${paramDef.name}' is above maximum value ${paramDef.max}`,
            },
          }
        }
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_VALIDATION_ERROR',
          message: `Failed to validate parameters: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  validateShader(shader: string): Result<boolean> {
    try {
      // Basic shader validation (simplified)
      if (
        !shader.includes('@compute') &&
        !shader.includes('@vertex') &&
        !shader.includes('@fragment')
      ) {
        return {
          success: false,
          error: {
            code: 'INVALID_SHADER',
            message: 'Shader must contain entry point decorators',
          },
        }
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SHADER_VALIDATION_ERROR',
          message: `Failed to validate shader: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  validatePipeline(pipeline: GPURenderPipeline): Result<boolean> {
    try {
      // Basic pipeline validation (simplified)
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PIPELINE_VALIDATION_ERROR',
          message: `Failed to validate pipeline: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }
}
