/**
 * @fileoverview GPU Memory Pool for Efficient Resource Management
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { WebGPUContext } from './webgpu-context'
import { logger } from '@/core/logging/logger'

/**
 * Memory pool entry for tracking allocations
 */
export interface MemoryPoolEntry {
  buffer: GPUBuffer
  size: number
  usage: GPUBufferUsageFlags
  inUse: boolean
  lastUsed: number
  id: string
}

/**
 * Memory pool configuration
 */
export interface MemoryPoolConfig {
  initialSize: number
  maxSize: number
  growthFactor: number
  cleanupThreshold: number
  maxAge: number // ms
}

/**
 * High-performance GPU memory pool
 */
export class MemoryPool {
  private webgpuContext: WebGPUContext
  private pools: Map<GPUBufferUsageFlags, MemoryPoolEntry[]> = new Map()
  private config: MemoryPoolConfig
  private totalAllocated = 0
  private nextId = 0

  constructor(
    webgpuContext: WebGPUContext,
    config: Partial<MemoryPoolConfig> = {}
  ) {
    this.webgpuContext = webgpuContext
    this.config = {
      initialSize: 1024 * 1024, // 1MB
      maxSize: 256 * 1024 * 1024, // 256MB
      growthFactor: 1.5,
      cleanupThreshold: 0.8,
      maxAge: 30000, // 30 seconds
      ...config,
    }
  }

  /**
   * Initialize memory pool
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      logger.info(
        '💾 Memory pool initialized for efficient GPU resource management'
      )
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MEMORY_POOL_INIT_ERROR',
          message: `Failed to initialize memory pool: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Allocate buffer from pool or create new one
   */
  allocateBuffer(
    usage: GPUBufferUsageFlags,
    size: number,
    label?: string
  ): Result<GPUBuffer> {
    try {
      const device = this.webgpuContext.getDevice()!
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for buffer allocation',
          },
        }
      }

      // Try to find a suitable buffer in the pool
      const pool = this.pools.get(usage) || []
      const availableBuffer = pool.find(
        (entry) =>
          !entry.inUse &&
          entry.size >= size &&
          performance.now() - entry.lastUsed < this.config.maxAge
      )

      if (availableBuffer) {
        availableBuffer.inUse = true
        availableBuffer.lastUsed = performance.now()
        this.totalAllocated += availableBuffer.size
        return { success: true, data: availableBuffer.buffer }
      }

      // Create new buffer
      const buffer = device.createBuffer({
        size,
        usage,
        label: label || `PooledBuffer_${this.nextId++}`,
        mappedAtCreation: false,
      })

      const entry: MemoryPoolEntry = {
        buffer,
        size,
        usage,
        inUse: true,
        lastUsed: performance.now(),
        id: `pool_${this.nextId++}`,
      }

      if (!this.pools.has(usage)) {
        this.pools.set(usage, [])
      }
      this.pools.get(usage)!.push(entry)
      this.totalAllocated += size

      return { success: true, data: buffer }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BUFFER_ALLOCATION_ERROR',
          message: `Failed to allocate buffer: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Return buffer to pool
   */
  returnBuffer(buffer: GPUBuffer): void {
    // Find the entry for this buffer
    for (const pool of this.pools.values()) {
      const entry = pool.find((e) => e.buffer === buffer)
      if (entry) {
        entry.inUse = false
        entry.lastUsed = performance.now()
        this.totalAllocated -= entry.size
        return
      }
    }
  }

  /**
   * Clean up old unused buffers
   */
  cleanup(): void {
    const now = performance.now()
    let cleanedCount = 0

    for (const [usage, pool] of this.pools) {
      // Remove entries that are too old or exceed pool size
      const filteredPool = pool.filter((entry) => {
        const shouldKeep =
          entry.inUse || now - entry.lastUsed < this.config.maxAge

        if (!shouldKeep) {
          cleanedCount++
          this.totalAllocated -= entry.size
        }

        return shouldKeep
      })

      this.pools.set(usage, filteredPool)
    }

    if (cleanedCount > 0) {
      logger.info(
        `🧹 Memory pool cleanup: removed ${cleanedCount} unused buffers`
      )
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    totalAllocated: number
    poolsCount: number
    entriesCount: number
    utilizationRate: number
  } {
    let totalEntries = 0
    let inUseEntries = 0

    for (const pool of this.pools.values()) {
      totalEntries += pool.length
      inUseEntries += pool.filter((e) => e.inUse).length
    }

    return {
      totalAllocated: this.totalAllocated,
      poolsCount: this.pools.size,
      entriesCount: totalEntries,
      utilizationRate: totalEntries > 0 ? inUseEntries / totalEntries : 0,
    }
  }

  /**
   * Force garbage collection of unused buffers
   */
  forceCleanup(): void {
    const initialCount = this.getMemoryStats().entriesCount
    this.cleanup()

    const finalCount = this.getMemoryStats().entriesCount
    const cleanedCount = initialCount - finalCount

    if (cleanedCount > 0) {
      logger.info(
        `🔧 Memory pool force cleanup: removed ${cleanedCount} buffers`
      )
    }
  }

  /**
   * Get pool statistics for monitoring
   */
  getPoolStats(): {
    [usage: number]: { count: number; size: number; inUse: number }
  } {
    const stats: {
      [usage: number]: { count: number; size: number; inUse: number }
    } = {}

    for (const [usage, pool] of this.pools) {
      const inUseCount = pool.filter((e) => e.inUse).length
      const totalSize = pool.reduce((sum, e) => sum + e.size, 0)

      stats[usage] = {
        count: pool.length,
        size: totalSize,
        inUse: inUseCount,
      }
    }

    return stats
  }

  /**
   * Optimize pool sizes based on usage patterns
   */
  optimizePools(): void {
    const stats = this.getMemoryStats()

    // If utilization is low, clean up more aggressively
    if (stats.utilizationRate < 0.5) {
      this.config.maxAge = Math.max(5000, this.config.maxAge * 0.8) // Reduce max age
      this.forceCleanup()
    } else if (stats.utilizationRate > 0.9) {
      // If utilization is high, increase max age to keep buffers longer
      this.config.maxAge = Math.min(60000, this.config.maxAge * 1.2)
    }
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    const stats = this.getMemoryStats()

    if (stats.utilizationRate < 0.3) {
      recommendations.push(
        'Low memory pool utilization - consider reducing pool sizes'
      )
    }

    if (stats.totalAllocated > this.config.maxSize * 0.9) {
      recommendations.push(
        'High memory usage - consider increasing max pool size'
      )
    }

    if (stats.entriesCount > 1000) {
      recommendations.push(
        'Large number of pool entries - consider more aggressive cleanup'
      )
    }

    return recommendations
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    for (const pool of this.pools.values()) {
      for (const _entry of pool) {
        // WebGPU buffers are automatically cleaned up
      }
    }

    this.pools.clear()
    this.totalAllocated = 0
  }
}
