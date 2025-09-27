/**
 * @fileoverview Image and Media Rendering System
 * @author @darianrosebrook
 */

import { Result, Point2D, Size2D } from '@/types'
import { WebGPUContext } from './webgpu-context'

/**
 * Image properties for rendering
 */
export interface ImageProperties {
  source: string | ImageData | HTMLImageElement
  position: Point2D
  size?: Size2D
  opacity: number
  blendMode: BlendMode
  flipX: boolean
  flipY: boolean
  rotation: number
  scale: Point2D
}

/**
 * Blend modes for image compositing
 */
export enum BlendMode {
  Normal = 'normal',
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',
  Darken = 'darken',
  Lighten = 'lighten',
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn',
  HardLight = 'hard-light',
  SoftLight = 'soft-light',
  Difference = 'difference',
  Exclusion = 'exclusion',
  Hue = 'hue',
  Saturation = 'saturation',
  Color = 'color',
  Luminosity = 'luminosity',
}

/**
 * Media node properties
 */
export interface MediaProperties {
  source: string
  position: Point2D
  size: Size2D
  opacity: number
  blendMode: BlendMode
  volume: number
  playbackRate: number
  loop: boolean
}

/**
 * Texture atlas for efficient image management
 */
export class TextureAtlas {
  private texture: GPUTexture | null = null
  private textureSize = 2048
  private currentX = 0
  private currentY = 0
  private lineHeight = 0
  private textures: Map<string, TextureInfo> = new Map()

  constructor(private device: GPUDevice) {}

  /**
   * Initialize texture atlas
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      this.texture = this.device.createTexture({
        size: [this.textureSize, this.textureSize],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      })

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TEXTURE_ATLAS_INIT_ERROR',
          message: `Failed to initialize texture atlas: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Load image into atlas
   */
  async loadImage(
    imageSource: string | ImageData | HTMLImageElement
  ): Promise<Result<TextureInfo>> {
    try {
      let image: HTMLImageElement | ImageData

      if (typeof imageSource === 'string') {
        // Load from URL
        image = await this.loadImageFromUrl(imageSource)
      } else if (imageSource instanceof ImageData) {
        image = imageSource
      } else {
        image = imageSource
      }

      const textureInfo = this.allocateTextureSpace(image.width, image.height)

      // Copy image data to texture
      this.device.queue.copyExternalImageToTexture(
        { source: image },
        {
          texture: this.texture!,
          origin: { x: textureInfo.x, y: textureInfo.y },
        },
        { width: image.width, height: image.height }
      )

      this.textures.set(textureInfo.id, textureInfo)
      return { success: true, data: textureInfo }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'IMAGE_LOAD_ERROR',
          message: `Failed to load image: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Load image from URL
   */
  private async loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  /**
   * Allocate space in texture atlas
   */
  private allocateTextureSpace(width: number, height: number): TextureInfo {
    // Simple allocation - in production, use a proper packing algorithm
    const textureInfo: TextureInfo = {
      id: `texture_${Date.now()}_${Math.random()}`,
      x: this.currentX,
      y: this.currentY,
      width,
      height,
      u1: this.currentX / this.textureSize,
      v1: this.currentY / this.textureSize,
      u2: (this.currentX + width) / this.textureSize,
      v2: (this.currentY + height) / this.textureSize,
    }

    // Move to next position
    this.currentX += width + 4 // 4px padding
    if (this.currentX + width > this.textureSize) {
      this.currentX = 0
      this.currentY += this.lineHeight + 4
      this.lineHeight = height
    }

    if (this.currentY + height > this.textureSize) {
      throw new Error('Texture atlas full')
    }

    return textureInfo
  }

  /**
   * Get texture atlas
   */
  getTexture(): GPUTexture | null {
    return this.texture
  }

  /**
   * Get texture info by ID
   */
  getTextureInfo(id: string): TextureInfo | null {
    return this.textures.get(id) || null
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.texture) {
      // WebGPU textures are automatically cleaned up
      this.texture = null
    }
    this.textures.clear()
  }
}

/**
 * Texture information
 */
export interface TextureInfo {
  id: string
  x: number
  y: number
  width: number
  height: number
  u1: number
  v1: number
  u2: number
  v2: number
}

/**
 * Image renderer with texture support and blending
 */
export class ImageRenderer {
  private webgpuContext: WebGPUContext
  private textureAtlas: TextureAtlas | null = null
  private renderPipeline: GPURenderPipeline | null = null
  private sampler: GPUSampler | null = null

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  /**
   * Initialize image renderer
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for image renderer',
          },
        }
      }

      // Create texture atlas
      this.textureAtlas = new TextureAtlas(device)
      const atlasResult = await this.textureAtlas.initialize()
      if (!atlasResult.success) {
        return atlasResult
      }

      // Create sampler
      this.sampler = device.createSampler({
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        magFilter: 'linear',
        minFilter: 'linear',
      })

      // Create render pipeline
      const vertexShader = this.createImageVertexShader()
      const fragmentShader = this.createImageFragmentShader()

      const bindGroupLayout = device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {
              sampleType: 'float',
              viewDimension: '2d',
              multisampled: false,
            },
          },
          {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: { type: 'filtering' },
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
              arrayStride: 4 * 8, // position + texCoord
              attributes: [
                {
                  shaderLocation: 0,
                  offset: 0,
                  format: 'float32x2',
                },
                {
                  shaderLocation: 1,
                  offset: 8,
                  format: 'float32x2',
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

      console.log('✅ Image renderer initialized successfully')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'IMAGE_RENDERER_INIT_ERROR',
          message: `Failed to initialize image renderer: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Render image with given properties
   */
  async renderImage(
    properties: ImageProperties,
    renderPass: GPURenderPassEncoder
  ): Promise<Result<boolean>> {
    try {
      if (!this.textureAtlas || !this.renderPipeline) {
        return {
          success: false,
          error: {
            code: 'IMAGE_RENDERER_NOT_INITIALIZED',
            message: 'Image renderer not properly initialized',
          },
        }
      }

      // Load image into texture atlas if not already loaded
      let textureInfo: TextureInfo
      const textureId =
        typeof properties.source === 'string'
          ? properties.source
          : `image_${Date.now()}`

      const existingTexture = this.textureAtlas.getTextureInfo(textureId)
      if (existingTexture) {
        textureInfo = existingTexture
      } else {
        const loadResult = await this.textureAtlas.loadImage(properties.source)
        if (!loadResult.success) {
          return loadResult
        }
        textureInfo = loadResult.data
      }

      // Calculate transformed vertices
      const width = properties.size?.width || textureInfo.width
      const height = properties.size?.height || textureInfo.height

      // Apply transformations
      const transformMatrix = this.calculateTransformMatrix(
        properties,
        width,
        height
      )

      // Create vertex buffer
      const vertices = this.createImageVertices(
        textureInfo,
        properties,
        width,
        height
      )
      const vertexBuffer = this.webgpuContext.createBuffer(
        GPUBufferUsage.VERTEX,
        vertices,
        'Image Vertices'
      )

      if (!vertexBuffer) {
        return {
          success: false,
          error: {
            code: 'IMAGE_VERTEX_BUFFER_ERROR',
            message: 'Failed to create image vertex buffer',
          },
        }
      }

      // Create uniform buffer
      const uniforms = new Float32Array([
        // Transform matrix
        ...transformMatrix,
        // Blend mode
        this.getBlendModeValue(properties.blendMode),
        // Opacity
        properties.opacity,
        // Texture coordinates
        textureInfo.u1,
        textureInfo.v1,
        textureInfo.u2,
        textureInfo.v2,
      ])

      const uniformBuffer = this.webgpuContext.createBuffer(
        GPUBufferUsage.UNIFORM,
        uniforms,
        'Image Uniforms'
      )

      if (!uniformBuffer) {
        return {
          success: false,
          error: {
            code: 'IMAGE_UNIFORM_BUFFER_ERROR',
            message: 'Failed to create image uniform buffer',
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
          {
            binding: 1,
            resource: this.textureAtlas.getTexture()!.createView(),
          },
          {
            binding: 2,
            resource: this.sampler!,
          },
        ]
      )

      if (!bindGroup) {
        return {
          success: false,
          error: {
            code: 'IMAGE_BIND_GROUP_ERROR',
            message: 'Failed to create image bind group',
          },
        }
      }

      // Render image
      renderPass.setPipeline(this.renderPipeline)
      renderPass.setVertexBuffer(0, vertexBuffer)
      renderPass.setBindGroup(0, bindGroup)
      renderPass.draw(6, 1, 0, 0) // 2 triangles

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'IMAGE_RENDER_ERROR',
          message: `Failed to render image: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Calculate transform matrix for image
   */
  private calculateTransformMatrix(
    properties: ImageProperties,
    _width: number,
    _height: number
  ): Float32Array {
    // Simple transformation matrix - in production, use the TransformUtils
    const matrix = new Float32Array(16)
    matrix.fill(0)

    // Scale
    const scaleX = properties.scale.x * (properties.flipX ? -1 : 1)
    const scaleY = properties.scale.y * (properties.flipY ? -1 : 1)

    matrix[0] = scaleX // m00
    matrix[5] = scaleY // m11
    matrix[10] = 1 // m22
    matrix[15] = 1 // m33

    // Translation
    matrix[12] = properties.position.x // tx
    matrix[13] = properties.position.y // ty

    // Rotation (simplified)
    if (properties.rotation !== 0) {
      const cos = Math.cos(properties.rotation)
      const sin = Math.sin(properties.rotation)

      const tempM00 = matrix[0] * cos - matrix[1] * sin
      const tempM01 = matrix[0] * sin + matrix[1] * cos
      const tempM10 = matrix[4] * cos - matrix[5] * sin
      const tempM11 = matrix[4] * sin + matrix[5] * cos

      matrix[0] = tempM00
      matrix[1] = tempM01
      matrix[4] = tempM10
      matrix[5] = tempM11
    }

    return matrix
  }

  /**
   * Create vertex data for image quad
   */
  private createImageVertices(
    textureInfo: TextureInfo,
    _properties: ImageProperties,
    width: number,
    height: number
  ): Float32Array {
    const vertices = new Float32Array(6 * 4) // 6 vertices * 4 floats each

    // Triangle 1
    // Bottom-left
    vertices[0] = 0
    vertices[1] = height
    vertices[2] = textureInfo.u1
    vertices[3] = textureInfo.v2

    // Bottom-right
    vertices[4] = width
    vertices[5] = height
    vertices[6] = textureInfo.u2
    vertices[7] = textureInfo.v2

    // Top-left
    vertices[8] = 0
    vertices[9] = 0
    vertices[10] = textureInfo.u1
    vertices[11] = textureInfo.v1

    // Triangle 2
    // Top-left
    vertices[12] = 0
    vertices[13] = 0
    vertices[14] = textureInfo.u1
    vertices[15] = textureInfo.v1

    // Bottom-right
    vertices[16] = width
    vertices[17] = height
    vertices[18] = textureInfo.u2
    vertices[19] = textureInfo.v2

    // Top-right
    vertices[20] = width
    vertices[21] = 0
    vertices[22] = textureInfo.u2
    vertices[23] = textureInfo.v1

    return vertices
  }

  /**
   * Get blend mode value for shader
   */
  private getBlendModeValue(blendMode: BlendMode): number {
    const blendModes = Object.values(BlendMode)
    return blendModes.indexOf(blendMode)
  }

  /**
   * Create image vertex shader
   */
  private createImageVertexShader(): string {
    return `
    struct VertexInput {
      @location(0) position: vec2<f32>,
      @location(1) texCoord: vec2<f32>,
    }

    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) texCoord: vec2<f32>,
    }

    struct Uniforms {
      transform: mat4x4<f32>,
      blendMode: f32,
      opacity: f32,
      textureU1: f32,
      textureV1: f32,
      textureU2: f32,
      textureV2: f32,
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @vertex
    fn main(input: VertexInput) -> VertexOutput {
      var output: VertexOutput;

      // Apply transform
      output.position = uniforms.transform * vec4<f32>(input.position, 0.0, 1.0);

      // Pass through texture coordinates
      output.texCoord = input.texCoord;

      return output;
    }
    `
  }

  /**
   * Create image fragment shader with blending
   */
  private createImageFragmentShader(): string {
    return `
    struct FragmentInput {
      @location(0) texCoord: vec2<f32>,
    }

    struct Uniforms {
      transform: mat4x4<f32>,
      blendMode: f32,
      opacity: f32,
      textureU1: f32,
      textureV1: f32,
      textureU2: f32,
      textureV2: f32,
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    @group(0) @binding(1) var imageTexture: texture_2d<f32>;
    @group(0) @binding(2) var imageSampler: sampler;

    @fragment
    fn main(input: FragmentInput) -> @location(0) vec4<f32> {
      // Sample texture
      let texColor = textureSample(imageTexture, imageSampler, input.texCoord);

      // Apply opacity
      let finalColor = vec4<f32>(texColor.rgb, texColor.a * uniforms.opacity);

      // Apply blend mode (simplified - full implementation would be more complex)
      let blendMode = i32(uniforms.blendMode);

      if (blendMode == 1) { // Multiply
        return vec4<f32>(finalColor.rgb * finalColor.rgb, finalColor.a);
      } else if (blendMode == 2) { // Screen
        return vec4<f32>(1.0 - (1.0 - finalColor.rgb) * (1.0 - finalColor.rgb), finalColor.a);
      }

      // Default: Normal blend
      return finalColor;
    }
    `
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.textureAtlas) {
      this.textureAtlas.destroy()
      this.textureAtlas = null
    }
    this.renderPipeline = null
    this.sampler = null
  }
}
