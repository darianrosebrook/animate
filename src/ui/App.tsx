import { useState, useEffect, useRef } from 'react'
import { Play, Settings, Info } from 'lucide-react'
import './App.css'
import {
  SceneGraph,
  createRectangleNode,
  createCircleNode,
  createTransformNode,
} from '@/core/scene-graph'
import { Renderer } from '@/core/renderer'
import {
  useKeyboardShortcuts,
  useKeyboardShortcutListener,
} from '@/ui/hooks/use-keyboard-shortcuts'
import { KeyboardShortcutsHelp } from '@/ui/components/KeyboardShortcutsHelp'
import { KeyboardShortcutsSettings } from '@/ui/components/KeyboardShortcutsSettings'
import './components/KeyboardShortcutsHelp.css'
import './components/KeyboardShortcutsSettings.css'

function App() {
  const [count, setCount] = useState(0)
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null)
  const [sceneGraph] = useState(() => new SceneGraph())
  const [renderer, setRenderer] = useState<Renderer | null>(null)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showShortcutsSettings, setShowShortcutsSettings] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize WebGPU support check
  useEffect(() => {
    Renderer.getSupportInfo().then((info) => {
      setWebgpuSupported(info.supported)
    })
  }, [])

  // Initialize renderer and scene graph
  useEffect(() => {
    if (!canvasRef.current || !webgpuSupported) return

    const initRenderer = async () => {
      const rendererInstance = new Renderer()
      const result = await rendererInstance.initialize(canvasRef.current!)

      if (result.success) {
        setRenderer(rendererInstance)

        // Create a simple scene
        const redRect = createRectangleNode(
          'red-rect',
          'Red Rectangle',
          100,
          100,
          { x: 100, y: 100 }
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
          { x: 300, y: 200 }
        )
        const blueRectWithColor = blueRect.withProperties({
          ...blueRect.properties,
          fillColor: { r: 0, g: 0, b: 255, a: 1 },
        })

        const greenCircle = createCircleNode(
          'green-circle',
          'Green Circle',
          75,
          { x: 500, y: 150 }
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
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        }

        await renderer.renderFrame(sceneGraph, 0.0, context)
      } else {
        console.error('Failed to initialize renderer:', result.error)
      }
    }

    initRenderer()

    return () => {
      renderer?.destroy()
    }
  }, [webgpuSupported, sceneGraph])

  // Setup keyboard shortcuts
  const { setContext } = useKeyboardShortcuts()

  useEffect(() => {
    setContext('viewport')
  }, [setContext])

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
    if (!renderer || !canvasRef.current) return

    const context = {
      time: count * 0.1,
      frameRate: 30,
      resolution: { width: 800, height: 600 },
      devicePixelRatio: 1.0,
      globalProperties: {},
    }

    await renderer.renderFrame(sceneGraph, context.time, context)
    setCount(count + 1)
  }

  return (
    <>
      <div>
        <h1>Animator</h1>

        {webgpuSupported === null && <p>Checking WebGPU support...</p>}

        {webgpuSupported === false && (
          <div className="warning">
            <p>⚠️ WebGPU is not supported in this browser.</p>
            <p>Please use Chrome, Firefox, or Safari Technology Preview.</p>
          </div>
        )}

        {webgpuSupported === true && (
          <>
            <div className="canvas-container">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{
                  border: '1px solid #333',
                  backgroundColor: '#111',
                }}
              />
            </div>

            <div className="card">
              <div className="button-group">
                <button onClick={handleRenderFrame} className="btn-primary">
                  <Play size={16} />
                  Render Frame ({count})
                </button>
                <button className="btn-secondary" title="Settings">
                  <Settings size={16} />
                </button>
                <button className="btn-info" title="Help">
                  <Info size={16} />
                </button>
              </div>
              <p>Scene contains: 3 shapes (2 rectangles, 1 circle)</p>
              <p>
                Edit <code>src/ui/App.tsx</code> and save to test HMR
              </p>
            </div>
          </>
        )}

        <p className="read-the-docs">
          Get started by reading the{' '}
          <a href="/implementation/README.md" target="_blank">
            implementation guide
          </a>
          .
        </p>
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
