/**
 * @fileoverview Sandbox types and interfaces
 * @description Type definitions for the secure execution environment
 * @author @darianrosebrook
 */

// Re-export types from ExecutionContext for convenience
export type {
  SandboxConfig,
  ExecutionResult,
  ExecutionError,
} from './ExecutionContext'

/**
 * Sandbox creation and management interfaces
 */
export interface SandboxManager {
  createSandbox(config: SandboxConfig): Promise<Sandbox>
  getSandbox(sandboxId: string): Promise<Sandbox | null>
  destroySandbox(sandboxId: string): Promise<boolean>
  listSandboxes(): Promise<Sandbox[]>
}

/**
 * Individual sandbox instance
 */
export interface Sandbox {
  id: string
  name: string
  config: SandboxConfig
  status: SandboxStatus
  createdAt: Date
  lastUsed: Date
  executionCount: number
  errorCount: number

  execute(code: string, parameters?: any): Promise<ExecutionResult>
  validate(code: string): Promise<ValidationResult>
  getStats(): Promise<SandboxStats>
}

/**
 * Sandbox status enumeration
 */
export enum SandboxStatus {
  Active = 'active',
  Idle = 'idle',
  Destroyed = 'destroyed',
  Error = 'error',
}

/**
 * Sandbox statistics
 */
export interface SandboxStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  totalMemoryUsed: number
  averageMemoryUsed: number
  lastError?: ExecutionError
}

/**
 * Code validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: string[]
}

/**
 * Validation error interface
 */
export interface ValidationError {
  type: 'syntax' | 'type' | 'reference' | 'security'
  message: string
  line: number
  column: number
  severity: 'error' | 'warning'
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  type: 'performance' | 'deprecated' | 'unsafe'
  message: string
  line: number
  suggestion: string
}

/**
 * Sandbox manager implementation
 */
export class DefaultSandboxManager implements SandboxManager {
  private sandboxes: Map<string, Sandbox> = new Map()

  async createSandbox(config: SandboxConfig): Promise<Sandbox> {
    const id = `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const sandbox: Sandbox = {
      id,
      name: config.name || `Sandbox ${id}`,
      config,
      status: SandboxStatus.Active,
      createdAt: new Date(),
      lastUsed: new Date(),
      executionCount: 0,
      errorCount: 0,

      async execute(code: string, parameters?: any): Promise<ExecutionResult> {
        // Implementation would use ExecutionContext
        throw new Error('Sandbox execution not implemented')
      },

      async validate(code: string): Promise<ValidationResult> {
        // Implementation would validate code without execution
        throw new Error('Sandbox validation not implemented')
      },

      async getStats(): Promise<SandboxStats> {
        // Implementation would return sandbox statistics
        throw new Error('Sandbox stats not implemented')
      },
    }

    this.sandboxes.set(id, sandbox)
    return sandbox
  }

  async getSandbox(sandboxId: string): Promise<Sandbox | null> {
    return this.sandboxes.get(sandboxId) || null
  }

  async destroySandbox(sandboxId: string): Promise<boolean> {
    const sandbox = this.sandboxes.get(sandboxId)
    if (sandbox) {
      sandbox.status = SandboxStatus.Destroyed
      this.sandboxes.delete(sandboxId)
      return true
    }
    return false
  }

  async listSandboxes(): Promise<Sandbox[]> {
    return Array.from(this.sandboxes.values())
  }
}
