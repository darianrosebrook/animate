/**
 * @fileoverview Core Library Management System Types and Interfaces
 * @author @darianrosebrook
 */

import { Result } from '@/types'

/**
 * Library definition for enterprise asset organization
 */
export interface Library {
  id: string
  name: string
  description: string
  owner: string
  createdAt: Date
  lastModified: Date
  version: number
  collections: string[] // Collection IDs
  permissions: LibraryPermissions
  governance: LibraryGovernance
  analytics: LibraryAnalytics
  tags: string[]
  metadata: Record<string, any>
}

/**
 * Collection definition within a library
 */
export interface Collection {
  id: string
  libraryId: string
  name: string
  description: string
  parentId: string | null
  createdAt: Date
  lastModified: Date
  version: number
  assets: string[] // Asset IDs
  subcollections: string[] // Sub-collection IDs
  variables: string[] // Variable IDs
  permissions: CollectionPermissions
  metadata: Record<string, any>
  lifecycle: AssetLifecycle
}

/**
 * Asset definition with versioning
 */
export interface Asset {
  id: string
  name: string
  type: AssetType
  content: any
  metadata: AssetMetadata
  createdAt: Date
  lastModified: Date
  versions: Version[]
  tags: string[]
  status: AssetStatus
}

/**
 * Asset types
 */
export enum AssetType {
  Composition = 'composition',
  Effect = 'effect',
  Media = 'media',
  Template = 'template',
  Variable = 'variable',
  Style = 'style',
  Animation = 'animation',
}

/**
 * Asset status
 */
export enum AssetStatus {
  Draft = 'draft',
  Review = 'review',
  Approved = 'approved',
  Deprecated = 'deprecated',
  Archived = 'archived',
}

/**
 * Version definition for assets
 */
export interface Version {
  id: string
  number: number
  createdAt: Date
  createdBy: string
  changes: string
  content: any
  metadata?: Record<string, any>
}

/**
 * Variable definition for dynamic content
 */
export interface Variable {
  id: string
  collectionId: string
  name: string
  value: any
  type: VariableType
  description?: string
  createdAt: Date
  lastModified: Date
  version: number
  usage: VariableUsage
  metadata: Record<string, any>
}

/**
 * Variable types
 */
export enum VariableType {
  String = 'string',
  Number = 'number',
  Color = 'color',
  Point = 'point',
  Size = 'size',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
}

/**
 * Variable usage tracking
 */
export interface VariableUsage {
  references: number
  lastUsed: Date | null
  usedIn: string[] // Asset or composition IDs
}

/**
 * Library permissions
 */
export interface LibraryPermissions {
  read: string[] // User IDs or roles
  write: string[] // User IDs or roles
  admin: string[] // User IDs or roles
}

/**
 * Collection permissions
 */
export interface CollectionPermissions {
  read: string[] // User IDs or roles
  write: string[] // User IDs or roles
  admin: string[] // User IDs or roles
}

/**
 * Library governance
 */
export interface LibraryGovernance {
  rules: GovernanceRule[]
  compliance: 'compliant' | 'non-compliant' | 'unknown'
  lastAudit: Date
}

/**
 * Governance rule
 */
export interface GovernanceRule {
  id: string
  name: string
  description: string
  rule: string // Rule expression
  severity: 'info' | 'warning' | 'error'
  enabled: boolean
  createdAt: Date
  createdBy: string
}

/**
 * Library analytics
 */
export interface LibraryAnalytics {
  libraryId: string
  totalAssets: number
  totalCollections: number
  totalVariables: number
  assetTypes: Record<AssetType, number>
  usageByUser: Record<string, number>
  lastActivity: Date
  compliance: string
  growthRate: number
}

/**
 * Asset metadata
 */
export interface AssetMetadata {
  description?: string
  author?: string
  category?: string
  tags?: string[]
  fileSize?: number
  dimensions?: { width: number; height: number }
  duration?: number
  frameRate?: number
  colorSpace?: string
  createdWith?: string
  dependencies?: string[]
  custom?: Record<string, any>
}

/**
 * Collection template for creating new collections
 */
export interface CollectionTemplate {
  name: string
  description: string
  parentId?: string
  permissions?: CollectionPermissions
  metadata?: Record<string, any>
  lifecycle?: AssetLifecycle
}

/**
 * Asset lifecycle management
 */
export interface AssetLifecycle {
  stage: 'development' | 'testing' | 'staging' | 'production'
  approvalRequired: boolean
  retentionPolicy: 'temporary' | 'permanent' | 'archived'
  expiryDate?: Date
  approvedBy?: string
  approvedAt?: Date
}

/**
 * Library search interface
 */
export interface LibrarySearch {
  text?: string
  type?: AssetType
  tags?: string[]
  author?: string
  dateRange?: { start: Date; end: Date }
  collectionId?: string
  sortBy?: 'name' | 'date' | 'size' | 'usage'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string
  userId: string
  action: string
  resourceId: string
  resourceType: string
  timestamp: Date
  details: Record<string, any>
}

/**
 * Access control entry
 */
export interface AccessControl {
  userId: string
  resourceId: string
  resourceType: string
  permissions: string[]
  grantedAt: Date
  grantedBy: string
  expiresAt?: Date
}

/**
 * Library system main interface
 */
export interface LibrarySystem {
  initialize(userId: string): Promise<Result<boolean>>
  createLibrary(
    name: string,
    description: string,
    permissions: LibraryPermissions,
    template?: CollectionTemplate
  ): Promise<Result<Library>>
  createCollection(
    libraryId: string,
    name: string,
    description: string,
    template?: CollectionTemplate
  ): Promise<Result<Collection>>
  addAsset(
    collectionId: string,
    asset: Asset,
    metadata?: AssetMetadata
  ): Promise<Result<Asset>>
  searchAssets(query: LibrarySearch): Promise<Result<Asset[]>>
  createVariable(
    collectionId: string,
    name: string,
    value: any,
    type: string,
    description?: string
  ): Promise<Result<Variable>>
  getLibraryAnalytics(libraryId: string): Promise<Result<LibraryAnalytics>>
  validateGovernance(libraryId: string): Promise<Result<boolean>>
  exportLibrary(libraryId: string, format: string): Promise<Result<Blob>>
  importLibrary(data: Blob, targetLibraryId?: string): Promise<Result<Library>>
  getLibrary(id: string): Library | null
  getCollection(id: string): Collection | null
  getAsset(id: string): Asset | null
  getVariable(id: string): Variable | null
  getAuditLogs(userId?: string, resourceId?: string, limit?: number): AuditLog[]
  destroy(): void
}
