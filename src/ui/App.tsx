import { useState, useEffect, useRef } from 'react'
import './App.css'
import { SceneGraph, createRectangleNode, createCircleNode, createTransformNode } from '@/core/scene-graph'
import { Renderer } from '@/core/renderer'

function App() {
  const [count, setCount] = useState(0)
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null)
  const [sceneGraph] = useState(() => new SceneGraph())
  const [renderer, setRenderer] = useState<Renderer | null>(null)
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
      const newRenderer = new Renderer()
      const result = await newRenderer.initialize(canvasRef.current!)

      if (result.success) {
        setRenderer(newRenderer)

        // Create a simple scene
        const redRect = createRectangleNode(
          'red-rect',
          'Red Rectangle',
          100,
          100,
          { x: 100, y: 100 }
        )
        redRect.properties = {
          ...redRect.properties,
          fillColor: { r: 255, g: 0, b: 0, a: 1 },
        }

        const blueRect = createRectangleNode(
          'blue-rect',
          'Blue Rectangle',
          50,
          50,
          { x: 300, y: 200 }
        )
        blueRect.properties = {
          ...blueRect.properties,
          fillColor: { r: 0, g: 0, b: 255, a: 1 },
        }

        const greenCircle = createCircleNode(
          'green-circle',
          'Green Circle',
          75,
          { x: 500, y: 150 }
        )
        greenCircle.properties = {
          ...greenCircle.properties,
          fillColor: { r: 0, g: 255, b: 0, a: 1 },
        }

        sceneGraph.addNode(redRect)
        sceneGraph.addNode(blueRect)
        sceneGraph.addNode(greenCircle)

        // Render initial frame
        const context = {
          time: 0.0,
          frameRate: 30,
          resolution: { width: 800, height: 600 },
          devicePixelRatio: 1.0,
          globalProperties: {},
        }

        await newRenderer.renderFrame(sceneGraph, 0.0, context)
      } else {
        console.error('Failed to initialize renderer:', result.error)
      }
    }

    initRenderer()

    return () => {
      newRenderer?.destroy()
    }
  }, [webgpuSupported, sceneGraph])

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

        {webgpuSupported === null && (
          <p>Checking WebGPU support...</p>
        )}

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
              <button onClick={handleRenderFrame}>
                Render Frame ({count})
              </button>
              <p>
                Scene contains: 3 shapes (2 rectangles, 1 circle)
              </p>
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
    </>
  )
}

export default App
