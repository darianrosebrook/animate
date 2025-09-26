/**
 * @fileoverview Debug tests for Timeline System
 * @author @darianrosebrook
 */

import { describe, it, expect } from 'vitest'
import { Timeline } from '../src/timeline/timeline'
import { TrackType, InterpolationMode } from '../src/timeline/timeline-types'

describe('Timeline Debug Tests', () => {
  it('should debug timeline evaluation', () => {
    const timeline = new Timeline('debug-timeline', 'Debug Timeline', 10.0, 30.0)

    const trackResult = timeline.addTrack({
      name: 'Position Track',
      type: TrackType.Property,
      targetNodeId: 'node1',
      propertyPath: 'position',
    })
    expect(trackResult.success).toBe(true)
    const trackId = trackResult.data!.id

    console.log('Track ID:', trackId)
    console.log('Track targetNodeId:', trackResult.data?.targetNodeId)
    console.log('Track propertyPath:', trackResult.data?.propertyPath)

    // Add keyframes
    timeline.addKeyframe(trackId, { time: 0, value: { x: 0, y: 0 }, interpolation: InterpolationMode.Linear })
    timeline.addKeyframe(trackId, { time: 2, value: { x: 100, y: 50 }, interpolation: InterpolationMode.Linear })

    console.log('Track keyframes:', timeline.tracks[0].keyframes)

    // Test evaluation
    const eval1 = timeline.evaluate(1)
    console.log('Timeline evaluation result:', eval1)
    console.log('Timeline evaluation data:', eval1.data)

    if (eval1.data) {
      console.log('node1.position:', eval1.data.get('node1.position'))
      console.log('node1.position.x:', eval1.data.get('node1.position')?.x)
    }

    expect(eval1.success).toBe(true)
    expect(eval1.data?.get('node1.position')?.x).toBe(50)
    expect(eval1.data?.get('node1.position')?.y).toBe(25)
  })
})
