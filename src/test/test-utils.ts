import { logger } from '@/core/logging/logger'
/**
 * @fileoverview Test Utilities for Comprehensive Testing
 * @author @darianrosebrook
 */

/**
 * Test utilities for performance monitoring and validation
 */
export class TestUtils {
  /**
   * Measure execution time of async function
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = performance.now()
    const result = await fn()
    const executionTime = performance.now() - startTime

    return { result, executionTime }
  }

  /**
   * Measure memory usage
   */
  static measureMemoryUsage(): number {
    // Use performance.memory if available, otherwise estimate
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024) // MB
    }

    // Fallback estimation
    return 0
  }

  /**
   * Create cross-platform test scene for GPU compatibility testing
   */
  static createCrossPlatformTestScene(): any {
    return {
      layers: [
        {
          id: 'platform-test-rect',
          type: 'rectangle',
          position: { x: 100, y: 100 },
          size: { width: 200, height: 150 },
          fill: { r: 0.8, g: 0.2, b: 0.3, a: 1.0 },
        },
        {
          id: 'platform-test-circle',
          type: 'circle',
          position: { x: 400, y: 200 },
          radius: 75,
          fill: { r: 0.2, g: 0.8, b: 0.9, a: 0.8 },
        },
        {
          id: 'platform-test-text',
          type: 'text',
          position: { x: 50, y: 400 },
          text: 'Cross-Platform Test',
          fontSize: 32,
          fill: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        },
      ],
      effects: [
        {
          type: 'glow',
          intensity: 1.0,
          radius: 10,
          color: { r: 1.0, g: 0.8, b: 0.2, a: 1.0 },
        },
      ],
      resolution: { width: 800, height: 600 },
      frameRate: 30,
      platformTargets: ['nvidia', 'amd', 'intel', 'apple'],
    }
  }

  /**
   * Create scene with multiple effects for performance testing
   */
  static createSceneWithMultipleEffects(effectCount: number = 5): any {
    const effects = []
    const effectTypes = [
      'glow',
      'blur',
      'color-correction',
      'motion-blur',
      'sharpen',
    ]

    for (let i = 0; i < effectCount; i++) {
      effects.push({
        type: effectTypes[i % effectTypes.length],
        intensity: 0.5 + Math.random() * 1.0,
        radius: i === 0 ? 15 : 5 + Math.random() * 10, // Glow effect gets larger radius
        samples: i === 3 ? 8 : 4, // Motion blur gets more samples
      })
    }

    return {
      layers: [
        {
          id: 'multi-effect-layer',
          type: 'rectangle',
          position: { x: 400, y: 300 },
          size: { width: 300, height: 200 },
          fill: { r: 0.6, g: 0.4, b: 0.8, a: 1.0 },
          effects,
        },
      ],
      resolution: { width: 1920, height: 1080 },
      frameRate: 60,
    }
  }

  /**
   * Create test scene with multiple effects (alias for createSceneWithMultipleEffects)
   */
  static createTestSceneWithMultipleEffects(effectCount: number = 5): any {
    return this.createSceneWithMultipleEffects(effectCount)
  }

  /**
   * Create scene with effects for basic testing
   */
  static createSceneWithEffects(): any {
    return {
      layers: [
        {
          id: 'effect-test-layer',
          type: 'rectangle',
          position: { x: 500, y: 400 },
          size: { width: 200, height: 100 },
          fill: { r: 0.9, g: 0.3, b: 0.1, a: 1.0 },
          effects: [
            {
              type: 'glow',
              intensity: 1.2,
              radius: 12,
            },
            {
              type: 'blur',
              intensity: 0.8,
              radius: 6,
            },
          ],
        },
      ],
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
    }
  }

  /**
   * Create scene with disposable effects for cleanup testing
   */
  static createSceneWithDisposableEffects(): any {
    return {
      layers: [
        {
          id: 'disposable-layer',
          type: 'circle',
          position: { x: 300, y: 200 },
          radius: 80,
          fill: { r: 0.4, g: 0.7, b: 0.9, a: 1.0 },
          effects: [
            {
              type: 'glow',
              intensity: 1.0,
              radius: 8,
            },
          ],
        },
      ],
      resolution: { width: 800, height: 600 },
      frameRate: 30,
    }
  }

  /**
   * Create scene with repeated effects for caching testing
   */
  static createSceneWithRepeatedEffects(): any {
    return {
      layers: [
        {
          id: 'repeated-layer-1',
          type: 'rectangle',
          position: { x: 200, y: 150 },
          size: { width: 150, height: 100 },
          fill: { r: 0.8, g: 0.5, b: 0.2, a: 1.0 },
          effects: [
            {
              type: 'glow',
              intensity: 1.0,
              radius: 10,
            },
          ],
        },
        {
          id: 'repeated-layer-2',
          type: 'rectangle',
          position: { x: 500, y: 150 },
          size: { width: 150, height: 100 },
          fill: { r: 0.2, g: 0.8, b: 0.5, a: 1.0 },
          effects: [
            {
              type: 'glow',
              intensity: 1.0,
              radius: 10,
            },
          ],
        },
      ],
      resolution: { width: 800, height: 600 },
      frameRate: 30,
    }
  }

  /**
   * Create scene with animated effects for parameter testing
   */
  static createSceneWithAnimatedEffects(): any {
    return {
      layers: [
        {
          id: 'animated-layer',
          type: 'circle',
          position: { x: 400, y: 300 },
          radius: 60,
          fill: { r: 0.9, g: 0.6, b: 0.3, a: 1.0 },
          effects: [
            {
              type: 'glow',
              intensity: 1.0,
              radius: 15,
            },
          ],
        },
      ],
      resolution: { width: 800, height: 600 },
      frameRate: 30,
    }
  }

  /**
   * Create scene with resource-intensive effects for memory testing
   */
  static createSceneWithResourceIntensiveEffects(): any {
    const effects = []
    for (let i = 0; i < 8; i++) {
      effects.push({
        type: i % 2 === 0 ? 'glow' : 'blur',
        intensity: 1.0 + Math.random() * 1.5,
        radius: 10 + Math.random() * 25,
      })
    }

    return {
      layers: [
        {
          id: 'resource-intensive-layer',
          type: 'rectangle',
          position: { x: 100, y: 100 },
          size: { width: 600, height: 400 },
          fill: { r: 0.7, g: 0.3, b: 0.8, a: 1.0 },
          effects,
        },
      ],
      resolution: { width: 1920, height: 1080 },
      frameRate: 60,
    }
  }

  /**
   * Create scene for batch testing
   */
  static createSceneWithBatchTest(): any {
    const layers = []
    for (let i = 0; i < 10; i++) {
      layers.push({
        id: `batch-layer-${i}`,
        type: i % 2 === 0 ? 'rectangle' : 'circle',
        position: {
          x: 100 + (i % 5) * 150,
          y: 100 + Math.floor(i / 5) * 150,
        },
        size: i % 2 === 0 ? { width: 100, height: 100 } : undefined,
        radius: i % 2 === 1 ? 50 : undefined,
        fill: {
          r: 0.2 + Math.random() * 0.8,
          g: 0.2 + Math.random() * 0.8,
          b: 0.2 + Math.random() * 0.8,
          a: 0.8 + Math.random() * 0.2,
        },
      })
    }

    return {
      layers,
      resolution: { width: 800, height: 600 },
      frameRate: 30,
    }
  }

  /**
   * Create scene for render order testing
   */
  static createSceneWithRenderOrderTest(): any {
    return {
      layers: [
        {
          id: 'background-layer',
          type: 'rectangle',
          position: { x: 0, y: 0 },
          size: { width: 800, height: 600 },
          fill: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          zIndex: 0,
        },
        {
          id: 'middle-layer',
          type: 'circle',
          position: { x: 400, y: 300 },
          radius: 100,
          fill: { r: 0.5, g: 0.8, b: 0.3, a: 0.9 },
          zIndex: 1,
        },
        {
          id: 'top-layer',
          type: 'rectangle',
          position: { x: 350, y: 250 },
          size: { width: 100, height: 100 },
          fill: { r: 0.9, g: 0.2, b: 0.4, a: 0.8 },
          zIndex: 2,
        },
      ],
      resolution: { width: 800, height: 600 },
      frameRate: 30,
    }
  }

  /**
   * Create test scene with specified complexity
   */
  static createTestScene(
    complexity: 'simple' | 'medium' | 'complex' = 'medium'
  ): any {
    const baseLayers = [
      {
        id: 'background',
        type: 'rectangle',
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
        fill: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
      },
    ]

    if (complexity === 'simple') {
      return {
        layers: baseLayers,
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
      }
    }

    const mediumLayers = [
      ...baseLayers,
      {
        id: 'main-object',
        type: 'circle',
        position: { x: 960, y: 540 },
        radius: 100,
        fill: { r: 1.0, g: 0.5, b: 0.0, a: 1.0 },
      },
    ]

    if (complexity === 'medium') {
      return {
        layers: mediumLayers,
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
      }
    }

    // Complex scene
    const complexLayers = [
      ...mediumLayers,
      {
        id: 'text-layer',
        type: 'text',
        position: { x: 100, y: 100 },
        text: 'Test Text',
        fontSize: 48,
        fill: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
      },
      {
        id: 'image-layer',
        type: 'image',
        position: { x: 1400, y: 400 },
        size: { width: 400, height: 300 },
        src: 'test-image.png',
      },
    ]

    return {
      layers: complexLayers,
      effects: [
        {
          type: 'glow',
          intensity: 1.5,
          radius: 20,
        },
        {
          type: 'motion-blur',
          intensity: 1.0,
          samples: 8,
        },
      ],
      resolution: { width: 1920, height: 1080 },
      frameRate: 60,
    }
  }

  /**
   * Create mock frame data for testing
   */
  static createMockFrameData(width: number = 1920, height: number = 1080): any {
    return {
      width,
      height,
      data: new Uint8Array(width * height * 4),
      format: 'rgba8unorm',
      timestamp: Date.now(),
    }
  }

  /**
   * Create test media file
   */
  static createTestMediaFile(
    name: string = 'test-video.mp4',
    type: string = 'video/mp4',
    size: number = 1024 * 1024
  ): File {
    const data = new Uint8Array(size)
    // Fill with some pattern data
    for (let i = 0; i < size; i++) {
      data[i] = i % 256
    }

    const blob = new Blob([data], { type })
    return new File([blob], name, { type })
  }

  /**
   * Wait for specified time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Generate test data with specific pattern
   */
  static generateTestPattern(
    width: number,
    height: number,
    pattern: 'solid' | 'gradient' | 'noise' = 'gradient'
  ): Uint8Array {
    const data = new Uint8Array(width * height * 4)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4

        let r, g, b, a

        switch (pattern) {
          case 'solid':
            r = g = b = 128
            a = 255
            break
          case 'gradient':
            r = Math.floor((x / width) * 255)
            g = Math.floor((y / height) * 255)
            b = 128
            a = 255
            break
          case 'noise':
            r = Math.floor(Math.random() * 256)
            g = Math.floor(Math.random() * 256)
            b = Math.floor(Math.random() * 256)
            a = 255
            break
          default:
            r = g = b = a = 255
        }

        data[index] = r // R
        data[index + 1] = g // G
        data[index + 2] = b // B
        data[index + 3] = a // A
      }
    }

    return data
  }

  /**
   * Compare two frame data objects for differences
   */
  static compareFrameData(
    frame1: any,
    frame2: any,
    tolerance: number = 1.0
  ): {
    identical: boolean
    maxDifference: number
    averageDifference: number
  } {
    if (frame1.width !== frame2.width || frame1.height !== frame2.height) {
      throw new Error('Frame dimensions do not match')
    }

    let maxDiff = 0
    let totalDiff = 0
    let pixelCount = 0

    const data1 = frame1.data
    const data2 = frame2.data

    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i]
      const g1 = data1[i + 1]
      const b1 = data1[i + 2]
      const a1 = data1[i + 3]

      const r2 = data2[i]
      const g2 = data2[i + 1]
      const b2 = data2[i + 2]
      const a2 = data2[i + 3]

      const diff = Math.sqrt(
        Math.pow(r1 - r2, 2) +
          Math.pow(g1 - g2, 2) +
          Math.pow(b1 - b2, 2) +
          Math.pow(a1 - a2, 2)
      )

      maxDiff = Math.max(maxDiff, diff)
      totalDiff += diff
      pixelCount++
    }

    const averageDiff = pixelCount > 0 ? totalDiff / pixelCount : 0

    return {
      identical: maxDiff <= tolerance,
      maxDifference: maxDiff,
      averageDifference: averageDiff,
    }
  }

  /**
   * Simulate WebGPU context for testing
   */
  static createMockWebGPUContext(): any {
    return {
      getDevice: () => ({
        createTexture: (descriptor: any) => ({
          createView: () => ({}),
          width: descriptor.size[0],
          height: descriptor.size[1],
          format: descriptor.format,
        }),
        createBuffer: (descriptor: any) => ({
          size: descriptor.size,
          usage: descriptor.usage,
        }),
        createCommandEncoder: () => ({
          beginRenderPass: () => ({
            setPipeline: () => {},
            setVertexBuffer: () => {},
            draw: () => {},
            end: () => {},
          }),
          finish: () => ({}),
        }),
        queue: {
          submit: () => {},
          writeBuffer: () => {},
        },
        limits: {
          maxTextureDimension2D: 8192,
          maxBufferSize: 268435456,
          maxComputeWorkgroupsPerDimension: 65536,
        },
      }),
      getContext: () => ({
        getCurrentTexture: () => ({
          createView: () => ({}),
          width: 1920,
          height: 1080,
        }),
      }),
      getFormat: () => 'rgba8unorm',
    }
  }

  /**
   * Create performance test scenario
   */
  static createPerformanceTestScenario(
    duration: number = 10,
    frameRate: number = 60,
    complexity: 'simple' | 'medium' | 'complex' = 'medium'
  ): {
    frameCount: number
    scenes: any[]
    expectedFrameTime: number
    tolerance: number
  } {
    const frameCount = duration * frameRate
    const scenes = []

    for (let i = 0; i < frameCount; i++) {
      scenes.push(this.createTestScene(complexity))
    }

    return {
      frameCount,
      scenes,
      expectedFrameTime: 1000 / frameRate, // Target frame time in ms
      tolerance: 2.0, // Allow 2ms variance
    }
  }

  /**
   * Validate performance results
   */
  static validatePerformanceResults(
    frameTimes: number[],
    expectedFrameTime: number,
    tolerance: number = 2.0
  ): {
    passed: boolean
    averageFrameTime: number
    maxFrameTime: number
    minFrameTime: number
    frameRate: number
    recommendations: string[]
  } {
    const averageFrameTime =
      frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    const maxFrameTime = Math.max(...frameTimes)
    const minFrameTime = Math.min(...frameTimes)
    const frameRate = 1000 / averageFrameTime

    const recommendations: string[] = []

    if (averageFrameTime > expectedFrameTime + tolerance) {
      recommendations.push('Frame time exceeds target - consider optimization')
    }

    if (maxFrameTime > expectedFrameTime * 2) {
      recommendations.push(
        'Frame time spikes detected - check for periodic bottlenecks'
      )
    }

    if (frameRate < 50) {
      recommendations.push(
        'Frame rate below 50fps - performance optimization needed'
      )
    }

    return {
      passed: averageFrameTime <= expectedFrameTime + tolerance,
      averageFrameTime,
      maxFrameTime,
      minFrameTime,
      frameRate,
      recommendations,
    }
  }

  /**
   * Generate stress test data
   */
  static generateStressTestData(count: number, size: number = 1024): any[] {
    const data = []

    for (let i = 0; i < count; i++) {
      data.push({
        id: `stress-test-${i}`,
        data: new Uint8Array(size),
        metadata: {
          size,
          index: i,
          timestamp: Date.now(),
        },
      })
    }

    return data
  }

  /**
   * Measure GPU memory usage (if available)
   */
  static async measureGPUMemoryUsage(): Promise<number> {
    // In a real implementation, this would query GPU memory usage
    // For now, return estimated usage
    return 100 + Math.random() * 50 // 100-150 MB
  }

  /**
   * Create test error for validation
   */
  static createTestError(
    type: string = 'test_error',
    component: string = 'test_component',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): any {
    const error = new Error(`Test error: ${type}`)
    return {
      id: `error-${Date.now()}`,
      type,
      component,
      message: error.message,
      severity,
      timestamp: new Date(),
      stack: error.stack,
    }
  }

  /**
   * Validate system health
   */
  static validateSystemHealth(
    frameTimes: number[],
    memoryUsage: number[],
    errorCount: number
  ): {
    healthy: boolean
    score: number
    issues: string[]
  } {
    const issues: string[] = []
    let score = 100

    // Frame time validation
    const avgFrameTime =
      frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    if (avgFrameTime > 16.67) {
      issues.push('Frame time exceeds 60fps target')
      score -= 20
    }

    // Memory usage validation
    const avgMemory =
      memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length
    if (avgMemory > 500) {
      issues.push('Memory usage exceeds recommended limits')
      score -= 15
    }

    // Error rate validation
    if (errorCount > 10) {
      issues.push('High error rate detected')
      score -= 25
    }

    return {
      healthy: score >= 80 && issues.length === 0,
      score: Math.max(0, score),
      issues,
    }
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  /**
   * Generate test scene with effects
   */
  static generateSceneWithEffects(effectCount: number = 3): any {
    const effects = []

    for (let i = 0; i < effectCount; i++) {
      effects.push({
        type: ['glow', 'blur', 'color-correction'][i % 3],
        intensity: 0.5 + Math.random() * 1.5,
        radius: 5 + Math.random() * 20,
      })
    }

    return {
      layers: [
        {
          id: 'test-layer',
          type: 'rectangle',
          position: { x: 960, y: 540 },
          size: { width: 200, height: 200 },
          fill: { r: 1.0, g: 0.5, b: 0.0, a: 1.0 },
          effects,
        },
      ],
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
    }
  }

  /**
   * Generate test keyframes
   */
  static generateTestKeyframes(count: number = 10): any[] {
    const keyframes = []

    for (let i = 0; i < count; i++) {
      keyframes.push({
        time: i * 0.5, // Every 0.5 seconds
        value: {
          position: {
            x: 100 + Math.random() * 800,
            y: 100 + Math.random() * 600,
          },
          scale: {
            x: 0.5 + Math.random() * 1.5,
            y: 0.5 + Math.random() * 1.5,
          },
          rotation: Math.random() * 360,
          opacity: 0.3 + Math.random() * 0.7,
        },
        interpolation: 'bezier',
        easing: {
          p1x: 0.25 + Math.random() * 0.5,
          p1y: 0.1 + Math.random() * 0.8,
          p2x: 0.25 + Math.random() * 0.5,
          p2y: 0.1 + Math.random() * 0.8,
        },
      })
    }

    return keyframes
  }

  /**
   * Generate test audio data
   */
  static generateTestAudioData(
    duration: number = 5,
    sampleRate: number = 44100,
    channels: number = 2
  ): Float32Array[] {
    const sampleCount = duration * sampleRate
    const audioData: Float32Array[] = []

    for (let channel = 0; channel < channels; channel++) {
      const channelData = new Float32Array(sampleCount)

      for (let i = 0; i < sampleCount; i++) {
        const t = i / sampleRate
        // Generate sine wave with some harmonics
        channelData[i] =
          Math.sin(2 * Math.PI * 440 * t) * 0.5 + // Fundamental
          Math.sin(2 * Math.PI * 880 * t) * 0.2 + // First harmonic
          Math.sin(2 * Math.PI * 1320 * t) * 0.1 // Second harmonic
      }

      audioData.push(channelData)
    }

    return audioData
  }
}

/**
 * Performance benchmarking utilities
 */
export class PerformanceBenchmark {
  private measurements: Map<string, number[]> = new Map()

  /**
   * Start measuring a performance metric
   */
  startMeasurement(name: string): void {
    this.measurements.set(name, [performance.now()])
  }

  /**
   * Record a measurement point
   */
  recordMeasurement(name: string): void {
    const measurements = this.measurements.get(name) || []
    measurements.push(performance.now())
    this.measurements.set(name, measurements)
  }

  /**
   * End measurement and calculate statistics
   */
  endMeasurement(name: string): PerformanceMeasurement {
    const measurements = this.measurements.get(name) || []
    if (measurements.length < 2) {
      throw new Error(`Insufficient measurements for ${name}`)
    }

    const times = []
    for (let i = 1; i < measurements.length; i++) {
      times.push(measurements[i] - measurements[0])
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)

    // Calculate standard deviation
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) /
      times.length
    const stdDev = Math.sqrt(variance)

    return {
      name,
      count: times.length,
      average: avg,
      min,
      max,
      stdDev,
      total: measurements[measurements.length - 1] - measurements[0],
    }
  }

  /**
   * Get all measurements
   */
  getAllMeasurements(): Map<string, PerformanceMeasurement> {
    const results = new Map<string, PerformanceMeasurement>()

    for (const name of Array.from(this.measurements.keys())) {
      try {
        results.set(name, this.endMeasurement(name))
      } catch (error) {
        // Skip incomplete measurements
      }
    }

    return results
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear()
  }
}

/**
 * Performance measurement result
 */
export interface PerformanceMeasurement {
  name: string
  count: number
  average: number
  min: number
  max: number
  stdDev: number
  total: number
}

/**
 * Test assertion utilities
 */
export class TestAssertions {
  /**
   * Assert performance meets target
   */
  static assertPerformance(
    frameTimes: number[],
    targetFrameRate: number,
    tolerance: number = 2.0
  ): void {
    const validation = TestUtils.validatePerformanceResults(
      frameTimes,
      1000 / targetFrameRate,
      tolerance
    )

    if (!validation.passed) {
      const message =
        `Performance validation failed:\n` +
        `Average frame time: ${validation.averageFrameTime.toFixed(2)}ms\n` +
        `Target frame time: ${(1000 / targetFrameRate).toFixed(2)}ms\n` +
        `Frame rate: ${validation.frameRate.toFixed(1)}fps\n` +
        `Recommendations: ${validation.recommendations.join(', ')}`

      throw new Error(message)
    }
  }

  /**
   * Assert memory usage is within limits
   */
  static assertMemoryUsage(
    memoryUsage: number[],
    maxMemoryMB: number = 500
  ): void {
    const maxUsage = Math.max(...memoryUsage)
    const avgUsage = memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length

    if (maxUsage > maxMemoryMB) {
      throw new Error(
        `Memory usage exceeded limit: ${maxUsage.toFixed(1)}MB > ${maxMemoryMB}MB`
      )
    }

    if (avgUsage > maxMemoryMB * 0.8) {
      logger.warn(
        `Memory usage approaching limit: ${avgUsage.toFixed(1)}MB / ${maxMemoryMB}MB`
      )
    }
  }

  /**
   * Assert error rate is acceptable
   */
  static assertErrorRate(
    errors: number,
    operations: number,
    maxErrorRate: number = 0.05
  ): void {
    const errorRate = errors / operations

    if (errorRate > maxErrorRate) {
      throw new Error(
        `Error rate too high: ${(errorRate * 100).toFixed(1)}% > ${(maxErrorRate * 100).toFixed(1)}%`
      )
    }
  }
}
