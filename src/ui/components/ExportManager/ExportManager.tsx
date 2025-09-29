/**
 * @fileoverview Export Manager component for rendering and exporting compositions
 * @author @darianrosebrook
 */

import React, { useState, useCallback } from 'react'
import {
  Download,
  Settings,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileVideo,
  FileImage,
  Monitor,
  HardDrive,
  Clock,
  Zap,
  RefreshCw,
} from 'lucide-react'
import {
  ExportFormat,
  ExportQuality,
  ExportSettings,
  ExportJob,
  Project,
  Scene,
  CompressionLevel,
} from '@/types'

interface ExportManagerProps {
  project: Project
  currentScene: Scene | null
  isOpen: boolean
  onClose: () => void
  onExportStart: (settings: ExportSettings) => void
  onExportCancel: (jobId: string) => void
}

export function ExportManager({
  project,
  currentScene,
  isOpen,
  onClose,
  onExportStart,
  onExportCancel,
}: ExportManagerProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    ExportFormat.MP4
  )
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: ExportFormat.MP4,
    quality: 'high' as ExportQuality,
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    colorSpace: 'sRGB' as any, // TODO: Fix ColorSpace enum usage
    includeAudio: true,
    compression: CompressionLevel.Balanced,
  })

  const [activeJobs, setActiveJobs] = useState<ExportJob[]>([])

  const handleExportStart = useCallback(() => {
    const job: ExportJob = {
      id: `export-${Date.now()}`,
      name: `${currentScene?.name || 'Scene'} Export`,
      settings: { ...exportSettings, format: selectedFormat },
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
    }

    setActiveJobs((prev) => [...prev, job])
    onExportStart({ ...exportSettings, format: selectedFormat })
  }, [exportSettings, selectedFormat, currentScene, onExportStart])

  const handleJobCancel = useCallback(
    (jobId: string) => {
      setActiveJobs((prev) => prev.filter((job) => job.id !== jobId))
      onExportCancel(jobId)
    },
    [onExportCancel]
  )

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case ExportFormat.MP4:
      case ExportFormat.WebM:
      case ExportFormat.H264:
      case ExportFormat.H265:
        return <FileVideo size={16} />
      case ExportFormat.PNGSequence:
      case ExportFormat.JPEGSequence:
        return <FileImage size={16} />
      case ExportFormat.GIF:
        return <Monitor size={16} />
      default:
        return <Download size={16} />
    }
  }

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'low':
        return 'Low (Fast)'
      case 'medium':
        return 'Medium'
      case 'high':
        return 'High (Slow)'
      default:
        return quality
    }
  }

  if (!isOpen) return null

  return (
    <div className="export-manager-overlay">
      <div className="export-manager">
        {/* Header */}
        <div className="export-manager-header">
          <h2>Export Manager</h2>
          <button className="close-btn" onClick={onClose}>
            <XCircle size={20} />
          </button>
        </div>

        <div className="export-manager-content">
          {/* Export Settings */}
          <div className="export-section">
            <h3>Export Settings</h3>

            {/* Format Selection */}
            <div className="setting-group">
              <label>Format</label>
              <div className="format-grid">
                {Object.values(ExportFormat).map((format) => (
                  <button
                    key={format}
                    className={`format-btn ${selectedFormat === format ? 'selected' : ''}`}
                    onClick={() => setSelectedFormat(format)}
                  >
                    {getFormatIcon(format)}
                    <span>{format.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="setting-group">
              <label>Quality</label>
              <select
                value={exportSettings.quality}
                onChange={(e) =>
                  setExportSettings((prev) => ({
                    ...prev,
                    quality: e.target.value as ExportQuality,
                  }))
                }
                className="quality-select"
              >
                <option value="low">Low (Fast)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Slow)</option>
              </select>
            </div>

            {/* Resolution */}
            <div className="setting-group">
              <label>Resolution</label>
              <div className="resolution-inputs">
                <input
                  type="number"
                  value={exportSettings.resolution.width}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      resolution: {
                        ...prev.resolution,
                        width: parseInt(e.target.value) || 1920,
                      },
                    }))
                  }
                  placeholder="Width"
                  min="1"
                  max="7680"
                />
                <span>×</span>
                <input
                  type="number"
                  value={exportSettings.resolution.height}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      resolution: {
                        ...prev.resolution,
                        height: parseInt(e.target.value) || 1080,
                      },
                    }))
                  }
                  placeholder="Height"
                  min="1"
                  max="4320"
                />
              </div>
            </div>

            {/* Frame Rate */}
            <div className="setting-group">
              <label>Frame Rate</label>
              <select
                value={exportSettings.frameRate}
                onChange={(e) =>
                  setExportSettings((prev) => ({
                    ...prev,
                    frameRate: parseFloat(e.target.value),
                  }))
                }
                className="framerate-select"
              >
                <option value={24}>24 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
                <option value={120}>120 fps</option>
              </select>
            </div>

            {/* Advanced Options */}
            <div className="setting-group">
              <label>Options</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeAudio}
                    onChange={(e) =>
                      setExportSettings((prev) => ({
                        ...prev,
                        includeAudio: e.target.checked,
                      }))
                    }
                  />
                  Include Audio
                </label>
              </div>
            </div>
          </div>

          {/* Export Queue */}
          <div className="export-section">
            <h3>Export Queue</h3>

            {activeJobs.length === 0 ? (
              <div className="empty-queue">
                <Download size={48} />
                <p>No active exports</p>
              </div>
            ) : (
              <div className="export-queue">
                {activeJobs.map((job) => (
                  <div key={job.id} className="export-job">
                    <div className="job-header">
                      <div className="job-info">
                        <span className="job-name">{job.name}</span>
                        <span className="job-format">
                          {job.settings.format.toUpperCase()}
                        </span>
                      </div>
                      <div className="job-status">
                        {job.status === 'queued' && (
                          <Clock size={14} className="status-icon queued" />
                        )}
                        {job.status === 'processing' && (
                          <RefreshCw
                            size={14}
                            className="status-icon processing"
                          />
                        )}
                        {job.status === 'completed' && (
                          <CheckCircle
                            size={14}
                            className="status-icon completed"
                          />
                        )}
                        {job.status === 'failed' && (
                          <XCircle size={14} className="status-icon failed" />
                        )}
                        <span className={`status-text ${job.status}`}>
                          {job.status === 'queued' && 'Queued'}
                          {job.status === 'processing' &&
                            `Processing ${job.progress}%`}
                          {job.status === 'completed' && 'Completed'}
                          {job.status === 'failed' && 'Failed'}
                        </span>
                      </div>
                    </div>

                    {job.status === 'processing' && (
                      <div className="job-progress">
                        <div
                          className="progress-bar"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}

                    {job.outputPath && (
                      <div className="job-output">
                        <HardDrive size={12} />
                        <span>{job.outputPath}</span>
                      </div>
                    )}

                    {job.error && (
                      <div className="job-error">
                        <AlertTriangle size={12} />
                        <span>{job.error}</span>
                      </div>
                    )}

                    {(job.status === 'queued' ||
                      job.status === 'processing') && (
                      <div className="job-actions">
                        <button
                          className="cancel-btn"
                          onClick={() => handleJobCancel(job.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="export-manager-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn-primary export-btn"
            onClick={handleExportStart}
            disabled={!currentScene}
          >
            <Download size={16} />
            Start Export
          </button>
        </div>
      </div>
    </div>
  )
}
