/**
 * @fileoverview Text Rendering Engine
 * @description GPU-accelerated text rendering with font management and layout
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { WebGPUContext } from '../../renderer/webgpu-context'
import {
  TextLayer,
  TextRenderData,
  FontDefinition,
  TextMeasurement,
  TextLayout,
  TextCharacter,
  FontMetrics,
  FontLibraryEntry,
  TextRenderContext,
  TextPerformanceMetrics,
  TextGradient,
  TextFill,
  TextFillType,
} from './text-types'

/**
 * Text rendering pipeline
 */
export interface TextRenderPipeline {
  vertexShader: string
  fragmentShader: string
  bindGroupLayout: GPUBindGroupLayout
  pipeline: GPURenderPipeline
}

/**
 * Font atlas for efficient glyph rendering
 */
export interface FontAtlas {
  texture: GPUTexture
  glyphs: Map<string, {
    x: number
    y: number
    width: number
    height: number
    advance: number
    bearingX: number
    bearingY: number
  }>
  size: { width: number; height: number }
}

/**
 * Text renderer implementation
 */
export class TextRenderer {
  private webgpuContext: WebGPUContext
  private device: GPUDevice | null = null

  // Font management
  private fontLibrary: Map<string, FontLibraryEntry> = new Map()
  private fontAtlases: Map<string, FontAtlas> = new Map()
  private glyphCache: Map<string, ImageBitmap> = new Map()

  // Rendering resources
  private textPipeline: TextRenderPipeline | null = null
  private vertexBuffer: GPUBuffer | null = null
  private indexBuffer: GPUBuffer | null = null
  private uniformBuffer: GPUBuffer | null = null

  // Performance tracking
  private metrics: TextPerformanceMetrics = {
    layoutTime: 0,
    renderingTime: 0,
    glyphCacheHits: 0,
    glyphCacheMisses: 0,
    memoryUsage: 0,
    characterCount: 0,
  }

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  /**
   * Initialize text rendering system
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      this.device = this.webgpuContext.getDevice()
      if (!this.device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for text rendering',
          },
        }
      }

      // Initialize font system
      await this.initializeFontSystem()

      // Create rendering pipeline
      await this.createTextPipeline()

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
   * Initialize font management system
   */
  private async initializeFontSystem(): Promise<void> {
    // Register system fonts
    await this.registerSystemFonts()

    // Create font atlases for common fonts
    await this.createFontAtlases()
  }

  /**
   * Register system fonts
   */
  private async registerSystemFonts(): Promise<void> {
    // Common system fonts that should be available
    const systemFonts = [
      { family: 'Arial', style: 'normal' as const, weight: '400' as const },
      { family: 'Helvetica', style: 'normal' as const, weight: '400' as const },
      { family: 'Times New Roman', style: 'normal' as const, weight: '400' as const },
      { family: 'Courier New', style: 'normal' as const, weight: '400' as const },
      { family: 'Georgia', style: 'normal' as const, weight: '400' as const },
      { family: 'Verdana', style: 'normal' as const, weight: '400' as const },
    ]

    for (const font of systemFonts) {
      this.fontLibrary.set(`${font.family}_${font.style}_${font.weight}`, {
        id: `${font.family}_${font.style}_${font.weight}`,
        family: font.family,
        style: font.style,
        weight: font.weight,
        source: 'system',
        isLoaded: true,
        metrics: await this.loadFontMetrics(font.family, font.style, font.weight),
      })
    }
  }

  /**
   * Create font atlases for efficient rendering
   */
  private async createFontAtlases(): Promise<void> {
    // Create atlases for loaded fonts
    for (const [fontKey, fontEntry] of this.fontLibrary.entries()) {
      if (fontEntry.isLoaded && fontEntry.metrics) {
        const atlas = await this.generateFontAtlas(fontEntry)
        if (atlas) {
          this.fontAtlases.set(fontKey, atlas)
        }
      }
    }
  }

  /**
   * Load font metrics for a specific font
   */
  private async loadFontMetrics(
    family: string,
    style: string,
    weight: string
  ): Promise<FontMetrics | null> {
    try {
      // For now, return basic metrics
      // In a full implementation, this would measure actual font metrics
      return {
        family,
        style: style as any,
        weight: weight as any,
        size: 16,
        ascent: 12,
        descent: 4,
        lineHeight: 1.2,
        capHeight: 10,
        xHeight: 8,
        unitsPerEm: 1000,
        glyphs: new Map(),
      }
    } catch (error) {
      console.warn(`Failed to load metrics for font ${family}:`, error)
      return null
    }
  }

  /**
   * Generate font atlas texture for efficient glyph rendering
   */
  private async generateFontAtlas(fontEntry: FontLibraryEntry): Promise<FontAtlas | null> {
    if (!fontEntry.metrics) return null

    try {
      // Create offscreen canvas for glyph rendering
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = 512
      canvas.height = 512

      // Set font for measurement
      ctx.font = `${fontEntry.weight} ${fontEntry.style} ${fontEntry.metrics.size}px ${fontEntry.family}`
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = 'white'

      // Generate glyphs for common characters
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'

      const glyphs = new Map()
      let x = 0
      let y = 0
      let rowHeight = 0

      for (const char of chars) {
        const metrics = ctx.measureText(char)
        const width = Math.ceil(metrics.width)
        const height = fontEntry.metrics.size

        if (x + width > canvas.width) {
          x = 0
          y += rowHeight + 2
          rowHeight = 0
        }

        if (y + height > canvas.height) {
          // Atlas full, skip remaining characters
          break
        }

        // Draw glyph
        ctx.fillText(char, x, y + fontEntry.metrics.ascent)

        glyphs.set(char, {
          x,
          y,
          width,
          height,
          advance: metrics.width,
          bearingX: 0, // Simplified
          bearingY: fontEntry.metrics.ascent,
        })

        x += width + 2
        rowHeight = Math.max(rowHeight, height)
      }

      // Create GPU texture from canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const texture = this.device!.createTexture({
        size: [canvas.width, canvas.height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      })

      this.device!.queue.writeTexture(
        { texture },
        imageData.data,
        { bytesPerRow: canvas.width * 4 },
        { width: canvas.width, height: canvas.height }
      )

      return {
        texture,
        glyphs,
        size: { width: canvas.width, height: canvas.height },
      }
    } catch (error) {
      console.warn(`Failed to generate font atlas for ${fontEntry.family}:`, error)
      return null
    }
  }

  /**
   * Create text rendering pipeline
   */
  private async createTextPipeline(): Promise<void> {
    if (!this.device) return

    // Create shader modules
    const vertexShader = this.device.createShaderModule({
      label: 'Text Vertex Shader',
      code: this.getTextVertexShader(),
    })

    const fragmentShader = this.device.createShaderModule({
      label: 'Text Fragment Shader',
      code: this.getTextFragmentShader(),
    })

    // Create bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      label: 'Text Bind Group Layout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
      ],
    })

    // Create pipeline layout
    const pipelineLayout = this.device.createPipelineLayout({
      label: 'Text Pipeline Layout',
      bindGroupLayouts: [bindGroupLayout],
    })

    // Create render pipeline
    this.textPipeline = {
      vertexShader: this.getTextVertexShader(),
      fragmentShader: this.getTextFragmentShader(),
      bindGroupLayout,
      pipeline: this.device.createRenderPipeline({
        label: 'Text Render Pipeline',
        layout: pipelineLayout,
        vertex: {
          module: vertexShader,
          entryPoint: 'main',
          buffers: [
            {
              arrayStride: 20, // 5 floats * 4 bytes
              attributes: [
                {
                  format: 'float32x2',
                  offset: 0,
                  shaderLocation: 0,
                },
                {
                  format: 'float32x2',
                  offset: 8,
                  shaderLocation: 1,
                },
                {
                  format: 'float32',
                  offset: 16,
                  shaderLocation: 2,
                },
              ],
            },
          ],
        },
        fragment: {
          module: fragmentShader,
          entryPoint: 'main',
          targets: [
            {
              format: 'bgra8unorm',
              blend: {
                color: {
                  srcFactor: 'src-alpha',
                  dstFactor: 'one-minus-src-alpha',
                },
                alpha: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha',
                },
              },
            },
          ],
        },
        primitive: {
          topology: 'triangle-list',
        },
      }),
    }
  }

  /**
   * Measure text layout and dimensions
   */
  measureText(text: string, font: FontDefinition): TextMeasurement {
    const startTime = performance.now()

    // For now, use Canvas 2D API for measurement
    // In a full implementation, this would use the font metrics
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const fontString = `${font.weight} ${font.style} ${font.size}px ${font.family}`
    ctx.font = fontString

    const lines = text.split('\n')
    const layout: TextLayout = {
      lines: [],
      totalWidth: 0,
      totalHeight: 0,
      characterData: [],
      wordCount: 0,
      characterCount: text.length,
    }

    let y = 0
    lines.forEach((line, lineIndex) => {
      const metrics = ctx.measureText(line)
      const lineHeight = font.size * font.lineHeight

      layout.lines.push({
        text: line,
        startIndex: y * line.length,
        endIndex: (y + 1) * line.length,
        baseline: y * lineHeight + font.size,
        width: metrics.width,
        height: lineHeight,
      })

      layout.totalWidth = Math.max(layout.totalWidth, metrics.width)
      layout.totalHeight += lineHeight
      y++

      // Count words
      layout.wordCount += line.split(/\s+/).filter(word => word.length > 0).length
    })

    // Generate character data (simplified)
    for (let i = 0; i < text.length; i++) {
      layout.characterData.push({
        char: text[i],
        index: i,
        position: { x: 0, y: 0 }, // Would be calculated properly
        bounds: { width: font.size * 0.6, height: font.size },
        opacity: 1,
        scale: 1,
        rotation: 0,
        offset: { x: 0, y: 0 },
      })
    }

    this.metrics.layoutTime = performance.now() - startTime

    return {
      width: layout.totalWidth,
      height: layout.totalHeight,
      lineCount: lines.length,
      characterCount: text.length,
      wordCount: layout.wordCount,
      layout,
    }
  }

  /**
   * Render text layer to GPU
   */
  async renderText(
    textLayer: TextLayer,
    renderPass: GPURenderPassEncoder,
    transform: Float32Array
  ): Promise<Result<TextRenderData>> {
    try {
      const startTime = performance.now()

      if (!this.textPipeline || !this.device) {
        return {
          success: false,
          error: {
            code: 'TEXT_PIPELINE_NOT_INITIALIZED',
            message: 'Text rendering pipeline not initialized',
          },
        }
      }

      // Measure text layout
      const measurement = this.measureText(textLayer.text, textLayer.font)

      // Generate render data
      const renderData = this.generateTextRenderData(textLayer, measurement)

      // Update GPU buffers
      this.updateTextBuffers(renderData)

      // Set up render state
      renderPass.setPipeline(this.textPipeline.pipeline)
      renderPass.setVertexBuffer(0, this.vertexBuffer!)
      renderPass.setIndexBuffer(this.indexBuffer!, 'uint16')

      // Create bind groups for each font atlas used
      for (const [fontKey, atlas] of this.fontAtlases.entries()) {
        const bindGroup = this.device.createBindGroup({
          layout: this.textPipeline.bindGroupLayout,
          entries: [
            { binding: 0, resource: { buffer: this.uniformBuffer! } },
            { binding: 1, resource: atlas.texture.createView() },
            { binding: 2, resource: this.device.createSampler() },
          ],
        })

        renderPass.setBindGroup(0, bindGroup)

        // Draw text for this font
        // In a full implementation, this would draw only characters from this font
        if (renderData.indices.length > 0) {
          renderPass.drawIndexed(renderData.indices.length)
        }
      }

      this.metrics.renderingTime = performance.now() - startTime
      this.metrics.characterCount = textLayer.text.length

      return { success: true, data: renderData }
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
   * Generate text render data for GPU
   */
  private generateTextRenderData(
    textLayer: TextLayer,
    measurement: TextMeasurement
  ): TextRenderData {
    // For now, return empty data
    // In a full implementation, this would generate vertex data for each character
    return {
      vertices: new Float32Array(0),
      indices: new Uint16Array(0),
      textureCoords: new Float32Array(0),
      characterTransforms: new Float32Array(0),
      glyphData: new Map(),
    }
  }

  /**
   * Update GPU buffers with text data
   */
  private updateTextBuffers(renderData: TextRenderData): void {
    if (!this.device) return

    // Update vertex buffer
    if (!this.vertexBuffer || this.vertexBuffer.size < renderData.vertices.byteLength) {
      this.vertexBuffer?.destroy()
      this.vertexBuffer = this.device.createBuffer({
        size: Math.max(renderData.vertices.byteLength, 1024),
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      })
    }

    if (renderData.vertices.length > 0) {
      this.device.queue.writeBuffer(this.vertexBuffer, 0, renderData.vertices)
    }

    // Update index buffer
    if (!this.indexBuffer || this.indexBuffer.size < renderData.indices.byteLength) {
      this.indexBuffer?.destroy()
      this.indexBuffer = this.device.createBuffer({
        size: Math.max(renderData.indices.byteLength, 1024),
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      })
    }

    if (renderData.indices.length > 0) {
      this.device.queue.writeBuffer(this.indexBuffer, 0, renderData.indices)
    }
  }

  /**
   * Load custom font
   */
  async loadFont(fontData: ArrayBuffer, fontName: string): Promise<Result<boolean>> {
    try {
      // In a full implementation, this would load and parse font files
      // For now, register as a system-like font
      this.fontLibrary.set(fontName, {
        id: fontName,
        family: fontName,
        style: 'normal' as const,
        weight: '400' as const,
        source: 'local',
        isLoaded: true,
        metrics: {
          family: fontName,
          style: 'normal' as const,
          weight: '400' as const,
          size: 16,
          ascent: 12,
          descent: 4,
          lineHeight: 1.2,
          capHeight: 10,
          xHeight: 8,
          unitsPerEm: 1000,
          glyphs: new Map(),
        },
      })

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FONT_LOAD_ERROR',
          message: `Failed to load font ${fontName}: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get font metrics for a specific font
   */
  getFontMetrics(font: FontDefinition): FontMetrics | null {
    const fontKey = `${font.family}_${font.style}_${font.weight}_${font.size}`
    return this.fontLibrary.get(fontKey)?.metrics || null
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): TextPerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.vertexBuffer?.destroy()
    this.indexBuffer?.destroy()
    this.uniformBuffer?.destroy()

    // Destroy font atlases
    for (const atlas of this.fontAtlases.values()) {
      atlas.texture.destroy()
    }

    this.fontLibrary.clear()
    this.fontAtlases.clear()
    this.glyphCache.clear()
  }

  /**
   * Get vertex shader for text rendering
   */
  private getTextVertexShader(): string {
    return `
      struct VertexInput {
        @location(0) position: vec2<f32>,
        @location(1) texCoord: vec2<f32>,
        @location(2) charIndex: f32,
      }

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) texCoord: vec2<f32>,
        @location(1) charIndex: f32,
      }

      @group(0) @binding(0) var<uniform> transform: mat4x4<f32>

      @vertex
      fn main(input: VertexInput) -> VertexOutput {
        var output: VertexOutput
        output.position = transform * vec4<f32>(input.position, 0.0, 1.0)
        output.texCoord = input.texCoord
        output.charIndex = input.charIndex
        return output
      }
    `
  }

  /**
   * Get fragment shader for text rendering
   */
  private getTextFragmentShader(): string {
    return `
      struct FragmentInput {
        @location(0) texCoord: vec2<f32>,
        @location(1) charIndex: f32,
      }

      @group(0) @binding(1) var fontTexture: texture_2d<f32>
      @group(0) @binding(2) var fontSampler: sampler

      @fragment
      fn main(input: FragmentInput) -> @location(0) vec4<f32> {
        let texColor = textureSample(fontTexture, fontSampler, input.texCoord)

        // Simple text rendering (white text on transparent background)
        if (texColor.r > 0.5) {
          return vec4<f32>(1.0, 1.0, 1.0, texColor.r)
        }

        discard
      }
    `
  }
}

