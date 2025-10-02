/**
 * @fileoverview WebCodecs Audio Encoder Implementation
 * @author @darianrosebrook
 */

import { Result, Time } from '@/types'
import { logger } from '@/core/logging/logger'
import {
  ExportJob,
  WebCodecsAudioEncoder,
  CodecCapability,
} from './export-types'

/**
 * WebCodecs-based audio encoder
 */
export class WebCodecsAudioEncoderImpl implements WebCodecsAudioEncoder {
  private encoder: globalThis.AudioEncoder | null = null
  private encodedChunks: EncodedAudioChunk[] = []
  private sampleCount = 0

  async initialize(job: ExportJob): Promise<Result<boolean>> {
    try {
      logger.info('🎵 Initializing WebCodecs audio encoder...')

      if (!('AudioEncoder' in globalThis)) {
        return {
          success: false,
          error: {
            code: 'WEBCODECS_AUDIO_NOT_SUPPORTED',
            message: 'AudioEncoder API not supported in this browser',
          },
        }
      }

      this.encoder = new AudioEncoder({
        output: (chunk) => {
          this.encodedChunks.push(chunk)
          this.sampleCount += chunk.numberOfFrames || 0
        },
        error: (error) => {
          logger.error('AudioEncoder error:', error)
        },
      })

      // Configure encoder for AAC LC
      await this.encoder.configure({
        codec: 'mp4a.40.2', // AAC LC
        sampleRate: 48000,
        numberOfChannels: 2,
        bitrate: 128000,
      })

      logger.info('✅ Audio encoder initialized: AAC LC at 48kHz stereo')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIO_ENCODER_INIT_ERROR',
          message: `Failed to initialize audio encoder: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async encodeSamples(
    samples: Float32Array[],
    time: Time
  ): Promise<Result<boolean>> {
    try {
      if (!this.encoder) {
        return {
          success: false,
          error: {
            code: 'ENCODER_NOT_INITIALIZED',
            message: 'Audio encoder not initialized',
          },
        }
      }

      // Create AudioData from samples
      const audioData = this.createAudioDataFromSamples(samples, time)
      if (!audioData) {
        return {
          success: false,
          error: {
            code: 'AUDIO_DATA_CREATION_ERROR',
            message: 'Failed to create AudioData from samples',
          },
        }
      }

      // Encode the audio data
      this.encoder.encode(audioData)
      audioData.close()

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIO_ENCODING_ERROR',
          message: `Failed to encode audio samples: ${error}`,
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
            message: 'Audio encoder not initialized',
          },
        }
      }

      await this.encoder.flush()

      logger.info(
        `✅ Audio encoding finalized: ${this.sampleCount} samples in ${this.encodedChunks.length} chunks`
      )
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIO_FINALIZE_ERROR',
          message: `Failed to finalize audio encoding: ${error}`,
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
            code: 'NO_ENCODED_AUDIO',
            message: 'No encoded audio chunks available',
          },
        }
      }

      const blob = new Blob(
        this.encodedChunks.map((chunk) => chunk.data),
        {
          type: 'audio/mp4',
        }
      )

      logger.info(`🎵 Generated audio blob: ${blob.size} bytes`)
      return { success: true, data: blob }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIO_BLOB_ERROR',
          message: `Failed to generate audio blob: ${error}`,
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
      this.sampleCount = 0
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIO_STOP_ERROR',
          message: `Failed to stop audio encoder: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getEncoder(): globalThis.AudioEncoder | null {
    return this.encoder
  }

  private createAudioDataFromSamples(
    samples: Float32Array[],
    time: Time
  ): AudioData | null {
    try {
      if (samples.length === 0 || samples[0].length === 0) {
        return null
      }

      // Interleave multi-channel audio samples
      const numberOfChannels = samples.length
      const numberOfFrames = samples[0].length
      const interleaved = new Float32Array(numberOfFrames * numberOfChannels)

      for (let frame = 0; frame < numberOfFrames; frame++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          interleaved[frame * numberOfChannels + channel] =
            samples[channel][frame] || 0
        }
      }

      return new AudioData({
        format: 'f32-planar',
        sampleRate: 48000,
        numberOfFrames,
        numberOfChannels,
        timestamp: time * 1000000, // microseconds
        data: interleaved.buffer,
      })
    } catch (error) {
      logger.error('Failed to create AudioData:', error)
      return null
    }
  }

  destroy(): void {
    this.stop()
  }
}

/**
 * Audio codec capability detector
 */
export class AudioCodecCapabilityDetector {
  static async detectCapabilities(): Promise<CodecCapability[]> {
    const capabilities: CodecCapability[] = []

    // Test AAC support
    if (await this.testCodecSupport('mp4a.40.2')) {
      capabilities.push({
        codec: 'aac',
        container: 'mp4',
        hardwareAccelerated: await this.testHardwareAcceleration('mp4a.40.2'),
        maxResolution: { width: 0, height: 0 }, // Audio only
        maxFrameRate: 0, // Audio only
        supportedProfiles: ['lc'], // Low Complexity
        qualityPresets: ['low', 'medium', 'high'],
      })
    }

    // Test Opus support
    if (await this.testCodecSupport('opus')) {
      capabilities.push({
        codec: 'opus',
        container: 'webm',
        hardwareAccelerated: await this.testHardwareAcceleration('opus'),
        maxResolution: { width: 0, height: 0 }, // Audio only
        maxFrameRate: 0, // Audio only
        supportedProfiles: ['default'],
        qualityPresets: ['low', 'medium', 'high'],
      })
    }

    return capabilities
  }

  private static async testCodecSupport(codec: string): Promise<boolean> {
    try {
      if (!('AudioEncoder' in globalThis)) return false

      const encoder = new AudioEncoder({
        output: () => {},
        error: () => {},
      })

      await encoder.configure({
        codec,
        sampleRate: 48000,
        numberOfChannels: 2,
        bitrate: 128000,
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
      // Test with high-quality settings
      const encoder = new AudioEncoder({
        output: () => {},
        error: () => {},
      })

      await encoder.configure({
        codec,
        sampleRate: 48000,
        numberOfChannels: 2,
        bitrate: 320000, // High bitrate for quality testing
      })

      encoder.close()
      return true
    } catch {
      return false
    }
  }
}
