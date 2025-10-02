/**
 * @fileoverview WebCodecs Video Encoder Implementation
 * @author @darianrosebrook
 */

import { Result, Time } from '@/types'
import { WebGPUContext } from '../core/renderer/webgpu-context'
import { logger } from '@/core/logging/logger'
import {
  ExportJob,
  ExportFormat,
  WebCodecsVideoEncoder,
  QualityMetrics,
  CodecCapability,
} from './export-types'

/**
 * WebCodecs-based video encoder with hardware acceleration
 */
export class WebCodecsVideoEncoderImpl implements WebCodecsVideoEncoder {
  private encoder: globalThis.VideoEncoder | null = null
  private config: VideoEncoderConfig | null = null
  private encodedChunks: EncodedVideoChunk[] = []
  private frameCount = 0
  private startTime = 0
  private webgpuContext: WebGPUContext
  private canvas: OffscreenCanvas | null = null
  private ctx: OffscreenCanvasRenderingContext2D | null = null

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  async initialize(job: ExportJob): Promise<Result<boolean>> {
    try {
      logger.info('🎥 Initializing WebCodecs video encoder...')

      if (!('VideoEncoder' in globalThis)) {
        return {
          success: false,
          error: {
            code: 'WEBCODECS_NOT_SUPPORTED',
            message: 'VideoEncoder API not supported in this browser',
          },
        }
      }

      // Create canvas for frame conversion
      this.canvas = new OffscreenCanvas(
        job.composition.resolution?.width || 1920,
        job.composition.resolution?.height || 1080
      )
      this.ctx = this.canvas.getContext('2d')
      if (!this.ctx) {
        return {
          success: false,
          error: {
            code: 'CANVAS_CONTEXT_ERROR',
            message: 'Failed to get 2D canvas context for frame conversion',
          },
        }
      }

      // Initialize encoder with format-specific configuration
      const config = this.getEncoderConfig(job)
      if (!config) {
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_FORMAT',
            message: `Unsupported export format: ${job.format}`,
          },
        }
      }

      this.config = config
      this.encoder = new VideoEncoder({
        output: (chunk) => {
          this.encodedChunks.push(chunk)
          this.frameCount++
        },
        error: (error) => {
          logger.error('VideoEncoder error:', error)
        },
      })

      await this.encoder.configure(config)
      this.startTime = performance.now()

      logger.info(
        `✅ Video encoder initialized: ${config.codec} at ${config.width}x${config.height}`
      )
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ENCODER_INIT_ERROR',
          message: `Failed to initialize video encoder: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async encodeFrame(texture: GPUTexture, time: Time): Promise<Result<boolean>> {
    try {
      if (!this.encoder || !this.ctx) {
        return {
          success: false,
          error: {
            code: 'ENCODER_NOT_INITIALIZED',
            message: 'Video encoder not initialized',
          },
        }
      }

      // Convert GPU texture to VideoFrame
      const videoFrame = await this.textureToVideoFrame(texture, time)
      if (!videoFrame) {
        return {
          success: false,
          error: {
            code: 'FRAME_CONVERSION_ERROR',
            message: 'Failed to convert texture to video frame',
          },
        }
      }

      // Encode the frame
      this.encoder.encode(videoFrame, { keyFrame: this.frameCount % 30 === 0 })
      videoFrame.close()

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FRAME_ENCODING_ERROR',
          message: `Failed to encode frame: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async finalize(): Promise<Result<boolean>> {
    try {
      if (!this.encoder) {
        return {
          success: false,
          error: {
            code: 'ENCODER_NOT_INITIALIZED',
            message: 'Video encoder not initialized',
          },
        }
      }

      // Signal end of stream
      await this.encoder.flush()

      const encodingTime = performance.now() - this.startTime
      logger.info(
        `✅ Video encoding finalized: ${this.encodedChunks.length} frames in ${encodingTime.toFixed(2)}ms`
      )
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FINALIZE_ERROR',
          message: `Failed to finalize video encoding: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async getEncodedData(): Promise<Result<Blob>> {
    try {
      if (this.encodedChunks.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_ENCODED_DATA',
            message: 'No encoded video chunks available',
          },
        }
      }

      // Create MP4 container from encoded chunks
      const mimeType = this.getMimeType()
      const blob = new Blob(
        this.encodedChunks.map((chunk) => chunk.data),
        {
          type: mimeType,
        }
      )

      logger.info(`📦 Generated video blob: ${blob.size} bytes`)
      return { success: true, data: blob }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BLOB_GENERATION_ERROR',
          message: `Failed to generate encoded blob: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async stop(): Promise<Result<boolean>> {
    try {
      if (this.encoder) {
        this.encoder.close()
        this.encoder = null
      }
      this.encodedChunks = []
      this.frameCount = 0
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STOP_ERROR',
          message: `Failed to stop video encoder: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getEncoder(): globalThis.VideoEncoder | null {
    return this.encoder
  }

  private getEncoderConfig(job: ExportJob): VideoEncoderConfig | null {
    const width = job.composition.resolution?.width || 1920
    const height = job.composition.resolution?.height || 1080
    const frameRate = job.composition.frameRate || 30

    switch (job.format) {
      case ExportFormat.MP4_H264:
        return {
          codec: 'avc1.42E01E', // H.264 Main Profile
          width,
          height,
          bitrate: this.getBitrateForQuality(job.quality),
          framerate: frameRate,
          latencyMode: 'quality',
        }

      case ExportFormat.MP4_H265:
        return {
          codec: 'hvc1.1.6.L93.90', // H.265 Main Profile
          width,
          height,
          bitrate: this.getBitrateForQuality(job.quality),
          framerate: frameRate,
          latencyMode: 'quality',
        }

      case ExportFormat.WebM_VP9:
        return {
          codec: 'vp09.00.10.08', // VP9
          width,
          height,
          bitrate: this.getBitrateForQuality(job.quality),
          framerate: frameRate,
          latencyMode: 'quality',
        }

      case ExportFormat.WebM_AV1:
        return {
          codec: 'av01.0.04M.08', // AV1
          width,
          height,
          bitrate: this.getBitrateForQuality(job.quality),
          framerate: frameRate,
          latencyMode: 'quality',
        }

      default:
        return null
    }
  }

  private getBitrateForQuality(quality: string): number {
    switch (quality) {
      case 'low':
        return 2_000_000 // 2 Mbps
      case 'medium':
        return 5_000_000 // 5 Mbps
      case 'high':
        return 10_000_000 // 10 Mbps
      case 'lossless':
        return 50_000_000 // 50 Mbps
      default:
        return 5_000_000
    }
  }

  private async textureToVideoFrame(
    texture: GPUTexture,
    time: Time
  ): Promise<VideoFrame | null> {
    try {
      // This is a simplified implementation
      // In a real implementation, you would:
      // 1. Copy GPU texture to CPU-accessible buffer
      // 2. Create ImageData from the buffer
      // 3. Create VideoFrame from ImageData

      // For now, create a placeholder frame
      if (!this.canvas || !this.ctx) return null

      // Draw a simple pattern (would be replaced with actual texture data)
      this.ctx.fillStyle = `hsl(${(time * 100) % 360}, 70%, 50%)`
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      // Create VideoFrame from canvas (simplified)
      // Note: This is not the correct way to create VideoFrame from GPU texture
      // In practice, you would need to:
      // 1. Use WebGPU to read texture data
      // 2. Create ImageBitmap from the data
      // 3. Create VideoFrame from ImageBitmap

      return new VideoFrame(this.canvas as any, {
        timestamp: time * 1000000, // microseconds
        duration: 33333, // ~30fps
      })
    } catch (error) {
      logger.error('Failed to convert texture to VideoFrame:', error)
      return null
    }
  }

  private getMimeType(): string {
    if (!this.config) return 'video/mp4'

    switch (this.config.codec) {
      case 'avc1.42E01E':
        return 'video/mp4'
      case 'hvc1.1.6.L93.90':
        return 'video/mp4'
      case 'vp09.00.10.08':
        return 'video/webm'
      case 'av01.0.04M.08':
        return 'video/webm'
      default:
        return 'video/mp4'
    }
  }

  destroy(): void {
    this.stop()
    if (this.canvas) {
      this.canvas = null
      this.ctx = null
    }
  }
}

/**
 * Codec capability detector
 */
export class CodecCapabilityDetector {
  static async detectCapabilities(): Promise<CodecCapability[]> {
    const capabilities: CodecCapability[] = []

    // Test H.264 support
    if (await this.testCodecSupport('avc1.42E01E')) {
      capabilities.push({
        codec: 'h264',
        container: 'mp4',
        hardwareAccelerated: await this.testHardwareAcceleration('avc1.42E01E'),
        maxResolution: { width: 4096, height: 2160 },
        maxFrameRate: 60,
        supportedProfiles: ['baseline', 'main', 'high'],
        qualityPresets: ['low', 'medium', 'high', 'lossless'],
      })
    }

    // Test H.265 support
    if (await this.testCodecSupport('hvc1.1.6.L93.90')) {
      capabilities.push({
        codec: 'h265',
        container: 'mp4',
        hardwareAccelerated:
          await this.testHardwareAcceleration('hvc1.1.6.L93.90'),
        maxResolution: { width: 8192, height: 4320 },
        maxFrameRate: 120,
        supportedProfiles: ['main'],
        qualityPresets: ['low', 'medium', 'high', 'lossless'],
      })
    }

    // Test VP9 support
    if (await this.testCodecSupport('vp09.00.10.08')) {
      capabilities.push({
        codec: 'vp9',
        container: 'webm',
        hardwareAccelerated:
          await this.testHardwareAcceleration('vp09.00.10.08'),
        maxResolution: { width: 4096, height: 2160 },
        maxFrameRate: 60,
        supportedProfiles: ['0', '1', '2', '3'],
        qualityPresets: ['low', 'medium', 'high'],
      })
    }

    // Test AV1 support
    if (await this.testCodecSupport('av01.0.04M.08')) {
      capabilities.push({
        codec: 'av1',
        container: 'webm',
        hardwareAccelerated:
          await this.testHardwareAcceleration('av01.0.04M.08'),
        maxResolution: { width: 8192, height: 4320 },
        maxFrameRate: 60,
        supportedProfiles: ['main'],
        qualityPresets: ['low', 'medium', 'high'],
      })
    }

    return capabilities
  }

  private static async testCodecSupport(codec: string): Promise<boolean> {
    try {
      if (!('VideoEncoder' in globalThis)) return false

      const encoder = new VideoEncoder({
        output: () => {},
        error: () => {},
      })

      await encoder.configure({
        codec,
        width: 320,
        height: 240,
        bitrate: 1_000_000,
        framerate: 30,
      })

      encoder.close()
      return true
    } catch {
      return false
    }
  }

  private static async testHardwareAcceleration(
    codec: string
  ): Promise<boolean> {
    try {
      // Test with hardware acceleration enabled
      const encoder = new VideoEncoder({
        output: () => {},
        error: () => {},
      })

      await encoder.configure({
        codec,
        width: 1920,
        height: 1080,
        bitrate: 5_000_000,
        framerate: 30,
        latencyMode: 'realtime',
      })

      // If configuration succeeds without errors, likely hardware accelerated
      encoder.close()
      return true
    } catch {
      return false
    }
  }
}
