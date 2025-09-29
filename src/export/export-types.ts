/**
 * @fileoverview Core Export System Types and Interfaces
 * @author @darianrosebrook
 */

import { Result, Time } from '@/types'

/**
 * Export format definitions
 */
export enum ExportFormat {
  MP4_H264 = 'mp4_h264',
  MP4_H265 = 'mp4_h265',
  MOV_ProRes = 'mov_prores',
  MOV_DNxHD = 'mov_dnxhd',
  WebM_VP9 = 'webm_vp9',
  WebM_AV1 = 'webm_av1',
  GIF = 'gif',
}

export interface ExportFormatInfo {
  container: string
  codec: string
  mimeType: string
  extension: string
  supportsAlpha: boolean
  hardwareAcceleration: boolean
}

/**
 * Export quality presets
 */
export enum ExportQuality {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Lossless = 'lossless',
}

export interface QualitySettings {
  bitrate: number
  crf?: number // Constant Rate Factor for quality-based encoding
  preset:
    | 'ultrafast'
    | 'superfast'
    | 'veryfast'
    | 'faster'
    | 'fast'
    | 'medium'
    | 'slow'
    | 'slower'
    | 'veryslow'
    | 'placebo'
}

/**
 * Export job status
 */
export enum ExportStatus {
  Queued = 'queued',
  Running = 'running',
  Paused = 'paused',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

/**
 * Export progress information
 */
export interface ExportProgress {
  currentFrame: number
  totalFrames: number
  estimatedTimeRemaining: number // seconds
  currentPhase:
    | 'initializing'
    | 'encoding'
    | 'finalizing'
    | 'completed'
    | 'failed'
  phaseProgress: number // 0-1
  bytesProcessed?: number
  averageFrameTime?: number
}

/**
 * Export destination options
 */
export interface ExportDestination {
  type: 'file' | 'stream' | 'memory'
  path?: string
  format: ExportFormat
  overwrite: boolean
}

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat
  quality: ExportQuality
  destination: ExportDestination
  startTime?: Time
  endTime?: Time
  resolution?: { width: number; height: number }
  frameRate?: number
  hardwareAcceleration?: boolean
  priority?: 'low' | 'normal' | 'high'
  includeAudio?: boolean
  audioBitrate?: number
}

/**
 * Export job definition
 */
export interface ExportJob {
  id: string
  composition: any // Composition object
  format: ExportFormat
  quality: ExportQuality
  destination: ExportDestination
  progress: ExportProgress
  status: ExportStatus
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
  error: { code: string; message: string; stack?: string } | null
  hardwareAcceleration: boolean
  priority: 'low' | 'normal' | 'high'
}

/**
 * Export worker interface
 */
export interface ExportWorker {
  initialize(): Promise<Result<boolean>>
  startJob(job: ExportJob): Promise<Result<boolean>>
  cancelJob(): Promise<Result<boolean>>
  getJobResult(): Promise<Result<Blob>>
  getCurrentJob(): ExportJob | null
  destroy(): void
}

/**
 * Hardware acceleration capabilities
 */
export interface HardwareAcceleration {
  available: boolean
  type: 'webgpu' | 'webcodecs' | 'software'
  capabilities: {
    maxTextureSize: number
    maxBufferSize: number
    maxComputeWorkgroupsPerDimension: number
  }
  performance: {
    estimatedEncodingSpeed: number // multiplier over software
    memoryUsage: number // MB
  }
}

/**
 * Quality validator interface
 */
export interface QualityValidator {
  validateExport(job: ExportJob, result: Blob): Promise<Result<boolean>>
}

/**
 * Progress tracker interface
 */
export interface ProgressTracker {
  onProgress(jobId: string, callback: (progress: ExportProgress) => void): void
  updateProgress(jobId: string, progress: ExportProgress): void
  removeProgressListener(jobId: string): void
}

/**
 * Export pipeline interface
 */
export interface ExportPipeline {
  jobs: ExportJob[]
  workers: ExportWorker[]
  hardwareAcceleration: HardwareAcceleration | null
  qualityValidator: QualityValidator
  progressTracker: ProgressTracker

  addJob(job: ExportJob): void
  removeJob(jobId: string): void
  getJob(jobId: string): ExportJob | null
  updateJobProgress(jobId: string, progress: Partial<ExportProgress>): void
}

/**
 * Video encoder interface
 */
export interface VideoEncoder {
  initialize(job: ExportJob): Promise<Result<boolean>>
  encodeFrame(texture: GPUTexture, time: Time): Promise<Result<boolean>>
  finalize(): Promise<Result<boolean>>
  getEncodedData(): Promise<Result<Blob>>
  stop(): Promise<Result<boolean>>
  destroy(): void
}

/**
 * Audio encoder interface
 */
export interface AudioEncoder {
  initialize(job: ExportJob): Promise<Result<boolean>>
  encodeSamples(samples: Float32Array[], time: Time): Promise<Result<boolean>>
  finalize(): Promise<Result<boolean>>
  getEncodedData(): Promise<Result<Blob>>
  stop(): Promise<Result<boolean>>
  destroy(): void
}

/**
 * Export preset definition
 */
export interface ExportPreset {
  id: string
  name: string
  description: string
  format: ExportFormat
  quality: ExportQuality
  options: Partial<ExportOptions>
  category: 'professional' | 'web' | 'social' | 'archive'
}

/**
 * Export system main interface
 */
export interface ExportSystem {
  initialize(): Promise<Result<boolean>>
  createExportJob(
    composition: any,
    options: ExportOptions
  ): Promise<Result<ExportJob>>
  startExport(jobId: string): Promise<Result<boolean>>
  cancelExport(jobId: string): Promise<Result<boolean>>
  getExportProgress(jobId: string): ExportProgress | null
  getExportStatus(jobId: string): ExportStatus | null
  getExportResult(jobId: string): Promise<Result<Blob>>
  destroy(): void
}
