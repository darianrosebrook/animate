import React, { useState, useEffect, useRef } from 'react'
import { Settings, Info, Download } from 'lucide-react'
import './App.css'
import { SceneGraph } from '@/core/scene-graph'
import { Renderer } from '@/core/renderer'
import type { SceneNode, KeyboardShortcut } from '@/types'
import { useMode } from '@/ui/hooks/use-mode'
import { LeftPanel } from '@/ui/components/LeftPanel/LeftPanel'
import { WorkspaceCanvas } from '@/ui/canvas/WorkspaceCanvas'
import { ExportManager } from '@/ui/components/ExportManager/ExportManager'
import { ToolSelectionBar } from '@/ui/components/ToolSelectionBar'
import { ContextPane } from './components/ContextPane/ContextPane'
import { CanvasManager } from '@/ui/utils/canvas-manager'
import { KeyboardShortcutsHelp } from '@/ui/components/KeyboardShortcutsHelp'
import { KeyboardShortcutsSettings } from '@/ui/components/KeyboardShortcutsSettings'
import {
  useKeyboardShortcuts,
  useKeyboardShortcutListener,
} from '@/ui/hooks/use-keyboard-shortcuts'
import './components/LeftPanel/LeftPanel.css'
import './canvas/WorkspaceCanvas.css'
import './components/ExportManager/ExportManager.css'
import './components/KeyframeTimeline/KeyframeTimeline.css'
import './components/KeyboardShortcutsHelp.css'
import './components/KeyboardShortcutsSettings.css'
import './components/ToolSelectionBar/ToolSelectionBar.css'
import './components/ContextPane/ContextPane.css'
import { logger } from '@/core/logging/logger'

function App() {
  const [_count, _setCount] = useState(0)
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null)
  const [sceneGraph] = useState(() => new SceneGraph())
  const [renderer, setRenderer] = useState<Renderer | null>(null)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showShortcutsSettings, setShowShortcutsSettings] = useState(false)
  const [showExportManager, setShowExportManager] = useState(false)
  const [timelineState, setTimelineState] = useState({
    currentTime: 0,
    duration: 10,
    isPlaying: false,
  })

  // Tool selection state
  const [activeToolId, setActiveToolId] = useState<string | null>('select')
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])
  const [canvasSelection, setCanvasSelection] = useState<Set<string>>(new Set())
  const [overlays, setOverlays] = useState({
    grid: false,
    guides: false,
    outlines: false,
    rulers: false,
    safeZones: false,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null)

  // New mode-based state management
  const {
    project,
    currentScene,
    setViewMode,
    setCurrentScene,
    addScene,
    addLayer,
    updateLayer,
  } = useMode()

  // Selection state management

  // Handle canvas selection changes
  const handleCanvasSelectionChange = (selectedIds: Set<string>) => {
    setCanvasSelection(selectedIds)
    // Sync with layers panel - pass string IDs
    setSelectedLayers(Array.from(selectedIds))
  }

  // Handle layer rename from layers panel
  const handleLayerRename = (layerId: string, newName: string) => {
    updateLayer(currentScene?.id || 'scene-1', layerId, { name: newName })
  }

  // Calculate union bounds for multiple nodes
  const calculateUnionBounds = (nodes: SceneNode[]) => {
    if (nodes.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const node of nodes) {
      const transform = node.properties?.transform as any
      if (transform && transform.position) {
        minX = Math.min(minX, transform.position.x || 0)
        minY = Math.min(minY, transform.position.y || 0)
        maxX = Math.max(
          maxX,
          (transform.position.x || 0) + (transform.scale?.x || 1) * 100
        )
        maxY = Math.max(
          maxY,
          (transform.position.y || 0) + (transform.scale?.y || 1) * 100
        )
      }
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  // Handle zoom to fit from layers panel
  const handleLayerZoomToFit = (layerIds: string[]) => {
    if (!currentScene || layerIds.length === 0) return

    // Find the selected nodes
    const selectedNodes = currentScene.layers.filter((node) =>
      layerIds.includes(node.id)
    )
    if (selectedNodes.length === 0) return

    // Calculate union bounds
    const unionBounds = calculateUnionBounds(selectedNodes)
    if (!unionBounds) return

    // Get canvas container dimensions
    const canvasContainer = document.querySelector('.scene-editor-canvas')
    if (!canvasContainer) return

    const containerRect = canvasContainer.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    // Calculate required zoom to fit bounds in container
    const scaleX = containerWidth / unionBounds.width
    const scaleY = containerHeight / unionBounds.height
    const requiredZoom = Math.min(scaleX, scaleY) * 0.9 // 90% to add some padding

    // Calculate center point
    const centerX = unionBounds.x + unionBounds.width / 2
    const centerY = unionBounds.y + unionBounds.height / 2

    // Calculate new pan to center the bounds
    const newPanX = -centerX * requiredZoom + containerWidth / 2
    const newPanY = -centerY * requiredZoom + containerHeight / 2

    // Apply zoom and pan
    logger.info('Applying zoom to fit:', {
      requiredZoom,
      newPanX,
      newPanY,
      bounds: unionBounds,
    })

    // Note: We would need to expose zoom/pan setters from WorkspaceCanvas
    // For now, this demonstrates the calculation logic
  }

  // Handle layer reparent from layers panel
  const handleLayerReparent = (
    _layerId: string,
    _newParentId: string | null
  ) => {
    // PLACEHOLDER: Layer reparenting functionality - requires scene graph hierarchy management
    throw new Error(
      'PLACEHOLDER: Layer reparenting not implemented - requires scene graph hierarchy updates'
    )
  }

  // Update timeline duration when scene changes
  React.useEffect(() => {
    if (currentScene) {
      setTimelineState((prev) => ({ ...prev, duration: currentScene.duration }))
    }
  }, [currentScene])

  // Initialize WebGPU support check
  useEffect(() => {
    Renderer.getSupportInfo().then((info) => {
      setWebgpuSupported(info.supported)
    })
  }, [])

  // Initialize canvas manager
  useEffect(() => {
    if (canvasRef.current && canvasContainerRef.current) {
      const manager = new CanvasManager(
        canvasRef.current,
        canvasContainerRef.current
      )
      setCanvasManager(manager)

      return () => {
        manager.destroy()
      }
    }
  }, [])

  // Initialize renderer and scene graph
  useEffect(() => {
    if (
      !canvasRef.current ||
      !webgpuSupported ||
      !canvasManager ||
      !currentScene
    )
      return

    const initRenderer = async () => {
      const rendererInstance = new Renderer()
      const result = await rendererInstance.initialize(canvasRef.current!)

      if (result.success) {
        setRenderer(rendererInstance)

        // Get canvas configuration for scene setup
        const canvasConfig = canvasManager.getConfig()

        // Add layers from current scene to scene graph
        currentScene.layers.forEach((layer) => {
          sceneGraph.addNode(layer)
        })

        // Render initial frame
        const context = {
          time: 0.0,
          frameRate: currentScene.frameRate,
          resolution: canvasManager.getPhysicalSize(),
          devicePixelRatio: canvasConfig.devicePixelRatio,
          globalProperties: {},
          canvas: canvasConfig,
        }

        await renderer?.renderFrame(sceneGraph, 0.0, context)
      } else {
        logger.error('Failed to initialize renderer:', result.error as any)
      }
    }

    initRenderer()

    return () => {
      renderer?.destroy()
    }
  }, [webgpuSupported, canvasManager, currentScene])

  // Setup keyboard shortcuts
  const { setContext } = useKeyboardShortcuts()

  useEffect(() => {
    setContext('viewport')
  }, [setContext])

  // Watch for scene/layer changes and trigger re-rendering
  useEffect(() => {
    if (renderer && canvasRef.current && currentScene) {
      const timeoutId = setTimeout(() => {
        handleRenderFrame()
      }, 16) // ~60fps

      return () => clearTimeout(timeoutId)
    }
  }, [currentScene?.layers, selectedLayers])

  // Handle keyboard shortcuts
  useKeyboardShortcutListener((shortcut) => {
    switch (shortcut.key) {
      case '?':
        if (shortcut.shift) {
          setShowShortcutsHelp(true)
        }
        break
      case 'F12':
        // Toggle developer tools (handled by browser)
        break
      case ',':
        if (shortcut.meta) {
          setShowShortcutsSettings(true)
        }
        break
      case 'Escape':
        setShowShortcutsHelp(false)
        setShowShortcutsSettings(false)
        break
      case ' ':
        // Spacebar for play/pause
        handlePlayPause()
        break
      default:
        logger.info('Keyboard shortcut:', shortcut.description as any)
    }
  })

  const handlePlayPause = () => {
    setTimelineState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  const handleToolChange = (toolId: string) => {
    setActiveToolId(toolId)
    // PLACEHOLDER: Canvas interaction mode updates - requires canvas manager integration
    throw new Error(
      'PLACEHOLDER: Canvas interaction mode updates not implemented - requires canvas manager tool mode synchronization'
    )
  }

  const handleKeyboardShortcut = (shortcut: KeyboardShortcut) => {
    switch (shortcut.id) {
      case 'toggle-grid':
        setOverlays((prev) => ({ ...prev, grid: !prev.grid }))
        break
      case 'toggle-guides':
        setOverlays((prev) => ({ ...prev, guides: !prev.guides }))
        break
      case 'toggle-outlines':
        setOverlays((prev) => ({ ...prev, outlines: !prev.outlines }))
        break
      case 'toggle-rulers':
        setOverlays((prev) => ({ ...prev, rulers: !prev.rulers }))
        break
      case 'toggle-safe-zones':
        setOverlays((prev) => ({ ...prev, safeZones: !prev.safeZones }))
        break
      default:
        logger.info(`Tool shortcut used: ${shortcut.description}`)
        break
    }
  }

  const handleLayerUpdate = (_layerId: string, _updates: any) => {
    // PLACEHOLDER: Layer update logic - requires proper type definitions and scene graph integration
    throw new Error(
      'PLACEHOLDER: Layer update not implemented - requires proper type definitions for updates parameter'
    )
  }

  const handleSceneUpdate = (_updates: any) => {
    // PLACEHOLDER: Scene update logic - requires proper type definitions and scene management
    throw new Error(
      'PLACEHOLDER: Scene update not implemented - requires proper type definitions for updates parameter'
    )
  }

  const handleSceneDelete = (_sceneId: string) => {
    // PLACEHOLDER: Scene deletion logic - requires project state management and cleanup
    throw new Error(
      'PLACEHOLDER: Scene deletion not implemented - requires project state management and resource cleanup'
    )
  }

  const handleSceneReorder = (_sceneIds: string[]) => {
    // PLACEHOLDER: Scene reordering logic - requires project state management
    throw new Error(
      'PLACEHOLDER: Scene reordering not implemented - requires project state management and scene array updates'
    )
  }

  const handleExportStart = (_settings: any) => {
    // PLACEHOLDER: Export start logic - requires proper type definitions and export system integration
    throw new Error(
      'PLACEHOLDER: Export start not implemented - requires proper type definitions for settings parameter'
    )
  }

  const handleExportCancel = (_jobId: string) => {
    // PLACEHOLDER: Export cancellation logic - requires job management system
    throw new Error(
      'PLACEHOLDER: Export cancellation not implemented - requires job management and cleanup system'
    )
  }

  const handleRenderFrame = async () => {
    if (!renderer || !canvasManager || !currentScene) return

    // Update scene graph with current layers
    // For now, just re-add all layers (inefficient but works for demo)
    sceneGraph.clear()
    currentScene.layers.forEach((layer) => {
      sceneGraph.addNode(layer)
    })

    const canvasConfig = canvasManager.getConfig()
    const context = {
      time: timelineState?.currentTime || 0.0,
      frameRate: currentScene.frameRate,
      resolution: canvasManager.getPhysicalSize(),
      devicePixelRatio: canvasConfig.devicePixelRatio,
      globalProperties: {},
      canvas: canvasConfig,
    }

    await renderer.renderFrame(sceneGraph, context.time, context)
  }

  return (
    <>
      <div className="app-layout">
        <div className="app-header">
          <h1>{project.name}</h1>
          <div className="header-controls">
            <button
              className="btn-secondary"
              title="Export"
              onClick={() => setShowExportManager(true)}
            >
              <Download size={16} />
            </button>
            <button className="btn-secondary" title="Settings">
              <Settings size={16} />
            </button>
            <button className="btn-info" title="Help">
              <Info size={16} />
            </button>
          </div>
        </div>

        <div className="app-content">
          {/* Left Sidebar - Project Navigator */}
          <LeftPanel
            project={project}
            currentScene={currentScene}
            selectedLayers={
              currentScene?.layers.filter((layer) =>
                selectedLayers.includes(layer.id)
              ) || []
            }
            viewMode={project.viewMode}
            mode={project.mode}
            onViewModeChange={setViewMode}
            onSceneSelect={setCurrentScene}
            onSceneAdd={addScene}
            onSceneUpdate={handleSceneUpdate}
            onSceneDelete={handleSceneDelete}
            onSceneReorder={handleSceneReorder}
            onLayerAdd={addLayer}
            onLayerUpdate={handleLayerUpdate}
            onLayerDelete={(_layerId) => {
              // PLACEHOLDER: Layer deletion logic - requires scene state management and cleanup
              throw new Error(
                'PLACEHOLDER: Layer deletion not implemented - requires scene state management and resource cleanup'
              )
            }}
            onLayerSelect={setSelectedLayers}
            onLayerReorder={(_sceneId, _layerIds) => {
              // PLACEHOLDER: Layer reordering logic - requires scene state management
              throw new Error(
                'PLACEHOLDER: Layer reordering not implemented - requires scene state management and layer array updates'
              )
            }}
            onLayerReparent={handleLayerReparent}
            onLayerRename={handleLayerRename}
            onLayerZoomToFit={handleLayerZoomToFit}
            onZoomToFit={handleLayerZoomToFit}
          />

          {/* Main Canvas Area */}
          <div className="viewport-section">
            {webgpuSupported === null && <p>Checking WebGPU support...</p>}

            {webgpuSupported === false && (
              <div className="warning">
                <p>⚠️ WebGPU is not supported in this browser.</p>
                <p>Please use Chrome, Firefox, or Safari Technology Preview.</p>
              </div>
            )}

            {webgpuSupported === true && (
              <WorkspaceCanvas
                project={project}
                currentScene={currentScene}
                selectedLayers={
                  currentScene?.layers.filter((layer) =>
                    selectedLayers.includes(layer.id)
                  ) || []
                }
                activeTool={activeToolId ? (activeToolId as any) : null}
                onLayerSelect={setSelectedLayers}
                onLayerUpdate={handleLayerUpdate}
                onSceneReorder={handleSceneReorder}
                onSceneUpdate={handleSceneUpdate}
                onSelectionChange={handleCanvasSelectionChange}
              />
            )}

            <p className="read-the-docs">
              {currentScene ? (
                <>
                  Scene: {currentScene.name} | {currentScene.layers.length}{' '}
                  layers |{' '}
                  <a href="/implementation/README.md" target="_blank">
                    View implementation guide
                  </a>
                </>
              ) : (
                'No scene selected'
              )}
            </p>
          </div>

          {/* Right Sidebar - Context Pane */}
          <ContextPane
            mode={project.mode}
            currentScene={currentScene}
            selectedLayers={
              currentScene?.layers.filter((layer) =>
                selectedLayers.includes(layer.id)
              ) || []
            }
            onLayerUpdate={handleLayerUpdate}
            onSceneUpdate={handleSceneUpdate}
          />
        </div>
      </div>

      {/* Tool Selection Bar */}
      <ToolSelectionBar
        mode={project.mode}
        activeToolId={activeToolId}
        onToolChange={handleToolChange}
        onKeyboardShortcut={handleKeyboardShortcut}
      />

      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      <KeyboardShortcutsSettings
        isOpen={showShortcutsSettings}
        onClose={() => setShowShortcutsSettings(false)}
      />

      <ExportManager
        project={project}
        currentScene={currentScene}
        isOpen={showExportManager}
        onClose={() => setShowExportManager(false)}
        onExportStart={handleExportStart}
        onExportCancel={handleExportCancel}
      />
    </>
  )
}

export default App
