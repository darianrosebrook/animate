/**
 * @fileoverview Effects Performance Monitor Tests
 * @description Comprehensive unit tests for performance monitoring system
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  EffectsPerformanceMonitor,
  createDefaultPerformanceMonitor,
} from '../src/effects/effects-performance-monitor'

// Mock logger to prevent infinite recursion
vi.mock('../src/core/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe.skip('EffectsPerformanceMonitor', () => {
  let monitor: EffectsPerformanceMonitor

  beforeEach(() => {
    monitor = createDefaultPerformanceMonitor()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should create monitor with default budget', () => {
      const budget = monitor.getBudget()

      expect(budget.maxRenderTime).toBe(16)
      expect(budget.maxMemoryUsage).toBe(256 * 1024 * 1024)
      expect(budget.maxGpuMemoryUsage).toBe(512 * 1024 * 1024)
      expect(budget.warningThreshold).toBe(0.8)
    })

    it('should create monitor with custom budget', () => {
      const customMonitor = new EffectsPerformanceMonitor({
        maxRenderTime: 8,
        maxMemoryUsage: 128 * 1024 * 1024,
      })

      const budget = customMonitor.getBudget()
      expect(budget.maxRenderTime).toBe(8)
      expect(budget.maxMemoryUsage).toBe(128 * 1024 * 1024)
    })

    it('should start enabled by default', () => {
      expect(monitor.isEnabled()).toBe(true)
    })
  })

  describe('Metrics Recording', () => {
    it('should record performance metrics', () => {
      monitor.recordMetrics('effect-1', 'glow', 10, 100 * 1024 * 1024, 200 * 1024 * 1024)

      const result = monitor.getEffectStatistics('effect-1')
      expect(result.success).toBe(true)
      expect(result.data?.averageRenderTime).toBe(10)
      expect(result.data?.totalFrames).toBe(1)
    })

    it('should record multiple metrics for same effect', () => {
      monitor.recordMetrics('effect-1', 'glow', 10, 0, 0)
      monitor.recordMetrics('effect-1', 'glow', 12, 0, 0)
      monitor.recordMetrics('effect-1', 'glow', 14, 0, 0)

      const result = monitor.getEffectStatistics('effect-1')
      expect(result.success).toBe(true)
      expect(result.data?.averageRenderTime).toBe(12)
      expect(result.data?.totalFrames).toBe(3)
    })

    it('should not record metrics when disabled', () => {
      monitor.setEnabled(false)
      monitor.recordMetrics('effect-1', 'glow', 10, 0, 0)

      const result = monitor.getEffectStatistics('effect-1')
      expect(result.success).toBe(false)
    })

    it('should maintain max metrics limit', () => {
      // Record more than max metrics (1000)
      for (let i = 0; i < 1500; i++) {
        monitor.recordMetrics('effect-1', 'glow', 10, 0, 0)
      }

      const result = monitor.getEffectStatistics('effect-1')
      expect(result.success).toBe(true)
      expect(result.data?.totalFrames).toBeLessThanOrEqual(1000)
    })
  })

  describe('Budget Violations', () => {
    it('should create warning alert for render time threshold', () => {
      const warningThreshold = 16 * 0.8 // 12.8ms
      monitor.recordMetrics('effect-1', 'glow', warningThreshold + 0.1, 0, 0)

      const alerts = monitor.getAlerts()
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0].type).toBe('warning')
      expect(alerts[0].metric).toBe('renderTime')
    })

    it('should create critical alert for render time budget exceed', () => {
      monitor.recordMetrics('effect-1', 'glow', 17, 0, 0) // Exceeds 16ms

      const alerts = monitor.getAlerts()
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0].type).toBe('critical')
      expect(alerts[0].metric).toBe('renderTime')
    })

    it('should track dropped frames', () => {
      monitor.recordMetrics('effect-1', 'glow', 17, 0, 0) // Dropped
      monitor.recordMetrics('effect-1', 'glow', 10, 0, 0) // OK
      monitor.recordMetrics('effect-1', 'glow', 18, 0, 0) // Dropped

      const stats = monitor.getOverallStatistics()
      expect(stats.droppedFrames).toBe(2)
    })

    it('should create alert for memory usage exceed', () => {
      const criticalMemory = 256 * 1024 * 1024 + 1 // Just over 256MB
      monitor.recordMetrics('effect-1', 'glow', 10, criticalMemory, 0)

      const alerts = monitor.getAlerts()
      expect(alerts.some((a) => a.metric === 'memoryUsage')).toBe(true)
    })

    it('should create alert for GPU memory usage exceed', () => {
      const criticalGpuMemory = 512 * 1024 * 1024 + 1 // Just over 512MB
      monitor.recordMetrics('effect-1', 'glow', 10, 0, criticalGpuMemory)

      const alerts = monitor.getAlerts()
      expect(alerts.some((a) => a.metric === 'gpuMemoryUsage')).toBe(true)
    })

    it('should maintain max 100 alerts', () => {
      // Generate 150 alerts
      for (let i = 0; i < 150; i++) {
        monitor.recordMetrics(`effect-${i}`, 'glow', 20, 0, 0) // Critical
      }

      const alerts = monitor.getAlerts()
      expect(alerts.length).toBeLessThanOrEqual(100)
    })
  })

  describe('Statistics', () => {
    it('should calculate correct statistics', () => {
      monitor.recordMetrics('effect-1', 'glow', 10, 100 * 1024 * 1024, 200 * 1024 * 1024)
      monitor.recordMetrics('effect-1', 'glow', 12, 120 * 1024 * 1024, 220 * 1024 * 1024)
      monitor.recordMetrics('effect-1', 'glow', 14, 140 * 1024 * 1024, 240 * 1024 * 1024)

      const result = monitor.getEffectStatistics('effect-1')
      expect(result.success).toBe(true)
      expect(result.data?.averageRenderTime).toBe(12)
      expect(result.data?.minRenderTime).toBe(10)
      expect(result.data?.maxRenderTime).toBe(14)
    })

    it('should calculate percentiles correctly', () => {
      // Add 100 metrics with varying render times
      for (let i = 1; i <= 100; i++) {
        monitor.recordMetrics('effect-1', 'glow', i, 0, 0)
      }

      const result = monitor.getEffectStatistics('effect-1')
      expect(result.success).toBe(true)
      expect(result.data?.p95RenderTime).toBeGreaterThan(90)
      expect(result.data?.p99RenderTime).toBeGreaterThan(95)
    })

    it('should return error for non-existent effect', () => {
      const result = monitor.getEffectStatistics('nonexistent')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('NO_METRICS')
    })

    it('should calculate overall statistics', () => {
      monitor.recordMetrics('effect-1', 'glow', 10, 0, 0)
      monitor.recordMetrics('effect-2', 'blur', 12, 0, 0)
      monitor.recordMetrics('effect-3', 'color', 14, 0, 0)

      const stats = monitor.getOverallStatistics()
      expect(stats.effectCount).toBe(3)
      expect(stats.totalFrames).toBe(3)
      expect(stats.averageRenderTime).toBe(12)
    })

    it('should handle empty statistics', () => {
      const stats = monitor.getOverallStatistics()
      expect(stats.totalFrames).toBe(0)
      expect(stats.averageRenderTime).toBe(0)
      expect(stats.effectCount).toBe(0)
    })
  })

  describe('Alert Management', () => {
    it('should retrieve recent alerts', () => {
      monitor.recordMetrics('effect-1', 'glow', 20, 0, 0) // Critical
      monitor.recordMetrics('effect-2', 'blur', 20, 0, 0) // Critical

      const alerts = monitor.getAlerts(1)
      expect(alerts.length).toBe(1)
    })

    it('should clear all alerts', () => {
      monitor.recordMetrics('effect-1', 'glow', 20, 0, 0)
      monitor.clearAlerts()

      const alerts = monitor.getAlerts()
      expect(alerts.length).toBe(0)
    })

    it('should include alert details', () => {
      monitor.recordMetrics('effect-1', 'glow', 20, 0, 0)

      const alerts = monitor.getAlerts()
      expect(alerts[0].effectId).toBe('effect-1')
      expect(alerts[0].actualValue).toBe(20)
      expect(alerts[0].budgetValue).toBe(16)
      expect(alerts[0].message).toContain('CRITICAL')
    })
  })

  describe('Metrics Management', () => {
    it('should clear effect metrics', () => {
      monitor.recordMetrics('effect-1', 'glow', 10, 0, 0)
      monitor.recordMetrics('effect-2', 'blur', 12, 0, 0)

      monitor.clearEffectMetrics('effect-1')

      const result1 = monitor.getEffectStatistics('effect-1')
      const result2 = monitor.getEffectStatistics('effect-2')

      expect(result1.success).toBe(false)
      expect(result2.success).toBe(true)
    })

    it('should clear all metrics', () => {
      monitor.recordMetrics('effect-1', 'glow', 10, 0, 0)
      monitor.recordMetrics('effect-2', 'blur', 12, 0, 0)

      monitor.clearAllMetrics()

      const stats = monitor.getOverallStatistics()
      expect(stats.totalFrames).toBe(0)
      expect(stats.effectCount).toBe(0)
    })
  })

  describe('Budget Management', () => {
    it('should update budget', () => {
      monitor.updateBudget({ maxRenderTime: 8 })

      const budget = monitor.getBudget()
      expect(budget.maxRenderTime).toBe(8)
      expect(budget.maxMemoryUsage).toBe(256 * 1024 * 1024) // Unchanged
    })

    it('should use updated budget for alerts', () => {
      monitor.updateBudget({ maxRenderTime: 10 })
      monitor.recordMetrics('effect-1', 'glow', 11, 0, 0)

      const alerts = monitor.getAlerts()
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0].budgetValue).toBe(10)
    })
  })

  describe('Enable/Disable', () => {
    it('should disable monitoring', () => {
      monitor.setEnabled(false)
      expect(monitor.isEnabled()).toBe(false)
    })

    it('should re-enable monitoring', () => {
      monitor.setEnabled(false)
      monitor.setEnabled(true)
      expect(monitor.isEnabled()).toBe(true)
    })
  })

  describe('Export and Reporting', () => {
    it('should export metrics as JSON', () => {
      monitor.recordMetrics('effect-1', 'glow', 10, 0, 0)

      const json = monitor.exportMetrics()
      const data = JSON.parse(json)

      expect(data.budget).toBeDefined()
      expect(data.overallStats).toBeDefined()
      expect(data.effectMetrics).toBeDefined()
      expect(data.alerts).toBeDefined()
    })

    it('should generate performance report', () => {
      monitor.recordMetrics('effect-1', 'glow', 10, 100 * 1024 * 1024, 200 * 1024 * 1024)
      monitor.recordMetrics('effect-1', 'glow', 12, 100 * 1024 * 1024, 200 * 1024 * 1024)

      const report = monitor.generateReport()

      expect(report).toContain('Effects Performance Report')
      expect(report).toContain('Total Frames:')
      expect(report).toContain('Render Time:')
      expect(report).toContain('Memory Usage:')
      expect(report).toContain('GPU Memory Usage:')
    })

    it('should show passing status in report', () => {
      monitor.recordMetrics('effect-1', 'glow', 10, 0, 0)

      const report = monitor.generateReport()
      expect(report).toContain('✅ PASSING')
    })

    it('should show failing status in report', () => {
      monitor.recordMetrics('effect-1', 'glow', 20, 0, 0) // Exceeds budget

      const report = monitor.generateReport()
      expect(report).toContain('❌ FAILING')
    })

    it('should include recent alerts in report', () => {
      monitor.recordMetrics('effect-1', 'glow', 20, 0, 0) // Critical alert

      const report = monitor.generateReport()
      expect(report).toContain('Recent Alerts:')
      expect(report).toContain('CRITICAL')
    })
  })
})

describe.skip('Performance Monitor Utilities', () => {
  it('should create default performance monitor', () => {
    const monitor = createDefaultPerformanceMonitor()

    const budget = monitor.getBudget()
    expect(budget.maxRenderTime).toBe(16)
    expect(budget.maxMemoryUsage).toBe(256 * 1024 * 1024)
    expect(budget.maxGpuMemoryUsage).toBe(512 * 1024 * 1024)
    expect(budget.warningThreshold).toBe(0.8)
  })
})

