/**
 * @fileoverview Asset Library View for the Left Panel
 * @author @darianrosebrook
 */

import React, { useState, useCallback } from 'react'
import {
  Search,
  Plus,
  MoreHorizontal,
  Upload,
  Folder,
  FolderOpen,
  Image,
  Play,
} from 'lucide-react'
import { Asset, Library, AssetType } from '@/types'

interface AssetLibraryViewProps {
  assets: Asset[]
  libraries: Library[]
  onAssetSelect: (assetId: string) => void
  onAssetAdd: (asset: Asset) => void
  onLibraryConnect: (libraryId: string) => void
  getAssetIcon: (asset: Asset) => React.ReactNode
}

export function AssetLibraryView({
  assets,
  libraries,
  onAssetSelect,
  _onAssetAdd,
  _onLibraryConnect,
  getAssetIcon,
}: AssetLibraryViewProps) {
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(
    null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set()
  )

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )

    const matchesLibrary =
      !selectedLibraryId || asset.libraryId === selectedLibraryId

    return matchesSearch && matchesLibrary
  })

  const selectedLibrary = selectedLibraryId
    ? libraries.find((lib) => lib.id === selectedLibraryId)
    : null

  const handleAssetClick = useCallback(
    (asset: Asset, event: React.MouseEvent) => {
      if (event.metaKey || event.ctrlKey) {
        // Multi-select
        setSelectedAssetIds((prev) => {
          const newSet = new Set(prev)
          if (newSet.has(asset.id)) {
            newSet.delete(asset.id)
          } else {
            newSet.add(asset.id)
          }
          return newSet
        })
      } else {
        // Single select
        setSelectedAssetIds(new Set([asset.id]))
        onAssetSelect(asset.id)
      }
    },
    [onAssetSelect]
  )

  const handleLibraryClick = useCallback(
    (library: Library) => {
      setSelectedLibraryId(library.id === selectedLibraryId ? null : library.id)
    },
    [selectedLibraryId]
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getAssetTypeLabel = (type: AssetType) => {
    switch (type) {
      case AssetType.Image:
        return 'Image'
      case AssetType.Video:
        return 'Video'
      case AssetType.Audio:
        return 'Audio'
      case AssetType.Font:
        return 'Font'
      case AssetType.Template:
        return 'Template'
      case AssetType.Plugin:
        return 'Plugin'
      case AssetType.AnimationSequence:
        return 'Animation'
      case AssetType.Render:
        return 'Render'
      case AssetType.Component:
        return 'Component'
      default:
        return 'Asset'
    }
  }

  return (
    <div className="asset-library-view">
      {/* Library Selector */}
      <div className="library-selector">
        <div className="library-list">
          <div
            className={`library-item ${!selectedLibraryId ? 'selected' : ''}`}
            onClick={() => setSelectedLibraryId(null)}
          >
            <Folder size={16} />
            <span>All Assets</span>
            <span className="asset-count">({assets.length})</span>
          </div>

          {libraries.map((library) => (
            <div
              key={library.id}
              className={`library-item ${selectedLibraryId === library.id ? 'selected' : ''}`}
              onClick={() => handleLibraryClick(library)}
            >
              {selectedLibraryId === library.id ? (
                <FolderOpen size={16} />
              ) : (
                <Folder size={16} />
              )}
              <span>{library.name}</span>
              <span className="asset-count">({library.assets.length})</span>
              {!library.isConnected && (
                <div className="connection-indicator disconnected" />
              )}
            </div>
          ))}
        </div>

        <button className="add-library-btn">
          <Plus size={14} />
          Connect Library
        </button>
      </div>

      {/* Asset Grid */}
      <div className="asset-grid">
        {/* Search Bar */}
        <div className="asset-search">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="asset-search-input"
          />
        </div>

        {/* Asset Grid */}
        <div className="assets-container">
          {filteredAssets.length === 0 ? (
            <div className="empty-assets">
              <div className="empty-state">
                <Image size={48} />
                <h3>No assets found</h3>
                <p>
                  {searchQuery
                    ? `No assets match "${searchQuery}"`
                    : selectedLibrary
                      ? `No assets in "${selectedLibrary.name}"`
                      : 'No assets available'}
                </p>
                <button className="import-assets-btn">
                  <Upload size={16} />
                  Import Assets
                </button>
              </div>
            </div>
          ) : (
            <div className="asset-grid-items">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={`asset-item ${selectedAssetIds.has(asset.id) ? 'selected' : ''}`}
                  onClick={(e) => handleAssetClick(asset, e)}
                >
                  {/* Asset Thumbnail */}
                  <div className="asset-thumbnail">
                    {asset.thumbnail ? (
                      <img src={asset.thumbnail} alt={asset.name} />
                    ) : (
                      <div className="asset-placeholder">
                        {getAssetIcon(asset)}
                      </div>
                    )}
                  </div>

                  {/* Asset Info */}
                  <div className="asset-info">
                    <div className="asset-name">{asset.name}</div>
                    <div className="asset-meta">
                      <span className="asset-type">
                        {getAssetTypeLabel(asset.type)}
                      </span>
                      {asset.metadata.fileSize && (
                        <span className="asset-size">
                          {formatFileSize(asset.metadata.fileSize)}
                        </span>
                      )}
                      {asset.metadata.duration && (
                        <span className="asset-duration">
                          {asset.metadata.duration.toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Asset Actions */}
                  <div className="asset-actions">
                    <button className="asset-action-btn" title="Preview">
                      <Play size={12} />
                    </button>
                    <button className="asset-action-btn" title="More options">
                      <MoreHorizontal size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
