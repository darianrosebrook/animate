/**
 * @fileoverview Performance Monitor for detecting bottlenecks and errors
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { logger } from '@/core/logging/logger'

/**
 * Performance monitoring and bottleneck detection system
 */
export class PerformanceMonitor {
  private frameTimes: number[] = []
  private memoryUsage: number[] = []
  private gpuMetrics: Map<string, number> = new Map()
  private errorCounts: Map<string, number> = new Map()
  private bottlenecks: BottleneckInfo[] = []
  private isMonitoring = false
  private maxHistorySize = 1000

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    this.isMonitoring = true
    this.frameTimes = []
    this.memoryUsage = []
    this.gpuMetrics.clear()
    this.errorCounts.clear()
    this.bottlenecks = []

    logger.info('🔍 Performance monitoring started')
  }

  /**
   * Stop performance monitoring and generate report
   */
  stopMonitoring(): PerformanceReport {
    this.isMonitoring = false

    const report: PerformanceReport = {
      frameMetrics: this.calculateFrameMetrics(),
      memoryMetrics: this.calculateMemoryMetrics(),
      gpuMetrics: this.calculateGPUMetrics(),
      bottlenecks: this.detectBottlenecks(),
      recommendations: this.generateRecommendations(),
      timestamp: new Date(),
    }

    logger.info('📊 Performance monitoring completed:', report)
    return report
  }

  /**
   * Record frame time for performance analysis
   */
  recordFrameTime(frameTime: number): void {
    if (!this.isMonitoring) return

    this.frameTimes.push(frameTime)
    if (this.frameTimes.length > this.maxHistorySize) {
      this.frameTimes.shift()
    }

    // Check for performance issues
    if (frameTime > 33.33) {
      // > 30fps
      this.recordBottleneck(
        'frame_time',
        `Frame time ${frameTime.toFixed(2)}ms exceeds 30fps threshold`
      )
    }
  }

  /**
   * Record memory usage for leak detection
   */
  recordMemoryUsage(usageMB: number): void {
    if (!this.isMonitoring) return

    this.memoryUsage.push(usageMB)
    if (this.memoryUsage.length > this.maxHistorySize) {
      this.memoryUsage.shift()
    }

    // Check for memory leaks
    if (this.memoryUsage.length > 50) {
      const recent = this.memoryUsage.slice(-50)
      const trend = this.calculateTrend(recent)

      if (trend > 10) {
        // Memory increasing by more than 10MB
        this.recordBottleneck(
          'memory_leak',
          `Memory usage trending upward: +${trend.toFixed(1)}MB`
        )
      }
    }
  }

  /**
   * Record GPU metrics
   */
  recordGPUMetric(metric: string, value: number): void {
    if (!this.isMonitoring) return

    this.gpuMetrics.set(metric, value)

    // Check GPU-specific bottlenecks
    if (metric === 'gpu_utilization' && value < 50) {
      this.recordBottleneck(
        'gpu_underutilization',
        `GPU utilization is low: ${value.toFixed(1)}%`
      )
    } else if (metric === 'gpu_memory' && value > 90) {
      this.recordBottleneck(
        'gpu_memory_pressure',
        `GPU memory usage is high: ${value.toFixed(1)}%`
      )
    }
  }

  /**
   * Record errors for error rate analysis
   */
  recordError(errorType: string, count: number = 1): void {
    if (!this.isMonitoring) return

    const current = this.errorCounts.get(errorType) || 0
    this.errorCounts.set(errorType, current + count)

    // Check error rates
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (a, b) => a + b,
      0
    )
    if (totalErrors > 100) {
      this.recordBottleneck(
        'high_error_rate',
        `High error rate detected: ${totalErrors} errors`
      )
    }
  }

  /**
   * Get current performance status
   */
  getPerformanceStatus(): PerformanceStatus {
    const frameMetrics = this.calculateFrameMetrics()
    const memoryMetrics = this.calculateMemoryMetrics()

    return {
      isHealthy:
        frameMetrics.averageFrameTime < 16.67 && memoryMetrics.leakRate < 5,
      frameRate:
        frameMetrics.averageFrameTime > 0
          ? 1000 / frameMetrics.averageFrameTime
          : 0,
      memoryUsage: memoryMetrics.averageUsage,
      errorRate: this.calculateErrorRate(),
      bottlenecks: this.bottlenecks.length,
    }
  }

  private calculateFrameMetrics(): FrameMetrics {
    if (this.frameTimes.length === 0) {
      return {
        averageFrameTime: 0,
        minFrameTime: 0,
        maxFrameTime: 0,
        p95FrameTime: 0,
        frameRate: 0,
        variance: 0,
      }
    }

    const avg =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    const min = Math.min(...this.frameTimes)
    const max = Math.max(...this.frameTimes)
    const sorted = [...this.frameTimes].sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p95 = sorted[p95Index] || max

    // Calculate variance
    const variance =
      this.frameTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) /
      this.frameTimes.length

    return {
      averageFrameTime: avg,
      minFrameTime: min,
      maxFrameTime: max,
      p95FrameTime: p95,
      frameRate: avg > 0 ? 1000 / avg : 0,
      variance,
    }
  }

  private calculateMemoryMetrics(): MemoryMetrics {
    if (this.memoryUsage.length === 0) {
      return {
        averageUsage: 0,
        peakUsage: 0,
        leakRate: 0,
        trend: 0,
      }
    }

    const avg =
      this.memoryUsage.reduce((a, b) => a + b, 0) / this.memoryUsage.length
    const peak = Math.max(...this.memoryUsage)
    const trend = this.calculateTrend(this.memoryUsage)

    return {
      averageUsage: avg,
      peakUsage: peak,
      leakRate: Math.abs(trend),
      trend,
    }
  }

  private calculateGPUMetrics(): GPUMetrics {
    return {
      utilization: this.gpuMetrics.get('gpu_utilization') || 0,
      memoryUsage: this.gpuMetrics.get('gpu_memory') || 0,
      drawCalls: this.gpuMetrics.get('draw_calls') || 0,
      triangles: this.gpuMetrics.get('triangles') || 0,
    }
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 10) return 0

    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    return secondAvg - firstAvg
  }

  private calculateErrorRate(): number {
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (a, b) => a + b,
      0
    )
    const totalFrames = this.frameTimes.length

    return totalFrames > 0 ? (totalErrors / totalFrames) * 100 : 0
  }

  private detectBottlenecks(): BottleneckInfo[] {
    const bottlenecks: BottleneckInfo[] = []

    const frameMetrics = this.calculateFrameMetrics()
    const memoryMetrics = this.calculateMemoryMetrics()

    // Frame time bottlenecks
    if (frameMetrics.averageFrameTime > 33.33) {
      bottlenecks.push({
        type: 'frame_time',
        severity: 'critical',
        description: `Average frame time ${frameMetrics.averageFrameTime.toFixed(2)}ms exceeds 30fps threshold`,
        impact: 'high',
        suggestions: [
          'Reduce effect complexity',
          'Optimize batch rendering',
          'Check GPU utilization',
        ],
      })
    } else if (frameMetrics.averageFrameTime > 16.67) {
      bottlenecks.push({
        type: 'frame_time',
        severity: 'warning',
        description: `Average frame time ${frameMetrics.averageFrameTime.toFixed(2)}ms exceeds 60fps target`,
        impact: 'medium',
        suggestions: [
          'Enable adaptive quality',
          'Reduce concurrent effects',
          'Optimize shader compilation',
        ],
      })
    }

    // Memory bottlenecks
    if (memoryMetrics.leakRate > 10) {
      bottlenecks.push({
        type: 'memory_leak',
        severity: 'critical',
        description: `Memory usage increasing at ${memoryMetrics.leakRate.toFixed(1)}MB/min`,
        impact: 'high',
        suggestions: [
          'Check for resource leaks',
          'Implement proper cleanup',
          'Reduce memory allocation',
        ],
      })
    }

    // GPU bottlenecks
    const gpuUtilization = this.gpuMetrics.get('gpu_utilization') || 0
    if (gpuUtilization < 50) {
      bottlenecks.push({
        type: 'gpu_underutilization',
        severity: 'info',
        description: `GPU utilization is low: ${gpuUtilization.toFixed(1)}%`,
        impact: 'low',
        suggestions: [
          'Increase batch sizes',
          'Add more concurrent effects',
          'Optimize GPU workload distribution',
        ],
      })
    }

    return bottlenecks
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const frameMetrics = this.calculateFrameMetrics()

    if (frameMetrics.variance > 5) {
      recommendations.push(
        'Frame times are inconsistent - consider frame pacing'
      )
    }

    if (frameMetrics.p95FrameTime > frameMetrics.averageFrameTime * 1.5) {
      recommendations.push(
        'High frame time variance detected - check for periodic spikes'
      )
    }

    const errorRate = this.calculateErrorRate()
    if (errorRate > 1) {
      recommendations.push('High error rate detected - review error handling')
    }

    return recommendations
  }

  private recordBottleneck(type: string, description: string): void {
    this.bottlenecks.push({
      type,
      severity: 'warning',
      description,
      impact: 'medium',
      suggestions: [],
      timestamp: new Date(),
    })
  }
}

/**
 * Performance status information
 */
export interface PerformanceStatus {
  isHealthy: boolean
  frameRate: number
  memoryUsage: number
  errorRate: number
  bottlenecks: number
}

/**
 * Frame performance metrics
 */
export interface FrameMetrics {
  averageFrameTime: number
  minFrameTime: number
  maxFrameTime: number
  p95FrameTime: number
  frameRate: number
  variance: number
}

/**
 * Memory usage metrics
 */
export interface MemoryMetrics {
  averageUsage: number
  peakUsage: number
  leakRate: number
  trend: number
}

/**
 * GPU performance metrics
 */
export interface GPUMetrics {
  utilization: number
  memoryUsage: number
  drawCalls: number
  triangles: number
}

/**
 * Bottleneck detection information
 */
export interface BottleneckInfo {
  type: string
  severity: 'info' | 'warning' | 'critical'
  description: string
  impact: 'low' | 'medium' | 'high'
  suggestions: string[]
  timestamp?: Date
}

/**
 * Comprehensive performance report
 */
export interface PerformanceReport {
  frameMetrics: FrameMetrics
  memoryMetrics: MemoryMetrics
  gpuMetrics: GPUMetrics
  bottlenecks: BottleneckInfo[]
  recommendations: string[]
  timestamp: Date
}

/**
 * Performance validation utilities
 */
export class PerformanceValidator {
  /**
   * Validate that performance meets requirements
   */
  static validatePerformance(
    frameTimes: number[],
    targetFrameRate: number = 60
  ): Result<PerformanceValidation> {
    const targetFrameTime = 1000 / targetFrameRate

    if (frameTimes.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No frame time data available for validation',
        },
      }
    }

    const averageFrameTime =
      frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    const maxFrameTime = Math.max(...frameTimes)
    const _minFrameTime = Math.min(...frameTimes)

    // Calculate 95th percentile
    const sorted = [...frameTimes].sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p95FrameTime = sorted[p95Index] || maxFrameTime

    // Calculate variance
    const variance =
      frameTimes.reduce(
        (sum, time) => sum + Math.pow(time - averageFrameTime, 2),
        0
      ) / frameTimes.length

    const validation: PerformanceValidation = {
      meetsTarget: averageFrameTime <= targetFrameTime,
      averageFrameTime,
      targetFrameTime,
      maxFrameTime,
      p95FrameTime,
      variance,
      frameRate: averageFrameTime > 0 ? 1000 / averageFrameTime : 0,
      recommendations: [],
    }

    // Generate recommendations
    if (validation.frameRate < targetFrameRate * 0.8) {
      validation.recommendations.push(
        `Performance is ${(((targetFrameRate - validation.frameRate) / targetFrameRate) * 100).toFixed(1)}% below target`
      )
    }

    if (validation.variance > 5) {
      validation.recommendations.push(
        'High frame time variance detected - consider frame pacing'
      )
    }

    if (validation.p95FrameTime > targetFrameTime * 1.5) {
      validation.recommendations.push(
        'Frame time spikes detected - investigate periodic bottlenecks'
      )
    }

    return { success: true, data: validation }
  }

  /**
   * Detect memory leaks
   */
  static detectMemoryLeaks(
    memorySamples: number[],
    thresholdMB: number = 50
  ): Result<MemoryLeakInfo> {
    if (memorySamples.length < 20) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_DATA',
          message: 'Insufficient memory samples for leak detection',
        },
      }
    }

    const trend = this.calculateLinearTrend(memorySamples)
    const isLeaking = Math.abs(trend) > thresholdMB / 60 // MB per minute

    return {
      success: true,
      data: {
        isLeaking,
        leakRate: trend,
        samples: memorySamples.length,
        confidence: memorySamples.length > 50 ? 'high' : 'medium',
      },
    }
  }

  private static calculateLinearTrend(values: number[]): number {
    const n = values.length
    const x = Array.from({ length: n }, (_, i) => i)

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    return slope // MB per sample
  }
}

/**
 * Performance validation result
 */
export interface PerformanceValidation {
  meetsTarget: boolean
  averageFrameTime: number
  targetFrameTime: number
  maxFrameTime: number
  p95FrameTime: number
  variance: number
  frameRate: number
  recommendations: string[]
}

/**
 * Memory leak detection result
 */
export interface MemoryLeakInfo {
  isLeaking: boolean
  leakRate: number
  samples: number
  confidence: 'low' | 'medium' | 'high'
}
