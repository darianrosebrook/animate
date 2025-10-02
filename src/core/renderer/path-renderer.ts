/**
 * @fileoverview SVG Path Rendering System with Tessellation
 * @author @darianrosebrook
 */

import { Result, Point2D, Color } from '@/types'
import { WebGPUContext } from './webgpu-context'
import { logger } from '@/core/logging/logger'

/**
 * SVG path command types
 */
export enum PathCommandType {
  MoveTo = 'M',
  LineTo = 'L',
  HorizontalLineTo = 'H',
  VerticalLineTo = 'V',
  CubicBezierCurveTo = 'C',
  SmoothCubicBezierCurveTo = 'S',
  QuadraticBezierCurveTo = 'Q',
  SmoothQuadraticBezierCurveTo = 'T',
  EllipticalArcTo = 'A',
  ClosePath = 'Z',
}

/**
 * SVG path command
 */
export interface PathCommand {
  type: PathCommandType
  points: Point2D[]
  parameters?: number[]
}

/**
 * Path segment for tessellation
 */
export interface PathSegment {
  start: Point2D
  end: Point2D
  control1?: Point2D
  control2?: Point2D
  command: PathCommandType
}

/**
 * Tessellated geometry for rendering
 */
export interface TessellatedGeometry {
  vertices: Float32Array
  indices: Uint16Array
  vertexCount: number
  triangleCount: number
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

/**
 * Path properties for rendering
 */
export interface PathProperties {
  pathData: string
  fillColor: Color
  strokeColor: Color
  strokeWidth: number
  fillRule: 'nonzero' | 'evenodd'
  strokeLineCap: 'butt' | 'round' | 'square'
  strokeLineJoin: 'miter' | 'round' | 'bevel'
  strokeMiterLimit: number
  position: Point2D
  scale: Point2D
  rotation: number
}

/**
 * SVG path parser and tessellator
 */
export class SVGPathRenderer {
  private webgpuContext: WebGPUContext
  private renderPipeline: GPURenderPipeline | null = null
  private vertexBuffer: GPUBuffer | null = null
  private indexBuffer: GPUBuffer | null = null

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  /**
   * Initialize path renderer
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for path renderer',
          },
        }
      }

      // Create render pipeline
      const vertexShader = this.createPathVertexShader()
      const fragmentShader = this.createPathFragmentShader()

      const bindGroupLayout = device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
          },
        ],
      })

      const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      })

      this.renderPipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: device.createShaderModule({ code: vertexShader }),
          entryPoint: 'main',
          buffers: [
            {
              arrayStride: 4 * 6, // position + color
              attributes: [
                {
                  shaderLocation: 0,
                  offset: 0,
                  format: 'float32x2',
                },
                {
                  shaderLocation: 1,
                  offset: 8,
                  format: 'float32x4',
                },
              ],
            },
          ],
        },
        fragment: {
          module: device.createShaderModule({ code: fragmentShader }),
          entryPoint: 'main',
          targets: [
            {
              format: this.webgpuContext.getFormat(),
            },
          ],
        },
        primitive: {
          topology: 'triangle-list',
          cullMode: 'none',
        },
      })

      logger.info('✅ Path renderer initialized successfully')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PATH_RENDERER_INIT_ERROR',
          message: `Failed to initialize path renderer: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Parse SVG path data into commands
   */
  parsePathData(pathData: string): Result<PathCommand[]> {
    try {
      const commands: PathCommand[] = []
      let currentPosition: Point2D = { x: 0, y: 0 }
      let startPosition: Point2D = { x: 0, y: 0 }

      // Split by whitespace and commands
      const tokens =
        pathData.match(/[A-Za-z]|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g) || []

      let i = 0
      while (i < tokens.length) {
        const token = tokens[i]
        const commandType = token as PathCommandType

        switch (commandType) {
          case PathCommandType.MoveTo: {
            const x = parseFloat(tokens[i + 1])
            const y = parseFloat(tokens[i + 2])
            if (isNaN(x) || isNaN(y)) {
              return {
                success: false,
                error: {
                  code: 'PATH_PARSE_ERROR',
                  message: `Invalid coordinates for MoveTo command at position ${i}`,
                },
              }
            }
            currentPosition = { x, y }
            startPosition = { x, y }

            commands.push({
              type: PathCommandType.MoveTo,
              points: [{ x, y }],
            })
            i += 3
            break
          }

          case PathCommandType.LineTo: {
            const x = parseFloat(tokens[i + 1])
            const y = parseFloat(tokens[i + 2])
            if (isNaN(x) || isNaN(y)) {
              return {
                success: false,
                error: {
                  code: 'PATH_PARSE_ERROR',
                  message: `Invalid coordinates for LineTo command at position ${i}`,
                },
              }
            }

            commands.push({
              type: PathCommandType.LineTo,
              points: [currentPosition, { x, y }],
            })
            currentPosition = { x, y }
            i += 3
            break
          }

          case PathCommandType.HorizontalLineTo: {
            const x = parseFloat(tokens[i + 1])
            if (isNaN(x)) {
              return {
                success: false,
                error: {
                  code: 'PATH_PARSE_ERROR',
                  message: `Invalid x coordinate for HorizontalLineTo command at position ${i}`,
                },
              }
            }

            commands.push({
              type: PathCommandType.HorizontalLineTo,
              points: [currentPosition, { x, y: currentPosition.y }],
            })
            currentPosition = { x, y: currentPosition.y }
            i += 2
            break
          }

          case PathCommandType.VerticalLineTo: {
            const y = parseFloat(tokens[i + 1])
            if (isNaN(y)) {
              return {
                success: false,
                error: {
                  code: 'PATH_PARSE_ERROR',
                  message: `Invalid y coordinate for VerticalLineTo command at position ${i}`,
                },
              }
            }

            commands.push({
              type: PathCommandType.VerticalLineTo,
              points: [currentPosition, { x: currentPosition.x, y }],
            })
            currentPosition = { x: currentPosition.x, y }
            i += 2
            break
          }

          case PathCommandType.CubicBezierCurveTo: {
            const x1 = parseFloat(tokens[i + 1])
            const y1 = parseFloat(tokens[i + 2])
            const x2 = parseFloat(tokens[i + 3])
            const y2 = parseFloat(tokens[i + 4])
            const x = parseFloat(tokens[i + 5])
            const y = parseFloat(tokens[i + 6])

            if (
              isNaN(x1) ||
              isNaN(y1) ||
              isNaN(x2) ||
              isNaN(y2) ||
              isNaN(x) ||
              isNaN(y)
            ) {
              return {
                success: false,
                error: {
                  code: 'PATH_PARSE_ERROR',
                  message: `Invalid coordinates for CubicBezierCurveTo command at position ${i}`,
                },
              }
            }

            commands.push({
              type: PathCommandType.CubicBezierCurveTo,
              points: [
                currentPosition,
                { x: x1, y: y1 },
                { x: x2, y: y2 },
                { x, y },
              ],
            })
            currentPosition = { x, y }
            i += 7
            break
          }

          case PathCommandType.ClosePath: {
            commands.push({
              type: PathCommandType.ClosePath,
              points: [currentPosition, startPosition],
            })
            currentPosition = startPosition
            i += 1
            break
          }

          default:
            return {
              success: false,
              error: {
                code: 'PATH_PARSE_ERROR',
                message: `Unknown path command: ${commandType} at position ${i}`,
              },
            }
        }
      }

      return { success: true, data: commands }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PATH_PARSE_ERROR',
          message: `Failed to parse path data: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Tessellate path commands into renderable geometry
   */
  tessellatePath(commands: PathCommand[]): Result<TessellatedGeometry> {
    try {
      const segments: PathSegment[] = []
      let currentPosition: Point2D = { x: 0, y: 0 }

      // Convert commands to segments
      for (const command of commands) {
        switch (command.type) {
          case PathCommandType.MoveTo:
            currentPosition = command.points[0]
            break

          case PathCommandType.LineTo:
            segments.push({
              start: currentPosition,
              end: command.points[1],
              command: PathCommandType.LineTo,
            })
            currentPosition = command.points[1]
            break

          case PathCommandType.HorizontalLineTo:
            const hEnd = { x: command.points[1].x, y: currentPosition.y }
            segments.push({
              start: currentPosition,
              end: hEnd,
              command: PathCommandType.HorizontalLineTo,
            })
            currentPosition = hEnd
            break

          case PathCommandType.VerticalLineTo:
            const vEnd = { x: currentPosition.x, y: command.points[1].y }
            segments.push({
              start: currentPosition,
              end: vEnd,
              command: PathCommandType.VerticalLineTo,
            })
            currentPosition = vEnd
            break

          case PathCommandType.CubicBezierCurveTo:
            segments.push({
              start: currentPosition,
              end: command.points[3],
              control1: command.points[1],
              control2: command.points[2],
              command: PathCommandType.CubicBezierCurveTo,
            })
            currentPosition = command.points[3]
            break

          case PathCommandType.ClosePath:
            // Close the path by connecting back to start
            if (segments.length > 0) {
              const firstSegment = segments.find(
                (s) =>
                  s.command === PathCommandType.MoveTo ||
                  (s.command === PathCommandType.LineTo &&
                    segments.indexOf(s) === 0)
              )
              if (firstSegment) {
                segments.push({
                  start: currentPosition,
                  end: firstSegment.start,
                  command: PathCommandType.ClosePath,
                })
              }
            }
            break
        }
      }

      // Calculate bounds from segment endpoints (not stroked geometry)
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      for (const segment of segments) {
        minX = Math.min(minX, segment.start.x, segment.end.x)
        minY = Math.min(minY, segment.start.y, segment.end.y)
        maxX = Math.max(maxX, segment.start.x, segment.end.x)
        maxY = Math.max(maxY, segment.start.y, segment.end.y)
      }

      // Tessellate segments into triangles
      const vertices: number[] = []
      const indices: number[] = []
      let vertexIndex = 0

      for (const segment of segments) {
        const segmentTriangles = this.tessellateSegment(segment)

        // Add vertices
        for (const vertex of segmentTriangles.vertices) {
          vertices.push(vertex.x, vertex.y, 1, 1, 1, 1) // position + color (white for now)
        }

        // Add indices with offset
        for (const index of segmentTriangles.indices) {
          indices.push(index + vertexIndex)
        }

        vertexIndex += segmentTriangles.vertices.length
      }

      return {
        success: true,
        data: {
          vertices: new Float32Array(vertices),
          indices: new Uint16Array(indices),
          vertexCount: vertices.length / 6, // 6 components per vertex
          triangleCount: indices.length / 3,
          bounds: { minX, minY, maxX, maxY },
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PATH_TESSELLATION_ERROR',
          message: `Failed to tessellate path: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Tessellate a single segment into triangles
   */
  private tessellateSegment(segment: PathSegment): {
    vertices: Point2D[]
    indices: number[]
  } {
    const vertices: Point2D[] = []
    const indices: number[] = []

    switch (segment.command) {
      case PathCommandType.LineTo:
      case PathCommandType.HorizontalLineTo:
      case PathCommandType.VerticalLineTo:
        // Create a thin quad along the line
        const direction = {
          x: segment.end.x - segment.start.x,
          y: segment.end.y - segment.start.y,
        }
        const length = Math.sqrt(
          direction.x * direction.x + direction.y * direction.y
        )

        if (length === 0) return { vertices: [], indices: [] }

        // Perpendicular vector
        const perpendicular = {
          x: -direction.y / length,
          y: direction.x / length,
        }

        // Create quad vertices (stroke width = 1 for now)
        const strokeWidth = 1
        vertices.push(
          {
            x: segment.start.x + perpendicular.x * strokeWidth,
            y: segment.start.y + perpendicular.y * strokeWidth,
          },
          {
            x: segment.start.x - perpendicular.x * strokeWidth,
            y: segment.start.y - perpendicular.y * strokeWidth,
          },
          {
            x: segment.end.x - perpendicular.x * strokeWidth,
            y: segment.end.y - perpendicular.y * strokeWidth,
          },
          {
            x: segment.end.x + perpendicular.x * strokeWidth,
            y: segment.end.y + perpendicular.y * strokeWidth,
          }
        )

        // Create two triangles
        indices.push(0, 1, 2, 0, 2, 3)
        break

      case PathCommandType.CubicBezierCurveTo:
        // Tessellate cubic bezier curve
        if (!segment.control1 || !segment.control2) break

        const steps = 20
        const curveVertices: Point2D[] = []

        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const point = this.evaluateCubicBezier(
            segment.start,
            segment.control1,
            segment.control2,
            segment.end,
            t
          )
          curveVertices.push(point)
        }

        // Create stroke along the curve
        for (let i = 0; i < curveVertices.length - 1; i++) {
          const start = curveVertices[i]
          const end = curveVertices[i + 1]

          const direction = {
            x: end.x - start.x,
            y: end.y - start.y,
          }
          const length = Math.sqrt(
            direction.x * direction.x + direction.y * direction.y
          )

          if (length === 0) continue

          const perpendicular = {
            x: -direction.y / length,
            y: direction.x / length,
          }

          const strokeWidth = 1
          vertices.push(
            {
              x: start.x + perpendicular.x * strokeWidth,
              y: start.y + perpendicular.y * strokeWidth,
            },
            {
              x: start.x - perpendicular.x * strokeWidth,
              y: start.y - perpendicular.y * strokeWidth,
            },
            {
              x: end.x - perpendicular.x * strokeWidth,
              y: end.y - perpendicular.y * strokeWidth,
            },
            {
              x: end.x + perpendicular.x * strokeWidth,
              y: end.y + perpendicular.y * strokeWidth,
            }
          )

          const baseIndex = vertices.length - 4
          indices.push(
            baseIndex,
            baseIndex + 1,
            baseIndex + 2,
            baseIndex,
            baseIndex + 2,
            baseIndex + 3
          )
        }
        break

      case PathCommandType.ClosePath:
        // Handle path closing (simplified)
        break
    }

    return { vertices, indices }
  }

  /**
   * Evaluate cubic Bezier curve at parameter t
   */
  private evaluateCubicBezier(
    start: Point2D,
    control1: Point2D,
    control2: Point2D,
    end: Point2D,
    t: number
  ): Point2D {
    const u = 1 - t
    const u2 = u * u
    const u3 = u2 * u
    const t2 = t * t
    const t3 = t2 * t

    return {
      x:
        u3 * start.x +
        3 * u2 * t * control1.x +
        3 * u * t2 * control2.x +
        t3 * end.x,
      y:
        u3 * start.y +
        3 * u2 * t * control1.y +
        3 * u * t2 * control2.y +
        t3 * end.y,
    }
  }

  /**
   * Render path with given properties
   */
  renderPath(
    properties: PathProperties,
    renderPass: GPURenderPassEncoder
  ): Result<boolean> {
    try {
      if (!this.renderPipeline) {
        return {
          success: false,
          error: {
            code: 'PATH_RENDERER_NOT_INITIALIZED',
            message: 'Path renderer not properly initialized',
          },
        }
      }

      // Parse path data
      const parseResult = this.parsePathData(properties.pathData)
      if (!parseResult.success) {
        return parseResult
      }

      // Tessellate path
      const tessellationResult = this.tessellatePath(parseResult.data)
      if (!tessellationResult.success) {
        return tessellationResult
      }

      const geometry = tessellationResult.data

      // Create vertex buffer
      const vertexBuffer = this.webgpuContext.createBuffer(
        GPUBufferUsage.VERTEX,
        geometry.vertices,
        'Path Vertices'
      )

      if (!vertexBuffer) {
        return {
          success: false,
          error: {
            code: 'PATH_VERTEX_BUFFER_ERROR',
            message: 'Failed to create path vertex buffer',
          },
        }
      }

      // Create index buffer
      const indexBuffer = this.webgpuContext.createBuffer(
        GPUBufferUsage.INDEX,
        geometry.indices,
        'Path Indices'
      )

      if (!indexBuffer) {
        return {
          success: false,
          error: {
            code: 'PATH_INDEX_BUFFER_ERROR',
            message: 'Failed to create path index buffer',
          },
        }
      }

      // Create uniform buffer
      const uniforms = new Float32Array([
        // Transform matrix (identity for now)
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
        0,
        properties.position.x,
        properties.position.y,
        0,
        1,
        // Fill color
        properties.fillColor.r / 255,
        properties.fillColor.g / 255,
        properties.fillColor.b / 255,
        properties.fillColor.a || 1,
        // Stroke color
        properties.strokeColor.r / 255,
        properties.strokeColor.g / 255,
        properties.strokeColor.b / 255,
        properties.strokeColor.a || 1,
        // Stroke width
        properties.strokeWidth,
        // Fill rule (0 = nonzero, 1 = evenodd)
        properties.fillRule === 'evenodd' ? 1 : 0,
      ])

      const uniformBuffer = this.webgpuContext.createBuffer(
        GPUBufferUsage.UNIFORM,
        uniforms,
        'Path Uniforms'
      )

      if (!uniformBuffer) {
        return {
          success: false,
          error: {
            code: 'PATH_UNIFORM_BUFFER_ERROR',
            message: 'Failed to create path uniform buffer',
          },
        }
      }

      // Create bind group
      const bindGroup = this.webgpuContext.createBindGroup(
        this.renderPipeline.getBindGroupLayout(0),
        [
          {
            binding: 0,
            resource: {
              buffer: uniformBuffer,
            },
          },
        ]
      )

      if (!bindGroup) {
        return {
          success: false,
          error: {
            code: 'PATH_BIND_GROUP_ERROR',
            message: 'Failed to create path bind group',
          },
        }
      }

      // Render path
      renderPass.setPipeline(this.renderPipeline)
      renderPass.setVertexBuffer(0, vertexBuffer)
      renderPass.setIndexBuffer(indexBuffer, 'uint16')
      renderPass.setBindGroup(0, bindGroup)
      renderPass.drawIndexed(geometry.indices.length, 1, 0, 0, 0)

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PATH_RENDER_ERROR',
          message: `Failed to render path: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Create path vertex shader
   */
  private createPathVertexShader(): string {
    return `
    struct VertexInput {
      @location(0) position: vec2<f32>,
      @location(1) color: vec4<f32>,
    }

    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) color: vec4<f32>,
    }

    struct Uniforms {
      transform: mat4x4<f32>,
      fillColor: vec4<f32>,
      strokeColor: vec4<f32>,
      strokeWidth: f32,
      fillRule: f32,
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @vertex
    fn main(input: VertexInput) -> VertexOutput {
      var output: VertexOutput;

      // Apply transform
      output.position = uniforms.transform * vec4<f32>(input.position, 0.0, 1.0);

      // Use input color (white for now)
      output.color = input.color;

      return output;
    }
    `
  }

  /**
   * Create path fragment shader
   */
  private createPathFragmentShader(): string {
    return `
    struct FragmentInput {
      @location(0) color: vec4<f32>,
    }

    struct Uniforms {
      transform: mat4x4<f32>,
      fillColor: vec4<f32>,
      strokeColor: vec4<f32>,
      strokeWidth: f32,
      fillRule: f32,
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @fragment
    fn main(input: FragmentInput) -> @location(0) vec4<f32> {
      // Simple fragment shader - in production, implement proper fill rules
      return input.color;
    }
    `
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.vertexBuffer) {
      // WebGPU resources are automatically cleaned up
      this.vertexBuffer = null
    }
    if (this.indexBuffer) {
      this.indexBuffer = null
    }
    this.renderPipeline = null
  }
}
