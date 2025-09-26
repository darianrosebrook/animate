# Scene Graph and Timeline System - Test Plan

## Test Structure Overview

### Risk Tier 1 Requirements
- **Mutation Score**: ≥70% (all mutants must be killed or justified)
- **Branch Coverage**: ≥90% (every code path tested)
- **Contract Tests**: Mandatory (provider/consumer verification)
- **Integration Tests**: Real containers required (GPU-enabled)
- **E2E Tests**: Critical path coverage with semantic selectors
- **Manual Review**: Required for core evaluation logic

### Test Categories
1. **Unit Tests** (Jest + fast-check) - Pure logic isolation
2. **Contract Tests** (Pact) - API boundary verification
3. **Integration Tests** (Testcontainers) - Full stack validation
4. **E2E Tests** (Playwright) - User journey validation
5. **Mutation Tests** (Stryker) - Semantic coverage validation
6. **Property Tests** - Invariant verification

## Unit Test Specifications

### Property-Based Tests (fast-check)
```typescript
// Invariant: Deterministic evaluation [INV-1]
test('scene evaluation is deterministic', () => {
  const scene = sceneArb();
  const time = timeArb();
  fc.assert(fc.property(scene, time, (s, t) => {
    const result1 = evaluateScene(s, t);
    const result2 = evaluateScene(s, t);
    return deepEqual(result1, result2);
  }));
});

// Invariant: Acyclic dependencies [INV-2]
test('scene graph maintains DAG structure', () => {
  fc.assert(fc.property(sceneGraphArb(), (graph) => {
    const cycle = detectCycles(graph);
    return cycle.length === 0;
  }));
});

// Invariant: Memory bounded growth [INV-4]
test('memory usage scales linearly with complexity', () => {
  const sizes = [10, 50, 100, 200];
  fc.assert(fc.property(fc.integer({ min: 0, max: sizes.length - 1 }), (sizeIndex) => {
    const scene = complexSceneArb(sizes[sizeIndex]);
    const memoryStart = process.memoryUsage().heapUsed;
    evaluateScene(scene, timeArb());
    const memoryEnd = process.memoryUsage().heapUsed;
    const growth = memoryEnd - memoryStart;
    return growth < sizes[sizeIndex] * 1024 * 10; // < 10KB per node
  }));
});
```

### Interpolation Tests
```typescript
describe('Keyframe Interpolation', () => {
  test('linear interpolation produces expected values', () => {
    const keyframe = createLinearKeyframe(0, 0, 1000, 100);
    expect(keyframe.sample(500)).toBe(50);
    expect(keyframe.sample(0)).toBe(0);
    expect(keyframe.sample(1000)).toBe(100);
  });

  test('bezier curves handle edge cases', () => {
    const bezier = createBezierKeyframe([
      { t: 0, v: 0, handleOut: [0.5, 0] },
      { t: 1000, v: 100, handleIn: [0.5, 1] }
    ]);

    // Test monotonicity
    const values = [250, 500, 750].map(t => bezier.sample(t));
    expect(values).toSatisfyAll(v => v >= 0 && v <= 100);
  });
});
```

### Timeline Scrubbing Tests
```typescript
describe('Timeline Scrubbing', () => {
  test('scrub maintains frame accuracy', () => {
    const timeline = createTimeline();
    timeline.scrub(500);
    expect(timeline.currentTime).toBe(500);
  });

  test('scrub triggers evaluation', () => {
    const mockNode = createMockNode();
    const scene = createScene([mockNode]);
    const timeline = createTimeline(scene);

    timeline.scrub(1000);
    expect(mockNode.evaluate).toHaveBeenCalledWith(timeline, 1000);
  });
});
```

## Contract Test Specifications

### Scene Graph API Contract (Pact)
```typescript
// Provider (Core Engine)
const sceneProvider = {
  createNode: (request: CreateNodeRequest) => ({
    id: generateId(),
    type: request.type,
    transform: request.transform || defaultTransform(),
    properties: new Map(),
    children: []
  }),

  evaluateNode: (nodeId: string, time: number) => {
    // Implementation returns frame data
    return { pixels: [...], metadata: {...} };
  }
};

// Consumer (UI Components)
const sceneConsumer = {
  uponReceiving: 'a scene node',
  withRequest: {
    method: 'POST',
    path: '/nodes',
    body: { type: 'rectangle', transform: { x: 0, y: 0 } }
  },
  willRespondWith: {
    status: 201,
    body: {
      id: like('node-123'),
      type: 'rectangle',
      transform: { x: 0, y: 0 },
      properties: like(new Map()),
      children: like([])
    }
  }
};
```

### Timeline API Contract
```typescript
// Timeline evaluation contract
const timelineProvider = {
  evaluate: (time: number) => ({
    nodes: [...],
    duration: 1000,
    frameRate: 60
  })
};

const timelineConsumer = {
  uponReceiving: 'timeline evaluation at specific time',
  withRequest: {
    method: 'POST',
    path: '/timeline/evaluate',
    body: { time: 500 }
  },
  willRespondWith: {
    status: 200,
    body: {
      nodes: eachLike({ id: 'node-1', frame: {...} }),
      duration: 1000,
      frameRate: 60
    }
  }
};
```

## Integration Test Specifications

### GPU-Enabled Container Tests
```typescript
describe('Scene Graph Integration', () => {
  let gpuContainer: WebGPUContainer;
  let sceneGraph: SceneGraph;

  beforeAll(async () => {
    gpuContainer = await WebGPUContainer.start({
      device: 'gpu',
      memory: '2GB'
    });
    sceneGraph = new SceneGraph(gpuContainer);
  });

  afterAll(async () => {
    await gpuContainer.stop();
  });

  test('complex scene renders correctly', async () => {
    const scene = createComplexScene(50);
    const frame = await sceneGraph.evaluate(scene, 1000);

    expect(frame.pixels).toMatchGoldenFrame('complex-scene-frame-1000.png');
    expect(frame.metadata.renderTimeMs).toBeLessThan(16);
  });

  test('memory usage remains bounded', async () => {
    const scene = createMemoryIntensiveScene();
    const initialMemory = gpuContainer.getMemoryUsage();

    await sceneGraph.evaluate(scene, 500);
    await sceneGraph.evaluate(scene, 1000);
    await sceneGraph.evaluate(scene, 1500);

    const finalMemory = gpuContainer.getMemoryUsage();
    expect(finalMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB
  });
});
```

### Timeline Performance Tests
```typescript
describe('Timeline Performance', () => {
  let timeline: Timeline;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    timeline = createTimeline();
    performanceMonitor = new PerformanceMonitor();
  });

  test('maintains 60fps during scrubbing', async () => {
    const scene = createSceneWithKeyframes(1000);
    timeline.loadScene(scene);

    const frameTimes: number[] = [];
    for (let time = 0; time <= 1000; time += 16) { // 60fps intervals
      const start = performance.now();
      timeline.scrub(time);
      const end = performance.now();
      frameTimes.push(end - start);
    }

    const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
    expect(avgFrameTime).toBeLessThan(16); // 60fps target
    expect(Math.max(...frameTimes)).toBeLessThan(33); // No frame drops > 2x target
  });
});
```

## E2E Test Specifications

### Critical Path Tests (Playwright)
```typescript
test('create and animate scene node', async ({ page }) => {
  await page.goto('/animator');

  // Create a new scene
  await page.click('[data-testid="new-scene-button"]');
  await page.click('[data-testid="add-rectangle-tool"]');

  // Add keyframe animation
  await page.click('[data-testid="canvas"]', { position: { x: 100, y: 100 } });
  await page.click('[data-testid="add-keyframe-button"]');
  await page.fill('[data-testid="time-input"]', '1000');
  await page.click('[data-testid="canvas"]', { position: { x: 200, y: 200 } });
  await page.click('[data-testid="add-keyframe-button"]');

  // Verify animation plays
  await page.click('[data-testid="play-button"]');
  await page.waitForTimeout(1000);

  // Check interpolation worked
  const finalPosition = await page.locator('[data-testid="selected-node"]').getAttribute('transform');
  expect(finalPosition).toContain('translate(200, 200)');
});

test('complex scene maintains performance', async ({ page }) => {
  await page.goto('/animator');

  // Create complex scene
  for (let i = 0; i < 50; i++) {
    await page.click('[data-testid="add-shape-tool"]');
    await page.click('[data-testid="canvas"]', { position: { x: i * 10, y: i * 10 } });
  }

  // Add animations to all shapes
  await page.click('[data-testid="select-all-button"]');
  await page.click('[data-testid="add-animation-button"]');

  // Measure scrubbing performance
  const startTime = Date.now();
  await page.locator('[data-testid="timeline-scrubber"]').dragTo({ x: 800, y: 0 });
  const endTime = Date.now();

  expect(endTime - startTime).toBeLessThan(100); // Should be smooth
});
```

### Accessibility Tests (axe-core)
```typescript
test('timeline is keyboard accessible', async ({ page }) => {
  await page.goto('/animator');

  // Tab navigation
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  expect(await page.locator('[data-testid="timeline-container"]:focus')).toBeTruthy();

  // Arrow key navigation
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Home');
  await page.keyboard.press('End');

  // Verify screen reader support
  await expect(page.locator('[aria-label="Timeline scrubber"]')).toBeVisible();
  await expect(page.locator('[aria-valuetext*="current time"]')).toBeVisible();
});

test('scene graph meets accessibility standards', async ({ page }) => {
  await page.goto('/animator');

  // Run axe accessibility audit
  const violations = await page.evaluate(async () => {
    const { default: axe } = await import('axe-core');
    return await axe.run(document, {
      rules: {
        'color-contrast': { enabled: false }, // Allow creative color choices
        'focus-visible': { enabled: true },
        'keyboard': { enabled: true }
      }
    });
  });

  expect(violations.length).toBe(0);
});
```

## Mutation Test Specifications

### Coverage Requirements
- **Target Score**: 70% (Tier 1 requirement)
- **Surviving Mutants**: Must be justified and documented
- **Hot Path Coverage**: 100% for evaluation and interpolation logic

### Key Mutation Operators
```typescript
// Arithmetic operator replacement
const mutants = [
  { original: 'a + b', mutant: 'a - b', description: 'Subtraction instead of addition' },
  { original: 'a * b', mutant: 'a / b', description: 'Division instead of multiplication' },
  { original: 'a < b', mutant: 'a <= b', description: 'Less-than-equal boundary change' }
];

// Boolean logic mutants
const booleanMutants = [
  { original: '&&', mutant: '||', description: 'OR instead of AND' },
  { original: '===', mutant: '!==', description: 'Inequality instead of equality' }
];

// Control flow mutants
const controlMutants = [
  { original: 'if (condition)', mutant: 'if (!condition)', description: 'Negated condition' },
  { original: 'for (let i = 0; i < n; i++)', mutant: 'for (let i = 0; i <= n; i++)', description: 'Off-by-one in loop' }
];
```

## Flake Controls and Determinism

### Deterministic Test Data
```typescript
// Fixed seed for reproducible random data
const FIXED_SEED = 12345;
const deterministicRandom = seedrandom(FIXED_SEED);

// Deterministic time for time-based tests
const fixedClock = {
  now: () => new Date('2025-01-01T00:00:00.000Z'),
  setTime: (time: string) => new Date(time)
};
```

### Anti-Flake Measures
- **Retry Policy**: No retries allowed (fail immediately on non-deterministic results)
- **Isolation**: Each test runs in isolated GPU context
- **Timing**: Use fixed time intervals, never `setTimeout` without deterministic clock
- **Memory**: Explicit cleanup and memory validation between tests

### Quarantine Process
- Flaky tests auto-quarantined within 24 hours
- Must have open ticket with owner and expiry date
- Trust score capped at 79 with active quarantines
- Resolution required before merge
