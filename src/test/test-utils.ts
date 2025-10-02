/**
 * @fileoverview Test Utilities
 * @description Utility functions and helpers for reliable testing
 * @author @darianrosebrook
 */

import { vi } from 'vitest'

/**
 * Creates a simplified WebGPU device mock for testing
 */
export function createMockGPUDevice() {
  return {
    createBuffer: vi.fn(() => ({ destroy: vi.fn() })),
    createTexture: vi.fn(() => ({
      createView: vi.fn(() => ({})),
      width: 1920,
      height: 1080,
      format: 'rgba8unorm',
      destroy: vi.fn(),
    })),
    createSampler: vi.fn(() => ({})),
    createShaderModule: vi.fn(() => ({})),
    createBindGroupLayout: vi.fn(() => ({})),
    createPipelineLayout: vi.fn(() => ({ bindGroupLayouts: [] })),
    createComputePipeline: vi.fn(() => ({
      getBindGroupLayout: vi.fn(() => ({})),
    })),
    createRenderPipeline: vi.fn(() => ({})),
    createCommandEncoder: vi.fn(() => ({
      beginComputePass: vi.fn(() => ({
        setPipeline: vi.fn(),
        setBindGroup: vi.fn(),
        dispatchWorkgroups: vi.fn(),
        end: vi.fn(),
      })),
      beginRenderPass: vi.fn(() => ({
        setPipeline: vi.fn(),
        setVertexBuffer: vi.fn(),
        draw: vi.fn(),
        end: vi.fn(),
      })),
      finish: vi.fn(() => ({})),
    })),
    queue: {
      writeBuffer: vi.fn(),
      submit: vi.fn(),
    },
  }
}

/**
 * Creates a simplified WebGPU context mock for testing
 */
export function createMockWebGPUContext() {
  const mockDevice = createMockGPUDevice()

  return {
    getDevice: vi.fn(() => mockDevice),
    isWebGPUSupported: vi.fn(() => true),
    getAdapterInfo: vi.fn(() => ({ vendor: 'Mock', architecture: 'Mock' })),
    initialize: vi.fn(() => Promise.resolve({ success: true, data: true })),
    getContext: vi.fn(() => null),
    getCanvas: vi.fn(() => null),
    getFormat: vi.fn(() => 'bgra8unorm'),
    createBuffer: vi.fn(() => null),
    createTexture: vi.fn(() => null),
    createSampler: vi.fn(() => null),
    createRenderPipeline: vi.fn(() => null),
    createBindGroupLayout: vi.fn(() => null),
    createBindGroup: vi.fn(() => null),
    createCommandEncoder: vi.fn(() => null),
    submitCommands: vi.fn(),
    resize: vi.fn(),
    getSize: vi.fn(() => ({ width: 1920, height: 1080 })),
    getAspectRatio: vi.fn(() => 1.777),
    getResolution: vi.fn(() => ({ width: 1920, height: 1080 })),
    destroy: vi.fn(),
  } as any
}

/**
 * Creates a mock timeline for testing
 */
export function createMockTimeline() {
  return {
    id: 'test-timeline',
    name: 'Test Timeline',
    duration: 1000,
    frameRate: 30,
    tracks: [],
    markers: [],
    currentTime: 0,
    isPlaying: false,
    playbackSpeed: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    addKeyframe: vi.fn(),
    removeKeyframe: vi.fn(),
    getTrack: vi.fn(),
    evaluate: vi.fn(() => ({ success: true, data: new Map() })),
  } as any
}

/**
 * Creates a mock effects system for testing
 */
export function createMockEffectsSystem() {
  return {
    getEffect: vi.fn(),
    updateEffectParameters: vi.fn(),
    createEffect: vi.fn(),
    getEffectTypes: vi.fn(() => []),
    registerEffectType: vi.fn(),
    unregisterEffectType: vi.fn(),
    initialize: vi.fn(() => Promise.resolve({ success: true, data: true })),
    destroy: vi.fn(),
  } as any
}

/**
 * Waits for a promise with a timeout to prevent hanging tests
 */
export async function waitForPromise<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Promise timed out after ${timeoutMs}ms`)),
      timeoutMs
    )
  })

  return Promise.race([promise, timeoutPromise])
}

/**
 * Creates a test timeout helper to prevent hanging tests
 */
export function withTimeout<T>(
  fn: () => T | Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  return waitForPromise(Promise.resolve(fn()), timeoutMs)
}

/**
 * Clears all mocks and resets test state
 */
export function resetAllMocks() {
  vi.clearAllMocks()
  vi.resetAllMocks()
  vi.restoreAllMocks()
}

/**
 * Creates a test error boundary for catching and handling test errors
 */
export function createTestErrorBoundary() {
  let error: Error | null = null

  const captureError = (err: Error) => {
    error = err
  }

  const throwIfError = () => {
    if (error) {
      throw error
    }
  }

  const reset = () => {
    error = null
  }

  return {
    captureError,
    throwIfError,
    reset,
    hasError: () => error !== null,
    getError: () => error,
  }
}

/**
 * Creates a mock console to capture console output in tests
 */
export function createMockConsole() {
  const logs: string[] = []
  const errors: string[] = []
  const warnings: string[] = []

  const mockConsole = {
    log: vi.fn((...args: any[]) => {
      logs.push(args.join(' '))
    }),
    error: vi.fn((...args: any[]) => {
      errors.push(args.join(' '))
    }),
    warn: vi.fn((...args: any[]) => {
      warnings.push(args.join(' '))
    }),
    info: vi.fn((...args: any[]) => {
      logs.push(args.join(' '))
    }),
    debug: vi.fn((...args: any[]) => {
      logs.push(args.join(' '))
    }),
  }

  return {
    console: mockConsole,
    getLogs: () => [...logs],
    getErrors: () => [...errors],
    getWarnings: () => [...warnings],
    clear: () => {
      logs.length = 0
      errors.length = 0
      warnings.length = 0
    },
  }
}
