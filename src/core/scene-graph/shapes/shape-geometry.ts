/**
 * @fileoverview Shape Geometry Generation and Manipulation
 * @description Core algorithms for creating and manipulating 2D shape geometries
 * @author @darianrosebrook
 */

import {
  RectangleShape,
  EllipseShape,
  PathShape,
  PathVertex,
  PathVertexType,
  ShapeGeometry,
  ShapeBounds,
  Point2D,
  Size2D,
} from './shape-types'

/**
 * Shape geometry generator and manipulator
 */
export class ShapeGeometryGenerator {
  /**
   * Generate geometry for a rectangle shape
   */
  static generateRectangleGeometry(shape: RectangleShape): ShapeGeometry {
    const { position, size, rotation, cornerType, cornerRadius, chamferSize } =
      shape

    // For now, generate a simple rectangle
    // TODO: Implement rounded corners and chamfered corners
    const halfWidth = size.width / 2
    const halfHeight = size.height / 2

    // Rectangle vertices (centered at origin for easier rotation)
    const vertices = new Float32Array([
      // Bottom-left
      -halfWidth,
      -halfHeight,
      0,
      0,
      // Bottom-right
      halfWidth,
      -halfHeight,
      0,
      0,
      // Top-right
      halfWidth,
      halfHeight,
      0,
      0,
      // Top-left
      -halfWidth,
      halfHeight,
      0,
      0,
    ])

    // Rectangle indices (two triangles)
    const indices = new Uint16Array([
      0,
      1,
      2, // Bottom triangle
      0,
      2,
      3, // Top triangle
    ])

    const bounds = {
      minX: position.x - halfWidth,
      minY: position.y - halfHeight,
      maxX: position.x + halfWidth,
      maxY: position.y + halfHeight,
    }

    return {
      vertices,
      indices,
      vertexCount: 4,
      indexCount: 6,
      bounds,
    }
  }

  /**
   * Generate geometry for an ellipse shape
   */
  static generateEllipseGeometry(shape: EllipseShape): ShapeGeometry {
    const { position, size, rotation, innerRadius, startAngle, endAngle } =
      shape

    const radiusX = size.width / 2
    const radiusY = size.height / 2
    const segments = 64 // Number of segments for smooth ellipse

    // For full ellipse, generate vertices around the circumference
    if (!startAngle && !endAngle && !innerRadius) {
      const vertices: number[] = []
      const indices: number[] = []

      // Generate outer vertices
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        const x = Math.cos(angle) * radiusX
        const y = Math.sin(angle) * radiusY

        vertices.push(x, y, 0, 0) // position + uv coords
      }

      // Generate indices for triangle fan
      for (let i = 1; i < segments; i++) {
        indices.push(0, i, i + 1)
      }

      const bounds = {
        minX: position.x - radiusX,
        minY: position.y - radiusY,
        maxX: position.x + radiusX,
        maxY: position.y + radiusY,
      }

      return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices),
        vertexCount: segments + 1,
        indexCount: segments * 3,
        bounds,
      }
    }

    // For arcs or donut shapes, this would need more complex geometry
    // For now, return a simple ellipse
    return this.generateEllipseGeometry({
      ...shape,
      innerRadius: undefined,
      startAngle: undefined,
      endAngle: undefined,
    })
  }

  /**
   * Generate geometry for a path shape
   */
  static generatePathGeometry(shape: PathShape): ShapeGeometry {
    if (shape.vertices.length === 0) {
      return {
        vertices: new Float32Array(0),
        indices: new Uint16Array(0),
        vertexCount: 0,
        indexCount: 0,
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      }
    }

    // For simple paths, convert to polygon
    if (this.isSimplePolygon(shape.vertices)) {
      return this.generatePolygonGeometry(shape.vertices, shape.closed)
    }

    // For complex bezier paths, use more sophisticated geometry generation
    return this.generateBezierPathGeometry(shape.vertices, shape.closed)
  }

  /**
   * Check if vertices form a simple polygon (no bezier curves)
   */
  private static isSimplePolygon(vertices: PathVertex[]): boolean {
    return vertices.every((vertex) => vertex.type === PathVertexType.CORNER)
  }

  /**
   * Generate geometry for a simple polygon
   */
  private static generatePolygonGeometry(
    vertices: PathVertex[],
    closed: boolean
  ): ShapeGeometry {
    const positions: number[] = []
    const indices: number[] = []

    // Add vertices
    vertices.forEach((vertex) => {
      positions.push(vertex.point.x, vertex.point.y, 0, 0)
    })

    if (closed && vertices.length >= 3) {
      // Generate triangle fan for closed polygon
      for (let i = 1; i < vertices.length - 1; i++) {
        indices.push(0, i, i + 1)
      }
    } else if (vertices.length >= 2) {
      // Generate line strip for open path
      for (let i = 0; i < vertices.length - 1; i++) {
        indices.push(i, i + 1)
      }
    }

    // Calculate bounds
    const bounds = this.calculatePathBounds(vertices)

    return {
      vertices: new Float32Array(positions),
      indices: new Uint16Array(indices),
      vertexCount: vertices.length,
      indexCount: indices.length,
      bounds,
    }
  }

  /**
   * Generate geometry for bezier curve paths
   */
  private static generateBezierPathGeometry(
    vertices: PathVertex[],
    closed: boolean
  ): ShapeGeometry {
    // For complex bezier paths, we'll use a simplified approach
    // In a full implementation, this would use proper bezier curve tessellation

    const positions: number[] = []
    const indices: number[] = []

    // Sample points along the path
    const samples = this.sampleBezierPath(vertices, 100) // 100 samples per segment

    samples.forEach((point, index) => {
      positions.push(point.x, point.y, 0, 0)

      if (index > 0) {
        indices.push(index - 1, index)
      }
    })

    const bounds = this.calculatePathBounds(vertices)

    return {
      vertices: new Float32Array(positions),
      indices: new Uint16Array(indices),
      vertexCount: samples.length,
      indexCount: indices.length,
      bounds,
    }
  }

  /**
   * Sample points along a bezier path for geometry generation
   */
  private static sampleBezierPath(
    vertices: PathVertex[],
    samplesPerSegment: number
  ): Point2D[] {
    const points: Point2D[] = []

    for (let i = 0; i < vertices.length - 1; i++) {
      const current = vertices[i]
      const next = vertices[i + 1]

      // Simple linear interpolation for now
      // In a full implementation, this would handle bezier curves properly
      for (let t = 0; t <= 1; t += 1 / samplesPerSegment) {
        const x = current.point.x + t * (next.point.x - current.point.x)
        const y = current.point.y + t * (next.point.y - current.point.y)
        points.push({ x, y })
      }
    }

    return points
  }

  /**
   * Calculate bounds for a path
   */
  private static calculatePathBounds(vertices: PathVertex[]): ShapeBounds {
    if (vertices.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    vertices.forEach((vertex) => {
      const { x, y } = vertex.point
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)

      // Also consider control points for bounds
      if (vertex.inHandle) {
        minX = Math.min(minX, vertex.inHandle.x)
        minY = Math.min(minY, vertex.inHandle.y)
        maxX = Math.max(maxX, vertex.inHandle.x)
        maxY = Math.max(maxY, vertex.inHandle.y)
      }

      if (vertex.outHandle) {
        minX = Math.min(minX, vertex.outHandle.x)
        minY = Math.min(minY, vertex.outHandle.y)
        maxX = Math.max(maxX, vertex.outHandle.x)
        maxY = Math.max(maxY, vertex.outHandle.y)
      }
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  /**
   * Generate rounded rectangle geometry
   */
  static generateRoundedRectangleGeometry(
    position: Point2D,
    size: Size2D,
    cornerRadius: number
  ): ShapeGeometry {
    const { x, y } = position
    const { width, height } = size
    const radius = Math.min(cornerRadius, width / 2, height / 2)

    // For rounded rectangles, we need to generate arc segments for each corner
    const segments = 8 // Segments per corner arc
    const vertices: number[] = []
    const indices: number[] = []

    let vertexIndex = 0

    // Helper function to add arc vertices
    const addArc = (
      centerX: number,
      centerY: number,
      startAngle: number,
      endAngle: number
    ) => {
      const angleStep = (endAngle - startAngle) / segments

      for (let i = 0; i <= segments; i++) {
        const angle = startAngle + i * angleStep
        const vx = centerX + Math.cos(angle) * radius
        const vy = centerY + Math.sin(angle) * radius
        vertices.push(vx, vy, 0, 0)
      }
    }

    // Top-left corner arc
    addArc(x + radius, y + radius, Math.PI, (3 * Math.PI) / 2)

    // Top-right corner arc
    addArc(x + width - radius, y + radius, (3 * Math.PI) / 2, 0)

    // Bottom-right corner arc
    addArc(x + width - radius, y + height - radius, 0, Math.PI / 2)

    // Bottom-left corner arc
    addArc(x + radius, y + height - radius, Math.PI / 2, Math.PI)

    // Generate indices for the shape
    const totalVertices = (segments + 1) * 4
    for (let i = 0; i < totalVertices - 1; i++) {
      indices.push(i, i + 1)
    }

    // Close the shape
    indices.push(totalVertices - 1, 0)

    const bounds = {
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height,
    }

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      vertexCount: totalVertices,
      indexCount: indices.length,
      bounds,
    }
  }

  /**
   * Perform boolean operations on shapes
   */
  static performBooleanOperation(
    shape1: ShapeGeometry,
    shape2: ShapeGeometry,
    operation: 'union' | 'intersection' | 'difference'
  ): ShapeGeometry {
    // For now, return the first shape
    // TODO: Implement proper boolean operations using a geometry library
    return shape1
  }

  /**
   * Calculate intersection point between two line segments
   */
  static lineIntersection(
    p1: Point2D,
    p2: Point2D,
    p3: Point2D,
    p4: Point2D
  ): Point2D | null {
    const x1 = p1.x,
      y1 = p1.y
    const x2 = p2.x,
      y2 = p2.y
    const x3 = p3.x,
      y3 = p3.y
    const x4 = p4.x,
      y4 = p4.y

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

    if (Math.abs(denom) < 1e-10) {
      return null // Lines are parallel
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
      }
    }

    return null
  }

  /**
   * Check if a point is inside a polygon using ray casting algorithm
   */
  static pointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
    let inside = false

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (
        polygon[i].y > point.y !== polygon[j].y > point.y &&
        point.x <
          ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) /
            (polygon[j].y - polygon[i].y) +
            polygon[i].x
      ) {
        inside = !inside
      }
    }

    return inside
  }

  /**
   * Calculate distance from point to line segment
   */
  static distanceToLineSegment(
    point: Point2D,
    lineStart: Point2D,
    lineEnd: Point2D
  ): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D

    let param = -1
    if (lenSq !== 0) {
      param = dot / lenSq
    }

    let xx: number, yy: number

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Generate SVG path data from vertices
   */
  static generateSVGPath(
    vertices: PathVertex[],
    closed: boolean = false
  ): string {
    if (vertices.length === 0) return ''

    let path = `M ${vertices[0].point.x} ${vertices[0].point.y}`

    for (let i = 1; i < vertices.length; i++) {
      const vertex = vertices[i]
      const prevVertex = vertices[i - 1]

      if (vertex.type === PathVertexType.CORNER) {
        path += ` L ${vertex.point.x} ${vertex.point.y}`
      } else if (
        vertex.type === PathVertexType.SMOOTH ||
        vertex.type === PathVertexType.SYMMETRIC
      ) {
        // For smooth/symmetric vertices, we'd need proper bezier curve calculation
        // For now, use simple lines
        path += ` L ${vertex.point.x} ${vertex.point.y}`
      }
    }

    if (closed && vertices.length > 2) {
      path += ' Z'
    }

    return path
  }

  /**
   * Parse SVG path data into vertices
   */
  static parseSVGPath(pathData: string): PathVertex[] {
    // Simple SVG path parser
    // In a full implementation, this would use a proper SVG path parsing library

    const vertices: PathVertex[] = []
    const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || []

    let currentX = 0
    let currentY = 0

    commands.forEach((command) => {
      const type = command[0]
      const args = command
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(Number)

      switch (type) {
        case 'M': // Move to
          currentX = args[0]
          currentY = args[1]
          vertices.push({
            point: { x: currentX, y: currentY },
            type: PathVertexType.CORNER,
          })
          break

        case 'L': // Line to
          currentX = args[0]
          currentY = args[1]
          vertices.push({
            point: { x: currentX, y: currentY },
            type: PathVertexType.CORNER,
          })
          break

        case 'Z': // Close path
          // Close the path by connecting back to the first vertex
          if (vertices.length > 0) {
            const firstVertex = vertices[0]
            vertices.push({
              point: { x: firstVertex.point.x, y: firstVertex.point.y },
              type: PathVertexType.CORNER,
            })
          }
          break
      }
    })

    return vertices
  }

  /**
   * Calculate shape bounds including rotation
   */
  static calculateRotatedBounds(
    bounds: ShapeBounds,
    centerX: number,
    centerY: number,
    rotation: number
  ): ShapeBounds {
    if (rotation === 0) return bounds

    const radians = (rotation * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)

    const corners = [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height },
    ]

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    corners.forEach((corner) => {
      const dx = corner.x - centerX
      const dy = corner.y - centerY

      const rotatedX = centerX + dx * cos - dy * sin
      const rotatedY = centerY + dx * sin + dy * cos

      minX = Math.min(minX, rotatedX)
      minY = Math.min(minY, rotatedY)
      maxX = Math.max(maxX, rotatedX)
      maxY = Math.max(maxY, rotatedY)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation,
    }
  }

  /**
   * Generate triangle mesh from shape outline
   */
  static triangulateShape(geometry: ShapeGeometry): ShapeGeometry {
    // For now, return the original geometry
    // TODO: Implement proper triangulation algorithm
    return geometry
  }

  /**
   * Optimize geometry for rendering performance
   */
  static optimizeGeometry(geometry: ShapeGeometry): ShapeGeometry {
    // For now, return the original geometry
    // TODO: Implement geometry optimization (duplicate removal, etc.)
    return geometry
  }
}
