/**
 * @fileoverview Core Milestone 3 Testing Suite - Transform Operations
 * @author @darianrosebrook
 */

import { describe, it, expect } from 'vitest'
import { TransformUtils } from '../src/core/renderer/transforms'
import { Point2D } from '../src/types'

describe('Milestone 3: Basic Rendering System - Core Transform Tests', () => {
  describe('Transform Matrix Operations', () => {
    it('should create correct identity matrix', () => {
      const identity = TransformUtils.identity()
      expect(identity[0]).toBe(1) // m00
      expect(identity[5]).toBe(1) // m11
      expect(identity[15]).toBe(1) // m33
    })

    it('should create correct translation matrix', () => {
      const translate = TransformUtils.translate(10, 20)
      expect(translate[12]).toBe(10) // tx
      expect(translate[13]).toBe(20) // ty
    })

    it('should create correct scale matrix', () => {
      const scale = TransformUtils.scale(2, 3)
      expect(scale[0]).toBe(2) // sx
      expect(scale[5]).toBe(3) // sy
    })

    it('should create correct rotation matrix', () => {
      const rotation = TransformUtils.rotate(Math.PI / 2) // 90 degrees
      expect(Math.abs(rotation[0] - 0)).toBeLessThan(0.001) // cos(90) ≈ 0
      expect(Math.abs(rotation[1] - 1)).toBeLessThan(0.001) // sin(90) = 1
      expect(Math.abs(rotation[4] - -1)).toBeLessThan(0.001) // -sin(90) = -1
      expect(Math.abs(rotation[5] - 0)).toBeLessThan(0.001) // cos(90) ≈ 0
    })

    it('should multiply matrices correctly', () => {
      const translate = TransformUtils.translate(10, 20)
      const scale = TransformUtils.scale(2, 3)
      const combined = TransformUtils.multiply(scale, translate) // Scale first, then translate

      // Combined should apply scale first, then translate
      expect(combined[0]).toBe(2) // scale x
      expect(combined[5]).toBe(3) // scale y
      expect(combined[12]).toBe(10) // translate x
      expect(combined[13]).toBe(20) // translate y
    })

    it('should transform points correctly', () => {
      const matrix = TransformUtils.translate(10, 20)
      const point: Point2D = { x: 5, y: 7 }
      const transformed = TransformUtils.transformPoint(matrix, point)

      expect(transformed.x).toBe(15) // 5 + 10
      expect(transformed.y).toBe(27) // 7 + 20
    })

    it('should create transform matrices from 2D properties', () => {
      const transform = {
        position: { x: 10, y: 20 },
        scale: { width: 2, height: 3 },
        rotation: Math.PI / 4,
        anchor: { x: 5, y: 5 },
        skewX: 0.1,
        skewY: 0.2,
      }

      const matrix = TransformUtils.fromTransform(transform)

      // Should create a valid 4x4 matrix
      expect(matrix).toHaveLength(16)
      expect(matrix[0]).not.toBe(0) // Should not be singular
      expect(matrix[5]).not.toBe(0) // Should not be singular
    })

    it('should handle hierarchical transforms', () => {
      const parent = {
        position: { x: 10, y: 10 },
        scale: { width: 2, height: 2 },
        rotation: 0,
        anchor: { x: 0, y: 0 },
        skewX: 0,
        skewY: 0,
      }

      const child = {
        position: { x: 5, y: 5 },
        scale: { width: 1.5, height: 1.5 },
        rotation: Math.PI / 4,
        anchor: { x: 0, y: 0 },
        skewX: 0,
        skewY: 0,
      }

      const combined = TransformUtils.combineTransforms(parent, child)

      // Combined transform should be calculated correctly
      expect(combined.position.x).not.toBe(0)
      expect(combined.position.y).not.toBe(0)
      expect(combined.scale.width).toBe(3) // 2 * 1.5
      expect(combined.scale.height).toBe(3) // 2 * 1.5
      expect(combined.rotation).toBe(Math.PI / 4)
    })
  })

  describe('Matrix Utilities', () => {
    it('should convert matrices to Float32Array', () => {
      const matrix = TransformUtils.identity()
      const float32 = TransformUtils.toFloat32Array(matrix)

      expect(float32).toBeInstanceOf(Float32Array)
      expect(float32.length).toBe(16)
      expect(float32[0]).toBe(1)
    })

    it('should create orthographic projection matrices', () => {
      const ortho = TransformUtils.orthographic(0, 800, 0, 600)

      // Should map viewport coordinates to normalized device coordinates
      expect(ortho[0]).toBe(2 / 800) // 2/width
      expect(ortho[5]).toBe(2 / 600) // 2/height
    })

    it('should check matrix identity', () => {
      const identity = TransformUtils.identity()
      const translate = TransformUtils.translate(10, 20)

      expect(TransformUtils.isIdentity(identity)).toBe(true)
      expect(TransformUtils.isIdentity(translate)).toBe(false)
    })

    it('should handle matrix inversion', () => {
      const matrix = TransformUtils.translate(10, 20)
      const inverse = TransformUtils.inverse(matrix)

      // Inverse of translation should be negative translation
      expect(inverse[12]).toBe(-10)
      expect(inverse[13]).toBe(-20)
    })
  })

  describe('Error Handling', () => {
    it('should handle singular matrices gracefully', () => {
      // Create a singular matrix (zero scale)
      const singularMatrix = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
      ] as const

      const inverse = TransformUtils.inverse(singularMatrix as any)
      expect(TransformUtils.isIdentity(inverse as any)).toBe(true) // Should return identity for singular matrices
    })
  })
})
