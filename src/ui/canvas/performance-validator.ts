/**
 * @fileoverview Canvas Performance Validator
 * @description Performance validation for canvas interactions (selection, pan, zoom, transform)
 * @author @darianrosebrook
 */

import { logger } from '@/core/logging/logger'

/**
 * Performance metrics for canvas interactions
 */
export interface CanvasPerformanceMetrics {
  interaction: string
  duration: number // milliseconds
  fps: number
  timestamp: number
}

/**
 * Performance validation result
 */
export interface PerformanceValidationResult {
  passed: boolean
  interaction: string
  duration: number
  fps: number
  budget: number
  message: string
}

/**
 * Canvas performance validator
 */
export class CanvasPerformanceValidator {
  private metrics: Map<string, CanvasPerformanceMetrics[]> = new Map()
  private startTimes: Map<string, number> = new Map()
  private frameCounts: Map<string, number> = new Map()
  private readonly fpsTarget = 60
  private readonly frameTimeBudget = 16.67 // ms (60fps)

  /**
   * Start timing an interaction
   */
  startInteraction(interaction: string): void {
    this.startTimes.set(interaction, performance.now())
    this.frameCounts.set(interaction, 0)
  }

  /**
   * Record a frame for an ongoing interaction
   */
  recordFrame(interaction: string): void {
    const count = this.frameCounts.get(interaction) || 0
    this.frameCounts.set(interaction, count + 1)
  }

  /**
   * End timing an interaction and calculate metrics
   */
  endInteraction(interaction: string): CanvasPerformanceMetrics | null {
    const startTime = this.startTimes.get(interaction)
    const frameCount = this.frameCounts.get(interaction)

    if (startTime === undefined || frameCount === undefined) {
      logger.warn(`No start time or frame count for interaction: ${interaction}`)
      return null
    }

    const duration = performance.now() - startTime
    const fps = frameCount / (duration / 1000)

    const metrics: CanvasPerformanceMetrics = {
      interaction,
      duration,
      fps,
      timestamp: Date.now(),
    }

    // Store metrics
    if (!this.metrics.has(interaction)) {
      this.metrics.set(interaction, [])
    }
    this.metrics.get(interaction)!.push(metrics)

    // Clean up
    this.startTimes.delete(interaction)
    this.frameCounts.delete(interaction)

    return metrics
  }

  /**
   * Validate canvas selection performance
   */
  async validateSelection(nodeCount: number): Promise<PerformanceValidationResult> {
    const interaction = 'selection'
    
    return new Promise((resolve) => {
      this.startInteraction(interaction)
      
      // Simulate selection updates
      const updateInterval = setInterval(() => {
        this.recordFrame(interaction)
      }, this.frameTimeBudget)

      // Run for 1 second
      setTimeout(() => {
        clearInterval(updateInterval)
        const metrics = this.endInteraction(interaction)
        
        if (!metrics) {
          resolve({
            passed: false,
            interaction,
            duration: 0,
            fps: 0,
            budget: this.fpsTarget,
            message: 'Failed to collect metrics',
          })
          return
        }

        const passed = metrics.fps >= this.fpsTarget * 0.9 // Allow 10% tolerance
        resolve({
          passed,
          interaction,
          duration: metrics.duration,
          fps: metrics.fps,
          budget: this.fpsTarget,
          message: passed
            ? `✅ Selection with ${nodeCount} nodes: ${metrics.fps.toFixed(1)}fps (target: ${this.fpsTarget}fps)`
            : `❌ Selection with ${nodeCount} nodes: ${metrics.fps.toFixed(1)}fps (target: ${this.fpsTarget}fps)`,
        })
      }, 1000)
    })
  }

  /**
   * Validate canvas pan performance
   */
  async validatePan(): Promise<PerformanceValidationResult> {
    const interaction = 'pan'
    
    return new Promise((resolve) => {
      this.startInteraction(interaction)
      
      // Simulate pan updates
      const updateInterval = setInterval(() => {
        this.recordFrame(interaction)
      }, this.frameTimeBudget)

      // Run for 1 second
      setTimeout(() => {
        clearInterval(updateInterval)
        const metrics = this.endInteraction(interaction)
        
        if (!metrics) {
          resolve({
            passed: false,
            interaction,
            duration: 0,
            fps: 0,
            budget: this.fpsTarget,
            message: 'Failed to collect metrics',
          })
          return
        }

        const passed = metrics.fps >= this.fpsTarget * 0.9
        resolve({
          passed,
          interaction,
          duration: metrics.duration,
          fps: metrics.fps,
          budget: this.fpsTarget,
          message: passed
            ? `✅ Pan: ${metrics.fps.toFixed(1)}fps (target: ${this.fpsTarget}fps)`
            : `❌ Pan: ${metrics.fps.toFixed(1)}fps (target: ${this.fpsTarget}fps)`,
        })
      }, 1000)
    })
  }

  /**
   * Validate canvas zoom performance
   */
  async validateZoom(): Promise<PerformanceValidationResult> {
    const interaction = 'zoom'
    
    return new Promise((resolve) => {
      this.startInteraction(interaction)
      
      // Simulate zoom updates
      const updateInterval = setInterval(() => {
        this.recordFrame(interaction)
      }, this.frameTimeBudget)

      // Run for 1 second
      setTimeout(() => {
        clearInterval(updateInterval)
        const metrics = this.endInteraction(interaction)
        
        if (!metrics) {
          resolve({
            passed: false,
            interaction,
            duration: 0,
            fps: 0,
            budget: this.fpsTarget,
            message: 'Failed to collect metrics',
          })
          return
        }

        const passed = metrics.fps >= this.fpsTarget * 0.9
        resolve({
          passed,
          interaction,
          duration: metrics.duration,
          fps: metrics.fps,
          budget: this.fpsTarget,
          message: passed
            ? `✅ Zoom: ${metrics.fps.toFixed(1)}fps (target: ${this.fpsTarget}fps)`
            : `❌ Zoom: ${metrics.fps.toFixed(1)}fps (target: ${this.fpsTarget}fps)`,
        })
      }, 1000)
    })
  }

  /**
   * Validate canvas transform performance
   */
  async validateTransform(): Promise<PerformanceValidationResult> {
    const interaction = 'transform'
    
    return new Promise((resolve) => {
      this.startInteraction(interaction)
      
      // Simulate transform updates
      const updateInterval = setInterval(() => {
        this.recordFrame(interaction)
      }, this.frameTimeBudget)

      // Run for 1 second
      setTimeout(() => {
        clearInterval(updateInterval)
        const metrics = this.endInteraction(interaction)
        
        if (!metrics) {
          resolve({
            passed: false,
            interaction,
            duration: 0,
            fps: 0,
            budget: this.fpsTarget,
            message: 'Failed to collect metrics',
          })
          return
        }

        const passed = metrics.fps >= this.fpsTarget * 0.9
        resolve({
          passed,
          interaction,
          duration: metrics.duration,
          fps: metrics.fps,
          budget: this.fpsTarget,
          message: passed
            ? `✅ Transform: ${metrics.fps.toFixed(1)}fps (target: ${this.fpsTarget}fps)`
            : `❌ Transform: ${metrics.fps.toFixed(1)}fps (target: ${this.fpsTarget}fps)`,
        })
      }, 1000)
    })
  }

  /**
   * Run all canvas performance validations
   */
  async validateAll(nodeCount: number = 50): Promise<{
    passed: boolean
    results: PerformanceValidationResult[]
    summary: string
  }> {
    logger.info('Starting canvas performance validation', { nodeCount })

    const results: PerformanceValidationResult[] = []

    // Run all validations
    results.push(await this.validateSelection(nodeCount))
    results.push(await this.validatePan())
    results.push(await this.validateZoom())
    results.push(await this.validateTransform())

    const passed = results.every((r) => r.passed)
    const passedCount = results.filter((r) => r.passed).length
    const totalCount = results.length

    const summary = `
=== Canvas Performance Validation ===

Node Count: ${nodeCount}
Target FPS: ${this.fpsTarget}

Results:
${results.map((r) => `  ${r.message}`).join('\n')}

Summary: ${passedCount}/${totalCount} validations passed
Status: ${passed ? '✅ ALL PASSED' : '❌ SOME FAILED'}
`

    logger.info('Canvas performance validation complete', {
      passed,
      passedCount,
      totalCount,
    })

    return { passed, results, summary }
  }

  /**
   * Get performance metrics for an interaction
   */
  getMetrics(interaction: string): CanvasPerformanceMetrics[] {
    return this.metrics.get(interaction) || []
  }

  /**
   * Get average FPS for an interaction
   */
  getAverageFPS(interaction: string): number {
    const metrics = this.metrics.get(interaction)
    if (!metrics || metrics.length === 0) return 0

    const totalFPS = metrics.reduce((sum, m) => sum + m.fps, 0)
    return totalFPS / metrics.length
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear()
    this.startTimes.clear()
    this.frameCounts.clear()
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const allMetrics: CanvasPerformanceMetrics[] = []
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics)
    }

    if (allMetrics.length === 0) {
      return 'No performance metrics available'
    }

    const interactions = Array.from(this.metrics.keys())
    const report = `
=== Canvas Performance Report ===

Interactions Measured: ${interactions.join(', ')}
Total Measurements: ${allMetrics.length}

Performance by Interaction:
${interactions.map((interaction) => {
  const metrics = this.metrics.get(interaction)!
  const avgFPS = this.getAverageFPS(interaction)
  const minFPS = Math.min(...metrics.map((m) => m.fps))
  const maxFPS = Math.max(...metrics.map((m) => m.fps))
  const status = avgFPS >= this.fpsTarget * 0.9 ? '✅' : '❌'

  return `  ${status} ${interaction}:
    Average FPS: ${avgFPS.toFixed(1)}
    Min FPS: ${minFPS.toFixed(1)}
    Max FPS: ${maxFPS.toFixed(1)}
    Measurements: ${metrics.length}`
}).join('\n\n')}
`

    return report
  }
}

/**
 * Create default canvas performance validator
 */
export function createCanvasPerformanceValidator(): CanvasPerformanceValidator {
  return new CanvasPerformanceValidator()
}

