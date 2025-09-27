/**
 * @fileoverview Text Rendering System with SDF and Font Management
 * @author @darianrosebrook
 */

import { Result, AnimatorError, Point2D, Size2D, Color } from '@/types'
import { WebGPUContext } from './webgpu-context'

/**
 * Font metrics interface
 */
export interface FontMetrics {
  ascender: number
  descender: number
  lineHeight: number
  capHeight: number
  xHeight: number
  unitsPerEm: number
}

/**
 * Glyph information interface
 */
export interface GlyphInfo {
  codepoint: number
  advance: number
  bearingX: number
  bearingY: number
  width: number
  height: number
  textureX: number
  textureY: number
  textureWidth: number
  textureHeight: number
}

/**
 * Text layout information
 */
export interface TextLayout {
  width: number
  height: number
  lines: TextLine[]
  glyphs: GlyphInstance[]
}

/**
 * Text line information
 */
export interface TextLine {
  startIndex: number
  endIndex: number
  width: number
  height: number
  baseline: number
  glyphs: GlyphInstance[]
}

/**
 * Glyph instance for rendering
 */
export interface GlyphInstance {
  codepoint: number
  position: Point2D
  size: Size2D
  color: Color
  textureCoords: { u1: number; v1: number; u2: number; v2: number }
}

/**
 * Text rendering properties
 */
export interface TextProperties {
  fontFamily: string
  fontSize: number
  fontWeight: number
  fontStyle: 'normal' | 'italic'
  color: Color
  position: Point2D
  maxWidth?: number
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
  wordSpacing: number
}

/**
 * Font atlas for efficient texture management
 */
export class FontAtlas {
  private texture: GPUTexture | null = null
  private textureSize: number = 1024
  private currentX = 0
  private currentY = 0
  private lineHeight = 0
  private glyphs: Map<number, GlyphInfo> = new Map()

  constructor(
    private device: GPUDevice,
    private fontData: ArrayBuffer
  ) {}

  /**
   * Initialize font atlas with basic glyphs
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      // Create font atlas texture
      this.texture = this.device.createTexture({
        size: [this.textureSize, this.textureSize],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      })

      // For now, we'll use a simple bitmap font approach
      // In a full implementation, we'd parse TTF/OTF fonts
      await this.generateBasicGlyphs()

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FONT_ATLAS_INIT_ERROR',
          message: `Failed to initialize font atlas: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Generate basic glyph data for a simple bitmap font
   */
  private async generateBasicGlyphs(): Promise<void> {
    // Simple bitmap font implementation for basic ASCII characters
    // In production, this would use a proper font parsing library like opentype.js
    const charWidth = 16
    const charHeight = 24
    this.lineHeight = charHeight

    // Generate glyphs for basic ASCII characters (32-126)
    for (let i = 32; i < 127; i++) {
      const glyph: GlyphInfo = {
        codepoint: i,
        advance: charWidth,
        bearingX: 0,
        bearingY: charHeight - 4, // Approximate baseline
        width: charWidth,
        height: charHeight,
        textureX: (i - 32) * charWidth,
        textureY: 0,
        textureWidth: charWidth,
        textureHeight: charHeight,
      }

      this.glyphs.set(i, glyph)
    }

    // Generate a simple bitmap font texture
    await this.generateFontTexture()
  }

  /**
   * Generate a simple bitmap font texture
   */
  private async generateFontTexture(): Promise<void> {
    if (!this.device || !this.texture) return

    const charWidth = 16
    const charHeight = 24
    const charsPerRow = Math.floor(this.textureSize / charWidth)
    const rows = Math.ceil((127 - 32) / charsPerRow)

    // Create bitmap data for simple ASCII characters
    const bitmapData = new Uint8Array(this.textureSize * this.textureSize * 4)

    // Generate simple character bitmaps
    for (let i = 32; i < 127; i++) {
      const charIndex = i - 32
      const row = Math.floor(charIndex / charsPerRow)
      const col = charIndex % charsPerRow

      const x = col * charWidth
      const y = row * charHeight

      // Generate a simple character pattern (just for demonstration)
      this.drawCharacterBitmap(bitmapData, x, y, charWidth, charHeight, i)
    }

    // Upload bitmap to GPU texture
    this.device.queue.writeTexture(
      { texture: this.texture },
      bitmapData,
      { bytesPerRow: this.textureSize * 4, rowsPerImage: this.textureSize },
      { width: this.textureSize, height: this.textureSize }
    )
  }

  /**
   * Draw a simple character bitmap pattern
   */
  private drawCharacterBitmap(
    bitmap: Uint8Array,
    x: number,
    y: number,
    width: number,
    height: number,
    charCode: number
  ): void {
    // Simple character rendering - just draw some pixels for visibility
    // In production, this would render actual character shapes

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const bitmapIndex = ((y + py) * this.textureSize + (x + px)) * 4

        // Draw a simple pattern based on character code
        const pattern = (charCode * 7 + px * 3 + py * 5) % 3 === 0

        if (pattern) {
          bitmap[bitmapIndex] = 255 // R
          bitmap[bitmapIndex + 1] = 255 // G
          bitmap[bitmapIndex + 2] = 255 // B
          bitmap[bitmapIndex + 3] = 255 // A
        } else {
          bitmap[bitmapIndex] = 0 // R
          bitmap[bitmapIndex + 1] = 0 // G
          bitmap[bitmapIndex + 2] = 0 // B
          bitmap[bitmapIndex + 3] = 0 // A
        }
      }
    }
  }

  /**
   * Get glyph information for a codepoint
   */
  getGlyph(codepoint: number): GlyphInfo | null {
    return this.glyphs.get(codepoint) || null
  }

  /**
   * Get font atlas texture
   */
  getTexture(): GPUTexture | null {
    return this.texture
  }

  /**
   * Get texture size
   */
  getTextureSize(): number {
    return this.textureSize
  }

  /**
   * Get line height
   */
  getLineHeight(): number {
    return this.lineHeight
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.texture) {
      // WebGPU textures are automatically cleaned up when references are dropped
      this.texture = null
    }
    this.glyphs.clear()
  }
}

/**
 * Text layout engine
 */
export class TextLayoutEngine {
  private fontAtlas: FontAtlas
  private lineHeight: number

  constructor(fontAtlas: FontAtlas) {
    this.fontAtlas = fontAtlas
    this.lineHeight = fontAtlas.getLineHeight()
  }

  /**
   * Layout text with word wrapping and alignment
   */
  layoutText(text: string, properties: TextProperties): Result<TextLayout> {
    try {
      const lines: TextLine[] = []
      const glyphs: GlyphInstance[] = []

      // Split text into lines
      const words = text.split(/(\s+)/)
      let currentLine: string[] = []
      let currentLineWidth = 0
      let currentY = 0

      for (const word of words) {
        const wordWidth = this.measureTextWidth(word, properties)

        if (
          properties.maxWidth &&
          currentLine.length > 0 &&
          currentLineWidth + wordWidth > properties.maxWidth
        ) {
          // Start new line
          const line = this.createTextLine(
            currentLine,
            currentLineWidth,
            properties,
            currentY
          )
          lines.push(line)
          glyphs.push(...line.glyphs)

          currentLine = [word]
          currentLineWidth = wordWidth
          currentY += this.lineHeight * properties.lineHeight
        } else {
          currentLine.push(word)
          currentLineWidth += wordWidth
        }
      }

      // Add final line
      if (currentLine.length > 0) {
        const line = this.createTextLine(
          currentLine,
          currentLineWidth,
          properties,
          currentY
        )
        lines.push(line)
        glyphs.push(...line.glyphs)
      }

      const totalHeight = currentY + this.lineHeight * properties.lineHeight

      return {
        success: true,
        data: {
          width: Math.max(...lines.map((l) => l.width)),
          height: totalHeight,
          lines,
          glyphs,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TEXT_LAYOUT_ERROR',
          message: `Failed to layout text: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Measure text width
   */
  private measureTextWidth(text: string, properties: TextProperties): number {
    let width = 0

    for (let i = 0; i < text.length; i++) {
      const codepoint = text.charCodeAt(i)
      const glyph = this.fontAtlas.getGlyph(codepoint)

      if (glyph) {
        width += glyph.advance + properties.letterSpacing
      }
    }

    // Remove extra letter spacing at the end
    if (text.length > 1) {
      width -= properties.letterSpacing
    }

    return width
  }

  /**
   * Create a text line with positioned glyphs
   */
  private createTextLine(
    words: string[],
    lineWidth: number,
    properties: TextProperties,
    y: number
  ): TextLine {
    const lineText = words.join('')
    const glyphs: GlyphInstance[] = []
    let x = 0

    // Apply text alignment
    if (properties.textAlign === 'center') {
      x = (properties.maxWidth || lineWidth) / 2 - lineWidth / 2
    } else if (properties.textAlign === 'right') {
      x = (properties.maxWidth || lineWidth) - lineWidth
    }

    // Position each character
    for (let i = 0; i < lineText.length; i++) {
      const codepoint = lineText.charCodeAt(i)
      const glyph = this.fontAtlas.getGlyph(codepoint)

      if (glyph) {
        const glyphInstance: GlyphInstance = {
          codepoint,
          position: {
            x: x + properties.position.x,
            y: y + properties.position.y + glyph.bearingY,
          },
          size: { width: glyph.width, height: glyph.height },
          color: properties.color,
          textureCoords: {
            u1: glyph.textureX / this.fontAtlas.getTextureSize(),
            v1: glyph.textureY / this.fontAtlas.getTextureSize(),
            u2:
              (glyph.textureX + glyph.textureWidth) /
              this.fontAtlas.getTextureSize(),
            v2:
              (glyph.textureY + glyph.textureHeight) /
              this.fontAtlas.getTextureSize(),
          },
        }

        glyphs.push(glyphInstance)
        x += glyph.advance + properties.letterSpacing
      }
    }

    return {
      startIndex: 0, // Simplified for now
      endIndex: lineText.length,
      width: lineWidth,
      height: this.lineHeight,
      baseline: y + this.lineHeight,
      glyphs,
    }
  }
}

/**
 * Text renderer with SDF support
 */
export class TextRenderer {
  private webgpuContext: WebGPUContext
  private fontAtlas: FontAtlas | null = null
  private layoutEngine: TextLayoutEngine | null = null
  private renderPipeline: GPURenderPipeline | null = null
  private bindGroupLayout: GPUBindGroupLayout | null = null
  private sampler: GPUSampler | null = null

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  /**
   * Initialize text renderer with font data
   */
  async initialize(fontData: ArrayBuffer): Promise<Result<boolean>> {
    try {
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for text renderer',
          },
        }
      }

      // Create font atlas
      this.fontAtlas = new FontAtlas(device, fontData)
      const atlasResult = await this.fontAtlas.initialize()
      if (!atlasResult.success) {
        return atlasResult
      }

      // Create layout engine
      this.layoutEngine = new TextLayoutEngine(this.fontAtlas)

      // Create sampler for texture sampling
      this.sampler = device.createSampler({
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        magFilter: 'linear',
        minFilter: 'linear',
      })

      // Create bind group layout
      this.bindGroupLayout = device.createBindGroupLayout({
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

      // Create render pipeline
      const vertexShader = this.createTextVertexShader()
      const fragmentShader = this.createTextFragmentShader()

      const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      })

      this.renderPipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: device.createShaderModule({ code: vertexShader }),
          entryPoint: 'main',
          buffers: [
            {
              arrayStride: 4 * 10, // position + texCoord + color
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
                {
                  shaderLocation: 2,
                  offset: 16,
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

      console.log('✅ Text renderer initialized successfully')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TEXT_RENDERER_INIT_ERROR',
          message: `Failed to initialize text renderer: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Render text with given properties
   */
  renderText(
    text: string,
    properties: TextProperties,
    renderPass: GPURenderPassEncoder
  ): Result<boolean> {
    try {
      if (!this.fontAtlas || !this.layoutEngine || !this.renderPipeline) {
        return {
          success: false,
          error: {
            code: 'TEXT_RENDERER_NOT_INITIALIZED',
            message: 'Text renderer not properly initialized',
          },
        }
      }

      // Layout text
      const layoutResult = this.layoutEngine.layoutText(text, properties)
      if (!layoutResult.success) {
        return layoutResult
      }

      const layout = layoutResult.data

      // Create vertex buffer for glyphs
      const vertices = this.createGlyphVertices(layout.glyphs)
      const vertexBuffer = this.webgpuContext.createBuffer(
        GPUBufferUsage.VERTEX,
        vertices,
        'Text Glyph Vertices'
      )

      if (!vertexBuffer) {
        return {
          success: false,
          error: {
            code: 'TEXT_VERTEX_BUFFER_ERROR',
            message: 'Failed to create text vertex buffer',
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
        0,
        0,
        0,
        1,
        // Font size and other parameters
        properties.fontSize,
        properties.lineHeight,
        properties.letterSpacing,
        properties.wordSpacing,
      ])

      const uniformBuffer = this.webgpuContext.createBuffer(
        GPUBufferUsage.UNIFORM,
        uniforms,
        'Text Uniforms'
      )

      if (!uniformBuffer) {
        return {
          success: false,
          error: {
            code: 'TEXT_UNIFORM_BUFFER_ERROR',
            message: 'Failed to create text uniform buffer',
          },
        }
      }

      // Create bind group
      const bindGroup = this.webgpuContext.createBindGroup(
        this.bindGroupLayout!,
        [
          {
            binding: 0,
            resource: {
              buffer: uniformBuffer,
            },
          },
          {
            binding: 1,
            resource: this.fontAtlas.getTexture()!.createView(),
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
            code: 'TEXT_BIND_GROUP_ERROR',
            message: 'Failed to create text bind group',
          },
        }
      }

      // Set pipeline and resources
      renderPass.setPipeline(this.renderPipeline)
      renderPass.setVertexBuffer(0, vertexBuffer)
      renderPass.setBindGroup(0, bindGroup)

      // Draw all glyphs
      const vertexCount = layout.glyphs.length * 6 // 2 triangles per glyph
      renderPass.draw(vertexCount, 1, 0, 0)

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TEXT_RENDER_ERROR',
          message: `Failed to render text: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Create vertex data for glyphs
   */
  private createGlyphVertices(glyphs: GlyphInstance[]): Float32Array {
    const vertices = new Float32Array(glyphs.length * 6 * 10) // 6 vertices * 10 floats per vertex

    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i]
      const baseIndex = i * 6 * 10

      // Triangle 1
      // Bottom-left
      vertices[baseIndex + 0] = glyph.position.x
      vertices[baseIndex + 1] = glyph.position.y
      vertices[baseIndex + 2] = glyph.textureCoords.u1
      vertices[baseIndex + 3] = glyph.textureCoords.v2
      vertices[baseIndex + 4] = glyph.color.r / 255
      vertices[baseIndex + 5] = glyph.color.g / 255
      vertices[baseIndex + 6] = glyph.color.b / 255
      vertices[baseIndex + 7] = glyph.color.a ?? 1
      const width = glyph.size?.width || 16
      const height = glyph.size?.height || 24

      vertices[baseIndex + 8] = width
      vertices[baseIndex + 9] = height

      // Bottom-right
      vertices[baseIndex + 10] = glyph.position.x + width
      vertices[baseIndex + 11] = glyph.position.y
      vertices[baseIndex + 12] = glyph.textureCoords.u2
      vertices[baseIndex + 13] = glyph.textureCoords.v2
      vertices[baseIndex + 14] = glyph.color.r / 255
      vertices[baseIndex + 15] = glyph.color.g / 255
      vertices[baseIndex + 16] = glyph.color.b / 255
      vertices[baseIndex + 17] = glyph.color.a ?? 1
      vertices[baseIndex + 18] = width
      vertices[baseIndex + 19] = height

      // Top-left
      vertices[baseIndex + 20] = glyph.position.x
      vertices[baseIndex + 21] = glyph.position.y + height
      vertices[baseIndex + 22] = glyph.textureCoords.u1
      vertices[baseIndex + 23] = glyph.textureCoords.v1
      vertices[baseIndex + 24] = glyph.color.r / 255
      vertices[baseIndex + 25] = glyph.color.g / 255
      vertices[baseIndex + 26] = glyph.color.b / 255
      vertices[baseIndex + 27] = glyph.color.a ?? 1
      vertices[baseIndex + 28] = width
      vertices[baseIndex + 29] = height

      // Triangle 2
      // Top-left
      vertices[baseIndex + 30] = glyph.position.x
      vertices[baseIndex + 31] = glyph.position.y + height
      vertices[baseIndex + 32] = glyph.textureCoords.u1
      vertices[baseIndex + 33] = glyph.textureCoords.v1
      vertices[baseIndex + 34] = glyph.color.r / 255
      vertices[baseIndex + 35] = glyph.color.g / 255
      vertices[baseIndex + 36] = glyph.color.b / 255
      vertices[baseIndex + 37] = glyph.color.a ?? 1
      vertices[baseIndex + 38] = width
      vertices[baseIndex + 39] = height

      // Bottom-right
      vertices[baseIndex + 40] = glyph.position.x + width
      vertices[baseIndex + 41] = glyph.position.y
      vertices[baseIndex + 42] = glyph.textureCoords.u2
      vertices[baseIndex + 43] = glyph.textureCoords.v2
      vertices[baseIndex + 44] = glyph.color.r / 255
      vertices[baseIndex + 45] = glyph.color.g / 255
      vertices[baseIndex + 46] = glyph.color.b / 255
      vertices[baseIndex + 47] = glyph.color.a ?? 1
      vertices[baseIndex + 48] = width
      vertices[baseIndex + 49] = height

      // Top-right
      vertices[baseIndex + 50] = glyph.position.x + width
      vertices[baseIndex + 51] = glyph.position.y + height
      vertices[baseIndex + 52] = glyph.textureCoords.u2
      vertices[baseIndex + 53] = glyph.textureCoords.v1
      vertices[baseIndex + 54] = glyph.color.r / 255
      vertices[baseIndex + 55] = glyph.color.g / 255
      vertices[baseIndex + 56] = glyph.color.b / 255
      vertices[baseIndex + 57] = glyph.color.a ?? 1
      vertices[baseIndex + 58] = width
      vertices[baseIndex + 59] = height
    }

    return vertices
  }

  /**
   * Create text vertex shader
   */
  private createTextVertexShader(): string {
    return `
    struct VertexInput {
      @location(0) position: vec2<f32>,
      @location(1) texCoord: vec2<f32>,
      @location(2) color: vec4<f32>,
      @location(3) size: vec2<f32>,
    }

    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) texCoord: vec2<f32>,
      @location(1) color: vec4<f32>,
    }

    struct Uniforms {
      transform: mat4x4<f32>,
      fontSize: f32,
      lineHeight: f32,
      letterSpacing: f32,
      wordSpacing: f32,
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @vertex
    fn main(input: VertexInput) -> VertexOutput {
      var output: VertexOutput;

      // Apply size scaling
      let scaledPosition = input.position * input.size;

      // Apply transform
      output.position = uniforms.transform * vec4<f32>(scaledPosition, 0.0, 1.0);

      // Pass through texture coordinates and color
      output.texCoord = input.texCoord;
      output.color = input.color;

      return output;
    }
    `
  }

  /**
   * Create text fragment shader with SDF support
   */
  private createTextFragmentShader(): string {
    return `
    struct FragmentInput {
      @location(0) texCoord: vec2<f32>,
      @location(1) color: vec4<f32>,
    }

    @group(0) @binding(1) var fontTexture: texture_2d<f32>;
    @group(0) @binding(2) var fontSampler: sampler;

    @fragment
    fn main(input: FragmentInput) -> @location(0) vec4<f32> {
      // Sample font texture (simplified SDF approach)
      let texColor = textureSample(fontTexture, fontSampler, input.texCoord);

      // Simple alpha test for now
      // In a full implementation, we'd use proper SDF distance field rendering
      let alpha = texColor.r; // Assuming grayscale SDF

      if (alpha < 0.5) {
        discard;
      }

      // Apply text color
      return vec4<f32>(input.color.rgb, input.color.a * alpha);
    }
    `
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.fontAtlas) {
      this.fontAtlas.destroy()
      this.fontAtlas = null
    }
    this.layoutEngine = null
    this.renderPipeline = null
    this.bindGroupLayout = null
    this.sampler = null
  }
}
