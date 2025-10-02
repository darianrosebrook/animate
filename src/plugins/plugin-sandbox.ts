/**
 * @fileoverview Plugin Sandbox Environment Implementation
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { logger } from '@/core/logging/logger'
import {
  PluginManifest,
  PluginSandbox as IPluginSandbox,
  PluginPermissions,
  ResourceLimits,
  PluginMessage,
  PluginError,
} from './plugin-types'

/**
 * Plugin sandbox implementation with iframe isolation
 */
export class PluginSandbox implements IPluginSandbox {
  public iframe: HTMLIFrameElement
  public window: Window | null = null
  public document: Document | null = null
  public isReady = false
  public permissions: PluginPermissions
  public resourceLimits: ResourceLimits

  private messageHandlers: Map<string, Function> = new Map()
  private readyPromise: Promise<void> | null = null
  private readyResolver: (() => void) | null = null

  // Resource monitoring
  private memoryUsage = 0
  private cpuUsage = 0
  private networkRequests = 0
  private executionStartTime = 0

  constructor(
    manifest: PluginManifest,
    permissions: PluginPermissions,
    resourceLimits: ResourceLimits
  ) {
    this.permissions = permissions
    this.resourceLimits = resourceLimits
    this.iframe = this.createSandboxIframe(manifest)
  }

  /**
   * Initialize the sandbox environment
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      logger.info(`🏗️ Initializing plugin sandbox: ${this.iframe.id}`)

      // Set up message handling
      this.setupMessageHandling()

      // Initialize resource monitoring
      this.startResourceMonitoring()

      // Wait for sandbox to be ready
      await this.waitForSandboxReady()

      logger.info(`✅ Plugin sandbox initialized: ${this.iframe.id}`)
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SANDBOX_INIT_ERROR',
          message: `Failed to initialize plugin sandbox: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Send message to plugin sandbox
   */
  sendMessage(message: PluginMessage): void {
    if (!this.window) {
      logger.error('Cannot send message: sandbox window not available')
      return
    }

    try {
      this.window.postMessage(message, '*')
      logger.debug(`📤 Sent message to plugin: ${message.type}`, message)
    } catch (error) {
      logger.error('Failed to send message to plugin:', error)
    }
  }

  /**
   * Register message handler for responses from plugin
   */
  onMessage(messageId: string, handler: Function): void {
    this.messageHandlers.set(messageId, handler)
  }

  /**
   * Remove message handler
   */
  offMessage(messageId: string): void {
    this.messageHandlers.delete(messageId)
  }

  /**
   * Check if permission is granted
   */
  hasPermission(permission: string): boolean {
    return this.permissions[permission as keyof PluginPermissions] || false
  }

  /**
   * Get current resource usage
   */
  getResourceUsage(): {
    memoryMB: number
    cpuUsage: number
    networkRequests: number
    executionTimeMs: number
  } {
    return {
      memoryMB: this.memoryUsage,
      cpuUsage: this.cpuUsage,
      networkRequests: this.networkRequests,
      executionTimeMs:
        this.executionStartTime > 0
          ? performance.now() - this.executionStartTime
          : 0,
    }
  }

  /**
   * Enforce resource limits
   */
  enforceResourceLimits(): boolean {
    const usage = this.getResourceUsage()

    // Check memory limit
    if (usage.memoryMB > this.resourceLimits.maxMemoryMB) {
      this.handleResourceLimitExceeded(
        'memory',
        usage.memoryMB,
        this.resourceLimits.maxMemoryMB
      )
      return false
    }

    // Check execution time limit
    if (usage.executionTimeMs > this.resourceLimits.maxExecutionTimeMs) {
      this.handleResourceLimitExceeded(
        'execution-time',
        usage.executionTimeMs,
        this.resourceLimits.maxExecutionTimeMs
      )
      return false
    }

    // Check network request limit
    if (usage.networkRequests > this.resourceLimits.maxNetworkRequests) {
      this.handleResourceLimitExceeded(
        'network',
        usage.networkRequests,
        this.resourceLimits.maxNetworkRequests
      )
      return false
    }

    return true
  }

  /**
   * Destroy the sandbox
   */
  destroy(): void {
    logger.info(`🧹 Destroying plugin sandbox: ${this.iframe.id}`)

    // Remove iframe from DOM
    if (this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe)
    }

    // Clean up message handlers
    this.messageHandlers.clear()

    // Stop resource monitoring
    this.stopResourceMonitoring()

    logger.info(`✅ Plugin sandbox destroyed: ${this.iframe.id}`)
  }

  private createSandboxIframe(manifest: PluginManifest): HTMLIFrameElement {
    // Create sandboxed iframe
    const iframe = document.createElement('iframe')
    iframe.id = `plugin-sandbox-${manifest.id}`
    iframe.style.display = 'none' // Hidden by default
    iframe.sandbox = this.getSandboxAttributes()

    // Set up iframe content
    const htmlContent = this.generateSandboxHTML(manifest)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    iframe.src = url

    // Add to document body
    document.body.appendChild(iframe)

    return iframe
  }

  private getSandboxAttributes(): string {
    // Configure sandbox permissions for security
    const sandboxAttributes = [
      'allow-scripts',
      'allow-same-origin',
      // Note: We're NOT allowing 'allow-forms', 'allow-modals', 'allow-popups'
      // to maintain security isolation
    ]

    return sandboxAttributes.join(' ')
  }

  private generateSandboxHTML(manifest: PluginManifest): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Plugin Sandbox: ${manifest.name}</title>
          <meta charset="utf-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: transparent;
            }
            #plugin-container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            #plugin-content {
              flex: 1;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div id="plugin-container">
            <div id="plugin-content"></div>
          </div>

          <script>
            // Plugin sandbox runtime
            (function() {
              'use strict';

              // Plugin API global object
              window.animatorPlugin = {
                // Plugin identification
                id: '${manifest.id}',
                name: '${manifest.name}',
                version: '${manifest.version}',

                // API methods
                callMainAPI: function(method, ...args) {
                  return new Promise((resolve, reject) => {
                    const messageId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                    // Send API call to main application
                    window.parent.postMessage({
                      id: messageId,
                      type: 'api-call',
                      pluginId: '${manifest.id}',
                      method: method,
                      args: args,
                      timestamp: Date.now(),
                      source: 'plugin'
                    }, '*');

                    // Set up response handler
                    const responseHandler = function(event) {
                      if (event.data && event.data.id === messageId) {
                        window.removeEventListener('message', responseHandler);

                        if (event.data.type === 'response') {
                          if (event.data.error) {
                            reject(new Error(event.data.error.message || 'Plugin API call failed'));
                          } else {
                            resolve(event.data.result);
                          }
                        } else if (event.data.type === 'error') {
                          reject(new Error(event.data.message || 'Plugin API call failed'));
                        }
                      }
                    };

                    window.addEventListener('message', responseHandler);

                    // Timeout after 30 seconds
                    setTimeout(() => {
                      window.removeEventListener('message', responseHandler);
                      reject(new Error('Plugin API call timed out'));
                    }, 30000);
                  });
                },

                // Event subscription
                onMainEvent: function(eventType, callback) {
                  window.addEventListener('message', function(event) {
                    if (event.data && event.data.type === 'event' && event.data.eventType === eventType) {
                      callback(event.data.payload);
                    }
                  });
                },

                // Logging
                log: function(message, level = 'info') {
                  window.parent.postMessage({
                    id: 'log_' + Date.now(),
                    type: 'event',
                    pluginId: '${manifest.id}',
                    eventType: 'plugin-log',
                    payload: { message, level },
                    timestamp: Date.now(),
                    source: 'plugin'
                  }, '*');
                },

                // Notifications
                notify: function(message, type = 'info') {
                  window.parent.postMessage({
                    id: 'notify_' + Date.now(),
                    type: 'event',
                    pluginId: '${manifest.id}',
                    eventType: 'plugin-notify',
                    payload: { message, type },
                    timestamp: Date.now(),
                    source: 'plugin'
                  }, '*');
                },

                // Storage
                getStorage: function(key) {
                  try {
                    return JSON.parse(localStorage.getItem('animator-plugin-' + '${manifest.id}' + '-' + key) || 'null');
                  } catch {
                    return null;
                  }
                },

                setStorage: function(key, value) {
                  try {
                    localStorage.setItem('animator-plugin-' + '${manifest.id}' + '-' + key, JSON.stringify(value));
                  } catch (error) {
                    console.error('Failed to save plugin storage:', error);
                  }
                },

                removeStorage: function(key) {
                  try {
                    localStorage.removeItem('animator-plugin-' + '${manifest.id}' + '-' + key);
                  } catch (error) {
                    console.error('Failed to remove plugin storage:', error);
                  }
                },

                // Signal ready state
                ready: function() {
                  window.parent.postMessage({
                    id: 'ready_' + Date.now(),
                    type: 'event',
                    pluginId: '${manifest.id}',
                    eventType: 'plugin-ready',
                    payload: {},
                    timestamp: Date.now(),
                    source: 'plugin'
                  }, '*');
                }
              };

              // Load plugin script
              const script = document.createElement('script');
              script.type = 'module';
              script.src = '${manifest.main}';
              script.onerror = function() {
                window.parent.postMessage({
                  id: 'error_' + Date.now(),
                  type: 'error',
                  pluginId: '${manifest.id}',
                  message: 'Failed to load plugin script: ${manifest.main}',
                  timestamp: Date.now(),
                  source: 'plugin'
                }, '*');
              };

              document.head.appendChild(script);

              // Signal sandbox ready
              window.addEventListener('load', function() {
                setTimeout(() => {
                  window.animatorPlugin.ready();
                }, 100);
              });
            })();
          </script>
        </body>
      </html>
    `
  }

  private setupMessageHandling(): void {
    window.addEventListener('message', (event) => {
      // Only accept messages from our plugin iframe
      if (event.source !== this.window) {
        return
      }

      const message = event.data as PluginMessage

      if (!message || !message.pluginId) {
        return
      }

      logger.debug(`📥 Received message from plugin: ${message.type}`, message)

      // Handle different message types
      switch (message.type) {
        case 'event':
          this.handlePluginEvent(message)
          break

        case 'response':
          this.handlePluginResponse(message)
          break

        case 'error':
          this.handlePluginError(message)
          break

        default:
          logger.warn('Unknown message type from plugin:', message.type)
      }
    })
  }

  private handlePluginEvent(message: PluginMessage): void {
    // Emit event to main application
    window.dispatchEvent(
      new CustomEvent('plugin-event', {
        detail: message,
      })
    )
  }

  private handlePluginResponse(message: PluginMessage): void {
    const handler = this.messageHandlers.get(message.id)
    if (handler) {
      handler(message)
      this.messageHandlers.delete(message.id)
    }
  }

  private handlePluginError(message: PluginMessage): void {
    const error: PluginError = {
      code: 'PLUGIN_RUNTIME_ERROR',
      message: message.payload?.message || 'Unknown plugin error',
      stack: message.payload?.stack,
      timestamp: new Date(),
      context: { pluginId: message.pluginId },
    }

    // Emit error event to main application
    window.dispatchEvent(
      new CustomEvent('plugin-error', {
        detail: { pluginId: message.pluginId, error },
      })
    )
  }

  private async waitForSandboxReady(): Promise<void> {
    if (this.readyPromise) {
      return this.readyPromise
    }

    this.readyPromise = new Promise((resolve) => {
      this.readyResolver = resolve

      const checkReady = () => {
        if (this.isReady) {
          resolve()
        } else {
          setTimeout(checkReady, 50)
        }
      }

      checkReady()
    })

    return this.readyPromise
  }

  private startResourceMonitoring(): void {
    // Monitor iframe performance
    const monitorInterval = setInterval(() => {
      if (!this.iframe.contentWindow) return

      try {
        // Estimate memory usage (simplified)
        if ('memory' in performance) {
          this.memoryUsage =
            (performance as any).memory.usedJSHeapSize / (1024 * 1024)
        }

        // Check if resource limits are exceeded
        if (!this.enforceResourceLimits()) {
          clearInterval(monitorInterval)
          this.handleResourceLimitExceeded('general', 0, 0)
        }
      } catch (error) {
        logger.error('Resource monitoring error:', error)
      }
    }, 1000)

    // Store interval for cleanup
    ;(this.iframe as any)._monitorInterval = monitorInterval
  }

  private stopResourceMonitoring(): void {
    const interval = (this.iframe as any)._monitorInterval
    if (interval) {
      clearInterval(interval)
    }
  }

  private handleResourceLimitExceeded(
    type: string,
    current: number,
    limit: number
  ): void {
    logger.warn(
      `🚨 Plugin resource limit exceeded: ${type} (${current} > ${limit})`
    )

    // Send resource exceeded message to plugin
    this.sendMessage({
      id: `resource_${Date.now()}`,
      type: 'event',
      pluginId: this.iframe.id,
      eventType: 'resource-limit-exceeded',
      payload: { type, current, limit },
      timestamp: Date.now(),
      source: 'main',
    })

    // Emit event to main application
    window.dispatchEvent(
      new CustomEvent('plugin-resource-exceeded', {
        detail: {
          pluginId: this.iframe.id,
          type,
          current,
          limit,
        },
      })
    )
  }
}

/**
 * Plugin sandbox factory
 */
export class PluginSandboxFactory {
  static createSandbox(
    manifest: PluginManifest,
    permissions: PluginPermissions,
    resourceLimits: ResourceLimits
  ): PluginSandbox {
    return new PluginSandbox(manifest, permissions, resourceLimits)
  }

  static async createSandboxFromManifest(
    manifestPath: string
  ): Promise<Result<PluginSandbox>> {
    try {
      // Load and parse manifest
      const response = await fetch(manifestPath)
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'MANIFEST_LOAD_ERROR',
            message: `Failed to load manifest: ${manifestPath}`,
          },
        }
      }

      const manifestContent = await response.text()
      const manifest: PluginManifest = JSON.parse(manifestContent)

      // Validate manifest
      const validation = this.validateManifest(manifest)
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'MANIFEST_INVALID',
            message: `Invalid manifest: ${validation.errors.join(', ')}`,
          },
        }
      }

      // Create sandbox with default resource limits
      const defaultLimits: ResourceLimits = {
        maxMemoryMB: 100,
        maxCPUUsage: 50,
        maxNetworkRequests: 1000,
        maxExecutionTimeMs: 30000,
        allowedDomains: ['*'], // Configure based on manifest permissions
      }

      const sandbox = this.createSandbox(
        manifest,
        manifest.permissions as any,
        defaultLimits
      )

      return { success: true, data: sandbox }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SANDBOX_CREATION_ERROR',
          message: `Failed to create sandbox: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private static validateManifest(manifest: PluginManifest): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields validation
    if (!manifest.name) errors.push('Name is required')
    if (!manifest.id) errors.push('ID is required')
    if (!manifest.version) errors.push('Version is required')
    if (!manifest.main) errors.push('Main script is required')

    // ID format validation
    if (manifest.id && !/^[a-z0-9.-]+$/.test(manifest.id)) {
      errors.push(
        'ID must contain only lowercase letters, numbers, dots, and hyphens'
      )
    }

    // Version format validation
    if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      warnings.push('Version should follow semantic versioning (x.y.z)')
    }

    // Permission validation
    if (manifest.permissions) {
      const validPermissions = [
        'scene:read',
        'scene:write',
        'layers:read',
        'layers:write',
        'effects:read',
        'effects:write',
        'effects:execute',
        'export:read',
        'export:write',
        'export:execute',
        'assets:read',
        'assets:write',
        'assets:import',
        'assets:export',
        'network:http',
        'network:websocket',
        'filesystem:read',
        'filesystem:write',
        'ui:create',
        'ui:modal',
      ]

      for (const permission of manifest.permissions) {
        if (!validPermissions.includes(permission)) {
          errors.push(`Unknown permission: ${permission}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
}
