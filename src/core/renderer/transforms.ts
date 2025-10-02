/**
 * @fileoverview 2D Transform Matrix Operations
 * @author @darianrosebrook
 */

import { Point2D, Size2D } from '@/types'
import { logger } from '@/core/logging/logger'

/**
 * 4x4 transform matrix for 2D operations
 */
export type TransformMatrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

/**
 * 2D transform properties
 */
export interface Transform2D {
  position: Point2D
  scale: Size2D
  rotation: number // in radians
  anchor: Point2D
  skewX: number
  skewY: number
}

/**
 * Transform utilities for 2D graphics
 */
export class TransformUtils {
  /**
   * Create identity matrix
   */
  static identity(): TransformMatrix {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  }

  /**
   * Create translation matrix (column-major order for WebGPU)
   */
  static translate(tx: number, ty: number): TransformMatrix {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1]
  }

  /**
   * Create scale matrix (column-major order for WebGPU)
   */
  static scale(sx: number, sy: number): TransformMatrix {
    return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  }

  /**
   * Create rotation matrix (around origin, column-major order for WebGPU)
   */
  static rotate(angle: number): TransformMatrix {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return [cos, sin, 0, 0, -sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  }

  /**
   * Create skew matrix (column-major order for WebGPU)
   */
  static skew(skewX: number, skewY: number): TransformMatrix {
    return [
      1,
      Math.tan(skewY),
      0,
      0,
      Math.tan(skewX),
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
    ]
  }

  /**
   * Create transform matrix from 2D properties
   */
  static fromTransform(transform: Transform2D): TransformMatrix {
    // Start with identity
    let matrix = this.identity()

    // Apply anchor point translation (negative to move origin to anchor)
    const anchorTx = this.translate(-transform.anchor.x, -transform.anchor.y)
    matrix = this.multiply(matrix, anchorTx)

    // Apply scale
    const scaleMx = this.scale(transform.scale.width, transform.scale.height)
    matrix = this.multiply(matrix, scaleMx)

    // Apply skew
    if (transform.skewX !== 0 || transform.skewY !== 0) {
      const skewMx = this.skew(transform.skewX, transform.skewY)
      matrix = this.multiply(matrix, skewMx)
    }

    // Apply rotation
    if (transform.rotation !== 0) {
      const rotationMx = this.rotate(transform.rotation)
      matrix = this.multiply(matrix, rotationMx)
    }

    // Apply anchor point translation back (positive to move origin back)
    const anchorTxBack = this.translate(transform.anchor.x, transform.anchor.y)
    matrix = this.multiply(matrix, anchorTxBack)

    // Apply position translation
    const positionTx = this.translate(
      transform.position.x,
      transform.position.y
    )
    matrix = this.multiply(matrix, positionTx)

    return matrix
  }

  /**
   * Multiply two 4x4 matrices (column-major order)
   */
  static multiply(a: TransformMatrix, b: TransformMatrix): TransformMatrix {
    const result: TransformMatrix = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]

    // Matrix multiplication: result = a * b (column-major)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j]
        }
      }
    }

    return result
  }

  /**
   * Transform a 2D point by a matrix (column-major order)
   */
  static transformPoint(matrix: TransformMatrix, point: Point2D): Point2D {
    // Column-major matrix multiplication: [x', y', z', w'] = M * [x, y, z, w]
    const x =
      matrix[0] * point.x + matrix[4] * point.y + matrix[8] * 0 + matrix[12] * 1
    const y =
      matrix[1] * point.x + matrix[5] * point.y + matrix[9] * 0 + matrix[13] * 1
    const _z =
      matrix[2] * point.x +
      matrix[6] * point.y +
      matrix[10] * 0 +
      matrix[14] * 1
    // TODO: add z to the point
    logger.info('z', _z)
    const w =
      matrix[3] * point.x +
      matrix[7] * point.y +
      matrix[11] * 0 +
      matrix[15] * 1

    if (w !== 1 && w !== 0) {
      return { x: x / w, y: y / w }
    }

    return { x, y }
  }

  /**
   * Get matrix as Float32Array for GPU
   */
  static toFloat32Array(matrix: TransformMatrix): Float32Array {
    return new Float32Array(matrix)
  }

  /**
   * Create orthographic projection matrix for viewport (column-major order)
   */
  static orthographic(
    left: number,
    right: number,
    bottom: number,
    top: number
  ): TransformMatrix {
    const width = right - left
    const height = top - bottom

    return [
      2 / width,
      0,
      0,
      0,
      0,
      2 / height,
      0,
      0,
      0,
      0,
      1,
      0,
      -(right + left) / width,
      -(top + bottom) / height,
      0,
      1,
    ]
  }

  /**
   * Create matrix for hierarchical transforms (parent * child)
   */
  static combineTransforms(
    parent: Transform2D,
    child: Transform2D
  ): Transform2D {
    // Combine transforms by applying child transform relative to parent
    const combinedPosition = this.transformPoint(
      this.fromTransform(parent),
      child.position
    )

    return {
      position: combinedPosition,
      scale: {
        width: parent.scale.width * child.scale.width,
        height: parent.scale.height * child.scale.height,
      },
      rotation: parent.rotation + child.rotation,
      anchor: child.anchor, // Child anchor is relative to its local origin
      skewX: parent.skewX + child.skewX,
      skewY: parent.skewY + child.skewY,
    }
  }

  /**
   * Decompose matrix back to transform properties
   */
  static decompose(matrix: TransformMatrix): Transform2D {
    // Simplified decomposition - in practice, this is more complex
    // For now, return identity transform
    // A full implementation would solve for scale, rotation, skew, and translation
    return {
      position: { x: matrix[12], y: matrix[13] },
      scale: { width: 1, height: 1 },
      rotation: 0,
      anchor: { x: 0, y: 0 },
      skewX: 0,
      skewY: 0,
    }
  }

  /**
   * Check if matrix is identity (within tolerance)
   */
  static isIdentity(
    matrix: TransformMatrix,
    tolerance: number = 1e-6
  ): boolean {
    const identity = this.identity()

    for (let i = 0; i < 16; i++) {
      if (Math.abs(matrix[i] - identity[i]) > tolerance) {
        return false
      }
    }

    return true
  }

  /**
   * Get inverse of a transform matrix (column-major order)
   */
  static inverse(matrix: TransformMatrix): TransformMatrix {
    // Simplified inverse calculation for 2D transforms
    // For a proper 4x4 matrix inverse, we'd need full implementation
    // For now, handle translation-only matrices
    const det = matrix[0] * matrix[5] - matrix[1] * matrix[4]

    if (Math.abs(det) < 1e-6) {
      return this.identity() // Return identity if singular
    }

    return [
      matrix[5] / det,
      -matrix[1] / det,
      0,
      0,
      -matrix[4] / det,
      matrix[0] / det,
      0,
      0,
      0,
      0,
      1,
      0,
      -matrix[12],
      -matrix[13],
      0,
      1,
    ]
  }
}
