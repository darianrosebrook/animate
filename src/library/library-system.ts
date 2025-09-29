/**
 * @fileoverview Core Library Management System Implementation
 * @author @darianrosebrook
 */

import { Result, Time } from '@/types'
import {
  LibrarySystem as ILibrarySystem,
  Library,
  Collection,
  Asset,
  Version,
  Variable,
  GovernanceRule,
  AccessControl,
  AuditLog,
  LibrarySearch,
  LibraryAnalytics,
  AssetMetadata,
  CollectionTemplate,
  LibraryPermissions,
  AssetLifecycle,
} from './library-types'

/**
 * Core library management system for enterprise asset organization
 */
export class LibrarySystem implements ILibrarySystem {
  private libraries: Map<string, Library> = new Map()
  private collections: Map<string, Collection> = new Map()
  private assets: Map<string, Asset> = new Map()
  private variables: Map<string, Variable> = new Map()
  private auditLogs: AuditLog[] = []
  private currentUser: string | null = null

  async initialize(userId: string): Promise<Result<boolean>> {
    try {
      console.log('🚀 Initializing library management system...')

      this.currentUser = userId

      // Initialize default libraries
      await this.createDefaultLibraries()

      // Set up governance rules
      await this.initializeGovernance()

      // Initialize analytics
      await this.initializeAnalytics()

      console.log('✅ Library management system initialized')
      return { success: true, data: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIBRARY_INIT_ERROR',
          message: `Failed to initialize library system: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async createLibrary(
    name: string,
    description: string,
    permissions: LibraryPermissions,
    template?: CollectionTemplate
  ): Promise<Result<Library>> {
    try {
      const libraryId = this.generateLibraryId()

      const library: Library = {
        id: libraryId,
        name,
        description,
        owner: this.currentUser!,
        createdAt: new Date(),
        lastModified: new Date(),
        version: 1,
        permissions,
        collections: [],
        governance: {
          rules: [],
          compliance: 'compliant',
          lastAudit: new Date(),
        },
        analytics: {
          totalAssets: 0,
          totalCollections: 0,
          usageMetrics: {},
          lastUpdated: new Date(),
        },
        tags: [],
        metadata: {},
      }

      this.libraries.set(libraryId, library)

      // Create root collection if template provided
      if (template) {
        await this.createCollection(
          libraryId,
          template.name,
          template.description,
          template
        )
      }

      // Log creation
      this.logAuditEvent({
        id: this.generateAuditId(),
        userId: this.currentUser!,
        action: 'create_library',
        resourceId: libraryId,
        resourceType: 'library',
        timestamp: new Date(),
        details: { name, description },
      })

      console.log(`📚 Created library: ${name} (${libraryId})`)
      return { success: true, data: library }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIBRARY_CREATE_ERROR',
          message: `Failed to create library: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async createCollection(
    libraryId: string,
    name: string,
    description: string,
    template?: CollectionTemplate
  ): Promise<Result<Collection>> {
    try {
      const library = this.libraries.get(libraryId)
      if (!library) {
        return {
          success: false,
          error: {
            code: 'LIBRARY_NOT_FOUND',
            message: `Library ${libraryId} not found`,
          },
        }
      }

      const collectionId = this.generateCollectionId()

      const collection: Collection = {
        id: collectionId,
        libraryId,
        name,
        description,
        parentId: template?.parentId || null,
        createdAt: new Date(),
        lastModified: new Date(),
        version: 1,
        assets: [],
        subcollections: [],
        variables: [],
        permissions: template?.permissions || {
          read: ['*'],
          write: [library.owner],
          admin: [library.owner],
        },
        metadata: template?.metadata || {},
        lifecycle: template?.lifecycle || {
          stage: 'development',
          approvalRequired: false,
          retentionPolicy: 'permanent',
        },
      }

      this.collections.set(collectionId, collection)
      library.collections.push(collectionId)
      library.lastModified = new Date()

      // Log creation
      this.logAuditEvent({
        id: this.generateAuditId(),
        userId: this.currentUser!,
        action: 'create_collection',
        resourceId: collectionId,
        resourceType: 'collection',
        timestamp: new Date(),
        details: { libraryId, name, description },
      })

      console.log(`📁 Created collection: ${name} (${collectionId})`)
      return { success: true, data: collection }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COLLECTION_CREATE_ERROR',
          message: `Failed to create collection: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async addAsset(
    collectionId: string,
    asset: Asset,
    metadata?: AssetMetadata
  ): Promise<Result<Asset>> {
    try {
      const collection = this.collections.get(collectionId)
      if (!collection) {
        return {
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: `Collection ${collectionId} not found`,
          },
        }
      }

      // Check permissions
      if (
        !this.hasPermission(collection.permissions.write, this.currentUser!)
      ) {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Insufficient permissions to add assets',
          },
        }
      }

      // Version the asset
      const versionedAsset = await this.createAssetVersion(asset)

      // Add metadata
      if (metadata) {
        versionedAsset.metadata = { ...versionedAsset.metadata, ...metadata }
      }

      // Add to collection
      collection.assets.push(versionedAsset.id)
      collection.lastModified = new Date()

      // Update library analytics
      await this.updateLibraryAnalytics(collection.libraryId)

      // Log addition
      this.logAuditEvent({
        id: this.generateAuditId(),
        userId: this.currentUser!,
        action: 'add_asset',
        resourceId: versionedAsset.id,
        resourceType: 'asset',
        timestamp: new Date(),
        details: { collectionId, assetName: asset.name },
      })

      console.log(`📦 Added asset: ${asset.name} (${versionedAsset.id})`)
      return { success: true, data: versionedAsset }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ASSET_ADD_ERROR',
          message: `Failed to add asset: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async searchAssets(query: LibrarySearch): Promise<Result<Asset[]>> {
    try {
      let results: Asset[] = []

      // Search across all accessible collections
      for (const collection of this.collections.values()) {
        if (
          !this.hasPermission(collection.permissions.read, this.currentUser!)
        ) {
          continue
        }

        for (const assetId of collection.assets) {
          const asset = this.assets.get(assetId)
          if (asset && this.matchesSearch(asset, query)) {
            results.push(asset)
          }
        }
      }

      // Apply sorting
      if (query.sortBy) {
        results = this.sortAssets(results, query.sortBy, query.sortOrder)
      }

      // Apply pagination
      if (query.limit) {
        results = results.slice(0, query.limit)
      }

      return { success: true, data: results }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: `Failed to search assets: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async createVariable(
    collectionId: string,
    name: string,
    value: any,
    type: string,
    description?: string
  ): Promise<Result<Variable>> {
    try {
      const collection = this.collections.get(collectionId)
      if (!collection) {
        return {
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: `Collection ${collectionId} not found`,
          },
        }
      }

      const variableId = this.generateVariableId()

      const variable: Variable = {
        id: variableId,
        collectionId,
        name,
        value,
        type,
        description,
        createdAt: new Date(),
        lastModified: new Date(),
        version: 1,
        usage: {
          references: 0,
          lastUsed: null,
        },
        metadata: {},
      }

      this.variables.set(variableId, variable)
      collection.variables.push(variableId)
      collection.lastModified = new Date()

      // Log creation
      this.logAuditEvent({
        id: this.generateAuditId(),
        userId: this.currentUser!,
        action: 'create_variable',
        resourceId: variableId,
        resourceType: 'variable',
        timestamp: new Date(),
        details: { collectionId, name, type },
      })

      console.log(`🔧 Created variable: ${name} (${variableId})`)
      return { success: true, data: variable }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VARIABLE_CREATE_ERROR',
          message: `Failed to create variable: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async getLibraryAnalytics(
    libraryId: string
  ): Promise<Result<LibraryAnalytics>> {
    try {
      const library = this.libraries.get(libraryId)
      if (!library) {
        return {
          success: false,
          error: {
            code: 'LIBRARY_NOT_FOUND',
            message: `Library ${libraryId} not found`,
          },
        }
      }

      const analytics = await this.calculateLibraryAnalytics(libraryId)
      return { success: true, data: analytics }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: `Failed to get library analytics: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async validateGovernance(libraryId: string): Promise<Result<boolean>> {
    try {
      const library = this.libraries.get(libraryId)
      if (!library) {
        return {
          success: false,
          error: {
            code: 'LIBRARY_NOT_FOUND',
            message: `Library ${libraryId} not found`,
          },
        }
      }

      const validation = await this.validateGovernanceRules(libraryId)

      library.governance.compliance = validation.compliant
        ? 'compliant'
        : 'non-compliant'
      library.governance.lastAudit = new Date()

      return { success: true, data: validation.compliant }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GOVERNANCE_ERROR',
          message: `Failed to validate governance: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async exportLibrary(
    libraryId: string,
    format: string
  ): Promise<Result<Blob>> {
    try {
      const library = this.libraries.get(libraryId)
      if (!library) {
        return {
          success: false,
          error: {
            code: 'LIBRARY_NOT_FOUND',
            message: `Library ${libraryId} not found`,
          },
        }
      }

      const exportData = await this.generateLibraryExport(libraryId, format)

      // Log export
      this.logAuditEvent({
        id: this.generateAuditId(),
        userId: this.currentUser!,
        action: 'export_library',
        resourceId: libraryId,
        resourceType: 'library',
        timestamp: new Date(),
        details: { format },
      })

      return { success: true, data: exportData }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: `Failed to export library: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  async importLibrary(
    data: Blob,
    targetLibraryId?: string
  ): Promise<Result<Library>> {
    try {
      const importData = await this.parseImportData(data)

      let libraryId: string
      let library: Library

      if (targetLibraryId) {
        // Import into existing library
        library = this.libraries.get(targetLibraryId)!
        if (!library) {
          return {
            success: false,
            error: {
              code: 'LIBRARY_NOT_FOUND',
              message: `Target library ${targetLibraryId} not found`,
            },
          }
        }
        libraryId = targetLibraryId
      } else {
        // Create new library
        const createResult = await this.createLibrary(
          importData.name,
          importData.description,
          importData.permissions
        )
        if (!createResult.success) {
          return createResult
        }
        library = createResult.data
        libraryId = library.id
      }

      // Import collections and assets
      await this.importCollections(libraryId, importData.collections)
      await this.importAssets(libraryId, importData.assets)

      // Log import
      this.logAuditEvent({
        id: this.generateAuditId(),
        userId: this.currentUser!,
        action: 'import_library',
        resourceId: libraryId,
        resourceType: 'library',
        timestamp: new Date(),
        details: { source: importData.source },
      })

      console.log(`📥 Imported library: ${library.name}`)
      return { success: true, data: library }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: `Failed to import library: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  private generateLibraryId(): string {
    return `lib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCollectionId(): string {
    return `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAssetId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateVariableId(): string {
    return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async createDefaultLibraries(): Promise<void> {
    // Create default libraries for common use cases
    await this.createLibrary(
      'Motion Graphics Templates',
      'Reusable motion graphics components and templates',
      {
        read: ['*'],
        write: ['designers', 'animators'],
        admin: ['admin'],
      }
    )

    await this.createLibrary(
      'Brand Assets',
      'Approved brand elements and guidelines',
      {
        read: ['*'],
        write: ['brand-managers'],
        admin: ['admin'],
      }
    )

    await this.createLibrary('Effects Library', 'Custom effects and shaders', {
      read: ['*'],
      write: ['developers', 'technical-artists'],
      admin: ['admin'],
    })
  }

  private async initializeGovernance(): Promise<void> {
    // Initialize default governance rules
    const defaultRules: GovernanceRule[] = [
      {
        id: 'naming_convention',
        name: 'Asset Naming Convention',
        description: 'All assets must follow consistent naming conventions',
        rule: 'asset.name must match pattern',
        severity: 'warning',
        enabled: true,
      },
      {
        id: 'version_control',
        name: 'Version Control',
        description: 'All assets must be versioned',
        rule: 'asset.versions.length > 0',
        severity: 'error',
        enabled: true,
      },
      {
        id: 'metadata_completeness',
        name: 'Metadata Completeness',
        description: 'Assets must have complete metadata',
        rule: 'asset.metadata.description and asset.metadata.tags',
        severity: 'warning',
        enabled: true,
      },
    ]

    // Apply rules to all libraries
    for (const library of this.libraries.values()) {
      library.governance.rules = defaultRules
    }
  }

  private async initializeAnalytics(): Promise<void> {
    // Initialize analytics tracking
    console.log('📊 Analytics system initialized')
  }

  private hasPermission(allowedUsers: string[], userId: string): boolean {
    return allowedUsers.includes('*') || allowedUsers.includes(userId)
  }

  private async createAssetVersion(asset: Asset): Promise<Asset> {
    const version: Version = {
      id: this.generateAssetId(),
      number: asset.versions?.length
        ? Math.max(...asset.versions.map((v) => v.number)) + 1
        : 1,
      createdAt: new Date(),
      createdBy: this.currentUser!,
      changes: 'Initial version',
      content: asset.content,
    }

    const versionedAsset: Asset = {
      ...asset,
      id: this.generateAssetId(),
      versions: [...(asset.versions || []), version],
      createdAt: new Date(),
      lastModified: new Date(),
    }

    this.assets.set(versionedAsset.id, versionedAsset)
    return versionedAsset
  }

  private matchesSearch(asset: Asset, query: LibrarySearch): boolean {
    // Simple search implementation - would be more sophisticated in practice
    const searchText =
      `${asset.name} ${asset.description} ${asset.tags?.join(' ')}`.toLowerCase()
    return searchText.includes(query.text?.toLowerCase() || '')
  }

  private sortAssets(
    assets: Asset[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Asset[] {
    return assets.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'size':
          comparison = (a.metadata?.fileSize || 0) - (b.metadata?.fileSize || 0)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  private async updateLibraryAnalytics(libraryId: string): Promise<void> {
    const library = this.libraries.get(libraryId)
    if (!library) return

    // Calculate analytics
    let totalAssets = 0
    let totalCollections = 0

    for (const collectionId of library.collections) {
      const collection = this.collections.get(collectionId)
      if (collection) {
        totalAssets += collection.assets.length
        totalCollections += 1 + collection.subcollections.length
      }
    }

    library.analytics = {
      totalAssets,
      totalCollections,
      usageMetrics: {},
      lastUpdated: new Date(),
    }
  }

  private async validateGovernanceRules(
    libraryId: string
  ): Promise<{ compliant: boolean; violations: string[] }> {
    const library = this.libraries.get(libraryId)
    if (!library) {
      return { compliant: false, violations: ['Library not found'] }
    }

    const violations: string[] = []

    // Check each governance rule
    for (const rule of library.governance.rules) {
      if (rule.enabled) {
        // Simplified rule checking - would be more sophisticated
        const isCompliant = await this.checkRule(library, rule)
        if (!isCompliant) {
          violations.push(rule.name)
        }
      }
    }

    return { compliant: violations.length === 0, violations }
  }

  private async checkRule(
    library: Library,
    rule: GovernanceRule
  ): Promise<boolean> {
    // Simplified rule checking - would implement actual rule logic
    return true
  }

  private async generateLibraryExport(
    libraryId: string,
    format: string
  ): Promise<Blob> {
    const library = this.libraries.get(libraryId)
    if (!library) {
      throw new Error(`Library ${libraryId} not found`)
    }

    const exportData = {
      library,
      collections: library.collections
        .map((id) => this.collections.get(id))
        .filter(Boolean),
      assets: library.collections.flatMap((id) => {
        const collection = this.collections.get(id)
        return (
          collection?.assets
            .map((assetId) => this.assets.get(assetId))
            .filter(Boolean) || []
        )
      }),
      variables: library.collections.flatMap((id) => {
        const collection = this.collections.get(id)
        return (
          collection?.variables
            .map((varId) => this.variables.get(varId))
            .filter(Boolean) || []
        )
      }),
      exportedAt: new Date(),
      format,
    }

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: format === 'json' ? 'application/json' : 'application/octet-stream',
    })
  }

  private async parseImportData(data: Blob): Promise<any> {
    const text = await data.text()
    return JSON.parse(text)
  }

  private async importCollections(
    libraryId: string,
    collections: any[]
  ): Promise<void> {
    for (const collectionData of collections) {
      await this.createCollection(
        libraryId,
        collectionData.name,
        collectionData.description
      )
    }
  }

  private async importAssets(libraryId: string, assets: any[]): Promise<void> {
    // Find appropriate collection
    const library = this.libraries.get(libraryId)
    if (!library || library.collections.length === 0) return

    const collectionId = library.collections[0] // Use first collection
    for (const assetData of assets) {
      const asset: Asset = {
        id: this.generateAssetId(),
        name: assetData.name,
        type: assetData.type,
        content: assetData.content,
        metadata: assetData.metadata,
        createdAt: new Date(assetData.createdAt),
        lastModified: new Date(assetData.lastModified),
        versions: assetData.versions || [],
      }

      this.assets.set(asset.id, asset)

      const collection = this.collections.get(collectionId)
      if (collection) {
        collection.assets.push(asset.id)
      }
    }
  }

  private async calculateLibraryAnalytics(
    libraryId: string
  ): Promise<LibraryAnalytics> {
    const library = this.libraries.get(libraryId)
    if (!library) {
      throw new Error(`Library ${libraryId} not found`)
    }

    // Calculate detailed analytics
    const analytics: LibraryAnalytics = {
      libraryId,
      totalAssets: 0,
      totalCollections: 0,
      totalVariables: 0,
      assetTypes: {},
      usageByUser: {},
      lastActivity: new Date(),
      compliance: library.governance.compliance,
      growthRate: 0, // Would calculate from historical data
    }

    for (const collectionId of library.collections) {
      const collection = this.collections.get(collectionId)
      if (collection) {
        analytics.totalAssets += collection.assets.length
        analytics.totalCollections += 1
        analytics.totalVariables += collection.variables.length

        for (const assetId of collection.assets) {
          const asset = this.assets.get(assetId)
          if (asset) {
            analytics.assetTypes[asset.type] =
              (analytics.assetTypes[asset.type] || 0) + 1
          }
        }
      }
    }

    return analytics
  }

  private logAuditEvent(event: AuditLog): void {
    this.auditLogs.push(event)

    // Keep only last 1000 events
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000)
    }
  }

  getLibrary(id: string): Library | null {
    return this.libraries.get(id) || null
  }

  getCollection(id: string): Collection | null {
    return this.collections.get(id) || null
  }

  getAsset(id: string): Asset | null {
    return this.assets.get(id) || null
  }

  getVariable(id: string): Variable | null {
    return this.variables.get(id) || null
  }

  getAuditLogs(userId?: string, resourceId?: string, limit = 100): AuditLog[] {
    let logs = this.auditLogs

    if (userId) {
      logs = logs.filter((log) => log.userId === userId)
    }

    if (resourceId) {
      logs = logs.filter((log) => log.resourceId === resourceId)
    }

    return logs.slice(-limit)
  }

  destroy(): void {
    this.libraries.clear()
    this.collections.clear()
    this.assets.clear()
    this.variables.clear()
    this.auditLogs = []

    console.log('🧹 Library management system destroyed')
  }
}
