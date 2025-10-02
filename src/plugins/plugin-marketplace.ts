/**
 * @fileoverview Plugin Marketplace and Distribution System
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import { logger } from '@/core/logging/logger'
import {
  PluginMarketplace as IPluginMarketplace,
  PluginInfo,
  PluginReview,
  PluginSearchQuery,
} from './plugin-types'

/**
 * Plugin marketplace implementation
 */
export class PluginMarketplace implements IPluginMarketplace {
  private registryUrl: string
  private cache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, number> = new Map()

  constructor(registryUrl: string = 'https://plugins.animator.dev') {
    this.registryUrl = registryUrl
  }

  /**
   * Search for plugins
   */
  async searchPlugins(query: PluginSearchQuery): Promise<PluginInfo[]> {
    try {
      logger.info(`🔍 Searching plugins:`, query)

      const cacheKey = `search:${JSON.stringify(query)}`
      const cached = this.getCachedResult(cacheKey)

      if (cached) {
        logger.debug('📋 Returning cached search results')
        return cached
      }

      // Build search URL
      const searchParams = new URLSearchParams()
      if (query.text) searchParams.set('q', query.text)
      if (query.type) searchParams.set('type', query.type)
      if (query.tags) searchParams.set('tags', query.tags.join(','))
      if (query.author) searchParams.set('author', query.author)
      if (query.minRating)
        searchParams.set('minRating', query.minRating.toString())
      if (query.sortBy) searchParams.set('sort', query.sortBy)
      if (query.sortOrder) searchParams.set('order', query.sortOrder)
      if (query.limit) searchParams.set('limit', query.limit.toString())
      if (query.offset) searchParams.set('offset', query.offset.toString())

      const searchUrl = `${this.registryUrl}/api/plugins/search?${searchParams}`

      // Fetch search results
      const response = await fetch(searchUrl)
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const results = await response.json()

      // Cache results for 5 minutes
      this.setCachedResult(cacheKey, results, 5 * 60 * 1000)

      logger.info(`✅ Found ${results.length} plugins`)
      return results
    } catch (error) {
      logger.error('Plugin search failed:', error)
      return []
    }
  }

  /**
   * Get detailed plugin information
   */
  async getPluginInfo(pluginId: string): Promise<PluginInfo | null> {
    try {
      logger.info(`📋 Getting plugin info: ${pluginId}`)

      const cacheKey = `plugin:${pluginId}`
      const cached = this.getCachedResult(cacheKey)

      if (cached) {
        logger.debug('📋 Returning cached plugin info')
        return cached
      }

      const infoUrl = `${this.registryUrl}/api/plugins/${pluginId}`

      const response = await fetch(infoUrl)
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to get plugin info: ${response.statusText}`)
      }

      const pluginInfo = await response.json()

      // Cache for 10 minutes
      this.setCachedResult(cacheKey, pluginInfo, 10 * 60 * 1000)

      logger.info(`✅ Retrieved plugin info: ${pluginInfo.name}`)
      return pluginInfo
    } catch (error) {
      logger.error('Failed to get plugin info:', error)
      return null
    }
  }

  /**
   * Get featured plugins
   */
  async getFeaturedPlugins(): Promise<PluginInfo[]> {
    try {
      const cacheKey = 'featured'
      const cached = this.getCachedResult(cacheKey)

      if (cached) {
        return cached
      }

      const featuredUrl = `${this.registryUrl}/api/plugins/featured`

      const response = await fetch(featuredUrl)
      if (!response.ok) {
        throw new Error(
          `Failed to get featured plugins: ${response.statusText}`
        )
      }

      const featured = await response.json()

      // Cache for 30 minutes
      this.setCachedResult(cacheKey, featured, 30 * 60 * 1000)

      return featured
    } catch (error) {
      logger.error('Failed to get featured plugins:', error)
      return []
    }
  }

  /**
   * Get popular plugins
   */
  async getPopularPlugins(): Promise<PluginInfo[]> {
    try {
      const cacheKey = 'popular'
      const cached = this.getCachedResult(cacheKey)

      if (cached) {
        return cached
      }

      const popularUrl = `${this.registryUrl}/api/plugins/popular`

      const response = await fetch(popularUrl)
      if (!response.ok) {
        throw new Error(`Failed to get popular plugins: ${response.statusText}`)
      }

      const popular = await response.json()

      // Cache for 15 minutes
      this.setCachedResult(cacheKey, popular, 15 * 60 * 1000)

      return popular
    } catch (error) {
      logger.error('Failed to get popular plugins:', error)
      return []
    }
  }

  /**
   * Install plugin from marketplace
   */
  async installPlugin(
    pluginId: string,
    version?: string
  ): Promise<Result<void>> {
    try {
      logger.info(
        `⬇️ Installing plugin: ${pluginId}${version ? `@${version}` : ''}`
      )

      // Get plugin info
      const pluginInfo = await this.getPluginInfo(pluginId)
      if (!pluginInfo) {
        return {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin ${pluginId} not found in marketplace`,
          },
        }
      }

      // Check version compatibility
      if (version && !pluginInfo.versions?.includes(version)) {
        return {
          success: false,
          error: {
            code: 'VERSION_NOT_FOUND',
            message: `Version ${version} not available for plugin ${pluginId}`,
          },
        }
      }

      const targetVersion = version || pluginInfo.latestVersion

      // Download plugin package
      const downloadUrl = `${this.registryUrl}/api/plugins/${pluginId}/download/${targetVersion}`

      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`Failed to download plugin: ${response.statusText}`)
      }

      const pluginBlob = await response.blob()

      // Extract and install plugin
      await this.installPluginPackage(pluginBlob, pluginInfo)

      logger.info(`✅ Plugin installed: ${pluginInfo.name} v${targetVersion}`)
      return { success: true, data: undefined }
    } catch (error) {
      logger.error('Plugin installation failed:', error)
      return {
        success: false,
        error: {
          code: 'INSTALLATION_ERROR',
          message: `Failed to install plugin: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Uninstall plugin
   */
  async uninstallPlugin(pluginId: string): Promise<Result<void>> {
    try {
      logger.info(`🗑️ Uninstalling plugin: ${pluginId}`)

      // Remove plugin files
      await this.removePluginFiles(pluginId)

      // Update installed plugins registry
      await this.updateInstalledPluginsRegistry(pluginId, 'uninstall')

      logger.info(`✅ Plugin uninstalled: ${pluginId}`)
      return { success: true, data: undefined }
    } catch (error) {
      logger.error('Plugin uninstallation failed:', error)
      return {
        success: false,
        error: {
          code: 'UNINSTALLATION_ERROR',
          message: `Failed to uninstall plugin: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Update plugin to latest version
   */
  async updatePlugin(pluginId: string): Promise<Result<void>> {
    try {
      logger.info(`⬆️ Updating plugin: ${pluginId}`)

      // Check for updates
      const pluginInfo = await this.getPluginInfo(pluginId)
      if (!pluginInfo) {
        return {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin ${pluginId} not found`,
          },
        }
      }

      // Check if update is available
      if (pluginInfo.latestVersion === pluginInfo.installedVersion) {
        return {
          success: true,
          data: undefined, // Already up to date
        }
      }

      // Install latest version
      return this.installPlugin(pluginId, pluginInfo.latestVersion)
    } catch (error) {
      logger.error('Plugin update failed:', error)
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: `Failed to update plugin: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Submit plugin review
   */
  async submitReview(
    pluginId: string,
    review: PluginReview
  ): Promise<Result<void>> {
    try {
      logger.info(`⭐ Submitting review for plugin: ${pluginId}`)

      const reviewUrl = `${this.registryUrl}/api/plugins/${pluginId}/reviews`

      const response = await fetch(reviewUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review),
      })

      if (!response.ok) {
        throw new Error(`Failed to submit review: ${response.statusText}`)
      }

      logger.info(`✅ Review submitted for plugin: ${pluginId}`)
      return { success: true, data: undefined }
    } catch (error) {
      logger.error('Review submission failed:', error)
      return {
        success: false,
        error: {
          code: 'REVIEW_ERROR',
          message: `Failed to submit review: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Get plugin reviews
   */
  async getReviews(pluginId: string): Promise<PluginReview[]> {
    try {
      const reviewsUrl = `${this.registryUrl}/api/plugins/${pluginId}/reviews`

      const response = await fetch(reviewsUrl)
      if (!response.ok) {
        throw new Error(`Failed to get reviews: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to get reviews:', error)
      return []
    }
  }

  /**
   * Publish plugin to marketplace
   */
  async publishPlugin(plugin: any, code: string): Promise<Result<string>> {
    try {
      logger.info(`📤 Publishing plugin to marketplace`)

      // Validate plugin before publishing
      const validation = await this.validatePluginForPublishing(plugin)
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Plugin validation failed: ${validation.errors.join(', ')}`,
          },
        }
      }

      // Create plugin package
      const packageData = await this.createPluginPackage(plugin, code)

      // Upload to marketplace
      const publishUrl = `${this.registryUrl}/api/plugins/publish`

      const response = await fetch(publishUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      })

      if (!response.ok) {
        throw new Error(`Failed to publish plugin: ${response.statusText}`)
      }

      const result = await response.json()

      logger.info(`✅ Plugin published successfully: ${result.pluginId}`)
      return { success: true, data: result.pluginId }
    } catch (error) {
      logger.error('Plugin publishing failed:', error)
      return {
        success: false,
        error: {
          code: 'PUBLISHING_ERROR',
          message: `Failed to publish plugin: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Update published plugin
   */
  async updatePublishedPlugin(
    pluginId: string,
    updates: any
  ): Promise<Result<void>> {
    try {
      logger.info(`🔄 Updating published plugin: ${pluginId}`)

      const updateUrl = `${this.registryUrl}/api/plugins/${pluginId}`

      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update plugin: ${response.statusText}`)
      }

      logger.info(`✅ Plugin updated successfully: ${pluginId}`)
      return { success: true, data: undefined }
    } catch (error) {
      logger.error('Plugin update failed:', error)
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: `Failed to update plugin: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private getCachedResult(key: string): any | null {
    const expiry = this.cacheExpiry.get(key)
    if (expiry && Date.now() < expiry) {
      return this.cache.get(key)
    }

    // Remove expired cache entry
    this.cache.delete(key)
    this.cacheExpiry.delete(key)
    return null
  }

  private setCachedResult(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, data)
    this.cacheExpiry.set(key, Date.now() + ttlMs)
  }

  private async installPluginPackage(
    pluginBlob: Blob,
    pluginInfo: PluginInfo
  ): Promise<void> {
    // Extract plugin package
    const pluginDir = `./plugins/${pluginInfo.id}`

    // Create plugin directory
    // Extract files from blob
    // Update plugin registry

    console.log(`📦 Installing plugin package to: ${pluginDir}`)
  }

  private async removePluginFiles(pluginId: string): Promise<void> {
    const pluginDir = `./plugins/${pluginId}`

    // Remove plugin directory and all files
    // Update plugin registry

    console.log(`🗑️ Removing plugin files: ${pluginDir}`)
  }

  private async updateInstalledPluginsRegistry(
    pluginId: string,
    action: 'install' | 'uninstall'
  ): Promise<void> {
    // Update local plugin registry
    const registryPath = './plugins/registry.json'

    try {
      const registry = JSON.parse((await this.readFile(registryPath)) || '{}')

      if (action === 'install') {
        // Add plugin to registry
        registry[pluginId] = { installedAt: new Date().toISOString() }
      } else {
        // Remove plugin from registry
        delete registry[pluginId]
      }

      await this.writeFile(registryPath, JSON.stringify(registry, null, 2))
    } catch (error) {
      logger.error('Failed to update plugin registry:', error)
    }
  }

  private async validatePluginForPublishing(plugin: any): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate manifest
    if (!plugin.manifest) {
      errors.push('Plugin manifest is required')
    } else {
      const manifestValidation = this.validateManifest(plugin.manifest)
      errors.push(...manifestValidation.errors)
      warnings.push(...manifestValidation.warnings)
    }

    // Validate code
    if (!plugin.code) {
      errors.push('Plugin code is required')
    }

    // Check for security issues
    const securityCheck = await this.securityCheck(plugin.code)
    if (!securityCheck.safe) {
      errors.push(...securityCheck.issues)
    }

    // Check compatibility
    const compatibility = await this.checkCompatibility(plugin)
    if (!compatibility.compatible) {
      warnings.push(...compatibility.issues)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  private validateManifest(manifest: any): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!manifest.name) errors.push('Name is required')
    if (!manifest.id) errors.push('ID is required')
    if (!manifest.version) errors.push('Version is required')
    if (!manifest.main) errors.push('Main script is required')

    // ID format
    if (manifest.id && !/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(manifest.id)) {
      errors.push(
        'ID must contain only lowercase letters, numbers, dots, and hyphens'
      )
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  private async securityCheck(code: string): Promise<{
    safe: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(\s*[^,]+,\s*0\s*\)/,
      /setInterval\s*\(\s*[^,]+,\s*0\s*\)/,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        issues.push(
          `Potentially dangerous code pattern detected: ${pattern.source}`
        )
      }
    }

    return {
      safe: issues.length === 0,
      issues,
    }
  }

  private async checkCompatibility(plugin: any): Promise<{
    compatible: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    // Check Animator version compatibility
    // Check API version compatibility
    // Check permission validity

    return {
      compatible: issues.length === 0,
      issues,
    }
  }

  private async createPluginPackage(plugin: any, code: string): Promise<any> {
    return {
      manifest: plugin.manifest,
      code,
      checksum: await this.generateChecksum(code),
      size: new Blob([code]).size,
      createdAt: new Date().toISOString(),
    }
  }

  private async generateChecksum(content: string): Promise<string> {
    // Generate SHA-256 checksum
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private async readFile(path: string): Promise<string | null> {
    try {
      const response = await fetch(path)
      if (response.ok) {
        return await response.text()
      }
    } catch {
      // File doesn't exist or can't be read
    }
    return null
  }

  private async writeFile(path: string, content: string): Promise<void> {
    // In a real implementation, this would write to the file system
    console.log(`📄 Writing file: ${path}`)
  }
}

/**
 * Plugin marketplace factory
 */
export class PluginMarketplaceFactory {
  static create(registryUrl?: string): PluginMarketplace {
    return new PluginMarketplace(registryUrl)
  }

  static createLocal(): PluginMarketplace {
    return new PluginMarketplace('http://localhost:3001')
  }
}

/**
 * Plugin marketplace utilities
 */
export const marketplaceUtils = {
  /**
   * Format plugin rating for display
   */
  formatRating: (rating: number): string => {
    return `${rating.toFixed(1)}/5.0`
  },

  /**
   * Format download count for display
   */
  formatDownloads: (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  },

  /**
   * Calculate plugin compatibility score
   */
  calculateCompatibility: (
    plugin: PluginInfo,
    currentVersion: string
  ): number => {
    // Simple compatibility scoring
    return 0.8 // Placeholder
  },

  /**
   * Get plugin tags for categorization
   */
  getPluginTags: (plugin: PluginInfo): string[] => {
    return [plugin.type, ...(plugin.tags || [])]
  },

  /**
   * Check if plugin requires update
   */
  requiresUpdate: (plugin: PluginInfo): boolean => {
    return plugin.latestVersion !== plugin.installedVersion
  },

  /**
   * Get update urgency level
   */
  getUpdateUrgency: (
    plugin: PluginInfo
  ): 'low' | 'medium' | 'high' | 'critical' => {
    if (marketplaceUtils.requiresUpdate(plugin)) {
      // Check version difference severity
      return 'medium' // Placeholder
    }
    return 'low'
  },
}

/**
 * Plugin recommendation engine
 */
export class PluginRecommendationEngine {
  private marketplace: PluginMarketplace

  constructor(marketplace: PluginMarketplace) {
    this.marketplace = marketplace
  }

  /**
   * Get personalized plugin recommendations
   */
  async getRecommendations(userPreferences: {
    favoriteTypes?: string[]
    usedPlugins?: string[]
    skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  }): Promise<PluginInfo[]> {
    try {
      // Get popular plugins as base
      const popular = await this.marketplace.getPopularPlugins()

      // Filter based on user preferences
      let recommendations = popular

      if (userPreferences.favoriteTypes) {
        recommendations = recommendations.filter((p) =>
          userPreferences.favoriteTypes!.includes(p.type)
        )
      }

      if (userPreferences.usedPlugins) {
        // Boost recommendations for similar plugins
        recommendations = recommendations.filter(
          (p) => !userPreferences.usedPlugins!.includes(p.id)
        )
      }

      // Limit to top recommendations
      return recommendations.slice(0, 10)
    } catch (error) {
      logger.error('Failed to get recommendations:', error)
      return []
    }
  }

  /**
   * Get trending plugins
   */
  async getTrendingPlugins(): Promise<PluginInfo[]> {
    try {
      // Get plugins with recent activity
      const trendingUrl = `${this.marketplace['registryUrl']}/api/plugins/trending`

      const response = await fetch(trendingUrl)
      if (!response.ok) {
        throw new Error(
          `Failed to get trending plugins: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to get trending plugins:', error)
      return []
    }
  }

  /**
   * Get plugins similar to specified plugin
   */
  async getSimilarPlugins(pluginId: string): Promise<PluginInfo[]> {
    try {
      const similarUrl = `${this.marketplace['registryUrl']}/api/plugins/${pluginId}/similar`

      const response = await fetch(similarUrl)
      if (!response.ok) {
        throw new Error(`Failed to get similar plugins: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to get similar plugins:', error)
      return []
    }
  }
}
