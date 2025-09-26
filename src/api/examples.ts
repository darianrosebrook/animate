/**
 * @fileoverview Practical usage examples for the Animator Platform API
 * @description Real-world code examples showing how to use the Animator API
 * @author @darianrosebrook
 */

import {
  AnimatorAPI,
  getAnimatorAPI,
  initializeAnimatorAPI,
  NodeType,
  InterpolationMode,
  RenderQuality,
  ColorSpace,
  TrackType,
  FRAME_RATE_PRESETS,
  DEFAULTS,
  Utils,
  type Keyframe,
  type Time,
  type BaseNode,
  type Document,
  type Scene,
  type Timeline,
} from './animator-api'

/**
 * Example 1: Creating a basic animated title sequence
 */
export async function createTitleSequenceExample(): Promise<void> {
  // Initialize the API
  const api = initializeAnimatorAPI()

  try {
    // Create a new document
    const document = await api.createDocument({
      name: 'My Title Sequence',
      category: 'title_sequence',
    })

    console.log(`Created document: ${document.name} (${document.id})`)

    // Get the first scene (auto-created with template)
    const scene = document.scenes[0]
    if (!scene) {
      throw new Error('No scene found in document')
    }

    // Create text node for the title
    const titleNode = await api.sceneGraph.createNode(
      NodeType.Text,
      scene.rootNode
    )
    await api.sceneGraph.updateNode(titleNode.id, {
      name: 'Main Title',
      properties: {
        text: 'WELCOME TO ANIMATOR',
        fontSize: 72,
        fontFamily: 'Inter',
        color: { r: 1, g: 1, b: 1, a: 1 },
        alignment: 'center',
      },
    })

    // Position the title
    await api.sceneGraph.setProperty(titleNode.id, 'transform.position', {
      x: 960, // Center of 1920px width
      y: 540, // Center of 1080px height
      z: 0,
    })

    // Create timeline and add animation
    const timeline = await api.timeline.createTimeline(
      'Main Timeline',
      5000, // 5 seconds
      FRAME_RATE_PRESETS.HDTV_60
    )

    // Add scale animation to title
    const scaleKeyframes: Keyframe[] = [
      {
        time: 0,
        value: { x: 0.5, y: 0.5, z: 1 },
        interpolation: InterpolationMode.Bezier,
        easing: { p1x: 0.25, p1y: 0.1, p2x: 0.25, p2y: 1 },
      },
      {
        time: 2000,
        value: { x: 1.2, y: 1.2, z: 1 },
        interpolation: InterpolationMode.Bezier,
        easing: { p1x: 0.25, p1y: 0.1, p2x: 0.25, p2y: 1 },
      },
      {
        time: 5000,
        value: { x: 1, y: 1, z: 1 },
        interpolation: InterpolationMode.Bezier,
        easing: { p1x: 0.25, p1y: 0.1, p2x: 0.25, p2y: 1 },
      },
    ]

    for (const keyframe of scaleKeyframes) {
      await api.timeline.addKeyframe(timeline.tracks[0].id, keyframe)
    }

    // Add opacity animation
    const opacityKeyframes: Keyframe[] = [
      {
        time: 0,
        value: 0,
        interpolation: InterpolationMode.Linear,
      },
      {
        time: 500,
        value: 1,
        interpolation: InterpolationMode.Linear,
      },
    ]

    await api.timeline.addKeyframe(timeline.tracks[0].id, opacityKeyframes[0])
    await api.timeline.addKeyframe(timeline.tracks[0].id, opacityKeyframes[1])

    console.log('Title sequence created successfully!')
  } catch (error) {
    console.error('Error creating title sequence:', error)
  }
}

/**
 * Example 2: Real-time collaboration workflow
 */
export async function collaborationExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // Create a document for team collaboration
    const document = await api.createDocument({
      name: 'Team Project',
    })

    // Start a collaboration session
    const session = await api.collaboration.createSession(document.id, [
      {
        userId: 'user_1',
        name: 'Alice (Designer)',
        color: '#FF6B6B',
        permissions: ['edit', 'comment'],
      },
      {
        userId: 'user_2',
        name: 'Bob (Animator)',
        color: '#4ECDC4',
        permissions: ['edit', 'comment'],
      },
      {
        userId: 'user_3',
        name: 'Carol (Reviewer)',
        color: '#45B7D1',
        permissions: ['comment', 'export'],
      },
    ])

    console.log(`Collaboration session started: ${session.id}`)

    // Subscribe to document changes
    const unsubscribe = await api.collaboration.subscribeToChanges(
      session.id,
      (changes) => {
        console.log('Document changes received:', changes.length)

        changes.forEach((change) => {
          console.log(`- ${change.author} ${change.type} at ${change.path}`)
        })
      }
    )

    // Simulate Alice adding a new scene
    const aliceScene = await api.sceneGraph.createNode(
      NodeType.Composition,
      document.scenes[0].rootNode
    )
    await api.sceneGraph.updateNode(aliceScene.id, {
      name: "Alice's Scene",
      properties: {
        backgroundColor: { r: 0.1, g: 0.1, b: 0.2, a: 1 },
      },
    })

    // Simulate Bob updating the scene
    await api.sceneGraph.updateNode(aliceScene.id, {
      properties: {
        backgroundColor: { r: 0.2, g: 0.1, b: 0.3, a: 1 },
      },
    })

    // Simulate Carol adding a comment
    const comment = {
      type: 'comment',
      content:
        'Love the color palette! Consider making it a bit brighter for better contrast.',
      time: 1000,
      author: 'Carol',
    }

    // Clean up subscription
    unsubscribe()
  } catch (error) {
    console.error('Collaboration example failed:', error)
  }
}

/**
 * Example 3: Advanced rendering and effects
 */
export async function advancedRenderingExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // Create a complex scene with multiple layers
    const document = await api.createDocument()
    const scene = document.scenes[0]

    // Create background layer
    const background = await api.sceneGraph.createNode(NodeType.Rectangle)
    await api.sceneGraph.setProperties(background.id, {
      width: 1920,
      height: 1080,
      fillColor: { r: 0.05, g: 0.05, b: 0.1, a: 1 },
    })

    // Create animated shapes
    const circle1 = await api.sceneGraph.createNode(NodeType.Ellipse)
    await api.sceneGraph.setProperties(circle1.id, {
      width: 100,
      height: 100,
      fillColor: { r: 1, g: 0.3, b: 0.5, a: 1 },
    })

    const circle2 = await api.sceneGraph.createNode(NodeType.Ellipse)
    await api.sceneGraph.setProperties(circle2.id, {
      width: 80,
      height: 80,
      fillColor: { r: 0.3, g: 1, b: 0.7, a: 1 },
    })

    // Set up hierarchy and transforms
    await api.sceneGraph.setParent(circle1.id, background.id)
    await api.sceneGraph.setParent(circle2.id, background.id)

    // Create timeline with complex animations
    const timeline = await api.timeline.createTimeline(
      'Advanced Animation',
      8000, // 8 seconds
      FRAME_RATE_PRESETS.HDTV_60
    )

    // Animate circle positions with different easing
    const circle1Track = await api.timeline.createTrack(
      timeline.id,
      TrackType.Property,
      'Circle 1 Position'
    )

    const circle2Track = await api.timeline.createTrack(
      timeline.id,
      TrackType.Property,
      'Circle 2 Position'
    )

    // Circle 1: Smooth circular motion
    const circle1Keyframes: Keyframe[] = []
    for (let i = 0; i <= 8; i++) {
      const time = i * 1000
      const angle = (i / 8) * Math.PI * 2
      const radius = 200

      circle1Keyframes.push({
        time,
        value: {
          x: 960 + Math.cos(angle) * radius,
          y: 540 + Math.sin(angle) * radius,
        },
        interpolation: InterpolationMode.Bezier,
        easing: { p1x: 0.25, p1y: 0.1, p2x: 0.25, p2y: 1 },
      })
    }

    // Circle 2: Bouncing motion
    const circle2Keyframes: Keyframe[] = [
      {
        time: 0,
        value: { x: 500, y: 300 },
        interpolation: InterpolationMode.Bezier,
      },
      {
        time: 2000,
        value: { x: 1400, y: 800 },
        interpolation: InterpolationMode.Bounce,
      },
      {
        time: 4000,
        value: { x: 500, y: 300 },
        interpolation: InterpolationMode.Bounce,
      },
      {
        time: 6000,
        value: { x: 1400, y: 800 },
        interpolation: InterpolationMode.Bounce,
      },
      {
        time: 8000,
        value: { x: 960, y: 540 },
        interpolation: InterpolationMode.Bezier,
      },
    ]

    for (const keyframe of circle1Keyframes) {
      await api.timeline.addKeyframe(circle1Track.id, keyframe)
    }

    for (const keyframe of circle2Keyframes) {
      await api.timeline.addKeyframe(circle2Track.id, keyframe)
    }

    // Render the animation
    const renderResult = await api.rendering.renderRange(scene.id, 0, 8000, {
      quality: RenderQuality.Final,
      resolution: { width: 1920, height: 1080 },
      frameRate: FRAME_RATE_PRESETS.HDTV_60,
      colorSpace: ColorSpace.sRGB,
      includeAudio: false,
      cache: true,
    })

    console.log(
      `Rendered ${renderResult.length} frames in ${renderResult[0]?.duration}ms each`
    )
  } catch (error) {
    console.error('Advanced rendering example failed:', error)
  }
}

/**
 * Example 4: Plugin development workflow
 */
export async function pluginDevelopmentExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // Define a simple glow effect plugin
    const glowEffectPlugin = {
      id: 'glow-effect-plugin',
      name: 'Glow Effect',
      version: '1.0.0',
      author: 'Motion Graphics Team',
      description: 'Adds a customizable glow effect to selected layers',
      main: 'glow-effect.js',
      permissions: ['read:selection', 'write:effects'],
      dependencies: {},
      activationEvents: ['on:selection-change'],
      contributes: [
        {
          type: 'effect',
          properties: {
            name: 'Glow',
            category: 'styling',
            parameters: [
              {
                name: 'intensity',
                type: 'number',
                min: 0,
                max: 10,
                default: 1,
              },
              {
                name: 'radius',
                type: 'number',
                min: 0,
                max: 100,
                default: 10,
              },
              {
                name: 'color',
                type: 'color',
                default: { r: 1, g: 1, b: 0, a: 1 },
              },
            ],
          },
        },
      ],
    }

    // Install the plugin
    const plugin = await api.plugins.installPlugin(glowEffectPlugin.id, {
      type: 'url',
      url: 'https://example.com/plugins/glow-effect.js',
    })

    console.log(`Plugin installed: ${plugin.name} v${plugin.version}`)

    // Use the plugin on selected nodes
    const context = {
      selection: ['node_1', 'node_2'],
      currentTime: 1000,
    }

    const result = await api.plugins.executePlugin(
      plugin.id,
      'applyGlowEffect',
      [
        {
          intensity: 2.5,
          radius: 15,
          color: { r: 1, g: 0.5, b: 0, a: 1 },
        },
      ],
      context
    )

    if (result.success) {
      console.log('Glow effect applied successfully!')
    } else {
      console.error('Failed to apply glow effect:', result.errors)
    }
  } catch (error) {
    console.error('Plugin development example failed:', error)
  }
}

/**
 * Example 5: Audio-reactive animation
 */
export async function audioReactiveExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // Create document with audio track
    const document = await api.createDocument()
    const scene = document.scenes[0]

    // Create audio node
    const audioNode = await api.sceneGraph.createNode(NodeType.Audio)
    await api.sceneGraph.setProperties(audioNode.id, {
      source: 'assets/background_music.mp3',
      volume: 0.8,
      loop: true,
    })

    // Create visual elements that react to audio
    const spectrumBars: string[] = []
    for (let i = 0; i < 20; i++) {
      const bar = await api.sceneGraph.createNode(NodeType.Rectangle)
      await api.sceneGraph.setProperties(bar.id, {
        width: 20,
        height: 100,
        fillColor: { r: 0.5, g: 0.8, b: 1, a: 1 },
        position: { x: 100 + i * 25, y: 900 },
      })
      spectrumBars.push(bar.id)
    }

    // Create timeline
    const timeline = await api.timeline.createTimeline(
      'Audio Reactive',
      60000, // 1 minute
      FRAME_RATE_PRESETS.HDTV_60
    )

    // Create audio analysis track
    const audioTrack = await api.timeline.createTrack(
      timeline.id,
      TrackType.Audio,
      'Background Music'
    )

    // Add audio file reference
    await api.timeline.addKeyframe(audioTrack.id, {
      time: 0,
      value: 'assets/background_music.mp3',
      interpolation: InterpolationMode.Stepped,
    })

    // Create property tracks for each spectrum bar
    const heightTracks = await Promise.all(
      spectrumBars.map(async (barId, index) => {
        const track = await api.timeline.createTrack(
          timeline.id,
          TrackType.Property,
          `Bar ${index + 1} Height`
        )

        // Add keyframes that would be driven by audio analysis
        // In a real implementation, this would be connected to audio FFT data
        const keyframes: Keyframe[] = []
        for (let t = 0; t <= 60000; t += 100) {
          const randomHeight = 50 + Math.random() * 200
          keyframes.push({
            time: t,
            value: { x: 20, y: randomHeight }, // width, height
            interpolation: InterpolationMode.Linear,
          })
        }

        for (const keyframe of keyframes) {
          await api.timeline.addKeyframe(track.id, keyframe)
        }

        return track
      })
    )

    // Play the audio-reactive animation
    await api.timeline.play(timeline.id)

    console.log('Audio-reactive animation started!')
  } catch (error) {
    console.error('Audio-reactive example failed:', error)
  }
}

/**
 * Example 6: Batch rendering for production
 */
export async function batchRenderingExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // Get all documents that need rendering
    const documents = [
      { id: 'doc_1', name: 'Title Sequence', scenes: ['scene_1', 'scene_2'] },
      { id: 'doc_2', name: 'Explainer Video', scenes: ['scene_1'] },
      {
        id: 'doc_3',
        name: 'Social Media Assets',
        scenes: ['scene_1', 'scene_2', 'scene_3'],
      },
    ]

    const renderJobs = []

    for (const doc of documents) {
      for (const sceneId of doc.scenes) {
        renderJobs.push({
          documentId: doc.id,
          sceneId,
          outputName: `${doc.name}_${sceneId}`,
          settings: {
            quality: RenderQuality.Final,
            resolution: { width: 1920, height: 1080 },
            frameRate: FRAME_RATE_PRESETS.HDTV_60,
            colorSpace: ColorSpace.Rec709,
            format: 'mp4',
          },
        })
      }
    }

    console.log(`Queued ${renderJobs.length} render jobs`)

    // Submit all render jobs
    const renderPromises = renderJobs.map(async (job) => {
      try {
        const result = await api.rendering.renderRange(
          job.sceneId,
          0,
          10000, // 10 seconds
          job.settings
        )

        return {
          job,
          success: true,
          frameCount: result.length,
          duration: result[0]?.duration || 0,
        }
      } catch (error) {
        return {
          job,
          success: false,
          error: error.message,
        }
      }
    })

    const results = await Promise.all(renderPromises)

    // Report results
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(
      `Render batch completed: ${successful} successful, ${failed} failed`
    )

    results.forEach((result) => {
      if (result.success) {
        console.log(
          `✅ ${result.job.outputName}: ${result.frameCount} frames in ${result.duration}ms`
        )
      } else {
        console.log(`❌ ${result.job.outputName}: ${result.error}`)
      }
    })
  } catch (error) {
    console.error('Batch rendering example failed:', error)
  }
}

/**
 * Example 7: Real-time preview and viewport management
 */
export async function viewportExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // Create a viewport for real-time preview
    const container = document.getElementById('preview-container')
    if (!container) {
      throw new Error('Preview container not found')
    }

    const viewport = await api.rendering.createViewport(container, {
      width: 800,
      height: 600,
      backgroundColor: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
      showGuides: true,
      showGrid: false,
      zoom: 1,
      pan: { x: 0, y: 0 },
    })

    console.log(`Created viewport: ${viewport.id}`)

    // Set up a scene for preview
    const document = await api.createDocument()
    const scene = document.scenes[0]

    // Create some animated content
    const rect = await api.sceneGraph.createNode(NodeType.Rectangle)
    await api.sceneGraph.setProperties(rect.id, {
      width: 200,
      height: 150,
      fillColor: { r: 1, g: 0.5, b: 0.2, a: 1 },
    })

    // Start real-time preview
    let isPlaying = false
    let currentTime = 0
    const frameRate = FRAME_RATE_PRESETS.HDTV_60

    const animate = async () => {
      if (!isPlaying) return

      // Update scene properties based on time
      const progress = (currentTime % 4000) / 4000 // 4-second loop
      const x = 400 + Math.sin(progress * Math.PI * 2) * 200

      await api.sceneGraph.setProperty(rect.id, 'transform.position', {
        x,
        y: 300,
        z: 0,
      })

      // Render the frame
      await api.rendering.renderFrame(scene.id, currentTime, {
        quality: RenderQuality.Preview,
        resolution: { width: 800, height: 600 },
        frameRate,
        colorSpace: ColorSpace.sRGB,
        cache: true,
      })

      currentTime += 1000 / frameRate // Advance by one frame
      requestAnimationFrame(animate)
    }

    // UI controls
    const playButton = document.getElementById('play-button')
    const pauseButton = document.getElementById('pause-button')
    const resetButton = document.getElementById('reset-button')

    playButton?.addEventListener('click', () => {
      isPlaying = true
      animate()
    })

    pauseButton?.addEventListener('click', () => {
      isPlaying = false
    })

    resetButton?.addEventListener('click', () => {
      isPlaying = false
      currentTime = 0
      // Reset scene to initial state
    })

    // Zoom and pan controls
    let zoom = 1
    let panX = 0
    let panY = 0

    container.addEventListener('wheel', (event) => {
      event.preventDefault()
      zoom = Math.max(0.1, Math.min(5, zoom * (1 + event.deltaY * -0.001)))
      api.rendering.updateViewport(viewport.id, {
        zoom,
        pan: { x: panX, y: panY },
      })
    })

    // Clean up when done
    window.addEventListener('beforeunload', () => {
      api.rendering.destroyViewport(viewport.id)
    })
  } catch (error) {
    console.error('Viewport example failed:', error)
  }
}

/**
 * Example 8: Performance monitoring and optimization
 */
export async function performanceMonitoringExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // Get system capabilities
    const capabilities = await api.getCapabilities()
    console.log('System capabilities:', capabilities)

    // Get current settings
    const settings = await api.getSettings()
    console.log('Current settings:', settings)

    // Monitor rendering performance
    const document = await api.createDocument()
    const scene = document.scenes[0]

    // Create a complex scene for performance testing
    const nodes = []
    for (let i = 0; i < 100; i++) {
      const node = await api.sceneGraph.createNode(NodeType.Rectangle)
      await api.sceneGraph.setProperties(node.id, {
        width: 50,
        height: 50,
        fillColor: {
          r: Math.random(),
          g: Math.random(),
          b: Math.random(),
          a: 0.8,
        },
        position: {
          x: Math.random() * 1920,
          y: Math.random() * 1080,
          z: 0,
        },
      })
      nodes.push(node)
    }

    // Create animation timeline
    const timeline = await api.timeline.createTimeline(
      'Performance Test',
      5000,
      FRAME_RATE_PRESETS.HDTV_60
    )

    // Add movement animation to all nodes
    for (const node of nodes) {
      const track = await api.timeline.createTrack(
        timeline.id,
        TrackType.Property,
        `Node ${node.id} Position`
      )

      const keyframes: Keyframe[] = [
        {
          time: 0,
          value: { x: Math.random() * 1920, y: Math.random() * 1080 },
          interpolation: InterpolationMode.Linear,
        },
        {
          time: 5000,
          value: { x: Math.random() * 1920, y: Math.random() * 1080 },
          interpolation: InterpolationMode.Linear,
        },
      ]

      for (const keyframe of keyframes) {
        await api.timeline.addKeyframe(track.id, keyframe)
      }
    }

    // Performance monitoring
    const startTime = performance.now()
    const frameTimes: number[] = []

    // Render multiple frames and measure performance
    for (let time = 0; time <= 5000; time += 100) {
      const frameStart = performance.now()

      await api.rendering.renderFrame(scene.id, time, {
        quality: RenderQuality.Preview,
        resolution: { width: 1920, height: 1080 },
        frameRate: FRAME_RATE_PRESETS.HDTV_60,
        cache: true,
      })

      const frameEnd = performance.now()
      frameTimes.push(frameEnd - frameStart)
    }

    const endTime = performance.now()
    const totalTime = endTime - startTime

    // Calculate performance metrics
    const avgFrameTime =
      frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    const minFrameTime = Math.min(...frameTimes)
    const maxFrameTime = Math.max(...frameTimes)
    const fps = 1000 / avgFrameTime

    console.log('Performance Results:')
    console.log(`- Total render time: ${totalTime.toFixed(2)}ms`)
    console.log(`- Average frame time: ${avgFrameTime.toFixed(2)}ms`)
    console.log(`- Min frame time: ${minFrameTime.toFixed(2)}ms`)
    console.log(`- Max frame time: ${maxFrameTime.toFixed(2)}ms`)
    console.log(`- Average FPS: ${fps.toFixed(2)}`)

    // Check if performance meets requirements
    if (fps >= 45) {
      console.log('✅ Performance meets 45+ FPS requirement')
    } else {
      console.log('⚠️  Performance below 45 FPS threshold')
    }

    if (avgFrameTime <= 22) {
      console.log('✅ Frame times meet ≤22ms requirement')
    } else {
      console.log('⚠️  Frame times exceed 22ms threshold')
    }
  } catch (error) {
    console.error('Performance monitoring example failed:', error)
  }
}

/**
 * Example 9: Working with templates and presets
 */
export async function templateExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // List available templates
    console.log('Available document templates:')
    console.log('- Title Sequence: Professional opening titles')
    console.log('- Explainer: Product demonstration animations')
    console.log('- Social Media: Square format for social platforms')
    console.log('- Presentation: Slide-based motion graphics')

    // Create document from template
    const document = await api.createDocument({
      name: 'Product Explainer',
      category: 'explainer',
    })

    console.log(`Created document from template: ${document.name}`)

    // The template automatically creates:
    // - A scene with appropriate duration and settings
    // - Placeholder nodes for content
    // - A timeline with basic structure

    const scene = document.scenes[0]
    console.log(`Template created scene: ${scene.name}`)
    console.log(`Duration: ${scene.duration}ms`)
    console.log(`Frame rate: ${scene.frameRate}fps`)

    // Customize the template content
    const nodes = await api.sceneGraph.getChildren(scene.rootNode)
    console.log(`Template includes ${nodes.length} initial nodes`)

    for (const node of nodes) {
      console.log(`- ${node.name} (${node.type})`)

      // Customize specific nodes
      if (node.name === 'Product Title') {
        await api.sceneGraph.updateNode(node.id, {
          properties: {
            text: 'Our Amazing Product',
            fontSize: 48,
            color: { r: 0.2, g: 0.8, b: 1, a: 1 },
          },
        })
      }

      if (node.name === 'Background') {
        await api.sceneGraph.updateNode(node.id, {
          properties: {
            fillColor: { r: 0.95, g: 0.95, b: 0.98, a: 1 },
          },
        })
      }
    }

    // Save the customized document
    await api.saveDocument(document.id)
    console.log('Document saved with customizations')
  } catch (error) {
    console.error('Template example failed:', error)
  }
}

/**
 * Example 10: Error handling and recovery
 */
export async function errorHandlingExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // Demonstrate error handling for various scenarios

    // 1. Invalid node operations
    try {
      await api.sceneGraph.getNode('nonexistent-node-id')
    } catch (error) {
      console.log(
        '✅ Caught expected error for nonexistent node:',
        error.message
      )
    }

    // 2. Invalid render operations
    try {
      await api.rendering.renderFrame('invalid-scene', -1000) // Negative time
    } catch (error) {
      console.log('✅ Caught expected error for invalid render:', error.message)
    }

    // 3. Network/collaboration errors
    try {
      await api.collaboration.joinSession('invalid-session', {
        userId: 'user_1',
        name: 'Test User',
        color: '#FF0000',
        permissions: ['edit'],
      })
    } catch (error) {
      console.log(
        '✅ Caught expected error for invalid session:',
        error.message
      )
    }

    // 4. Plugin errors
    try {
      await api.plugins.executePlugin('nonexistent-plugin', 'someFunction', [])
    } catch (error) {
      console.log(
        '✅ Caught expected error for nonexistent plugin:',
        error.message
      )
    }

    // 5. Successful operation with error recovery
    const document = await api.createDocument()

    try {
      // Attempt to create a node with invalid properties
      await api.sceneGraph.createNode(NodeType.Text)
      await api.sceneGraph.setProperties('new-node', {
        // Missing required properties for text node
        invalidProperty: 'value',
      })
    } catch (error) {
      console.log('✅ Caught validation error:', error.message)

      // Recover by setting valid properties
      const node = await api.sceneGraph.getNode('new-node')
      if (node) {
        await api.sceneGraph.setProperties(node.id, {
          text: 'Recovered Text',
          fontSize: 24,
          color: { r: 0, g: 0, b: 0, a: 1 },
        })
        console.log('✅ Successfully recovered from error')
      }
    }

    console.log('Error handling demonstration completed')
  } catch (error) {
    console.error('Error handling example failed:', error)
  }
}

/**
 * Utility function to run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Running Animator API Examples...\n')

  try {
    await createTitleSequenceExample()
    console.log('\n' + '='.repeat(50) + '\n')

    await collaborationExample()
    console.log('\n' + '='.repeat(50) + '\n')

    await advancedRenderingExample()
    console.log('\n' + '='.repeat(50) + '\n')

    await pluginDevelopmentExample()
    console.log('\n' + '='.repeat(50) + '\n')

    await audioReactiveExample()
    console.log('\n' + '='.repeat(50) + '\n')

    await batchRenderingExample()
    console.log('\n' + '='.repeat(50) + '\n')

    await viewportExample()
    console.log('\n' + '='.repeat(50) + '\n')

    await performanceMonitoringExample()
    console.log('\n' + '='.repeat(50) + '\n')

    await templateExample()
    console.log('\n' + '='.repeat(50) + '\n')

    await errorHandlingExample()

    console.log('\n🎉 All examples completed successfully!')
  } catch (error) {
    console.error('Failed to run examples:', error)
  }
}

// Export individual examples for selective testing
export {
  createTitleSequenceExample,
  collaborationExample,
  advancedRenderingExample,
  pluginDevelopmentExample,
  audioReactiveExample,
  batchRenderingExample,
  viewportExample,
  performanceMonitoringExample,
  templateExample,
  errorHandlingExample,
}
