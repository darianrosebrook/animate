/**
 * @fileoverview Core Plugin System Types and Interfaces
 * @author @darianrosebrook
 */

import { Result } from '@/types'

/**
 * Plugin types enumeration
 */
export enum PluginType {
  Effect = 'effect',
  Tool = 'tool',
  ImportExport = 'import-export',
  Integration = 'integration',
}

/**
 * Plugin permission definitions
 */
export interface PluginPermissions {
  // Scene Graph Access
  'scene:read'?: boolean
  'scene:write'?: boolean
  'layers:read'?: boolean
  'layers:write'?: boolean

  // Effect System Access
  'effects:read'?: boolean
  'effects:write'?: boolean
  'effects:execute'?: boolean

  // Export System Access
  'export:read'?: boolean
  'export:write'?: boolean
  'export:execute'?: boolean

  // Asset Management Access
  'assets:read'?: boolean
  'assets:write'?: boolean
  'assets:import'?: boolean
  'assets:export'?: boolean

  // Network Access
  'network:http'?: boolean
  'network:websocket'?: boolean

  // File System Access
  'filesystem:read'?: boolean
  'filesystem:write'?: boolean

  // UI Access
  'ui:create'?: boolean
  'ui:modal'?: boolean
}

/**
 * Plugin manifest definition
 */
export interface PluginManifest {
  // Basic Information
  name: string
  id: string
  version: string
  description: string
  author: string

  // Plugin Type & Capabilities
  type: PluginType
  permissions: (keyof PluginPermissions)[]
  main: string // Entry point script

  // UI Configuration (optional)
  ui?: {
    main?: string // UI HTML file
    width?: number
    height?: number
    resizable?: boolean
  }

  // Dependencies
  dependencies?: Record<string, string>

  // Metadata
  keywords?: string[]
  homepage?: string
  repository?: string
  license?: string

  // Development
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

/**
 * Plugin state definition
 */
export interface PluginState {
  id: string
  status: 'loading' | 'active' | 'inactive' | 'error'
  permissions: PluginPermissions
  sandbox: PluginSandbox | null
  lastError?: PluginError
  metrics: PluginMetrics
  settings: Record<string, any>
}

/**
 * Plugin sandbox environment
 */
export interface PluginSandbox {
  iframe: HTMLIFrameElement
  window: Window | null
  document: Document | null
  isReady: boolean
  permissions: PluginPermissions
  resourceLimits: ResourceLimits
}

/**
 * Resource usage limits
 */
export interface ResourceLimits {
  maxMemoryMB: number
  maxCPUUsage: number
  maxNetworkRequests: number
  maxExecutionTimeMs: number
  allowedDomains: string[]
}

/**
 * Plugin metrics for monitoring
 */
export interface PluginMetrics {
  loadTime: number
  executionTime: number
  memoryUsage: number
  networkRequests: number
  errorCount: number
  lastExecuted: Date | null
}

/**
 * Plugin error definition
 */
export interface PluginError {
  code: string
  message: string
  stack?: string
  timestamp: Date
  context?: Record<string, any>
}

/**
 * Message passing protocol
 */
export interface PluginMessage {
  id: string
  type: 'api-call' | 'event' | 'response' | 'error'
  pluginId: string
  method?: string
  args?: any[]
  payload?: any
  timestamp: number
  source: 'main' | 'plugin'
}

/**
 * API call message
 */
export interface APICallMessage extends PluginMessage {
  type: 'api-call'
  method: string
  args: any[]
}

/**
 * API response message
 */
export interface APIResponseMessage extends PluginMessage {
  type: 'response'
  result?: any
  error?: PluginError
}

/**
 * Event message
 */
export interface EventMessage extends PluginMessage {
  type: 'event'
  eventType: string
  payload: any
}

/**
 * Plugin instance definition
 */
export interface PluginInstance {
  manifest: PluginManifest
  state: PluginState
  api: PluginAPI
  ui?: PluginUI
}

/**
 * Main plugin API interface
 */
export interface PluginAPI {
  // Plugin Lifecycle
  ready(): Promise<void>
  destroy(): Promise<void>

  // Communication
  callMainAPI(method: string, ...args: any[]): Promise<any>
  onMainEvent(eventType: string, callback: Function): void
  offMainEvent(eventType: string, callback: Function): void

  // Utilities
  log(message: string, level?: 'info' | 'warn' | 'error'): void
  notify(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void

  // Storage
  getStorage(key: string): any
  setStorage(key: string, value: any): void
  removeStorage(key: string): void
}

/**
 * Plugin UI interface
 */
export interface PluginUI {
  show(options?: UIShowOptions): Promise<void>
  hide(): Promise<void>
  resize(width: number, height: number): Promise<void>
  sendMessage(message: any): void
  onMessage(callback: (message: any) => void): void
}

/**
 * UI show options
 */
export interface UIShowOptions {
  width?: number
  height?: number
  title?: string
  resizable?: boolean
  modal?: boolean
}

/**
 * Plugin manager interface
 */
export interface PluginManager {
  // Plugin Management
  loadPlugin(manifest: PluginManifest): Promise<Result<PluginInstance>>
  unloadPlugin(pluginId: string): Promise<Result<void>>
  reloadPlugin(pluginId: string): Promise<Result<void>>
  getPlugin(pluginId: string): PluginInstance | null
  getAllPlugins(): PluginInstance[]

  // Communication
  callPluginAPI(pluginId: string, method: string, args: any[]): Promise<any>
  broadcastEvent(event: PluginEvent): void

  // State Management
  getPluginState(pluginId: string): PluginState | null
  updatePluginState(pluginId: string, state: Partial<PluginState>): void

  // System Integration
  registerAPI(apiName: string, implementation: any): void
  getAvailableAPIs(): string[]
}

/**
 * Plugin event definition
 */
export interface PluginEvent {
  type: string
  source: 'system' | 'plugin' | 'user'
  payload: any
  timestamp: Date
}

/**
 * Plugin validation result
 */
export interface PluginValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Plugin performance monitoring
 */
export interface PluginPerformance {
  pluginId: string
  metrics: PluginMetrics
  alerts: PerformanceAlert[]
}

/**
 * Performance alert
 */
export interface PerformanceAlert {
  type: 'memory' | 'cpu' | 'network' | 'execution-time'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  threshold: number
  currentValue: number
}

/**
 * Plugin development interface
 */
export interface PluginDevelopment {
  // Development Tools
  enableHotReload(pluginId: string): void
  disableHotReload(pluginId: string): void
  openDevTools(pluginId: string): void

  // Debugging
  logPluginMessage(pluginId: string, message: PluginMessage): void
  inspectPluginState(pluginId: string): PluginState

  // Testing
  runPluginTests(pluginId: string): Promise<TestResults>
  validatePluginManifest(manifest: PluginManifest): PluginValidation
}

/**
 * Plugin test results
 */
export interface TestResults {
  passed: number
  failed: number
  total: number
  duration: number
  results: Array<{
    test: string
    passed: boolean
    duration: number
    error?: string
  }>
}

/**
 * Plugin marketplace interface
 */
export interface PluginMarketplace {
  // Plugin Discovery
  searchPlugins(query: PluginSearchQuery): Promise<PluginInfo[]>
  getPluginInfo(pluginId: string): Promise<PluginInfo | null>
  getFeaturedPlugins(): Promise<PluginInfo[]>
  getPopularPlugins(): Promise<PluginInfo[]>

  // Plugin Management
  installPlugin(pluginId: string, version?: string): Promise<Result<void>>
  uninstallPlugin(pluginId: string): Promise<Result<void>>
  updatePlugin(pluginId: string): Promise<Result<void>>

  // Reviews & Ratings
  submitReview(pluginId: string, review: PluginReview): Promise<Result<void>>
  getReviews(pluginId: string): Promise<PluginReview[]>

  // Developer Portal
  publishPlugin(plugin: PluginManifest, code: string): Promise<Result<string>>
  updatePublishedPlugin(
    pluginId: string,
    updates: Partial<PluginManifest>
  ): Promise<Result<void>>
}

/**
 * Plugin search query
 */
export interface PluginSearchQuery {
  text?: string
  type?: PluginType
  tags?: string[]
  author?: string
  minRating?: number
  sortBy?: 'name' | 'rating' | 'downloads' | 'updated'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/**
 * Plugin information for marketplace
 */
export interface PluginInfo {
  id: string
  name: string
  version: string
  description: string
  author: string
  type: PluginType
  tags: string[]
  rating: number
  downloadCount: number
  lastUpdated: Date
  size: number
  permissions: string[]
  screenshots?: string[]
  homepage?: string
}

/**
 * Plugin review
 */
export interface PluginReview {
  id: string
  pluginId: string
  userId: string
  rating: number
  title: string
  content: string
  createdAt: Date
  helpful: number
}

/**
 * Plugin development environment
 */
export interface PluginDevEnvironment {
  // Development Server
  startDevServer(port?: number): Promise<void>
  stopDevServer(): Promise<void>

  // File Watching
  watchPluginFiles(
    pluginId: string,
    callback: (changes: FileChange[]) => void
  ): void
  unwatchPluginFiles(pluginId: string): void

  // Testing
  runTests(pluginId: string): Promise<TestResults>
  debugPlugin(pluginId: string): Promise<void>
}

/**
 * File change notification
 */
export interface FileChange {
  type: 'created' | 'modified' | 'deleted'
  path: string
  timestamp: Date
}

/**
 * Plugin system configuration
 */
export interface PluginSystemConfig {
  // Sandbox Settings
  sandbox: {
    maxMemoryMB: number
    maxExecutionTimeMs: number
    allowedDomains: string[]
    enableNetworkAccess: boolean
  }

  // API Settings
  api: {
    timeoutMs: number
    maxConcurrentCalls: number
    enableAPICaching: boolean
  }

  // Development Settings
  development: {
    enableHotReload: boolean
    enableDevTools: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }

  // Marketplace Settings
  marketplace: {
    enabled: boolean
    registryUrl: string
    requireApproval: boolean
  }
}

/**
 * Plugin system events
 */
export enum PluginSystemEvent {
  PluginLoaded = 'plugin:loaded',
  PluginUnloaded = 'plugin:unloaded',
  PluginError = 'plugin:error',
  PluginPermissionGranted = 'plugin:permission-granted',
  PluginPermissionRevoked = 'plugin:permission-revoked',
  APICallStarted = 'plugin:api-call-started',
  APICallCompleted = 'plugin:api-call-completed',
  ResourceLimitExceeded = 'plugin:resource-limit-exceeded',
}

/**
 * Plugin system statistics
 */
export interface PluginSystemStats {
  totalPlugins: number
  activePlugins: number
  pluginsByType: Record<PluginType, number>
  totalAPICalls: number
  averageResponseTime: number
  errorRate: number
  resourceUsage: {
    totalMemoryMB: number
    totalCPUUsage: number
    networkRequests: number
  }
}
