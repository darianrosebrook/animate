import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Settings, Info, Split } from 'lucide-react'
import './App.css'
import {
  SceneGraph,
  createRectangleNode,
  createCircleNode,
} from '@/core/scene-graph'
import { Renderer } from '@/core/renderer'
import {
  useKeyboardShortcuts,
  useKeyboardShortcutListener,
} from '@/ui/hooks/use-keyboard-shortcuts'
import { useTimeline } from '@/ui/hooks/use-timeline'
import { TimelinePanel } from '@/ui/timeline'
import { CanvasManager } from '@/ui/utils/canvas-manager'
import { KeyboardShortcutsHelp } from '@/ui/components/KeyboardShortcutsHelp'
import { KeyboardShortcutsSettings } from '@/ui/components/KeyboardShortcutsSettings'
import './components/KeyboardShortcutsHelp.css'
import './components/KeyboardShortcutsSettings.css'

function App() {
  const [_count, _setCount] = useState(0)
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null)
  const [sceneGraph] = useState(() => new SceneGraph())
  const [renderer, setRenderer] = useState<Renderer | null>(null)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showShortcutsSettings, setShowShortcutsSettings] = useState(false)
  const [showTimeline, setShowTimeline] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null)

  // Timeline state management
  const {
    timeline,
    updateTimeline,
    selectKeyframes,
    moveKeyframe,
    addKeyframe,
    deleteKeyframes,
    toggleTrack,
    expandTrack,
    setPlaybackSpeed,
    toggleLoop,
  } = useTimeline()

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
    if (!canvasRef.current || !webgpuSupported || !canvasManager) return

    const initRenderer = async () => {
      const rendererInstance = new Renderer()
      const result = await rendererInstance.initialize(canvasRef.current!)

      if (result.success) {
        setRenderer(rendererInstance)

        // Get canvas configuration for scene setup
        const canvasConfig = canvasManager.getConfig()

        // Create a simple scene
        const redRect = createRectangleNode(
          'red-rect',
          'Red Rectangle',
          100,
          100,
          { x: canvasConfig.width * 0.2, y: canvasConfig.height * 0.3 }
        )
        const redRectWithColor = redRect.withProperties({
          ...redRect.properties,
          fillColor: { r: 255, g: 0, b: 0, a: 1 },
        })

        const blueRect = createRectangleNode(
          'blue-rect',
          'Blue Rectangle',
          50,
          50,
          { x: canvasConfig.width * 0.6, y: canvasConfig.height * 0.5 }
        )
        const blueRectWithColor = blueRect.withProperties({
          ...blueRect.properties,
          fillColor: { r: 0, g: 0, b: 255, a: 1 },
        })

        const greenCircle = createCircleNode(
          'green-circle',
          'Green Circle',
          75,
          { x: canvasConfig.width * 0.8, y: canvasConfig.height * 0.4 }
        )
        const greenCircleWithColor = greenCircle.withProperties({
          ...greenCircle.properties,
          fillColor: { r: 0, g: 255, b: 0, a: 1 },
        })

        sceneGraph.addNode(redRectWithColor)
        sceneGraph.addNode(blueRectWithColor)
        sceneGraph.addNode(greenCircleWithColor)

        // Render initial frame
        const context = {
          time: 0.0,
          frameRate: 30,
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
  }, [webgpuSupported, sceneGraph, canvasManager])

  // Setup keyboard shortcuts
  const { setContext } = useKeyboardShortcuts()

  useEffect(() => {
    setContext('viewport')
  }, [setContext])

  // Watch for timeline changes and trigger re-rendering
  useEffect(() => {
    if (renderer && canvasRef.current) {
      // Debounce rapid timeline changes to avoid excessive rendering
      const timeoutId = setTimeout(() => {
        handleRenderFrame()
      }, 16) // ~60fps

      return () => clearTimeout(timeoutId)
    }
  }, [timeline.currentTime, timeline.tracks])

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
      default:
        console.log('Keyboard shortcut:', shortcut.description)
    }
  })

  const handleRenderFrame = async () => {
    if (!renderer || !canvasManager) return

    // Apply timeline keyframes to scene graph before rendering
    applyTimelineToSceneGraph(timeline, sceneGraph)

    const canvasConfig = canvasManager.getConfig()
    const context = {
      time: timeline.currentTime,
      frameRate: timeline.frameRate,
      resolution: canvasManager.getPhysicalSize(),
      devicePixelRatio: canvasConfig.devicePixelRatio,
      globalProperties: {},
      canvas: canvasConfig,
    }

    await renderer.renderFrame(sceneGraph, context.time, context)
  }

  // Apply timeline keyframes to scene graph nodes
  const applyTimelineToSceneGraph = (
    timelineState: any,
    sceneGraph: SceneGraph
  ) => {
    timelineState.tracks.forEach((track: any) => {
      if (!track.enabled || !track.targetNodeId) return

      const nodeResult = sceneGraph.getNode(track.targetNodeId)
      if (!nodeResult.success) return

      const _node = nodeResult.data

      // Evaluate keyframes for this track
      const evaluatedValue = evaluateTrackAtTime(
        track,
        timelineState.currentTime
      )
      if (evaluatedValue === undefined) return

      // Apply the evaluated value to the scene graph node
      sceneGraph.updateNodeProperties(track.targetNodeId, {
        [track.propertyPath]: evaluatedValue,
      })
    })
  }

  // Evaluate a track's keyframes at a specific time
  const evaluateTrackAtTime = (track: any, time: number): any => {
    if (!track.keyframes || track.keyframes.length === 0) return undefined

    // Sort keyframes by time
    const sortedKeyframes = [...track.keyframes].sort((a, b) => a.time - b.time)

    // Handle single keyframe case
    if (sortedKeyframes.length === 1) {
      return sortedKeyframes[0].value
    }

    // Find the appropriate keyframe segment
    let startKeyframe = sortedKeyframes[0]
    let endKeyframe = sortedKeyframes[sortedKeyframes.length - 1]

    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      if (
        time >= sortedKeyframes[i].time &&
        time <= sortedKeyframes[i + 1].time
      ) {
        startKeyframe = sortedKeyframes[i]
        endKeyframe = sortedKeyframes[i + 1]
        break
      }
    }

    // Calculate interpolation parameter
    const segmentDuration = endKeyframe.time - startKeyframe.time
    if (segmentDuration === 0) return startKeyframe.value

    const t = Math.max(
      0,
      Math.min(1, (time - startKeyframe.time) / segmentDuration)
    )

    // Apply interpolation based on mode
    return interpolateValues(
      startKeyframe.value,
      endKeyframe.value,
      t,
      startKeyframe.interpolation
    )
  }

  // Interpolate between two values
  const interpolateValues = (
    startValue: any,
    endValue: any,
    t: number,
    interpolation: string
  ): any => {
    switch (interpolation) {
      case 'linear':
        return linearInterpolation(startValue, endValue, t)
      case 'ease':
      case 'ease-in':
      case 'ease-out':
      case 'ease-in-out':
        return smoothInterpolation(startValue, endValue, t)
      case 'bezier':
        return bezierInterpolation(startValue, endValue, t)
      default:
        return linearInterpolation(startValue, endValue, t)
    }
  }

  const linearInterpolation = (
    startValue: any,
    endValue: any,
    t: number
  ): any => {
    if (typeof startValue === 'number' && typeof endValue === 'number') {
      return startValue + t * (endValue - startValue)
    }

    if (startValue && endValue && typeof startValue === 'object') {
      if ('x' in startValue && 'y' in endValue) {
        return {
          x: linearInterpolation(startValue.x, endValue.x, t),
          y: linearInterpolation(startValue.y, endValue.y, t),
        }
      }

      if ('r' in startValue && 'g' in endValue && 'b' in endValue) {
        return {
          r: linearInterpolation(startValue.r, endValue.r, t),
          g: linearInterpolation(startValue.g, endValue.g, t),
          b: linearInterpolation(startValue.b, endValue.b, t),
          a: linearInterpolation(startValue.a ?? 1, endValue.a ?? 1, t),
        }
      }
    }

    return startValue
  }

  const smoothInterpolation = (
    startValue: any,
    endValue: any,
    t: number
  ): any => {
    // Smoothstep function: 3t^2 - 2t^3
    const smoothT = t * t * (3.0 - 2.0 * t)
    return linearInterpolation(startValue, endValue, smoothT)
  }

  const bezierInterpolation = (
    startValue: any,
    endValue: any,
    t: number
  ): any => {
    // Simple bezier-like interpolation
    const bezierT = t * t * (3.0 - 2.0 * t)
    return linearInterpolation(startValue, endValue, bezierT)
  }

  return (
    <>
      <div className="app-layout">
        <div className="app-header">
          <h1>Animator</h1>
          <div className="header-controls">
            <button
              className={`btn-secondary ${showTimeline ? 'active' : ''}`}
              onClick={() => setShowTimeline(!showTimeline)}
              title="Toggle Timeline"
            >
              <Split size={16} />
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
          <div className="viewport-section">
            {webgpuSupported === null && <p>Checking WebGPU support...</p>}

            {webgpuSupported === false && (
              <div className="warning">
                <p>⚠️ WebGPU is not supported in this browser.</p>
                <p>Please use Chrome, Firefox, or Safari Technology Preview.</p>
              </div>
            )}

            {webgpuSupported === true && (
              <>
                <div className="canvas-container" ref={canvasContainerRef}>
                  <canvas
                    ref={canvasRef}
                    style={{
                      border: '1px solid #333',
                      backgroundColor: '#111',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>

                <div className="viewport-controls">
                  <button
                    onClick={() =>
                      updateTimeline((prev) => ({
                        ...prev,
                        isPlaying: !prev.isPlaying,
                      }))
                    }
                    className="btn-primary"
                  >
                    {timeline.isPlaying ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                    {timeline.isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    onClick={() => {
                      updateTimeline((prev) => ({
                        ...prev,
                        isPlaying: false,
                        currentTime: 0,
                      }))
                    }}
                    className="btn-secondary"
                  >
                    <Square size={16} />
                    Stop
                  </button>
                  <button onClick={handleRenderFrame} className="btn-secondary">
                    Render Frame
                  </button>
                  <span className="frame-info">
                    Time: {timeline.currentTime.toFixed(2)}s | Frame:{' '}
                    {Math.floor(timeline.currentTime * timeline.frameRate)}
                  </span>
                </div>
              </>
            )}

            <p className="read-the-docs">
              Scene contains: 3 shapes (2 rectangles, 1 circle) |{' '}
              <a href="/implementation/README.md" target="_blank">
                View implementation guide
              </a>
            </p>
          </div>

          {showTimeline && (
            <div className="timeline-section">
              <TimelinePanel
                timeline={timeline}
                onTimelineChange={updateTimeline}
                onKeyframeSelect={selectKeyframes}
                onKeyframeMove={moveKeyframe}
                onKeyframeAdd={addKeyframe}
                onKeyframeDelete={deleteKeyframes}
                onTrackToggle={toggleTrack}
                onTrackExpand={expandTrack}
                onPlaybackSpeedChange={setPlaybackSpeed}
                onLoopToggle={toggleLoop}
              />
            </div>
          )}
        </div>
      </div>

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
