/**
 * @fileoverview Media Format Detection and Validation System
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { logger } from '@/core/logging/logger'
import {
  MediaFormatDetector as IMediaFormatDetector,
  MediaType,
  MediaMetadata,
  VideoCodec,
  // TODO: Use AudioCodec for audio format detection
  // AudioCodec,
} from './media-types'

/**
 * Media format detection and validation implementation
 */
export class MediaFormatDetector implements IMediaFormatDetector {
  private supportedFormats: Set<string> = new Set([
    // Video formats
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/avi',
    'video/mov',

    // Image formats
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/tiff',
    'image/bmp',
    'image/gif',

    // Audio formats
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/aac',
    'audio/flac',
    'audio/opus',
  ])

  private videoExtensions = new Set([
    '.mp4',
    '.mov',
    '.avi',
    '.mkv',
    '.webm',
    '.m4v',
    '.mpg',
    '.mpeg',
  ])

  private imageExtensions = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.tiff',
    '.tif',
    '.bmp',
    '.gif',
    '.svg',
  ])

  private audioExtensions = new Set([
    '.wav',
    '.mp3',
    '.aac',
    '.flac',
    '.opus',
    '.m4a',
    '.ogg',
  ])

  async detectFormat(file: File): Promise<Result<MediaType>> {
    try {
      const fileName = file.name.toLowerCase()
      const mimeType = file.type.toLowerCase()

      // Check MIME type first
      if (mimeType.startsWith('video/')) {
        return { success: true, data: MediaType.Video }
      }

      if (mimeType.startsWith('image/')) {
        return { success: true, data: MediaType.Image }
      }

      if (mimeType.startsWith('audio/')) {
        return { success: true, data: MediaType.Audio }
      }

      // Fallback to file extension
      if (this.videoExtensions.has(this.getFileExtension(fileName))) {
        return { success: true, data: MediaType.Video }
      }

      if (this.imageExtensions.has(this.getFileExtension(fileName))) {
        return { success: true, data: MediaType.Image }
      }

      if (this.audioExtensions.has(this.getFileExtension(fileName))) {
        return { success: true, data: MediaType.Audio }
      }

      return {
        success: false,
        error: {
          code: 'UNSUPPORTED_FORMAT',
          message: `Unsupported media format: ${mimeType} (${fileName})`,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FORMAT_DETECTION_ERROR',
          message: `Failed to detect format: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async getMetadata(file: File): Promise<Result<MediaMetadata>> {
    try {
      const metadata: MediaMetadata = {
        fileSize: file.size,
        creationDate: new Date(file.lastModified),
      }

      const formatResult = await this.detectFormat(file)
      if (!formatResult.success) {
        return formatResult
      }

      switch (formatResult.data) {
        case MediaType.Video:
          return await this.getVideoMetadata(file, metadata)
        case MediaType.Image:
          return await this.getImageMetadata(file, metadata)
        case MediaType.Audio:
          return await this.getAudioMetadata(file, metadata)
        default:
          return {
            success: false,
            error: {
              code: 'UNKNOWN_FORMAT',
              message: `Unknown media type: ${formatResult.data}`,
            },
          }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'METADATA_EXTRACTION_ERROR',
          message: `Failed to extract metadata: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async validateFile(file: File): Promise<Result<boolean>> {
    try {
      // Check file size (max 5GB for safety)
      if (file.size > 5 * 1024 * 1024 * 1024) {
        return {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum limit (5GB)',
          },
        }
      }

      // Check MIME type
      if (!this.supportedFormats.has(file.type)) {
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_MIME_TYPE',
            message: `Unsupported MIME type: ${file.type}`,
          },
        }
      }

      const formatResult = await this.detectFormat(file)
      if (!formatResult.success) {
        return formatResult
      }

      // Additional validation based on format
      switch (formatResult.data) {
        case MediaType.Video:
          return await this.validateVideoFile(file)
        case MediaType.Image:
          return await this.validateImageFile(file)
        case MediaType.Audio:
          return await this.validateAudioFile(file)
        default:
          return { success: true, data: true }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Failed to validate file: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getSupportedFormats(): MediaType[] {
    return [MediaType.Video, MediaType.Image, MediaType.Audio]
  }

  private async getVideoMetadata(
    file: File,
    baseMetadata: MediaMetadata
  ): Promise<Result<MediaMetadata>> {
    try {
      // Use WebCodecs API if available
      if ('VideoDecoder' in window) {
        return await this.getVideoMetadataWebCodecs(file, baseMetadata)
      }

      // Fallback to basic metadata extraction
      return { success: true, data: baseMetadata }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VIDEO_METADATA_ERROR',
          message: `Failed to extract video metadata: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async getVideoMetadataWebCodecs(
    file: File,
    baseMetadata: MediaMetadata
  ): Promise<Result<MediaMetadata>> {
    try {
      const videoDecoder = new VideoDecoder({
        output: () => {}, // We just need metadata
        error: (error) => logger.error('VideoDecoder error:', error),
      })

      const detectedCodec = await this.detectVideoCodec(file)
      if (!detectedCodec) {
        throw new Error('Unable to detect video codec')
      }

      const config = {
        codec: detectedCodec,
        hardwareAcceleration: 'prefer-hardware' as HardwareAcceleration,
      }

      await videoDecoder.configure(config)

      // Get metadata from decoder
      const metadata: MediaMetadata = {
        ...baseMetadata,
        codec: config.codec as VideoCodec,
      }

      videoDecoder.close()
      return { success: true, data: metadata }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'WEBCODECS_ERROR',
          message: `WebCodecs API not available or failed: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async getImageMetadata(
    file: File,
    baseMetadata: MediaMetadata
  ): Promise<Result<MediaMetadata>> {
    try {
      return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
          URL.revokeObjectURL(url)

          const metadata: MediaMetadata = {
            ...baseMetadata,
            width: img.naturalWidth,
            height: img.naturalHeight,
          }

          resolve({ success: true, data: metadata })
        }

        img.onerror = () => {
          URL.revokeObjectURL(url)
          resolve({
            success: false,
            error: {
              code: 'IMAGE_LOAD_ERROR',
              message: 'Failed to load image for metadata extraction',
            },
          })
        }

        img.src = url
      })
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'IMAGE_METADATA_ERROR',
          message: `Failed to extract image metadata: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async getAudioMetadata(
    file: File,
    baseMetadata: MediaMetadata
  ): Promise<Result<MediaMetadata>> {
    try {
      // Use Web Audio API for basic metadata
      return new Promise((resolve) => {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)()
        const reader = new FileReader()

        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            const metadata: MediaMetadata = {
              ...baseMetadata,
              duration: audioBuffer.duration,
              sampleRate: audioBuffer.sampleRate,
              channels: audioBuffer.numberOfChannels,
            }

            audioContext.close()
            resolve({ success: true, data: metadata })
          } catch (decodeError) {
            audioContext.close()
            resolve({
              success: false,
              error: {
                code: 'AUDIO_DECODE_ERROR',
                message: 'Failed to decode audio for metadata extraction',
              },
            })
          }
        }

        reader.onerror = () => {
          audioContext.close()
          resolve({
            success: false,
            error: {
              code: 'AUDIO_READ_ERROR',
              message: 'Failed to read audio file',
            },
          })
        }

        reader.readAsArrayBuffer(file)
      })
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIO_METADATA_ERROR',
          message: `Failed to extract audio metadata: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async validateVideoFile(file: File): Promise<Result<boolean>> {
    try {
      // Check video-specific constraints
      if (file.size > 2 * 1024 * 1024 * 1024) {
        // 2GB limit for videos
        return {
          success: false,
          error: {
            code: 'VIDEO_TOO_LARGE',
            message: 'Video file size exceeds recommended limit (2GB)',
          },
        }
      }

      // Check for supported video codecs
      const codec = await this.detectVideoCodec(file)
      if (!codec) {
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_CODEC',
            message: 'Video codec not supported',
          },
        }
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VIDEO_VALIDATION_ERROR',
          message: `Failed to validate video file: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async validateImageFile(file: File): Promise<Result<boolean>> {
    try {
      // Check image-specific constraints
      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit for images
        return {
          success: false,
          error: {
            code: 'IMAGE_TOO_LARGE',
            message: 'Image file size exceeds limit (100MB)',
          },
        }
      }

      // Verify it's actually an image by trying to load it
      const loadResult = await this.getImageMetadata(file, {})
      if (!loadResult.success) {
        return {
          success: false,
          error: {
            code: 'INVALID_IMAGE',
            message: 'File is not a valid image',
          },
        }
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'IMAGE_VALIDATION_ERROR',
          message: `Failed to validate image file: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async validateAudioFile(file: File): Promise<Result<boolean>> {
    try {
      // Check audio-specific constraints
      if (file.size > 500 * 1024 * 1024) {
        // 500MB limit for audio
        return {
          success: false,
          error: {
            code: 'AUDIO_TOO_LARGE',
            message: 'Audio file size exceeds limit (500MB)',
          },
        }
      }

      // Verify it's actually audio by trying to decode it
      const decodeResult = await this.getAudioMetadata(file, {})
      if (!decodeResult.success) {
        return {
          success: false,
          error: {
            code: 'INVALID_AUDIO',
            message: 'File is not valid audio',
          },
        }
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIO_VALIDATION_ERROR',
          message: `Failed to validate audio file: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async detectVideoCodec(file: File): Promise<VideoCodec | null> {
    // This is a simplified implementation
    // In practice, you'd analyze the file header or use MediaRecorder capabilities

    const fileName = file.name.toLowerCase()

    if (fileName.includes('prores') || fileName.includes('mov')) {
      return VideoCodec.ProRes
    }

    if (fileName.includes('h264') || fileName.includes('h.264')) {
      return VideoCodec.H264
    }

    if (fileName.includes('h265') || fileName.includes('h.265')) {
      return VideoCodec.H265
    }

    if (fileName.includes('vp9')) {
      return VideoCodec.VP9
    }

    if (fileName.includes('vp8')) {
      return VideoCodec.VP8
    }

    if (fileName.includes('av1')) {
      return VideoCodec.AV1
    }

    // Default fallback
    return VideoCodec.H264
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.')
    return lastDot >= 0 ? fileName.slice(lastDot) : ''
  }
}
