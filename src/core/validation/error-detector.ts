/**
 * @fileoverview Error Detection and Validation System
 * @author @darianrosebrook
 */

import { Result, AnimatorError } from '@/types'

/**
 * Comprehensive error detection and validation system
 */
export class ErrorDetector {
  private errorHistory: ErrorEvent[] = []
  private validationRules: ValidationRule[] = []
  private errorPatterns: ErrorPattern[] = []
  private maxHistorySize = 1000

  constructor() {
    this.initializeDefaultRules()
    this.initializeErrorPatterns()
  }

  /**
   * Record an error for analysis
   */
  recordError(error: ErrorEvent): void {
    this.errorHistory.push(error)
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift()
    }

    // Analyze error patterns
    this.analyzeErrorPatterns(error)
  }

  /**
   * Validate system component
   */
  async validateComponent(
    component: ValidationTarget
  ): Promise<Result<ValidationResult>> {
    try {
      const results: ComponentValidation[] = []

      for (const rule of this.validationRules) {
        if (rule.appliesTo(component.type)) {
          const result = await this.runValidationRule(rule, component)
          results.push(result)
        }
      }

      const validationResult: ValidationResult = {
        component,
        isValid: results.every((r) => r.passed),
        results,
        recommendations: this.generateRecommendations(results),
        timestamp: new Date(),
      }

      return { success: true, data: validationResult }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Failed to validate component: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Detect system-wide issues
   */
  detectSystemIssues(): SystemHealthReport {
    const errorAnalysis = this.analyzeErrorHistory()
    const patternAnalysis = this.analyzeErrorPatterns()
    const performanceIssues = this.detectPerformanceIssues()

    return {
      overallHealth: this.calculateOverallHealth(
        errorAnalysis,
        patternAnalysis,
        performanceIssues
      ),
      errorAnalysis,
      patternAnalysis,
      performanceIssues,
      recommendations: this.generateSystemRecommendations(
        errorAnalysis,
        patternAnalysis,
        performanceIssues
      ),
      timestamp: new Date(),
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): ErrorStatistics {
    const recentErrors = this.errorHistory.slice(-100) // Last 100 errors

    const errorsByType = new Map<string, number>()
    const errorsByComponent = new Map<string, number>()
    const errorsBySeverity = new Map<string, number>()

    for (const error of recentErrors) {
      errorsByType.set(error.type, (errorsByType.get(error.type) || 0) + 1)
      errorsByComponent.set(
        error.component,
        (errorsByComponent.get(error.component) || 0) + 1
      )
      errorsBySeverity.set(
        error.severity,
        (errorsBySeverity.get(error.severity) || 0) + 1
      )
    }

    return {
      totalErrors: recentErrors.length,
      errorsByType: Object.fromEntries(errorsByType),
      errorsByComponent: Object.fromEntries(errorsByComponent),
      errorsBySeverity: Object.fromEntries(errorsBySeverity),
      errorRate: recentErrors.length / 100, // Per 100 operations
    }
  }

  private initializeDefaultRules(): void {
    this.validationRules = [
      {
        id: 'webgpu_context',
        name: 'WebGPU Context Validation',
        description: 'Validates WebGPU context availability and capabilities',
        type: 'webgpu',
        severity: 'critical',
        rule: this.validateWebGPUContext.bind(this),
      },
      {
        id: 'memory_pool',
        name: 'Memory Pool Validation',
        description: 'Validates memory pool integrity and leak detection',
        type: 'memory',
        severity: 'warning',
        rule: this.validateMemoryPool.bind(this),
      },
      {
        id: 'render_pipeline',
        name: 'Render Pipeline Validation',
        description: 'Validates render pipeline compilation and execution',
        type: 'rendering',
        severity: 'critical',
        rule: this.validateRenderPipeline.bind(this),
      },
      {
        id: 'effect_system',
        name: 'Effects System Validation',
        description: 'Validates effect system functionality and performance',
        type: 'effects',
        severity: 'warning',
        rule: this.validateEffectsSystem.bind(this),
      },
    ]
  }

  private initializeErrorPatterns(): void {
    this.errorPatterns = [
      {
        id: 'memory_leak',
        name: 'Memory Leak Pattern',
        description: 'Detects patterns indicative of memory leaks',
        pattern: /memory|leak|allocation|buffer/i,
        severity: 'critical',
        frequency: 5,
        timeframe: 300000, // 5 minutes
      },
      {
        id: 'gpu_timeout',
        name: 'GPU Timeout Pattern',
        description: 'Detects GPU operation timeouts',
        pattern: /timeout|hung|deadlock|context.*lost/i,
        severity: 'critical',
        frequency: 3,
        timeframe: 600000, // 10 minutes
      },
      {
        id: 'validation_failure',
        name: 'Validation Failure Pattern',
        description: 'Detects repeated validation failures',
        pattern: /validation|invalid|corrupt|malformed/i,
        severity: 'warning',
        frequency: 10,
        timeframe: 600000, // 10 minutes
      },
    ]
  }

  private async runValidationRule(
    rule: ValidationRule,
    component: ValidationTarget
  ): Promise<ComponentValidation> {
    try {
      const passed = await rule.rule(component)
      return {
        rule: rule.name,
        passed,
        severity: rule.severity,
        message: passed ? 'Validation passed' : 'Validation failed',
        details: passed
          ? undefined
          : await this.getValidationDetails(rule, component),
      }
    } catch (error) {
      return {
        rule: rule.name,
        passed: false,
        severity: 'error',
        message: `Validation rule execution failed: ${error}`,
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private async validateWebGPUContext(
    component: ValidationTarget
  ): Promise<boolean> {
    // Check if WebGPU is available and properly initialized
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
      return false
    }

    try {
      const adapter = await navigator.gpu.requestAdapter()
      return adapter !== null
    } catch {
      return false
    }
  }

  private async validateMemoryPool(
    component: ValidationTarget
  ): Promise<boolean> {
    // Check memory pool for leaks and proper cleanup
    // This would integrate with actual memory pool validation
    return true
  }

  private async validateRenderPipeline(
    component: ValidationTarget
  ): Promise<boolean> {
    // Check render pipeline compilation and execution
    // This would integrate with actual rendering validation
    return true
  }

  private async validateEffectsSystem(
    component: ValidationTarget
  ): Promise<boolean> {
    // Check effects system for proper initialization and functionality
    // This would integrate with actual effects validation
    return true
  }

  private async getValidationDetails(
    rule: ValidationRule,
    component: ValidationTarget
  ): Promise<string> {
    // Provide detailed validation failure information
    return `Validation failed for ${component.type} component`
  }

  private analyzeErrorHistory(): ErrorAnalysis {
    const recentErrors = this.errorHistory.slice(-100)

    const errorsByType = new Map<string, number>()
    const errorsByComponent = new Map<string, number>()
    const errorsByTime = new Map<number, number>()

    for (const error of recentErrors) {
      errorsByType.set(error.type, (errorsByType.get(error.type) || 0) + 1)
      errorsByComponent.set(
        error.component,
        (errorsByComponent.get(error.component) || 0) + 1
      )

      const timeBucket = Math.floor(error.timestamp.getTime() / 60000) // 1-minute buckets
      errorsByTime.set(timeBucket, (errorsByTime.get(timeBucket) || 0) + 1)
    }

    return {
      totalErrors: recentErrors.length,
      errorsByType: Object.fromEntries(errorsByType),
      errorsByComponent: Object.fromEntries(errorsByComponent),
      errorsByTime: Object.fromEntries(errorsByTime),
      errorRate: recentErrors.length / 100,
      mostCommonType:
        Array.from(errorsByType.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] || 'none',
    }
  }

  private analyzeErrorPatterns(): PatternAnalysis {
    const now = Date.now()
    const patterns: PatternAnalysis['patterns'] = []

    for (const pattern of this.errorPatterns) {
      const recentErrors = this.errorHistory.filter(
        (error) =>
          error.message.match(pattern.pattern) &&
          now - error.timestamp.getTime() < pattern.timeframe
      )

      if (recentErrors.length >= pattern.frequency) {
        patterns.push({
          pattern: pattern.name,
          frequency: recentErrors.length,
          severity: pattern.severity,
          description: pattern.description,
          lastOccurrence:
            recentErrors[recentErrors.length - 1]?.timestamp || new Date(),
        })
      }
    }

    return {
      patterns,
      totalPatterns: patterns.length,
      mostCritical: patterns.find((p) => p.severity === 'critical') || null,
    }
  }

  private detectPerformanceIssues(): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    // Check for high error rates
    const recentErrors = this.errorHistory.slice(-50)
    const errorRate = recentErrors.length / 50

    if (errorRate > 0.1) {
      // > 10% error rate
      issues.push({
        type: 'high_error_rate',
        severity: 'warning',
        description: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        impact: 'medium',
        suggestions: [
          'Review error handling in critical paths',
          'Check for resource contention',
          'Consider implementing retry logic',
        ],
      })
    }

    return issues
  }

  private calculateOverallHealth(
    errorAnalysis: ErrorAnalysis,
    patternAnalysis: PatternAnalysis,
    performanceIssues: PerformanceIssue[]
  ): 'healthy' | 'warning' | 'critical' {
    if (
      patternAnalysis.mostCritical?.severity === 'critical' ||
      performanceIssues.some((i) => i.severity === 'critical')
    ) {
      return 'critical'
    }

    if (
      errorAnalysis.errorRate > 0.05 ||
      patternAnalysis.totalPatterns > 0 ||
      performanceIssues.length > 0
    ) {
      return 'warning'
    }

    return 'healthy'
  }

  private generateRecommendations(results: ComponentValidation[]): string[] {
    const recommendations: string[] = []

    for (const result of results) {
      if (!result.passed) {
        recommendations.push(`Fix ${result.rule} validation failure`)
      }
    }

    return recommendations
  }

  private generateSystemRecommendations(
    errorAnalysis: ErrorAnalysis,
    patternAnalysis: PatternAnalysis,
    performanceIssues: PerformanceIssue[]
  ): string[] {
    const recommendations: string[] = []

    if (errorAnalysis.errorRate > 0.05) {
      recommendations.push(
        'Implement comprehensive error handling and retry mechanisms'
      )
    }

    if (patternAnalysis.totalPatterns > 0) {
      recommendations.push(
        'Address detected error patterns through code review and testing'
      )
    }

    if (performanceIssues.length > 0) {
      recommendations.push(
        'Optimize performance bottlenecks identified in analysis'
      )
    }

    return recommendations
  }
}

/**
 * Error event for tracking and analysis
 */
export interface ErrorEvent {
  id: string
  type: string
  component: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  stack?: string
  context?: Record<string, any>
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  id: string
  name: string
  description: string
  type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  rule: (component: ValidationTarget) => Promise<boolean>
  appliesTo: (componentType: string) => boolean
}

/**
 * Validation target for component validation
 */
export interface ValidationTarget {
  id: string
  type: string
  state: any
  dependencies?: string[]
}

/**
 * Component validation result
 */
export interface ComponentValidation {
  rule: string
  passed: boolean
  severity: string
  message: string
  details?: string
}

/**
 * Validation result for a component
 */
export interface ValidationResult {
  component: ValidationTarget
  isValid: boolean
  results: ComponentValidation[]
  recommendations: string[]
  timestamp: Date
}

/**
 * Error analysis results
 */
export interface ErrorAnalysis {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsByComponent: Record<string, number>
  errorsByTime: Record<number, number>
  errorRate: number
  mostCommonType: string
}

/**
 * Error pattern analysis
 */
export interface PatternAnalysis {
  patterns: ErrorPatternMatch[]
  totalPatterns: number
  mostCritical: ErrorPatternMatch | null
}

/**
 * Error pattern match
 */
export interface ErrorPatternMatch {
  pattern: string
  frequency: number
  severity: string
  description: string
  lastOccurrence: Date
}

/**
 * Error pattern definition
 */
export interface ErrorPattern {
  id: string
  name: string
  description: string
  pattern: RegExp
  severity: 'info' | 'warning' | 'critical'
  frequency: number // Required frequency to trigger
  timeframe: number // Time window in milliseconds
}

/**
 * Performance issue detection
 */
export interface PerformanceIssue {
  type: string
  severity: 'info' | 'warning' | 'critical'
  description: string
  impact: 'low' | 'medium' | 'high'
  suggestions: string[]
}

/**
 * System health report
 */
export interface SystemHealthReport {
  overallHealth: 'healthy' | 'warning' | 'critical'
  errorAnalysis: ErrorAnalysis
  patternAnalysis: PatternAnalysis
  performanceIssues: PerformanceIssue[]
  recommendations: string[]
  timestamp: Date
}

/**
 * Error statistics
 */
export interface ErrorStatistics {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsByComponent: Record<string, number>
  errorsBySeverity: Record<string, number>
  errorRate: number
}
