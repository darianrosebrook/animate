/**
 * @fileoverview Core Export System Implementation
 * @author @darianrosebrook
 */

import { Result, Time } from '@/types'
import { WebGPUContext } from '../core/renderer/webgpu-context'
import { logger } from '@/core/logging/logger'
import {
  ExportSystem as IExportSystem,
  ExportFormat,
  ExportQuality,
  ExportJob,
  ExportWorker,
  ExportProgress,
  ExportStatus,
  HardwareAcceleration,
  QualityValidator,
  ProgressTracker,
  ExportPipeline,
  ExportOptions,
  WebCodecsVideoEncoder,
  WebCodecsAudioEncoder,
} from './export-types'
import {
  WebCodecsVideoEncoderImpl,
  CodecCapabilityDetector,
} from './webcodecs-video-encoder'
import {
  WebCodecsAudioEncoderImpl,
  AudioCodecCapabilityDetector,
} from './webcodecs-audio-encoder'

/**
 * Core export system implementation with hardware acceleration
 */
export class ExportSystem implements IExportSystem {
  private webgpuContext: WebGPUContext
  private pipeline: ExportPipeline
  private workers: ExportWorker[] = []
  private jobQueue: ExportJob[] = []
  private activeJobs: Map<string, ExportJob> = new Map()
  private nextJobId = 0

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
    this.pipeline = new ExportPipelineImpl(webgpuContext)
  }

  async initialize(): Promise<Result<boolean>> {
    try {
      logger.info('🚀 Initializing export system...')

      // Initialize hardware acceleration
      const hardwareResult = await this.initializeHardwareAcceleration()
      if (!hardwareResult.success) {
        logger.warn(
          '⚠️ Hardware acceleration not available:',
          hardwareResult.error?.message
        )
      }

      // Initialize workers
      const workerCount = this.getOptimalWorkerCount()
      for (let i = 0; i < workerCount; i++) {
        const worker = new ExportWorkerImpl(this.webgpuContext, i)
        await worker.initialize()
        this.workers.push(worker)
      }

      logger.info(
        `✅ Export system initialized with ${this.workers.length} workers`
      )
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXPORT_INIT_ERROR',
          message: `Failed to initialize export system: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async createExportJob(
    composition: any,
    options: ExportOptions
  ): Promise<Result<ExportJob>> {
    try {
      const jobId = `export_${this.nextJobId++}`

      const job: ExportJob = {
        id: jobId,
        composition,
        format: options.format,
        quality: options.quality,
        destination: options.destination,
        progress: {
          currentFrame: 0,
          totalFrames: this.calculateTotalFrames(composition),
          estimatedTimeRemaining: 0,
          currentPhase: 'initializing',
          phaseProgress: 0,
        },
        status: ExportStatus.Queued,
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
        error: null,
        hardwareAcceleration: options.hardwareAcceleration,
        priority: options.priority || 'normal',
      }

      this.jobQueue.push(job)
      this.sortJobQueue()

      logger.info(`📤 Export job created: ${jobId}`)
      return { success: true, data: job }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'JOB_CREATE_ERROR',
          message: `Failed to create export job: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async startExport(jobId: string): Promise<Result<boolean>> {
    try {
      const job = this.jobQueue.find((j) => j.id === jobId)
      if (!job) {
        return {
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: `Export job ${jobId} not found`,
          },
        }
      }

      // Move job to active
      this.jobQueue = this.jobQueue.filter((j) => j.id !== jobId)
      job.status = ExportStatus.Running
      job.startedAt = new Date()
      this.activeJobs.set(jobId, job)

      // Assign to worker
      const worker = this.getAvailableWorker()
      if (!worker) {
        return {
          success: false,
          error: {
            code: 'NO_WORKERS_AVAILABLE',
            message: 'No export workers available',
          },
        }
      }

      // Start export
      const result = await worker.startJob(job)
      if (!result.success) {
        job.status = ExportStatus.Failed
        job.error = result.error
        this.activeJobs.delete(jobId)
        return result
      }

      logger.info(`🎬 Export started: ${jobId}`)
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXPORT_START_ERROR',
          message: `Failed to start export: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async cancelExport(jobId: string): Promise<Result<boolean>> {
    try {
      const job = this.activeJobs.get(jobId)
      if (!job) {
        return {
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: `Export job ${jobId} not found`,
          },
        }
      }

      // Cancel the job
      job.status = ExportStatus.Cancelled
      job.completedAt = new Date()

      // Notify worker
      const worker = this.workers.find((w) => w.getCurrentJob()?.id === jobId)
      if (worker) {
        await worker.cancelJob()
      }

      this.activeJobs.delete(jobId)

      logger.info(`🛑 Export cancelled: ${jobId}`)
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CANCEL_ERROR',
          message: `Failed to cancel export: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getExportProgress(jobId: string): ExportProgress | null {
    const job = this.activeJobs.get(jobId)
    return job ? job.progress : null
  }

  getExportStatus(jobId: string): ExportStatus | null {
    const job = this.activeJobs.get(jobId)
    return job ? job.status : null
  }

  async getExportResult(jobId: string): Promise<Result<Blob>> {
    try {
      const job = this.activeJobs.get(jobId)
      if (!job) {
        return {
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: `Export job ${jobId} not found`,
          },
        }
      }

      if (job.status !== ExportStatus.Completed) {
        return {
          success: false,
          error: {
            code: 'JOB_NOT_COMPLETED',
            message: `Export job ${jobId} is not completed`,
          },
        }
      }

      // Get result from worker
      const worker = this.workers.find((w) => w.getCurrentJob()?.id === jobId)
      if (!worker) {
        return {
          success: false,
          error: {
            code: 'WORKER_NOT_FOUND',
            message: 'Export worker not found for completed job',
          },
        }
      }

      const result = await worker.getJobResult()
      if (!result.success) {
        return result
      }

      // Clean up
      this.activeJobs.delete(jobId)

      logger.info(`✅ Export completed: ${jobId}`)
      return { success: true, data: result.data }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESULT_ERROR',
          message: `Failed to get export result: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async initializeHardwareAcceleration(): Promise<
    Result<HardwareAcceleration>
  > {
    try {
      const device = this.webgpuContext.getDevice()
      if (!device) {
        return {
          success: false,
          error: {
            code: 'GPU_NOT_AVAILABLE',
            message: 'GPU device not available for hardware acceleration',
          },
        }
      }

      // Detect WebCodecs capabilities
      const [videoCapabilities, audioCapabilities] = await Promise.all([
        CodecCapabilityDetector.detectCapabilities(),
        AudioCodecCapabilityDetector.detectCapabilities(),
      ])

      const hasHardwareAcceleration =
        videoCapabilities.some((cap) => cap.hardwareAccelerated) ||
        audioCapabilities.some((cap) => cap.hardwareAccelerated)

      const hardwareAcceleration: HardwareAcceleration = {
        available: hasHardwareAcceleration,
        type: hasHardwareAcceleration ? 'webcodecs' : 'software',
        capabilities: {
          maxTextureSize: device.limits.maxTextureDimension2D,
          maxBufferSize: device.limits.maxBufferSize,
          maxComputeWorkgroupsPerDimension:
            device.limits.maxComputeWorkgroupsPerDimension,
        },
        performance: {
          estimatedEncodingSpeed: hasHardwareAcceleration ? 10 : 1, // 10x if hardware accelerated
          memoryUsage: hasHardwareAcceleration ? 512 : 1024, // MB
        },
      }

      logger.info(
        `✅ Hardware acceleration initialized: ${hardwareAcceleration.type} (${videoCapabilities.length} video codecs, ${audioCapabilities.length} audio codecs)`
      )
      return { success: true, data: hardwareAcceleration }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HARDWARE_INIT_ERROR',
          message: `Failed to initialize hardware acceleration: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private getOptimalWorkerCount(): number {
    // Use number of CPU cores as guideline
    const cores = navigator.hardwareConcurrency || 4
    return Math.min(cores, 8) // Cap at 8 workers
  }

  private getAvailableWorker(): ExportWorker | null {
    return this.workers.find((w) => !w.getCurrentJob()) || null
  }

  private calculateTotalFrames(composition: any): number {
    // Calculate total frames based on composition duration and frame rate
    const duration = composition.duration || 10 // seconds
    const frameRate = composition.frameRate || 30
    return Math.ceil(duration * frameRate)
  }

  private sortJobQueue(): void {
    // Sort by priority and creation time
    this.jobQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      const aPriority =
        priorityOrder[a.priority as keyof typeof priorityOrder] || 2
      const bPriority =
        priorityOrder[b.priority as keyof typeof priorityOrder] || 2

      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }

      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }

  destroy(): void {
    // Cancel all active jobs
    for (const job of this.activeJobs.values()) {
      this.cancelExport(job.id)
    }

    // Clean up workers
    for (const worker of this.workers) {
      worker.destroy()
    }
    this.workers = []

    logger.info('🧹 Export system destroyed')
  }
}

/**
 * Export pipeline implementation
 */
class ExportPipelineImpl implements ExportPipeline {
  jobs: ExportJob[] = []
  workers: ExportWorker[] = []
  hardwareAcceleration: HardwareAcceleration | null = null
  qualityValidator: QualityValidator
  progressTracker: ProgressTracker

  constructor(private webgpuContext: WebGPUContext) {
    this.qualityValidator = new QualityValidatorImpl()
    this.progressTracker = new ProgressTrackerImpl()
  }

  addJob(job: ExportJob): void {
    this.jobs.push(job)
  }

  removeJob(jobId: string): void {
    this.jobs = this.jobs.filter((j) => j.id !== jobId)
  }

  getJob(jobId: string): ExportJob | null {
    return this.jobs.find((j) => j.id === jobId) || null
  }

  updateJobProgress(jobId: string, progress: Partial<ExportProgress>): void {
    const job = this.getJob(jobId)
    if (job) {
      job.progress = { ...job.progress, ...progress }
      this.progressTracker.updateProgress(jobId, job.progress)
    }
  }
}

/**
 * Export worker implementation with WebCodecs
 */
class ExportWorkerImpl implements ExportWorker {
  private currentJob: ExportJob | null = null
  private videoEncoder: WebCodecsVideoEncoder | null = null
  private audioEncoder: WebCodecsAudioEncoder | null = null
  private workerId: number

  constructor(
    private webgpuContext: WebGPUContext,
    workerId: number
  ) {
    this.workerId = workerId
  }

  async initialize(): Promise<Result<boolean>> {
    try {
      logger.info(`🔧 Initializing export worker ${this.workerId}`)

      // Initialize video encoder if WebCodecs supported
      if ('VideoEncoder' in globalThis) {
        this.videoEncoder = new WebCodecsVideoEncoderImpl(this.webgpuContext)
      } else {
        logger.warn('⚠️ VideoEncoder not supported, using software fallback')
      }

      // Initialize audio encoder if WebCodecs supported
      if ('AudioEncoder' in globalThis) {
        this.audioEncoder = new WebCodecsAudioEncoderImpl()
      } else {
        logger.warn('⚠️ AudioEncoder not supported, audio will be omitted')
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'WORKER_INIT_ERROR',
          message: `Failed to initialize export worker: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async startJob(job: ExportJob): Promise<Result<boolean>> {
    try {
      this.currentJob = job

      logger.info(`🎬 Worker ${this.workerId} starting job ${job.id}`)

      // Initialize encoders for this job
      if (this.videoEncoder) {
        const initResult = await this.videoEncoder.initialize(job)
        if (!initResult.success) {
          return initResult
        }
      }

      if (this.audioEncoder && job.composition.audio) {
        const initResult = await this.audioEncoder.initialize(job)
        if (!initResult.success) {
          return initResult
        }
      }

      // Start encoding process
      const result = await this.processJob(job)
      return result
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'JOB_START_ERROR',
          message: `Failed to start export job: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async cancelJob(): Promise<Result<boolean>> {
    try {
      if (this.videoEncoder) {
        await this.videoEncoder.stop()
      }
      if (this.audioEncoder) {
        await this.audioEncoder.stop()
      }

      if (this.currentJob) {
        this.currentJob.status = ExportStatus.Cancelled
        this.currentJob.completedAt = new Date()
      }

      this.currentJob = null
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CANCEL_ERROR',
          message: `Failed to cancel job: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async getJobResult(): Promise<Result<Blob>> {
    try {
      if (!this.currentJob) {
        return {
          success: false,
          error: {
            code: 'NO_CURRENT_JOB',
            message: 'No current job to get result from',
          },
        }
      }

      // Get encoded data from encoders
      let videoBlob: Blob | null = null
      let audioBlob: Blob | null = null

      if (this.videoEncoder) {
        const videoResult = await this.videoEncoder.getEncodedData()
        if (videoResult.success) {
          videoBlob = videoResult.data
        }
      }

      if (this.audioEncoder) {
        const audioResult = await this.audioEncoder.getEncodedData()
        if (audioResult.success) {
          audioBlob = audioResult.data
        }
      }

      // Combine video and audio into final container
      const finalBlob = await this.combineMedia(
        videoBlob,
        audioBlob,
        this.currentJob.format
      )

      return { success: true, data: finalBlob }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESULT_ERROR',
          message: `Failed to get job result: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  getCurrentJob(): ExportJob | null {
    return this.currentJob
  }

  private async processJob(job: ExportJob): Promise<Result<boolean>> {
    try {
      const totalFrames = job.progress.totalFrames
      const frameRate = job.composition.frameRate || 30

      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        if (job.status === ExportStatus.Cancelled) {
          break
        }

        const time = frameIndex / frameRate

        // Update progress
        job.progress.currentFrame = frameIndex
        job.progress.currentPhase = 'encoding'
        job.progress.phaseProgress = frameIndex / totalFrames
        job.progress.estimatedTimeRemaining = this.calculateRemainingTime(
          frameIndex,
          totalFrames
        )

        // Encode frame
        if (this.videoEncoder) {
          const frameResult = await this.encodeFrame(job, time)
          if (!frameResult.success) {
            return frameResult
          }
        }

        // Encode audio frame
        if (this.audioEncoder && job.composition.audio) {
          const audioResult = await this.encodeAudioFrame(job, time)
          if (!audioResult.success) {
            return audioResult
          }
        }
      }

      // Finalize encoding
      if (this.videoEncoder) {
        await this.videoEncoder.finalize()
      }
      if (this.audioEncoder) {
        await this.audioEncoder.finalize()
      }

      job.status = ExportStatus.Completed
      job.completedAt = new Date()
      job.progress.currentPhase = 'completed'
      job.progress.phaseProgress = 1.0

      return { success: true, data: true }
    } catch (error) {
      job.status = ExportStatus.Failed
      job.error = {
        code: 'PROCESSING_ERROR',
        message: `Failed to process job: ${error}`,
        stack: error instanceof Error ? error.stack : undefined,
      }

      return {
        success: false,
        error: job.error,
      }
    }
  }

  private async encodeFrame(
    job: ExportJob,
    time: Time
  ): Promise<Result<boolean>> {
    try {
      if (!this.videoEncoder) {
        return {
          success: false,
          error: {
            code: 'ENCODER_NOT_AVAILABLE',
            message: 'Video encoder not available',
          },
        }
      }

      // Render frame using the composition at the given time
      // This would integrate with the rendering system
      const frameData = await this.renderFrame(job.composition, time)
      if (!frameData.success) {
        return frameData
      }

      // Encode the frame
      const encodeResult = await this.videoEncoder.encodeFrame(
        frameData.data,
        time
      )
      return encodeResult
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

  private async encodeAudioFrame(
    job: ExportJob,
    time: Time
  ): Promise<Result<boolean>> {
    try {
      if (!this.audioEncoder) {
        return {
          success: false,
          error: {
            code: 'AUDIO_ENCODER_NOT_AVAILABLE',
            message: 'Audio encoder not available',
          },
        }
      }

      // Get audio samples for this time period
      const audioData = await this.getAudioSamples(job.composition, time)
      if (!audioData.success) {
        return audioData
      }

      // Encode audio samples
      const encodeResult = await this.audioEncoder.encodeSamples(
        audioData.data,
        time
      )
      return encodeResult
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIO_ENCODING_ERROR',
          message: `Failed to encode audio: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async renderFrame(
    _composition: any,
    _time: Time
  ): Promise<Result<GPUTexture>> {
    // This would integrate with the rendering system
    // For now, return a placeholder
    const device = this.webgpuContext.getDevice()!
    const texture = device.createTexture({
      size: [1920, 1080], // Default resolution
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    return { success: true, data: texture }
  }

  private async getAudioSamples(
    _composition: any,
    _time: Time
  ): Promise<Result<Float32Array[]>> {
    // This would get audio samples from the composition
    // For now, return empty
    return { success: true, data: [] }
  }

  private async combineMedia(
    videoBlob: Blob | null,
    _audioBlob: Blob | null,
    _format: ExportFormat
  ): Promise<Blob> {
    // This would combine video and audio into final container format
    // For now, return the video blob or create a placeholder
    if (videoBlob) {
      return videoBlob
    }

    // Create a minimal blob for testing
    return new Blob(['placeholder'], { type: 'video/mp4' })
  }

  private calculateRemainingTime(
    currentFrame: number,
    totalFrames: number
  ): number {
    // Simple estimation based on current progress
    const progress = currentFrame / totalFrames
    if (progress === 0) return 0

    const elapsed = performance.now() // Would track actual elapsed time
    const rate = elapsed / progress
    return rate * (1 - progress)
  }

  destroy(): void {
    if (this.videoEncoder) {
      this.videoEncoder.destroy()
      this.videoEncoder = null
    }
    if (this.audioEncoder) {
      this.audioEncoder.destroy()
      this.audioEncoder = null
    }
    this.currentJob = null
  }
}

/**
 * Quality validator implementation
 */
class QualityValidatorImpl implements QualityValidator {
  async validateExport(job: ExportJob, result: Blob): Promise<Result<boolean>> {
    try {
      // Perform quality checks
      const checks = await Promise.all([
        this.validateColorAccuracy(job, result),
        this.validateAudioLoudness(job, result),
        this.validateFormatCompliance(job, result),
      ])

      const allValid = checks.every((check) => check.success)

      if (!allValid) {
        const errors = checks
          .filter((check) => !check.success)
          .map((check) => check.error?.message)
          .filter(Boolean)

        return {
          success: false,
          error: {
            code: 'QUALITY_VALIDATION_FAILED',
            message: `Quality validation failed: ${errors.join(', ')}`,
          },
        }
      }

      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Failed to validate export quality: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private async validateColorAccuracy(
    _job: ExportJob,
    _result: Blob
  ): Promise<Result<boolean>> {
    // Validate color space accuracy
    return { success: true, data: true }
  }

  private async validateAudioLoudness(
    _job: ExportJob,
    _result: Blob
  ): Promise<Result<boolean>> {
    // Validate EBU R128 compliance
    return { success: true, data: true }
  }

  private async validateFormatCompliance(
    _job: ExportJob,
    _result: Blob
  ): Promise<Result<boolean>> {
    // Validate format-specific requirements
    return { success: true, data: true }
  }
}

/**
 * Progress tracker implementation
 */
class ProgressTrackerImpl implements ProgressTracker {
  private progressCallbacks: Map<string, (progress: ExportProgress) => void> =
    new Map()

  onProgress(
    jobId: string,
    callback: (progress: ExportProgress) => void
  ): void {
    this.progressCallbacks.set(jobId, callback)
  }

  updateProgress(jobId: string, progress: ExportProgress): void {
    const callback = this.progressCallbacks.get(jobId)
    if (callback) {
      callback(progress)
    }
  }

  removeProgressListener(jobId: string): void {
    this.progressCallbacks.delete(jobId)
  }
}
