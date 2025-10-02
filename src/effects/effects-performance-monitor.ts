/**
 * @fileoverview Effects Performance Monitor
 * @description Real-time performance monitoring and budgeting for effects system
 * @author @darianrosebrook
 */

import { Result, Time } from '../types'
import { logger } from '../core/logging/logger'

/**
 * Performance metrics for an effect
 */
export interface EffectPerformanceMetrics {
  effectId: string
  effectType: string
  renderTime: number // milliseconds
  memoryUsage: number // bytes
  gpuMemoryUsage: number // bytes
  timestamp: number
  frameNumber: number
}

/**
 * Performance budget for effects
 */
export interface EffectPerformanceBudget {
  maxRenderTime: number // milliseconds (default: 16ms for 60fps)
  maxMemoryUsage: number // bytes (default: 256MB)
  maxGpuMemoryUsage: number // bytes (default: 512MB)
  warningThreshold: number // percentage of budget (default: 80%)
}

/**
 * Performance alert
 */
export interface PerformanceAlert {
  type: 'warning' | 'critical'
  metric: 'renderTime' | 'memoryUsage' | 'gpuMemoryUsage'
  message: string
  effectId: string
  actualValue: number
  budgetValue: number
  timestamp: number
}

/**
 * Performance statistics
 */
export interface PerformanceStatistics {
  averageRenderTime: number
  maxRenderTime: number
  minRenderTime: number
  p95RenderTime: number
  p99RenderTime: number
  averageMemoryUsage: number
  peakMemoryUsage: number
  averageGpuMemoryUsage: number
  peakGpuMemoryUsage: number
  totalFrames: number
  droppedFrames: number
  effectCount: number
}

/**
 * Effects performance monitor
 */
export class EffectsPerformanceMonitor {
  private metrics: Map<string, EffectPerformanceMetrics[]> = new Map()
  private budget: EffectPerformanceBudget
  private alerts: PerformanceAlert[] = []
  private maxMetricsPerEffect = 1000 // Keep last 1000 frames
  private frameNumber = 0
  private droppedFrames = 0
  private enabled = true

  constructor(budget?: Partial<EffectPerformanceBudget>) {
    this.budget = {
      maxRenderTime: budget?.maxRenderTime ?? 16, // 60fps
      maxMemoryUsage: budget?.maxMemoryUsage ?? 256 * 1024 * 1024, // 256MB
      maxGpuMemoryUsage: budget?.maxGpuMemoryUsage ?? 512 * 1024 * 1024, // 512MB
      warningThreshold: budget?.warningThreshold ?? 0.8, // 80%
    }
  }

  /**
   * Record performance metrics for an effect
   */
  recordMetrics(
    effectId: string,
    effectType: string,
    renderTime: number,
    memoryUsage: number = 0,
    gpuMemoryUsage: number = 0
  ): void {
    if (!this.enabled) return

    const metrics: EffectPerformanceMetrics = {
      effectId,
      effectType,
      renderTime,
      memoryUsage,
      gpuMemoryUsage,
      timestamp: performance.now(),
      frameNumber: this.frameNumber++,
    }

    // Store metrics
    if (!this.metrics.has(effectId)) {
      this.metrics.set(effectId, [])
    }

    const effectMetrics = this.metrics.get(effectId)!
    effectMetrics.push(metrics)

    // Maintain max metrics limit
    if (effectMetrics.length > this.maxMetricsPerEffect) {
      effectMetrics.shift()
    }

    // Check budget violations
    this.checkBudgetViolations(metrics)

    // Track dropped frames
    if (renderTime > this.budget.maxRenderTime) {
      this.droppedFrames++
    }
  }

  /**
   * Check for budget violations and create alerts
   */
  private checkBudgetViolations(metrics: EffectPerformanceMetrics): void {
    const warningRenderTime =
      this.budget.maxRenderTime * this.budget.warningThreshold
    const criticalRenderTime = this.budget.maxRenderTime

    // Check render time
    if (metrics.renderTime >= criticalRenderTime) {
      this.createAlert('critical', 'renderTime', metrics, criticalRenderTime)
    } else if (metrics.renderTime >= warningRenderTime) {
      this.createAlert('warning', 'renderTime', metrics, warningRenderTime)
    }

    // Check memory usage
    const warningMemory =
      this.budget.maxMemoryUsage * this.budget.warningThreshold
    if (metrics.memoryUsage >= this.budget.maxMemoryUsage) {
      this.createAlert(
        'critical',
        'memoryUsage',
        metrics,
        this.budget.maxMemoryUsage
      )
    } else if (metrics.memoryUsage >= warningMemory) {
      this.createAlert('warning', 'memoryUsage', metrics, warningMemory)
    }

    // Check GPU memory usage
    const warningGpuMemory =
      this.budget.maxGpuMemoryUsage * this.budget.warningThreshold
    if (metrics.gpuMemoryUsage >= this.budget.maxGpuMemoryUsage) {
      this.createAlert(
        'critical',
        'gpuMemoryUsage',
        metrics,
        this.budget.maxGpuMemoryUsage
      )
    } else if (metrics.gpuMemoryUsage >= warningGpuMemory) {
      this.createAlert('warning', 'gpuMemoryUsage', metrics, warningGpuMemory)
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(
    type: 'warning' | 'critical',
    metric: 'renderTime' | 'memoryUsage' | 'gpuMemoryUsage',
    metrics: EffectPerformanceMetrics,
    budgetValue: number
  ): void {
    const actualValue = metrics[metric]
    const message = this.formatAlertMessage(
      type,
      metric,
      metrics.effectType,
      actualValue,
      budgetValue
    )

    const alert: PerformanceAlert = {
      type,
      metric,
      message,
      effectId: metrics.effectId,
      actualValue,
      budgetValue,
      timestamp: Date.now(),
    }

    this.alerts.push(alert)

    // Log the alert
    if (type === 'critical') {
      logger.error(message, undefined, {
        effectId: metrics.effectId,
        effectType: metrics.effectType,
        metric,
        actualValue,
        budgetValue,
      })
    } else {
      logger.warn(message, {
        effectId: metrics.effectId,
        effectType: metrics.effectType,
        metric,
        actualValue,
        budgetValue,
      })
    }

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift()
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(
    type: string,
    metric: string,
    effectType: string,
    actualValue: number,
    budgetValue: number
  ): string {
    const percentage = ((actualValue / budgetValue) * 100).toFixed(1)
    const unit =
      metric === 'renderTime'
        ? 'ms'
        : metric === 'memoryUsage' || metric === 'gpuMemoryUsage'
        ? 'MB'
        : ''
    const formattedActual =
      metric === 'renderTime'
        ? actualValue.toFixed(2)
        : (actualValue / (1024 * 1024)).toFixed(2)
    const formattedBudget =
      metric === 'renderTime'
        ? budgetValue.toFixed(2)
        : (budgetValue / (1024 * 1024)).toFixed(2)

    return `${type.toUpperCase()}: Effect ${effectType} ${metric} exceeded budget: ${formattedActual}${unit} (${percentage}% of ${formattedBudget}${unit} budget)`
  }

  /**
   * Get performance statistics for an effect
   */
  getEffectStatistics(effectId: string): Result<PerformanceStatistics> {
    const effectMetrics = this.metrics.get(effectId)
    if (!effectMetrics || effectMetrics.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_METRICS',
          message: `No metrics available for effect ${effectId}`,
        },
      }
    }

    const renderTimes = effectMetrics.map((m) => m.renderTime).sort((a, b) => a - b)
    const memoryUsages = effectMetrics.map((m) => m.memoryUsage)
    const gpuMemoryUsages = effectMetrics.map((m) => m.gpuMemoryUsage)

    const stats: PerformanceStatistics = {
      averageRenderTime:
        renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
      maxRenderTime: Math.max(...renderTimes),
      minRenderTime: Math.min(...renderTimes),
      p95RenderTime: renderTimes[Math.floor(renderTimes.length * 0.95)] || 0,
      p99RenderTime: renderTimes[Math.floor(renderTimes.length * 0.99)] || 0,
      averageMemoryUsage:
        memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      peakMemoryUsage: Math.max(...memoryUsages),
      averageGpuMemoryUsage:
        gpuMemoryUsages.reduce((a, b) => a + b, 0) / gpuMemoryUsages.length,
      peakGpuMemoryUsage: Math.max(...gpuMemoryUsages),
      totalFrames: effectMetrics.length,
      droppedFrames: this.droppedFrames,
      effectCount: 1,
    }

    return { success: true, data: stats }
  }

  /**
   * Get overall performance statistics
   */
  getOverallStatistics(): PerformanceStatistics {
    const allMetrics: EffectPerformanceMetrics[] = []
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics)
    }

    if (allMetrics.length === 0) {
      return {
        averageRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: 0,
        p95RenderTime: 0,
        p99RenderTime: 0,
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        averageGpuMemoryUsage: 0,
        peakGpuMemoryUsage: 0,
        totalFrames: 0,
        droppedFrames: 0,
        effectCount: 0,
      }
    }

    const renderTimes = allMetrics.map((m) => m.renderTime).sort((a, b) => a - b)
    const memoryUsages = allMetrics.map((m) => m.memoryUsage)
    const gpuMemoryUsages = allMetrics.map((m) => m.gpuMemoryUsage)

    return {
      averageRenderTime:
        renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
      maxRenderTime: Math.max(...renderTimes),
      minRenderTime: Math.min(...renderTimes),
      p95RenderTime: renderTimes[Math.floor(renderTimes.length * 0.95)] || 0,
      p99RenderTime: renderTimes[Math.floor(renderTimes.length * 0.99)] || 0,
      averageMemoryUsage:
        memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      peakMemoryUsage: Math.max(...memoryUsages),
      averageGpuMemoryUsage:
        gpuMemoryUsages.reduce((a, b) => a + b, 0) / gpuMemoryUsages.length,
      peakGpuMemoryUsage: Math.max(...gpuMemoryUsages),
      totalFrames: allMetrics.length,
      droppedFrames: this.droppedFrames,
      effectCount: this.metrics.size,
    }
  }

  /**
   * Get recent alerts
   */
  getAlerts(count?: number): PerformanceAlert[] {
    if (count) {
      return this.alerts.slice(-count)
    }
    return [...this.alerts]
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = []
  }

  /**
   * Clear metrics for an effect
   */
  clearEffectMetrics(effectId: string): void {
    this.metrics.delete(effectId)
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics(): void {
    this.metrics.clear()
    this.alerts = []
    this.droppedFrames = 0
    this.frameNumber = 0
  }

  /**
   * Update performance budget
   */
  updateBudget(budget: Partial<EffectPerformanceBudget>): void {
    this.budget = { ...this.budget, ...budget }
    logger.info('Performance budget updated', budget)
  }

  /**
   * Get current budget
   */
  getBudget(): EffectPerformanceBudget {
    return { ...this.budget }
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    logger.info(`Performance monitoring ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    const data = {
      budget: this.budget,
      overallStats: this.getOverallStatistics(),
      effectMetrics: Array.from(this.metrics.entries()).map(
        ([effectId, metrics]) => ({
          effectId,
          stats: this.getEffectStatistics(effectId),
          recentMetrics: metrics.slice(-100), // Last 100 frames
        })
      ),
      alerts: this.alerts,
    }
    return JSON.stringify(data, null, 2)
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getOverallStatistics()
    const budget = this.budget

    const report = `
=== Effects Performance Report ===

Overall Statistics:
  Total Frames: ${stats.totalFrames}
  Dropped Frames: ${stats.droppedFrames} (${((stats.droppedFrames / stats.totalFrames) * 100).toFixed(2)}%)
  Active Effects: ${stats.effectCount}

Render Time:
  Average: ${stats.averageRenderTime.toFixed(2)}ms
  P95: ${stats.p95RenderTime.toFixed(2)}ms
  P99: ${stats.p99RenderTime.toFixed(2)}ms
  Max: ${stats.maxRenderTime.toFixed(2)}ms
  Budget: ${budget.maxRenderTime}ms
  Status: ${stats.p95RenderTime <= budget.maxRenderTime ? '✅ PASSING' : '❌ FAILING'}

Memory Usage:
  Average: ${(stats.averageMemoryUsage / (1024 * 1024)).toFixed(2)}MB
  Peak: ${(stats.peakMemoryUsage / (1024 * 1024)).toFixed(2)}MB
  Budget: ${(budget.maxMemoryUsage / (1024 * 1024)).toFixed(2)}MB
  Status: ${stats.peakMemoryUsage <= budget.maxMemoryUsage ? '✅ PASSING' : '❌ FAILING'}

GPU Memory Usage:
  Average: ${(stats.averageGpuMemoryUsage / (1024 * 1024)).toFixed(2)}MB
  Peak: ${(stats.peakGpuMemoryUsage / (1024 * 1024)).toFixed(2)}MB
  Budget: ${(budget.maxGpuMemoryUsage / (1024 * 1024)).toFixed(2)}MB
  Status: ${stats.peakGpuMemoryUsage <= budget.maxGpuMemoryUsage ? '✅ PASSING' : '❌ FAILING'}

Recent Alerts: ${this.alerts.slice(-5).length > 0 ? '\n' + this.alerts.slice(-5).map((a) => `  ${a.type.toUpperCase()}: ${a.message}`).join('\n') : 'None'}
`

    return report
  }
}

/**
 * Create default performance monitor
 */
export function createDefaultPerformanceMonitor(): EffectsPerformanceMonitor {
  return new EffectsPerformanceMonitor({
    maxRenderTime: 16, // 60fps
    maxMemoryUsage: 256 * 1024 * 1024, // 256MB
    maxGpuMemoryUsage: 512 * 1024 * 1024, // 512MB
    warningThreshold: 0.8, // 80%
  })
}

