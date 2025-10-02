/**
 * @fileoverview Blur Effect Implementation
 * @description GPU-accelerated blur effects (Gaussian, Box, Motion)
 * @author @darianrosebrook
 */

import { Result } from '../types'
import {
  GaussianBlurParameters,
  BoxBlurParameters,
  MotionBlurParameters,
  EffectType,
  BlendMode,
} from '../types/effects'
import { WebGPUContext } from '../core/renderer/webgpu-context'
import { logger } from '../core/logging/logger'

/**
 * Blur effect uniforms structure
 */
interface BlurUniforms {
  resolution: [number, number]
  radius: number
  sigma: number
  angle: number
  distance: number
  iterations: number
  time: number
  padding: number
}

/**
 * Blur effect renderer implementation
 */
export class BlurEffectRenderer {
  private webgpuContext: WebGPUContext
  private gaussianBlurPipeline: GPUComputePipeline | null = null
  private boxBlurPipeline: GPUComputePipeline | null = null
  private motionBlurPipeline: GPUComputePipeline | null = null
  private uniformBuffer: GPUBuffer | null = null
  private intermediateTexture: GPUTexture | null = null

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  /**
   * Initialize blur effect pipelines
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for blur effect',
          },
        }
      }

      // Create blur shader module
      const shaderModule = device.createShaderModule({
        label: 'Blur Effect Shader',
        code: this.getBlurShaderCode(),
      })

      // Create bind group layout
      const bindGroupLayout = device.createBindGroupLayout({
        label: 'Blur Effect Bind Group Layout',
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
        label: 'Blur Effect Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout],
      })

      // Create compute pipelines for different blur types
      this.gaussianBlurPipeline = device.createComputePipeline({
        label: 'Gaussian Blur Pipeline',
        layout: pipelineLayout,
        compute: {
          module: shaderModule,
          entryPoint: 'gaussianBlur',
        },
      })

      this.boxBlurPipeline = device.createComputePipeline({
        label: 'Box Blur Pipeline',
        layout: pipelineLayout,
        compute: {
          module: shaderModule,
          entryPoint: 'boxBlur',
        },
      })

      this.motionBlurPipeline = device.createComputePipeline({
        label: 'Motion Blur Pipeline',
        layout: pipelineLayout,
        compute: {
          module: shaderModule,
          entryPoint: 'motionBlur',
        },
      })

      // Create uniform buffer
      this.uniformBuffer = device.createBuffer({
        label: 'Blur Uniforms',
        size: 32, // 8 floats * 4 bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      logger.info('✅ Blur effect initialized successfully')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BLUR_INIT_ERROR',
          message: `Failed to initialize blur effect: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Apply Gaussian blur effect
   */
  applyGaussianBlur(
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    parameters: GaussianBlurParameters,
    time: number
  ): Result<boolean> {
    return this.applyBlur(
      inputTexture,
      outputTexture,
      parameters,
      time,
      'gaussian'
    )
  }

  /**
   * Apply box blur effect
   */
  applyBoxBlur(
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    parameters: BoxBlurParameters,
    time: number
  ): Result<boolean> {
    return this.applyBlur(inputTexture, outputTexture, parameters, time, 'box')
  }

  /**
   * Apply motion blur effect
   */
  applyMotionBlur(
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    parameters: MotionBlurParameters,
    time: number
  ): Result<boolean> {
    return this.applyBlur(
      inputTexture,
      outputTexture,
      parameters,
      time,
      'motion'
    )
  }

  /**
   * Core blur application method
   */
  private applyBlur(
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    parameters:
      | GaussianBlurParameters
      | BoxBlurParameters
      | MotionBlurParameters,
    time: number,
    blurType: 'gaussian' | 'box' | 'motion'
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

      const pipeline = this.getPipeline(blurType)
      if (!pipeline) {
        return {
          success: false,
          error: {
            code: 'PIPELINE_NOT_INITIALIZED',
            message: `${blurType} blur pipeline not initialized`,
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
          label: 'Blur Intermediate Texture',
          size: [inputTexture.width, inputTexture.height],
          format: 'rgba8unorm',
          usage:
            GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        })
      }

      // Update uniforms based on blur type
      const uniforms = this.createUniforms(
        parameters,
        inputTexture,
        time,
        blurType
      )
      const uniformData = new Float32Array([
        uniforms.resolution[0],
        uniforms.resolution[1],
        uniforms.radius,
        uniforms.sigma,
        uniforms.angle,
        uniforms.distance,
        uniforms.iterations,
        uniforms.time,
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
        label: `${blurType} Blur Commands`,
      })

      // Create bind group
      const bindGroup = device.createBindGroup({
        label: `${blurType} Blur Bind Group`,
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.uniformBuffer! } },
          { binding: 1, resource: inputTexture.createView() },
          { binding: 2, resource: outputTexture.createView() },
          { binding: 3, resource: sampler },
        ],
      })

      // Dispatch compute pass
      const computePass = commandEncoder.beginComputePass({
        label: `${blurType} Blur Pass`,
      })
      computePass.setPipeline(pipeline)
      computePass.setBindGroup(0, bindGroup)

      const workgroupsX = Math.ceil(inputTexture.width / 8)
      const workgroupsY = Math.ceil(inputTexture.height / 8)
      computePass.dispatchWorkgroups(workgroupsX, workgroupsY)
      computePass.end()

      // Submit commands
      const commandBuffer = commandEncoder.finish()
      device.queue.submit([commandBuffer])

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BLUR_APPLY_ERROR',
          message: `Failed to apply ${blurType} blur: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get appropriate pipeline for blur type
   */
  private getPipeline(blurType: string): GPUComputePipeline | null {
    switch (blurType) {
      case 'gaussian':
        return this.gaussianBlurPipeline
      case 'box':
        return this.boxBlurPipeline
      case 'motion':
        return this.motionBlurPipeline
      default:
        return null
    }
  }

  /**
   * Create uniforms based on parameters and blur type
   */
  private createUniforms(
    parameters:
      | GaussianBlurParameters
      | BoxBlurParameters
      | MotionBlurParameters,
    inputTexture: GPUTexture,
    time: number,
    blurType: string
  ): BlurUniforms {
    const baseUniforms: BlurUniforms = {
      resolution: [inputTexture.width, inputTexture.height],
      radius: 0,
      sigma: 0,
      angle: 0,
      distance: 0,
      iterations: 1,
      time,
      padding: 0,
    }

    switch (blurType) {
      case 'gaussian':
        const gaussianParams = parameters as GaussianBlurParameters
        baseUniforms.radius = gaussianParams.radius
        baseUniforms.sigma = gaussianParams.sigma ?? gaussianParams.radius / 3.0
        break

      case 'box':
        const boxParams = parameters as BoxBlurParameters
        baseUniforms.radius = boxParams.radius
        baseUniforms.iterations = boxParams.iterations ?? 1
        break

      case 'motion':
        const motionParams = parameters as MotionBlurParameters
        baseUniforms.angle = (motionParams.angle * Math.PI) / 180 // Convert to radians
        baseUniforms.distance = motionParams.distance
        baseUniforms.steps = motionParams.steps ?? 8
        break
    }

    return baseUniforms
  }

  /**
   * Get blur shader code
   */
  private getBlurShaderCode(): string {
    return `
      struct BlurUniforms {
        resolution: vec2<f32>,
        radius: f32,
        sigma: f32,
        angle: f32,
        distance: f32,
        iterations: f32,
        time: f32,
        padding: f32,
      }

      @group(0) @binding(0) var<uniform> uniforms: BlurUniforms;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(0) @binding(3) var linearSampler: sampler;

      fn gaussianWeight(distance: f32, sigma: f32) -> f32 {
        let coefficient = 1.0 / sqrt(2.0 * 3.14159265359 * sigma * sigma);
        let exponent = -(distance * distance) / (2.0 * sigma * sigma);
        return coefficient * exp(exponent);
      }

      @compute @workgroup_size(8, 8)
      fn gaussianBlur(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(f32(id.x), f32(id.y));
        let uv = coord / uniforms.resolution;
        
        if (coord.x >= uniforms.resolution.x || coord.y >= uniforms.resolution.y) {
          return;
        }
        
        let kernelSize = i32(ceil(uniforms.radius * 2.0));
        var color = vec4<f32>(0.0);
        var totalWeight = 0.0;
        
        // Gaussian blur sampling
        for (var i = -kernelSize; i <= kernelSize; i++) {
          for (var j = -kernelSize; j <= kernelSize; j++) {
            let offset = vec2<f32>(f32(i), f32(j)) / uniforms.resolution;
            let sampleUV = uv + offset;
            
            if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && 
                sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
              let distance = length(vec2<f32>(f32(i), f32(j)));
              let weight = gaussianWeight(distance, uniforms.sigma);
              let sample = textureSampleLevel(inputTexture, linearSampler, sampleUV, 0.0);
              
              color += sample * weight;
              totalWeight += weight;
            }
          }
        }
        
        if (totalWeight > 0.0) {
          color /= totalWeight;
        }
        
        textureStore(outputTexture, vec2<i32>(id.xy), color);
      }

      @compute @workgroup_size(8, 8)
      fn boxBlur(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(f32(id.x), f32(id.y));
        let uv = coord / uniforms.resolution;
        
        if (coord.x >= uniforms.resolution.x || coord.y >= uniforms.resolution.y) {
          return;
        }
        
        let kernelSize = i32(uniforms.radius);
        var color = vec4<f32>(0.0);
        var sampleCount = 0.0;
        
        // Box blur sampling
        for (var i = -kernelSize; i <= kernelSize; i++) {
          for (var j = -kernelSize; j <= kernelSize; j++) {
            let offset = vec2<f32>(f32(i), f32(j)) / uniforms.resolution;
            let sampleUV = uv + offset;
            
            if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && 
                sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
              let sample = textureSampleLevel(inputTexture, linearSampler, sampleUV, 0.0);
              color += sample;
              sampleCount += 1.0;
            }
          }
        }
        
        if (sampleCount > 0.0) {
          color /= sampleCount;
        }
        
        textureStore(outputTexture, vec2<i32>(id.xy), color);
      }

      @compute @workgroup_size(8, 8)
      fn motionBlur(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(f32(id.x), f32(id.y));
        let uv = coord / uniforms.resolution;
        
        if (coord.x >= uniforms.resolution.x || coord.y >= uniforms.resolution.y) {
          return;
        }
        
        let direction = vec2<f32>(cos(uniforms.angle), sin(uniforms.angle));
        let stepSize = uniforms.distance / uniforms.iterations;
        var color = vec4<f32>(0.0);
        var totalWeight = 0.0;
        
        // Motion blur sampling
        for (var i = 0; i < i32(uniforms.iterations); i++) {
          let offset = direction * (f32(i) - uniforms.iterations * 0.5) * stepSize / uniforms.resolution;
          let sampleUV = uv + offset;
          
          if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && 
              sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
            let sample = textureSampleLevel(inputTexture, linearSampler, sampleUV, 0.0);
            let weight = 1.0 - abs(f32(i) - uniforms.iterations * 0.5) / (uniforms.iterations * 0.5);
            
            color += sample * weight;
            totalWeight += weight;
          }
        }
        
        if (totalWeight > 0.0) {
          color /= totalWeight;
        }
        
        textureStore(outputTexture, vec2<i32>(id.xy), color);
      }
    `
  }

  /**
   * Destroy resources
   */
  destroy(): void {
    this.uniformBuffer?.destroy()
    this.intermediateTexture?.destroy()
    this.uniformBuffer = null
    this.intermediateTexture = null
    this.gaussianBlurPipeline = null
    this.boxBlurPipeline = null
    this.motionBlurPipeline = null
  }
}

/**
 * Create default blur parameters
 */
export function createDefaultGaussianBlurParameters(): GaussianBlurParameters {
  return {
    radius: 10,
    sigma: 3.33,
    quality: 'medium',
    enabled: true,
    opacity: 1.0,
    blendMode: BlendMode.NORMAL,
  }
}

export function createDefaultBoxBlurParameters(): BoxBlurParameters {
  return {
    radius: 5,
    iterations: 1,
    enabled: true,
    opacity: 1.0,
    blendMode: BlendMode.NORMAL,
  }
}

export function createDefaultMotionBlurParameters(): MotionBlurParameters {
  return {
    angle: 0,
    distance: 20,
    steps: 8,
    shutterAngle: 180,
    enabled: true,
    opacity: 1.0,
    blendMode: BlendMode.NORMAL,
  }
}

/**
 * Validate blur parameters
 */
export function validateBlurParameters(
  params: Partial<
    GaussianBlurParameters | BoxBlurParameters | MotionBlurParameters
  >
): Result<GaussianBlurParameters | BoxBlurParameters | MotionBlurParameters> {
  const errors: string[] = []

  // Common validation
  if ('radius' in params && params.radius !== undefined) {
    if (params.radius < 0 || params.radius > 100) {
      errors.push('Radius must be between 0 and 100')
    }
  }

  if ('sigma' in params && params.sigma !== undefined) {
    if (params.sigma < 0 || params.sigma > 50) {
      errors.push('Sigma must be between 0 and 50')
    }
  }

  if ('iterations' in params && params.iterations !== undefined) {
    if (params.iterations < 1 || params.iterations > 10) {
      errors.push('Iterations must be between 1 and 10')
    }
  }

  if ('angle' in params && params.angle !== undefined) {
    if (params.angle < 0 || params.angle > 360) {
      errors.push('Angle must be between 0 and 360 degrees')
    }
  }

  if ('distance' in params && params.distance !== undefined) {
    if (params.distance < 0 || params.distance > 200) {
      errors.push('Distance must be between 0 and 200')
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_BLUR_PARAMETERS',
        message: errors.join('; '),
      },
    }
  }

  // Return validated parameters (simplified for now)
  return { success: true, data: params as any }
}
