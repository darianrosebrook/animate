import { logger } from '@/core/logging/logger'
/**
 * @fileoverview Centralized Logging System
 * @description Professional logging utility with levels, formatting, and performance monitoring
 * @author @darianrosebrook
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: Error
  performance?: {
    duration: number
    memoryUsage?: number
  }
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enablePerformance: boolean
  enableMemoryTracking: boolean
  maxEntries: number
  context?: Record<string, unknown>
}

/**
 * Centralized logging system for the Animator platform
 */
export class Logger {
  private static instance: Logger
  private config: LoggerConfig
  private entries: LogEntry[] = []
  private performanceMarks: Map<string, number> = new Map()

  private constructor(config: LoggerConfig) {
    this.config = config
  }

  /**
   * Get singleton logger instance
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      const defaultConfig: LoggerConfig = {
        level: LogLevel.INFO,
        enableConsole: true,
        enablePerformance: true,
        enableMemoryTracking: false,
        maxEntries: 1000,
        context: {},
      }
      Logger.instance = new Logger({ ...defaultConfig, ...config })
    }
    return Logger.instance
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    // Prevent infinite recursion
    if (message.includes('Effects timeline integration destroyed')) {
      console.log(`[${new Date().toISOString()}] INFO: ${message}`)
      return
    }
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, context, error)
  }

  /**
   * Start performance timing
   */
  startTiming(label: string): void {
    if (this.config.enablePerformance) {
      this.performanceMarks.set(label, performance.now())
    }
  }

  /**
   * End performance timing and log duration
   */
  endTiming(label: string, message?: string): number {
    if (!this.config.enablePerformance) return 0

    const startTime = this.performanceMarks.get(label)
    if (!startTime) {
      this.warn(`Performance timing '${label}' was not started`)
      return 0
    }

    const duration = performance.now() - startTime
    this.performanceMarks.delete(label)

    const logMessage = message || `Performance: ${label}`
    this.log(LogLevel.INFO, logMessage, undefined, undefined, {
      duration,
      memoryUsage: this.config.enableMemoryTracking ? this.getMemoryUsage() : undefined,
    })

    return duration
  }

  /**
   * Log performance metric
   */
  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.log(LogLevel.INFO, `Performance: ${metric}`, { value, unit })
  }

  /**
   * Get recent log entries
   */
  getEntries(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.entries

    if (level !== undefined) {
      filtered = filtered.filter((entry) => entry.level >= level)
    }

    if (limit) {
      filtered = filtered.slice(-limit)
    }

    return filtered
  }

  /**
   * Clear log entries
   */
  clear(): void {
    this.entries = []
  }

  /**
   * Export logs as JSON
   */
  export(): string {
    return JSON.stringify(this.entries, null, 2)
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
    performance?: { duration: number; memoryUsage?: number }
  ): void {
    // Check if we should log this level
    if (level < this.config.level) return

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: { ...this.config.context, ...context },
      error,
      performance,
    }

    // Add to entries
    this.entries.push(entry)

    // Maintain max entries limit
    if (this.entries.length > this.config.maxEntries) {
      this.entries.shift()
    }

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry)
    }
  }

  /**
   * Format and output to console
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const levelName = LogLevel[entry.level]
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    const errorStr = entry.error ? `\n${entry.error.stack}` : ''
    const perfStr = entry.performance
      ? ` [${entry.performance.duration.toFixed(2)}ms${
          entry.performance.memoryUsage ? `, ${entry.performance.memoryUsage}MB` : ''
        }]`
      : ''

    const message = `[${timestamp}] ${levelName}: ${entry.message}${contextStr}${perfStr}${errorStr}`

    switch (entry.level) {
      case LogLevel.DEBUG:
        logger.debug(message)
        break
      case LogLevel.INFO:
        logger.info(message)
        break
      case LogLevel.WARN:
        logger.warn(message)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        logger.error(message)
        break
    }
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number | undefined {
    if (!this.config.enableMemoryTracking) return undefined

    // @ts-ignore - performance.memory is not in all browsers
    const memory = performance.memory
    if (memory) {
      return Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
    }

    return undefined
  }
}

/**
 * Convenience functions for common logging patterns
 */
export const logger = Logger.getInstance()

/**
 * Create a scoped logger with additional context
 */
export function createScopedLogger(context: Record<string, unknown>): Logger {
  const scopedLogger = Logger.getInstance()
  scopedLogger.configure({ context: { ...scopedLogger['config'].context, ...context } })
  return scopedLogger
}

/**
 * Performance decorator for functions
 */
export function logPerformance<T extends (...args: any[]) => any>(
  fn: T,
  label?: string
): T {
  return ((...args: any[]) => {
    const timingLabel = label || fn.name || 'anonymous'
    logger.startTiming(timingLabel)
    try {
      const result = fn(...args)
      if (result instanceof Promise) {
        return result.finally(() => logger.endTiming(timingLabel))
      } else {
        logger.endTiming(timingLabel)
        return result
      }
    } catch (error) {
      logger.endTiming(timingLabel)
      throw error
    }
  }) as T
}

/**
 * Error boundary logging
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  logger.error('Unhandled error', error, context)
}

/**
 * Initialize logging system
 */
export function initializeLogging(config?: Partial<LoggerConfig>): Logger {
  const logger = Logger.getInstance(config)
  
  // Set up global error handling
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logger.error('Global error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection', event.reason, {
        promise: event.promise,
      })
    })
  }

  return logger
}
