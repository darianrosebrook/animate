/**
 * @fileoverview Comprehensive tests for Timeline System
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Timeline } from '../src/timeline/timeline'
import { TimelineController } from '../src/timeline/timeline-controller'
import { TimelineHistory } from '../src/timeline/timeline-history'
import { AnimationCurve } from '../src/timeline/curve-evaluator'
import {
  TimelineTrack,
  Keyframe,
  TrackType,
  InterpolationMode,
  PlaybackState,
} from '../src/timeline/timeline-types'

describe('Timeline System - Comprehensive Tests', () => {
  let timeline: Timeline
  let controller: TimelineController
  let history: TimelineHistory

  beforeEach(() => {
    timeline = new Timeline('test-timeline', 'Test Timeline', 10.0, 30.0)
    history = new TimelineHistory()
    controller = new TimelineController(timeline, history)
  })

  afterEach(() => {
    controller.destroy()
  })

  describe('Timeline Core Functionality', () => {
    it('should initialize with correct default values', () => {
      expect(timeline.id).toBe('test-timeline')
      expect(timeline.name).toBe('Test Timeline')
      expect(timeline.duration).toBe(10.0)
      expect(timeline.frameRate).toBe(30.0)
      expect(timeline.currentTime).toBe(0)
      expect(timeline.playbackState).toBe(PlaybackState.Stopped)
      expect(timeline.tracks).toHaveLength(0)
      expect(timeline.markers).toHaveLength(0)
    })

    it('should add and remove tracks correctly', () => {
      const trackData: Omit<TimelineTrack, 'id'> = {
        name: 'Position Track',
        type: TrackType.Property,
        targetNodeId: 'node1',
        propertyPath: 'position.x',
        enabled: true,
        locked: false,
      }

      const result = timeline.addTrack(trackData)
      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Position Track')
      expect(result.data?.type).toBe(TrackType.Property)
      expect(timeline.tracks).toHaveLength(1)

      const removeResult = timeline.removeTrack(result.data!.id)
      expect(removeResult.success).toBe(true)
      expect(timeline.tracks).toHaveLength(0)
    })

    it('should add keyframes to tracks', () => {
      const trackResult = timeline.addTrack({
        name: 'Test Track',
        type: TrackType.Property,
      })
      expect(trackResult.success).toBe(true)
      const trackId = trackResult.data!.id

      const keyframeResult = timeline.addKeyframe(trackId, {
        time: 1.0,
        value: 100,
        interpolation: InterpolationMode.Linear,
      })
      expect(keyframeResult.success).toBe(true)
      expect(keyframeResult.data?.time).toBe(1.0)
      expect(keyframeResult.data?.value).toBe(100)

      const track = timeline.getTrackById(trackId)
      expect(track?.keyframes).toHaveLength(1)
    })

    it('should evaluate timeline values correctly', () => {
      const trackResult = timeline.addTrack({
        name: 'Position Track',
        type: TrackType.Property,
        targetNodeId: 'node1',
        propertyPath: 'position.x',
      })
      expect(trackResult.success).toBe(true)
      const trackId = trackResult.data!.id

      // Add keyframes
      timeline.addKeyframe(trackId, {
        time: 0,
        value: 0,
        interpolation: InterpolationMode.Linear,
      })
      timeline.addKeyframe(trackId, {
        time: 2,
        value: 200,
        interpolation: InterpolationMode.Linear,
      })

      // Test evaluation at different times
      const eval0 = timeline.evaluate(0)
      expect(eval0.success).toBe(true)
      expect(eval0.data?.get('node1.position.x')).toBe(0)

      const eval1 = timeline.evaluate(1)
      expect(eval1.success).toBe(true)
      expect(eval1.data?.get('node1.position.x')).toBe(100) // Midway interpolation

      const eval2 = timeline.evaluate(2)
      expect(eval2.success).toBe(true)
      expect(eval2.data?.get('node1.position.x')).toBe(200)
    })

    it('should handle playback state changes', () => {
      expect(timeline.playbackState).toBe(PlaybackState.Stopped)

      const result = timeline.setPlaybackState(PlaybackState.Playing)
      expect(result.success).toBe(true)
      expect(timeline.playbackState).toBe(PlaybackState.Playing)

      const pauseResult = timeline.setPlaybackState(PlaybackState.Paused)
      expect(pauseResult.success).toBe(true)
      expect(timeline.playbackState).toBe(PlaybackState.Paused)
    })

    it('should clamp current time to valid range', () => {
      const result1 = timeline.setCurrentTime(-1.0)
      expect(result1.success).toBe(true)
      expect(timeline.currentTime).toBe(0)

      const result2 = timeline.setCurrentTime(15.0)
      expect(result2.success).toBe(true)
      expect(timeline.currentTime).toBe(10.0)
    })

    it('should handle markers correctly', () => {
      const markerResult = timeline.addMarker({
        time: 2.0,
        name: 'Important Frame',
        color: '#ff0000',
      })
      expect(markerResult.success).toBe(true)
      expect(timeline.markers).toHaveLength(1)

      const removeResult = timeline.removeMarker(markerResult.data!.id)
      expect(removeResult.success).toBe(true)
      expect(timeline.markers).toHaveLength(0)
    })
  })

  describe('Timeline Controller', () => {
    it('should control playback correctly', () => {
      expect(timeline.playbackState).toBe(PlaybackState.Stopped)

      const playResult = controller.play()
      expect(playResult.success).toBe(true)
      expect(timeline.playbackState).toBe(PlaybackState.Playing)

      const pauseResult = controller.pause()
      expect(pauseResult.success).toBe(true)
      expect(timeline.playbackState).toBe(PlaybackState.Paused)

      const stopResult = controller.stop()
      expect(stopResult.success).toBe(true)
      expect(timeline.playbackState).toBe(PlaybackState.Stopped)
      expect(timeline.currentTime).toBe(0)
    })

    it('should handle seeking correctly', () => {
      const seekResult = controller.seek(5.0)
      expect(seekResult.success).toBe(true)
      expect(timeline.currentTime).toBe(5.0)

      // Seeking during playback should stop playback
      controller.play()
      expect(timeline.playbackState).toBe(PlaybackState.Playing)

      const seekDuringPlayResult = controller.seek(7.0)
      expect(seekDuringPlayResult.success).toBe(true)
      expect(timeline.currentTime).toBe(7.0)
      expect(timeline.playbackState).toBe(PlaybackState.Stopped)
    })

    it('should handle selection operations', () => {
      const trackResult = timeline.addTrack({
        name: 'Test Track',
        type: TrackType.Property,
      })
      expect(trackResult.success).toBe(true)
      const trackId = trackResult.data!.id

      const keyframeResult = timeline.addKeyframe(trackId, {
        time: 1.0,
        value: 100,
        interpolation: InterpolationMode.Linear,
      })
      expect(keyframeResult.success).toBe(true)
      const keyframeId = keyframeResult.data!.id

      const selectTrackResult = controller.selectTracks([trackId])
      expect(selectTrackResult.success).toBe(true)
      expect(timeline.selection.tracks).toContain(trackId)

      const selectKeyframeResult = controller.selectKeyframes([keyframeId])
      expect(selectKeyframeResult.success).toBe(true)
      expect(timeline.selection.keyframes).toContain(keyframeId)

      const clearResult = controller.clearSelection()
      expect(clearResult.success).toBe(true)
      expect(timeline.selection.tracks).toHaveLength(0)
      expect(timeline.selection.keyframes).toHaveLength(0)
    })

    it('should move selected keyframes', () => {
      const trackResult = timeline.addTrack({
        name: 'Test Track',
        type: TrackType.Property,
      })
      expect(trackResult.success).toBe(true)
      const trackId = trackResult.data!.id

      const keyframeResult = timeline.addKeyframe(trackId, {
        time: 1.0,
        value: 100,
        interpolation: InterpolationMode.Linear,
      })
      expect(keyframeResult.success).toBe(true)
      const keyframeId = keyframeResult.data!.id

      controller.selectKeyframes([keyframeId])
      const moveResult = controller.moveSelectedKeyframes(0.5)
      expect(moveResult.success).toBe(true)

      const track = timeline.getTrackById(trackId)
      const movedKeyframe = track?.keyframes.find((k) => k.id === keyframeId)
      expect(movedKeyframe?.time).toBe(1.5)
    })

    it('should delete selected keyframes', () => {
      const trackResult = timeline.addTrack({
        name: 'Test Track',
        type: TrackType.Property,
      })
      expect(trackResult.success).toBe(true)
      const trackId = trackResult.data!.id

      const keyframeResult = timeline.addKeyframe(trackId, {
        time: 1.0,
        value: 100,
        interpolation: InterpolationMode.Linear,
      })
      expect(keyframeResult.success).toBe(true)
      const keyframeId = keyframeResult.data!.id

      controller.selectKeyframes([keyframeId])
      const deleteResult = controller.deleteSelectedKeyframes()
      expect(deleteResult.success).toBe(true)

      const track = timeline.getTrackById(trackId)
      expect(track?.keyframes).toHaveLength(0)
      expect(timeline.selection.keyframes).toHaveLength(0)
    })
  })

  describe('Animation Curves', () => {
    it('should evaluate linear interpolation correctly', () => {
      const keyframes: Keyframe[] = [
        { id: '1', time: 0, value: 0, interpolation: InterpolationMode.Linear },
        {
          id: '2',
          time: 2,
          value: 100,
          interpolation: InterpolationMode.Linear,
        },
      ]

      const curve = new AnimationCurve(keyframes)

      expect(curve.evaluate(0)).toBe(0)
      expect(curve.evaluate(1)).toBe(50)
      expect(curve.evaluate(2)).toBe(100)
    })

    it('should handle stepped interpolation', () => {
      const keyframes: Keyframe[] = [
        {
          id: '1',
          time: 0,
          value: 0,
          interpolation: InterpolationMode.Stepped,
        },
        {
          id: '2',
          time: 2,
          value: 100,
          interpolation: InterpolationMode.Stepped,
        },
      ]

      const curve = new AnimationCurve(keyframes)

      expect(curve.evaluate(0)).toBe(0)
      expect(curve.evaluate(0.5)).toBe(0) // Should stay at first value
      expect(curve.evaluate(1.5)).toBe(0) // Should stay at first value
      expect(curve.evaluate(2)).toBe(100)
    })

    it('should handle smooth interpolation', () => {
      const keyframes: Keyframe[] = [
        { id: '1', time: 0, value: 0, interpolation: InterpolationMode.Smooth },
        {
          id: '2',
          time: 2,
          value: 100,
          interpolation: InterpolationMode.Smooth,
        },
      ]

      const curve = new AnimationCurve(keyframes)

      expect(curve.evaluate(0)).toBe(0)
      expect(curve.evaluate(1)).toBeCloseTo(50, 1) // Smooth curve
      expect(curve.evaluate(2)).toBe(100)
    })

    it('should handle object value interpolation', () => {
      const keyframes: Keyframe[] = [
        {
          id: '1',
          time: 0,
          value: { x: 0, y: 0 },
          interpolation: InterpolationMode.Linear,
        },
        {
          id: '2',
          time: 2,
          value: { x: 100, y: 50 },
          interpolation: InterpolationMode.Linear,
        },
      ]

      const curve = new AnimationCurve(keyframes)

      const result = curve.evaluate(1)
      expect(result.x).toBe(50)
      expect(result.y).toBe(25)
    })

    it('should handle color interpolation', () => {
      const keyframes: Keyframe[] = [
        {
          id: '1',
          time: 0,
          value: { r: 255, g: 0, b: 0, a: 1 },
          interpolation: InterpolationMode.Linear,
        },
        {
          id: '2',
          time: 2,
          value: { r: 0, g: 255, b: 0, a: 0.5 },
          interpolation: InterpolationMode.Linear,
        },
      ]

      const curve = new AnimationCurve(keyframes)

      const result = curve.evaluate(1)
      expect(result.r).toBe(127.5)
      expect(result.g).toBe(127.5)
      expect(result.b).toBe(0)
      expect(result.a).toBe(0.75)
    })
  })

  describe('Timeline History', () => {
    it('should track history for undo/redo', () => {
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(false)

      // Make a change
      const trackResult = timeline.addTrack({
        name: 'Test Track',
        type: TrackType.Property,
      })
      expect(trackResult.success).toBe(true)

      history.pushState(timeline.clone())

      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(false)

      // Make another change
      const keyframeResult = timeline.addKeyframe(trackResult.data!.id, {
        time: 1.0,
        value: 100,
        interpolation: InterpolationMode.Linear,
      })
      expect(keyframeResult.success).toBe(true)

      history.pushState(timeline.clone())

      const undoResult = history.undo()
      expect(undoResult.success).toBe(true)
      expect(history.canRedo()).toBe(true)

      const redoResult = history.redo()
      expect(redoResult.success).toBe(true)
      expect(history.canRedo()).toBe(false)
    })

    it('should limit history size', () => {
      history.setMaxHistorySize(3)

      for (let i = 0; i < 5; i++) {
        timeline.addTrack({
          name: `Track ${i}`,
          type: TrackType.Property,
        })
        history.pushState(timeline.clone())
      }

      expect(history.getHistorySize()).toBe(3)
    })

    it('should clear history correctly', () => {
      timeline.addTrack({
        name: 'Test Track',
        type: TrackType.Property,
      })
      history.pushState(timeline.clone())

      expect(history.canUndo()).toBe(true)

      history.clear()
      expect(history.canUndo()).toBe(false)
      expect(history.getHistorySize()).toBe(0)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complex timeline scenarios', () => {
      // Create multiple tracks
      const positionTrack = timeline.addTrack({
        name: 'Position',
        type: TrackType.Property,
        targetNodeId: 'node1',
        propertyPath: 'position',
      })
      expect(positionTrack.success).toBe(true)

      const rotationTrack = timeline.addTrack({
        name: 'Rotation',
        type: TrackType.Property,
        targetNodeId: 'node1',
        propertyPath: 'rotation',
      })
      expect(rotationTrack.success).toBe(true)

      // Add keyframes to position track
      timeline.addKeyframe(positionTrack.data!.id, {
        time: 0,
        value: { x: 0, y: 0 },
        interpolation: InterpolationMode.Linear,
      })
      timeline.addKeyframe(positionTrack.data!.id, {
        time: 2,
        value: { x: 100, y: 50 },
        interpolation: InterpolationMode.Bezier,
      })

      // Add keyframes to rotation track
      timeline.addKeyframe(rotationTrack.data!.id, {
        time: 0,
        value: 0,
        interpolation: InterpolationMode.Linear,
      })
      timeline.addKeyframe(rotationTrack.data!.id, {
        time: 3,
        value: Math.PI,
        interpolation: InterpolationMode.Smooth,
      })

      // Evaluate at different times
      const eval1 = timeline.evaluate(1)
      expect(eval1.success).toBe(true)
      const position1 = eval1.data?.get('node1.position')
      expect(position1?.x).toBe(50)
      expect(position1?.y).toBe(25)
      const rotation1 = eval1.data?.get('node1.rotation')
      expect(rotation1).toBeCloseTo(Math.PI / 3, 5)

      const eval2 = timeline.evaluate(2.5)
      expect(eval2.success).toBe(true)
      const position2 = eval2.data?.get('node1.position')
      expect(position2?.x).toBeCloseTo(100, 1) // Should extrapolate beyond last keyframe
      expect(position2?.y).toBeCloseTo(50, 1)
      const rotation2 = eval2.data?.get('node1.rotation')
      expect(rotation2).toBeCloseTo(Math.PI * (2.5 / 3), 5) // Should be interpolated value
    })

    it('should handle timeline cloning correctly', () => {
      const trackResult = timeline.addTrack({
        name: 'Original Track',
        type: TrackType.Property,
      })
      expect(trackResult.success).toBe(true)

      timeline.addKeyframe(trackResult.data!.id, {
        time: 1.0,
        value: 100,
        interpolation: InterpolationMode.Linear,
      })

      const cloned = timeline.clone()
      expect(cloned.id).toBe(timeline.id)
      expect(cloned.name).toBe(timeline.name)
      expect(cloned.tracks).toHaveLength(timeline.tracks.length)
      expect(cloned.tracks[0].keyframes).toHaveLength(
        timeline.tracks[0].keyframes.length
      )

      // Verify they are separate objects
      expect(cloned).not.toBe(timeline)
      expect(cloned.tracks[0]).not.toBe(timeline.tracks[0])
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty timeline gracefully', () => {
      const evalResult = timeline.evaluate(1.0)
      expect(evalResult.success).toBe(true)
      expect(evalResult.data?.size).toBe(0)
    })

    it('should handle keyframes outside timeline bounds', () => {
      const trackResult = timeline.addTrack({
        name: 'Test Track',
        type: TrackType.Property,
      })
      expect(trackResult.success).toBe(true)
      const trackId = trackResult.data!.id

      const keyframeResult = timeline.addKeyframe(trackId, {
        time: 15.0, // Beyond timeline duration
        value: 100,
        interpolation: InterpolationMode.Linear,
      })
      expect(keyframeResult.success).toBe(true)
    })

    it('should handle duplicate keyframe times', () => {
      const trackResult = timeline.addTrack({
        name: 'Test Track',
        type: TrackType.Property,
      })
      expect(trackResult.success).toBe(true)
      const trackId = trackResult.data!.id

      timeline.addKeyframe(trackId, {
        time: 1.0,
        value: 100,
        interpolation: InterpolationMode.Linear,
      })
      timeline.addKeyframe(trackId, {
        time: 1.0, // Same time
        value: 200,
        interpolation: InterpolationMode.Linear,
      })

      const track = timeline.getTrackById(trackId)
      expect(track?.keyframes).toHaveLength(2)
    })

    it('should handle invalid track operations', () => {
      const invalidTrackResult = timeline.addKeyframe('nonexistent', {
        time: 1.0,
        value: 100,
        interpolation: InterpolationMode.Linear,
      })
      expect(invalidTrackResult.success).toBe(false)
      expect(invalidTrackResult.error?.code).toBe('TRACK_NOT_FOUND')

      const invalidKeyframeResult = timeline.updateKeyframe(
        'nonexistent',
        'nonexistent',
        {
          time: 2.0,
        }
      )
      expect(invalidKeyframeResult.success).toBe(false)
      expect(invalidKeyframeResult.error?.code).toBe('TRACK_NOT_FOUND')
    })

    it('should handle playback loop correctly', () => {
      timeline.setPlaybackConfig({ loop: true })

      const seekResult = controller.seek(12.0) // Beyond duration
      expect(seekResult.success).toBe(true)
      expect(timeline.currentTime).toBe(10.0) // Should clamp to duration

      // Test loop behavior
      controller.play()
      // PLACEHOLDER: In a real implementation, this would loop back to 0
      // For now, we just verify the config is set
      expect(timeline.playbackConfig.loop).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    it('should handle large numbers of keyframes efficiently', () => {
      const trackResult = timeline.addTrack({
        name: 'Performance Track',
        type: TrackType.Property,
      })
      expect(trackResult.success).toBe(true)
      const trackId = trackResult.data!.id

      // Add many keyframes
      const startTime = performance.now()
      for (let i = 0; i < 1000; i++) {
        timeline.addKeyframe(trackId, {
          time: i * 0.01,
          value: Math.sin(i * 0.1) * 100,
          interpolation: InterpolationMode.Linear,
        })
      }
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
      expect(timeline.tracks[0].keyframes).toHaveLength(1000)
    })

    it('should evaluate complex timelines quickly', () => {
      // Create a complex timeline with multiple tracks and keyframes
      for (let i = 0; i < 5; i++) {
        const trackResult = timeline.addTrack({
          name: `Track ${i}`,
          type: TrackType.Property,
          targetNodeId: `node${i}`,
          propertyPath: 'position.x',
        })
        expect(trackResult.success).toBe(true)

        for (let j = 0; j < 20; j++) {
          timeline.addKeyframe(trackResult.data!.id, {
            time: j * 0.5,
            value: Math.sin(j) * 100,
            interpolation: InterpolationMode.Linear,
          })
        }
      }

      const startTime = performance.now()
      for (let i = 0; i < 100; i++) {
        timeline.evaluate(i * 0.1)
      }
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // Should evaluate quickly
    })
  })

  describe('Utility Functions', () => {
    it('should convert between time and frames correctly', () => {
      expect(timeline.getFrameAtTime(1.0)).toBe(30) // 30fps * 1 second
      expect(timeline.getTimeAtFrame(60)).toBe(2.0) // 60 frames / 30fps
      expect(timeline.getTotalFrames()).toBe(300) // 10 seconds * 30fps
    })

    it('should handle different frame rates', () => {
      const highFpsTimeline = new Timeline('high-fps', 'High FPS', 5.0, 60.0)
      expect(highFpsTimeline.getFrameAtTime(1.0)).toBe(60)
      expect(highFpsTimeline.getTimeAtFrame(120)).toBe(2.0)
      expect(highFpsTimeline.getTotalFrames()).toBe(300)
    })
  })

  describe('Event System', () => {
    it('should emit events for timeline changes', () => {
      let eventCount = 0
      let lastEvent: any = null

      timeline.addEventListener((event) => {
        eventCount++
        lastEvent = event
      })

      timeline.addTrack({
        name: 'Event Test Track',
        type: TrackType.Property,
      })

      expect(eventCount).toBe(1)
      expect(lastEvent.type).toBe('track_added')

      timeline.addKeyframe('nonexistent', {
        time: 1.0,
        value: 100,
        interpolation: InterpolationMode.Linear,
      })

      // Should not emit event for failed operation
      expect(eventCount).toBe(1)
    })

    it('should allow event listener removal', () => {
      let eventCount = 0

      const listener = () => {
        eventCount++
      }

      timeline.addEventListener(listener)
      timeline.addTrack({
        name: 'Remove Test Track',
        type: TrackType.Property,
      })
      expect(eventCount).toBe(1)

      timeline.removeEventListener(listener)
      timeline.addTrack({
        name: 'Another Track',
        type: TrackType.Property,
      })
      expect(eventCount).toBe(1) // Should not increment after removal
    })
  })
})
