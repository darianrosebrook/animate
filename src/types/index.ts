/**
 * @fileoverview Core type definitions for the Animator motion graphics platform
 * @author @darianrosebrook
 */

// Import effect types
import { EffectType, BlendMode, EffectParameters } from './effects'

// Core time and coordinate types
export type Time = number
export type FrameRate = number
export type Point2D = { x: number; y: number }

// Common frame rate presets for motion graphics
export const FRAME_RATE_PRESETS = {
  '23.976': 23.976, // Film standard
  '24': 24, // Film standard
  '25': 25, // PAL
  '29.97': 29.97, // NTSC
  '30': 30, // NTSC
  '50': 50, // PAL double
  '59.94': 59.94, // NTSC double
  '60': 60, // Modern standard
  '120': 120, // High frame rate
} as const

export type FrameRatePreset = keyof typeof FRAME_RATE_PRESETS
export type Point3D = { x: number; y: number; z: number }
export type Size2D = { width: number; height: number }
export type Color = { r: number; g: number; b: number; a?: number }

// Animation and keyframe types
export interface Keyframe {
  time: Time
  value: any
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
  p1x: number
  p1y: number
  p2x: number
  p2y: number
}

// Scene graph node types
export interface SceneNode {
  id: string
  name: string
  type: NodeType
  properties: PropertyMap
  children: SceneNode[]
  parent?: SceneNode
}

export enum NodeType {
  Transform = 'transform',
  Shape = 'shape',
  Text = 'text',
  Media = 'media',
  Effect = 'effect',
  Group = 'group',
  Camera = 'camera',
}

export interface BaseNode {
  id: string
  name: string
  type: NodeType
  properties: PropertyMap
  children: BaseNode[]
  parent?: BaseNode
}

export interface PropertyMap {
  [key: string]: PropertyValue
}

// Scene graph types
export interface SceneGraph {
  addNode(node: SceneNode, parentId?: string): Result<SceneNode>
  removeNode(nodeId: string): Result<boolean>
  updateNodeProperties(
    nodeId: string,
    properties: PropertyMap
  ): Result<SceneNode>
  getNode(nodeId: string): Result<SceneNode>
  evaluate(time: Time, context: EvaluationContext): Result<SceneNode[]>
}

// UI Mode System
export enum UIMode {
  Design = 'design',
  Animate = 'animate',
}

export enum ViewMode {
  SceneByScene = 'scene-by-scene',
  Canvas = 'canvas',
}

export interface Scene {
  id: string
  name: string
  thumbnail?: string
  layers: SceneNode[]
  duration: number
  frameRate: FrameRate
}

export interface Project {
  id: string
  name: string
  scenes: Scene[]
  currentSceneId: string | null
  mode: UIMode
  viewMode: ViewMode
  selectedLayerIds: string[]
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

// Type guard helpers for PropertyValue
export function isPoint2D(value: PropertyValue): value is Point2D {
  return (
    typeof value === 'object' && value !== null && 'x' in value && 'y' in value
  )
}

export function isPoint3D(value: PropertyValue): value is Point3D {
  return (
    typeof value === 'object' &&
    value !== null &&
    'x' in value &&
    'y' in value &&
    'z' in value
  )
}

export function isSize2D(value: PropertyValue): value is Size2D {
  return (
    typeof value === 'object' &&
    value !== null &&
    'width' in value &&
    'height' in value
  )
}

// Animation curve types
export interface AnimationCurve {
  keyframes: Keyframe[]
  interpolation: InterpolationMode
}

// Transform types
export interface Transform {
  position: Point3D
  rotation: Point3D
  scale: Point3D
  anchorPoint: Point2D
  opacity: number
}

// Timeline types
export interface Timeline {
  id?: string
  name?: string
  duration: Time
  frameRate: FrameRate
  tracks: TimelineTrack[]
  markers: TimelineMarker[]
  playbackState?: PlaybackState
  settings?: TimelineSettings
  metadata?: TimelineMetadata
}

export interface PlaybackState {
  isPlaying: boolean
  currentTime: Time
  playbackSpeed: number
  loop: boolean
}

export interface TimelineSettings {
  snapToGrid: boolean
  gridSize: Time
  autoScroll: boolean
  showWaveforms: boolean
  showKeyframes: boolean
  zoom: number
  verticalScroll: number
  horizontalScroll: number
}

export interface TimelineMetadata {
  createdAt: Date
  modifiedAt: Date
  version: string
  author?: string
}

export interface TimelineTrack {
  id: string
  name: string
  type: TrackType
  targetPath?: string
  keyframes: Keyframe[]
  enabled: boolean
  locked: boolean
  muted?: boolean
  solo?: boolean
  color?: string
  height?: number
  properties?: TrackProperties
}

export interface TrackProperties {
  volume?: number
  blendMode: BlendMode
  opacity?: number
  visible?: boolean
}

export enum TrackType {
  Property = 'property',
  Audio = 'audio',
  Video = 'video',
}

export interface TimelineMarker {
  id: string
  time: Time
  name: string
  color?: string
  type?: string
  metadata?: Record<string, any>
}

// Template types
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
  Advertisement = 'advertisement',
  Tutorial = 'tutorial',
  Logo = 'logo',
  Custom = 'custom',
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

// Rendering types
export enum RenderQuality {
  Preview = 'preview',
  Standard = 'standard',
  High = 'high',
  Ultra = 'ultra',
}

export enum ColorSpace {
  sRGB = 'sRGB',
  P3 = 'P3',
  Rec709 = 'Rec.709',
  Rec2020 = 'Rec.2020',
}

export interface RenderOptions {
  quality: RenderQuality
  resolution: Size2D
  frameRate: FrameRate
  colorSpace: ColorSpace
  includeAudio: boolean
  cache: boolean
}

// Plugin types
export interface PluginContext {
  document: any
  viewport: any
  timeline: any
  selection: string[]
  currentTime: Time
}

export enum PluginSourceType {
  URL = 'url',
  File = 'file',
  Code = 'code',
}

// Timeline implementation types
export interface TimelineImpl {
  id: string
  name: string
  duration: Time
  frameRate: FrameRate
  tracks: TimelineTrackImpl[]
  markers: TimelineMarkerImpl[]
  currentTime: Time
  isPlaying: boolean
  playbackSpeed: number
}

export interface TimelineTrackImpl {
  id: string
  name: string
  type: TrackType
  keyframes: KeyframeImpl[]
  enabled: boolean
  locked: boolean
  muted: boolean
  volume?: number
  blendMode?: BlendMode
}

export interface KeyframeImpl {
  id: string
  time: Time
  value: PropertyValue
  interpolation: InterpolationMode
  easing?: BezierCurve
  selected: boolean
}

export interface TimelineMarkerImpl {
  id: string
  time: Time
  name: string
  color: string
  duration?: Time
}

// Rendering implementation types
export interface RendererImpl {
  id: string
  canvas: HTMLCanvasElement
  context: GPUCanvasContext
  device: GPUDevice
  frameBuffer: GPUTexture
  pipelines: Map<string, GPURenderPipeline>
  bindGroups: Map<string, GPUBindGroup>
  buffers: Map<string, GPUBuffer>
}

export interface RenderPipelineImpl {
  id: string
  name: string
  vertexShader: GPUShaderModule
  fragmentShader: GPUShaderModule
  pipeline: GPURenderPipeline
  bindGroupLayout: GPUBindGroupLayout
  vertexBuffers: GPUVertexBufferLayout[]
}

export interface MaterialImpl {
  id: string
  name: string
  shader: string
  uniforms: Map<string, any>
  textures: Map<string, GPUTexture>
  blendMode: BlendMode
  transparent: boolean
}

// Scene graph implementation types
export interface SceneGraphImpl {
  rootNode: string
  nodes: Map<string, SceneNodeImpl>
  selectedNodes: string[]
  visibleNodes: string[]
  lockedNodes: string[]
}

export interface SceneNodeImpl {
  id: string
  name: string
  type: NodeType
  properties: PropertyMap
  transform: Transform
  parent?: string
  children: string[]
  keyframes: Map<string, KeyframeImpl[]>
  constraints: ConstraintImpl[]
  effects: EffectImpl[]
  visible: boolean
  locked: boolean
  selected: boolean
}

export interface ConstraintImpl {
  id: string
  type: string
  targetNodeId: string
  properties: Record<string, any>
  weight: number
  enabled: boolean
}

export interface EffectImpl {
  id: string
  type: EffectType
  enabled: boolean
  properties: EffectParameters
  keyframes: Map<string, KeyframeImpl[]>
}

// Canvas types
export interface CanvasConfig {
  width: number
  height: number
  devicePixelRatio: number
  aspectRatio: number
}

// Evaluation types
export interface EvaluationContext {
  time: Time
  frameRate: FrameRate
  resolution: Size2D
  devicePixelRatio: number
  globalProperties: PropertyMap
}

export interface RenderContext {
  time: Time
  frameRate: FrameRate
  resolution: Size2D
  devicePixelRatio: number
  globalProperties: PropertyMap
  canvas?: CanvasConfig
}

export interface RenderOutput {
  frameBuffer: any // GPUTexture in real implementation
  width: number
  height: number
  format: 'rgba_f32' | 'rgba_u8'
}

// Scene state types
export interface SceneState {
  time: Time
  nodes: Map<string, NodeState>
  globalProperties: PropertyMap
}

export interface NodeState {
  id: string
  name: string
  type: NodeType
  properties: PropertyMap
  transform: Transform
  isVisible: boolean
  isSelected: boolean
}

// Document and scene types
export interface Document {
  id: string
  name: string
  description?: string
  version: string
  createdAt: Date
  modifiedAt: Date
  author: string
  scenes: Scene[]
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
  transform: Transform
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

// Settings and configuration
export interface DocumentSettings {
  frameRate: FrameRate
  resolution: Size2D
  colorSpace: ColorSpace
  backgroundColor: Color
  pixelAspectRatio: number
}

export interface SceneSettings {
  backgroundColor: Color
  enableDepthTest: boolean
  enableLighting: boolean
  motionBlur: boolean
  enableShadows: boolean
}

export interface DocumentMetadata {
  author: string
  createdAt: Date
  modifiedAt: Date
  version: string
  tags: string[]
  description?: string
}

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
  showGrid: boolean
  showRulers: boolean
  snapToGrid: boolean
  snapToGuides: boolean
}

export enum TimeFormat {
  Frames = 'frames',
  Timecode = 'timecode',
  Seconds = 'seconds',
}

export interface PerformanceSettings {
  maxUndoSteps: number
  autoSaveInterval: number
  enableHardwareAcceleration: boolean
  maxTextureSize: number
  enableCaching: boolean
  adaptiveQuality?: boolean
  quality?: 'low' | 'medium' | 'high'
  maxMemoryMB?: number
}

export interface CollaborationSettings {
  enabled: boolean
  autoJoin: boolean
  showPresence: boolean
  enableVoiceChat: boolean
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

// System information
export interface SystemInfo {
  version: string
  platform: string
  architecture: string
  nodeVersion: string
  electronVersion?: string
}

export interface GPUInfo {
  vendor: string
  renderer: string
  version: string
  memory: number
  maxTextureSize: number
}

export interface RenderCapabilities {
  maxSceneComplexity: number
  maxTimelineDuration: Time
  maxTextureSize: number
  maxViewportSize: Size2D
  supportedFormats: string[]
  supportedCodecs: string[]
}

export interface MemoryInfo {
  total: number
  available: number
  used: number
  heapUsed: number
  heapTotal: number
}

export interface PerformanceInfo {
  cpuCores: number
  maxFrameRate: number
  averageFrameTime: number
  memoryUsage: number
}

export interface AnimatorCapabilities {
  maxSceneComplexity: number
  maxTimelineDuration: Time
  maxTextureSize: number
  maxViewportSize: Size2D
  supportedFormats: string[]
  supportedCodecs: string[]
}

// Viewport and rendering
export interface Viewport {
  id: string
  container: HTMLElement
  width: number
  height: number
  devicePixelRatio: number
  camera: CameraState
  settings: ViewportSettings
}

export interface ViewportOptions {
  width: number
  height: number
  devicePixelRatio?: number
  backgroundColor?: Color
  enableGrid?: boolean
  enableRulers?: boolean
}

export interface CameraState {
  position: Point2D
  zoom: number
  rotation: number
  fieldOfView?: number
}

export interface ViewportSettings {
  showGrid: boolean
  showRulers: boolean
  snapToGrid: boolean
  gridSize: number
  backgroundColor: Color
}

// Collaboration types
export interface CollaborationSession {
  id: string
  documentId: string
  hostId: string
  participants: Participant[]
  maxParticipants: number
  status: 'active' | 'paused' | 'ended'
  createdAt: Date
  settings: SessionSettings
}

export interface Participant {
  id: string
  name: string
  role: 'host' | 'editor' | 'viewer'
  color: string
  cursor?: Point2D
  selection?: string[]
  isActive: boolean
  joinedAt: Date
}

export interface SessionSettings {
  allowAnonymous: boolean
  requireApproval: boolean
  enableVoiceChat: boolean
  enableScreenShare: boolean
}

export interface SessionOptions {
  maxParticipants?: number
  allowAnonymous?: boolean
  requireApproval?: boolean
  enableVoiceChat?: boolean
  enableScreenShare?: boolean
}

export interface ParticipantInfo {
  name: string
  role?: 'host' | 'editor' | 'viewer'
  color?: string
}

export interface JoinSessionResult {
  session: CollaborationSession
  participant: Participant
}

export interface Presence {
  cursor?: Point2D
  selection: string[]
  currentTool: string
  isActive: boolean
  lastSeen: Date
}

// Document synchronization
export interface DocumentChange {
  id: string
  type: ChangeType
  path: string
  oldValue?: any
  newValue?: any
  timestamp: Date
  authorId: string
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
  timestamp: Date
}

export enum ResolutionStrategy {
  UseMine = 'use_mine',
  UseTheirs = 'use_theirs',
  Merge = 'merge',
  Manual = 'manual',
}

export enum ConflictResolutionStrategy {
  AutoMerge = 'auto_merge',
  LastWriterWins = 'last_writer_wins',
  Manual = 'manual',
}

export interface DocumentConflict {
  id: string
  path: string
  localValue: any
  remoteValue: any
  baseValue: any
  timestamp: Date
  authorId: string
}

export interface DocumentSnapshot {
  version: number
  timestamp: Date
  data: any
  checksum: string
}

// EvaluationContext is already defined above

export interface RenderOutput {
  frameBuffer: any // GPUTexture in real implementation
  width: number
  height: number
  format: 'rgba_f32' | 'rgba_u8'
}

// Plugin types
export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  source: PluginSource
  manifest: PluginManifest
  enabled: boolean
  installedAt: Date
  metadata?: PluginMetadata
}

// Additional plugin types
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  license?: string
  homepage?: string
  repository?: string
  keywords?: string[]
  engines?: Record<string, string>
}

export interface PluginSource {
  type: PluginSourceType
  url?: string
  file?: string
  code?: string
}

export interface PluginManifest {
  name: string
  version: string
  description: string
  author: string
  main: string
  dependencies: Record<string, string>
  permissions: PluginPermission[]
  contributions: PluginContribution[]
}

export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  license?: string
  homepage?: string
  repository?: string
  keywords?: string[]
  engines?: Record<string, string>
  scripts?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  bundledDependencies?: string[]
  size?: number
  unpackedSize?: number
  integrity?: string
  hasInstallScript?: boolean
  hasShrinkwrap?: boolean
}

export enum CompressionLevel {
  None = 'none',
  Fast = 'fast',
  Balanced = 'balanced',
  Best = 'best',
  Maximum = 'maximum',
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
}

export interface PluginContribution {
  type: ContributionType
  properties: Record<string, any>
}

export enum ContributionType {
  Command = 'command',
  MenuItem = 'menu_item',
  ToolbarItem = 'toolbar_item',
  Panel = 'panel',
  ContextMenu = 'context_menu',
}

export interface PluginEntryPoint {
  name: string
  type: EntryPointType
  handler: string
}

export enum EntryPointType {
  Command = 'command',
  EventHandler = 'event_handler',
  Lifecycle = 'lifecycle',
}

// Sandbox types
export interface SandboxConfig {
  memoryLimit: number
  timeout: number
  allowedModules: string[]
  allowedAPIs: string[]
}

export interface ExecutionResult {
  success: boolean
  data?: any
  error?: ExecutionError
  executionTime: number
}

export interface ExecutionError {
  code: string
  message: string
  stack?: string
}

// Error types - already defined above

// GPU and rendering types
export interface GPUResource {
  id: string
  type: GPUResourceType
  size: number
  usage: number
}

export enum GPUResourceType {
  Texture = 'texture',
  Buffer = 'buffer',
  ShaderModule = 'shader_module',
  Pipeline = 'pipeline',
}

export interface Shader {
  id: string
  name: string
  vertexShader: string
  fragmentShader: string
  uniforms: ShaderUniform[]
  attributes: ShaderAttribute[]
}

export interface ShaderUniform {
  name: string
  type: UniformType
  location: number
}

export enum UniformType {
  Float = 'float',
  Vec2 = 'vec2',
  Vec3 = 'vec3',
  Vec4 = 'vec4',
  Mat2 = 'mat2',
  Mat3 = 'mat3',
  Mat4 = 'mat4',
  Int = 'int',
  Bool = 'bool',
}

export interface ShaderAttribute {
  name: string
  location: number
  format: string
}

export interface Material {
  id: string
  name: string
  shader: Shader
  uniforms: MaterialProperties
  blendMode: BlendMode
  transparent: boolean
}

export interface MaterialProperties {
  [key: string]: number | Point2D | Point3D | Color | boolean
}

// Asset types
export interface Asset {
  id: string
  name: string
  type: AssetType
  path: string
  metadata: AssetMetadata
  thumbnail?: string
}

export enum AssetType {
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Font = 'font',
  Template = 'template',
  Plugin = 'plugin',
}

export interface AssetMetadata {
  width?: number
  height?: number
  duration?: number
  frameRate?: number
  bitRate?: number
  codec?: string
  colorSpace?: ColorSpace
  hasAlpha?: boolean
}

// Collaboration types - already defined above

// Tool Selection Bar types
export enum ToolType {
  Select = 'select',
  Move = 'move',
  Hand = 'hand',
  Scale = 'scale',
  Rotate = 'rotate',
  Pen = 'pen',
  Shape = 'shape',
  Text = 'text',
  Image = 'image',
  Effect = 'effect',
  Mask = 'mask',
  Camera = 'camera',
  Zoom = 'zoom',
}

export interface Tool {
  id: string
  type: ToolType
  name: string
  icon: string
  shortcut?: string
  description: string
  category: ToolCategory
  variants?: ToolVariant[]
  defaultActive?: boolean
}

export interface ToolVariant {
  id: string
  name: string
  icon?: string
  description: string
}

export enum ToolCategory {
  Selection = 'selection',
  Transform = 'transform',
  Drawing = 'drawing',
  Content = 'content',
  Effects = 'effects',
  View = 'view',
}

export interface ToolGroup {
  id: string
  name: string
  tools: Tool[]
  primaryTool?: Tool
  hasDropdown: boolean
}

export interface ToolSelectionState {
  activeToolId: string | null
  previousToolId?: string | null
  dropdownOpen: boolean
  dropdownToolGroup?: string | null
}

// Keyboard shortcut types
export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean // Cmd on Mac, Win on Windows
  description: string
  category: ShortcutCategory
  context?: string // Optional context where shortcut applies
  action?: KeyboardShortcutAction // Optional custom action handler
  id?: string // Unique identifier for the shortcut
  userDefined?: boolean // Whether this shortcut was defined by the user
}

export type KeyboardShortcutAction = (
  event: KeyboardEvent
) => void | Promise<void>

export enum ShortcutCategory {
  General = 'general',
  File = 'file',
  Edit = 'edit',
  View = 'view',
  Scene = 'scene',
  Timeline = 'timeline',
  Properties = 'properties',
  Viewport = 'viewport',
  Tools = 'tools',
  Collaboration = 'collaboration',
  Help = 'help',
}

export interface KeyboardShortcutMap {
  [key: string]: KeyboardShortcut
}

// Default keyboard shortcuts configuration
export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // === GENERAL APPLICATION ===
  {
    key: 'n',
    meta: true,
    description: 'New composition',
    category: ShortcutCategory.File,
  },
  {
    key: 'o',
    meta: true,
    description: 'Open composition',
    category: ShortcutCategory.File,
  },
  {
    key: 's',
    meta: true,
    description: 'Save composition',
    category: ShortcutCategory.File,
  },
  {
    key: 's',
    meta: true,
    shift: true,
    description: 'Save as...',
    category: ShortcutCategory.File,
  },
  {
    key: 'p',
    meta: true,
    description: 'Print/Export',
    category: ShortcutCategory.File,
  },
  {
    key: ',',
    meta: true,
    description: 'Preferences',
    category: ShortcutCategory.General,
  },
  {
    key: 'q',
    meta: true,
    description: 'Quit application',
    category: ShortcutCategory.General,
  },

  // === EDIT OPERATIONS ===
  {
    key: 'z',
    meta: true,
    description: 'Undo',
    category: ShortcutCategory.Edit,
  },
  {
    key: 'z',
    meta: true,
    shift: true,
    description: 'Redo',
    category: ShortcutCategory.Edit,
  },
  {
    key: 'x',
    meta: true,
    description: 'Cut',
    category: ShortcutCategory.Edit,
  },
  {
    key: 'c',
    meta: true,
    description: 'Copy',
    category: ShortcutCategory.Edit,
  },
  {
    key: 'v',
    meta: true,
    description: 'Paste',
    category: ShortcutCategory.Edit,
  },
  {
    key: 'd',
    meta: true,
    description: 'Duplicate',
    category: ShortcutCategory.Edit,
  },
  {
    key: 'a',
    meta: true,
    description: 'Select all',
    category: ShortcutCategory.Edit,
  },
  {
    key: 'a',
    meta: true,
    shift: true,
    description: 'Deselect all',
    category: ShortcutCategory.Edit,
  },
  {
    key: 'Delete',
    description: 'Delete selected items',
    category: ShortcutCategory.Edit,
  },
  {
    key: 'Backspace',
    description: 'Delete selected items',
    category: ShortcutCategory.Edit,
  },

  // === VIEW MANAGEMENT ===
  {
    key: '1',
    meta: true,
    description: 'View mode: Design',
    category: ShortcutCategory.View,
  },
  {
    key: '2',
    meta: true,
    description: 'View mode: Animation',
    category: ShortcutCategory.View,
  },
  {
    key: '3',
    meta: true,
    description: 'View mode: Developer',
    category: ShortcutCategory.View,
  },
  {
    key: '`',
    description: 'Toggle fullscreen',
    category: ShortcutCategory.View,
  },
  {
    key: 'Tab',
    description: 'Toggle panels visibility',
    category: ShortcutCategory.View,
  },

  // === SCENE MANAGEMENT ===
  {
    key: 'g',
    meta: true,
    shift: true,
    description: 'Group selected layers',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'g',
    meta: true,
    shift: true,
    ctrl: true,
    description: 'Ungroup selected groups',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'r',
    description: 'Create rectangle shape',
    category: ShortcutCategory.Scene,
    context: 'viewport',
  },
  {
    key: 'e',
    description: 'Create ellipse shape',
    category: ShortcutCategory.Scene,
    context: 'viewport',
  },
  {
    key: 't',
    description: 'Create text layer',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'm',
    description: 'Import media file',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'f',
    description: 'Create adjustment layer',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'y',
    description: 'Create null object',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'u',
    description: 'Reveal all modified properties',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'uu',
    description: 'Reveal all properties',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'l',
    description: 'Lock selected layers',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'l',
    shift: true,
    description: 'Unlock all layers',
    category: ShortcutCategory.Scene,
  },
  {
    key: 's',
    description: 'Solo selected layers',
    category: ShortcutCategory.Scene,
  },
  {
    key: 's',
    shift: true,
    alt: true,
    description: 'Un-solo all layers',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'e',
    shift: true,
    description: 'Show/hide selected layers',
    category: ShortcutCategory.Scene,
  },
  {
    key: '[',
    description: 'Send layer backward',
    category: ShortcutCategory.Scene,
  },
  {
    key: ']',
    description: 'Bring layer forward',
    category: ShortcutCategory.Scene,
  },
  {
    key: '[',
    meta: true,
    description: 'Send layer to back',
    category: ShortcutCategory.Scene,
  },
  {
    key: ']',
    meta: true,
    description: 'Bring layer to front',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'p',
    description: 'Set position keyframe',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'a',
    description: 'Set anchor point keyframe',
    category: ShortcutCategory.Scene,
  },
  {
    key: 'r',
    shift: true,
    description: 'Set rotation keyframe',
    category: ShortcutCategory.Scene,
  },
  {
    key: 's',
    shift: true,
    description: 'Set scale keyframe',
    category: ShortcutCategory.Scene,
  },
  {
    key: 't',
    shift: true,
    description: 'Set opacity keyframe',
    category: ShortcutCategory.Scene,
  },

  // === TIMELINE NAVIGATION ===
  {
    key: ' ',
    description: 'Play/Pause timeline',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'k',
    description: 'Stop playback',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'j',
    description: 'Play backward',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'l',
    shift: true,
    description: 'Play forward',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'i',
    description: 'Set work area start',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'o',
    shift: true,
    description: 'Set work area end',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'Home',
    description: 'Go to start of timeline',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'End',
    description: 'Go to end of timeline',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'ArrowLeft',
    description: 'Previous frame',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'ArrowRight',
    description: 'Next frame',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'ArrowLeft',
    shift: true,
    description: 'Previous keyframe',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'ArrowRight',
    shift: true,
    description: 'Next keyframe',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'ArrowUp',
    description: 'Select previous layer',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'ArrowDown',
    description: 'Select next layer',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'PageUp',
    description: 'Move 10 frames forward',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'PageDown',
    description: 'Move 10 frames backward',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'n',
    description: 'New keyframe at current time',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'Delete',
    shift: true,
    description: 'Delete keyframe at current time',
    category: ShortcutCategory.Timeline,
  },
  {
    key: 'b',
    description: 'Set composition work area to selected layers',
    category: ShortcutCategory.Timeline,
  },

  // === PROPERTY EDITING ===
  {
    key: 'Enter',
    description: 'Edit selected property value',
    category: ShortcutCategory.Properties,
  },
  {
    key: 'Escape',
    description: 'Cancel property editing',
    category: ShortcutCategory.Properties,
  },
  {
    key: 'Tab',
    description: 'Next property field',
    category: ShortcutCategory.Properties,
  },
  {
    key: 'Tab',
    shift: true,
    description: 'Previous property field',
    category: ShortcutCategory.Properties,
  },
  {
    key: 'ArrowUp',
    shift: true,
    description: 'Increase property value by 10',
    category: ShortcutCategory.Properties,
  },
  {
    key: 'ArrowDown',
    shift: true,
    description: 'Decrease property value by 10',
    category: ShortcutCategory.Properties,
  },
  {
    key: 'ArrowUp',
    description: 'Increase property value by 1',
    category: ShortcutCategory.Properties,
  },
  {
    key: 'ArrowDown',
    description: 'Decrease property value by 1',
    category: ShortcutCategory.Properties,
  },

  // === VIEWPORT CONTROLS ===
  {
    key: '=',
    meta: true,
    description: 'Zoom in',
    category: ShortcutCategory.Viewport,
  },
  {
    key: '-',
    meta: true,
    description: 'Zoom out',
    category: ShortcutCategory.Viewport,
  },
  {
    key: '0',
    meta: true,
    description: 'Zoom to fit',
    category: ShortcutCategory.Viewport,
  },
  {
    key: '1',
    meta: true,
    shift: true,
    description: 'Zoom to 100%',
    category: ShortcutCategory.Viewport,
  },
  {
    key: '2',
    meta: true,
    shift: true,
    description: 'Zoom to 200%',
    category: ShortcutCategory.Viewport,
  },
  {
    key: '5',
    meta: true,
    shift: true,
    description: 'Zoom to 50%',
    category: ShortcutCategory.Viewport,
  },
  {
    key: 'h',
    description: 'Pan tool',
    category: ShortcutCategory.Viewport,
  },
  {
    key: 'z',
    description: 'Zoom tool',
    category: ShortcutCategory.Viewport,
  },
  {
    key: 'v',
    description: 'Selection tool',
    category: ShortcutCategory.Tools,
  },
  {
    key: 'g',
    description: 'Hand tool (pan)',
    category: ShortcutCategory.Viewport,
  },
  {
    key: 'r',
    shift: true,
    description: 'Rotate tool',
    category: ShortcutCategory.Tools,
  },
  {
    key: 'w',
    description: 'Pen tool',
    category: ShortcutCategory.Tools,
  },
  {
    key: 'c',
    shift: true,
    description: 'Type tool',
    category: ShortcutCategory.Tools,
  },
  {
    key: 'x',
    description: 'Toggle grid visibility',
    category: ShortcutCategory.Viewport,
  },
  {
    key: ';',
    description: 'Toggle rulers',
    category: ShortcutCategory.Viewport,
  },
  {
    key: "'",
    description: 'Toggle guides',
    category: ShortcutCategory.Viewport,
  },
  {
    key: '.',
    description: 'Toggle safe zones',
    category: ShortcutCategory.Viewport,
  },

  // === COLLABORATION ===
  {
    key: 'c',
    meta: true,
    shift: true,
    description: 'Start collaboration session',
    category: ShortcutCategory.Collaboration,
  },
  {
    key: 'j',
    meta: true,
    description: 'Join collaboration session',
    category: ShortcutCategory.Collaboration,
  },
  {
    key: 'l',
    meta: true,
    shift: true,
    description: 'Leave collaboration session',
    category: ShortcutCategory.Collaboration,
  },
  {
    key: '/',
    meta: true,
    description: 'Toggle voice chat',
    category: ShortcutCategory.Collaboration,
  },
  {
    key: 'Enter',
    meta: true,
    description: 'Send message in chat',
    category: ShortcutCategory.Collaboration,
    context: 'chat',
  },
  {
    key: 'Escape',
    description: 'Close chat',
    category: ShortcutCategory.Collaboration,
    context: 'chat',
  },

  // === HELP ===
  {
    key: 'F1',
    description: 'Open help documentation',
    category: ShortcutCategory.Help,
  },
  {
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts',
    category: ShortcutCategory.Help,
  },
  {
    key: 'F12',
    description: 'Toggle developer tools',
    category: ShortcutCategory.Help,
  },
]

// Effects system types
export * from './effects'

// Re-export commonly used effect types

export type {
  EffectParameters,
  BaseEffectParameters,
  GaussianBlurParameters,
  LevelsParameters,
  HueSaturationParameters,
  PerformanceSettings as EffectPerformanceSettings,
} from './effects'

// Collaboration types
export interface CollaborationSession {
  id: string
  documentId: string
  hostId: string
  participants: Participant[]
  maxParticipants: number
  status: 'active' | 'paused' | 'ended'
  createdAt: Date
  settings: SessionSettings
}

export interface ParticipantInfo {
  name: string
  role?: 'host' | 'editor' | 'viewer'
  color?: string
}

export interface JoinSessionResult {
  session: CollaborationSession
  participant: Participant
}

export interface Presence {
  cursor?: { x: number; y: number }
  selection: string[]
  currentTool: string
  isActive: boolean
  lastSeen: Date
}

export interface DocumentChange {
  id: string
  type: ChangeType
  path: string
  oldValue?: any
  newValue?: any
  timestamp: Date
  authorId: string
}

export interface DocumentSnapshot {
  version: number
  timestamp: Date
  data: any
  checksum: string
}

export interface DocumentConflict {
  id: string
  path: string
  localValue: any
  remoteValue: any
  baseValue: any
  timestamp: Date
  authorId: string
}

export interface ConflictResolution {
  conflictId: string
  strategy: ResolutionStrategy
  value?: any
  timestamp: Date
}

export interface Comment {
  id: string
  authorId: string
  content: string
  timestamp: Date
  resolved?: boolean
  position?: { x: number; y: number }
}

export interface CommentFilters {
  authorId?: string
  resolved?: boolean
  dateRange?: { start: Date; end: Date }
}

export interface ActivityItem {
  id: string
  type: 'comment' | 'change' | 'presence' | 'system'
  timestamp: Date
  userId: string
  description: string
  data?: any
}

export interface HistoryOptions {
  startDate?: Date
  endDate?: Date
  userId?: string
  limit?: number
}

export interface DocumentHistory {
  documentId: string
  changes: DocumentChange[]
  snapshots: DocumentSnapshot[]
  conflicts: DocumentConflict[]
}

export interface SessionEvent {
  type:
    | 'participant_joined'
    | 'participant_left'
    | 'permissions_changed'
    | 'settings_changed'
  timestamp: Date
  data: any
}

export interface PresenceChange {
  userId: string
  presence: Presence
  timestamp: Date
}

export interface CommentChange {
  type: 'added' | 'updated' | 'deleted' | 'resolved'
  comment: Comment
  timestamp: Date
}

export interface SessionPermissions {
  allowAnonymous: boolean
  requireApproval: boolean
  enableVoiceChat: boolean
  enableScreenShare: boolean
}

export interface ActivityFeedOptions {
  limit?: number
  offset?: number
  types?: string[]
}

// Rendering types
export interface RenderOutput {
  frameBuffer: any
  width: number
  height: number
  format: 'rgba_f32' | 'rgba_u8'
}

export interface Viewport {
  id: string
  container: HTMLElement
  width: number
  height: number
  devicePixelRatio: number
  camera: CameraState
  settings: ViewportSettings
}

export interface ViewportOptions {
  width: number
  height: number
  devicePixelRatio?: number
  backgroundColor?: Color
  enableGrid?: boolean
  enableRulers?: boolean
}

export interface PlaybackOptions {
  startTime?: number
  endTime?: number
  loop?: boolean
  speed?: number
}

export interface UnsubscribeFn {
  (): void
}

// Plugin types
export interface PluginAPI {
  installPlugin(pluginId: string, source: any): Promise<any>
  uninstallPlugin(pluginId: string): Promise<void>
  enablePlugin(pluginId: string): Promise<void>
  disablePlugin(pluginId: string): Promise<void>
  listPlugins(): Promise<any[]>
  getPlugin(pluginId: string): Promise<any>
  searchPlugins(query: string): Promise<any[]>
  executePlugin(pluginId: string, context: any): Promise<any>
  subscribeToPluginEvents(
    pluginId: string,
    callback: (event: any) => void
  ): Promise<UnsubscribeFn>
}

// Rendering types
export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

// Validation types
export interface ValidationError {
  code: string
  message: string
  property?: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  code: string
  message: string
  suggestion?: string
}

// Error types
export interface AnimatorError {
  code: string
  message: string
  details?: Record<string, unknown>
  stack?: string
}

// Effects types are already exported above

// Utility types
export type Result<T, E = AnimatorError> =
  | { success: true; data: T }
  | { success: false; error: E }

export type Optional<T> = T | undefined
export type Nullable<T> = T | null
