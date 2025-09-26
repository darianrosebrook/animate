/**
 * @fileoverview Toolbar Component - Action buttons for Developer Mode
 * @description Provides execute, save, and other action buttons
 * @author @darianrosebrook
 */

import React from 'react'

interface ToolbarProps {
  onExecute: () => void
  onSave: (name: string, description?: string, tags?: string[]) => void
  onClear: () => void
  onLoadExample: () => void
  isExecuting: boolean
  hasCode: boolean
}

/**
 * Toolbar component for Developer Mode actions
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  onExecute,
  onSave,
  onClear,
  onLoadExample,
  isExecuting,
  hasCode,
}) => {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#252526',
      }}
    >
      <button
        onClick={onExecute}
        disabled={!hasCode || isExecuting}
        style={{
          padding: '6px 12px',
          backgroundColor: hasCode && !isExecuting ? '#007acc' : '#666',
          color: '#ffffff',
          border: 'none',
          borderRadius: '3px',
          cursor: hasCode && !isExecuting ? 'pointer' : 'not-allowed',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
        title="Execute code (Ctrl+Enter)"
      >
        {isExecuting ? '⚡ Running...' : '▶️ Run'}
      </button>

      <button
        onClick={() => {
          const name = prompt('Enter snippet name:')
          if (name) {
            const description = prompt('Enter description (optional):')
            const tags = prompt('Enter tags (comma-separated, optional):')
            onSave(
              name,
              description || undefined,
              tags ? tags.split(',').map((t) => t.trim()) : undefined
            )
          }
        }}
        disabled={!hasCode}
        style={{
          padding: '6px 12px',
          backgroundColor: hasCode ? '#28a745' : '#666',
          color: '#ffffff',
          border: 'none',
          borderRadius: '3px',
          cursor: hasCode ? 'pointer' : 'not-allowed',
          fontSize: '12px',
        }}
        title="Save code as snippet (Ctrl+S)"
      >
        💾 Save
      </button>

      <button
        onClick={onClear}
        style={{
          padding: '6px 12px',
          backgroundColor: '#6c757d',
          color: '#ffffff',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
        title="Clear editor"
      >
        🗑️ Clear
      </button>

      <button
        onClick={onLoadExample}
        style={{
          padding: '6px 12px',
          backgroundColor: '#17a2b8',
          color: '#ffffff',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
        title="Load example code"
      >
        📖 Example
      </button>

      <div style={{ flex: 1 }} />

      <span
        style={{
          fontSize: '11px',
          color: '#cccccc',
          fontFamily: 'Monaco, Menlo, monospace',
        }}
      >
        Ctrl+Enter to run • Ctrl+S to save • F1 for settings • F2 for preview
      </span>
    </div>
  )
}
