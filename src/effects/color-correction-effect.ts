/**
 * @fileoverview Color Correction Effect Implementation
 * @description GPU-accelerated color correction effects (Brightness/Contrast, Levels, Curves)
 * @author @darianrosebrook
 */

import { Result } from '../types'
import { 
  BrightnessContrastParameters,
  LevelsParameters,
  CurvesParameters,
  BlendMode 
} from '../types/effects'
import { WebGPUContext } from '../core/renderer/webgpu-context'
import { logger } from '../core/logging/logger'

/**
 * Color correction uniforms structure
 */
interface ColorCorrectionUniforms {
  brightness: number
  contrast: number
  gamma: number
  inputBlack: number
  inputWhite: number
  outputBlack: number
  outputWhite: number
  redCurve: [number, number, number, number] // 4 control points
  greenCurve: [number, number, number, number]
  blueCurve: [number, number, number, number]
  masterCurve: [number, number, number, number]
  time: number
  padding: number
}

/**
 * Color correction effect renderer implementation
 */
export class ColorCorrectionEffectRenderer {
  private webgpuContext: WebGPUContext
  private brightnessContrastPipeline: GPUComputePipeline | null = null
  private levelsPipeline: GPUComputePipeline | null = null
  private curvesPipeline: GPUComputePipeline | null = null
  private uniformBuffer: GPUBuffer | null = null

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  /**
   * Initialize color correction effect pipelines
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for color correction effect',
          },
        }
      }

      // Create color correction shader module
      const shaderModule = device.createShaderModule({
        label: 'Color Correction Effect Shader',
        code: this.getColorCorrectionShaderCode(),
      })

      // Create bind group layout
      const bindGroupLayout = device.createBindGroupLayout({
        label: 'Color Correction Effect Bind Group Layout',
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
        label: 'Color Correction Effect Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout],
      })

      // Create compute pipelines for different color correction types
      this.brightnessContrastPipeline = device.createComputePipeline({
        label: 'Brightness/Contrast Pipeline',
        layout: pipelineLayout,
        compute: {
          module: shaderModule,
          entryPoint: 'brightnessContrast',
        },
      })

      this.levelsPipeline = device.createComputePipeline({
        label: 'Levels Pipeline',
        layout: pipelineLayout,
        compute: {
          module: shaderModule,
          entryPoint: 'levels',
        },
      })

      this.curvesPipeline = device.createComputePipeline({
        label: 'Curves Pipeline',
        layout: pipelineLayout,
        compute: {
          module: shaderModule,
          entryPoint: 'curves',
        },
      })

      // Create uniform buffer
      this.uniformBuffer = device.createBuffer({
        label: 'Color Correction Uniforms',
        size: 64, // 16 floats * 4 bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      logger.info('✅ Color correction effect initialized successfully')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COLOR_CORRECTION_INIT_ERROR',
          message: `Failed to initialize color correction effect: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Apply brightness/contrast effect
   */
  applyBrightnessContrast(
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    parameters: BrightnessContrastParameters,
    time: number
  ): Result<boolean> {
    return this.applyColorCorrection(
      inputTexture,
      outputTexture,
      parameters,
      time,
      'brightnessContrast'
    )
  }

  /**
   * Apply levels effect
   */
  applyLevels(
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    parameters: LevelsParameters,
    time: number
  ): Result<boolean> {
    return this.applyColorCorrection(
      inputTexture,
      outputTexture,
      parameters,
      time,
      'levels'
    )
  }

  /**
   * Apply curves effect
   */
  applyCurves(
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    parameters: CurvesParameters,
    time: number
  ): Result<boolean> {
    return this.applyColorCorrection(
      inputTexture,
      outputTexture,
      parameters,
      time,
      'curves'
    )
  }

  /**
   * Core color correction application method
   */
  private applyColorCorrection(
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    parameters: BrightnessContrastParameters | LevelsParameters | CurvesParameters,
    time: number,
    correctionType: 'brightnessContrast' | 'levels' | 'curves'
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

      const pipeline = this.getPipeline(correctionType)
      if (!pipeline) {
        return {
          success: false,
          error: {
            code: 'PIPELINE_NOT_INITIALIZED',
            message: `${correctionType} pipeline not initialized`,
          },
        }
      }

      // Update uniforms based on correction type
      const uniforms = this.createUniforms(parameters, time, correctionType)
      const uniformData = new Float32Array([
        uniforms.brightness,
        uniforms.contrast,
        uniforms.gamma,
        uniforms.inputBlack,
        uniforms.inputWhite,
        uniforms.outputBlack,
        uniforms.outputWhite,
        uniforms.redCurve[0], uniforms.redCurve[1], uniforms.redCurve[2], uniforms.redCurve[3],
        uniforms.greenCurve[0], uniforms.greenCurve[1], uniforms.greenCurve[2], uniforms.greenCurve[3],
        uniforms.blueCurve[0], uniforms.blueCurve[1], uniforms.blueCurve[2], uniforms.blueCurve[3],
        uniforms.masterCurve[0], uniforms.masterCurve[1], uniforms.masterCurve[2], uniforms.masterCurve[3],
        uniforms.time,
        uniforms.padding,
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
        label: `${correctionType} Commands`,
      })

      // Create bind group
      const bindGroup = device.createBindGroup({
        label: `${correctionType} Bind Group`,
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
        label: `${correctionType} Pass`,
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
          code: 'COLOR_CORRECTION_APPLY_ERROR',
          message: `Failed to apply ${correctionType}: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get appropriate pipeline for correction type
   */
  private getPipeline(correctionType: string): GPUComputePipeline | null {
    switch (correctionType) {
      case 'brightnessContrast':
        return this.brightnessContrastPipeline
      case 'levels':
        return this.levelsPipeline
      case 'curves':
        return this.curvesPipeline
      default:
        return null
    }
  }

  /**
   * Create uniforms based on parameters and correction type
   */
  private createUniforms(
    parameters: BrightnessContrastParameters | LevelsParameters | CurvesParameters,
    time: number,
    correctionType: string
  ): ColorCorrectionUniforms {
    const baseUniforms: ColorCorrectionUniforms = {
      brightness: 0,
      contrast: 1,
      gamma: 1,
      inputBlack: 0,
      inputWhite: 1,
      outputBlack: 0,
      outputWhite: 1,
      redCurve: [0, 0, 1, 1],
      greenCurve: [0, 0, 1, 1],
      blueCurve: [0, 0, 1, 1],
      masterCurve: [0, 0, 1, 1],
      time,
      padding: 0,
    }

    switch (correctionType) {
      case 'brightnessContrast':
        const bcParams = parameters as BrightnessContrastParameters
        baseUniforms.brightness = bcParams.brightness
        baseUniforms.contrast = bcParams.contrast
        break

      case 'levels':
        const levelsParams = parameters as LevelsParameters
        baseUniforms.inputBlack = levelsParams.inputBlack
        baseUniforms.inputWhite = levelsParams.inputWhite
        baseUniforms.outputBlack = levelsParams.outputBlack
        baseUniforms.outputWhite = levelsParams.outputWhite
        baseUniforms.gamma = levelsParams.gamma
        break

      case 'curves':
        const curvesParams = parameters as CurvesParameters
        // Convert curve points to uniform format (simplified to 4 points)
        baseUniforms.redCurve = this.convertCurvePoints(curvesParams.redCurve)
        baseUniforms.greenCurve = this.convertCurvePoints(curvesParams.greenCurve)
        baseUniforms.blueCurve = this.convertCurvePoints(curvesParams.blueCurve)
        if (curvesParams.masterCurve) {
          baseUniforms.masterCurve = this.convertCurvePoints(curvesParams.masterCurve)
        }
        break
    }

    return baseUniforms
  }

  /**
   * Convert curve points to uniform format
   */
  private convertCurvePoints(curvePoints: Array<{ input: number; output: number }>): [number, number, number, number] {
    // Simplified conversion - take first 4 points or interpolate
    if (curvePoints.length >= 4) {
      return [
        curvePoints[0].input, curvePoints[0].output,
        curvePoints[1].input, curvePoints[1].output,
      ]
    } else if (curvePoints.length >= 2) {
      return [
        curvePoints[0].input, curvePoints[0].output,
        curvePoints[1].input, curvePoints[1].output,
      ]
    } else {
      return [0, 0, 1, 1] // Default linear curve
    }
  }

  /**
   * Get color correction shader code
   */
  private getColorCorrectionShaderCode(): string {
    return `
      struct ColorCorrectionUniforms {
        brightness: f32,
        contrast: f32,
        gamma: f32,
        inputBlack: f32,
        inputWhite: f32,
        outputBlack: f32,
        outputWhite: f32,
        redCurve: vec4<f32>,
        greenCurve: vec4<f32>,
        blueCurve: vec4<f32>,
        masterCurve: vec4<f32>,
        time: f32,
        padding: f32,
      }

      @group(0) @binding(0) var<uniform> uniforms: ColorCorrectionUniforms;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(0) @binding(3) var linearSampler: sampler;

      fn applyBrightnessContrast(color: vec4<f32>) -> vec4<f32> {
        // Apply brightness (additive)
        var result = color + vec4<f32>(uniforms.brightness, uniforms.brightness, uniforms.brightness, 0.0);
        
        // Apply contrast (multiplicative around 0.5)
        result = (result - 0.5) * uniforms.contrast + 0.5;
        
        return clamp(result, vec4<f32>(0.0), vec4<f32>(1.0));
      }

      fn applyLevels(color: vec4<f32>) -> vec4<f32> {
        // Input levels adjustment
        var result = (color - uniforms.inputBlack) / (uniforms.inputWhite - uniforms.inputBlack);
        
        // Gamma correction
        result = pow(result, vec4<f32>(1.0 / uniforms.gamma));
        
        // Output levels adjustment
        result = result * (uniforms.outputWhite - uniforms.outputBlack) + uniforms.outputBlack;
        
        return clamp(result, vec4<f32>(0.0), vec4<f32>(1.0));
      }

      fn applyCurves(color: vec4<f32>) -> vec4<f32> {
        // Simplified curve application using linear interpolation
        var result = color;
        
        // Apply red curve
        let red = result.r;
        let redCurve = mix(
          mix(uniforms.redCurve.y, uniforms.redCurve.w, smoothstep(uniforms.redCurve.x, uniforms.redCurve.z, red)),
          red,
          0.5 // Blend factor
        );
        result.r = redCurve;
        
        // Apply green curve
        let green = result.g;
        let greenCurve = mix(
          mix(uniforms.greenCurve.y, uniforms.greenCurve.w, smoothstep(uniforms.greenCurve.x, uniforms.greenCurve.z, green)),
          green,
          0.5
        );
        result.g = greenCurve;
        
        // Apply blue curve
        let blue = result.b;
        let blueCurve = mix(
          mix(uniforms.blueCurve.y, uniforms.blueCurve.w, smoothstep(uniforms.blueCurve.x, uniforms.blueCurve.z, blue)),
          blue,
          0.5
        );
        result.b = blueCurve;
        
        // Apply master curve
        let master = (result.r + result.g + result.b) / 3.0;
        let masterCurve = mix(
          mix(uniforms.masterCurve.y, uniforms.masterCurve.w, smoothstep(uniforms.masterCurve.x, uniforms.masterCurve.z, master)),
          master,
          0.5
        );
        let masterFactor = masterCurve / max(master, 0.001);
        result.rgb *= masterFactor;
        
        return clamp(result, vec4<f32>(0.0), vec4<f32>(1.0));
      }

      @compute @workgroup_size(8, 8)
      fn brightnessContrast(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(f32(id.x), f32(id.y));
        let uv = coord / vec2<f32>(textureDimensions(inputTexture));
        
        if (coord.x >= f32(textureDimensions(inputTexture).x) || coord.y >= f32(textureDimensions(inputTexture).y)) {
          return;
        }
        
        let originalColor = textureSampleLevel(inputTexture, linearSampler, uv, 0.0);
        let correctedColor = applyBrightnessContrast(originalColor);
        
        textureStore(outputTexture, vec2<i32>(id.xy), correctedColor);
      }

      @compute @workgroup_size(8, 8)
      fn levels(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(f32(id.x), f32(id.y));
        let uv = coord / vec2<f32>(textureDimensions(inputTexture));
        
        if (coord.x >= f32(textureDimensions(inputTexture).x) || coord.y >= f32(textureDimensions(inputTexture).y)) {
          return;
        }
        
        let originalColor = textureSampleLevel(inputTexture, linearSampler, uv, 0.0);
        let correctedColor = applyLevels(originalColor);
        
        textureStore(outputTexture, vec2<i32>(id.xy), correctedColor);
      }

      @compute @workgroup_size(8, 8)
      fn curves(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(f32(id.x), f32(id.y));
        let uv = coord / vec2<f32>(textureDimensions(inputTexture));
        
        if (coord.x >= f32(textureDimensions(inputTexture).x) || coord.y >= f32(textureDimensions(inputTexture).y)) {
          return;
        }
        
        let originalColor = textureSampleLevel(inputTexture, linearSampler, uv, 0.0);
        let correctedColor = applyCurves(originalColor);
        
        textureStore(outputTexture, vec2<i32>(id.xy), correctedColor);
      }
    `
  }

  /**
   * Destroy resources
   */
  destroy(): void {
    this.uniformBuffer?.destroy()
    this.uniformBuffer = null
    this.brightnessContrastPipeline = null
    this.levelsPipeline = null
    this.curvesPipeline = null
  }
}

/**
 * Create default color correction parameters
 */
export function createDefaultBrightnessContrastParameters(): BrightnessContrastParameters {
  return {
    brightness: 0,
    contrast: 1,
    enabled: true,
    opacity: 1.0,
    blendMode: BlendMode.NORMAL,
  }
}

export function createDefaultLevelsParameters(): LevelsParameters {
  return {
    inputBlack: 0,
    inputWhite: 1,
    outputBlack: 0,
    outputWhite: 1,
    gamma: 1,
    enabled: true,
    opacity: 1.0,
    blendMode: BlendMode.NORMAL,
  }
}

export function createDefaultCurvesParameters(): CurvesParameters {
  return {
    redCurve: [{ input: 0, output: 0 }, { input: 1, output: 1 }],
    greenCurve: [{ input: 0, output: 0 }, { input: 1, output: 1 }],
    blueCurve: [{ input: 0, output: 0 }, { input: 1, output: 1 }],
    enabled: true,
    opacity: 1.0,
    blendMode: BlendMode.NORMAL,
  }
}

/**
 * Validate color correction parameters
 */
export function validateColorCorrectionParameters(
  params: Partial<BrightnessContrastParameters | LevelsParameters | CurvesParameters>
): Result<BrightnessContrastParameters | LevelsParameters | CurvesParameters> {
  const errors: string[] = []

  // Common validation
  if ('brightness' in params && params.brightness !== undefined) {
    if (params.brightness < -1 || params.brightness > 1) {
      errors.push('Brightness must be between -1 and 1')
    }
  }

  if ('contrast' in params && params.contrast !== undefined) {
    if (params.contrast < 0 || params.contrast > 2) {
      errors.push('Contrast must be between 0 and 2')
    }
  }

  if ('gamma' in params && params.gamma !== undefined) {
    if (params.gamma < 0.1 || params.gamma > 5) {
      errors.push('Gamma must be between 0.1 and 5')
    }
  }

  if ('inputBlack' in params && params.inputBlack !== undefined) {
    if (params.inputBlack < 0 || params.inputBlack > 1) {
      errors.push('Input black must be between 0 and 1')
    }
  }

  if ('inputWhite' in params && params.inputWhite !== undefined) {
    if (params.inputWhite < 0 || params.inputWhite > 1) {
      errors.push('Input white must be between 0 and 1')
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_COLOR_CORRECTION_PARAMETERS',
        message: errors.join('; '),
      },
    }
  }

  return { success: true, data: params as any }
}
