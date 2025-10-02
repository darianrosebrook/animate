/**
 * @fileoverview Developer Mode Panel - Main interface for code editor and execution
 * @description Provides a comprehensive interface for writing and executing Animator API code
 * @author @darianrosebrook
 */

import React, { useState, useEffect, useRef } from 'react'
import { CodeEditor } from '../CodeEditor/CodeEditor'
import { OutputPanel } from './OutputPanel'
import { Toolbar } from './Toolbar'
import { SettingsPanel } from './SettingsPanel'
import { LivePreview } from './LivePreview'
import { SnippetManager } from './SnippetManager'
import { SandboxManager } from '../../core/sandbox/SandboxManager'
import { logger } from '@/core/logging/logger'

interface DeveloperModePanelProps {
  isOpen: boolean
  onToggle: () => void
  initialWidth?: number
}

interface ExecutionResult {
  success: boolean
  result?: any
  output: string
  executionTime: number
  memoryUsed: number
  errors: Array<{
    type: string
    message: string
    line?: number
    column?: number
    stack?: string
  }>
  warnings: Array<{
    type: string
    message: string
    line?: number
    suggestion?: string
  }>
}

/**
 * Main Developer Mode panel component
 */
export const DeveloperModePanel: React.FC<DeveloperModePanelProps> = ({
  isOpen,
  onToggle,
  initialWidth = 600,
}) => {
  // State management
  const [code, setCode] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showSnippets, setShowSnippets] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [sandboxManager] = useState(() => new SandboxManager())
  const [activeSandbox, setActiveSandbox] = useState<any>(null)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)

  // Initialize sandbox on mount
  useEffect(() => {
    const initializeSandbox = async () => {
      try {
        const sandbox = await sandboxManager.createSandbox({
          name: 'Developer Mode Sandbox',
          memoryLimit: 50, // 50MB
          timeout: 5000, // 5 seconds
          permissions: [
            'sceneGraph.read',
            'sceneGraph.create',
            'sceneGraph.update',
            'sceneGraph.delete',
            'timeline.read',
            'timeline.create',
            'timeline.edit',
            'timeline.playback',
            'rendering.render',
            'rendering.createViewport',
            'rendering.updateViewport',
          ],
          apis: ['sceneGraph', 'timeline', 'rendering', 'utils'],
          networkAccess: false,
          fileSystemAccess: false,
        })
        setActiveSandbox(sandbox)
      } catch (error) {
        logger.error('Failed to initialize sandbox:', error)
      }
    }

    if (isOpen) {
      initializeSandbox()
    }
  }, [isOpen, sandboxManager])

  // Load example code on first open
  useEffect(() => {
    if (isOpen && !code) {
      setCode(getExampleCode())
    }
  }, [isOpen, code])

  /**
   * Execute the current code
   */
  const executeCode = async () => {
    if (!activeSandbox || !code.trim()) return

    setIsExecuting(true)
    setExecutionResult(null)

    try {
      const startTime = performance.now()

      // Execute code in sandbox
      const result = await activeSandbox.execute(code, {
        api: getApiContext(),
      })

      const endTime = performance.now()

      setExecutionResult({
        success: result.success,
        result: result.result,
        output: result.output || '',
        executionTime: endTime - startTime,
        memoryUsed: result.memoryUsed || 0,
        errors: result.errors || [],
        warnings: result.warnings || [],
      })
    } catch (error) {
      setExecutionResult({
        success: false,
        output: '',
        executionTime: 0,
        memoryUsed: 0,
        errors: [
          {
            type: 'runtime',
            message:
              error instanceof Error
                ? error.message
                : 'Unknown execution error',
          },
        ],
        warnings: [],
      })
    } finally {
      setIsExecuting(false)
    }
  }

  /**
   * Save current code as snippet
   */
  const saveSnippet = async (
    name: string,
    description?: string,
    tags?: string[]
  ) => {
    if (!code.trim()) return

    try {
      await SnippetManager.save({
        name,
        description: description || '',
        code,
        tags: tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      })

      // Show success message
      setExecutionResult((prev) =>
        prev
          ? {
              ...prev,
              output: `✓ Snippet "${name}" saved successfully!\n${prev.output}`,
            }
          : {
              success: true,
              result: null,
              output: `✓ Snippet "${name}" saved successfully!`,
              executionTime: 0,
              memoryUsed: 0,
              errors: [],
              warnings: [],
            }
      )
    } catch (error) {
      logger.error('Failed to save snippet:', error)
    }
  }

  /**
   * Load a snippet into the editor
   */
  const loadSnippet = async (snippetId: string) => {
    try {
      const snippet = await SnippetManager.load(snippetId)
      if (snippet) {
        setCode(snippet.code)
        editorRef.current?.focus()
      }
    } catch (error) {
      logger.error('Failed to load snippet:', error)
    }
  }

  /**
   * Get API context for the sandbox
   */
  const getApiContext = () => {
    return {
      userId: 'developer-mode-user',
      documentId: 'current-document',
      permissions: [
        'sceneGraph.read',
        'sceneGraph.create',
        'sceneGraph.update',
        'sceneGraph.delete',
        'timeline.read',
        'timeline.create',
        'timeline.edit',
        'timeline.playback',
        'rendering.render',
        'rendering.createViewport',
        'rendering.updateViewport',
      ],
      environment: 'development',
      version: '1.0.0',
    }
  }

  /**
   * Get example code for new users
   */
  const getExampleCode = () => {
    return `// Welcome to Animator Developer Mode!
// This is a safe environment to experiment with the Animator API

// Create a rectangle
const rect = api.sceneGraph.createNode('rectangle', null, 'My Rectangle');
api.sceneGraph.setProperties(rect.id, {
  width: 200,
  height: 150,
  fillColor: { r: 1, g: 0.5, b: 0.2, a: 1 }
});

// Position it in the center
api.sceneGraph.setTransform(rect.id, {
  position: { x: 400, y: 300, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
});

// Create a timeline and add animation
const timeline = api.timeline.createTimeline('Bounce Animation', 3000, 30);
const track = api.timeline.createTrack(timeline.id, 'property', 'Position Y');

// Add keyframes for bouncing effect
api.timeline.addKeyframe(track.id, 0, { x: 400, y: 300 });
api.timeline.addKeyframe(track.id, 750, { x: 400, y: 100 });
api.timeline.addKeyframe(track.id, 1500, { x: 400, y: 300 });
api.timeline.addKeyframe(track.id, 2250, { x: 400, y: 200 });
api.timeline.addKeyframe(track.id, 3000, { x: 400, y: 300 });

// Play the animation
api.timeline.play(timeline.id);

// Log some information
api.utils.log('Animation created with', api.timeline.getKeyframes(track.id).length, 'keyframes');
`
  }

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      // Ctrl+Enter or Cmd+Enter to execute
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        executeCode()
      }

      // Ctrl+S or Cmd+S to save snippet
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        // Show save dialog
        setShowSnippets(true)
      }

      // F1 for settings
      if (event.key === 'F1') {
        event.preventDefault()
        setShowSettings(!showSettings)
      }

      // F2 for preview toggle
      if (event.key === 'F2') {
        event.preventDefault()
        setShowPreview(!showPreview)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, executeCode])

  if (!isOpen) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="developer-mode-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: `${initialWidth}px`,
        height: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#252526',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Developer Mode
          </span>
          {isExecuting && (
            <div
              style={{
                width: '12px',
                height: '12px',
                border: '2px solid #007acc',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '4px 8px',
              background: 'none',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Settings (F1)"
          >
            ⚙️
          </button>
          <button
            onClick={() => setShowSnippets(!showSnippets)}
            style={{
              padding: '4px 8px',
              background: 'none',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Snippets (Ctrl+S)"
          >
            📝
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '4px 8px',
              background: 'none',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Preview (F2)"
          >
            👁️
          </button>
          <button
            onClick={onToggle}
            style={{
              padding: '4px 8px',
              background: 'none',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '16px',
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        onExecute={executeCode}
        onSave={saveSnippet}
        onClear={() => setCode('')}
        onLoadExample={() => setCode(getExampleCode())}
        isExecuting={isExecuting}
        hasCode={!!code.trim()}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Editor and Output */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Code Editor */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeEditor
              ref={editorRef}
              value={code}
              onChange={setCode}
              onExecute={executeCode}
              language="javascript"
              theme="vs-dark"
            />
          </div>

          {/* Output Panel */}
          <OutputPanel result={executionResult} isVisible={true} height={200} />
        </div>

        {/* Right Panel - Preview */}
        {showPreview && (
          <div
            style={{
              width: '300px',
              borderLeft: '1px solid #333',
              backgroundColor: '#1e1e1e',
            }}
          >
            <LivePreview
              code={code}
              onExecute={executeCode}
              isExecuting={isExecuting}
            />
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          sandboxManager={sandboxManager}
          activeSandbox={activeSandbox}
        />
      )}

      {/* Snippets Panel */}
      {showSnippets && (
        <SnippetManager
          isOpen={showSnippets}
          onClose={() => setShowSnippets(false)}
          onLoadSnippet={loadSnippet}
          onSaveSnippet={saveSnippet}
        />
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
