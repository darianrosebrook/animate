/**
 * @fileoverview Core Collaboration System Types and Interfaces
 * @author @darianrosebrook
 */

import { Result, Time } from '@/types'

/**
 * User definition for collaboration
 */
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer' | 'guest'
  lastSeen: Date
  isOnline: boolean
}

/**
 * Document definition with collaboration metadata
 */
export interface Document {
  id: string
  title: string
  owner: string
  collaborators: User[]
  createdAt: Date
  lastModified: Date
  version: number
  content: any
  branches: Branch[]
  conflicts: Conflict[]
  syncState: SyncState
}

/**
 * Session definition for active collaboration
 */
export interface Session {
  id: string
  documentId: string
  userId: string
  joinedAt: Date
  lastActivity: Date
  permissions: string[]
  cursor: CursorPosition
  selection: Selection | null
}

/**
 * Branch definition for version control
 */
export interface Branch {
  id: string
  name: string
  documentId: string
  baseVersion: number
  createdAt: Date
  lastModified: Date
  author: string
  isActive: boolean
}

/**
 * Merge strategy options
 */
export enum MergeStrategy {
  FastForward = 'fast-forward',
  ThreeWay = 'three-way',
  Manual = 'manual',
}

/**
 * Sync state enumeration
 */
export enum SyncState {
  Synchronized = 'synchronized',
  OutOfSync = 'out-of-sync',
  Conflict = 'conflict',
  Offline = 'offline',
}

/**
 * Operation types for CRDT
 */
export enum OperationType {
  Insert = 'insert',
  Delete = 'delete',
  Update = 'update',
  Move = 'move',
}

/**
 * Operation definition
 */
export interface Operation {
  id: string
  type: OperationType
  path: string[]
  value?: any
  oldValue?: any
  timestamp: number
  userId: string
  version: number
  dependencies: string[] // Operation IDs this depends on
}

/**
 * Conflict definition
 */
export interface Conflict {
  id: string
  type: 'concurrent_edit' | 'merge_conflict' | 'permission_denied'
  operations: Operation[]
  createdAt: Date
  resolved: boolean
  resolution?: ConflictResolution
}

/**
 * Conflict resolution strategies
 */
export interface ConflictResolution {
  strategy: 'merge' | 'override' | 'manual'
  selectedOperation?: string
  mergedValue?: any
  comment?: string
}

/**
 * Cursor position for real-time collaboration
 */
export interface CursorPosition {
  x: number
  y: number
  time: Time
  color?: string
}

/**
 * Selection definition
 */
export interface Selection {
  startPath: string[]
  endPath: string[]
  startOffset: number
  endOffset: number
}

/**
 * User presence information
 */
export interface Presence {
  user: User
  session: Session | null
  lastSeen: Date
  cursor: CursorPosition
  selection: Selection | null
}

/**
 * CRDT document interface
 */
export interface CRDTDocument {
  initialize(): Promise<Result<boolean>>
  createDocument(
    documentId: string,
    initialContent: any
  ): Promise<Result<boolean>>
  applyOperation(
    documentId: string,
    operation: Operation
  ): Promise<Result<boolean>>
  getDocumentState(documentId: string): Promise<Result<any>>
  destroy(): void
}

/**
 * Operational transform interface
 */
export interface OperationalTransform {
  transform(
    operation: Operation,
    concurrentOperations: Operation[]
  ): Promise<Result<Operation>>
}

/**
 * WebRTC manager interface
 */
export interface WebRTCManager {
  initialize(user: User): Promise<Result<boolean>>
  joinRoom(roomId: string): Promise<Result<boolean>>
  leaveRoom(roomId: string): Promise<Result<boolean>>
  broadcastOperation(
    documentId: string,
    operation: Operation
  ): Promise<Result<boolean>>
  broadcastConflictResolution(
    documentId: string,
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<Result<boolean>>
  onOperation(
    callback: (documentId: string, operation: Operation) => void
  ): void
  onPresence(callback: (documentId: string, presence: Presence) => void): void
  destroy(): void
}

/**
 * WebSocket manager interface
 */
export interface WebSocketManager {
  initialize(): Promise<Result<boolean>>
  syncDocument(documentId: string): Promise<Result<boolean>>
  sendOperation(
    documentId: string,
    operation: Operation
  ): Promise<Result<boolean>>
  onConflict(callback: (documentId: string, conflict: any) => void): void
  destroy(): void
}

/**
 * Collaboration system main interface
 */
export interface CollaborationSystem {
  initialize(user: User): Promise<Result<boolean>>
  createDocument(template?: any): Promise<Result<Document>>
  joinDocument(documentId: string): Promise<Result<Session>>
  leaveDocument(): Promise<Result<boolean>>
  applyOperation(operation: Operation): Promise<Result<boolean>>
  resolveConflict(
    documentId: string,
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<Result<boolean>>
  getDocument(documentId: string): Document | null
  getUser(userId: string): User | null
  getPresence(documentId: string): Presence[]
  getBranches(documentId: string): Branch[]
  createBranch(
    documentId: string,
    name: string,
    baseVersion: number
  ): Promise<Result<Branch>>
  mergeBranch(
    documentId: string,
    branchId: string,
    strategy: MergeStrategy
  ): Promise<Result<boolean>>
  syncDocument(documentId: string): Promise<Result<SyncState>>
  destroy(): void
}
