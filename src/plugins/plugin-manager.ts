/**
 * @fileoverview Plugin Manager Implementation
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { logger } from '@/core/logging/logger'
import {
  PluginManager as IPluginManager,
  PluginManifest,
  PluginInstance,
  PluginState,
  PluginMessage,
  PluginEvent,
  PluginSystemStats,
  PluginSystemEvent,
} from './plugin-types'
import { PluginSandbox, PluginSandboxFactory } from './plugin-sandbox'

/**
 * Plugin manager implementation
 */
export class PluginManager implements IPluginManager {
  private plugins: Map<string, PluginInstance> = new Map()
  private sandboxedPlugins: Map<string, PluginSandbox> = new Map()
  private registeredAPIs: Map<string, any> = new Map()
  private eventListeners: Map<string, Set<Function>> = new Map()
  private pendingPromises: Map<
    string,
    {
      resolve: Function
      reject: Function
      timeout: NodeJS.Timeout
    }
  > = new Map()

  constructor() {
    this.setupGlobalEventHandling()
  }

  /**
   * Load a plugin from manifest
   */
  async loadPlugin(manifest: PluginManifest): Promise<Result<PluginInstance>> {
    try {
      logger.info(`🔌 Loading plugin: ${manifest.name} (${manifest.id})`)

      // Check if plugin is already loaded
      if (this.plugins.has(manifest.id)) {
        return {
          success: false,
          error: {
            code: 'PLUGIN_ALREADY_LOADED',
            message: `Plugin ${manifest.id} is already loaded`,
          },
        }
      }

      // Validate manifest
      const validation = PluginSandboxFactory.validateManifest(manifest)
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'MANIFEST_INVALID',
            message: `Invalid manifest: ${validation.errors.join(', ')}`,
          },
        }
      }

      // Create resource limits based on permissions
      const resourceLimits = this.calculateResourceLimits(manifest)

      // Create plugin sandbox
      const sandbox = PluginSandboxFactory.createSandbox(
        manifest,
        manifest.permissions as any,
        resourceLimits
      )

      // Initialize sandbox
      const initResult = await sandbox.initialize()
      if (!initResult.success) {
        return initResult
      }

      // Store sandbox reference
      this.sandboxedPlugins.set(manifest.id, sandbox)

      // Create plugin instance
      const pluginInstance: PluginInstance = {
        manifest,
        state: {
          id: manifest.id,
          status: 'loading',
          permissions: manifest.permissions as any,
          sandbox,
          metrics: {
            loadTime: 0,
            executionTime: 0,
            memoryUsage: 0,
            networkRequests: 0,
            errorCount: 0,
            lastExecuted: null,
          },
          settings: {},
        },
        api: this.createPluginAPI(manifest.id, sandbox),
        ui: manifest.ui ? this.createPluginUI(manifest.id, sandbox) : undefined,
      }

      // Load plugin script in sandbox
      await this.loadPluginScript(pluginInstance)

      // Register plugin
      this.plugins.set(manifest.id, pluginInstance)

      // Emit plugin loaded event
      this.emitEvent(PluginSystemEvent.PluginLoaded, {
        pluginId: manifest.id,
        manifest,
      })

      logger.info(`✅ Plugin loaded: ${manifest.name} (${manifest.id})`)
      return { success: true, data: pluginInstance }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLUGIN_LOAD_ERROR',
          message: `Failed to load plugin: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<Result<void>> {
    try {
      logger.info(`🔌 Unloading plugin: ${pluginId}`)

      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        return {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin ${pluginId} not found`,
          },
        }
      }

      // Clean up plugin resources
      if (plugin.ui) {
        await plugin.ui.hide()
      }

      if (plugin.state.sandbox) {
        plugin.state.sandbox.destroy()
      }

      // Remove from registry
      this.plugins.delete(pluginId)
      this.sandboxedPlugins.delete(pluginId)

      // Clean up pending promises
      for (const [messageId, promise] of this.pendingPromises) {
        if (messageId.startsWith(`${pluginId}:`)) {
          clearTimeout(promise.timeout)
          promise.reject(new Error('Plugin unloaded'))
          this.pendingPromises.delete(messageId)
        }
      }

      // Emit plugin unloaded event
      this.emitEvent(PluginSystemEvent.PluginUnloaded, {
        pluginId,
      })

      logger.info(`✅ Plugin unloaded: ${pluginId}`)
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLUGIN_UNLOAD_ERROR',
          message: `Failed to unload plugin: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Reload a plugin
   */
  async reloadPlugin(pluginId: string): Promise<Result<void>> {
    try {
      logger.info(`🔄 Reloading plugin: ${pluginId}`)

      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        return {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin ${pluginId} not found`,
          },
        }
      }

      // Unload and reload
      await this.unloadPlugin(pluginId)
      const reloadResult = await this.loadPlugin(plugin.manifest)

      if (!reloadResult.success) {
        return reloadResult
      }

      logger.info(`✅ Plugin reloaded: ${pluginId}`)
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLUGIN_RELOAD_ERROR',
          message: `Failed to reload plugin: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get plugin instance
   */
  getPlugin(pluginId: string): PluginInstance | null {
    return this.plugins.get(pluginId) || null
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Call plugin API method
   */
  async callPluginAPI(
    pluginId: string,
    method: string,
    args: any[]
  ): Promise<any> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (plugin.state.status !== 'active') {
      throw new Error(`Plugin ${pluginId} is not active`)
    }

    // Check if sandbox enforces resource limits
    if (plugin.state.sandbox && !plugin.state.sandbox.enforceResourceLimits()) {
      throw new Error(`Plugin ${pluginId} exceeded resource limits`)
    }

    // Create API call message
    const messageId = `${pluginId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
    const message: PluginMessage = {
      id: messageId,
      type: 'api-call',
      pluginId,
      method,
      args,
      timestamp: Date.now(),
      source: 'main',
    }

    // Set up promise for response
    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingPromises.delete(messageId)
        reject(new Error(`Plugin API call timed out: ${method}`))
      }, 30000) // 30 second timeout

      this.pendingPromises.set(messageId, { resolve, reject, timeout })
    })

    // Send message to plugin
    plugin.state.sandbox?.sendMessage(message)

    // Update plugin metrics
    plugin.state.metrics.executionTime += performance.now()
    plugin.state.metrics.lastExecuted = new Date()

    return promise
  }

  /**
   * Broadcast event to all plugins
   */
  broadcastEvent(event: PluginEvent): void {
    this.emitEvent('plugin-broadcast', event)
  }

  /**
   * Get plugin state
   */
  getPluginState(pluginId: string): PluginState | null {
    const plugin = this.plugins.get(pluginId)
    return plugin ? plugin.state : null
  }

  /**
   * Update plugin state
   */
  updatePluginState(pluginId: string, state: Partial<PluginState>): void {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      plugin.state = { ...plugin.state, ...state }
    }
  }

  /**
   * Register API for plugins to use
   */
  registerAPI(apiName: string, implementation: any): void {
    this.registeredAPIs.set(apiName, implementation)
    logger.info(`🔗 Registered API: ${apiName}`)
  }

  /**
   * Get available APIs
   */
  getAvailableAPIs(): string[] {
    return Array.from(this.registeredAPIs.keys())
  }

  /**
   * Get system statistics
   */
  getSystemStats(): PluginSystemStats {
    const plugins = Array.from(this.plugins.values())
    const activePlugins = plugins.filter((p) => p.state.status === 'active')

    return {
      totalPlugins: plugins.length,
      activePlugins: activePlugins.length,
      pluginsByType: this.getPluginsByType(),
      totalAPICalls: plugins.reduce(
        (sum, p) => sum + p.state.metrics.executionTime,
        0
      ),
      averageResponseTime: this.calculateAverageResponseTime(),
      errorRate: this.calculateErrorRate(),
      resourceUsage: this.calculateResourceUsage(),
    }
  }

  private async loadPluginScript(
    pluginInstance: PluginInstance
  ): Promise<void> {
    const { manifest, state } = pluginInstance

    // Send plugin loaded message to sandbox
    state.sandbox?.sendMessage({
      id: `load_${Date.now()}`,
      type: 'event',
      pluginId: manifest.id,
      eventType: 'plugin-loaded',
      payload: {
        manifest,
        apis: Array.from(this.registeredAPIs.keys()),
      },
      timestamp: Date.now(),
      source: 'main',
    })

    // Wait for plugin to signal ready
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        state.status = 'error'
        reject(new Error('Plugin failed to initialize'))
      }, 10000) // 10 second timeout

      const readyHandler = (event: CustomEvent) => {
        if (
          event.detail.pluginId === manifest.id &&
          event.detail.eventType === 'plugin-ready'
        ) {
          clearTimeout(timeout)
          state.status = 'active'
          state.metrics.loadTime = performance.now()
          window.removeEventListener(
            'plugin-event',
            readyHandler as EventListener
          )
          resolve()
        }
      }

      window.addEventListener('plugin-event', readyHandler as EventListener)
    })
  }

  private createPluginAPI(pluginId: string, sandbox: PluginSandbox): any {
    const manager = this

    return {
      async callMainAPI(method: string, ...args: any[]) {
        return manager.callPluginAPI(pluginId, method, args)
      },

      onMainEvent(eventType: string, callback: Function) {
        manager.subscribeToEvent(`${pluginId}:${eventType}`, callback)
      },

      offMainEvent(eventType: string, callback: Function) {
        manager.unsubscribeFromEvent(`${pluginId}:${eventType}`, callback)
      },

      log(message: string, level: string = 'info') {
        logger[level as keyof typeof logger]?.(`[${pluginId}] ${message}`)
      },

      notify(message: string, type: string = 'info') {
        // Emit notification event
        manager.emitEvent('plugin-notification', {
          pluginId,
          message,
          type,
        })
      },

      getStorage(key: string) {
        try {
          const value = localStorage.getItem(
            `animator-plugin-${pluginId}-${key}`
          )
          return value ? JSON.parse(value) : null
        } catch {
          return null
        }
      },

      setStorage(key: string, value: any) {
        try {
          localStorage.setItem(
            `animator-plugin-${pluginId}-${key}`,
            JSON.stringify(value)
          )
        } catch (error) {
          throw new Error('Failed to save plugin storage')
        }
      },

      removeStorage(key: string) {
        try {
          localStorage.removeItem(`animator-plugin-${pluginId}-${key}`)
        } catch (error) {
          throw new Error('Failed to remove plugin storage')
        }
      },

      async ready() {
        // Plugin signals it's ready - this is handled in loadPluginScript
      },

      async destroy() {
        await manager.unloadPlugin(pluginId)
      },
    }
  }

  private createPluginUI(pluginId: string, sandbox: PluginSandbox): any {
    if (!sandbox.iframe) return null

    return {
      async show(options: any = {}) {
        sandbox.iframe.style.display = 'block'

        if (options.width && options.height) {
          sandbox.iframe.style.width = `${options.width}px`
          sandbox.iframe.style.height = `${options.height}px`
        }

        return { success: true, data: true }
      },

      async hide() {
        sandbox.iframe.style.display = 'none'
        return { success: true, data: true }
      },

      async resize(width: number, height: number) {
        sandbox.iframe.style.width = `${width}px`
        sandbox.iframe.style.height = `${height}px`
        return { success: true, data: true }
      },

      sendMessage(message: any) {
        sandbox.sendMessage({
          id: `ui_${Date.now()}`,
          type: 'event',
          pluginId,
          eventType: 'ui-message',
          payload: message,
          timestamp: Date.now(),
          source: 'main',
        })
      },

      onMessage(callback: Function) {
        // Set up message handler for UI messages
        const handler = (event: CustomEvent) => {
          if (
            event.detail.pluginId === pluginId &&
            event.detail.eventType === 'ui-message'
          ) {
            callback(event.detail.payload)
          }
        }

        window.addEventListener('plugin-event', handler as EventListener)
        return () =>
          window.removeEventListener('plugin-event', handler as EventListener)
      },
    }
  }

  private calculateResourceLimits(manifest: PluginManifest): any {
    // Base limits
    let limits = {
      maxMemoryMB: 50,
      maxCPUUsage: 25,
      maxNetworkRequests: 500,
      maxExecutionTimeMs: 15000,
      allowedDomains: ['*'],
    }

    // Adjust based on permissions
    if (manifest.permissions.includes('network:http')) {
      limits.maxNetworkRequests = 2000
      limits.allowedDomains = ['*'] // Allow all domains for network plugins
    }

    if (manifest.permissions.includes('effects:execute')) {
      limits.maxMemoryMB = 100 // Effects may need more memory
    }

    if (manifest.permissions.includes('export:execute')) {
      limits.maxExecutionTimeMs = 60000 // Export may take longer
    }

    return limits
  }

  private setupGlobalEventHandling(): void {
    window.addEventListener('plugin-event', (event: CustomEvent) => {
      const { pluginId, eventType, payload } = event.detail

      // Route event to appropriate plugin listeners
      const eventKey = `${pluginId}:${eventType}`
      const listeners = this.eventListeners.get(eventKey)

      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(payload)
          } catch (error) {
            logger.error(`Plugin event handler error: ${error}`)
          }
        })
      }
    })

    window.addEventListener('plugin-error', (event: CustomEvent) => {
      const { pluginId, error } = event.detail

      logger.error(`Plugin error in ${pluginId}:`, error)

      // Update plugin state
      const plugin = this.plugins.get(pluginId)
      if (plugin) {
        plugin.state.status = 'error'
        plugin.state.lastError = error
        plugin.state.metrics.errorCount++
      }

      this.emitEvent(PluginSystemEvent.PluginError, {
        pluginId,
        error,
      })
    })

    window.addEventListener(
      'plugin-resource-exceeded',
      (event: CustomEvent) => {
        const { pluginId, type, current, limit } = event.detail

        logger.warn(
          `Plugin ${pluginId} exceeded ${type} limit: ${current} > ${limit}`
        )

        this.emitEvent(PluginSystemEvent.ResourceLimitExceeded, {
          pluginId,
          type,
          current,
          limit,
        })
      }
    )
  }

  private subscribeToEvent(eventKey: string, callback: Function): void {
    if (!this.eventListeners.has(eventKey)) {
      this.eventListeners.set(eventKey, new Set())
    }
    this.eventListeners.get(eventKey)!.add(callback)
  }

  private unsubscribeFromEvent(eventKey: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventKey)
    if (listeners) {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.eventListeners.delete(eventKey)
      }
    }
  }

  private emitEvent(eventType: string, payload: any): void {
    window.dispatchEvent(new CustomEvent(eventType, { detail: payload }))
  }

  private getPluginsByType(): Record<any, number> {
    const counts: Record<string, number> = {}

    for (const plugin of this.plugins.values()) {
      const type = plugin.manifest.type
      counts[type] = (counts[type] || 0) + 1
    }

    return counts as any
  }

  private calculateAverageResponseTime(): number {
    // Simplified calculation - in real implementation would track actual response times
    return 50 // milliseconds
  }

  private calculateErrorRate(): number {
    const totalExecutions = Array.from(this.plugins.values()).reduce(
      (sum, p) => sum + p.state.metrics.executionTime,
      0
    )

    if (totalExecutions === 0) return 0

    const totalErrors = Array.from(this.plugins.values()).reduce(
      (sum, p) => sum + p.state.metrics.errorCount,
      0
    )

    return (totalErrors / totalExecutions) * 100
  }

  private calculateResourceUsage(): any {
    let totalMemory = 0
    let totalCPU = 0
    let totalNetwork = 0

    for (const plugin of this.plugins.values()) {
      const usage = plugin.state.sandbox?.getResourceUsage()
      if (usage) {
        totalMemory += usage.memoryMB
        totalCPU += usage.cpuUsage
        totalNetwork += usage.networkRequests
      }
    }

    return {
      totalMemoryMB: totalMemory,
      totalCPUUsage: totalCPU,
      networkRequests: totalNetwork,
    }
  }

  /**
   * Clean up all plugins and resources
   */
  async destroy(): Promise<void> {
    logger.info('🧹 Destroying plugin manager...')

    // Unload all plugins
    const unloadPromises = Array.from(this.plugins.keys()).map((id) =>
      this.unloadPlugin(id)
    )
    await Promise.allSettled(unloadPromises)

    // Clear all maps
    this.plugins.clear()
    this.sandboxedPlugins.clear()
    this.registeredAPIs.clear()
    this.eventListeners.clear()
    this.pendingPromises.clear()

    logger.info('✅ Plugin manager destroyed')
  }
}
