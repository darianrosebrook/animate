/**
 * @fileoverview Core Media Pipeline System Implementation
 * @author @darianrosebrook
 */

import { Result, AnimatorError, Time, Size2D } from '@/types'
import { WebGPUContext } from '../core/renderer/webgpu-context'
import {
  MediaSystem as IMediaSystem,
  MediaAsset,
  MediaType,
  MediaMetadata,
  MediaImportOptions,
  MediaImportResult,
  MediaTimelineTrack,
  MediaPipelineConfig,
  MediaAssetLibrary,
  MediaThumbnailGenerator,
  VideoDecoder,
  AudioAnalyzer,
  MediaTimelineIntegration,
  MediaProcessingPipeline,
} from './media-types'
import { MediaFormatDetector } from './media-format-detector'

/**
 * Core media pipeline system implementation
 */
export class MediaSystem implements IMediaSystem {
  formatDetector: MediaFormatDetector
  thumbnailGenerator: MediaThumbnailGenerator
  assetLibrary: MediaAssetLibrary
  videoDecoder: VideoDecoder | null = null
  audioAnalyzer: AudioAnalyzer | null = null
  timelineIntegration: MediaTimelineIntegration
  processingPipeline: MediaProcessingPipeline

  private webgpuContext: WebGPUContext
  private config: MediaPipelineConfig
  private nextAssetId = 0
  private mediaTracks: Map<string, MediaTimelineTrack> = new Map()

  constructor(webgpuContext: WebGPUContext, config?: Partial<MediaPipelineConfig>) {
    this.webgpuContext = webgpuContext
    this.config = {
      maxMemoryUsage: 2048, // 2GB default
      frameCacheSize: 100,
      thumbnailSize: { width: 320, height: 240 },
      audioBufferSize: 4096,
      hardwareAcceleration: true,
      quality: 'high',
      ...config,
    }

    this.formatDetector = new MediaFormatDetector()
    this.thumbnailGenerator = new MediaThumbnailGeneratorImpl(webgpuContext)
    this.assetLibrary = new MediaAssetLibraryImpl()
    this.timelineIntegration = new MediaTimelineIntegrationImpl()
    this.processingPipeline = new MediaProcessingPipelineImpl(webgpuContext)
  }

  async initialize(config?: Partial<MediaPipelineConfig>): Promise<Result<boolean>> {
    try {
      if (config) {
        this.config = { ...this.config, ...config }
      }

      // Initialize WebGPU context
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for media processing',
          },
        }
      }

      // Initialize video decoder if WebCodecs is available
      if ('VideoDecoder' in window && this.config.hardwareAcceleration) {
        try {
          this.videoDecoder = new VideoDecoderImpl()
          console.log('✅ Hardware-accelerated video decoder initialized')
        } catch (error) {
          console.warn('⚠️ Hardware video decoder not available, using software fallback')
          this.videoDecoder = null
        }
      }

      // Initialize audio analyzer if Web Audio API is available
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        try {
          this.audioAnalyzer = new AudioAnalyzerImpl()
          console.log('✅ Audio analyzer initialized')
        } catch (error) {
          console.warn('⚠️ Audio analyzer not available')
          this.audioAnalyzer = null
        }
      }

      console.log('✅ Media pipeline system initialized successfully')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MEDIA_INIT_ERROR',
          message: `Failed to initialize media system: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async importMedia(files: File[], options?: MediaImportOptions): Promise<Result<MediaImportResult>> {
    const startTime = performance.now()
    const result: MediaImportResult = {
      assets: [],
      totalDuration: 0,
      importTime: 0,
      errors: [],
      warnings: [],
    }

    try {
      for (const file of files) {
        try {
          // Validate file
          const validationResult = await this.formatDetector.validateFile(file)
          if (!validationResult.success) {
            result.errors.push(`Invalid file ${file.name}: ${validationResult.error?.message}`)
            continue
          }

          // Detect format
          const formatResult = await this.formatDetector.detectFormat(file)
          if (!formatResult.success) {
            result.errors.push(`Cannot detect format for ${file.name}: ${formatResult.error?.message}`)
            continue
          }

          // Extract metadata
          const metadataResult = await this.formatDetector.getMetadata(file)
          if (!metadataResult.success) {
            result.warnings.push(`Could not extract metadata for ${file.name}`)
            // Continue with basic metadata
          }

          const metadata = metadataResult.success ? metadataResult.data : {}

          // Create asset
          const asset: MediaAsset = {
            id: `asset_${this.nextAssetId++}`,
            name: file.name,
            type: formatResult.data,
            filePath: URL.createObjectURL(file),
            metadata,
            duration: metadata.duration,
            resolution: metadata.width && metadata.height ? { width: metadata.width, height: metadata.height } : undefined,
            createdAt: new Date(),
            lastModified: new Date(file.lastModified),
          }

          // Generate thumbnail if requested
          if (options?.generateThumbnails !== false) {
            try {
              const thumbnailResult = await this.thumbnailGenerator.generateThumbnail(asset)
              if (thumbnailResult.success) {
                asset.thumbnail = thumbnailResult.data
              }
            } catch (thumbnailError) {
              result.warnings.push(`Could not generate thumbnail for ${file.name}`)
            }
          }

          // Add to library
          const addResult = this.assetLibrary.addAsset(asset)
          if (!addResult.success) {
            result.errors.push(`Failed to add asset ${file.name} to library: ${addResult.error?.message}`)
            continue
          }

          result.assets.push(asset)
          result.totalDuration += asset.duration || 0

        } catch (assetError) {
          result.errors.push(`Error processing ${file.name}: ${assetError}`)
        }
      }

      result.importTime = performance.now() - startTime

      // Log results
      console.log(`📥 Media import completed: ${result.assets.length} assets, ${result.errors.length} errors, ${result.warnings.length} warnings`)

      return { success: true, data: result }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: `Failed to import media: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getAsset(id: string): MediaAsset | null {
    return this.assetLibrary.getAsset(id)
  }

  async decodeVideoFrame(assetId: string, time: Time): Promise<Result<any>> {
    try {
      const asset = this.getAsset(assetId)
      if (!asset) {
        return {
          success: false,
          error: {
            code: 'ASSET_NOT_FOUND',
            message: `Media asset ${assetId} not found`,
          },
        }
      }

      if (asset.type !== MediaType.Video) {
        return {
          success: false,
          error: {
            code: 'INVALID_ASSET_TYPE',
            message: `Asset ${assetId} is not a video`,
          },
        }
      }

      if (!this.videoDecoder) {
        return {
          success: false,
          error: {
            code: 'DECODER_NOT_AVAILABLE',
            message: 'Video decoder not available',
          },
        }
      }

      // This would decode the actual video frame
      // For now, return a placeholder
      return {
        success: true,
        data: {
          texture: null, // Would be actual GPU texture
          timestamp: time,
          frameNumber: Math.floor(time * (asset.metadata.frameRate || 30)),
          presentationTime: time,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DECODE_ERROR',
          message: `Failed to decode video frame: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async analyzeAudio(assetId: string): Promise<Result<Float32Array[]>> {
    try {
      const asset = this.getAsset(assetId)
      if (!asset) {
        return {
          success: false,
          error: {
            code: 'ASSET_NOT_FOUND',
            message: `Media asset ${assetId} not found`,
          },
        }
      }

      if (asset.type !== MediaType.Audio) {
        return {
          success: false,
          error: {
            code: 'INVALID_ASSET_TYPE',
            message: `Asset ${assetId} is not audio`,
          },
        }
      }

      if (!this.audioAnalyzer) {
        return {
          success: false,
          error: {
            code: 'ANALYZER_NOT_AVAILABLE',
            message: 'Audio analyzer not available',
          },
        }
      }

      // This would analyze the actual audio
      // For now, return placeholder waveform data
      return {
        success: true,
        data: [new Float32Array(1024)], // Placeholder waveform
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYZE_ERROR',
          message: `Failed to analyze audio: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async exportMedia(assetIds: string[], options: any): Promise<Result<Blob>> {
    try {
      // This would implement actual media export
      // For now, return a placeholder
      return {
        success: false,
        error: {
          code: 'EXPORT_NOT_IMPLEMENTED',
          message: 'Media export not yet implemented',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: `Failed to export media: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  destroy(): void {
    // Clean up decoders and analyzers
    if (this.videoDecoder) {
      this.videoDecoder.destroy()
      this.videoDecoder = null
    }

    if (this.audioAnalyzer) {
      this.audioAnalyzer.destroy()
      this.audioAnalyzer = null
    }

    // Clear media tracks
    this.mediaTracks.clear()

    // Clean up GPU resources
    this.thumbnailGenerator.destroy()

    console.log('🧹 Media pipeline system destroyed')
  }
}

/**
 * Media asset library implementation
 */
class MediaAssetLibraryImpl implements MediaAssetLibrary {
  assets: MediaAsset[] = []

  search(query: string): MediaAsset[] {
    const lowerQuery = query.toLowerCase()
    return this.assets.filter(asset =>
      asset.name.toLowerCase().includes(lowerQuery) ||
      asset.metadata.codec?.toLowerCase().includes(lowerQuery)
    )
  }

  filter(type?: MediaType, duration?: { min: number; max: number }): MediaAsset[] {
    return this.assets.filter(asset => {
      if (type && asset.type !== type) return false
      if (duration) {
        const assetDuration = asset.duration || 0
        if (assetDuration < duration.min || assetDuration > duration.max) return false
      }
      return true
    })
  }

  sort(by: 'name' | 'date' | 'duration' | 'size', ascending = true): MediaAsset[] {
    const sorted = [...this.assets]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (by) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0)
          break
        case 'size':
          comparison = (a.metadata.fileSize || 0) - (b.metadata.fileSize || 0)
          break
      }

      return ascending ? comparison : -comparison
    })

    return sorted
  }

  getAsset(id: string): MediaAsset | null {
    return this.assets.find(asset => asset.id === id) || null
  }

  addAsset(asset: MediaAsset): Result<void> {
    try {
      // Check for duplicates
      if (this.assets.some(a => a.id === asset.id)) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_ASSET',
            message: `Asset with id ${asset.id} already exists`,
          },
        }
      }

      this.assets.push(asset)
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADD_ASSET_ERROR',
          message: `Failed to add asset: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  removeAsset(id: string): Result<void> {
    try {
      const index = this.assets.findIndex(asset => asset.id === id)
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'ASSET_NOT_FOUND',
            message: `Asset with id ${id} not found`,
          },
        }
      }

      this.assets.splice(index, 1)
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REMOVE_ASSET_ERROR',
          message: `Failed to remove asset: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  updateAsset(id: string, updates: Partial<MediaAsset>): Result<void> {
    try {
      const asset = this.getAsset(id)
      if (!asset) {
        return {
          success: false,
          error: {
            code: 'ASSET_NOT_FOUND',
            message: `Asset with id ${id} not found`,
          },
        }
      }

      Object.assign(asset, updates, { lastModified: new Date() })
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ASSET_ERROR',
          message: `Failed to update asset: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }
}

/**
 * Media thumbnail generator implementation
 */
class MediaThumbnailGeneratorImpl implements MediaThumbnailGenerator {
  private webgpuContext: WebGPUContext

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  async generateThumbnail(asset: MediaAsset, time?: Time): Promise<Result<GPUTexture>> {
    try {
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for thumbnail generation',
          },
        }
      }

      switch (asset.type) {
        case MediaType.Image:
          return await this.generateImageThumbnail(asset)
        case MediaType.Video:
          return await this.generateVideoThumbnail(asset, time)
        default:
          return {
            success: false,
            error: {
              code: 'UNSUPPORTED_ASSET_TYPE',
              message: `Cannot generate thumbnail for asset type ${asset.type}`,
            },
          }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'THUMBNAIL_GENERATION_ERROR',
          message: `Failed to generate thumbnail: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async generateThumbnails(asset: MediaAsset, count: number): Promise<Result<GPUTexture[]>> {
    try {
      if (asset.type !== MediaType.Video) {
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_ASSET_TYPE',
            message: 'Thumbnail generation only supported for video assets',
          },
        }
      }

      const thumbnails: GPUTexture[] = []
      const duration = asset.duration || 0
      const interval = duration / count

      for (let i = 0; i < count; i++) {
        const time = interval * i
        const thumbnailResult = await this.generateThumbnail(asset, time)
        if (thumbnailResult.success) {
          thumbnails.push(thumbnailResult.data)
        }
      }

      return { success: true, data: thumbnails }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'THUMBNAILS_GENERATION_ERROR',
          message: `Failed to generate thumbnails: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  destroy(): void {
    // Clean up any GPU resources if needed
    console.log('🖼️ Media thumbnail generator destroyed')
  }

  private async generateImageThumbnail(asset: MediaAsset): Promise<Result<GPUTexture>> {
    try {
      return new Promise((resolve) => {
        const img = new Image()
        const url = asset.filePath

        img.onload = () => {
          const device = this.webgpuContext.getDevice()!
          const texture = device.createTexture({
            size: [img.naturalWidth, img.naturalHeight],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
          })

          // Copy image data to GPU texture (simplified)
          // In practice, you'd use copyExternalImageToTexture

          resolve({ success: true, data: texture })
        }

        img.onerror = () => {
          resolve({
            success: false,
            error: {
              code: 'IMAGE_LOAD_ERROR',
              message: 'Failed to load image for thumbnail generation',
            },
          })
        }

        img.src = url
      })
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'IMAGE_THUMBNAIL_ERROR',
          message: `Failed to generate image thumbnail: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async generateVideoThumbnail(asset: MediaAsset, time?: Time): Promise<Result<GPUTexture>> {
    try {
      // For video thumbnails, we'd seek to the specified time and capture a frame
      // This is a simplified implementation
      const device = this.webgpuContext.getDevice()!

      const texture = device.createTexture({
        size: [320, 240], // Thumbnail size
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
      })

      // In practice, this would decode the video frame and copy to texture
      return { success: true, data: texture }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VIDEO_THUMBNAIL_ERROR',
          message: `Failed to generate video thumbnail: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }
}

/**
 * Media timeline integration implementation
 */
class MediaTimelineIntegrationImpl implements MediaTimelineIntegration {
  private tracks: Map<string, MediaTimelineTrack> = new Map()

  addMediaTrack(track: MediaTimelineTrack): Result<MediaTimelineTrack> {
    try {
      if (this.tracks.has(track.id)) {
        return {
          success: false,
          error: {
            code: 'TRACK_ALREADY_EXISTS',
            message: `Media track ${track.id} already exists`,
          },
        }
      }

      this.tracks.set(track.id, track)
      return { success: true, data: track }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADD_TRACK_ERROR',
          message: `Failed to add media track: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  removeMediaTrack(trackId: string): Result<boolean> {
    try {
      const removed = this.tracks.delete(trackId)
      return { success: true, data: removed }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REMOVE_TRACK_ERROR',
          message: `Failed to remove media track: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  updateMediaTrack(trackId: string, updates: Partial<MediaTimelineTrack>): Result<MediaTimelineTrack> {
    try {
      const track = this.tracks.get(trackId)
      if (!track) {
        return {
          success: false,
          error: {
            code: 'TRACK_NOT_FOUND',
            message: `Media track ${trackId} not found`,
          },
        }
      }

      const updatedTrack = { ...track, ...updates }
      this.tracks.set(trackId, updatedTrack)
      return { success: true, data: updatedTrack }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_TRACK_ERROR',
          message: `Failed to update media track: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getMediaTrack(trackId: string): MediaTimelineTrack | null {
    return this.tracks.get(trackId) || null
  }

  syncMediaTracks(time: Time): Result<any> {
    try {
      // Sync all media tracks to the given time
      const syncInfo = {
        videoTime: time,
        audioTime: time,
        drift: 0,
        isSynchronized: true,
        lastSyncTime: Date.now(),
      }

      return { success: true, data: syncInfo }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: `Failed to sync media tracks: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getMediaAssetsAtTime(time: Time): MediaAsset[] {
    const assets: MediaAsset[] = []

    for (const track of this.tracks.values()) {
      // Find assets that are active at the given time
      // This is a simplified implementation
      assets.push(...track.assets)
    }

    return assets
  }
}

/**
 * Media processing pipeline implementation
 */
class MediaProcessingPipelineImpl implements MediaProcessingPipeline {
  private webgpuContext: WebGPUContext

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  async processVideoFrame(inputTexture: GPUTexture, time: Time): Promise<Result<GPUTexture>> {
    try {
      const device = this.webgpuContext.getDevice()!
      if (!device) {
        return {
          success: false,
          error: {
            code: 'WEBGPU_DEVICE_NOT_FOUND',
            message: 'WebGPU device not available for video processing',
          },
        }
      }

      // Create output texture
      const outputTexture = device.createTexture({
        size: [inputTexture.width, inputTexture.height],
        format: inputTexture.format,
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
      })

      // In practice, this would apply video processing effects
      // For now, just copy the input texture

      return { success: true, data: outputTexture }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VIDEO_PROCESSING_ERROR',
          message: `Failed to process video frame: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async processAudioFrame(audioData: any): Promise<Result<any>> {
    try {
      // In practice, this would apply audio processing effects
      return { success: true, data: audioData }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIO_PROCESSING_ERROR',
          message: `Failed to process audio frame: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async applyEffects(inputTexture: GPUTexture, effects: any[]): Promise<Result<GPUTexture>> {
    try {
      // In practice, this would apply visual effects to the texture
      return { success: true, data: inputTexture }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EFFECTS_APPLICATION_ERROR',
          message: `Failed to apply effects: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async compositeLayers(layers: GPUTexture[]): Promise<Result<GPUTexture>> {
    try {
      if (layers.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_LAYERS',
            message: 'No layers provided for compositing',
          },
        }
      }

      // In practice, this would composite multiple layers
      // For now, return the first layer
      return { success: true, data: layers[0] }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPOSITING_ERROR',
          message: `Failed to composite layers: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }
}

/**
 * Video decoder implementation
 */
class VideoDecoderImpl implements VideoDecoder {
  private decoder: any = null
  private duration = 0
  private frameRate = 30
  private currentTime = 0
  private hardwareAccelerated = false

  async initialize(videoFile: File): Promise<Result<boolean>> {
    try {
      if (!('VideoDecoder' in window)) {
        return {
          success: false,
          error: {
            code: 'WEBCODECS_NOT_SUPPORTED',
            message: 'WebCodecs API not supported',
          },
        }
      }

      // Initialize WebCodecs VideoDecoder
      this.decoder = new VideoDecoder({
        output: (frame: any) => {
          // Handle decoded frame
          frame.close()
        },
        error: (error: any) => {
          console.error('VideoDecoder error:', error)
        },
      })

      // Configure decoder (simplified)
      await this.decoder.configure({
        codec: 'avc1.42E01E', // H.264
        hardwareAcceleration: 'prefer-hardware',
      })

      this.hardwareAccelerated = true
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DECODER_INIT_ERROR',
          message: `Failed to initialize video decoder: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async decodeFrame(time: Time): Promise<Result<any>> {
    try {
      // In practice, this would decode the actual frame at the given time
      return {
        success: true,
        data: {
          texture: null,
          timestamp: time,
          frameNumber: Math.floor(time * this.frameRate),
          presentationTime: time,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DECODE_FRAME_ERROR',
          message: `Failed to decode frame: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async seek(time: Time): Promise<Result<boolean>> {
    try {
      this.currentTime = time
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SEEK_ERROR',
          message: `Failed to seek: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getDuration(): number {
    return this.duration
  }

  getFrameRate(): number {
    return this.frameRate
  }

  getCurrentTime(): Time {
    return this.currentTime
  }

  isHardwareAccelerated(): boolean {
    return this.hardwareAccelerated
  }

  destroy(): void {
    if (this.decoder) {
      this.decoder.close()
      this.decoder = null
    }
  }
}

/**
 * Audio analyzer implementation
 */
class AudioAnalyzerImpl implements AudioAnalyzer {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null

  async initialize(audioBuffer: AudioBuffer): Promise<Result<boolean>> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048

      // Create source from buffer
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.analyser)

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYZER_INIT_ERROR',
          message: `Failed to initialize audio analyzer: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getWaveformData(startTime: Time, endTime: Time): Float32Array[] {
    try {
      if (!this.analyser) {
        return []
      }

      // Get time domain data (waveform)
      const bufferLength = this.analyser.frequencyBinCount
      const dataArray = new Float32Array(bufferLength)
      this.analyser.getFloatTimeDomainData(dataArray)

      return [dataArray]
    } catch (error) {
      console.error('Failed to get waveform data:', error)
      return []
    }
  }

  getPeakData(startTime: Time, endTime: Time): number[] {
    try {
      if (!this.analyser) {
        return []
      }

      // Calculate peak values from waveform data
      const waveformData = this.getWaveformData(startTime, endTime)
      const peaks: number[] = []

      for (const channel of waveformData) {
        let peak = 0
        for (let i = 0; i < channel.length; i++) {
          const amplitude = Math.abs(channel[i])
          if (amplitude > peak) {
            peak = amplitude
          }
        }
        peaks.push(peak)
      }

      return peaks
    } catch (error) {
      console.error('Failed to get peak data:', error)
      return []
    }
  }

  getRMSData(startTime: Time, endTime: Time): number[] {
    try {
      if (!this.analyser) {
        return []
      }

      // Calculate RMS (Root Mean Square) values
      const waveformData = this.getWaveformData(startTime, endTime)
      const rms: number[] = []

      for (const channel of waveformData) {
        let sum = 0
        for (let i = 0; i < channel.length; i++) {
          sum += channel[i] * channel[i]
        }
        rms.push(Math.sqrt(sum / channel.length))
      }

      return rms
    } catch (error) {
      console.error('Failed to get RMS data:', error)
      return []
    }
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.analyser = null
  }
}
