/**
 * @fileoverview Blur Effect Tests
 * @description Comprehensive unit tests for blur effect implementation
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  BlurEffectRenderer,
  createDefaultGaussianBlurParameters,
  createDefaultBoxBlurParameters,
  createDefaultMotionBlurParameters,
  validateBlurParameters,
} from '../src/effects/blur-effect'
import { WebGPUContext } from '../src/core/renderer/webgpu-context'
import {
  GaussianBlurParameters,
  BoxBlurParameters,
  MotionBlurParameters,
  BlendMode,
} from '../src/types/effects'

// Mock WebGPU objects
const mockGPUTexture = {
  createView: vi.fn(() => ({})),
  width: 1920,
  height: 1080,
  format: 'rgba8unorm',
  destroy: vi.fn(),
}

const mockGPUDevice = {
  createBuffer: vi.fn(() => ({})),
  createTexture: vi.fn(() => mockGPUTexture),
  createSampler: vi.fn(() => ({})),
  createShaderModule: vi.fn(() => ({})),
  createBindGroupLayout: vi.fn(() => ({})),
  createPipelineLayout: vi.fn(() => ({})),
  createComputePipeline: vi.fn(() => ({
    getBindGroupLayout: vi.fn(() => ({})),
  })),
  createCommandEncoder: vi.fn(() => ({
    beginComputePass: vi.fn(() => ({
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      dispatchWorkgroups: vi.fn(),
      end: vi.fn(),
    })),
    finish: vi.fn(() => ({})),
  })),
  queue: {
    writeBuffer: vi.fn(),
    submit: vi.fn(),
  },
}

const mockWebGPUContext = {
  getDevice: vi.fn(() => mockGPUDevice),
} as unknown as WebGPUContext

describe('BlurEffectRenderer', () => {
  let blurEffect: BlurEffectRenderer
  let mockGaussianParams: GaussianBlurParameters
  let mockBoxParams: BoxBlurParameters
  let mockMotionParams: MotionBlurParameters

  beforeEach(() => {
    blurEffect = new BlurEffectRenderer(mockWebGPUContext)

    mockGaussianParams = {
      radius: 10,
      sigma: 3.33,
      quality: 'medium',
      enabled: true,
      opacity: 1.0,
      blendMode: BlendMode.NORMAL,
    }

    mockBoxParams = {
      radius: 5,
      iterations: 1,
      enabled: true,
      opacity: 1.0,
      blendMode: BlendMode.NORMAL,
    }

    mockMotionParams = {
      angle: 45,
      distance: 20,
      steps: 8,
      shutterAngle: 180,
      enabled: true,
      opacity: 1.0,
      blendMode: BlendMode.NORMAL,
    }

    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize successfully with valid WebGPU context', async () => {
      const result = await blurEffect.initialize()

      expect(result.success).toBe(true)
      expect(mockGPUDevice.createShaderModule).toHaveBeenCalled()
      expect(mockGPUDevice.createBindGroupLayout).toHaveBeenCalled()
      expect(mockGPUDevice.createComputePipeline).toHaveBeenCalledTimes(3) // Gaussian, Box, Motion
      expect(mockGPUDevice.createBuffer).toHaveBeenCalled()
    })

    it('should fail initialization without WebGPU device', async () => {
      mockWebGPUContext.getDevice = vi.fn(() => null)

      const result = await blurEffect.initialize()

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('WEBGPU_DEVICE_NOT_FOUND')
    })

    it('should handle initialization errors gracefully', async () => {
      mockGPUDevice.createShaderModule = vi.fn(() => {
        throw new Error('Shader compilation failed')
      })

      const result = await blurEffect.initialize()

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('BLUR_INIT_ERROR')
      expect(result.error?.message).toContain('Shader compilation failed')
    })
  })

  describe('Gaussian Blur', () => {
    it('should apply Gaussian blur successfully', async () => {
      await blurEffect.initialize()

      const result = blurEffect.applyGaussianBlur(
        mockGPUTexture as GPUTexture,
        mockGPUTexture as GPUTexture,
        mockGaussianParams,
        1000
      )

      expect(result.success).toBe(true)
      expect(mockGPUDevice.queue.writeBuffer).toHaveBeenCalled()
      expect(mockGPUDevice.queue.submit).toHaveBeenCalled()
    })

    it('should handle missing pipeline gracefully', () => {
      const result = blurEffect.applyGaussianBlur(
        mockGPUTexture as GPUTexture,
        mockGPUTexture as GPUTexture,
        mockGaussianParams,
        1000
      )

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('PIPELINE_NOT_INITIALIZED')
    })

    it('should validate Gaussian blur parameters', () => {
      const invalidParams = {
        ...mockGaussianParams,
        radius: -5, // Invalid radius
      }

      const result = blurEffect.applyGaussianBlur(
        mockGPUTexture as GPUTexture,
        mockGPUTexture as GPUTexture,
        invalidParams,
        1000
      )

      // Should still apply but with clamped values
      expect(result.success).toBe(true)
    })
  })

  describe('Box Blur', () => {
    it('should apply box blur successfully', async () => {
      await blurEffect.initialize()

      const result = blurEffect.applyBoxBlur(
        mockGPUTexture as GPUTexture,
        mockGPUTexture as GPUTexture,
        mockBoxParams,
        1000
      )

      expect(result.success).toBe(true)
      expect(mockGPUDevice.queue.writeBuffer).toHaveBeenCalled()
    })

    it('should handle multiple iterations', async () => {
      await blurEffect.initialize()

      const multiIterParams = {
        ...mockBoxParams,
        iterations: 3,
      }

      const result = blurEffect.applyBoxBlur(
        mockGPUTexture as GPUTexture,
        mockGPUTexture as GPUTexture,
        multiIterParams,
        1000
      )

      expect(result.success).toBe(true)
    })
  })

  describe('Motion Blur', () => {
    it('should apply motion blur successfully', async () => {
      await blurEffect.initialize()

      const result = blurEffect.applyMotionBlur(
        mockGPUTexture as GPUTexture,
        mockGPUTexture as GPUTexture,
        mockMotionParams,
        1000
      )

      expect(result.success).toBe(true)
      expect(mockGPUDevice.queue.writeBuffer).toHaveBeenCalled()
    })

    it('should handle different motion angles', async () => {
      await blurEffect.initialize()

      const angleParams = [
        { ...mockMotionParams, angle: 0 },
        { ...mockMotionParams, angle: 90 },
        { ...mockMotionParams, angle: 180 },
        { ...mockMotionParams, angle: 270 },
      ]

      for (const params of angleParams) {
        const result = blurEffect.applyMotionBlur(
          mockGPUTexture as GPUTexture,
          mockGPUTexture as GPUTexture,
          params,
          1000
        )
        expect(result.success).toBe(true)
      }
    })

    it('should handle different step counts', async () => {
      await blurEffect.initialize()

      const stepParams = [
        { ...mockMotionParams, steps: 4 },
        { ...mockMotionParams, steps: 8 },
        { ...mockMotionParams, steps: 16 },
        { ...mockMotionParams, steps: 32 },
      ]

      for (const params of stepParams) {
        const result = blurEffect.applyMotionBlur(
          mockGPUTexture as GPUTexture,
          mockGPUTexture as GPUTexture,
          params,
          1000
        )
        expect(result.success).toBe(true)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle WebGPU device errors during application', async () => {
      await blurEffect.initialize()
      mockWebGPUContext.getDevice = vi.fn(() => null)

      const result = blurEffect.applyGaussianBlur(
        mockGPUTexture as GPUTexture,
        mockGPUTexture as GPUTexture,
        mockGaussianParams,
        1000
      )

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('WEBGPU_DEVICE_NOT_FOUND')
    })

    it('should handle texture size mismatches', async () => {
      await blurEffect.initialize()

      const smallTexture = {
        ...mockGPUTexture,
        width: 100,
        height: 100,
      }

      const result = blurEffect.applyGaussianBlur(
        smallTexture as GPUTexture,
        mockGPUTexture as GPUTexture,
        mockGaussianParams,
        1000
      )

      expect(result.success).toBe(true)
      // Should create new intermediate texture for different size
    })
  })

  describe('Resource Management', () => {
    it('should destroy resources properly', async () => {
      await blurEffect.initialize()

      blurEffect.destroy()

      expect(mockGPUTexture.destroy).toHaveBeenCalled()
    })

    it('should handle destroy when not initialized', () => {
      expect(() => blurEffect.destroy()).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should handle large textures efficiently', async () => {
      await blurEffect.initialize()

      const largeTexture = {
        ...mockGPUTexture,
        width: 3840,
        height: 2160, // 4K resolution
      }

      const result = blurEffect.applyGaussianBlur(
        largeTexture as GPUTexture,
        largeTexture as GPUTexture,
        mockGaussianParams,
        1000
      )

      expect(result.success).toBe(true)
      // Should calculate appropriate workgroup sizes
    })

    it('should optimize workgroup dispatch', async () => {
      await blurEffect.initialize()

      const result = blurEffect.applyGaussianBlur(
        mockGPUTexture as GPUTexture,
        mockGPUTexture as GPUTexture,
        mockGaussianParams,
        1000
      )

      expect(result.success).toBe(true)

      // Verify workgroup calculation
      const expectedWorkgroupsX = Math.ceil(1920 / 8) // 240
      const expectedWorkgroupsY = Math.ceil(1080 / 8) // 135

      // The dispatchWorkgroups should be called with these values
      const computePass = mockGPUDevice
        .createCommandEncoder()
        .beginComputePass()
      expect(computePass.dispatchWorkgroups).toHaveBeenCalledWith(
        expectedWorkgroupsX,
        expectedWorkgroupsY
      )
    })
  })

  describe('Parameter Validation', () => {
    it('should handle edge case parameters', async () => {
      await blurEffect.initialize()

      const edgeCases = [
        { ...mockGaussianParams, radius: 0 }, // Minimum radius
        { ...mockGaussianParams, radius: 100 }, // Maximum radius
        { ...mockGaussianParams, sigma: 0.1 }, // Very small sigma
        { ...mockGaussianParams, sigma: 50 }, // Large sigma
      ]

      for (const params of edgeCases) {
        const result = blurEffect.applyGaussianBlur(
          mockGPUTexture as GPUTexture,
          mockGPUTexture as GPUTexture,
          params,
          1000
        )
        expect(result.success).toBe(true)
      }
    })

    it('should handle missing optional parameters', async () => {
      await blurEffect.initialize()

      const paramsWithoutSigma = {
        radius: 10,
        quality: 'medium' as const,
        enabled: true,
        opacity: 1.0,
        blendMode: BlendMode.NORMAL,
      }

      const result = blurEffect.applyGaussianBlur(
        mockGPUTexture as GPUTexture,
        mockGPUTexture as GPUTexture,
        paramsWithoutSigma,
        1000
      )

      expect(result.success).toBe(true)
      // Should auto-calculate sigma as radius / 3.0
    })
  })
})

describe('Blur Effect Utilities', () => {
  describe('Default Parameters', () => {
    it('should create valid default Gaussian blur parameters', () => {
      const params = createDefaultGaussianBlurParameters()

      expect(params.radius).toBe(10)
      expect(params.sigma).toBe(3.33)
      expect(params.quality).toBe('medium')
      expect(params.enabled).toBe(true)
      expect(params.opacity).toBe(1.0)
    })

    it('should create valid default box blur parameters', () => {
      const params = createDefaultBoxBlurParameters()

      expect(params.radius).toBe(5)
      expect(params.iterations).toBe(1)
      expect(params.enabled).toBe(true)
    })

    it('should create valid default motion blur parameters', () => {
      const params = createDefaultMotionBlurParameters()

      expect(params.angle).toBe(0)
      expect(params.distance).toBe(20)
      expect(params.steps).toBe(8)
      expect(params.shutterAngle).toBe(180)
    })
  })

  describe('Parameter Validation', () => {
    it('should validate blur parameters correctly', () => {
      // Valid parameters
      const validParams = { radius: 10, sigma: 3.33 }
      const validResult = validateBlurParameters(validParams)
      expect(validResult.success).toBe(true)

      // Invalid radius
      const invalidRadius = { radius: -5 }
      const invalidResult = validateBlurParameters(invalidRadius)
      expect(invalidResult.success).toBe(false)
      expect(invalidResult.error?.message).toContain(
        'Radius must be between 0 and 100'
      )

      // Invalid sigma
      const invalidSigma = { sigma: 100 }
      const invalidSigmaResult = validateBlurParameters(invalidSigma)
      expect(invalidSigmaResult.success).toBe(false)
      expect(invalidSigmaResult.error?.message).toContain(
        'Sigma must be between 0 and 50'
      )
    })
  })
})
