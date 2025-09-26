# Scene Graph and Timeline System - Feature Plan

## Design Sketch

### Core Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    SceneGraph                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Node      │  │  Property   │  │ TimeSampler │          │
│  │             │  │             │  │             │          │
│  │ • id: UUID  │  │ • name      │  │ • evaluate  │          │
│  │ • type      │  │ • value     │  │   (t: Time) │          │
│  │ • children  │  │ • keyframes │  │   -> Frame  │          │
│  │ • transform │  │ • curves    │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Timeline                                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │    Track    │  │  Keyframe   │  │ Evaluator   │          │
│  │             │  │             │  │             │          │
│  │ • nodes     │  │ • time      │  │ • sort_deps │          │
│  │ • duration  │  │ • value     │  │ • evaluate  │          │
│  │ • playback  │  │ • easing    │  │ • cache     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Key Interfaces
```typescript
interface SceneNode {
  readonly id: string;
  readonly type: NodeType;
  readonly transform: Transform2D;
  readonly properties: Map<string, Property>;
  readonly children: SceneNode[];
  evaluate(timeline: Timeline, time: Time): Frame;
  addChild(node: SceneNode): void;
  removeChild(nodeId: string): void;
}

interface Timeline {
  readonly duration: Time;
  readonly tracks: Track[];
  readonly playbackRate: number;
  evaluate(time: Time): SceneState;
  addTrack(track: Track): void;
  removeTrack(trackId: string): void;
  scrub(toTime: Time): void;
}

interface Property {
  readonly name: string;
  readonly type: PropertyType;
  readonly keyframes: Keyframe[];
  sample(time: Time): Value;
  addKeyframe(keyframe: Keyframe): void;
  removeKeyframe(time: Time): void;
}
```

### Dependency Resolution Flow
```
Time Event → Timeline Evaluation → Dependency Sort → Node Evaluation → Frame Cache
     ↓              ↓                    ↓              ↓              ↓
  User Input    Scene State         Topological    Property      Render Cache
  (scrub/play)   Resolution          Ordering       Sampling       (GPU Ready)
```

## Test Matrix

### Unit Tests (Property-based, Deterministic)
| Component | Test Focus | Edge Cases | Properties |
|-----------|------------|------------|------------|
| **SceneNode** | Tree operations, transforms | Deep nesting (100+ levels), circular refs | Tree isomorphism, transform composition |
| **Property** | Keyframe interpolation | Bezier curves, step functions, hold | Deterministic sampling, monotonic time |
| **Timeline** | Time evaluation, scrubbing | Negative time, overflow, precision loss | Frame-accurate timing, idempotent evaluation |
| **Evaluator** | Dependency resolution | Cycles, parallel deps, lazy evaluation | Topological consistency, evaluation order |
| **Keyframes** | Interpolation algorithms | NaN values, extreme ranges, discontinuities | Value continuity, boundary conditions |

### Contract Tests (Provider/Consumer)
| Contract | Provider | Consumer | Verification |
|----------|----------|----------|--------------|
| **Scene Graph API** | Core engine | UI components, exporters | Schema validation, version compatibility |
| **Timeline API** | Timeline engine | Playback controls, audio sync | Method contracts, error responses |
| **Property API** | Animation system | Keyframe editors, curve tools | Type safety, interpolation contracts |

### Integration Tests (Real Data)
| Flow | Data Setup | Verification | Containers |
|------|------------|--------------|------------|
| **Complex Composition** | 50-node scene with effects | Render matches golden frame | GPU-enabled (WebGPU) |
| **Timeline Scrubbing** | 1000 keyframes across tracks | 60fps performance | Time-based assertions |
| **Node Lifecycle** | Dynamic add/remove operations | Memory bounded, no leaks | Memory profiling |
| **Cross-platform** | Identical scene on different GPUs | Pixel-perfect comparison | Multi-GPU matrix |

### E2E Smoke Tests (Critical Paths)
| Scenario | Actions | Assertions | Traces |
|----------|---------|------------|---------|
| **Basic Animation** | Create shape → Add keyframes → Scrub timeline | Smooth playback, correct interpolation | Frame timing, evaluation spans |
| **Complex Scene** | Import assets → Build hierarchy → Preview | No crashes, acceptable performance | Memory usage, dependency resolution |
| **Error Recovery** | Invalid keyframe → Circular dependency → Fix | Graceful errors, recovery options | Error spans, user notifications |

## Data Plan

### Factories and Fixtures
```typescript
// Deterministic scene factory for testing
const sceneFactory = {
  simple: () => createSceneNode({
    type: 'rectangle',
    properties: {
      position: linearKeyframes([{ t: 0, v: [0, 0] }, { t: 1000, v: [100, 100] }]),
      opacity: bezierKeyframes([{ t: 0, v: 1 }, { t: 500, v: 0.5 }, { t: 1000, v: 0 }])
    }
  }),

  complex: () => createSceneNode({
    type: 'composition',
    children: Array.from({ length: 50 }, (_, i) => createSceneNode({
      type: 'shape',
      properties: {
        position: randomWalkKeyframes(100), // Deterministic random walk
        scale: bounceKeyframes(20)
      }
    }))
  })
};

// Anonymized test data (no real assets)
const testAssets = {
  image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA0VaS9gAAAABJRU5ErkJggg==',
  audio: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQF0AAEBfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhEUOl7f89eVBBQKq1fF9eWCBg=='
};
```

### Seed Strategy
- **Minimal fixtures**: 3-5 nodes for unit tests
- **Medium fixtures**: 10-20 nodes with basic animations for integration
- **Large fixtures**: 50+ nodes with complex hierarchies for performance tests
- **Golden frames**: Pre-computed reference images for deterministic validation

## Observability Plan

### Logs (Structured)
```typescript
// Evaluation performance
logger.info('frame_evaluation', {
  sceneId: 'scene-123',
  timeMs: 12.5,
  nodeCount: 45,
  cacheHitRate: 0.85,
  memoryUsage: '245MB'
});

// Timeline events
logger.info('timeline_event', {
  action: 'scrub',
  fromTime: 1000,
  toTime: 2500,
  durationMs: 15,
  frameDrops: 0
});

// Error conditions
logger.error('dependency_cycle', {
  nodeId: 'node-456',
  cyclePath: ['A->B->C->A'],
  resolution: 'auto_break_weakest_link'
});
```

### Metrics (Time-series)
```typescript
// Core performance metrics
metrics.gauge('scene_graph.node_count', nodeCount);
metrics.histogram('frame_evaluation.duration_ms', duration);
metrics.counter('timeline.scrubs_total');
metrics.gauge('memory.heap_used_mb', heapUsed);

// Quality metrics
metrics.gauge('cache.hit_rate', cacheHitRate);
metrics.histogram('interpolation.error_epsilon', error);
```

### Traces (Distributed)
```typescript
// Evaluation span
tracer.startSpan('evaluate_frame', {
  tags: { sceneId, time, nodeCount }
}).setAttribute('evaluation.strategy', 'dependency_sorted')
  .addEvent('dependency_resolution')
  .addEvent('node_evaluation', { nodeCount })
  .addEvent('frame_cache')
  .setStatus({ code: SpanStatusCode.OK });

// Error spans
tracer.startSpan('handle_error', {
  tags: { errorType: 'cycle_detected', severity: 'medium' }
}).setAttribute('error.node_id', nodeId)
  .setAttribute('error.cycle_path', cyclePath)
  .setStatus({ code: SpanStatusCode.ERROR, message: 'Circular dependency' });
```

### Dashboards and Alerts
- **Performance dashboard**: Frame evaluation times, memory usage trends
- **Quality dashboard**: Cache hit rates, interpolation errors
- **Error dashboard**: Dependency cycles, evaluation failures
- **Alerts**: Frame time > 16ms, memory usage > 80% threshold, cycle detection frequency
