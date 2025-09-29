/**
 * @fileoverview Code Editor Component - Monaco Editor wrapper for Developer Mode
 * @description Provides a code editor with syntax highlighting and Animator API completions
 * @author @darianrosebrook
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onExecute?: () => void
  language?: string
  theme?: string
  readOnly?: boolean
  height?: string | number
}

/**
 * Code Editor component using Monaco Editor
 */
export const CodeEditor = forwardRef<any, CodeEditorProps>(
  (
    {
      value,
      onChange,
      onExecute,
      language = 'javascript',
      theme = 'vs-dark',
      readOnly = false,
      height = '100%',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<any>(null)
    const monacoRef = useRef<any>(null)

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      focus: () => editorRef.current?.focus(),
      getValue: () => editorRef.current?.getValue(),
      setValue: (newValue: string) => editorRef.current?.setValue(newValue),
      getCompletions: () => getCompletions(),
    }))

    /**
     * Initialize Monaco Editor
     */
    useEffect(() => {
      const initializeEditor = async () => {
        if (!containerRef.current) return

        try {
          // Dynamically import Monaco Editor
          const monaco = await import('monaco-editor')

          // Configure Monaco for Animator API
          monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution:
              monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types'],
          })

          // Add Animator API types
          monaco.languages.typescript.javascriptDefaults.addExtraLib(
            getAnimatorApiDefinitions(),
            'file:///animator-api.d.ts'
          )

          // Create editor
          editorRef.current = monaco.editor.create(containerRef.current, {
            value,
            language,
            theme,
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
          })

          // Setup change listener
          editorRef.current.onDidChangeModelContent(() => {
            const newValue = editorRef.current.getValue()
            onChange(newValue)
          })

          // Setup keyboard shortcuts
          editorRef.current.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            () => onExecute?.()
          )

          monacoRef.current = monaco
        } catch (error) {
          console.error('Failed to initialize Monaco Editor:', error)
          // Fallback to simple textarea
          renderFallbackEditor()
        }
      }

      if (containerRef.current && !editorRef.current) {
        initializeEditor()
      }

      return () => {
        if (editorRef.current) {
          editorRef.current.dispose()
          editorRef.current = null
        }
      }
    }, [])

    /**
     * Update editor value when prop changes
     */
    useEffect(() => {
      if (editorRef.current && editorRef.current.getValue() !== value) {
        editorRef.current.setValue(value)
      }
    }, [value])

    /**
     * Get Animator API type definitions for Monaco
     */
    const getAnimatorApiDefinitions = () => {
      return `
      declare global {
        const api: {
          // Core subsystems
          sceneGraph: {
            createNode(type: string, parentId?: string, name?: string): Promise<SafeNode>
            getNode(nodeId: string): Promise<SafeNode | null>
            updateNode(nodeId: string, updates: Partial<SafeNode>): Promise<SafeNode>
            deleteNode(nodeId: string): Promise<boolean>
            setParent(nodeId: string, parentId: string | null): Promise<void>
            getChildren(nodeId: string): Promise<SafeNode[]>
            getAncestors(nodeId: string): Promise<SafeNode[]>
            getDescendants(nodeId: string): Promise<SafeNode[]>
            setProperty(nodeId: string, key: string, value: any): Promise<void>
            getProperty(nodeId: string, key: string): Promise<any>
            getProperties(nodeId: string): Promise<Record<string, any>>
            selectNodes(nodeIds: string[]): Promise<void>
            getSelectedNodes(): Promise<SafeNode[]>
            getCurrentScene(): Promise<SafeScene>
          }

          // Timeline & Animation API
          timeline: {
            createTimeline(name: string, duration: number, frameRate: number): Promise<SafeTimeline>
            getTimeline(timelineId: string): Promise<SafeTimeline | null>
            updateTimeline(timelineId: string, updates: Partial<SafeTimeline>): Promise<SafeTimeline>
            deleteTimeline(timelineId: string): Promise<boolean>
            play(timelineId: string, startTime?: number): Promise<void>
            pause(timelineId: string): Promise<void>
            stop(timelineId: string): Promise<void>
            seek(timelineId: string, time: number): Promise<void>
            createTrack(timelineId: string, type: string, name: string): Promise<SafeTrack>
            getTracks(timelineId: string): Promise<SafeTrack[]>
            updateTrack(trackId: string, updates: Partial<SafeTrack>): Promise<SafeTrack>
            addKeyframe(trackId: string, time: number, value: any): Promise<void>
            getKeyframes(trackId: string): Promise<SafeKeyframe[]>
            updateKeyframe(trackId: string, time: number, value: any): Promise<void>
            removeKeyframe(trackId: string, time: number): Promise<void>
            addMarker(timelineId: string, time: number, name: string, color?: string): Promise<SafeTimelineMarker>
            removeMarker(markerId: string): Promise<void>
            getMarkers(timelineId: string): Promise<SafeTimelineMarker[]>
          }

          // Rendering & GPU API
          rendering: {
            renderFrame(sceneId: string, time: number, options?: SafeRenderOptions): Promise<SafeRenderResult>
            renderRange(sceneId: string, startTime: number, endTime: number, options?: SafeRenderOptions): Promise<SafeRenderResult[]>
            createViewport(container: HTMLElement, options?: SafeViewportOptions): Promise<SafeViewport>
            updateViewport(viewportId: string, updates: Partial<SafeViewportOptions>): Promise<void>
            destroyViewport(viewportId: string): Promise<void>
            setCamera(viewportId: string, camera: SafeCamera): Promise<void>
            getCamera(viewportId: string): Promise<SafeCamera | null>
            exportFrame(viewportId: string, format: string): Promise<Blob>
            uploadAsset(assetId: string, data: ArrayBuffer | ImageData): Promise<SafeGPUResource>
            createShader(name: string, wgslSource: string): Promise<SafeShader>
            createMaterial(properties: SafeMaterialProperties): Promise<SafeMaterial>
            setRenderSettings(settings: SafeRenderSettings): Promise<void>
            getRenderSettings(): Promise<SafeRenderSettings>
            validateRenderCapabilities(): Promise<SafeRenderCapabilities>
          }

          // Real-time collaboration API
          collaboration: {
            createSession(documentId: string, participants: SafeParticipantInfo[]): Promise<SafeCollaborationSession>
            joinSession(sessionId: string, participant: SafeParticipantInfo): Promise<SafeJoinSessionResult>
            leaveSession(sessionId: string): Promise<void>
            getSession(sessionId: string): Promise<SafeCollaborationSession | null>
            updatePresence(sessionId: string, presence: SafePresence): Promise<void>
            getParticipants(sessionId: string): Promise<SafeParticipant[]>
            subscribeToChanges(sessionId: string, callback: (changes: SafeDocumentChange[]) => void): Promise<() => void>
            applyChanges(sessionId: string, changes: SafeDocumentChange[]): Promise<void>
            resolveConflict(conflictId: string, resolution: SafeConflictResolution): Promise<void>
            getConflicts(documentId: string): Promise<SafeDocumentConflict[]>
          }

          // Plugin system API
          plugins: {
            installPlugin(pluginId: string, source: SafePluginSource): Promise<SafePlugin>
            uninstallPlugin(pluginId: string): Promise<void>
            listPlugins(): Promise<SafePlugin[]>
            getPlugin(pluginId: string): Promise<SafePlugin | null>
            executePlugin(pluginId: string, functionName: string, parameters: any[]): Promise<any>
            createPlugin(manifest: SafePluginManifest): Promise<SafePlugin>
            updatePlugin(pluginId: string, updates: Partial<SafePlugin>): Promise<SafePlugin>
            validatePlugin(pluginId: string): Promise<SafeValidationResult>
          }

          // Document management API
          documents: {
            createDocument(template?: SafeDocumentTemplate): Promise<SafeDocument>
            openDocument(documentId: string): Promise<SafeDocument>
            saveDocument(documentId: string): Promise<void>
            closeDocument(documentId: string): Promise<void>
            getTemplates(): Promise<SafeDocumentTemplate[]>
            getTemplate(category: string): Promise<SafeDocumentTemplate | null>
          }

          // Settings and preferences API
          settings: {
            getSettings(): Promise<SafeAnimatorSettings>
            updateSettings(settings: Partial<SafeAnimatorSettings>): Promise<void>
            getShortcuts(): Promise<Record<string, string>>
            setShortcut(action: string, keys: string): Promise<void>
            resetShortcuts(): Promise<void>
          }

          // System information and monitoring API
          system: {
            getSystemInfo(): Promise<SafeSystemInfo>
            getCapabilities(): Promise<SafeAnimatorCapabilities>
            getPerformanceMetrics(): Promise<SafePerformanceMetrics>
            getMemoryUsage(): Promise<SafeMemoryUsage>
            hasFeature(feature: string): boolean
            getSupportedFormats(): string[]
            getMaxSceneComplexity(): number
          }

          // Utilities and helpers
          utils: {
            log(...args: any[]): void
            generateId(): string
            sleep(ms: number): Promise<void>
            formatTime(time: number): string
            formatColor(color: any): string
            debounce<T extends (...args: any[]) => any>(func: T, wait: number): T
            throttle<T extends (...args: any[]) => any>(func: T, limit: number): T
          }

          // Context information
          context: {
            userId: string
            documentId: string
            sessionId?: string
            permissions: string[]
            environment: 'development' | 'production'
            version: string
          }
        }

        interface SafeNode {
          id: string
          name: string
          type: string
          properties: Record<string, any>
          transform: SafeTransform
          children: string[]
          parentId?: string
          isVisible: boolean
          isSelected: boolean
          bounds: SafeBounds
        }

        interface SafeScene {
          id: string
          name: string
          duration: number
          frameRate: number
          rootNode: string
          nodes: SafeNode[]
        }

        interface SafeTimeline {
          id: string
          name: string
          duration: number
          frameRate: number
          tracks: SafeTrack[]
          isPlaying: boolean
          currentTime: number
        }

        interface SafeTrack {
          id: string
          name: string
          type: string
          keyframes: SafeKeyframe[]
          enabled: boolean
          locked: boolean
        }

        interface SafeKeyframe {
          time: number
          value: any
          interpolation: string
        }

        interface SafeTransform {
          position: { x: number; y: number; z: number }
          rotation: { x: number; y: number; z: number }
          scale: { x: number; y: number; z: number }
          opacity: number
        }

        interface SafeBounds {
          x: number
          y: number
          width: number
          height: number
        }

        interface SafeRenderResult {
          frameId: string
          time: number
          duration: number
          metadata: Record<string, any>
        }

        interface SafeViewportOptions {
          width: number
          height: number
          backgroundColor: { r: number; g: number; b: number; a: number }
          showGuides: boolean
          showGrid: boolean
          zoom: number
          pan: { x: number; y: number }
        }

        interface SafeViewport {
          id: string
          container: HTMLElement
          canvas: HTMLCanvasElement
          width: number
          height: number
          zoom: number
          pan: { x: number; y: number }
        }

        interface SafeCamera {
          position: { x: number; y: number; z: number }
          rotation: { x: number; y: number; z: number }
          fieldOfView: number
          nearPlane: number
          farPlane: number
        }
      }

      export {}
    `
    }

    /**
     * Get completions for Animator API
     */
    const getCompletions = () => {
      const completions = [
        // Scene Graph API completions
        {
          label: 'api.sceneGraph.createNode',
          kind: 0,
          insertText:
            'api.sceneGraph.createNode(${1:type}, ${2:parentId}, ${3:name})',
          documentation: 'Creates a new node in the scene graph',
        },
        {
          label: 'api.sceneGraph.getNode',
          kind: 0,
          insertText: 'api.sceneGraph.getNode(${1:nodeId})',
          documentation: 'Retrieves a node by ID',
        },
        {
          label: 'api.sceneGraph.updateNode',
          kind: 0,
          insertText: 'api.sceneGraph.updateNode(${1:nodeId}, ${2:updates})',
          documentation: 'Updates node properties and transform',
        },
        {
          label: 'api.sceneGraph.deleteNode',
          kind: 0,
          insertText: 'api.sceneGraph.deleteNode(${1:nodeId})',
          documentation: 'Deletes a node and its children',
        },
        {
          label: 'api.sceneGraph.setParent',
          kind: 0,
          insertText: 'api.sceneGraph.setParent(${1:nodeId}, ${2:parentId})',
          documentation: 'Moves a node to a new parent',
        },
        {
          label: 'api.sceneGraph.getChildren',
          kind: 0,
          insertText: 'api.sceneGraph.getChildren(${1:nodeId})',
          documentation: 'Gets all direct children of a node',
        },
        {
          label: 'api.sceneGraph.getDescendants',
          kind: 0,
          insertText: 'api.sceneGraph.getDescendants(${1:nodeId})',
          documentation: 'Gets all descendants of a node',
        },
        {
          label: 'api.sceneGraph.setProperty',
          kind: 0,
          insertText:
            'api.sceneGraph.setProperty(${1:nodeId}, ${2:key}, ${3:value})',
          documentation: 'Sets a property value on a node',
        },
        {
          label: 'api.sceneGraph.getProperty',
          kind: 0,
          insertText: 'api.sceneGraph.getProperty(${1:nodeId}, ${2:key})',
          documentation: 'Gets a property value from a node',
        },
        {
          label: 'api.sceneGraph.selectNodes',
          kind: 0,
          insertText: 'api.sceneGraph.selectNodes(${1:nodeIds})',
          documentation: 'Selects multiple nodes',
        },
        {
          label: 'api.sceneGraph.getCurrentScene',
          kind: 0,
          insertText: 'api.sceneGraph.getCurrentScene()',
          documentation: 'Gets the current active scene',
        },

        // Timeline API completions
        {
          label: 'api.timeline.createTimeline',
          kind: 0,
          insertText:
            'api.timeline.createTimeline(${1:name}, ${2:duration}, ${3:frameRate})',
          documentation: 'Creates a new timeline',
        },
        {
          label: 'api.timeline.getTimeline',
          kind: 0,
          insertText: 'api.timeline.getTimeline(${1:timelineId})',
          documentation: 'Retrieves a timeline by ID',
        },
        {
          label: 'api.timeline.play',
          kind: 0,
          insertText: 'api.timeline.play(${1:timelineId})',
          documentation: 'Starts playback of a timeline',
        },
        {
          label: 'api.timeline.pause',
          kind: 0,
          insertText: 'api.timeline.pause(${1:timelineId})',
          documentation: 'Pauses timeline playback',
        },
        {
          label: 'api.timeline.stop',
          kind: 0,
          insertText: 'api.timeline.stop(${1:timelineId})',
          documentation: 'Stops timeline playback',
        },
        {
          label: 'api.timeline.seek',
          kind: 0,
          insertText: 'api.timeline.seek(${1:timelineId}, ${2:time})',
          documentation: 'Seeks to a specific time in the timeline',
        },
        {
          label: 'api.timeline.createTrack',
          kind: 0,
          insertText:
            'api.timeline.createTrack(${1:timelineId}, ${2:type}, ${3:name})',
          documentation: 'Creates a new track in a timeline',
        },
        {
          label: 'api.timeline.addKeyframe',
          kind: 0,
          insertText:
            'api.timeline.addKeyframe(${1:trackId}, ${2:time}, ${3:value})',
          documentation: 'Adds a keyframe to a track',
        },
        {
          label: 'api.timeline.getKeyframes',
          kind: 0,
          insertText: 'api.timeline.getKeyframes(${1:trackId})',
          documentation: 'Gets all keyframes in a track',
        },
        {
          label: 'api.timeline.addMarker',
          kind: 0,
          insertText:
            'api.timeline.addMarker(${1:timelineId}, ${2:time}, ${3:name})',
          documentation: 'Adds a marker to a timeline',
        },

        // Rendering API completions
        {
          label: 'api.rendering.renderFrame',
          kind: 0,
          insertText: 'api.rendering.renderFrame(${1:sceneId}, ${2:time})',
          documentation: 'Renders a single frame',
        },
        {
          label: 'api.rendering.renderRange',
          kind: 0,
          insertText:
            'api.rendering.renderRange(${1:sceneId}, ${2:startTime}, ${3:endTime})',
          documentation: 'Renders a range of frames',
        },
        {
          label: 'api.rendering.createViewport',
          kind: 0,
          insertText:
            'api.rendering.createViewport(${1:container}, ${2:options})',
          documentation: 'Creates a viewport for preview',
        },
        {
          label: 'api.rendering.updateViewport',
          kind: 0,
          insertText:
            'api.rendering.updateViewport(${1:viewportId}, ${2:updates})',
          documentation: 'Updates viewport settings',
        },
        {
          label: 'api.rendering.setCamera',
          kind: 0,
          insertText: 'api.rendering.setCamera(${1:viewportId}, ${2:camera})',
          documentation: 'Sets camera for a viewport',
        },
        {
          label: 'api.rendering.exportFrame',
          kind: 0,
          insertText: 'api.rendering.exportFrame(${1:viewportId}, ${2:format})',
          documentation: 'Exports current frame',
        },
        {
          label: 'api.rendering.uploadAsset',
          kind: 0,
          insertText: 'api.rendering.uploadAsset(${1:assetId}, ${2:data})',
          documentation: 'Uploads asset data to GPU',
        },

        // Collaboration API completions
        {
          label: 'api.collaboration.createSession',
          kind: 0,
          insertText:
            'api.collaboration.createSession(${1:documentId}, ${2:participants})',
          documentation: 'Creates a new collaboration session',
        },
        {
          label: 'api.collaboration.joinSession',
          kind: 0,
          insertText:
            'api.collaboration.joinSession(${1:sessionId}, ${2:participant})',
          documentation: 'Joins an existing session',
        },
        {
          label: 'api.collaboration.updatePresence',
          kind: 0,
          insertText:
            'api.collaboration.updatePresence(${1:sessionId}, ${2:presence})',
          documentation: 'Updates user presence information',
        },
        {
          label: 'api.collaboration.subscribeToChanges',
          kind: 0,
          insertText:
            'api.collaboration.subscribeToChanges(${1:sessionId}, ${2:callback})',
          documentation: 'Subscribes to document changes',
        },

        // Plugin API completions
        {
          label: 'api.plugins.installPlugin',
          kind: 0,
          insertText: 'api.plugins.installPlugin(${1:pluginId}, ${2:source})',
          documentation: 'Installs a new plugin',
        },
        {
          label: 'api.plugins.listPlugins',
          kind: 0,
          insertText: 'api.plugins.listPlugins()',
          documentation: 'Lists all installed plugins',
        },
        {
          label: 'api.plugins.executePlugin',
          kind: 0,
          insertText:
            'api.plugins.executePlugin(${1:pluginId}, ${2:functionName}, ${3:parameters})',
          documentation: 'Executes a plugin function',
        },

        // Document API completions
        {
          label: 'api.documents.createDocument',
          kind: 0,
          insertText: 'api.documents.createDocument(${1:template})',
          documentation: 'Creates a new document',
        },
        {
          label: 'api.documents.openDocument',
          kind: 0,
          insertText: 'api.documents.openDocument(${1:documentId})',
          documentation: 'Opens an existing document',
        },
        {
          label: 'api.documents.saveDocument',
          kind: 0,
          insertText: 'api.documents.saveDocument(${1:documentId})',
          documentation: 'Saves the current document',
        },
        {
          label: 'api.documents.getTemplates',
          kind: 0,
          insertText: 'api.documents.getTemplates()',
          documentation: 'Gets available document templates',
        },

        // Settings API completions
        {
          label: 'api.settings.getSettings',
          kind: 0,
          insertText: 'api.settings.getSettings()',
          documentation: 'Gets current application settings',
        },
        {
          label: 'api.settings.updateSettings',
          kind: 0,
          insertText: 'api.settings.updateSettings(${1:settings})',
          documentation: 'Updates application settings',
        },
        {
          label: 'api.settings.getShortcuts',
          kind: 0,
          insertText: 'api.settings.getShortcuts()',
          documentation: 'Gets keyboard shortcuts',
        },
        {
          label: 'api.settings.setShortcut',
          kind: 0,
          insertText: 'api.settings.setShortcut(${1:action}, ${2:keys})',
          documentation: 'Sets a keyboard shortcut',
        },

        // System API completions
        {
          label: 'api.system.getSystemInfo',
          kind: 0,
          insertText: 'api.system.getSystemInfo()',
          documentation: 'Gets system information',
        },
        {
          label: 'api.system.getCapabilities',
          kind: 0,
          insertText: 'api.system.getCapabilities()',
          documentation: 'Gets system capabilities',
        },
        {
          label: 'api.system.hasFeature',
          kind: 0,
          insertText: 'api.system.hasFeature(${1:feature})',
          documentation: 'Checks if a feature is supported',
        },
        {
          label: 'api.system.getSupportedFormats',
          kind: 0,
          insertText: 'api.system.getSupportedFormats()',
          documentation: 'Gets supported file formats',
        },

        // Utility completions
        {
          label: 'api.utils.log',
          kind: 0,
          insertText: 'api.utils.log(${1:...args})',
          documentation: 'Logs messages to the console',
        },
        {
          label: 'api.utils.generateId',
          kind: 0,
          insertText: 'api.utils.generateId()',
          documentation: 'Generates a unique ID',
        },
        {
          label: 'api.utils.sleep',
          kind: 0,
          insertText: 'await api.utils.sleep(${1:ms})',
          documentation: 'Pauses execution for specified milliseconds',
        },
        {
          label: 'api.utils.formatTime',
          kind: 0,
          insertText: 'api.utils.formatTime(${1:time})',
          documentation: 'Formats time as readable string',
        },
        {
          label: 'api.utils.formatColor',
          kind: 0,
          insertText: 'api.utils.formatColor(${1:color})',
          documentation: 'Formats color object as string',
        },
        {
          label: 'api.utils.debounce',
          kind: 0,
          insertText: 'api.utils.debounce(${1:func}, ${2:wait})',
          documentation: 'Creates a debounced version of a function',
        },
        {
          label: 'api.utils.throttle',
          kind: 0,
          insertText: 'api.utils.throttle(${1:func}, ${2:limit})',
          documentation: 'Creates a throttled version of a function',
        },

        // Context completions
        {
          label: 'api.context.userId',
          kind: 3,
          insertText: 'api.context.userId',
          documentation: 'Current user ID',
        },
        {
          label: 'api.context.documentId',
          kind: 3,
          insertText: 'api.context.documentId',
          documentation: 'Current document ID',
        },
        {
          label: 'api.context.permissions',
          kind: 3,
          insertText: 'api.context.permissions',
          documentation: 'User permissions array',
        },
        {
          label: 'api.context.environment',
          kind: 3,
          insertText: 'api.context.environment',
          documentation: 'Current environment (development/production)',
        },
      ]

      return completions
    }

    /**
     * Fallback editor for when Monaco fails to load
     */
    const renderFallbackEditor = () => {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1e1e1e',
            color: '#ffffff',
            border: 'none',
            outline: 'none',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '14px',
            padding: '8px',
            resize: 'none',
          }}
          placeholder="Enter your JavaScript code here..."
        />
      )
    }

    return (
      <div
        ref={containerRef}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: '100%',
          position: 'relative',
        }}
      />
    )
  }
)

CodeEditor.displayName = 'CodeEditor'
