/**
 * @fileoverview Glow Effect Implementation
 * @description GPU-accelerated glow effect using multi-pass Gaussian blur
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { GlowParameters, EffectType, BlendMode } from '@/types/effects'
import { WebGPUContext } from '../core/renderer/webgpu-context'
// import { logger } from '@/core/logging/logger' // Temporarily commented out to fix hanging issue

/**
 * Glow effect uniforms structure (matches WGSL shader)
 */
interface GlowUniforms {
  resolution: [number, number]
  intensity: number
  radius: number
  color: [number, number, number]
  threshold: number
  time: number
  padding: number
}

/**
 * Glow effect renderer implementation
 */
export class GlowEffectRenderer {
  private webgpuContext: WebGPUContext
  private horizontalBlurPipeline: GPUComputePipeline | null = null
  private verticalBlurPipeline: GPUComputePipeline | null = null
  private compositePipeline: GPUComputePipeline | null = null
  private uniformBuffer: GPUBuffer | null = null
  private intermediateTexture: GPUTexture | null = null

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  /**
   * Initialize glow effect pipelines
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for glow effect',
          },
        }
      }

      // Load glow shader
      const shaderResponse = await fetch('/shaders/effects/glow.wgsl')
      const shaderCode = await shaderResponse.text()

      const shaderModule = device.createShaderModule({
        label: 'Glow Effect Shader',
        code: shaderCode,
      })

      // Create bind group layout
      const bindGroupLayout = device.createBindGroupLayout({
        label: 'Glow Effect Bind Group Layout',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'uniform' },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            texture: { sampleType: 'float' },
          },
          {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture: { access: 'write-only', format: 'rgba8unorm' },
          },
          {
            binding: 3,
            visibility: GPUShaderStage.COMPUTE,
            sampler: { type: 'filtering' },
          },
        ],
      })

      const pipelineLayout = device.createPipelineLayout({
        label: 'Glow Effect Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout],
      })

      // Create compute pipelines for each pass
      this.horizontalBlurPipeline = device.createComputePipeline({
        label: 'Glow Horizontal Blur Pipeline',
        layout: pipelineLayout,
        compute: {
          module: shaderModule,
          entryPoint: 'horizontalBlur',
        },
      })

      this.verticalBlurPipeline = device.createComputePipeline({
        label: 'Glow Vertical Blur Pipeline',
        layout: pipelineLayout,
        compute: {
          module: shaderModule,
          entryPoint: 'verticalBlur',
        },
      })

      this.compositePipeline = device.createComputePipeline({
        label: 'Glow Composite Pipeline',
        layout: pipelineLayout,
        compute: {
          module: shaderModule,
          entryPoint: 'composite',
        },
      })

      // Create uniform buffer
      this.uniformBuffer = device.createBuffer({
        label: 'Glow Uniforms',
        size: 32, // 8 floats * 4 bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      // logger.info('✅ Glow effect initialized successfully')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GLOW_INIT_ERROR',
          message: `Failed to initialize glow effect: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Apply glow effect to input texture
   */
  applyGlow(
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    parameters: GlowParameters,
    time: number
  ): Result<boolean> {
    try {
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available',
          },
        }
      }

      if (
        !this.horizontalBlurPipeline ||
        !this.verticalBlurPipeline ||
        !this.compositePipeline
      ) {
        return {
          success: false,
          error: {
            code: 'PIPELINES_NOT_INITIALIZED',
            message: 'Glow effect pipelines not initialized',
          },
        }
      }

      // Create or reuse intermediate texture
      if (
        !this.intermediateTexture ||
        this.intermediateTexture.width !== inputTexture.width ||
        this.intermediateTexture.height !== inputTexture.height
      ) {
        this.intermediateTexture?.destroy()
        this.intermediateTexture = device.createTexture({
          label: 'Glow Intermediate Texture',
          size: [inputTexture.width, inputTexture.height],
          format: 'rgba8unorm',
          usage:
            GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        })
      }

      // Update uniforms
      const uniforms: GlowUniforms = {
        resolution: [inputTexture.width, inputTexture.height],
        intensity: parameters.intensity ?? 1.0,
        radius: parameters.radius ?? 20,
        color: [
          (parameters.color?.r ?? 255) / 255,
          (parameters.color?.g ?? 255) / 255,
          (parameters.color?.b ?? 255) / 255,
        ],
        threshold: (parameters.threshold ?? 128) / 255,
        time,
        padding: 0,
      }

      const uniformData = new Float32Array([
        uniforms.resolution[0],
        uniforms.resolution[1],
        uniforms.intensity,
        uniforms.radius,
        uniforms.color[0],
        uniforms.color[1],
        uniforms.color[2],
        uniforms.threshold,
      ])

      device.queue.writeBuffer(this.uniformBuffer!, 0, uniformData)

      // Create sampler
      const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
      })

      // Create command encoder
      const commandEncoder = device.createCommandEncoder({
        label: 'Glow Effect Commands',
      })

      // Pass 1: Horizontal blur
      const horizontalBindGroup = device.createBindGroup({
        label: 'Horizontal Blur Bind Group',
        layout: this.horizontalBlurPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.uniformBuffer! } },
          { binding: 1, resource: inputTexture.createView() },
          { binding: 2, resource: this.intermediateTexture.createView() },
          { binding: 3, resource: sampler },
        ],
      })

      const horizontalPass = commandEncoder.beginComputePass({
        label: 'Horizontal Blur Pass',
      })
      horizontalPass.setPipeline(this.horizontalBlurPipeline)
      horizontalPass.setBindGroup(0, horizontalBindGroup)
      const workgroupsX = Math.ceil(inputTexture.width / 8)
      const workgroupsY = Math.ceil(inputTexture.height / 8)
      horizontalPass.dispatchWorkgroups(workgroupsX, workgroupsY)
      horizontalPass.end()

      // Pass 2: Vertical blur
      const verticalBindGroup = device.createBindGroup({
        label: 'Vertical Blur Bind Group',
        layout: this.verticalBlurPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.uniformBuffer! } },
          { binding: 1, resource: this.intermediateTexture.createView() },
          { binding: 2, resource: outputTexture.createView() },
          { binding: 3, resource: sampler },
        ],
      })

      const verticalPass = commandEncoder.beginComputePass({
        label: 'Vertical Blur Pass',
      })
      verticalPass.setPipeline(this.verticalBlurPipeline)
      verticalPass.setBindGroup(0, verticalBindGroup)
      verticalPass.dispatchWorkgroups(workgroupsX, workgroupsY)
      verticalPass.end()

      // Submit commands
      const commandBuffer = commandEncoder.finish()
      device.queue.submit([commandBuffer])

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GLOW_APPLY_ERROR',
          message: `Failed to apply glow effect: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Destroy resources
   */
  destroy(): void {
    this.uniformBuffer?.destroy()
    this.intermediateTexture?.destroy()
    this.uniformBuffer = null
    this.intermediateTexture = null
    this.horizontalBlurPipeline = null
    this.verticalBlurPipeline = null
    this.compositePipeline = null
  }
}

/**
 * Create glow effect type definition for effects library
 */
export function createGlowEffectType(): EffectType {
  return EffectType.GLOW
}

/**
 * Create default glow parameters
 */
export function createDefaultGlowParameters(): GlowParameters {
  return {
    intensity: 1.0,
    radius: 20,
    color: { r: 255, g: 255, b: 255 },
    quality: 'medium',
    threshold: 128,
    innerGlow: false,
    enabled: true,
    opacity: 1.0,
    blendMode: BlendMode.NORMAL,
  }
}

/**
 * Validate glow parameters
 */
export function validateGlowParameters(
  params: Partial<GlowParameters>
): Result<GlowParameters> {
  const errors: string[] = []

  // Validate intensity
  if (params.intensity !== undefined) {
    if (params.intensity < 0 || params.intensity > 2) {
      errors.push('Intensity must be between 0.0 and 2.0')
    }
  }

  // Validate radius
  if (params.radius !== undefined) {
    if (params.radius < 1 || params.radius > 100) {
      errors.push('Radius must be between 1 and 100 pixels')
    }
  }

  // Validate color
  if (params.color) {
    if (
      params.color.r < 0 ||
      params.color.r > 255 ||
      params.color.g < 0 ||
      params.color.g > 255 ||
      params.color.b < 0 ||
      params.color.b > 255
    ) {
      errors.push('Color values must be between 0 and 255')
    }
  }

  // Validate threshold
  if (params.threshold !== undefined) {
    if (params.threshold < 0 || params.threshold > 255) {
      errors.push('Threshold must be between 0 and 255')
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_GLOW_PARAMETERS',
        message: errors.join('; '),
      },
    }
  }

  // Merge with defaults
  const validParams: GlowParameters = {
    ...createDefaultGlowParameters(),
    ...params,
  }

  return { success: true, data: validParams }
}
