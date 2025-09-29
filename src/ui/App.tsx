import React, { useState, useEffect, useRef } from 'react'
import { Settings, Info } from 'lucide-react'
import './App.css'
import { SceneGraph } from '@/core/scene-graph'
import { Renderer } from '@/core/renderer'
import { useMode } from '@/ui/hooks/use-mode'
import { LeftPanel } from '@/ui/components/LeftPanel/LeftPanel'
import { WorkspaceCanvas } from '@/ui/canvas/WorkspaceCanvas'
import { PropertiesPanel } from '@/ui/components/PropertiesPanel/PropertiesPanel'
import { FloatingToolbar } from '@/ui/components/FloatingToolbar/FloatingToolbar'
import { ToolSelectionBar } from '@/ui/components/ToolSelectionBar'
import { ContextPane } from './components/ContextPane/ContextPane'
import { KeyframeTimeline } from '@/ui/components/KeyframeTimeline/KeyframeTimeline'
import { CanvasManager } from '@/ui/utils/canvas-manager'
import { KeyboardShortcutsHelp } from '@/ui/components/KeyboardShortcutsHelp'
import { KeyboardShortcutsSettings } from '@/ui/components/KeyboardShortcutsSettings'
import {
  useKeyboardShortcuts,
  useKeyboardShortcutListener,
} from '@/ui/hooks/use-keyboard-shortcuts'
import './components/LeftPanel/LeftPanel.css'
import './canvas/WorkspaceCanvas.css'
import './components/PropertiesPanel/PropertiesPanel.css'
import './components/FloatingToolbar/FloatingToolbar.css'
import './components/KeyframeTimeline/KeyframeTimeline.css'
import './components/KeyboardShortcutsHelp.css'
import './components/KeyboardShortcutsSettings.css'
import './components/ToolSelectionBar/ToolSelectionBar.css'
import './components/ContextPane/ContextPane.css'

function App() {
  const [_count, _setCount] = useState(0)
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null)
  const [sceneGraph] = useState(() => new SceneGraph())
  const [renderer, setRenderer] = useState<Renderer | null>(null)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showShortcutsSettings, setShowShortcutsSettings] = useState(false)
  const [timelineState, setTimelineState] = useState({
    currentTime: 0,
    duration: 10,
    isPlaying: false,
  })

  // Tool selection state
  const [activeToolId, setActiveToolId] = useState<string | null>('select')
  const [overlays, setOverlays] = useState({
    grid: false,
    guides: false,
    outlines: true,
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
    selectedLayers,
    setMode,
    setViewMode,
    setCurrentScene,
    addScene,
    setSelectedLayers,
    addLayer,
    updateLayer,
  } = useMode()

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
        console.error('Failed to initialize renderer:', result.error)
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
        console.log('Keyboard shortcut:', shortcut.description)
    }
  })

  const handlePlayPause = () => {
    setTimelineState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  const handleStop = () => {
    setTimelineState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }))
  }

  const handleTimeChange = (time: number) => {
    setTimelineState((prev) => ({ ...prev, currentTime: time }))
  }

  const handleAddKeyframe = (layerId: string, time: number) => {
    console.log(`Adding keyframe for layer ${layerId} at time ${time}`)
    // TODO: Implement keyframe addition logic
  }

  const handleToolChange = (toolId: string) => {
    setActiveToolId(toolId)
    // TODO: Update canvas interaction mode based on selected tool
    console.log(`Tool changed to: ${toolId}`)
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
        console.log(`Tool shortcut used: ${shortcut.description}`)
        break
    }
  }

  const handleLayerUpdate = (layerId: string, updates: any) => {
    // TODO: Implement layer update logic
    console.log(`Updating layer ${layerId}:`, updates)
  }

  const handleSceneUpdate = (sceneId: string, updates: any) => {
    // TODO: Implement scene update logic
    console.log(`Updating scene ${sceneId}:`, updates)
  }

  const handleSceneDelete = (sceneId: string) => {
    // TODO: Implement scene deletion logic
    console.log(`Deleting scene ${sceneId}`)
  }

  const handleSceneReorder = (sceneIds: string[]) => {
    // TODO: Implement scene reordering logic
    console.log('Reordering scenes:', sceneIds)
  }

  const handleLayerReparent = (layerId: string, newParentId: string | null) => {
    // TODO: Implement layer reparenting logic
    console.log(`Reparenting layer ${layerId} to ${newParentId}`)
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
            selectedLayers={selectedLayers}
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
            onLayerDelete={(layerId) => {
              // TODO: Implement layer deletion
              console.log(`Deleting layer ${layerId}`)
            }}
            onLayerSelect={setSelectedLayers}
            onLayerReorder={(sceneId, layerIds) => {
              // TODO: Implement layer reordering
              console.log(`Reordering layers in scene ${sceneId}:`, layerIds)
            }}
            onLayerReparent={handleLayerReparent}
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
                selectedLayers={selectedLayers}
                onLayerSelect={setSelectedLayers}
                onLayerUpdate={handleLayerUpdate}
                onSceneReorder={handleSceneReorder}
                onSceneUpdate={handleSceneUpdate}
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
            selectedLayers={selectedLayers}
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

      {/* Floating Toolbar */}
      <FloatingToolbar
        mode={project.mode}
        isPlaying={timelineState.isPlaying}
        onModeChange={setMode}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        onAddKeyframe={handleAddKeyframe}
      />

      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      <KeyboardShortcutsSettings
        isOpen={showShortcutsSettings}
        onClose={() => setShowShortcutsSettings(false)}
      />
    </>
  )
}

export default App
