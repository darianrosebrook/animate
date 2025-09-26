import { describe, it, expect } from 'vitest'
import {
  Time,
  Point2D,
  Color,
  SceneNode,
  NodeType,
  InterpolationMode,
  Keyframe,
  BezierCurve,
  PropertyMap,
  Timeline,
  TimelineTrack,
  TrackType,
  RenderContext,
  RenderOutput,
  AnimatorError,
  Result,
  Optional,
  Nullable,
} from './index'

describe('Core Types', () => {
  it('should define Time as number', () => {
    const time: Time = 1.5
    expect(typeof time).toBe('number')
    expect(time).toBe(1.5)
  })

  it('should define Point2D correctly', () => {
    const point: Point2D = { x: 10, y: 20 }
    expect(point.x).toBe(10)
    expect(point.y).toBe(20)
  })

  it('should define Color with optional alpha', () => {
    const color: Color = { r: 255, g: 0, b: 0, a: 0.5 }
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(0.5)

    const colorWithoutAlpha: Color = { r: 0, g: 255, b: 0 }
    expect(colorWithoutAlpha.a).toBeUndefined()
  })
})

describe('Animation Types', () => {
  it('should define Keyframe correctly', () => {
    const keyframe: Keyframe = {
      time: 1.0,
      value: 100,
      interpolation: InterpolationMode.Linear,
    }
    expect(keyframe.time).toBe(1.0)
    expect(keyframe.value).toBe(100)
    expect(keyframe.interpolation).toBe(InterpolationMode.Linear)
  })

  it('should define BezierCurve correctly', () => {
    const curve: BezierCurve = {
      p1x: 0.2,
      p1y: 0.0,
      p2x: 0.8,
      p2y: 1.0,
    }
    expect(curve.p1x).toBe(0.2)
    expect(curve.p1y).toBe(0.0)
    expect(curve.p2x).toBe(0.8)
    expect(curve.p2y).toBe(1.0)
  })

  it('should define InterpolationMode enum', () => {
    expect(InterpolationMode.Linear).toBe('linear')
    expect(InterpolationMode.Bezier).toBe('bezier')
    expect(InterpolationMode.Stepped).toBe('stepped')
    expect(InterpolationMode.Smooth).toBe('smooth')
  })
})

describe('Scene Graph Types', () => {
  it('should define SceneNode correctly', () => {
    const node: SceneNode = {
      id: 'node-1',
      name: 'Test Node',
      type: NodeType.Transform,
      properties: {},
      children: [],
    }
    expect(node.id).toBe('node-1')
    expect(node.name).toBe('Test Node')
    expect(node.type).toBe(NodeType.Transform)
    expect(node.children).toEqual([])
  })

  it('should define NodeType enum', () => {
    expect(NodeType.Transform).toBe('transform')
    expect(NodeType.Shape).toBe('shape')
    expect(NodeType.Text).toBe('text')
    expect(NodeType.Media).toBe('media')
    expect(NodeType.Effect).toBe('effect')
    expect(NodeType.Group).toBe('group')
    expect(NodeType.Camera).toBe('camera')
  })

  it('should define PropertyMap and PropertyValue types', () => {
    const properties: PropertyMap = {
      opacity: 0.5,
      position: { x: 10, y: 20 },
      color: { r: 255, g: 0, b: 0 },
    }

    expect(properties.opacity).toBe(0.5)
    expect((properties.position as Point2D).x).toBe(10)
    expect((properties.color as Color).r).toBe(255)
  })
})

describe('Timeline Types', () => {
  it('should define Timeline correctly', () => {
    const timeline: Timeline = {
      duration: 10.0,
      frameRate: 30,
      tracks: [],
      markers: [],
    }
    expect(timeline.duration).toBe(10.0)
    expect(timeline.frameRate).toBe(30)
  })

  it('should define TimelineTrack correctly', () => {
    const track: TimelineTrack = {
      id: 'track-1',
      name: 'Opacity',
      type: TrackType.Property,
      keyframes: [],
      enabled: true,
      locked: false,
    }
    expect(track.id).toBe('track-1')
    expect(track.type).toBe(TrackType.Property)
    expect(track.enabled).toBe(true)
  })

  it('should define TrackType enum', () => {
    expect(TrackType.Property).toBe('property')
    expect(TrackType.Audio).toBe('audio')
    expect(TrackType.Video).toBe('video')
  })
})

describe('Rendering Types', () => {
  it('should define RenderContext correctly', () => {
    const context: RenderContext = {
      time: 1.0,
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
      devicePixelRatio: 1.0,
      globalProperties: {},
    }
    expect(context.time).toBe(1.0)
    expect(context.frameRate).toBe(30)
    expect(context.resolution.width).toBe(1920)
  })

  it('should define RenderOutput correctly', () => {
    const output: RenderOutput = {
      frameBuffer: new ArrayBuffer(100),
      width: 1920,
      height: 1080,
      format: 'rgba_f32',
    }
    expect(output.width).toBe(1920)
    expect(output.format).toBe('rgba_f32')
  })
})

describe('Error Handling Types', () => {
  it('should define AnimatorError correctly', () => {
    const error: AnimatorError = {
      code: 'INVALID_NODE',
      message: 'Node not found',
      details: { nodeId: 'invalid' },
    }
    expect(error.code).toBe('INVALID_NODE')
    expect(error.message).toBe('Node not found')
    expect(error.details?.nodeId).toBe('invalid')
  })

  it('should define Result type correctly', () => {
    const success: Result<string> = { success: true, data: 'hello' }
    const failure: Result<string> = {
      success: false,
      error: { code: 'ERROR', message: 'Something failed' },
    }

    expect(success.success).toBe(true)
    expect(success.data).toBe('hello')
    expect(failure.success).toBe(false)
    expect(failure.error.code).toBe('ERROR')
  })
})

describe('Utility Types', () => {
  it('should define Optional and Nullable types', () => {
    const optional: Optional<string> = 'hello'
    const nullable: Nullable<string> = null
    const undefinedOptional: Optional<string> = undefined

    expect(optional).toBe('hello')
    expect(nullable).toBe(null)
    expect(undefinedOptional).toBeUndefined()
  })
})
