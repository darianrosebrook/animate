/**
 * @fileoverview Core Media Pipeline Types and Interfaces
 * @author @darianrosebrook
 */

import { Result, AnimatorError, Time, Point2D, Size2D, Color } from '@/types'

/**
 * Media asset types
 */
export enum MediaType {
  Video = 'video',
  Image = 'image',
  Audio = 'audio',
  ImageSequence = 'image_sequence',
}

/**
 * Video codec types
 */
export enum VideoCodec {
  H264 = 'h264',
  H265 = 'h265',
  VP8 = 'vp8',
  VP9 = 'vp9',
  AV1 = 'av1',
  ProRes = 'prores',
  DNxHD = 'dnxhd',
  Cineform = 'cineform',
}

/**
 * Audio codec types
 */
export enum AudioCodec {
  AAC = 'aac',
  MP3 = 'mp3',
  FLAC = 'flac',
  WAV = 'wav',
  Opus = 'opus',
}

/**
 * Media metadata interface
 */
export interface MediaMetadata {
  width?: number
  height?: number
  duration?: number
  frameRate?: number
  sampleRate?: number // for audio
  channels?: number // for audio
  bitRate?: number
  codec?: VideoCodec | AudioCodec
  colorSpace?: string
  hasAlpha?: boolean
  hasAudio?: boolean
  fileSize?: number
  creationDate?: Date
}

/**
 * Media asset definition
 */
export interface MediaAsset {
  id: string
  name: string
  type: MediaType
  filePath: string
  metadata: MediaMetadata
  thumbnail?: GPUTexture
  duration?: number
  resolution?: Size2D
  createdAt: Date
  lastModified: Date
}

/**
 * Video decoder interface
 */
export interface VideoDecoder {
  initialize(videoFile: File): Promise<Result<boolean>>
  decodeFrame(time: Time): Promise<Result<GPUTexture>>
  seek(time: Time): Promise<Result<boolean>>
  getDuration(): number
  getFrameRate(): number
  getCurrentTime(): Time
  isHardwareAccelerated(): boolean
  destroy(): void
}

/**
 * Audio analyzer interface
 */
export interface AudioAnalyzer {
  initialize(audioBuffer: AudioBuffer): Promise<Result<boolean>>
  getWaveformData(startTime: Time, endTime: Time): Float32Array[]
  getPeakData(startTime: Time, endTime: Time): number[]
  getRMSData(startTime: Time, endTime: Time): number[]
  destroy(): void
}

/**
 * Media timeline track
 */
export interface MediaTimelineTrack {
  id: string
  name: string
  type: MediaType
  assets: MediaAsset[]
  currentTime: Time
  playbackRate: number
  volume?: number // for audio tracks
  muted?: boolean
  solo?: boolean
}

/**
 * Media import options
 */
export interface MediaImportOptions {
  generateThumbnails?: boolean
  thumbnailCount?: number
  analyzeAudio?: boolean
  generateWaveforms?: boolean
  targetResolution?: Size2D
  preserveAlpha?: boolean
}

/**
 * Media import result
 */
export interface MediaImportResult {
  assets: MediaAsset[]
  totalDuration: number
  importTime: number
  errors: string[]
  warnings: string[]
}

/**
 * Video frame data
 */
export interface VideoFrameData {
  texture: GPUTexture
  timestamp: Time
  frameNumber: number
  presentationTime: Time
}

/**
 * Audio frame data
 */
export interface AudioFrameData {
  samples: Float32Array
  timestamp: Time
  sampleRate: number
  channels: number
}

/**
 * Media playback state
 */
export interface MediaPlaybackState {
  isPlaying: boolean
  currentTime: Time
  playbackRate: number
  volume: number
  muted: boolean
  loop: boolean
}

/**
 * Media cache entry
 */
export interface MediaCacheEntry {
  assetId: string
  frameData: VideoFrameData | AudioFrameData
  accessCount: number
  lastAccessed: number
  memorySize: number
}

/**
 * Media pipeline configuration
 */
export interface MediaPipelineConfig {
  maxMemoryUsage: number // MB
  frameCacheSize: number
  thumbnailSize: Size2D
  audioBufferSize: number
  hardwareAcceleration: boolean
  quality: 'low' | 'medium' | 'high' | 'lossless'
}

/**
 * Media format detector
 */
export interface MediaFormatDetector {
  detectFormat(file: File): Promise<Result<MediaType>>
  getMetadata(file: File): Promise<Result<MediaMetadata>>
  validateFile(file: File): Promise<Result<boolean>>
  getSupportedFormats(): MediaType[]
}

/**
 * Media thumbnail generator
 */
export interface MediaThumbnailGenerator {
  generateThumbnail(asset: MediaAsset, time?: Time): Promise<Result<GPUTexture>>
  generateThumbnails(asset: MediaAsset, count: number): Promise<Result<GPUTexture[]>>
  destroy(): void
}

/**
 * Media export options
 */
export interface MediaExportOptions {
  format: 'mp4' | 'mov' | 'webm' | 'gif'
  quality: 'low' | 'medium' | 'high' | 'lossless'
  resolution: Size2D
  frameRate: number
  bitRate?: number
  includeAudio: boolean
  startTime: Time
  endTime: Time
}

/**
 * Media synchronization info
 */
export interface MediaSyncInfo {
  videoTime: Time
  audioTime: Time
  drift: number // difference in milliseconds
  isSynchronized: boolean
  lastSyncTime: number
}

/**
 * Media timeline integration
 */
export interface MediaTimelineIntegration {
  addMediaTrack(track: MediaTimelineTrack): Result<MediaTimelineTrack>
  removeMediaTrack(trackId: string): Result<boolean>
  updateMediaTrack(trackId: string, updates: Partial<MediaTimelineTrack>): Result<MediaTimelineTrack>
  getMediaTrack(trackId: string): MediaTimelineTrack | null
  syncMediaTracks(time: Time): Result<MediaSyncInfo>
  getMediaAssetsAtTime(time: Time): MediaAsset[]
}

/**
 * Media processing pipeline
 */
export interface MediaProcessingPipeline {
  processVideoFrame(inputTexture: GPUTexture, time: Time): Promise<Result<GPUTexture>>
  processAudioFrame(audioData: AudioFrameData): Promise<Result<AudioFrameData>>
  applyEffects(inputTexture: GPUTexture, effects: any[]): Promise<Result<GPUTexture>>
  compositeLayers(layers: GPUTexture[]): Promise<Result<GPUTexture>>
}

/**
 * Media asset library
 */
export interface MediaAssetLibrary {
  assets: MediaAsset[]
  search(query: string): MediaAsset[]
  filter(type?: MediaType, duration?: { min: number; max: number }): MediaAsset[]
  sort(by: 'name' | 'date' | 'duration' | 'size', ascending?: boolean): MediaAsset[]
  getAsset(id: string): MediaAsset | null
  addAsset(asset: MediaAsset): Result<void>
  removeAsset(id: string): Result<void>
  updateAsset(id: string, updates: Partial<MediaAsset>): Result<void>
}

/**
 * Media system main interface
 */
export interface MediaSystem {
  formatDetector: MediaFormatDetector
  thumbnailGenerator: MediaThumbnailGenerator
  assetLibrary: MediaAssetLibrary
  videoDecoder: VideoDecoder | null
  audioAnalyzer: AudioAnalyzer | null
  timelineIntegration: MediaTimelineIntegration
  processingPipeline: MediaProcessingPipeline

  initialize(config?: Partial<MediaPipelineConfig>): Promise<Result<boolean>>
  importMedia(files: File[], options?: MediaImportOptions): Promise<Result<MediaImportResult>>
  getAsset(id: string): MediaAsset | null
  decodeVideoFrame(assetId: string, time: Time): Promise<Result<VideoFrameData>>
  analyzeAudio(assetId: string): Promise<Result<Float32Array[]>>
  exportMedia(assetIds: string[], options: MediaExportOptions): Promise<Result<Blob>>
  destroy(): void
}
