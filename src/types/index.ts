/**
 * @fileoverview Core type definitions for the Animator motion graphics platform
 * @author @darianrosebrook
 */

// Core time and coordinate types
export type Time = number
export type FrameRate = number
export type Point2D = { x: number; y: number }
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
  duration: Time
  frameRate: FrameRate
  tracks: TimelineTrack[]
  markers: TimelineMarker[]
}

export interface TimelineTrack {
  id: string
  name: string
  type: TrackType
  keyframes: Keyframe[]
  enabled: boolean
  locked: boolean
  muted?: boolean
}

export enum TrackType {
  Property = 'property',
  Audio = 'audio',
  Video = 'video',
}

export interface TimelineMarker {
  time: Time
  name: string
  color?: string
}

// Rendering types
export interface RenderContext {
  time: Time
  frameRate: FrameRate
  resolution: Size2D
  devicePixelRatio: number
  globalProperties: PropertyMap
}

export interface EvaluationContext {
  time: Time
  frameRate: FrameRate
  resolution: Size2D
  devicePixelRatio: number
  globalProperties: PropertyMap
}

export interface RenderOutput {
  frameBuffer: GPUTexture
  width: number
  height: number
  format: 'rgba_f32' | 'rgba_u8'
}

// Error types
export interface AnimatorError {
  code: string
  message: string
  details?: any
  stack?: string
}

// Collaboration types
export interface CollaborationSession {
  id: string
  participants: Participant[]
  document: string
  permissions: Permission[]
}

export interface Participant {
  id: string
  name: string
  cursor?: Point2D
  selection?: string[]
  color: string
}

export interface Permission {
  userId: string
  resource: string
  actions: string[]
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

// Utility types
export type Result<T, E = AnimatorError> =
  | { success: true; data: T }
  | { success: false; error: E; data?: never }

export type Optional<T> = T | undefined
export type Nullable<T> = T | null
