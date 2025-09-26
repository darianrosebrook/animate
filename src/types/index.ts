/**
 * @fileoverview Core type definitions for the Animator motion graphics platform
 * @author @darianrosebrook
 */

// Core time and coordinate types
export type Time = number;
export type FrameRate = number;
export type Point2D = { x: number; y: number };
export type Point3D = { x: number; y: number; z: number };
export type Size2D = { width: number; height: number };
export type Color = { r: number; g: number; b: number; a?: number };

// Animation and keyframe types
export interface Keyframe {
  time: Time;
  value: any;
  interpolation: InterpolationMode;
  easing?: BezierCurve;
}

export enum InterpolationMode {
  Linear = 'linear',
  Bezier = 'bezier',
  Stepped = 'stepped',
  Smooth = 'smooth'
}

export interface BezierCurve {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
}

// Scene graph node types
export interface SceneNode {
  id: string;
  name: string;
  type: NodeType;
  properties: PropertyMap;
  children: SceneNode[];
  parent?: SceneNode;
}

export enum NodeType {
  Transform = 'transform',
  Shape = 'shape',
  Text = 'text',
  Media = 'media',
  Effect = 'effect',
  Group = 'group',
  Camera = 'camera'
}

export interface PropertyMap {
  [key: string]: PropertyValue;
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
  | any[];

// Animation curve types
export interface AnimationCurve {
  keyframes: Keyframe[];
  interpolation: InterpolationMode;
}

// Transform types
export interface Transform {
  position: Point3D;
  rotation: Point3D;
  scale: Point3D;
  anchorPoint: Point2D;
  opacity: number;
}

// Timeline types
export interface Timeline {
  duration: Time;
  frameRate: FrameRate;
  tracks: TimelineTrack[];
  markers: TimelineMarker[];
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  keyframes: Keyframe[];
  enabled: boolean;
  locked: boolean;
  muted?: boolean;
}

export enum TrackType {
  Property = 'property',
  Audio = 'audio',
  Video = 'video'
}

export interface TimelineMarker {
  time: Time;
  name: string;
  color?: string;
}

// Rendering types
export interface RenderContext {
  time: Time;
  frameRate: FrameRate;
  resolution: Size2D;
  devicePixelRatio: number;
  globalProperties: PropertyMap;
}

export interface RenderOutput {
  frameBuffer: ArrayBuffer;
  width: number;
  height: number;
  format: 'rgba_f32' | 'rgba_u8';
}

// Error types
export interface AnimatorError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// Collaboration types
export interface CollaborationSession {
  id: string;
  participants: Participant[];
  document: string;
  permissions: Permission[];
}

export interface Participant {
  id: string;
  name: string;
  cursor?: Point2D;
  selection?: string[];
  color: string;
}

export interface Permission {
  userId: string;
  resource: string;
  actions: string[];
}

// Utility types
export type Result<T, E = AnimatorError> =
  | { success: true; data: T }
  | { success: false; error: E };

export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;
