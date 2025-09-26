# Developer Mode Test Plan

## Overview

This test plan covers comprehensive testing of the Developer Mode feature, ensuring security, performance, usability, and reliability. The testing strategy follows the CAWS framework requirements for different test levels and coverage targets.

## Test Levels and Coverage

### Unit Tests (Target: 90% coverage)
- **Sandbox Environment**: Security isolation, resource limits, API proxying
- **API Wrappers**: Method delegation, error handling, type safety
- **Code Editor**: Syntax highlighting, auto-completion, keyboard shortcuts
- **Error Handling**: Error classification, reporting, recovery

### Integration Tests (Target: 85% coverage)
- **End-to-End Workflows**: Complete user journeys from code writing to execution
- **Component Integration**: Code editor + sandbox + preview system
- **API Integration**: Developer mode APIs with core Animator systems
- **State Synchronization**: Real-time updates between code and canvas

### E2E Tests (Target: 80% coverage)
- **User Workflows**: Complete feature usage scenarios
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
- **Performance Testing**: Load testing with concurrent users
- **Accessibility Testing**: Screen reader compatibility, keyboard navigation

## Test Categories

### 1. Security Tests

#### Sandbox Isolation
```typescript
test('sandbox prevents access to restricted APIs', async () => {
  const sandbox = createSandbox({ permissions: ['sceneGraph'] });

  const maliciousCode = `
    try {
      // Attempt to access file system
      require('fs').readFileSync('/etc/passwd');
    } catch (e) {
      return 'blocked';
    }
  `;

  const result = await sandbox.execute(maliciousCode);
  expect(result.errors[0].type).toBe('permission');
});
```

#### Resource Limits
```typescript
test('memory limit enforcement', async () => {
  const sandbox = createSandbox({ memoryLimit: 10 }); // 10MB

  const memoryIntensiveCode = `
    const arr = [];
    while (true) {
      arr.push(new Array(1000000)); // Allocate memory
    }
  `;

  const result = await sandbox.execute(memoryIntensiveCode);
  expect(result.errors[0].type).toBe('memory');
  expect(result.memoryUsed).toBeLessThanOrEqual(10);
});
```

#### Permission System
```typescript
test('permission-based API access', async () => {
  const sandbox = createSandbox({
    permissions: ['sceneGraph'], // No timeline access
  });

  const code = `
    try {
      api.timeline.createTimeline('test', 5000, 30);
      return 'allowed';
    } catch (e) {
      return 'blocked';
    }
  `;

  const result = await sandbox.execute(code);
  expect(result.errors[0].type).toBe('permission');
});
```

### 2. Performance Tests

#### Execution Benchmarks
```typescript
test('code execution performance', async () => {
  const sandbox = createSandbox();

  const code = `
    for (let i = 0; i < 1000; i++) {
      api.sceneGraph.createNode('rectangle');
    }
    return 'done';
  `;

  const startTime = performance.now();
  const result = await sandbox.execute(code);
  const endTime = performance.now();

  expect(endTime - startTime).toBeLessThan(100); // < 100ms
  expect(result.executionTime).toBeLessThan(50);
});
```

#### Memory Usage
```typescript
test('memory usage tracking', async () => {
  const sandbox = createSandbox({ memoryLimit: 50 });

  const code = `
    const nodes = [];
    for (let i = 0; i < 100; i++) {
      nodes.push(api.sceneGraph.createNode('rectangle'));
    }
    return nodes.length;
  `;

  const result = await sandbox.execute(code);
  expect(result.memoryUsed).toBeLessThan(25); // < 25MB
});
```

#### Concurrent Execution
```typescript
test('concurrent sandbox execution', async () => {
  const sandboxes = Array(5).fill().map(() => createSandbox());

  const promises = sandboxes.map((sandbox, i) => {
    const code = `
      api.sceneGraph.createNode('rectangle');
      return ${i};
    `;
    return sandbox.execute(code);
  });

  const results = await Promise.all(promises);
  expect(results).toHaveLength(5);
  expect(results.every(r => r.success)).toBe(true);
});
```

### 3. Usability Tests

#### Code Editor Experience
```typescript
test('auto-completion functionality', async () => {
  const editor = new CodeEditor();
  editor.setValue('api.scene');

  const completions = await editor.getCompletions();
  expect(completions).toContain('sceneGraph');
  expect(completions).toContain('sceneGraph.createNode');
});
```

#### Error Feedback
```typescript
test('error display and suggestions', async () => {
  const sandbox = createSandbox();
  const code = 'api.sceneGraph.createNode();'; // Missing required parameter

  const result = await sandbox.execute(code);
  expect(result.errors[0].type).toBe('runtime');
  expect(result.errors[0].suggestion).toContain('createNode requires a type parameter');
});
```

#### Real-time Preview
```typescript
test('live preview updates', async () => {
  const preview = new LivePreview();
  const sandbox = createSandbox();

  const code = `
    const node = api.sceneGraph.createNode('rectangle');
    api.sceneGraph.setProperties(node.id, {
      width: 100,
      height: 100,
      fillColor: { r: 1, g: 0, b: 0, a: 1 }
    });
  `;

  await sandbox.execute(code);

  const canvasState = preview.getCanvasState();
  expect(canvasState.nodes).toHaveLength(1);
  expect(canvasState.nodes[0].properties.fillColor.r).toBe(1);
});
```

### 4. Integration Tests

#### Complete Workflow
```typescript
test('complete developer mode workflow', async () => {
  // 1. Open developer mode
  const devMode = new DeveloperMode();
  await devMode.open();

  // 2. Write code
  const editor = devMode.getEditor();
  await editor.setValue(`
    const scene = api.sceneGraph.getCurrentScene();
    const text = api.sceneGraph.createNode('text');
    api.sceneGraph.setProperties(text.id, {
      text: 'Hello, World!',
      fontSize: 48,
      color: { r: 0, g: 0, b: 1, a: 1 }
    });
  `);

  // 3. Execute code
  const result = await devMode.execute();

  // 4. Verify canvas updates
  const canvas = devMode.getPreview();
  const textNodes = canvas.getNodesByType('text');
  expect(textNodes).toHaveLength(1);
  expect(textNodes[0].properties.text).toBe('Hello, World!');
});
```

#### Snippet Management
```typescript
test('snippet save and load', async () => {
  const snippetManager = new SnippetManager();

  // Save snippet
  const snippet = {
    name: 'Hello World Animation',
    code: '/* animation code */',
    tags: ['animation', 'text']
  };

  const savedId = await snippetManager.save(snippet);

  // Load snippet
  const loaded = await snippetManager.load(savedId);
  expect(loaded.name).toBe(snippet.name);
  expect(loaded.code).toBe(snippet.code);
});
```

### 5. Error Handling Tests

#### Syntax Errors
```typescript
test('syntax error handling', async () => {
  const sandbox = createSandbox();
  const code = 'api.sceneGraph.createNode('; // Unclosed parenthesis

  const result = await sandbox.execute(code);
  expect(result.success).toBe(false);
  expect(result.errors[0].type).toBe('syntax');
  expect(result.errors[0].line).toBeDefined();
  expect(result.errors[0].column).toBeDefined();
});
```

#### Runtime Errors
```typescript
test('runtime error handling', async () => {
  const sandbox = createSandbox();
  const code = `
    const node = api.sceneGraph.createNode('invalid_type');
  `;

  const result = await sandbox.execute(code);
  expect(result.success).toBe(false);
  expect(result.errors[0].type).toBe('runtime');
  expect(result.errors[0].stack).toBeDefined();
});
```

#### Resource Exhaustion
```typescript
test('resource limit error handling', async () => {
  const sandbox = createSandbox({ timeout: 100 });

  const code = `
    while (true) {
      // Infinite loop
    }
  `;

  const result = await sandbox.execute(code);
  expect(result.errors[0].type).toBe('timeout');
  expect(result.executionTime).toBeGreaterThanOrEqual(100);
});
```

## Test Data and Fixtures

### Mock APIs
```typescript
// Mock Animator API for testing
const mockApi = {
  sceneGraph: {
    createNode: jest.fn(),
    getNode: jest.fn(),
    setProperty: jest.fn(),
    setTransform: jest.fn(),
  },
  timeline: {
    createTimeline: jest.fn(),
    addKeyframe: jest.fn(),
    play: jest.fn(),
  },
  rendering: {
    renderFrame: jest.fn(),
    createViewport: jest.fn(),
  },
  utils: {
    log: jest.fn(),
    generateId: jest.fn(),
  }
};
```

### Test Scenarios
1. **Simple Node Creation**: Basic API usage
2. **Complex Animation**: Multiple nodes with keyframes
3. **Error Recovery**: Handle and recover from errors
4. **Performance Load**: Execute under resource constraints
5. **Concurrent Access**: Multiple sandboxes running simultaneously

## Test Execution

### Local Development
```bash
# Run unit tests
npm run test:unit -- --testPathPattern=developer-mode

# Run integration tests
npm run test:integration -- --testPathPattern=developer-mode

# Run E2E tests
npm run test:e2e -- --testPathPattern=developer-mode
```

### CI/CD Pipeline
```yaml
- name: Test Developer Mode
  run: |
    npm run test:unit -- --coverage --testPathPattern=developer-mode
    npm run test:integration -- --testPathPattern=developer-mode
    npm run test:security -- --testPathPattern=developer-mode
```

### Performance Testing
```bash
# Load testing
npm run test:performance -- --scenario=concurrent-execution

# Memory profiling
npm run test:memory -- --sandbox=memory-intensive

# Security scanning
npm run test:security -- --scan-type=sandbox-isolation
```

## Test Reporting

### Coverage Reports
- **Unit Test Coverage**: >90% for core sandbox and wrapper code
- **Integration Test Coverage**: >85% for end-to-end workflows
- **E2E Test Coverage**: >80% for user journey scenarios

### Performance Benchmarks
- **Code Execution**: Average <100ms, P95 <200ms
- **Memory Usage**: <50MB additional memory usage
- **UI Responsiveness**: No impact on main application frame rate

### Security Validation
- **Sandbox Isolation**: 100% of restricted API access blocked
- **Resource Limits**: 100% enforcement of configured limits
- **Error Containment**: No crashes from malicious code

This comprehensive test plan ensures the Developer Mode feature is secure, performant, and reliable while providing an excellent developer experience.
