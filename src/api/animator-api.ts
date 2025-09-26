/**
 * @fileoverview Core Animator Platform API
 * @description Comprehensive TypeScript API for the Animator motion graphics platform
 * @author @darianrosebrook
 */

// ============================================================================
// CORE TYPES & INTERFACES
// ============================================================================

/**
 * Core time and coordinate types
 */
export type Time = number // milliseconds
export type FrameRate = number // frames per second
export type Point2D = { x: number; y: number }
export type Point3D = { x: number; y: number; z: number }
export type Size2D = { width: number; height: number }
export type Color = { r: number; g: number; b: number; a?: number }

/**
 * Animation and keyframe types
 */
export interface Keyframe<T = any> {
  time: Time
  value: T
  interpolation: InterpolationMode
  easing?: BezierCurve
}

export enum InterpolationMode {
  Linear = 'linear',
  Bezier = 'bezier',
  Stepped = 'stepped',
  Smooth = 'smooth',
}

export interface BezierCurve {
  p1x: number // Control point 1 X
  p1y: number // Control point 1 Y
  p2x: number // Control point 2 X
  p2y: number // Control point 2 Y
}

/**
 * Scene graph node types
 */
export interface BaseNode {
  id: string
  name: string
  type: NodeType
  properties: PropertyMap
  transform: Transform3D
  parentId?: string
  children: string[] // Array of child node IDs
}

export enum NodeType {
  // Basic shapes
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Polygon = 'polygon',
  Path = 'path',

  // Text and typography
  Text = 'text',
  TextPath = 'text_path',

  // Media
  Image = 'image',
  Video = 'video',
  Audio = 'audio',

  // Effects
  Effect = 'effect',
  AdjustmentLayer = 'adjustment_layer',

  // Groups and organization
  Group = 'group',
  Composition = 'composition',

  // 3D and camera
  Camera = 'camera',
  Light = 'light',

  // Rigging and animation
  Rig = 'rig',
  Bone = 'bone',
  Controller = 'controller',
}

export interface PropertyMap {
  [key: string]: PropertyValue
}

export type PropertyValue =
  | number
  | string
  | boolean
  | Point2D
  | Point3D
  | Color
  | Size2D
  | AnimationCurve
  | any[]

/**
 * Transform system
 */
export interface Transform3D {
  position: Point3D
  rotation: Point3D // degrees
  scale: Point3D
  anchorPoint: Point2D
  opacity: number // 0-1
}

export interface Transform2D {
  position: Point2D
  rotation: number // degrees
  scale: Point2D
  anchorPoint: Point2D
  opacity: number // 0-1
}

/**
 * Animation curve types
 */
export interface AnimationCurve {
  keyframes: Keyframe[]
  interpolation: InterpolationMode
  extrapolation?: ExtrapolationMode
}

export enum ExtrapolationMode {
  Hold = 'hold',
  Loop = 'loop',
  PingPong = 'ping_pong',
  Linear = 'linear',
}

// ============================================================================
// SCENE GRAPH API
// ============================================================================

/**
 * Core scene graph management interface
 */
export interface SceneGraphAPI {
  // Node management
  createNode(type: NodeType, parentId?: string): Promise<BaseNode>
  getNode(nodeId: string): Promise<BaseNode | null>
  updateNode(nodeId: string, updates: Partial<BaseNode>): Promise<BaseNode>
  deleteNode(nodeId: string): Promise<boolean>

  // Hierarchy management
  setParent(nodeId: string, parentId: string | null): Promise<void>
  getChildren(nodeId: string): Promise<BaseNode[]>
  getAncestors(nodeId: string): Promise<BaseNode[]>
  getDescendants(nodeId: string): Promise<BaseNode[]>

  // Property management
  setProperty(nodeId: string, key: string, value: PropertyValue): Promise<void>
  setProperties(nodeId: string, properties: PropertyMap): Promise<void>
  getProperty(nodeId: string, key: string): Promise<PropertyValue | undefined>
  getProperties(nodeId: string): Promise<PropertyMap>

  // Animation and keyframes
  setKeyframe(
    nodeId: string,
    propertyPath: string,
    keyframe: Keyframe
  ): Promise<void>
  removeKeyframe(
    nodeId: string,
    propertyPath: string,
    time: Time
  ): Promise<void>
  getKeyframes(nodeId: string, propertyPath: string): Promise<Keyframe[]>

  // Evaluation
  evaluate(time: Time): Promise<SceneState>
  evaluateRange(
    startTime: Time,
    endTime: Time,
    step?: Time
  ): Promise<SceneState[]>
}

/**
 * Scene state at a specific time
 */
export interface SceneState {
  time: Time
  nodes: Map<string, NodeState>
  globalProperties: PropertyMap
}

export interface NodeState {
  nodeId: string
  transform: Transform3D
  properties: PropertyMap
  bounds: Rectangle
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

// ============================================================================
// ANIMATION & TIMELINE API
// ============================================================================

/**
 * Timeline and animation management interface
 */
export interface TimelineAPI {
  // Timeline management
  createTimeline(
    name: string,
    duration: Time,
    frameRate: FrameRate
  ): Promise<Timeline>
  getTimeline(timelineId: string): Promise<Timeline | null>
  updateTimeline(
    timelineId: string,
    updates: Partial<Timeline>
  ): Promise<Timeline>
  deleteTimeline(timelineId: string): Promise<boolean>

  // Playback control
  play(timelineId: string, startTime?: Time): Promise<void>
  pause(timelineId: string): Promise<void>
  stop(timelineId: string): Promise<void>
  seek(timelineId: string, time: Time): Promise<void>

  // Track management
  createTrack(
    timelineId: string,
    type: TrackType,
    name: string
  ): Promise<TimelineTrack>
  getTracks(timelineId: string): Promise<TimelineTrack[]>
  updateTrack(
    trackId: string,
    updates: Partial<TimelineTrack>
  ): Promise<TimelineTrack>

  // Keyframe management
  addKeyframe(trackId: string, keyframe: Keyframe): Promise<void>
  removeKeyframe(trackId: string, time: Time): Promise<void>
  updateKeyframe(
    trackId: string,
    time: Time,
    updates: Partial<Keyframe>
  ): Promise<void>

  // Markers
  addMarker(
    timelineId: string,
    time: Time,
    name: string,
    color?: string
  ): Promise<TimelineMarker>
  removeMarker(markerId: string): Promise<void>
  getMarkers(timelineId: string): Promise<TimelineMarker[]>
}

/**
 * Timeline data structures
 */
export interface Timeline {
  id: string
  name: string
  duration: Time
  frameRate: FrameRate
  tracks: TimelineTrack[]
  markers: TimelineMarker[]
  isPlaying: boolean
  currentTime: Time
}

export interface TimelineTrack {
  id: string
  name: string
  type: TrackType
  keyframes: Keyframe[]
  enabled: boolean
  locked: boolean
  muted?: boolean
  color?: string
}

export enum TrackType {
  Property = 'property',
  Audio = 'audio',
  Video = 'video',
  Data = 'data',
}

export interface TimelineMarker {
  id: string
  time: Time
  name: string
  color?: string
  duration?: Time
}

// ============================================================================
// RENDERING API
// ============================================================================

/**
 * GPU-accelerated rendering interface
 */
export interface RenderingAPI {
  // Rendering control
  renderFrame(
    sceneId: string,
    time: Time,
    options?: RenderOptions
  ): Promise<RenderResult>
  renderRange(
    sceneId: string,
    startTime: Time,
    endTime: Time,
    options?: RenderOptions
  ): Promise<RenderResult[]>

  // Preview and viewport
  createViewport(
    container: HTMLElement,
    options?: ViewportOptions
  ): Promise<Viewport>
  updateViewport(
    viewportId: string,
    updates: Partial<ViewportOptions>
  ): Promise<void>
  destroyViewport(viewportId: string): Promise<void>

  // GPU resource management
  uploadAsset(
    assetId: string,
    data: ArrayBuffer | ImageData
  ): Promise<GPUResource>
  createShader(name: string, wgslSource: string): Promise<Shader>
  createMaterial(properties: MaterialProperties): Promise<Material>

  // Render settings and quality
  setRenderSettings(settings: RenderSettings): Promise<void>
  getRenderSettings(): Promise<RenderSettings>
  validateRenderCapabilities(): Promise<RenderCapabilities>
}

/**
 * Render data structures
 */
export interface RenderOptions {
  quality: RenderQuality
  resolution: Size2D
  frameRate: FrameRate
  colorSpace: ColorSpace
  includeAudio: boolean
  cache: boolean
}

export enum RenderQuality {
  Draft = 'draft',
  Preview = 'preview',
  Final = 'final',
}

export enum ColorSpace {
  sRGB = 'srgb',
  Linear = 'linear',
  P3 = 'p3',
  Rec709 = 'rec709',
}

export interface RenderResult {
  frameId: string
  time: Time
  duration: number // milliseconds
  frameBuffer: GPUTexture
  metadata: RenderMetadata
  errors: string[]
}

export interface RenderMetadata {
  resolution: Size2D
  frameRate: FrameRate
  colorSpace: ColorSpace
  memoryUsage: number
  gpuTime: number
}

export interface Viewport {
  id: string
  container: HTMLElement
  camera: CameraState
  isPlaying: boolean
  frameRate: number
}

export interface ViewportOptions {
  width: number
  height: number
  backgroundColor: Color
  showGuides: boolean
  showGrid: boolean
  zoom: number
  pan: Point2D
}

export interface CameraState {
  position: Point2D
  zoom: number
  rotation: number
}

export interface RenderSettings {
  quality: RenderQuality
  resolution: Size2D
  frameRate: FrameRate
  colorSpace: ColorSpace
  antiAliasing: boolean
  motionBlur: boolean
  depthOfField: boolean
}

export interface RenderCapabilities {
  maxTextureSize: number
  maxViewportSize: Size2D
  supportedFormats: string[]
  gpuVendor: string
  gpuMemory: number
}

// GPU Resource Management
export interface GPUResource {
  id: string
  type: GPUResourceType
  size: number
  format: string
}

export enum GPUResourceType {
  Texture = 'texture',
  Buffer = 'buffer',
  Shader = 'shader',
  Material = 'material',
}

export interface Shader {
  id: string
  name: string
  vertexSource: string
  fragmentSource: string
  uniforms: ShaderUniform[]
}

export interface ShaderUniform {
  name: string
  type: UniformType
  value: any
}

export enum UniformType {
  Float = 'float',
  Vec2 = 'vec2',
  Vec3 = 'vec3',
  Vec4 = 'vec4',
  Mat4 = 'mat4',
  Texture = 'texture',
  Int = 'int',
  Bool = 'bool',
}

export interface Material {
  id: string
  name: string
  shader: string // shader ID
  properties: MaterialProperties
  textures: Map<string, string> // name -> texture ID
}

export interface MaterialProperties {
  [key: string]: number | Point2D | Point3D | Color | boolean
}

// ============================================================================
// COLLABORATION API
// ============================================================================

/**
 * Real-time collaboration interface
 */
export interface CollaborationAPI {
  // Session management
  createSession(
    documentId: string,
    participants: ParticipantInfo[]
  ): Promise<CollaborationSession>
  joinSession(
    sessionId: string,
    participant: ParticipantInfo
  ): Promise<JoinSessionResult>
  leaveSession(sessionId: string): Promise<void>
  getSession(sessionId: string): Promise<CollaborationSession | null>

  // Presence and cursors
  updatePresence(sessionId: string, presence: Presence): Promise<void>
  getParticipants(sessionId: string): Promise<Participant[]>

  // Document synchronization
  subscribeToChanges(
    sessionId: string,
    callback: (changes: DocumentChange[]) => void
  ): Promise<UnsubscribeFn>
  applyChanges(sessionId: string, changes: DocumentChange[]): Promise<void>

  // Conflict resolution
  resolveConflict(
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<void>
  getConflicts(documentId: string): Promise<DocumentConflict[]>
}

/**
 * Collaboration data structures
 */
export interface CollaborationSession {
  id: string
  documentId: string
  participants: Participant[]
  permissions: SessionPermissions
  createdAt: Date
  isActive: boolean
}

export interface ParticipantInfo {
  userId: string
  name: string
  email?: string
  avatar?: string
  color: string
  permissions: string[]
}

export interface Participant {
  userId: string
  name: string
  presence: Presence
  joinedAt: Date
  lastActive: Date
  permissions: string[]
}

export interface Presence {
  cursor?: Point2D
  selection: string[]
  currentTool: string
  isActive: boolean
}

export interface JoinSessionResult {
  session: CollaborationSession
  participant: Participant
  documentState: DocumentSnapshot
}

export interface SessionPermissions {
  [userId: string]: {
    canEdit: boolean
    canComment: boolean
    canInvite: boolean
    canExport: boolean
  }
}

export interface DocumentChange {
  id: string
  type: ChangeType
  path: string // JSON path to changed property
  oldValue?: any
  newValue: any
  timestamp: Date
  author: string
}

export enum ChangeType {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Move = 'move',
}

export interface ConflictResolution {
  conflictId: string
  strategy: ResolutionStrategy
  value?: any
}

export enum ResolutionStrategy {
  UseMine = 'use_mine',
  UseTheirs = 'use_theirs',
  Merge = 'merge',
  Manual = 'manual',
}

export interface DocumentConflict {
  id: string
  path: string
  localValue: any
  remoteValue: any
  commonAncestor: any
  participants: string[]
}

export interface DocumentSnapshot {
  version: number
  timestamp: Date
  data: any // Full document state
  changes: DocumentChange[]
}

export type UnsubscribeFn = () => void

// ============================================================================
// PLUGIN API
// ============================================================================

/**
 * Plugin and extensibility interface
 */
export interface PluginAPI {
  // Plugin management
  installPlugin(pluginId: string, source: PluginSource): Promise<Plugin>
  uninstallPlugin(pluginId: string): Promise<void>
  listPlugins(): Promise<Plugin[]>
  getPlugin(pluginId: string): Promise<Plugin | null>

  // Plugin execution
  executePlugin(
    pluginId: string,
    functionName: string,
    parameters: any[],
    context?: PluginContext
  ): Promise<any>

  // Plugin development
  createPlugin(manifest: PluginManifest): Promise<Plugin>
  updatePlugin(pluginId: string, updates: Partial<Plugin>): Promise<Plugin>
  validatePlugin(pluginId: string): Promise<ValidationResult>
}

/**
 * Plugin system data structures
 */
export interface Plugin {
  id: string
  name: string
  version: string
  author: string
  description: string
  manifest: PluginManifest
  isInstalled: boolean
  isEnabled: boolean
  permissions: PluginPermission[]
  entryPoints: PluginEntryPoint[]
}

export interface PluginSource {
  type: PluginSourceType
  url?: string
  content?: string
  registry?: string
}

export enum PluginSourceType {
  URL = 'url',
  File = 'file',
  Registry = 'registry',
  GitHub = 'github',
}

export interface PluginManifest {
  name: string
  version: string
  description: string
  author: string
  main: string
  permissions: string[]
  dependencies: Record<string, string>
  activationEvents: string[]
  contributes: PluginContribution[]
}

export interface PluginContribution {
  type: ContributionType
  properties: Record<string, any>
}

export enum ContributionType {
  Command = 'command',
  MenuItem = 'menu_item',
  Panel = 'panel',
  Effect = 'effect',
  Tool = 'tool',
  Format = 'format',
}

export interface PluginPermission {
  type: PermissionType
  resource: string
  actions: string[]
}

export enum PermissionType {
  Read = 'read',
  Write = 'write',
  Execute = 'execute',
  Network = 'network',
}

export interface PluginEntryPoint {
  name: string
  type: EntryPointType
  handler: string
}

export enum EntryPointType {
  Command = 'command',
  EventHandler = 'event_handler',
  RenderHook = 'render_hook',
  MenuHandler = 'menu_handler',
}

export interface PluginContext {
  document: DocumentContext
  selection: SelectionContext
  viewport: ViewportContext
  timeline: TimelineContext
}

export interface DocumentContext {
  id: string
  version: number
  sceneGraph: SceneGraphContext
  metadata: Record<string, any>
}

export interface SceneGraphContext {
  rootNode: string
  selectedNodes: string[]
  visibleNodes: string[]
}

export interface SelectionContext {
  nodeIds: string[]
  bounds: Rectangle
  properties: PropertyMap
}

export interface ViewportContext {
  camera: CameraState
  zoom: number
  bounds: Rectangle
}

export interface TimelineContext {
  currentTime: Time
  duration: Time
  isPlaying: boolean
  selectedTracks: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// ============================================================================
// MAIN ANIMATOR API
// ============================================================================

/**
 * Main Animator platform API
 * Provides unified access to all subsystems
 */
export interface AnimatorAPI {
  // Core subsystems
  readonly sceneGraph: SceneGraphAPI
  readonly timeline: TimelineAPI
  readonly rendering: RenderingAPI
  readonly collaboration: CollaborationAPI
  readonly plugins: PluginAPI

  // Document management
  createDocument(template?: DocumentTemplate): Promise<Document>
  openDocument(documentId: string): Promise<Document>
  saveDocument(documentId: string): Promise<void>
  closeDocument(documentId: string): Promise<void>

  // Global settings and preferences
  getSettings(): Promise<AnimatorSettings>
  updateSettings(settings: Partial<AnimatorSettings>): Promise<void>

  // System information
  getSystemInfo(): Promise<SystemInfo>
  getCapabilities(): Promise<AnimatorCapabilities>
}

/**
 * Document and project management
 */
export interface Document {
  id: string
  name: string
  version: number
  scenes: Scene[]
  timelines: Timeline[]
  assets: Asset[]
  settings: DocumentSettings
  metadata: DocumentMetadata
}

export interface Scene {
  id: string
  name: string
  duration: Time
  frameRate: FrameRate
  rootNode: string
  camera: Camera
  settings: SceneSettings
}

export interface Camera {
  id: string
  type: CameraType
  transform: Transform3D
  settings: CameraSettings
}

export enum CameraType {
  Perspective = 'perspective',
  Orthographic = 'orthographic',
}

export interface CameraSettings {
  fieldOfView: number
  nearPlane: number
  farPlane: number
  aspectRatio: number
}

export interface Asset {
  id: string
  name: string
  type: AssetType
  source: string // URL or file path
  metadata: AssetMetadata
}

export enum AssetType {
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Font = 'font',
  Vector = 'vector',
  Texture = 'texture',
}

export interface AssetMetadata {
  width?: number
  height?: number
  duration?: number
  frameRate?: number
  colorSpace?: string
  hasAlpha?: boolean
}

export interface DocumentTemplate {
  name: string
  description: string
  category: TemplateCategory
  sceneTemplate: SceneTemplate
}

export enum TemplateCategory {
  TitleSequence = 'title_sequence',
  Explainer = 'explainer',
  SocialMedia = 'social_media',
  Presentation = 'presentation',
  Blank = 'blank',
}

export interface SceneTemplate {
  name: string
  duration: Time
  frameRate: FrameRate
  nodes: NodeTemplate[]
}

export interface NodeTemplate {
  type: NodeType
  name: string
  properties: PropertyMap
  children: NodeTemplate[]
}

export interface DocumentSettings {
  frameRate: FrameRate
  resolution: Size2D
  colorSpace: ColorSpace
  autoSave: boolean
  collaboration: CollaborationSettings
}

export interface CollaborationSettings {
  enabled: boolean
  autoJoin: boolean
  permissions: SessionPermissions
}

export interface DocumentMetadata {
  author: string
  createdAt: Date
  modifiedAt: Date
  tags: string[]
  description: string
}

export interface SceneSettings {
  backgroundColor: Color
  enableDepthTest: boolean
  enableLighting: boolean
  motionBlur: boolean
}

/**
 * Global settings and preferences
 */
export interface AnimatorSettings {
  ui: UISettings
  performance: PerformanceSettings
  collaboration: CollaborationSettings
  shortcuts: KeyboardShortcuts
  theme: ThemeSettings
}

export interface UISettings {
  language: string
  timeFormat: TimeFormat
  gridSize: number
  snapToGrid: boolean
  showGuides: boolean
}

export enum TimeFormat {
  Frames = 'frames',
  Timecode = 'timecode',
  Milliseconds = 'milliseconds',
}

export interface PerformanceSettings {
  maxUndoSteps: number
  autoSaveInterval: number
  previewQuality: RenderQuality
  cacheSize: number
}

export interface KeyboardShortcuts {
  [action: string]: string // action -> key combination
}

export interface ThemeSettings {
  mode: ThemeMode
  accentColor: string
  fontSize: FontSize
}

export enum ThemeMode {
  Light = 'light',
  Dark = 'dark',
  Auto = 'auto',
}

export enum FontSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

/**
 * System information and capabilities
 */
export interface SystemInfo {
  version: string
  platform: string
  gpu: GPUInfo
  memory: MemoryInfo
  performance: PerformanceInfo
}

export interface GPUInfo {
  vendor: string
  renderer: string
  version: string
  memory: number
  maxTextureSize: number
}

export interface MemoryInfo {
  total: number
  available: number
  used: number
}

export interface PerformanceInfo {
  cpuCores: number
  maxFrameRate: number
  supportedFormats: string[]
  features: string[]
}

export interface AnimatorCapabilities {
  maxSceneComplexity: number
  maxTimelineDuration: Time
  supportedAssetTypes: AssetType[]
  collaborationFeatures: string[]
  exportFormats: string[]
  pluginSupport: boolean
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Result type for operations that can fail
 */
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Event types for real-time updates
 */
export interface AnimatorEvent<T = any> {
  type: string
  timestamp: Date
  source: string
  data: T
}

export interface EventEmitter {
  on<T = any>(event: string, listener: (event: AnimatorEvent<T>) => void): void
  off(event: string, listener: (event: AnimatorEvent) => void): void
  emit<T = any>(event: string, data: T): void
}

// ============================================================================
// CONSTANTS AND ENUMS
// ============================================================================

/**
 * Time constants
 */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  MAX_TIMELINE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const

/**
 * Frame rate presets
 */
export const FRAME_RATE_PRESETS = {
  FILM_24: 24,
  PAL_25: 25,
  NTSC_30: 29.97,
  FILM_30: 30,
  HDTV_60: 60,
  HIGH_SPEED_120: 120,
} as const

/**
 * Default values
 */
export const DEFAULTS = {
  DOCUMENT: {
    NAME: 'Untitled Project',
    FRAME_RATE: FRAME_RATE_PRESETS.HDTV_60,
    DURATION: 10 * 1000, // 10 seconds
  },
  SCENE: {
    NAME: 'Scene 1',
    BACKGROUND_COLOR: { r: 0, g: 0, b: 0, a: 1 },
  },
  NODE: {
    OPACITY: 1,
    SCALE: { x: 1, y: 1, z: 1 },
    ANCHOR_POINT: { x: 0, y: 0 },
  },
} as const

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guards for runtime type checking
 */
export const TypeGuards = {
  isBaseNode: (value: any): value is BaseNode => {
    return (
      value && typeof value.id === 'string' && typeof value.type === 'string'
    )
  },

  isKeyframe: <T>(value: any): value is Keyframe<T> => {
    return value && typeof value.time === 'number' && value.value !== undefined
  },

  isAnimationCurve: (value: any): value is AnimationCurve => {
    return value && Array.isArray(value.keyframes) && value.interpolation
  },

  isTransform3D: (value: any): value is Transform3D => {
    return value && value.position && value.rotation && value.scale
  },
}

/**
 * Utility functions for common operations
 */
export const Utils = {
  /**
   * Convert time to frame number
   */
  timeToFrame: (time: Time, frameRate: FrameRate): number => {
    return Math.round((time * frameRate) / 1000)
  },

  /**
   * Convert frame number to time
   */
  frameToTime: (frame: number, frameRate: FrameRate): Time => {
    return (frame * 1000) / frameRate
  },

  /**
   * Format time as timecode (HH:MM:SS:FF)
   */
  formatTimecode: (time: Time, frameRate: FrameRate): string => {
    const totalSeconds = Math.floor(time / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const frames = Utils.timeToFrame(time % 1000, frameRate)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  },

  /**
   * Deep clone an object
   */
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj))
  },

  /**
   * Generate a UUID v4
   */
  generateId: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  },
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Main API instance - singleton pattern
 */
let _animatorAPI: AnimatorAPI | null = null

export const getAnimatorAPI = (): AnimatorAPI => {
  if (!_animatorAPI) {
    throw new Error(
      'Animator API not initialized. Call initializeAnimatorAPI() first.'
    )
  }
  return _animatorAPI
}

export const initializeAnimatorAPI = (
  config?: Partial<AnimatorAPI>
): AnimatorAPI => {
  if (_animatorAPI) {
    return _animatorAPI
  }

  // This would be implemented with actual subsystem instances
  _animatorAPI = {
    sceneGraph: {} as SceneGraphAPI, // Would be actual implementation
    timeline: {} as TimelineAPI,
    rendering: {} as RenderingAPI,
    collaboration: {} as CollaborationAPI,
    plugins: {} as PluginAPI,

    createDocument: async () => ({}) as Document,
    openDocument: async () => ({}) as Document,
    saveDocument: async () => {},
    closeDocument: async () => {},

    getSettings: async () => ({}) as AnimatorSettings,
    updateSettings: async () => {},

    getSystemInfo: async () => ({}) as SystemInfo,
    getCapabilities: async () => ({}) as AnimatorCapabilities,
  }

  return _animatorAPI
}

// Export all types and interfaces for external use
export * from './types'
export * from './scene-graph'
export * from './timeline'
export * from './rendering'
export * from './collaboration'
export * from './plugins'
