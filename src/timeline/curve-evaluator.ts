/**
 * @fileoverview Animation Curve Evaluator for Timeline Interpolation
 * @author @darianrosebrook
 */

import { Time } from '@/types'
import {
  Keyframe,
  InterpolationMode,
  BezierCurve,
  AnimationCurve as IAnimationCurve,
  CurveEvaluator as ICurveEvaluator,
} from './timeline-types'

/**
 * Animation curve implementation with advanced interpolation
 */
export class AnimationCurve implements IAnimationCurve {
  keyframes: Keyframe[]

  constructor(keyframes: Keyframe[] = []) {
    this.keyframes = [...keyframes]
    this.sortKeyframes()
  }

  evaluate(time: Time): any {
    if (this.keyframes.length === 0) return undefined
    if (this.keyframes.length === 1) return this.keyframes[0].value

    // Find the segment containing the time
    const segment = this.findSegment(time)
    if (!segment) return this.keyframes[0].value

    const { beforeKeyframe, afterKeyframe } = segment

    // If we're exactly at a keyframe, return its value
    if (beforeKeyframe.time === time) return beforeKeyframe.value

    const dt = afterKeyframe.time - beforeKeyframe.time
    if (dt === 0) return beforeKeyframe.value

    const progress = (time - beforeKeyframe.time) / dt

    return this.interpolateValues(
      beforeKeyframe.value,
      afterKeyframe.value,
      progress,
      beforeKeyframe.interpolation,
      beforeKeyframe.easing,
      afterKeyframe.easing
    )
  }

  getTangentAt(time: Time): { in: number; out: number } {
    const segment = this.findSegment(time)
    if (!segment) return { in: 0, out: 0 }

    const { beforeKeyframe, afterKeyframe } = segment

    // Simplified tangent calculation
    const dt = afterKeyframe.time - beforeKeyframe.time
    if (dt === 0) return { in: 0, out: 0 }

    const dv = this.getValueDifference(
      beforeKeyframe.value,
      afterKeyframe.value
    )
    const tangent = dv / dt

    return { in: tangent, out: tangent }
  }

  addKeyframe(keyframe: Keyframe): void {
    this.keyframes.push(keyframe)
    this.sortKeyframes()
  }

  removeKeyframe(keyframeId: string): void {
    this.keyframes = this.keyframes.filter((k) => k.id !== keyframeId)
  }

  updateKeyframe(keyframeId: string, updates: Partial<Keyframe>): void {
    const keyframe = this.keyframes.find((k) => k.id === keyframeId)
    if (keyframe) {
      Object.assign(keyframe, updates)
      this.sortKeyframes()
    }
  }

  private sortKeyframes(): void {
    this.keyframes.sort((a, b) => a.time - b.time)
  }

  private findSegment(
    time: Time
  ): { beforeKeyframe: Keyframe; afterKeyframe: Keyframe } | null {
    // Find keyframes that bracket the time
    let beforeKeyframe: Keyframe | null = null
    let afterKeyframe: Keyframe | null = null

    for (const keyframe of this.keyframes) {
      if (keyframe.time <= time) {
        beforeKeyframe = keyframe
      }
      if (keyframe.time > time && !afterKeyframe) {
        afterKeyframe = keyframe
        break
      }
    }

    // If no after keyframe found, use the last keyframe
    if (beforeKeyframe && !afterKeyframe && this.keyframes.length > 0) {
      afterKeyframe = this.keyframes[this.keyframes.length - 1]
    }

    if (beforeKeyframe && afterKeyframe) {
      return { beforeKeyframe, afterKeyframe }
    }

    return null
  }

  private interpolateValues(
    startValue: any,
    endValue: any,
    progress: number,
    interpolation: InterpolationMode,
    startEasing?: BezierCurve,
    endEasing?: BezierCurve
  ): any {
    // Clamp progress to [0, 1]
    progress = Math.max(0, Math.min(1, progress))

    switch (interpolation) {
      case InterpolationMode.Linear:
        return this.linearInterpolation(startValue, endValue, progress)

      case InterpolationMode.Bezier:
        return this.bezierInterpolation(
          startValue,
          endValue,
          progress,
          startEasing,
          endEasing
        )

      case InterpolationMode.Stepped:
        return startValue

      case InterpolationMode.Smooth:
        return this.smoothInterpolation(startValue, endValue, progress)

      default:
        return this.linearInterpolation(startValue, endValue, progress)
    }
  }

  private linearInterpolation(
    startValue: any,
    endValue: any,
    progress: number
  ): any {
    if (typeof startValue === 'number' && typeof endValue === 'number') {
      return startValue + (endValue - startValue) * progress
    }

    if (
      startValue &&
      endValue &&
      typeof startValue === 'object' &&
      typeof endValue === 'object'
    ) {
      // Handle point interpolation
      if ('x' in startValue && 'y' in endValue) {
        return {
          x: this.linearInterpolation(startValue.x, endValue.x, progress),
          y: this.linearInterpolation(startValue.y, endValue.y, progress),
        }
      }

      // Handle color interpolation
      if ('r' in startValue && 'g' in endValue && 'b' in endValue) {
        return {
          r: this.linearInterpolation(startValue.r, endValue.r, progress),
          g: this.linearInterpolation(startValue.g, endValue.g, progress),
          b: this.linearInterpolation(startValue.b, endValue.b, progress),
          a: this.linearInterpolation(
            startValue.a ?? 1,
            endValue.a ?? 1,
            progress
          ),
        }
      }
    }

    return startValue
  }

  private bezierInterpolation(
    startValue: any,
    endValue: any,
    progress: number,
    startEasing?: BezierCurve,
    endEasing?: BezierCurve
  ): any {
    if (startEasing && endEasing) {
      // Use custom bezier easing
      const easedProgress = this.evaluateBezierCurve(
        progress,
        startEasing,
        endEasing
      )
      return this.linearInterpolation(startValue, endValue, easedProgress)
    }

    // Default smooth bezier-like interpolation
    const smoothProgress = progress * progress * (3 - 2 * progress)
    return this.linearInterpolation(startValue, endValue, smoothProgress)
  }

  private smoothInterpolation(
    startValue: any,
    endValue: any,
    progress: number
  ): any {
    // Catmull-Rom spline interpolation for smooth curves
    const smoothProgress = progress * progress * (3 - 2 * progress)
    return this.linearInterpolation(startValue, endValue, smoothProgress)
  }

  private evaluateBezierCurve(
    progress: number,
    startEasing: BezierCurve,
    endEasing: BezierCurve
  ): number {
    // Simplified bezier evaluation - in production, implement proper bezier curve evaluation
    const p1 = { x: startEasing.p1x, y: startEasing.p1y }
    const _p2 = { x: startEasing.p2x, y: startEasing.p2y }
    const _p3 = { x: endEasing.p1x, y: endEasing.p1y }
    const p4 = { x: endEasing.p2x, y: endEasing.p2y }

    // Simple linear combination (could be enhanced with proper bezier math)
    const t = progress
    const u = 1 - t

    return (
      u * u * u * 0 +
      3 * u * u * t * p1.y +
      3 * u * t * t * p4.y +
      t * t * t * 1
    )
  }

  private getValueDifference(startValue: any, endValue: any): number {
    if (typeof startValue === 'number' && typeof endValue === 'number') {
      return endValue - startValue
    }

    if (
      startValue &&
      endValue &&
      typeof startValue === 'object' &&
      typeof endValue === 'object'
    ) {
      if ('x' in startValue && 'y' in endValue) {
        return Math.sqrt(
          Math.pow(endValue.x - startValue.x, 2) +
            Math.pow(endValue.y - startValue.y, 2)
        )
      }
    }

    return 0
  }
}

/**
 * Curve evaluator utility class
 */
export class CurveEvaluator implements ICurveEvaluator {
  evaluateLinear(keyframes: Keyframe[], time: Time): any {
    const curve = new AnimationCurve(keyframes)
    return curve.evaluate(time)
  }

  evaluateBezier(keyframes: Keyframe[], time: Time): any {
    const curve = new AnimationCurve(keyframes)
    return curve.evaluate(time)
  }

  evaluateStepped(keyframes: Keyframe[], time: Time): any {
    const curve = new AnimationCurve(keyframes)
    return curve.evaluate(time)
  }

  evaluateSmooth(keyframes: Keyframe[], time: Time): any {
    const curve = new AnimationCurve(keyframes)
    return curve.evaluate(time)
  }
}
