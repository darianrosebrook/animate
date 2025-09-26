# Animator API Integration Guide

## Overview

This document provides comprehensive guidance on how the underlying Animator APIs integrate with the Developer Mode code editor, including IntelliSense support, API surface exposure, and best practices for API usage.

## API Architecture Integration

### Core API Surface

The Developer Mode exposes the complete Animator API surface through a secure sandbox environment:

```typescript
// Available API modules in Developer Mode
const api = {
  sceneGraph: SceneGraphAPI,    // Node hierarchy and properties
  timeline: TimelineAPI,        // Animation and playback
  rendering: RenderingAPI,      // GPU rendering and viewports
  collaboration: CollaborationAPI, // Real-time collaboration
  plugins: PluginAPI,          // Plugin system
  documents: DocumentAPI,      // Document management
  settings: SettingsAPI,       // Application settings
  system: SystemAPI,          // System information
  utils: UtilsAPI,            // Utility functions
  context: ContextAPI         // Execution context
}
```

### Type Safety Integration

The code editor provides full TypeScript definitions for all APIs:

```typescript
// Full type definitions available in IntelliSense
declare global {
  const api: {
    sceneGraph: {
      createNode(type: string, parentId?: string, name?: string): Promise<SafeNode>
      getNode(nodeId: string): Promise<SafeNode | null>
      setProperty(nodeId: string, key: string, value: any): Promise<void>
      // ... complete API surface
    }
    // ... other APIs
  }
}
```

## IntelliSense Features

### Comprehensive Auto-completion

The code editor provides intelligent auto-completion for:

1. **API Method Names**: All available methods with parameter hints
2. **Type Information**: Full type definitions for parameters and return values
3. **Documentation**: Inline documentation for each method
4. **Parameter Snippets**: Pre-filled parameter templates

### Example IntelliSense Usage

```javascript
// Type 'api.' to see all available APIs
api. // ← IntelliSense shows: sceneGraph, timeline, rendering, etc.

// Type 'api.sceneGraph.' to see scene graph methods
api.sceneGraph. // ← IntelliSense shows: createNode, getNode, setProperty, etc.

// Type 'api.sceneGraph.createNode(' to see parameter hints
api.sceneGraph.createNode( // ← IntelliSense shows: type, parentId?, name?
  'rectangle', // ← IntelliSense suggests: string
  null,        // ← IntelliSense suggests: string | null | undefined
  'My Node'    // ← IntelliSense suggests: string | undefined
)
```

### Advanced IntelliSense Features

- **Method Signatures**: Shows parameter types and return types
- **Documentation Popups**: Hover over methods to see descriptions
- **Error Highlighting**: Immediate feedback on type mismatches
- **Smart Suggestions**: Context-aware completions based on cursor position

## API Surface Integration

### Scene Graph API Integration

**Complete Node Management:**
```javascript
// Create nodes with full property control
const rectangle = await api.sceneGraph.createNode('rectangle', null, 'Blue Box');
await api.sceneGraph.setProperty(rectangle.id, 'width', 200);
await api.sceneGraph.setProperty(rectangle.id, 'height', 150);
await api.sceneGraph.setProperty(rectangle.id, 'fillColor', { r: 0, g: 0.5, b: 1, a: 1 });

// Hierarchy manipulation
await api.sceneGraph.setParent(rectangle.id, parentGroup.id);
const children = await api.sceneGraph.getChildren(parentGroup.id);

// Selection and querying
await api.sceneGraph.selectNodes([rectangle.id, textNode.id]);
const selected = await api.sceneGraph.getSelectedNodes();
```

**Transform System:**
```javascript
// Complete 3D transform control
await api.sceneGraph.setTransform(nodeId, {
  position: { x: 400, y: 300, z: 0 },
  rotation: { x: 0, y: 45, z: 0 },
  scale: { x: 1.5, y: 1.5, z: 1 },
  opacity: 0.8
});
```

### Timeline API Integration

**Advanced Animation Control:**
```javascript
// Create complex timelines
const timeline = await api.timeline.createTimeline('Complex Animation', 10000, 30);

// Multiple tracks for different properties
const positionTrack = await api.timeline.createTrack(timeline.id, 'property', 'Position');
const rotationTrack = await api.timeline.createTrack(timeline.id, 'property', 'Rotation');
const scaleTrack = await api.timeline.createTrack(timeline.id, 'property', 'Scale');

// Advanced keyframe animation
await api.timeline.addKeyframe(positionTrack.id, 0, { x: 0, y: 0 });
await api.timeline.addKeyframe(positionTrack.id, 1000, { x: 100, y: 50 });
await api.timeline.addKeyframe(positionTrack.id, 2000, { x: 200, y: 0 });
await api.timeline.addKeyframe(positionTrack.id, 3000, { x: 300, y: 100 });

// Timeline markers for organization
await api.timeline.addMarker(timeline.id, 1500, 'Bounce Point', '#ff0000');

// Playback control
await api.timeline.play(timeline.id);
await api.timeline.seek(timeline.id, 2000);
await api.timeline.pause(timeline.id);
```

### Rendering API Integration

**GPU-Accelerated Rendering:**
```javascript
// Create viewport for preview
const viewport = await api.rendering.createViewport(
  document.getElementById('preview-container'),
  {
    width: 800,
    height: 600,
    backgroundColor: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
    showGuides: true,
    showGrid: true
  }
);

// Camera control
await api.rendering.setCamera(viewport.id, {
  position: { x: 0, y: 0, z: 100 },
  rotation: { x: 0, y: 0, z: 0 },
  fieldOfView: 60,
  nearPlane: 0.1,
  farPlane: 1000
});

// Render frames with options
const frame = await api.rendering.renderFrame(sceneId, 1000, {
  quality: 'final',
  resolution: { width: 1920, height: 1080 },
  frameRate: 30,
  colorSpace: 'srgb'
});

// Export functionality
const blob = await api.rendering.exportFrame(viewport.id, 'png');
```

### Collaboration API Integration

**Real-time Multi-user Features:**
```javascript
// Create collaboration session
const session = await api.collaboration.createSession(documentId, [
  {
    userId: 'user1',
    name: 'Alice',
    color: '#ff6b6b',
    permissions: ['sceneGraph.read', 'sceneGraph.update']
  },
  {
    userId: 'user2',
    name: 'Bob',
    color: '#4ecdc4',
    permissions: ['sceneGraph.read']
  }
]);

// Join session
const joinResult = await api.collaboration.joinSession(session.id, {
  userId: 'user3',
  name: 'Charlie',
  color: '#45b7d1',
  permissions: ['sceneGraph.read', 'timeline.read']
});

// Real-time presence
await api.collaboration.updatePresence(session.id, {
  cursor: { x: 400, y: 300 },
  selection: ['node_123', 'node_456'],
  currentTool: 'select',
  isActive: true
});

// Subscribe to changes
const unsubscribe = await api.collaboration.subscribeToChanges(
  session.id,
  (changes) => {
    changes.forEach(change => {
      console.log('Document change:', change.type, change.path);
    });
  }
);
```

### Plugin API Integration

**Plugin Development and Execution:**
```javascript
// Install plugin from registry
await api.plugins.installPlugin('my-awesome-plugin', {
  type: 'registry',
  registry: 'animator-plugins'
});

// List available plugins
const plugins = await api.plugins.listPlugins();
plugins.forEach(plugin => {
  console.log(`${plugin.name} v${plugin.version} by ${plugin.author}`);
});

// Execute plugin function
const result = await api.plugins.executePlugin(
  'my-awesome-plugin',
  'generateGradient',
  ['#ff0000', '#0000ff', 10]
);

// Create custom plugin
const customPlugin = await api.plugins.createPlugin({
  name: 'My Custom Plugin',
  version: '1.0.0',
  description: 'Adds custom functionality',
  author: 'Developer',
  main: 'main.js',
  permissions: ['sceneGraph.read', 'sceneGraph.create'],
  dependencies: {},
  activationEvents: ['onCommand:myPlugin.activate'],
  contributes: [
    {
      type: 'command',
      properties: {
        command: 'myPlugin.generateShapes',
        title: 'Generate Shapes'
      }
    }
  ]
});
```

## Code Examples and Patterns

### Basic Scene Creation
```javascript
// Create a simple scene with multiple nodes
const scene = await api.sceneGraph.getCurrentScene();

// Create background
const bg = await api.sceneGraph.createNode('rectangle', scene.rootNode, 'Background');
await api.sceneGraph.setProperty(bg.id, 'width', 1920);
await api.sceneGraph.setProperty(bg.id, 'height', 1080);
await api.sceneGraph.setProperty(bg.id, 'fillColor', { r: 0.95, g: 0.95, b: 0.95, a: 1 });
await api.sceneGraph.setTransform(bg.id, {
  position: { x: 0, y: 0, z: -100 },
  scale: { x: 1, y: 1, z: 1 }
});

// Create foreground elements
const circle = await api.sceneGraph.createNode('ellipse', scene.rootNode, 'Main Circle');
await api.sceneGraph.setProperty(circle.id, 'width', 200);
await api.sceneGraph.setProperty(circle.id, 'height', 200);
await api.sceneGraph.setProperty(circle.id, 'fillColor', { r: 1, g: 0.5, b: 0, a: 1 });
await api.sceneGraph.setTransform(circle.id, {
  position: { x: 960, y: 540, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
});

// Log results
api.utils.log('Created scene with', await api.sceneGraph.getDescendants(scene.rootNode).length, 'nodes');
```

### Advanced Animation Example
```javascript
// Create bouncing ball animation
const ball = await api.sceneGraph.createNode('ellipse', null, 'Bouncing Ball');
await api.sceneGraph.setProperty(ball.id, 'width', 50);
await api.sceneGraph.setProperty(ball.id, 'height', 50);
await api.sceneGraph.setProperty(ball.id, 'fillColor', { r: 1, g: 0, b: 0, a: 1 });

// Create timeline
const bounceTimeline = await api.timeline.createTimeline('Bounce Animation', 3000, 30);
const positionTrack = await api.timeline.createTrack(bounceTimeline.id, 'property', 'Position');

// Create bouncing keyframes
const keyframes = [
  { time: 0, value: { x: 100, y: 100 } },
  { time: 500, value: { x: 200, y: 50 } },
  { time: 1000, value: { x: 300, y: 100 } },
  { time: 1500, value: { x: 400, y: 25 } },
  { time: 2000, value: { x: 500, y: 100 } },
  { time: 2500, value: { x: 600, y: 75 } },
  { time: 3000, value: { x: 700, y: 100 } }
];

for (const kf of keyframes) {
  await api.timeline.addKeyframe(positionTrack.id, kf.time, kf.value);
}

// Add rotation for extra effect
const rotationTrack = await api.timeline.createTrack(bounceTimeline.id, 'property', 'Rotation');
await api.timeline.addKeyframe(rotationTrack.id, 0, 0);
await api.timeline.addKeyframe(rotationTrack.id, 3000, 720); // 2 full rotations

// Play animation
await api.timeline.play(bounceTimeline.id);

// Log completion
setTimeout(() => {
  api.utils.log('Animation completed!');
}, 3100);
```

### Real-time Data Visualization
```javascript
// Create dynamic visualization that updates based on system data
const createSystemMonitor = async () => {
  // Create base visualization
  const monitor = await api.sceneGraph.createNode('group', null, 'System Monitor');

  // CPU usage bar
  const cpuBar = await api.sceneGraph.createNode('rectangle', monitor.id, 'CPU Usage');
  await api.sceneGraph.setProperty(cpuBar.id, 'width', 300);
  await api.sceneGraph.setProperty(cpuBar.id, 'height', 20);
  await api.sceneGraph.setProperty(cpuBar.id, 'fillColor', { r: 0, g: 1, b: 0, a: 1 });

  // Memory usage bar
  const memBar = await api.sceneGraph.createNode('rectangle', monitor.id, 'Memory Usage');
  await api.sceneGraph.setProperty(memBar.id, 'width', 300);
  await api.sceneGraph.setProperty(memBar.id, 'height', 20);
  await api.sceneGraph.setProperty(memBar.id, 'fillColor', { r: 0, g: 0, b: 1, a: 1 });

  // Position elements
  await api.sceneGraph.setTransform(cpuBar.id, { position: { x: 50, y: 50, z: 0 } });
  await api.sceneGraph.setTransform(memBar.id, { position: { x: 50, y: 100, z: 0 } });

  // Animation loop to update visualization
  const updateVisualization = async () => {
    try {
      const metrics = await api.system.getPerformanceMetrics();
      const memory = await api.system.getMemoryUsage();

      // Update CPU bar width based on usage
      const cpuWidth = (metrics.cpuUsage / 100) * 300;
      await api.sceneGraph.setProperty(cpuBar.id, 'width', cpuWidth);

      // Update memory bar width based on usage
      const memUsage = memory.heapUsed / memory.heapTotal;
      const memWidth = memUsage * 300;
      await api.sceneGraph.setProperty(memBar.id, 'width', memWidth);

      // Update colors based on usage levels
      const cpuColor = metrics.cpuUsage > 80
        ? { r: 1, g: 0, b: 0, a: 1 }
        : { r: 0, g: 1, b: 0, a: 1 };
      await api.sceneGraph.setProperty(cpuBar.id, 'fillColor', cpuColor);

      const memColor = memUsage > 0.8
        ? { r: 1, g: 0, b: 0, a: 1 }
        : { r: 0, g: 0, b: 1, a: 1 };
      await api.sceneGraph.setProperty(memBar.id, 'fillColor', memColor);

      // Schedule next update
      setTimeout(updateVisualization, 1000);
    } catch (error) {
      api.utils.log('Error updating visualization:', error);
    }
  };

  // Start the update loop
  await updateVisualization();
};

// Run the system monitor
await createSystemMonitor();
```

### Error Handling and Debugging
```javascript
// Comprehensive error handling
const safeApiCall = async (operation) => {
  try {
    const result = await operation();
    api.utils.log('Operation completed successfully:', result);
    return result;
  } catch (error) {
    api.utils.log('Operation failed:', error.message);

    // Check error type and provide suggestions
    if (error.code === 'permission.denied') {
      api.utils.log('Check your permissions. Available permissions:', api.context.permissions);
    } else if (error.code === 'node.not_found') {
      api.utils.log('Node not found. Check if the node ID is correct.');
    } else if (error.code === 'invalid_parameter') {
      api.utils.log('Invalid parameter. Check the API documentation for correct usage.');
    }

    throw error;
  }
};

// Usage example
await safeApiCall(async () => {
  const node = await api.sceneGraph.getNode('nonexistent-id');
  return node;
});
```

## Performance Optimization

### Efficient API Usage Patterns

**Batch Operations:**
```javascript
// Instead of individual calls
for (const id of nodeIds) {
  await api.sceneGraph.setProperty(id, 'visible', true);
}

// Use batch operations when available
await api.sceneGraph.updateNodes(nodeIds, { visible: true });
```

**Caching and Memoization:**
```javascript
// Cache frequently accessed data
const nodeCache = new Map();

const getCachedNode = async (nodeId) => {
  if (nodeCache.has(nodeId)) {
    return nodeCache.get(nodeId);
  }

  const node = await api.sceneGraph.getNode(nodeId);
  if (node) {
    nodeCache.set(nodeId, node);
  }
  return node;
};

// Use debounced updates for real-time changes
const debouncedUpdate = api.utils.debounce(async (nodeId, property, value) => {
  await api.sceneGraph.setProperty(nodeId, property, value);
}, 100);
```

**Async/Await Best Practices:**
```javascript
// Use Promise.all for concurrent operations
const results = await Promise.all([
  api.sceneGraph.getNode('node1'),
  api.sceneGraph.getNode('node2'),
  api.sceneGraph.getNode('node3')
]);

// Handle async operations properly
const animateNodes = async (nodeIds) => {
  const animations = nodeIds.map(async (nodeId) => {
    const node = await api.sceneGraph.getNode(nodeId);
    if (node) {
      await api.sceneGraph.setTransform(nodeId, {
        position: { x: Math.random() * 1000, y: Math.random() * 600, z: 0 }
      });
    }
  });

  await Promise.all(animations);
};
```

## Security Integration

### Permission System
The API enforces strict permission checking:

```javascript
// Check permissions before operations
if (api.context.permissions.includes('sceneGraph.delete')) {
  await api.sceneGraph.deleteNode(nodeId);
} else {
  api.utils.log('Permission denied: Cannot delete nodes');
}

// Available permission categories:
// - sceneGraph.read, sceneGraph.create, sceneGraph.update, sceneGraph.delete
// - timeline.read, timeline.create, timeline.edit, timeline.playback
// - rendering.render, rendering.createViewport, rendering.export
// - collaboration.create, collaboration.join, collaboration.presence
// - plugins.install, plugins.execute, plugins.create
// - documents.create, documents.read, documents.write
// - settings.read, settings.write
// - system.read, system.monitor
```

### Sandbox Security
All code executes in a secure sandbox with:
- Memory limits (50MB default)
- Execution timeouts (5s default)
- Network access restrictions
- File system isolation
- API permission enforcement

## Testing and Debugging

### Built-in Testing Support
```javascript
// Create test scenarios
const testSceneCreation = async () => {
  const startTime = Date.now();

  // Test node creation
  const nodes = [];
  for (let i = 0; i < 100; i++) {
    const node = await api.sceneGraph.createNode('rectangle', null, `Test Node ${i}`);
    nodes.push(node);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  api.utils.log(`Created ${nodes.length} nodes in ${duration}ms`);
  api.utils.log(`Average time per node: ${duration / nodes.length}ms`);

  return nodes;
};

// Run performance tests
await testSceneCreation();
```

### Debugging Utilities
```javascript
// Debug node hierarchy
const debugNodeHierarchy = async (nodeId) => {
  const node = await api.sceneGraph.getNode(nodeId);
  if (!node) return;

  api.utils.log('Node:', node.name, node.type);
  api.utils.log('Children:', node.children.length);

  const children = await api.sceneGraph.getChildren(nodeId);
  for (const child of children) {
    api.utils.log('  -', child.name, child.type);
  }

  const descendants = await api.sceneGraph.getDescendants(nodeId);
  api.utils.log('Total descendants:', descendants.length);
};

// Debug timeline
const debugTimeline = async (timelineId) => {
  const timeline = await api.timeline.getTimeline(timelineId);
  if (!timeline) return;

  api.utils.log('Timeline:', timeline.name);
  api.utils.log('Duration:', timeline.duration, 'ms');
  api.utils.log('Frame Rate:', timeline.frameRate, 'fps');

  const tracks = await api.timeline.getTracks(timelineId);
  tracks.forEach(track => {
    api.utils.log('Track:', track.name, track.type, track.keyframes.length, 'keyframes');
  });
};
```

## Integration Best Practices

### 1. Progressive API Discovery
- Start with basic operations and gradually explore advanced features
- Use IntelliSense to discover available methods
- Check API documentation for detailed parameter information

### 2. Error Handling
- Always wrap API calls in try-catch blocks
- Use the error.code property to handle specific error types
- Provide user-friendly error messages

### 3. Performance Considerations
- Batch operations when possible
- Cache frequently accessed data
- Use debounced updates for real-time changes
- Monitor memory and execution time

### 4. Security Awareness
- Check permissions before performing operations
- Understand the sandbox limitations
- Respect user privacy and data boundaries

### 5. Code Organization
- Break complex operations into reusable functions
- Use descriptive variable names
- Comment complex logic for maintainability

This comprehensive API integration provides developers with powerful tools to create sophisticated animations and interactions while maintaining security, performance, and usability standards.
