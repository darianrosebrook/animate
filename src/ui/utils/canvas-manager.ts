import { CanvasConfig } from '@/types'

/**
 * Canvas manager for handling dynamic canvas sizing and configuration
 */
export class CanvasManager {
  private canvas: HTMLCanvasElement
  private container: HTMLElement
  private resizeObserver: ResizeObserver | null = null
  private config: Partial<CanvasConfig> = {}

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas
    this.container = container
    this.setupResizeObserver()
  }

  /**
   * Set canvas configuration
   */
  setConfig(config: Partial<CanvasConfig>): void {
    this.config = { ...this.config, ...config }
    this.updateCanvasSize()
  }

  /**
   * Get current canvas configuration
   */
  getConfig(): CanvasConfig {
    const rect = this.container.getBoundingClientRect()
    const devicePixelRatio = window.devicePixelRatio || 1

    return {
      width: rect.width,
      height: rect.height,
      devicePixelRatio,
      aspectRatio: rect.width / rect.height,
      ...this.config,
    }
  }

  /**
   * Get canvas size in logical pixels
   */
  getSize(): { width: number; height: number } {
    const config = this.getConfig()
    return {
      width: config.width,
      height: config.height,
    }
  }

  /**
   * Get canvas size in physical pixels (accounting for device pixel ratio)
   */
  getPhysicalSize(): { width: number; height: number } {
    const config = this.getConfig()
    return {
      width: config.width * config.devicePixelRatio,
      height: config.height * config.devicePixelRatio,
    }
  }

  /**
   * Update canvas size based on container dimensions
   */
  private updateCanvasSize(): void {
    const config = this.getConfig()
    const physicalSize = this.getPhysicalSize()

    // Set actual canvas dimensions
    this.canvas.width = physicalSize.width
    this.canvas.height = physicalSize.height

    // Set CSS size to maintain aspect ratio
    this.canvas.style.width = `${config.width}px`
    this.canvas.style.height = `${config.height}px`
  }

  /**
   * Setup resize observer to automatically adjust canvas size
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      // Fallback for browsers without ResizeObserver
      window.addEventListener('resize', () => this.updateCanvasSize())
      return
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize()
    })

    this.resizeObserver.observe(this.container)
  }

  /**
   * Get optimal canvas dimensions for a given aspect ratio
   */
  static getOptimalDimensions(
    containerWidth: number,
    containerHeight: number,
    targetAspectRatio: number = 16 / 9
  ): { width: number; height: number } {
    const containerAspectRatio = containerWidth / containerHeight

    let width: number
    let height: number

    if (containerAspectRatio > targetAspectRatio) {
      // Container is wider, fit height
      height = containerHeight
      width = height * targetAspectRatio
    } else {
      // Container is taller, fit width
      width = containerWidth
      height = width / targetAspectRatio
    }

    return { width: Math.floor(width), height: Math.floor(height) }
  }

  /**
   * Calculate canvas scale factor for high DPI displays
   */
  static getScaleFactor(): number {
    return window.devicePixelRatio || 1
  }

  /**
   * Check if canvas supports the given context type
   */
  static supportsContext(contextType: string): boolean {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext(contextType) ||
      canvas.getContext('experimental-' + contextType)
    )
  }

  /**
   * Cleanup resize observer
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  }
}

