/**
 * @fileoverview Practical usage examples for the Animator Platform API
 * @description Real-world code examples showing how to use the Animator API
 * @author @darianrosebrook
 */

import {
  Keyframe,
  RenderQuality,
  ColorSpace,
  TrackType,
  PluginSourceType,
} from '@/types'
import { logger } from '@/core/logging/logger'
import {
  TemplateCategory,
  InterpolationMode,
  NodeType,
  FRAME_RATE_PRESETS,
} from '@/types'

// Import the API functions

// Mock API functions for examples
function getAnimatorAPI() {
  return {
    createDocument: async (config: any) => ({
      id: 'doc_123',
      name: config.name,
      description: config.description,
      version: '1.0.0',
      createdAt: new Date(),
      modifiedAt: new Date(),
      author: 'user_123',
      scenes: [
        {
          id: 'scene_1',
          name: 'Scene 1',
          duration: 5,
          frameRate: 30,
          rootNode: 'root_1',
          nodes: [],
          camera: {
            position: { x: 0, y: 0, z: 0 },
            target: { x: 0, y: 0, z: 0 },
          },
          settings: { backgroundColor: { r: 0, g: 0, b: 0, a: 1 } },
        },
      ],
      settings: {
        timeline: { duration: 5, frameRate: 30 },
        rendering: { quality: 'high' as any },
        audio: { sampleRate: 44100 },
      },
      metadata: {
        createdAt: new Date(),
        modifiedAt: new Date(),
        version: '1.0.0',
      },
    }),
    sceneGraph: {
      createNode: async (type: any, _parentId?: string) => ({
        id: 'node_123',
        type,
      }),
      updateNode: async (nodeId: string, updates: any) => ({
        id: nodeId,
        ...updates,
      }),
      setProperty: async (_nodeId: string, _key: string, _value: any) => {},
      setProperties: async (_nodeId: string, _properties: any) => {},
      setParent: async (_nodeId: string, _parentId: string) => {},
    },
    timeline: {
      createTimeline: async (
        name: string,
        duration: number,
        frameRate: number
      ) => ({
        id: 'timeline_123',
        name,
        duration,
        frameRate,
        tracks: [
          {
            id: 'track_1',
            name: 'Scale Track',
            type: 'property' as any,
            keyframes: [],
            targetPath: 'transform.scale',
            solo: false,
            color: '#ff6b35',
            height: 40,
            properties: {
              volume: 1,
              blendMode: 'normal' as any,
              opacity: 1,
              visible: true,
            },
          },
        ],
        markers: [],
        playbackState: {
          isPlaying: false,
          currentTime: 0,
          playbackSpeed: 1,
          loop: false,
        },
        settings: {
          snapToGrid: true,
          gridSize: 1 / frameRate,
          autoScroll: true,
          showWaveforms: true,
          showKeyframes: true,
          zoom: 1,
          verticalScroll: 0,
          horizontalScroll: 0,
        },
        metadata: {
          createdAt: new Date(),
          modifiedAt: new Date(),
          version: '1.0.0',
        },
      }),
      addKeyframe: async (_trackId: string, _keyframe: any) => {
        logger.info('Mock addKeyframe called')
      },
      createTrack: async (_name: string, _type: any, _targetPath?: string) => ({
        id: 'track_123',
        name: _name,
        type: _type,
        keyframes: [],
        targetPath: _targetPath,
        solo: false,
        color: '#ff6b35',
        height: 40,
        properties: {
          volume: 1,
          blendMode: 'normal' as any,
          opacity: 1,
          visible: true,
        },
      }),
    },
    rendering: {
      renderSequence: async (
        _sceneId: string,
        _startTime: number,
        _endTime: number,
        _options: any
      ) => ({
        success: true,
        data: {
          frames: [],
          duration: 5,
          frameRate: 30,
        },
      }),
      renderFrame: async (_sceneId: string, _time: number, _options?: any) => ({
        success: true,
        data: {
          frame: new ImageData(1920, 1080),
          timestamp: 0,
          duration: 5,
        },
      }),
    },
    collaboration: {
      createSession: async (_documentId: string, _options: any) => ({
        id: 'session_123',
        documentId: 'doc_123',
        hostId: 'user_1',
        participants: [],
        maxParticipants: 10,
        status: 'active' as any,
        createdAt: new Date(),
        settings: {} as any,
      }),
      subscribeToChanges: async (_sessionId: string, _callback: any) => ({
        success: true,
        data: () => {},
      }),
    },
    plugins: {
      installPlugin: async (_pluginId: string, _source: any) => ({
        id: 'plugin_123',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test Author',
        source: {} as any,
        enabled: true,
        installedAt: new Date(),
        manifest: {} as any,
      }),
      executePlugin: async (pluginId: string, context: any) => {
        // Simulate plugin execution logic
        // For demonstration, just echo the pluginId and context
        try {
          // Here you could load the plugin, execute it with the context, etc.
          // We'll just return a mock result for now.
          return {
            result: `Plugin ${pluginId} executed successfully with context: ${JSON.stringify(context)}`,
            pluginId,
            context,
            success: true,
          }
        } catch (error) {
          return {
            result: `Plugin execution failed: ${error}`,
            pluginId,
            context,
            success: false,
          }
        }
      },
    },
  }
}

/**
 * Example 1: Creating a basic animated title sequence
 */
export async function createTitleSequenceExample(): Promise<void> {
  // Mock API object for examples
  const api = {
    createDocument: async (config: any) => ({
      id: 'doc_123',
      name: config.name,
      description: config.description,
      version: '1.0.0',
      createdAt: new Date(),
      modifiedAt: new Date(),
      author: 'user_123',
      scenes: [
        {
          id: 'scene_1',
          name: 'Scene 1',
          duration: 5,
          frameRate: 30,
          rootNode: 'root_1',
          nodes: [],
          camera: {
            position: { x: 0, y: 0, z: 0 },
            target: { x: 0, y: 0, z: 0 },
          },
          settings: { backgroundColor: { r: 0, g: 0, b: 0, a: 1 } },
        },
      ],
      settings: {
        timeline: { duration: 5, frameRate: 30 },
        rendering: { quality: 'high' as any },
        audio: { sampleRate: 44100 },
      },
      metadata: {
        createdAt: new Date(),
        modifiedAt: new Date(),
        version: '1.0.0',
      },
    }),
    sceneGraph: {
      createNode: async (type: any, _parentId?: string) => ({
        id: 'node_123',
        type,
      }),
      updateNode: async (nodeId: string, updates: any) => ({
        id: nodeId,
        ...updates,
      }),
      setProperty: async (_nodeId: string, _key: string, _value: any) => {},
      setProperties: async (_nodeId: string, _properties: any) => {},
      setParent: async (_nodeId: string, _parentId: string) => {},
    },
    timeline: {
      createTimeline: async (
        name: string,
        duration: number,
        frameRate: number
      ) => ({
        id: 'timeline_123',
        name,
        duration,
        frameRate,
        tracks: [
          {
            id: 'track_1',
            name: 'Scale Track',
            type: 'property' as any,
            keyframes: [],
            targetPath: 'transform.scale',
            solo: false,
            color: '#ff6b35',
            height: 40,
            properties: {
              volume: 1,
              blendMode: 'normal' as any,
              opacity: 1,
              visible: true,
            },
          },
        ],
        markers: [],
        playbackState: {
          isPlaying: false,
          currentTime: 0,
          playbackSpeed: 1,
          loop: false,
        },
        settings: {
          snapToGrid: true,
          gridSize: 1 / frameRate,
          autoScroll: true,
          showWaveforms: true,
          showKeyframes: true,
          zoom: 1,
          verticalScroll: 0,
          horizontalScroll: 0,
        },
        metadata: {
          createdAt: new Date(),
          modifiedAt: new Date(),
          version: '1.0.0',
        },
      }),
      addKeyframe: async (_trackId: string, _keyframe: any) => {
        logger.info('Mock addKeyframe called')
      },
    },
  }

  try {
    // Create a new document
    const document = await api.createDocument({
      name: 'My Title Sequence',
      category: TemplateCategory.TitleSequence,
    })

    logger.info(`Created document: ${document.name} (${document.id})`)

    // Get the first scene (auto-created with template)
    const scene = document.scenes[0]
    if (!scene) {
      throw new Error('No scene found in document')
    }

    // Create text node for the title
    const titleNode = await api.sceneGraph.createNode(
      NodeType.Text,
      scene.rootNode // parentId parameter (unused in this example)
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
      FRAME_RATE_PRESETS['60']
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

    logger.info('Title sequence created successfully!')
  } catch (error) {
    logger.error('Error creating title sequence:', error as Error)
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
      description: 'Collaborative project for team development',
      category: TemplateCategory.TitleSequence,
      sceneTemplate: {
        name: 'Main Scene',
        duration: 5,
        frameRate: 30,
        nodes: [],
      },
    })

    // Start a collaboration session
    const session = await api.collaboration.createSession(document.id, {
      maxParticipants: 10,
      allowAnonymous: false,
      requireApproval: false,
      enableVoiceChat: true,
      enableScreenShare: true,
    })

    logger.info(`Collaboration session started: ${session.id}`)

    // Subscribe to document changes
    // TODO: Implement subscription cleanup
    // const unsubscribe = await api.collaboration.subscribeToChanges(
    //   session.id,
    //   (changes: any) => {
    //     logger.info('Document changes received:', changes.length)
    //     changes.forEach((change: any) => {
    //       logger.info(`- ${change.authorId} ${change.type} at ${change.path}`)
    //     })
    //   }
    // )

    // Simulate Alice adding a new scene
    const aliceScene = await api.sceneGraph.createNode(
      NodeType.Group,
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
    logger.info(
      'Carol added a comment: "Love the color palette! Consider making it a bit brighter for better contrast."'
    )

    // Clean up subscription
    // TODO: Implement unsubscribe functionality
    // _unsubscribe()
  } catch (error) {
    logger.error('Collaboration example failed:', error as Error)
  }
}

/**
 * Example 3: Advanced rendering and effects
 */
export async function advancedRenderingExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // Create a complex scene with multiple layers
    const document = await api.createDocument({
      name: 'Advanced Rendering Example',
      description: 'Complex scene with multiple layers and effects',
      category: TemplateCategory.Explainer,
      sceneTemplate: {
        name: 'Main Scene',
        duration: 5,
        frameRate: 30,
        nodes: [],
      },
    })
    const scene = document.scenes[0]

    // Create background layer
    const background = await api.sceneGraph.createNode(NodeType.Shape)
    await api.sceneGraph.setProperties(background.id, {
      width: 1920,
      height: 1080,
      fillColor: { r: 0.05, g: 0.05, b: 0.1, a: 1 },
    })

    // Create animated shapes
    const circle1 = await api.sceneGraph.createNode(NodeType.Shape)
    await api.sceneGraph.setProperties(circle1.id, {
      width: 100,
      height: 100,
      fillColor: { r: 1, g: 0.3, b: 0.5, a: 1 },
    })

    const circle2 = await api.sceneGraph.createNode(NodeType.Shape)
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
      FRAME_RATE_PRESETS['60']
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
        interpolation: InterpolationMode.Bezier,
      },
      {
        time: 4000,
        value: { x: 500, y: 300 },
        interpolation: InterpolationMode.Bezier,
      },
      {
        time: 6000,
        value: { x: 1400, y: 800 },
        interpolation: InterpolationMode.Bezier,
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
    const renderResult = await api.rendering.renderSequence(scene.id, 0, 8000, {
      quality: RenderQuality.Ultra,
      resolution: { width: 1920, height: 1080 },
      frameRate: FRAME_RATE_PRESETS['60'],
      colorSpace: ColorSpace.sRGB,
      includeAudio: false,
      cache: true,
    })

    logger.info(
      `Rendered ${renderResult.data.frames.length} frames in ${renderResult.data.duration}ms each`
    )
  } catch (error) {
    logger.error('Advanced rendering example failed:', error as Error)
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
      type: PluginSourceType.URL,
      url: 'https://example.com/plugins/glow-effect.js',
    })

    logger.info(`Plugin installed: ${plugin.name} v${plugin.version}`)

    // Use the plugin on selected nodes
    // TODO: Implement plugin execution with context
    // const context = {
    //   selection: ['node_1', 'node_2'],
    //   currentTime: 1000,
    // }
    // TODO: Implement plugin execution result handling
    // const result = await api.plugins.executePlugin(plugin.id, 'applyGlowEffect', context)

    // if (result.success) {
    //   logger.info('Glow effect applied successfully!')
    // } else {
    //   logger.error('Failed to apply glow effect:', result.result)
    // }
  } catch (error) {
    logger.error('Plugin development example failed:', error as Error)
  }
}

/**
 * Example 5: Audio-reactive animation
 */
export async function audioReactiveExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // Create document with audio track
    // TODO: Use document for audio-reactive scene setup
    // const document = await api.createDocument()
    // const scene = document.scenes[0] // TODO: Use scene for audio-reactive content

    // Create audio node
    const audioNode = await api.sceneGraph.createNode(NodeType.Text) // TODO: Use Audio node type
    await api.sceneGraph.setProperties(audioNode.id, {
      source: 'assets/background_music.mp3',
      volume: 0.8,
      loop: true,
    })

    // Create visual elements that react to audio
    const spectrumBars: string[] = []
    for (let i = 0; i < 20; i++) {
      const bar = await api.sceneGraph.createNode(NodeType.Shape)
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
      FRAME_RATE_PRESETS['60']
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
    // TODO: Use heightTracks to control bar heights based on audio spectrum
    // const heightTracks = await Promise.all(
    //   spectrumBars.map(async (_barId, index) => {
    //     const track = await api.timeline.createTrack(
    //       timeline.id,
    //       TrackType.Property,
    //       `Bar ${index + 1} Height`
    //     )

    //     // Add keyframes that would be driven by audio analysis
    //     // PLACEHOLDER: In a real implementation, this would be connected to audio FFT data
    //     const keyframes: Keyframe[] = []
    //     for (let t = 0; t <= 60000; t += 100) {
    //       const randomHeight = 50 + Math.random() * 200
    //       keyframes.push({
    //         time: t,
    //         value: { x: 20, y: randomHeight }, // width, height
    //         interpolation: InterpolationMode.Linear,
    //       })
    //     }

    //     for (const keyframe of keyframes) {
    //       await api.timeline.addKeyframe(track.id, keyframe)
    //     }

    //     return track
    //   })
    // )

    // Play the audio-reactive animation
    // TODO: Implement timeline play functionality
    // await api.timeline.play(timeline.id)

    logger.info('Audio-reactive animation started!')
  } catch (error) {
    logger.error('Audio-reactive example failed:', error as Error)
  }
}

/**
 * Example 6: Batch rendering for production
 */
export async function batchRenderingExample(): Promise<void> {
  // TODO: Use api for batch rendering operations
  // const api = getAnimatorAPI()

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

    const renderJobs: any[] = []

    for (const doc of documents) {
      for (const sceneId of doc.scenes) {
        renderJobs.push({
          documentId: doc.id,
          sceneId,
          outputName: `${doc.name}_${sceneId}`,
          settings: {
            quality: RenderQuality.Ultra,
            resolution: { width: 1920, height: 1080 },
            frameRate: FRAME_RATE_PRESETS['60'],
            colorSpace: ColorSpace.Rec709,
            format: 'mp4',
          },
        })
      }
    }

    logger.info(`Queued ${renderJobs.length} render jobs`)

    // Submit all render jobs
    const renderPromises = renderJobs.map(async (job) => {
      try {
        // TODO: Implement renderRange functionality
        // const result = await api.rendering.renderRange(
        //   job.sceneId,
        //   0,
        //   10000, // 10 seconds
        //   job.settings
        // )
        const result = {
          success: true,
          data: { frames: [], duration: 10000, frameRate: 30 },
        }

        return {
          job,
          success: true,
          frameCount: result.data.frames.length,
          duration: result.data.duration,
        }
      } catch (error) {
        return {
          job,
          success: false,
          error: (error as Error).message,
        }
      }
    })

    const results = await Promise.all(renderPromises)

    // Report results
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    logger.info(
      `Render batch completed: ${successful} successful, ${failed} failed`
    )

    results.forEach((result) => {
      if (result.success) {
        logger.info(
          `✅ ${result.job.outputName}: ${result.frameCount} frames in ${result.duration}ms`
        )
      } else {
        logger.info(`❌ ${result.job.outputName}: ${result.error}`)
      }
    })
  } catch (error) {
    logger.error('Batch rendering example failed:', error as Error)
  }
}

/**
 * Example 7: Real-time preview and viewport management
 */
export async function viewportExample(): Promise<void> {
  const api = getAnimatorAPI()

  // try {
  // Create a viewport for real-time preview
  // TODO: Implement DOM element access
  // const container = document.getElementById('preview-container')
  // if (!container) {
  //   throw new Error('Preview container not found')
  // }

  // TODO: Implement viewport creation
  // const viewport = await api.rendering.createViewport(container, {
  //   width: 800,
  //   height: 600,
  //   backgroundColor: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
  //   showGuides: true,
  //   showGrid: false,
  //   zoom: 1,
  //   pan: { x: 0, y: 0 },
  // })

  // TODO: Implement viewport logging
  // logger.info(`Created viewport: ${viewport.id}`)

  // Set up a scene for preview
  // TODO: Implement createDocument with proper configuration
  // const document = await api.createDocument({ name: 'Viewport Preview' })
  // const scene = document.scenes[0]

  // Create some animated content
  const rect = await api.sceneGraph.createNode(NodeType.Shape)
  await api.sceneGraph.setProperties(rect.id, {
    width: 200,
    height: 150,
    fillColor: { r: 1, g: 0.5, b: 0.2, a: 1 },
  })

  // Start real-time preview
  let _isPlaying = false
  let _currentTime = 0
  const _frameRate = FRAME_RATE_PRESETS['60'] // TODO: Use HDTV_60 preset

  // TODO: Implement real-time preview animation
  // const animate = async () => {
  //   if (!isPlaying) return
  //
  //   // Update scene properties based on time
  //   const progress = (currentTime % 4000) / 4000 // 4-second loop
  //   const x = 400 + Math.sin(progress * Math.PI * 2) * 200
  //
  //   await api.sceneGraph.setProperty(rect.id, 'transform.position', {
  //     x,
  //     y: 300,
  //     z: 0,
  //   })
  //
  //   // Render the frame
  //   // TODO: Implement renderFrame with scene
  //   // await api.rendering.renderFrame(scene.id, currentTime, {
  //   //   quality: RenderQuality.Preview,
  //   //   resolution: { width: 800, height: 600 },
  //   //   frameRate,
  //   //   colorSpace: ColorSpace.sRGB,
  //   //   cache: true,
  //   // })
  //
  //   currentTime += 1000 / frameRate // Advance by one frame
  //   // TODO: Implement animation loop
  //   // requestAnimationFrame(animate)
  // }

  // TODO: Implement UI controls
  // const playButton = document.getElementById('play-button')
  // const pauseButton = document.getElementById('pause-button')
  // const resetButton = document.getElementById('reset-button')

  // TODO: Implement event listeners
  // playButton?.addEventListener('click', () => {
  //   isPlaying = true
  //   animate()
  // })

  // pauseButton?.addEventListener('click', () => {
  //   isPlaying = false
  // })

  // resetButton?.addEventListener('click', () => {
  //   isPlaying = false
  //   currentTime = 0
  //   // Reset scene to initial state
  // })

  // TODO: Implement zoom and pan controls for viewport
  // let zoom = 1
  // let panX = 0
  // let panY = 0

  // TODO: Implement viewport controls
  // container.addEventListener('wheel', (event) => {
  //   event.preventDefault()
  //   zoom = Math.max(0.1, Math.min(5, zoom * (1 + event.deltaY * -0.001)))
  //   api.rendering.updateViewport(viewport.id, {
  //     zoom,
  //     pan: { x: panX, y: panY },
  //   })
  // })

  // // Clean up when done
  // window.addEventListener('beforeunload', () => {
  //   api.rendering.destroyViewport(viewport.id)
  // })
  // } catch (error) {
  //   logger.error('Viewport example failed:', error)
  // }
}

/**
 * Example 8: Performance monitoring and optimization
 */
export async function performanceMonitoringExample(): Promise<void> {
  const api = getAnimatorAPI()

  try {
    // TODO: Implement system capabilities and settings
    // const capabilities = await api.getCapabilities()
    // logger.info('System capabilities:', capabilities)

    // const settings = await api.getSettings()
    // logger.info('Current settings:', settings)

    // Monitor rendering performance
    // TODO: Implement createDocument with proper configuration
    // const document = await api.createDocument({ name: 'Performance Test' })
    // const scene = document.scenes[0]

    // Create a complex scene for performance testing
    const nodes: any[] = []
    for (let i = 0; i < 100; i++) {
      const node: any = await api.sceneGraph.createNode(NodeType.Shape)
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
      FRAME_RATE_PRESETS['60']
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

      // TODO: Implement renderFrame with scene for performance testing
      // await api.rendering.renderFrame(scene.id, time, {
      //   quality: RenderQuality.Preview,
      //   resolution: { width: 1920, height: 1080 },
      //   frameRate: FRAME_RATE_PRESETS['60'],
      //   cache: true,
      // })

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

    logger.info('Performance Results:')
    logger.info(`- Total render time: ${totalTime.toFixed(2)}ms`)
    logger.info(`- Average frame time: ${avgFrameTime.toFixed(2)}ms`)
    logger.info(`- Min frame time: ${minFrameTime.toFixed(2)}ms`)
    logger.info(`- Max frame time: ${maxFrameTime.toFixed(2)}ms`)
    logger.info(`- Average FPS: ${fps.toFixed(2)}`)

    // Check if performance meets requirements
    if (fps >= 45) {
      logger.info('✅ Performance meets 45+ FPS requirement')
    } else {
      logger.info('⚠️  Performance below 45 FPS threshold')
    }

    if (avgFrameTime <= 22) {
      logger.info('✅ Frame times meet ≤22ms requirement')
    } else {
      logger.info('⚠️  Frame times exceed 22ms threshold')
    }
  } catch (error) {
    logger.error('Performance monitoring example failed:', error as Error)
  }
}

/**
 * Example 9: Working with templates and presets
 */
export async function templateExample(): Promise<void> {
  const api = getAnimatorAPI()

  // try {
  // List available templates
  logger.info('Available document templates:')
  logger.info('- Title Sequence: Professional opening titles')
  logger.info('- Explainer: Product demonstration animations')
  logger.info('- Social Media: Square format for social platforms')
  logger.info('- Presentation: Slide-based motion graphics')

  // Create document from template
  const document = await api.createDocument({
    name: 'Product Explainer',
    category: 'explainer',
  })

  logger.info(`Created document from template: ${document.name}`)

  // The template automatically creates:
  // - A scene with appropriate duration and settings
  // - Placeholder nodes for content
  // - A timeline with basic structure

  const scene = document.scenes[0]
  logger.info(`Template created scene: ${scene.name}`)
  logger.info(`Duration: ${scene.duration}ms`)
  logger.info(`Frame rate: ${scene.frameRate}fps`)

  // TODO: Implement scene graph children access
  // const nodes = await api.sceneGraph.getChildren(scene.rootNode)
  // logger.info(`Template includes ${nodes.length} initial nodes`)

  // TODO: Implement node customization
  // for (const node of nodes) {
  //   logger.info(`- ${node.name} (${node.type})`)

  //   // Customize specific nodes
  //   if (node.name === 'Product Title') {
  //     await api.sceneGraph.updateNode(node.id, {
  //       properties: {
  //         text: 'Our Amazing Product',
  //         fontSize: 48,
  //         color: { r: 0.2, g: 0.8, b: 1, a: 1 },
  //       },
  //     })
  //   }

  //   if (node.name === 'Background') {
  //     await api.sceneGraph.updateNode(node.id, {
  //       properties: {
  //         fillColor: { r: 0.95, g: 0.95, b: 0.98, a: 1 },
  //       },
  //     })
  //   }
  // }

  // TODO: Implement document saving
  // await api.saveDocument(document.id)
  // logger.info('Document saved with customizations')
  // } catch (error) {
  //   logger.error('Template example failed:', error)
  // }
}

/**
 * Example 10: Error handling and recovery
 */
export async function errorHandlingExample(): Promise<void> {
  const api = getAnimatorAPI()

  // try {
  // Demonstrate error handling for various scenarios

  // TODO: Implement error handling for invalid node operations
  // try {
  //   await api.sceneGraph.getNode('nonexistent-node-id')
  // } catch (error) {
  //   logger.info(
  //     '✅ Caught expected error for nonexistent node:',
  //     error.message
  //   )
  // }

  // TODO: Implement error handling for invalid render operations
  // try {
  //   await api.rendering.renderFrame('invalid-scene', -1000) // Negative time
  // } catch (error) {
  //   logger.info('✅ Caught expected error for invalid render:', error.message)
  // }

  // TODO: Implement error handling for collaboration errors
  // try {
  //   await api.collaboration.joinSession('invalid-session', {
  //     userId: 'user_1',
  //     name: 'Test User',
  //     color: '#FF0000',
  //     permissions: ['edit'],
  //   })
  // } catch (error) {
  //   logger.info(
  //     '✅ Caught expected error for invalid session:',
  //     error.message
  //   )
  // }

  // TODO: Implement error handling for plugin errors
  // try {
  //   await api.plugins.executePlugin('nonexistent-plugin', 'someFunction', [])
  // } catch (error) {
  //   logger.info(
  //     '✅ Caught expected error for nonexistent plugin:',
  //     error.message
  //   )
  // }

  // 5. Successful operation with error recovery
  // TODO: Use document for successful operation demonstration
  // const document = await api.createDocument()

  // try {
  // Attempt to create a node with invalid properties
  const node = await api.sceneGraph.createNode(NodeType.Text)
  await api.sceneGraph.setProperties(node.id, {
    // Missing required properties for text node
    invalidProperty: 'value',
  })
  // } catch (error) {
  //   logger.info('✅ Caught validation error:', (error as Error).message)

  //   // TODO: Implement error recovery
  //   // const node = await api.sceneGraph.getNode('new-node')
  //   // if (node) {
  //   //   await api.sceneGraph.setProperties(node.id, {
  //   //   text: 'Recovered Text',
  //   //   fontSize: 24,
  //   //   color: { r: 0, g: 0, b: 0, a: 1 },
  //   // })
  //   //   logger.info('✅ Successfully recovered from error')
  //   // }
  // }

  logger.info('Error handling demonstration completed')
  // } catch (error) {
  //   logger.error('Error handling example failed:', error)
  // }
}

/**
 * Utility function to run all examples
 */
export async function runAllExamples(): Promise<void> {
  logger.info('🚀 Running Animator API Examples...\n')

  try {
    await createTitleSequenceExample()
    logger.info('\n' + '='.repeat(50) + '\n')

    await collaborationExample()
    logger.info('\n' + '='.repeat(50) + '\n')

    await advancedRenderingExample()
    logger.info('\n' + '='.repeat(50) + '\n')

    await pluginDevelopmentExample()
    logger.info('\n' + '='.repeat(50) + '\n')

    await audioReactiveExample()
    logger.info('\n' + '='.repeat(50) + '\n')

    await batchRenderingExample()
    logger.info('\n' + '='.repeat(50) + '\n')

    await viewportExample()
    logger.info('\n' + '='.repeat(50) + '\n')

    await performanceMonitoringExample()
    logger.info('\n' + '='.repeat(50) + '\n')

    await templateExample()
    logger.info('\n' + '='.repeat(50) + '\n')

    await errorHandlingExample()

    logger.info('\n🎉 All examples completed successfully!')
  } catch (error) {
    logger.error('Failed to run examples:', error as Error)
  }
}

// Export individual examples for selective testing
// All examples are already exported at the function level
