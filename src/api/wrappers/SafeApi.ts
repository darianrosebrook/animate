/**
 * @fileoverview Safe API wrapper for developer mode
 * @description Provides controlled access to Animator APIs with security boundaries
 * @author @darianrosebrook
 */

import { logger } from '@/core/logging/logger'
import type {
  SceneGraphAPI,
  TimelineAPI,
  RenderingAPI,
  CollaborationAPI,
  PluginAPI,
  AnimatorAPI,
} from '../animator-api'

/**
 * Safe API interface that wraps Animator core APIs with security controls
 */
export interface SafeApi {
  // Core subsystems
  readonly sceneGraph: SafeSceneGraphAPI
  readonly timeline: SafeTimelineAPI
  readonly rendering: SafeRenderingAPI
  readonly collaboration: SafeCollaborationAPI
  readonly plugins: SafePluginAPI

  // Document management
  readonly documents: SafeDocumentAPI

  // Global settings and system info
  readonly settings: SafeSettingsAPI
  readonly system: SafeSystemAPI

  // Utilities and helpers
  readonly utils: SafeUtils

  // Context information
  readonly context: ApiContext
}

/**
 * API context information available to user code
 */
export interface ApiContext {
  userId: string
  documentId: string
  sessionId?: string
  permissions: string[]
  environment: 'development' | 'production'
  version: string
}

/**
 * Safe scene graph API wrapper
 */
export interface SafeSceneGraphAPI {
  // Node management
  createNode(type: string, parentId?: string, name?: string): Promise<SafeNode>
  getNode(nodeId: string): Promise<SafeNode | null>
  updateNode(nodeId: string, updates: Partial<SafeNode>): Promise<SafeNode>
  deleteNode(nodeId: string): Promise<boolean>

  // Hierarchy
  setParent(nodeId: string, parentId: string | null): Promise<void>
  getChildren(nodeId: string): Promise<SafeNode[]>
  getAncestors(nodeId: string): Promise<SafeNode[]>
  getDescendants(nodeId: string): Promise<SafeNode[]>

  // Properties
  setProperty(nodeId: string, key: string, value: any): Promise<void>
  getProperty(nodeId: string, key: string): Promise<any>
  getProperties(nodeId: string): Promise<Record<string, any>>

  // Selection
  selectNodes(nodeIds: string[]): Promise<void>
  getSelectedNodes(): Promise<SafeNode[]>

  // Utilities
  getCurrentScene(): Promise<SafeScene>
}

/**
 * Safe timeline API wrapper
 */
export interface SafeTimelineAPI {
  // Timeline management
  createTimeline(
    name: string,
    duration: number,
    frameRate: number
  ): Promise<SafeTimeline>
  getTimeline(timelineId: string): Promise<SafeTimeline | null>
  updateTimeline(
    timelineId: string,
    updates: Partial<SafeTimeline>
  ): Promise<SafeTimeline>

  // Playback
  play(timelineId: string): Promise<void>
  pause(timelineId: string): Promise<void>
  stop(timelineId: string): Promise<void>
  seek(timelineId: string, time: number): Promise<void>

  // Tracks
  createTrack(
    timelineId: string,
    type: string,
    name: string
  ): Promise<SafeTrack>
  getTracks(timelineId: string): Promise<SafeTrack[]>

  // Keyframes
  addKeyframe(trackId: string, time: number, value: any): Promise<void>
  getKeyframes(trackId: string): Promise<SafeKeyframe[]>
  updateKeyframe(trackId: string, time: number, value: any): Promise<void>
  removeKeyframe(trackId: string, time: number): Promise<void>
}

/**
 * Safe rendering API wrapper
 */
export interface SafeRenderingAPI {
  // Frame rendering
  renderFrame(sceneId: string, time: number): Promise<SafeRenderResult>

  // Viewport management
  createViewport(
    container: HTMLElement,
    options?: SafeViewportOptions
  ): Promise<SafeViewport>
  updateViewport(
    viewportId: string,
    updates: Partial<SafeViewportOptions>
  ): Promise<void>
  destroyViewport(viewportId: string): Promise<void>

  // Camera control
  setCamera(viewportId: string, camera: SafeCamera): Promise<void>
  getCamera(viewportId: string): Promise<SafeCamera | null>

  // Export
  exportFrame(viewportId: string, format: string): Promise<Blob>
}

/**
 * Safe utilities
 */
export interface SafeUtils {
  log(...args: any[]): void
  generateId(): string
  sleep(ms: number): Promise<void>
  formatTime(time: number): string
  formatColor(color: any): string
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T
}

/**
 * Safe data types
 */
export interface SafeNode {
  id: string
  name: string
  type: string
  properties: Record<string, any>
  transform: SafeTransform
  children: string[]
  parentId?: string
  isVisible: boolean
  isSelected: boolean
  bounds: SafeBounds
}

export interface SafeScene {
  id: string
  name: string
  duration: number
  frameRate: number
  rootNode: string
  nodes: SafeNode[]
}

export interface SafeTimeline {
  id: string
  name: string
  duration: number
  frameRate: number
  tracks: SafeTrack[]
  isPlaying: boolean
  currentTime: number
}

export interface SafeTrack {
  id: string
  name: string
  type: string
  keyframes: SafeKeyframe[]
  enabled: boolean
  locked: boolean
}

export interface SafeKeyframe {
  time: number
  value: any
  interpolation: string
}

/**
 * Safe collaboration API wrapper
 */
export interface SafeCollaborationAPI {
  // Session management
  createSession(
    documentId: string,
    participants: SafeParticipantInfo[]
  ): Promise<SafeCollaborationSession>
  joinSession(
    sessionId: string,
    participant: SafeParticipantInfo
  ): Promise<SafeJoinSessionResult>
  leaveSession(sessionId: string): Promise<void>
  getSession(sessionId: string): Promise<SafeCollaborationSession | null>

  // Presence and cursors
  updatePresence(sessionId: string, presence: SafePresence): Promise<void>
  getParticipants(sessionId: string): Promise<SafeParticipant[]>

  // Document synchronization
  subscribeToChanges(
    sessionId: string,
    callback: (changes: SafeDocumentChange[]) => void
  ): Promise<() => void>
  applyChanges(sessionId: string, changes: SafeDocumentChange[]): Promise<void>

  // Conflict resolution
  resolveConflict(
    conflictId: string,
    resolution: SafeConflictResolution
  ): Promise<void>
  getConflicts(documentId: string): Promise<SafeDocumentConflict[]>
}

/**
 * Safe plugin API wrapper
 */
export interface SafePluginAPI {
  // Plugin management
  installPlugin(pluginId: string, source: SafePluginSource): Promise<SafePlugin>
  uninstallPlugin(pluginId: string): Promise<void>
  listPlugins(): Promise<SafePlugin[]>
  getPlugin(pluginId: string): Promise<SafePlugin | null>

  // Plugin execution
  executePlugin(
    pluginId: string,
    functionName: string,
    parameters: any[]
  ): Promise<any>

  // Plugin development (TODO: Implement when PluginAPI supports)
  // createPlugin(manifest: SafePluginManifest): Promise<SafePlugin>
  // updatePlugin(
  //   pluginId: string,
  //   updates: Partial<SafePlugin>
  // ): Promise<SafePlugin>
  // validatePlugin(pluginId: string): Promise<SafeValidationResult>
}

/**
 * Safe document API wrapper
 */
export interface SafeDocumentAPI {
  // Document management
  createDocument(template?: SafeDocumentTemplate): Promise<SafeDocument>
  openDocument(documentId: string): Promise<SafeDocument>
  saveDocument(documentId: string): Promise<void>
  closeDocument(documentId: string): Promise<void>

  // Document templates
  getTemplates(): Promise<SafeDocumentTemplate[]>
  getTemplate(category: string): Promise<SafeDocumentTemplate | null>
}

/**
 * Safe settings API wrapper
 */
export interface SafeSettingsAPI {
  // Global settings
  getSettings(): Promise<SafeAnimatorSettings>
  updateSettings(settings: Partial<SafeAnimatorSettings>): Promise<void>

  // Keyboard shortcuts
  getShortcuts(): Promise<Record<string, string>>
  setShortcut(action: string, keys: string): Promise<void>
  resetShortcuts(): Promise<void>
}

/**
 * Safe system API wrapper
 */
export interface SafeSystemAPI {
  // System information
  getSystemInfo(): Promise<SafeSystemInfo>
  getCapabilities(): Promise<SafeAnimatorCapabilities>

  // Performance monitoring
  getPerformanceMetrics(): Promise<SafePerformanceMetrics>
  getMemoryUsage(): Promise<SafeMemoryUsage>

  // Feature detection
  hasFeature(feature: string): boolean
  getSupportedFormats(): string[]
  getMaxSceneComplexity(): number
}

export interface SafeTransform {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  opacity: number
}

export interface SafeBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface SafeRenderResult {
  frameId: string
  time: number
  duration: number
  metadata: Record<string, any>
}

export interface SafeViewportOptions {
  width: number
  height: number
  backgroundColor: { r: number; g: number; b: number; a: number }
  showGuides: boolean
  showGrid: boolean
  zoom: number
  pan: { x: number; y: number }
}

export interface SafeViewport {
  id: string
  container: HTMLElement
  canvas: HTMLCanvasElement
  width: number
  height: number
  zoom: number
  pan: { x: number; y: number }
}

export interface SafeCamera {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  fieldOfView: number
  nearPlane: number
  farPlane: number
}

// Safe collaboration types
export interface SafeParticipantInfo {
  userId: string
  name: string
  email?: string
  avatar?: string
  color: string
  permissions: string[]
}

export interface SafeCollaborationSession {
  id: string
  documentId: string
  participants: SafeParticipant[]
  permissions: SafeSessionPermissions
  createdAt: Date
  isActive: boolean
}

export interface SafeParticipant {
  userId: string
  name: string
  presence: SafePresence
  joinedAt: Date
  lastActive: Date
  permissions: string[]
}

export interface SafePresence {
  cursor?: { x: number; y: number }
  selection: string[]
  currentTool: string
  isActive: boolean
}

export interface SafeSessionPermissions {
  [userId: string]: {
    canEdit: boolean
    canComment: boolean
    canInvite: boolean
    canExport: boolean
  }
}

export interface SafeDocumentChange {
  id: string
  type: 'create' | 'update' | 'delete' | 'move'
  path: string
  oldValue?: any
  newValue: any
  timestamp: Date
  author: string
}

export interface SafeJoinSessionResult {
  session: SafeCollaborationSession
  participant: SafeParticipant
  documentState: SafeDocumentSnapshot
}

export interface SafeConflictResolution {
  conflictId: string
  strategy: 'use_mine' | 'use_theirs' | 'merge' | 'manual'
  value?: any
}

export interface SafeDocumentConflict {
  id: string
  path: string
  localValue: any
  remoteValue: any
  commonAncestor: any
  participants: string[]
}

export interface SafeDocumentSnapshot {
  version: number
  timestamp: Date
  data: any
  changes: SafeDocumentChange[]
}

// Safe plugin types
export interface SafePlugin {
  id: string
  name: string
  version: string
  author: string
  description: string
  manifest: SafePluginManifest
  isInstalled: boolean
  isEnabled: boolean
  permissions: SafePluginPermission[]
  entryPoints: SafePluginEntryPoint[]
}

export interface SafePluginSource {
  type: 'url' | 'file' | 'registry' | 'github'
  url?: string
  content?: string
  registry?: string
}

export interface SafePluginManifest {
  name: string
  version: string
  description: string
  author: string
  main: string
  permissions: string[]
  dependencies: Record<string, string>
  activationEvents: string[]
  contributes: SafePluginContribution[]
}

export interface SafePluginContribution {
  type: 'command' | 'menu_item' | 'panel' | 'effect' | 'tool' | 'format'
  properties: Record<string, any>
}

export interface SafePluginPermission {
  type: 'read' | 'write' | 'execute' | 'network'
  resource: string
  actions: string[]
}

export interface SafePluginEntryPoint {
  name: string
  type: 'command' | 'event_handler' | 'render_hook' | 'menu_handler'
  handler: string
}

export interface SafeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// Safe document types
export interface SafeDocument {
  id: string
  name: string
  version: number
  scenes: SafeScene[]
  timelines: SafeTimeline[]
  assets: SafeAsset[]
  settings: SafeDocumentSettings
  metadata: SafeDocumentMetadata
}

export interface SafeScene {
  id: string
  name: string
  duration: number
  frameRate: number
  rootNode: string
  nodes: SafeNode[]
  camera: SafeCamera
  settings: SafeSceneSettings
}

export interface SafeAsset {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'font' | 'vector' | 'texture'
  source: string
  metadata: SafeAssetMetadata
}

export interface SafeAssetMetadata {
  width?: number
  height?: number
  duration?: number
  frameRate?: number
  colorSpace?: string
  hasAlpha?: boolean
}

export interface SafeDocumentTemplate {
  name: string
  description: string
  category:
    | 'title_sequence'
    | 'explainer'
    | 'social_media'
    | 'presentation'
    | 'blank'
  sceneTemplate: SafeSceneTemplate
}

export interface SafeSceneTemplate {
  name: string
  duration: number
  frameRate: number
  nodes: SafeNodeTemplate[]
}

export interface SafeNodeTemplate {
  type: string
  name: string
  properties: Record<string, any>
  children: SafeNodeTemplate[]
}

export interface SafeDocumentSettings {
  frameRate: number
  resolution: { width: number; height: number }
  colorSpace: 'srgb' | 'linear' | 'p3' | 'rec709'
  autoSave: boolean
  collaboration: SafeCollaborationSettings
}

export interface SafeCollaborationSettings {
  enabled: boolean
  autoJoin: boolean
  permissions: SafeSessionPermissions
}

export interface SafeDocumentMetadata {
  author: string
  createdAt: Date
  modifiedAt: Date
  tags: string[]
  description: string
}

export interface SafeSceneSettings {
  backgroundColor: { r: number; g: number; b: number; a: number }
  resolution: { width: number; height: number }
  enableDepthTest: boolean
  enableLighting: boolean
  motionBlur: boolean
}

// Safe settings types
export interface SafeAnimatorSettings {
  ui: SafeUISettings
  performance: SafePerformanceSettings
  collaboration: SafeCollaborationSettings
  shortcuts: Record<string, string>
  theme: SafeThemeSettings
}

export interface SafeUISettings {
  language: string
  timeFormat: 'frames' | 'timecode' | 'milliseconds'
  gridSize: number
  snapToGrid: boolean
  showGuides: boolean
}

export interface SafePerformanceSettings {
  maxUndoSteps: number
  autoSaveInterval: number
  previewQuality: 'draft' | 'preview' | 'final'
  cacheSize: number
}

export interface SafeThemeSettings {
  mode: 'light' | 'dark' | 'auto'
  accentColor: string
  fontSize: 'small' | 'medium' | 'large'
}

// Safe system types
export interface SafeSystemInfo {
  version: string
  platform: string
  gpu: SafeGPUInfo
  memory: SafeMemoryInfo
  performance: SafePerformanceInfo
}

export interface SafeGPUInfo {
  vendor: string
  renderer: string
  version: string
  memory: number
  maxTextureSize: number
}

export interface SafeMemoryInfo {
  total: number
  available: number
  used: number
}

export interface SafePerformanceInfo {
  cpuCores: number
  maxFrameRate: number
  supportedFormats: string[]
  features: string[]
}

export interface SafeAnimatorCapabilities {
  maxSceneComplexity: number
  maxTimelineDuration: number
  supportedAssetTypes: string[]
  collaborationFeatures: string[]
  exportFormats: string[]
  pluginSupport: boolean
}

export interface SafePerformanceMetrics {
  frameTime: number
  memoryUsage: number
  cpuUsage: number
  gpuUsage: number
}

export interface SafeMemoryUsage {
  heapUsed: number
  heapTotal: number
  external: number
}

/**
 * Safe API implementation that wraps core Animator APIs
 */
export class SafeApiWrapper implements SafeApi {
  private sceneGraphApi: SceneGraphAPI
  private timelineApi: TimelineAPI
  private renderingApi: RenderingAPI
  private collaborationApi: CollaborationAPI
  private pluginApi: PluginAPI
  private animatorApi: AnimatorAPI
  private _context: ApiContext

  constructor(
    sceneGraphApi: SceneGraphAPI,
    timelineApi: TimelineAPI,
    renderingApi: RenderingAPI,
    collaborationApi: CollaborationAPI,
    pluginApi: PluginAPI,
    animatorApi: AnimatorAPI,
    context: ApiContext
  ) {
    this.sceneGraphApi = sceneGraphApi
    this.timelineApi = timelineApi
    this.renderingApi = renderingApi
    this.collaborationApi = collaborationApi
    this.pluginApi = pluginApi
    this.animatorApi = animatorApi
    this._context = context
  }

  get sceneGraph(): SafeSceneGraphAPI {
    return new SafeSceneGraphWrapper(this.sceneGraphApi, this._context)
  }

  get timeline(): SafeTimelineAPI {
    return new SafeTimelineWrapper(this.timelineApi, this._context)
  }

  get rendering(): SafeRenderingAPI {
    return new SafeRenderingWrapper(this.renderingApi, this._context)
  }

  get collaboration(): SafeCollaborationAPI {
    return new SafeCollaborationWrapper(this.collaborationApi, this._context)
  }

  get plugins(): SafePluginAPI {
    return new SafePluginWrapper(this.pluginApi, this._context)
  }

  get documents(): SafeDocumentAPI {
    return new SafeDocumentWrapper(this.animatorApi, this._context)
  }

  get settings(): SafeSettingsAPI {
    return new SafeSettingsWrapper(this.animatorApi, this._context)
  }

  get system(): SafeSystemAPI {
    return new SafeSystemWrapper(this.animatorApi, this._context)
  }

  get utils(): SafeUtils {
    return new SafeUtilsImpl()
  }

  get context(): ApiContext {
    return this.context
  }
}

/**
 * Safe scene graph API wrapper implementation
 */
class SafeSceneGraphWrapper implements SafeSceneGraphAPI {
  constructor(
    private api: SceneGraphAPI,
    private context: ApiContext
  ) {}

  async createNode(
    type: string,
    parentId?: string,
    _name?: string
  ): Promise<SafeNode> {
    this.checkPermission('sceneGraph.create')

    try {
      const node = await this.api.createNode(type as any, parentId)
      return this.sanitizeNode(node)
    } catch (error) {
      throw new SafeApiError(
        'Failed to create node',
        'sceneGraph.create',
        error
      )
    }
  }

  async getNode(nodeId: string): Promise<SafeNode | null> {
    this.checkPermission('sceneGraph.read')

    try {
      const node = await this.api.getNode(nodeId)
      return node ? this.sanitizeNode(node) : null
    } catch (error) {
      throw new SafeApiError('Failed to get node', 'sceneGraph.read', error)
    }
  }

  async updateNode(
    nodeId: string,
    updates: Partial<SafeNode>
  ): Promise<SafeNode> {
    this.checkPermission('sceneGraph.update')

    try {
      const sanitizedUpdates = this.sanitizeNodeUpdates(updates)
      const node = await this.api.updateNode(nodeId, sanitizedUpdates)
      return this.sanitizeNode(node)
    } catch (error) {
      throw new SafeApiError(
        'Failed to update node',
        'sceneGraph.update',
        error
      )
    }
  }

  async deleteNode(nodeId: string): Promise<boolean> {
    this.checkPermission('sceneGraph.delete')

    try {
      return await this.api.deleteNode(nodeId)
    } catch (error) {
      throw new SafeApiError(
        'Failed to delete node',
        'sceneGraph.delete',
        error
      )
    }
  }

  async setParent(nodeId: string, parentId: string | null): Promise<void> {
    this.checkPermission('sceneGraph.update')

    try {
      await this.api.setParent(nodeId, parentId)
    } catch (error) {
      throw new SafeApiError('Failed to set parent', 'sceneGraph.update', error)
    }
  }

  async getChildren(nodeId: string): Promise<SafeNode[]> {
    this.checkPermission('sceneGraph.read')

    try {
      const children = await this.api.getChildren(nodeId)
      return children.map((child) => this.sanitizeNode(child))
    } catch (error) {
      throw new SafeApiError('Failed to get children', 'sceneGraph.read', error)
    }
  }

  async getAncestors(nodeId: string): Promise<SafeNode[]> {
    this.checkPermission('sceneGraph.read')

    try {
      const ancestors = await this.api.getAncestors(nodeId)
      return ancestors.map((ancestor) => this.sanitizeNode(ancestor))
    } catch (error) {
      throw new SafeApiError(
        'Failed to get ancestors',
        'sceneGraph.read',
        error
      )
    }
  }

  async getDescendants(nodeId: string): Promise<SafeNode[]> {
    this.checkPermission('sceneGraph.read')

    try {
      const descendants = await this.api.getDescendants(nodeId)
      return descendants.map((descendant) => this.sanitizeNode(descendant))
    } catch (error) {
      throw new SafeApiError(
        'Failed to get descendants',
        'sceneGraph.read',
        error
      )
    }
  }

  async setProperty(nodeId: string, key: string, value: any): Promise<void> {
    this.checkPermission('sceneGraph.update')

    try {
      const sanitizedValue = this.sanitizePropertyValue(key, value)
      await this.api.setProperty(nodeId, key, sanitizedValue)
    } catch (error) {
      throw new SafeApiError(
        'Failed to set property',
        'sceneGraph.update',
        error
      )
    }
  }

  async getProperty(nodeId: string, key: string): Promise<any> {
    this.checkPermission('sceneGraph.read')

    try {
      return await this.api.getProperty(nodeId, key)
    } catch (error) {
      throw new SafeApiError('Failed to get property', 'sceneGraph.read', error)
    }
  }

  async getProperties(nodeId: string): Promise<Record<string, any>> {
    this.checkPermission('sceneGraph.read')

    try {
      return await this.api.getProperties(nodeId)
    } catch (error) {
      throw new SafeApiError(
        'Failed to get properties',
        'sceneGraph.read',
        error
      )
    }
  }

  async selectNodes(_nodeIds: string[]): Promise<void> {
    this.checkPermission('sceneGraph.update')

    try {
      // TODO: Implement getSelectedNodes functionality
      // const selectedNodes = await this.api.getSelectedNodes()
    } catch (error) {
      throw new SafeApiError(
        'Failed to select nodes',
        'sceneGraph.update',
        error
      )
    }
  }

  async getSelectedNodes(): Promise<SafeNode[]> {
    this.checkPermission('sceneGraph.read')

    try {
      // PLACEHOLDER: getSelectedNodes method not implemented in SceneGraphAPI
      // Return empty array for now until the API supports this method
      return []
    } catch (error) {
      throw new SafeApiError(
        'Failed to get selected nodes',
        'sceneGraph.read',
        error
      )
    }
  }

  async getCurrentScene(): Promise<SafeScene> {
    this.checkPermission('sceneGraph.read')

    try {
      // Get root scene node and build scene info
      const rootNode = await this.api.getNode('root')
      if (!rootNode) {
        throw new Error('Root scene not found')
      }

      const descendants = await this.api.getDescendants('root')
      const allNodes = [rootNode, ...descendants]

      return {
        id: 'current',
        name: 'Current Scene',
        duration: 5000, // Default duration
        frameRate: 30,
        rootNode: rootNode.id,
        nodes: allNodes.map((node) => this.sanitizeNode(node)),
        camera: {
          position: { x: 0, y: 0, z: 5 },
          rotation: { x: 0, y: 0, z: 0 },
          fieldOfView: 60,
          nearPlane: 0.1,
          farPlane: 1000,
        },
        settings: {
          backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
          resolution: { width: 1920, height: 1080 },
          enableDepthTest: true,
          enableLighting: true,
          motionBlur: false,
        },
      }
    } catch (error) {
      throw new SafeApiError(
        'Failed to get current scene',
        'sceneGraph.read',
        error
      )
    }
  }

  private checkPermission(action: string): void {
    if (!this.context.permissions.includes(action)) {
      throw new SafeApiError(
        `Permission denied: ${action}`,
        'permission.denied'
      )
    }
  }

  private sanitizeNode(node: any): SafeNode {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      properties: node.properties || {},
      transform: node.transform || {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        opacity: 1,
      },
      children: node.children || [],
      parentId: node.parentId,
      isVisible: node.isVisible ?? true,
      isSelected: node.isSelected ?? false,
      bounds: node.bounds || { x: 0, y: 0, width: 100, height: 100 },
    }
  }

  private sanitizeNodeUpdates(updates: Partial<SafeNode>): any {
    // Sanitize updates to only allow safe properties
    const allowedUpdates = ['name', 'properties', 'transform']
    const sanitized: any = {}

    for (const key of allowedUpdates) {
      if (updates[key as keyof SafeNode] !== undefined) {
        sanitized[key] = updates[key as keyof SafeNode]
      }
    }

    return sanitized
  }

  private sanitizePropertyValue(_key: string, value: any): any {
    // Sanitize property values to prevent injection attacks
    if (typeof value === 'string') {
      // Basic sanitization - in production would be more comprehensive
      return value.replace(/<script[^>]*>.*?<\/script>/gi, '')
    }
    return value
  }
}

/**
 * Safe timeline API wrapper implementation
 */
class SafeTimelineWrapper implements SafeTimelineAPI {
  constructor(
    private api: TimelineAPI,
    private context: ApiContext
  ) {}

  async createTimeline(
    name: string,
    duration: number,
    frameRate: number
  ): Promise<SafeTimeline> {
    this.checkPermission('timeline.create')

    try {
      const timeline = await this.api.createTimeline(name, duration, frameRate)
      return this.sanitizeTimeline(timeline)
    } catch (error) {
      throw new SafeApiError(
        'Failed to create timeline',
        'timeline.create',
        error
      )
    }
  }

  async getTimeline(timelineId: string): Promise<SafeTimeline | null> {
    this.checkPermission('timeline.read')

    try {
      const timeline = await this.api.getTimeline(timelineId)
      return timeline ? this.sanitizeTimeline(timeline) : null
    } catch (error) {
      throw new SafeApiError('Failed to get timeline', 'timeline.read', error)
    }
  }

  async updateTimeline(
    timelineId: string,
    updates: Partial<SafeTimeline>
  ): Promise<SafeTimeline> {
    this.checkPermission('timeline.update')

    try {
      const sanitizedUpdates = this.sanitizeTimelineUpdates(updates)
      const timeline = await this.api.updateTimeline(
        timelineId,
        sanitizedUpdates
      )
      return this.sanitizeTimeline(timeline)
    } catch (error) {
      throw new SafeApiError(
        'Failed to update timeline',
        'timeline.update',
        error
      )
    }
  }

  async play(timelineId: string): Promise<void> {
    this.checkPermission('timeline.playback')

    try {
      await this.api.play(timelineId)
    } catch (error) {
      throw new SafeApiError(
        'Failed to play timeline',
        'timeline.playback',
        error
      )
    }
  }

  async pause(timelineId: string): Promise<void> {
    this.checkPermission('timeline.playback')

    try {
      await this.api.pause(timelineId)
    } catch (error) {
      throw new SafeApiError(
        'Failed to pause timeline',
        'timeline.playback',
        error
      )
    }
  }

  async stop(timelineId: string): Promise<void> {
    this.checkPermission('timeline.playback')

    try {
      await this.api.stop(timelineId)
    } catch (error) {
      throw new SafeApiError(
        'Failed to stop timeline',
        'timeline.playback',
        error
      )
    }
  }

  async seek(timelineId: string, time: number): Promise<void> {
    this.checkPermission('timeline.playback')

    try {
      await this.api.seek(timelineId, time)
    } catch (error) {
      throw new SafeApiError(
        'Failed to seek timeline',
        'timeline.playback',
        error
      )
    }
  }

  async createTrack(
    timelineId: string,
    type: string,
    name: string
  ): Promise<SafeTrack> {
    this.checkPermission('timeline.edit')

    try {
      const track = await this.api.createTrack(timelineId, type as any, name)
      return this.sanitizeTrack(track)
    } catch (error) {
      throw new SafeApiError('Failed to create track', 'timeline.edit', error)
    }
  }

  // TODO: Implement getTracks when TimelineAPI supports it
  // async getTracks(timelineId: string): Promise<SafeTrack[]> {
  //   this.checkPermission('timeline.read')

  //   try {
  //     const tracks = await this.api.getTracks(timelineId)
  //     return tracks.map((track) => this.sanitizeTrack(track))
  //     //     } catch (error) {
  //       throw new SafeApiError('Failed to get tracks', 'timeline.read', error)
  //     }
  //   }

  async addKeyframe(trackId: string, time: number, value: any): Promise<void> {
    this.checkPermission('timeline.edit')

    try {
      const keyframe = { time, value, interpolation: 'linear' as any }
      await this.api.addKeyframe(trackId, keyframe)
    } catch (error) {
      throw new SafeApiError('Failed to add keyframe', 'timeline.edit', error)
    }
  }

  async getKeyframes(trackId: string): Promise<SafeKeyframe[]> {
    this.checkPermission('timeline.read')

    try {
      const keyframes = await this.api.getKeyframes(trackId)
      return keyframes.map((kf) => this.sanitizeKeyframe(kf))
    } catch (error) {
      throw new SafeApiError('Failed to get keyframes', 'timeline.read', error)
    }
  }

  async updateKeyframe(
    trackId: string,
    time: number,
    value: any
  ): Promise<void> {
    this.checkPermission('timeline.edit')

    try {
      const updates = { value }
      await this.api.updateKeyframe(trackId, time, updates)
    } catch (error) {
      throw new SafeApiError(
        'Failed to update keyframe',
        'timeline.edit',
        error
      )
    }
  }

  async removeKeyframe(trackId: string, time: number): Promise<void> {
    this.checkPermission('timeline.edit')

    try {
      await this.api.removeKeyframe(trackId, time)
    } catch (error) {
      throw new SafeApiError(
        'Failed to remove keyframe',
        'timeline.edit',
        error
      )
    }
  }

  private checkPermission(action: string): void {
    if (!this.context.permissions.includes(action)) {
      throw new SafeApiError(
        `Permission denied: ${action}`,
        'permission.denied'
      )
    }
  }

  private sanitizeTimeline(timeline: any): SafeTimeline {
    return {
      id: timeline.id,
      name: timeline.name,
      duration: timeline.duration,
      frameRate: timeline.frameRate,
      tracks:
        timeline.tracks?.map((track: any) => this.sanitizeTrack(track)) || [],
      isPlaying: timeline.isPlaying || false,
      currentTime: timeline.currentTime || 0,
    }
  }

  private sanitizeTimelineUpdates(updates: Partial<SafeTimeline>): any {
    const allowedUpdates = ['name', 'duration']
    const sanitized: any = {}

    for (const key of allowedUpdates) {
      if (updates[key as keyof SafeTimeline] !== undefined) {
        sanitized[key] = updates[key as keyof SafeTimeline]
      }
    }

    return sanitized
  }

  async getTracks(_timelineId: string): Promise<SafeTrack[]> {
    this.checkPermission('timeline.read')

    try {
      // PLACEHOLDER: getTracks method not implemented in TimelineAPI
      // Return empty array for now until the API supports this method
      return []
    } catch (error) {
      throw new SafeApiError('Failed to get tracks', 'timeline.read', error)
    }
  }

  private sanitizeTrack(track: any): SafeTrack {
    return {
      id: track.id,
      name: track.name,
      type: track.type,
      keyframes:
        track.keyframes?.map((kf: any) => this.sanitizeKeyframe(kf)) || [],
      enabled: track.enabled ?? true,
      locked: track.locked ?? false,
    }
  }

  private sanitizeKeyframe(keyframe: any): SafeKeyframe {
    return {
      time: keyframe.time,
      value: keyframe.value,
      interpolation: keyframe.interpolation || 'linear',
    }
  }
}

/**
 * Safe rendering API wrapper implementation
 */
class SafeRenderingWrapper implements SafeRenderingAPI {
  constructor(
    private api: RenderingAPI,
    private context: ApiContext
  ) {}

  async renderFrame(sceneId: string, time: number): Promise<SafeRenderResult> {
    this.checkPermission('rendering.render')

    try {
      const result = await this.api.renderFrame(sceneId, time)
      return this.sanitizeRenderResult(result)
    } catch (error) {
      throw new SafeApiError(
        'Failed to render frame',
        'rendering.render',
        error
      )
    }
  }

  async createViewport(
    container: HTMLElement,
    options?: SafeViewportOptions
  ): Promise<SafeViewport> {
    this.checkPermission('rendering.createViewport')

    try {
      const viewport = await this.api.createViewport(container, options as any)
      return this.sanitizeViewport(viewport)
    } catch (error) {
      throw new SafeApiError(
        'Failed to create viewport',
        'rendering.createViewport',
        error
      )
    }
  }

  async updateViewport(
    viewportId: string,
    updates: Partial<SafeViewportOptions>
  ): Promise<void> {
    this.checkPermission('rendering.updateViewport')

    try {
      await this.api.updateViewport(viewportId, updates as any)
    } catch (error) {
      throw new SafeApiError(
        'Failed to update viewport',
        'rendering.updateViewport',
        error
      )
    }
  }

  async destroyViewport(viewportId: string): Promise<void> {
    this.checkPermission('rendering.destroyViewport')

    try {
      await this.api.destroyViewport(viewportId)
    } catch (error) {
      throw new SafeApiError(
        'Failed to destroy viewport',
        'rendering.destroyViewport',
        error
      )
    }
  }

  async setCamera(viewportId: string, camera: SafeCamera): Promise<void> {
    this.checkPermission('rendering.setCamera')

    try {
      await this.api.setCamera(viewportId, camera as any)
    } catch (error) {
      throw new SafeApiError(
        'Failed to set camera',
        'rendering.setCamera',
        error
      )
    }
  }

  async getCamera(viewportId: string): Promise<SafeCamera | null> {
    this.checkPermission('rendering.getCamera')

    try {
      const camera = await this.api.getCamera(viewportId)
      return camera ? this.sanitizeCamera(camera) : null
    } catch (error) {
      throw new SafeApiError(
        'Failed to get camera',
        'rendering.getCamera',
        error
      )
    }
  }

  async exportFrame(viewportId: string, format: string): Promise<Blob> {
    this.checkPermission('rendering.export')

    try {
      // PLACEHOLDER: Export frame functionality
      // This will be implemented when the RenderingAPI supports exportFrame
      return new Blob(['placeholder export data'], { type: format })
    } catch (error) {
      throw new SafeApiError(
        'Failed to export frame',
        'rendering.export',
        error
      )
    }
  }

  private checkPermission(action: string): void {
    if (!this.context.permissions.includes(action)) {
      throw new SafeApiError(
        `Permission denied: ${action}`,
        'permission.denied'
      )
    }
  }

  private sanitizeRenderResult(result: any): SafeRenderResult {
    return {
      frameId: result.frameId,
      time: result.time,
      duration: result.duration,
      metadata: result.metadata || {},
    }
  }

  private sanitizeViewport(viewport: any): SafeViewport {
    return {
      id: viewport.id,
      container: viewport.container,
      canvas: viewport.canvas,
      width: viewport.size?.width || 800,
      height: viewport.size?.height || 600,
      zoom: viewport.camera?.zoom || 1,
      pan: viewport.camera?.position || { x: 0, y: 0 },
    }
  }

  private sanitizeCamera(camera: any): SafeCamera {
    return {
      position: camera.position || { x: 0, y: 0, z: 0 },
      rotation: camera.rotation || { x: 0, y: 0, z: 0 },
      fieldOfView: camera.fieldOfView || 60,
      nearPlane: camera.nearPlane || 0.1,
      farPlane: camera.farPlane || 1000,
    }
  }
}

/**
 * Safe collaboration API wrapper implementation
 */
class SafeCollaborationWrapper implements SafeCollaborationAPI {
  constructor(
    private api: CollaborationAPI,
    private context: ApiContext
  ) {}

  async createSession(
    documentId: string,
    participants: SafeParticipantInfo[]
  ): Promise<SafeCollaborationSession> {
    this.checkPermission('collaboration.create')

    try {
      const session = await this.api.createSession(
        documentId,
        participants as any
      )
      return this.sanitizeSession(session)
    } catch (error) {
      throw new SafeApiError(
        'Failed to create session',
        'collaboration.create',
        error
      )
    }
  }

  async joinSession(
    sessionId: string,
    participant: SafeParticipantInfo
  ): Promise<SafeJoinSessionResult> {
    this.checkPermission('collaboration.join')

    try {
      const result = await this.api.joinSession(sessionId, participant as any)
      return {
        session: this.sanitizeSession(result.session),
        participant: this.sanitizeParticipant(result.participant),
        documentState: this.sanitizeDocumentSnapshot({
          version: 1,
          timestamp: new Date(),
          data: {},
          changes: [],
        }),
      }
    } catch (error) {
      throw new SafeApiError(
        'Failed to join session',
        'collaboration.join',
        error
      )
    }
  }

  async leaveSession(sessionId: string): Promise<void> {
    this.checkPermission('collaboration.leave')

    try {
      await this.api.leaveSession(sessionId)
    } catch (error) {
      throw new SafeApiError(
        'Failed to leave session',
        'collaboration.leave',
        error
      )
    }
  }

  async getSession(
    _sessionId: string
  ): Promise<SafeCollaborationSession | null> {
    this.checkPermission('collaboration.read')

    try {
      // PLACEHOLDER: getSession method not implemented in CollaborationAPI
      // Return null for now until the API supports this method
      return null
    } catch (error) {
      throw new SafeApiError(
        'Failed to get session',
        'collaboration.read',
        error
      )
    }
  }

  async updatePresence(
    sessionId: string,
    presence: SafePresence
  ): Promise<void> {
    this.checkPermission('collaboration.presence')

    try {
      await this.api.updatePresence(sessionId, presence as any)
    } catch (error) {
      throw new SafeApiError(
        'Failed to update presence',
        'collaboration.presence',
        error
      )
    }
  }

  async getParticipants(_sessionId: string): Promise<SafeParticipant[]> {
    this.checkPermission('collaboration.read')

    try {
      // PLACEHOLDER: getParticipants method not implemented in CollaborationAPI
      // Return empty array for now until the API supports this method
      return []
    } catch (error) {
      throw new SafeApiError(
        'Failed to get participants',
        'collaboration.read',
        error
      )
    }
  }

  async subscribeToChanges(
    sessionId: string,
    callback: (changes: SafeDocumentChange[]) => void
  ): Promise<() => void> {
    this.checkPermission('collaboration.subscribe')

    try {
      const unsubscribe = await this.api.subscribeToChanges(
        sessionId,
        (changes: any[]) => {
          callback(changes.map((c) => this.sanitizeDocumentChange(c)))
        }
      )
      return unsubscribe
    } catch (error) {
      throw new SafeApiError(
        'Failed to subscribe to changes',
        'collaboration.subscribe',
        error
      )
    }
  }

  async applyChanges(
    sessionId: string,
    changes: SafeDocumentChange[]
  ): Promise<void> {
    this.checkPermission('collaboration.apply')

    try {
      await this.api.applyChanges(sessionId, changes as any)
    } catch (error) {
      throw new SafeApiError(
        'Failed to apply changes',
        'collaboration.apply',
        error
      )
    }
  }

  async resolveConflict(
    conflictId: string,
    resolution: SafeConflictResolution
  ): Promise<void> {
    this.checkPermission('collaboration.resolve')

    try {
      await this.api.resolveConflict(
        conflictId,
        {
          id: conflictId,
          localValue: resolution.value,
          strategy: resolution.strategy,
        } as any,
        {
          strategy: resolution.strategy,
          value: resolution.value,
          timestamp: new Date(),
        } as any
      )
    } catch (error) {
      throw new SafeApiError(
        'Failed to resolve conflict',
        'collaboration.resolve',
        error
      )
    }
  }

  async getConflicts(documentId: string): Promise<SafeDocumentConflict[]> {
    this.checkPermission('collaboration.read')

    try {
      const conflicts = await this.api.getConflicts(documentId)
      return conflicts.map((c) => this.sanitizeDocumentConflict(c))
    } catch (error) {
      throw new SafeApiError(
        'Failed to get conflicts',
        'collaboration.read',
        error
      )
    }
  }

  private checkPermission(action: string): void {
    if (!this.context.permissions.includes(action)) {
      throw new SafeApiError(
        `Permission denied: ${action}`,
        'permission.denied'
      )
    }
  }

  private sanitizeSession(session: any): SafeCollaborationSession {
    return {
      id: session.id,
      documentId: session.documentId,
      participants:
        session.participants?.map((p: any) => this.sanitizeParticipant(p)) ||
        [],
      permissions: session.permissions || {},
      createdAt: session.createdAt || new Date(),
      isActive: session.isActive ?? true,
    }
  }

  private sanitizeParticipant(participant: any): SafeParticipant {
    return {
      userId: participant.userId,
      name: participant.name,
      presence: this.sanitizePresence(participant.presence),
      joinedAt: participant.joinedAt || new Date(),
      lastActive: participant.lastActive || new Date(),
      permissions: participant.permissions || [],
    }
  }

  private sanitizePresence(presence: any): SafePresence {
    return {
      cursor: presence?.cursor,
      selection: presence?.selection || [],
      currentTool: presence?.currentTool || '',
      isActive: presence?.isActive ?? true,
    }
  }

  private sanitizeDocumentChange(change: any): SafeDocumentChange {
    return {
      id: change.id,
      type: change.type,
      path: change.path,
      oldValue: change.oldValue,
      newValue: change.newValue,
      timestamp: change.timestamp || new Date(),
      author: change.author,
    }
  }

  private sanitizeDocumentSnapshot(snapshot: any): SafeDocumentSnapshot {
    return {
      version: snapshot.version || 0,
      timestamp: snapshot.timestamp || new Date(),
      data: snapshot.data,
      changes:
        snapshot.changes?.map((c: any) => this.sanitizeDocumentChange(c)) || [],
    }
  }

  private sanitizeDocumentConflict(conflict: any): SafeDocumentConflict {
    return {
      id: conflict.id,
      path: conflict.path,
      localValue: conflict.localValue,
      remoteValue: conflict.remoteValue,
      commonAncestor: conflict.commonAncestor,
      participants: conflict.participants || [],
    }
  }
}

/**
 * Safe plugin API wrapper implementation
 */
class SafePluginWrapper implements SafePluginAPI {
  constructor(
    private api: PluginAPI,
    private context: ApiContext
  ) {}

  async installPlugin(
    pluginId: string,
    source: SafePluginSource
  ): Promise<SafePlugin> {
    this.checkPermission('plugins.install')

    try {
      const plugin = await this.api.installPlugin(pluginId, source as any)
      return this.sanitizePlugin(plugin)
    } catch (error) {
      throw new SafeApiError(
        'Failed to install plugin',
        'plugins.install',
        error
      )
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    this.checkPermission('plugins.uninstall')

    try {
      await this.api.uninstallPlugin(pluginId)
    } catch (error) {
      throw new SafeApiError(
        'Failed to uninstall plugin',
        'plugins.uninstall',
        error
      )
    }
  }

  async listPlugins(): Promise<SafePlugin[]> {
    this.checkPermission('plugins.read')

    try {
      const plugins = await this.api.listPlugins()
      return plugins.map((p) => this.sanitizePlugin(p))
    } catch (error) {
      throw new SafeApiError('Failed to list plugins', 'plugins.read', error)
    }
  }

  async getPlugin(pluginId: string): Promise<SafePlugin | null> {
    this.checkPermission('plugins.read')

    try {
      const plugin = await this.api.getPlugin(pluginId)
      return plugin ? this.sanitizePlugin(plugin) : null
    } catch (error) {
      throw new SafeApiError('Failed to get plugin', 'plugins.read', error)
    }
  }

  async executePlugin(
    pluginId: string,
    functionName: string,
    parameters: any[]
  ): Promise<any> {
    this.checkPermission('plugins.execute')

    try {
      // TODO: Adapt parameters to PluginContext format
      const context: any = { functionName, parameters }
      return await this.api.executePlugin(pluginId, context)
    } catch (error) {
      throw new SafeApiError(
        'Failed to execute plugin',
        'plugins.execute',
        error
      )
    }
  }

  // TODO: Implement createPlugin when PluginAPI supports it
  // async createPlugin(manifest: SafePluginManifest): Promise<SafePlugin> {
  //   this.checkPermission('plugins.create')

  //   try {
  //     const plugin = await this.api.createPlugin(manifest as any)
  //     return this.sanitizePlugin(plugin)
  //   } catch (error) {
  //     throw new SafeApiError('Failed to create plugin', 'plugins.create', error)
  //   }
  // }

  // TODO: Implement updatePlugin when PluginAPI supports it
  // async updatePlugin(
  //   pluginId: string,
  //   updates: Partial<SafePlugin>
  // ): Promise<SafePlugin> {
  //   this.checkPermission('plugins.update')

  //   try {
  //     const plugin = await this.api.updatePlugin(pluginId, updates as any)
  //     return this.sanitizePlugin(plugin)
  //   } catch (error) {
  //     throw new SafeApiError('Failed to update plugin', 'plugins.update', error)
  //   }
  // }

  // TODO: Implement validatePlugin when PluginAPI supports it
  // async validatePlugin(pluginId: string): Promise<SafeValidationResult> {
  //   this.checkPermission('plugins.validate')

  //   try {
  //     const result = await this.api.validatePlugin(pluginId)
  //     return {
  //       isValid: result.isValid,
  //       errors: result.errors || [],
  //       warnings: result.warnings || [],
  //       suggestions: result.suggestions || [],
  //     }
  //   } catch (error) {
  //     throw new SafeApiError(
  //       'Failed to validate plugin',
  //       'plugins.validate',
  //       error
  //     )
  //   }
  // }

  private checkPermission(action: string): void {
    if (!this.context.permissions.includes(action)) {
      throw new SafeApiError(
        `Permission denied: ${action}`,
        'permission.denied'
      )
    }
  }

  private sanitizePlugin(plugin: any): SafePlugin {
    return {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      author: plugin.author,
      description: plugin.description,
      manifest: this.sanitizeManifest(plugin.manifest),
      isInstalled: plugin.isInstalled ?? false,
      isEnabled: plugin.isEnabled ?? false,
      permissions:
        plugin.permissions?.map((p: any) => this.sanitizePermission(p)) || [],
      entryPoints:
        plugin.entryPoints?.map((ep: any) => this.sanitizeEntryPoint(ep)) || [],
    }
  }

  private sanitizeManifest(manifest: any): SafePluginManifest {
    return {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      main: manifest.main,
      permissions: manifest.permissions || [],
      dependencies: manifest.dependencies || {},
      activationEvents: manifest.activationEvents || [],
      contributes:
        manifest.contributes?.map((c: any) => this.sanitizeContribution(c)) ||
        [],
    }
  }

  private sanitizeContribution(contribution: any): SafePluginContribution {
    return {
      type: contribution.type,
      properties: contribution.properties || {},
    }
  }

  private sanitizePermission(permission: any): SafePluginPermission {
    return {
      type: permission.type,
      resource: permission.resource,
      actions: permission.actions || [],
    }
  }

  private sanitizeEntryPoint(entryPoint: any): SafePluginEntryPoint {
    return {
      name: entryPoint.name,
      type: entryPoint.type,
      handler: entryPoint.handler,
    }
  }
}

/**
 * Safe document API wrapper implementation
 */
class SafeDocumentWrapper implements SafeDocumentAPI {
  constructor(
    private api: AnimatorAPI,
    private context: ApiContext
  ) {}

  private sanitizeNode(node: any): SafeNode {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      properties: node.properties || {},
      transform: node.transform || {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        opacity: 1,
        anchorPoint: { x: 0.5, y: 0.5 },
      },
      children: node.children || [],
      parent: node.parent,
    }
  }

  async createDocument(template?: SafeDocumentTemplate): Promise<SafeDocument> {
    this.checkPermission('documents.create')

    try {
      const doc = await this.api.createDocument(template as any)
      return this.sanitizeDocument(doc)
    } catch (error) {
      throw new SafeApiError(
        'Failed to create document',
        'documents.create',
        error
      )
    }
  }

  async openDocument(documentId: string): Promise<SafeDocument> {
    this.checkPermission('documents.read')

    try {
      const doc = await this.api.openDocument(documentId)
      return this.sanitizeDocument(doc)
    } catch (error) {
      throw new SafeApiError('Failed to open document', 'documents.read', error)
    }
  }

  async saveDocument(documentId: string): Promise<void> {
    this.checkPermission('documents.write')

    try {
      await this.api.saveDocument(documentId)
    } catch (error) {
      throw new SafeApiError(
        'Failed to save document',
        'documents.write',
        error
      )
    }
  }

  async closeDocument(documentId: string): Promise<void> {
    this.checkPermission('documents.write')

    try {
      await this.api.closeDocument(documentId)
    } catch (error) {
      throw new SafeApiError(
        'Failed to close document',
        'documents.write',
        error
      )
    }
  }

  async getTemplates(): Promise<SafeDocumentTemplate[]> {
    this.checkPermission('documents.read')

    try {
      // Return built-in templates
      return [
        {
          name: 'Blank Document',
          description: 'Start with an empty document',
          category: 'blank',
          sceneTemplate: {
            name: 'Scene 1',
            duration: 5000,
            frameRate: 30,
            nodes: [],
          },
        },
      ]
    } catch (error) {
      throw new SafeApiError('Failed to get templates', 'documents.read', error)
    }
  }

  async getTemplate(category: string): Promise<SafeDocumentTemplate | null> {
    this.checkPermission('documents.read')

    try {
      const templates = await this.getTemplates()
      return templates.find((t) => t.category === category) || null
    } catch (error) {
      throw new SafeApiError('Failed to get template', 'documents.read', error)
    }
  }

  private checkPermission(action: string): void {
    if (!this.context.permissions.includes(action)) {
      throw new SafeApiError(
        `Permission denied: ${action}`,
        'permission.denied'
      )
    }
  }

  private sanitizeDocument(doc: any): SafeDocument {
    return {
      id: doc.id,
      name: doc.name,
      version: doc.version || 1,
      scenes: doc.scenes?.map((s: any) => this.sanitizeScene(s)) || [],
      timelines: doc.timelines?.map((t: any) => this.sanitizeTimeline(t)) || [],
      assets: doc.assets?.map((a: any) => this.sanitizeAsset(a)) || [],
      settings: this.sanitizeDocumentSettings(doc.settings),
      metadata: this.sanitizeDocumentMetadata(doc.metadata),
    }
  }

  private sanitizeScene(scene: any): SafeScene {
    return {
      id: scene.id,
      name: scene.name,
      duration: scene.duration || 5000,
      frameRate: scene.frameRate || 30,
      rootNode: scene.rootNode || 'root',
      nodes: scene.nodes?.map((n: any) => this.sanitizeNode(n)) || [],
      camera: scene.camera || {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        fieldOfView: 60,
        nearPlane: 0.1,
        farPlane: 1000,
      },
      settings: this.sanitizeSceneSettings(scene.settings),
    }
  }

  private sanitizeTimeline(timeline: any): SafeTimeline {
    return {
      id: timeline.id,
      name: timeline.name,
      duration: timeline.duration || 5000,
      frameRate: timeline.frameRate || 30,
      tracks: timeline.tracks?.map((t: any) => this.sanitizeTrack(t)) || [],
      isPlaying: timeline.isPlaying || false,
      currentTime: timeline.currentTime || 0,
    }
  }

  private sanitizeTrack(track: any): SafeTrack {
    return {
      id: track.id,
      name: track.name,
      type: track.type || 'property',
      keyframes:
        track.keyframes?.map((kf: any) => this.sanitizeKeyframe(kf)) || [],
      enabled: track.enabled ?? true,
      locked: track.locked ?? false,
    }
  }

  private sanitizeKeyframe(keyframe: any): SafeKeyframe {
    return {
      time: keyframe.time || 0,
      value: keyframe.value,
      interpolation: keyframe.interpolation || 'linear',
    }
  }

  private sanitizeAsset(asset: any): SafeAsset {
    return {
      id: asset.id,
      name: asset.name,
      type: asset.type || 'image',
      source: asset.source,
      metadata: asset.metadata || {},
    }
  }

  private sanitizeDocumentSettings(settings: any): SafeDocumentSettings {
    return {
      frameRate: settings?.frameRate || 30,
      resolution: settings?.resolution || { width: 1920, height: 1080 },
      colorSpace: settings?.colorSpace || 'srgb',
      autoSave: settings?.autoSave ?? true,
      collaboration: this.sanitizeCollaborationSettings(
        settings?.collaboration
      ),
    }
  }

  private sanitizeCollaborationSettings(
    settings: any
  ): SafeCollaborationSettings {
    return {
      enabled: settings?.enabled ?? false,
      autoJoin: settings?.autoJoin ?? false,
      permissions: settings?.permissions || {},
    }
  }

  private sanitizeDocumentMetadata(metadata: any): SafeDocumentMetadata {
    return {
      author: metadata?.author || 'Unknown',
      createdAt: metadata?.createdAt || new Date(),
      modifiedAt: metadata?.modifiedAt || new Date(),
      tags: metadata?.tags || [],
      description: metadata?.description || '',
    }
  }

  private sanitizeSceneSettings(settings: any): SafeSceneSettings {
    return {
      backgroundColor: settings?.backgroundColor || { r: 0, g: 0, b: 0, a: 1 },
      resolution: settings?.resolution || { width: 1920, height: 1080 },
      enableDepthTest: settings?.enableDepthTest ?? false,
      enableLighting: settings?.enableLighting ?? false,
      motionBlur: settings?.motionBlur ?? false,
    }
  }
}

/**
 * Safe settings API wrapper implementation
 */
class SafeSettingsWrapper implements SafeSettingsAPI {
  constructor(
    private api: AnimatorAPI,
    private context: ApiContext
  ) {}

  async getSettings(): Promise<SafeAnimatorSettings> {
    this.checkPermission('settings.read')

    try {
      const settings = await this.api.getSettings()
      return this.sanitizeSettings(settings)
    } catch (error) {
      throw new SafeApiError('Failed to get settings', 'settings.read', error)
    }
  }

  async updateSettings(settings: Partial<SafeAnimatorSettings>): Promise<void> {
    this.checkPermission('settings.write')

    try {
      await this.api.updateSettings(settings as any)
    } catch (error) {
      throw new SafeApiError(
        'Failed to update settings',
        'settings.write',
        error
      )
    }
  }

  async getShortcuts(): Promise<Record<string, string>> {
    this.checkPermission('settings.read')

    try {
      const settings = await this.api.getSettings()
      return settings.shortcuts || {}
    } catch (error) {
      throw new SafeApiError('Failed to get shortcuts', 'settings.read', error)
    }
  }

  async setShortcut(action: string, keys: string): Promise<void> {
    this.checkPermission('settings.write')

    try {
      const settings = await this.api.getSettings()
      const shortcuts = { ...settings.shortcuts, [action]: keys }
      await this.api.updateSettings({ shortcuts } as any)
    } catch (error) {
      throw new SafeApiError('Failed to set shortcut', 'settings.write', error)
    }
  }

  async resetShortcuts(): Promise<void> {
    this.checkPermission('settings.write')

    try {
      await this.api.updateSettings({
        shortcuts: {
          execute: 'ctrl+enter',
          save: 'ctrl+s',
          new: 'ctrl+n',
          open: 'ctrl+o',
          undo: 'ctrl+z',
          redo: 'ctrl+y',
        },
      } as any)
    } catch (error) {
      throw new SafeApiError(
        'Failed to reset shortcuts',
        'settings.write',
        error
      )
    }
  }

  private checkPermission(action: string): void {
    if (!this.context.permissions.includes(action)) {
      throw new SafeApiError(
        `Permission denied: ${action}`,
        'permission.denied'
      )
    }
  }

  private sanitizeSettings(settings: any): SafeAnimatorSettings {
    return {
      ui: this.sanitizeUISettings(settings.ui),
      performance: this.sanitizePerformanceSettings(settings.performance),
      collaboration: this.sanitizeCollaborationSettings(settings.collaboration),
      shortcuts: settings.shortcuts || {},
      theme: this.sanitizeThemeSettings(settings.theme),
    }
  }

  private sanitizeUISettings(settings: any): SafeUISettings {
    return {
      language: settings?.language || 'en',
      timeFormat: settings?.timeFormat || 'frames',
      gridSize: settings?.gridSize || 20,
      snapToGrid: settings?.snapToGrid ?? true,
      showGuides: settings?.showGuides ?? true,
    }
  }

  private sanitizePerformanceSettings(settings: any): SafePerformanceSettings {
    return {
      maxUndoSteps: settings?.maxUndoSteps || 50,
      autoSaveInterval: settings?.autoSaveInterval || 30000,
      previewQuality: settings?.previewQuality || 'preview',
      cacheSize: settings?.cacheSize || 100,
    }
  }

  private sanitizeCollaborationSettings(
    settings: any
  ): SafeCollaborationSettings {
    return {
      enabled: settings?.enabled ?? false,
      autoJoin: settings?.autoJoin ?? false,
      permissions: settings?.permissions || {},
    }
  }

  private sanitizeThemeSettings(settings: any): SafeThemeSettings {
    return {
      mode: settings?.mode || 'dark',
      accentColor: settings?.accentColor || '#007acc',
      fontSize: settings?.fontSize || 'medium',
    }
  }
}

/**
 * Safe system API wrapper implementation
 */
class SafeSystemWrapper implements SafeSystemAPI {
  constructor(
    private api: AnimatorAPI,
    private context: ApiContext
  ) {}

  async getSystemInfo(): Promise<SafeSystemInfo> {
    this.checkPermission('system.read')

    try {
      const info = await this.api.getSystemInfo()
      return this.sanitizeSystemInfo(info)
    } catch (error) {
      throw new SafeApiError('Failed to get system info', 'system.read', error)
    }
  }

  async getCapabilities(): Promise<SafeAnimatorCapabilities> {
    this.checkPermission('system.read')

    try {
      const capabilities = await this.api.getCapabilities()
      return this.sanitizeCapabilities(capabilities)
    } catch (error) {
      throw new SafeApiError('Failed to get capabilities', 'system.read', error)
    }
  }

  async getPerformanceMetrics(): Promise<SafePerformanceMetrics> {
    this.checkPermission('system.monitor')

    try {
      // Return mock performance metrics
      return {
        frameTime: 16.67, // 60fps
        memoryUsage: 256,
        cpuUsage: 25,
        gpuUsage: 40,
      }
    } catch (error) {
      throw new SafeApiError(
        'Failed to get performance metrics',
        'system.monitor',
        error
      )
    }
  }

  async getMemoryUsage(): Promise<SafeMemoryUsage> {
    this.checkPermission('system.monitor')

    try {
      // Return mock memory usage
      return {
        heapUsed: 128,
        heapTotal: 512,
        external: 64,
      }
    } catch (error) {
      throw new SafeApiError(
        'Failed to get memory usage',
        'system.monitor',
        error
      )
    }
  }

  hasFeature(feature: string): boolean {
    const supportedFeatures = [
      'sceneGraph',
      'timeline',
      'rendering',
      'collaboration',
      'plugins',
      'developerMode',
      'autoSave',
      'undoRedo',
    ]
    return supportedFeatures.includes(feature)
  }

  getSupportedFormats(): string[] {
    return [
      'png',
      'jpg',
      'jpeg',
      'gif',
      'webp',
      'mp4',
      'webm',
      'mov',
      'mp3',
      'wav',
      'ogg',
      'svg',
      'pdf',
    ]
  }

  getMaxSceneComplexity(): number {
    return 10000 // Maximum nodes per scene
  }

  private checkPermission(action: string): void {
    if (!this.context.permissions.includes(action)) {
      throw new SafeApiError(
        `Permission denied: ${action}`,
        'permission.denied'
      )
    }
  }

  private sanitizeSystemInfo(info: any): SafeSystemInfo {
    return {
      version: info.version || '1.0.0',
      platform: info.platform || 'web',
      gpu: this.sanitizeGPUInfo(info.gpu),
      memory: this.sanitizeMemoryInfo(info.memory),
      performance: this.sanitizePerformanceInfo(info.performance),
    }
  }

  private sanitizeGPUInfo(gpu: any): SafeGPUInfo {
    return {
      vendor: gpu?.vendor || 'Unknown',
      renderer: gpu?.renderer || 'Unknown',
      version: gpu?.version || 'Unknown',
      memory: gpu?.memory || 0,
      maxTextureSize: gpu?.maxTextureSize || 4096,
    }
  }

  private sanitizeMemoryInfo(memory: any): SafeMemoryInfo {
    return {
      total: memory?.total || 0,
      available: memory?.available || 0,
      used: memory?.used || 0,
    }
  }

  private sanitizePerformanceInfo(performance: any): SafePerformanceInfo {
    return {
      cpuCores: performance?.cpuCores || 1,
      maxFrameRate: performance?.maxFrameRate || 60,
      supportedFormats: performance?.supportedFormats || [],
      features: performance?.features || [],
    }
  }

  private sanitizeCapabilities(capabilities: any): SafeAnimatorCapabilities {
    return {
      maxSceneComplexity: capabilities?.maxSceneComplexity || 10000,
      maxTimelineDuration:
        capabilities?.maxTimelineDuration || 24 * 60 * 60 * 1000,
      supportedAssetTypes: capabilities?.supportedAssetTypes || [
        'image',
        'video',
        'audio',
      ],
      collaborationFeatures: capabilities?.collaborationFeatures || [
        'realtime',
        'presence',
      ],
      exportFormats: capabilities?.exportFormats || ['mp4', 'png', 'gif'],
      pluginSupport: capabilities?.pluginSupport ?? true,
    }
  }
}

/**
 * Safe utilities implementation
 */
class SafeUtilsImpl implements SafeUtils {
  log(...args: any[]): void {
    logger.info('[API]', ...args)
  }

  generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  formatTime(time: number): string {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const frames = Math.floor((time % 1000) / 33.333) // Assuming 30fps

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  formatColor(color: any): string {
    if (typeof color === 'object' && color.r !== undefined) {
      const { r, g, b, a = 1 } = color
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
    }
    return String(color)
  }

  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }) as T
  }

  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }) as T
  }
}

/**
 * Safe API error class
 */
export class SafeApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'SafeApiError'
  }
}
