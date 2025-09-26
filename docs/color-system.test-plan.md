# Color System Test Plan — Golden-Frame Validation & Deterministic Rendering

## Overview

This test plan ensures the color system maintains deterministic rendering, professional color accuracy, and seamless library integration while meeting the highest quality standards for motion graphics production.

## Test Categories & Coverage

### 1. Unit Tests (Deterministic Color Processing)
**Coverage Target**: ≥90% branch coverage
**Mutation Score Target**: ≥70% (Tier 1 requirement)

#### Color Space Conversions
```typescript
// Test deterministic color space conversions
it("sRGB to Linear conversion maintains precision [deterministic]", () => {
  const color = { r: 0.5, g: 0.7, b: 0.3, colorSpace: 'sRGB' as const }
  const linear1 = colorSystem.convertColorSpace(color, 'sRGB', 'Linear')
  const linear2 = colorSystem.convertColorSpace(color, 'sRGB', 'Linear')

  expect(linear1).toEqual(linear2) // Deterministic output
  expect(linear1.r).toBeCloseTo(0.214, 6) // Precision validation
})
```

#### Color Matrix Operations
```typescript
// Property-based testing for color matrix operations
it("color matrix multiplication maintains floating-point precision", () => {
  fc.assert(fc.property(
    colorArb, matrixArb,
    (color, matrix) => {
      const result1 = colorSystem.applyColorMatrix(color, matrix)
      const result2 = colorSystem.applyColorMatrix(color, matrix)
      return colorEquals(result1, result2)
    }
  ))
})
```

#### Library Token Management
```typescript
// Test library color token CRUD operations
it("color token operations maintain referential integrity", async () => {
  const token = await library.createColorToken({
    name: "brand-primary",
    color: { r: 1.0, g: 0.2, b: 0.4, colorSpace: 'sRGB' }
  })

  const retrieved = await library.getColorToken(token.id)
  expect(retrieved.color).toEqual(token.color)

  // Test version conflicts
  await expect(library.updateColorToken(token.id, { name: "updated" }))
    .resolves.toBeDefined()
})
```

### 2. Integration Tests (Library + Color Pipeline)
**Testcontainers**: PostgreSQL + Redis for library metadata, FFmpeg for media validation

#### Color Token Application
```typescript
it("color tokens apply consistently across compositions [integration]", async () => {
  // Setup test library with color tokens
  const library = await setupTestLibrary({
    tokens: [
      { name: "primary", color: { r: 1, g: 0, b: 0, colorSpace: 'sRGB' } },
      { name: "secondary", color: { r: 0, g: 1, b: 0, colorSpace: 'sRGB' } }
    ]
  })

  // Create composition with token references
  const scene = await createTestScene({
    layers: [
      { type: 'rectangle', fillColorToken: 'primary' },
      { type: 'text', fillColorToken: 'secondary' }
    ]
  })

  // Apply library to scene
  await scene.applyLibrary(library.id, library.version)

  // Verify tokens resolve correctly
  const evaluated = await scene.evaluate(0)
  expect(evaluated.layers[0].fillColor).toEqual(library.tokens[0].color)
})
```

#### Real-time Synchronization
```typescript
it("library color token updates sync in real-time [integration]", async () => {
  const library = await setupTestLibrary()
  const scene = await createTestScene()

  // Apply library to scene
  await scene.applyLibrary(library.id, library.version)

  // Update token in library
  const updateTime = Date.now()
  await library.updateColorToken('primary', {
    color: { r: 0, g: 1, b: 1, colorSpace: 'sRGB' }
  })

  // Verify scene updates within 16ms
  const syncTime = await measureSceneSyncTime(scene)
  expect(syncTime).toBeLessThan(16)
})
```

### 3. Golden Frame Tests (Visual Validation)
**Reference Validation**: ΔE < 1.0, SSIM > 0.98 across all GPU vendors
**Cross-platform**: NVIDIA, AMD, Intel, Apple Silicon validation

#### Color Space Accuracy
```typescript
test("sRGB color space maintains golden frame accuracy [golden-frame]", async () => {
  const scene = createComplexScene({
    layers: 50,
    colorEffects: ['gamma_correction', 'color_balance'],
    resolution: '1920x1080'
  })

  const renderedFrame = await renderer.renderFrame(scene, 30)
  const goldenFrame = await loadGoldenFrame('color/srgb_complex_frame_30')

  const comparison = compareGoldenFrame(renderedFrame, goldenFrame, {
    deltaEThreshold: 1.0,
    ssimThreshold: 0.98,
    alphaTolerance: 0.01
  })

  expect(comparison.passes).toBe(true)
  expect(comparison.maxDeltaE).toBeLessThan(1.0)
  expect(comparison.ssim).toBeGreaterThan(0.98)
})
```

#### Library Color Token Validation
```typescript
test("library color tokens maintain visual consistency [golden-frame]", async () => {
  // Create library with color tokens
  const library = await createLibraryWithTokens([
    { name: 'brand-blue', color: { r: 0.2, g: 0.4, b: 0.8, colorSpace: 'sRGB' } },
    { name: 'accent-orange', color: { r: 1.0, g: 0.6, b: 0.2, colorSpace: 'sRGB' } }
  ])

  // Create composition using tokens
  const scene = await createSceneWithTokenUsage({
    libraryId: library.id,
    tokenUsage: {
      'background': 'brand-blue',
      'highlight': 'accent-orange'
    }
  })

  const renderedFrame = await renderer.renderFrame(scene, 15)
  const goldenFrame = await loadGoldenFrame('color/library_tokens_frame_15')

  const comparison = compareGoldenFrame(renderedFrame, goldenFrame)
  expect(comparison.passes).toBe(true)
})
```

#### Cross-Platform GPU Validation
```typescript
test.each(gpuVendors)("color rendering consistent across GPU vendors", async (gpuVendor) => {
  const scene = createTestSceneWithColorEffects()
  const renderer = createRendererForVendor(gpuVendor)

  const renderedFrame = await renderer.renderFrame(scene, 30)
  const referenceFrame = await loadReferenceFrame('color', gpuVendor)

  const comparison = compareGoldenFrame(renderedFrame, referenceFrame)
  expect(comparison.passes).toBe(true)
})
```

### 4. E2E Tests (Workflow Validation)
**Playwright**: Critical user paths with semantic selectors

#### Library Color Workflow
```typescript
test("complete color token workflow from creation to export [e2e]", async ({ page }) => {
  // Navigate to library management
  await page.goto('/animator/libraries')

  // Create new color token
  await page.getByRole('button', { name: /create color token/i }).click()
  await page.getByLabel('Token Name').fill('brand-primary')
  await page.getByLabel('Red').fill('255')
  await page.getByLabel('Green').fill('102')
  await page.getByLabel('Blue').fill('204')
  await page.getByRole('button', { name: /create token/i }).click()

  // Create new composition
  await page.goto('/animator/compositions/new')

  // Apply color token to layer
  await page.getByRole('button', { name: /add layer/i }).click()
  await page.getByRole('button', { name: /rectangle/i }).click()
  await page.getByRole('button', { name: /fill color/i }).click()
  await page.getByRole('button', { name: /library tokens/i }).click()
  await page.getByText('brand-primary').click()

  // Verify real-time preview
  const previewUpdateTime = await measurePreviewUpdateTime(page)
  expect(previewUpdateTime).toBeLessThan(16)

  // Export and verify quality
  await page.getByRole('button', { name: /export/i }).click()
  await page.getByRole('button', { name: /prores 422/i }).click()

  const exportResult = await waitForExportCompletion()
  expect(exportResult.qualityScore).toBeGreaterThan(0.95)
})
```

#### Accessibility Integration
```typescript
test("color system respects accessibility preferences [e2e]", async ({ page }) => {
  await page.goto('/animator/preferences/accessibility')

  // Enable reduced motion
  await page.getByRole('checkbox', { name: /reduced motion/i }).check()

  // Enable high contrast
  await page.getByRole('checkbox', { name: /high contrast/i }).check()

  // Create composition with color tokens
  await page.goto('/animator/compositions/new')
  await addLayerWithColorTokens()

  // Verify accessibility compliance
  const contrastCheck = await checkColorContrast(page)
  expect(contrastCheck.meetsWCAG).toBe(true)

  // Verify reduced motion behavior
  const motionCheck = await checkReducedMotionBehavior(page)
  expect(motionCheck.respectsPreference).toBe(true)
})
```

### 5. Performance Tests (Real-time Requirements)
**k6**: API latency budgets, **Lighthouse CI**: UI performance budgets

#### Color Transformation Performance
```typescript
// Load test color transformations
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p95<16'], // Must be under 16ms for real-time
    http_req_failed: ['rate<0.1'],
  },
}

export default async function () {
  const response = await http.post('/api/v1/color/transform', {
    sceneId: 'test-scene',
    nodeIds: ['layer-1', 'layer-2'],
    transformation: {
      type: 'gamma_correction',
      gamma: 2.2
    }
  })

  check(response, {
    'status is 200': (r) => r.status === 200,
    'transformation time < 16ms': (r) => r.json().renderTimeMs < 16,
  })
}
```

#### Memory Usage Tests
```typescript
it("color system maintains memory efficiency [performance]", async () => {
  const initialMemory = await getGPUMemoryUsage()

  // Apply multiple color transformations
  for (let i = 0; i < 100; i++) {
    await colorSystem.applyColorMatrix(createTestColor(), createTestMatrix())
  }

  const finalMemory = await getGPUMemoryUsage()
  const memoryIncrease = finalMemory - initialMemory

  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // < 50MB increase
})
```

### 6. Mutation Tests (Deterministic Logic)
**Stryker**: ≥70% mutation score for color logic

#### Color Space Logic Mutations
```typescript
// Test that color space conversion logic is mutation-resistant
describe("color space conversion mutants", () => {
  const mutants = [
    "sRGB to Linear conversion",
    "gamma correction",
    "color matrix multiplication",
    "alpha channel preservation"
  ]

  mutants.forEach(mutant => {
    it(`survives ${mutant} mutation`, () => {
      const original = colorSystem.convertColorSpace(testColor, 'sRGB', 'Linear')
      const mutated = mutatedColorSystem.convertColorSpace(testColor, 'sRGB', 'Linear')

      // Mutation should be killed by test
      expect(mutated).not.toEqual(original)
    })
  })
})
```

### 7. Contract Tests (API Compliance)
**Pact**: Consumer-driven contract testing

#### Color API Consumer Tests
```typescript
describe("Color API Consumer", () => {
  beforeAll(async () => {
    await provider.setup()
    await consumer.setup()
  })

  it("converts color spaces correctly", async () => {
    await consumer
      .uponReceiving("a color space conversion request")
      .withRequest({
        method: "POST",
        path: "/color/convert",
        body: {
          color: { r: 0.5, g: 0.5, b: 0.5, colorSpace: "sRGB" },
          fromSpace: "sRGB",
          toSpace: "Linear"
        }
      })
      .willRespondWith({
        status: 200,
        body: {
          originalColor: expect.any(Object),
          convertedColor: expect.any(Object),
          accuracy: expect.any(Number)
        }
      })

    await consumer.runTest()
  })
})
```

### 8. Accessibility Tests (WCAG 2.1 AA Compliance)
**axe-core**: Automated accessibility testing

#### Color Contrast Validation
```typescript
test("color tokens meet accessibility contrast requirements [a11y]", async () => {
  const colorTokens = await library.getColorTokens()

  for (const token of colorTokens) {
    const contrastWhite = calculateContrastRatio(token.color, { r: 1, g: 1, b: 1 })
    const contrastBlack = calculateContrastRatio(token.color, { r: 0, g: 0, b: 0 })

    // WCAG 2.1 AA requirements
    expect(contrastWhite).toBeGreaterThanOrEqual(token.accessibility.largeText ? 3.0 : 4.5)
    expect(contrastBlack).toBeGreaterThanOrEqual(token.accessibility.largeText ? 3.0 : 4.5)
  }
})
```

#### Reduced Motion Support
```typescript
test("color transformations respect reduced motion preferences [a11y]", async () => {
  // Set reduced motion preference
  await setUserPreference('reducedMotion', true)

  const scene = createSceneWithAnimatedColors()
  const renderedFrame = await renderer.renderFrame(scene, 30)

  // Verify no motion-based color changes
  const motionAnalysis = analyzeMotionInFrame(renderedFrame)
  expect(motionAnalysis.hasColorAnimation).toBe(false)
})
```

## Test Data Strategy

### Fixtures & Factories

#### Color Test Fixtures
```typescript
// Professional color palettes for validation
export const PROFESSIONAL_COLORS = {
  pantone: [
    { name: 'Pantone 185 C', color: { r: 0.91, g: 0.13, b: 0.21, colorSpace: 'sRGB' } },
    { name: 'Pantone 285 C', color: { r: 0.0, g: 0.38, b: 0.63, colorSpace: 'sRGB' } }
  ],
  ral: [
    { name: 'RAL 3000', color: { r: 0.75, g: 0.19, b: 0.16, colorSpace: 'sRGB' } }
  ]
}

// Gradient and color chart fixtures
export const COLOR_CHARTS = {
  grayscale: createGrayscaleGradient(),
  colorChecker: createColorCheckerChart(),
  skinTones: createSkinTonePalette()
}
```

#### Library Test Fixtures
```typescript
export const TEST_LIBRARIES = {
  brandLibrary: {
    id: 'brand-colors-v1',
    version: '1.2.0',
    tokens: [
      { name: 'primary', color: { r: 0.2, g: 0.4, b: 0.8, colorSpace: 'sRGB' } },
      { name: 'secondary', color: { r: 0.9, g: 0.5, b: 0.2, colorSpace: 'sRGB' } }
    ],
    variables: {
      theme: { light: 'primary', dark: 'secondary' }
    }
  }
}
```

## Test Execution Strategy

### Parallel Execution
- **Unit tests**: Run in parallel across all CPU cores
- **Integration tests**: Use Testcontainers for isolated database instances
- **Golden frame tests**: Distribute across GPU test farm
- **E2E tests**: Run on multiple browser/device combinations

### Flake Management
- **Golden frame variance monitoring**: Track week-over-week SSIM/ΔE variance
- **GPU-specific quarantine**: Isolate flaky tests by GPU vendor
- **Automatic retry**: Smart retry logic for transient failures

### CI/CD Integration
```yaml
# GitHub Actions pipeline for color system
- name: Color System Tests
  runs-on: [self-hosted, gpu]
  strategy:
    matrix:
      gpu: [nvidia, amd, intel, apple]
  steps:
    - uses: actions/checkout@v4
    - name: Setup GPU Environment
      run: setup-gpu-environment ${{ matrix.gpu }}
    - name: Run Color Unit Tests
      run: npm run test:color:unit
    - name: Run Golden Frame Tests
      run: npm run test:color:golden-frame --gpu=${{ matrix.gpu }}
    - name: Upload Test Artifacts
      uses: actions/upload-artifact@v4
      with:
        name: color-test-results-${{ matrix.gpu }}
        path: test-results/
```

## Quality Gates

### Pre-merge Requirements (Tier 1)
- ✅ All unit tests pass (≥90% coverage)
- ✅ Mutation score ≥70%
- ✅ All golden frame tests pass (ΔE < 1.0, SSIM > 0.98)
- ✅ Cross-platform GPU validation (all vendors)
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Performance budgets met (≤16ms p95 response time)
- ✅ Contract tests pass (consumer + provider)

### Production Deployment
- ✅ Integration tests pass across all environments
- ✅ E2E smoke tests pass on production-like data
- ✅ Performance regression tests show <5% degradation
- ✅ Security scan passes (no color data leakage)
- ✅ Accessibility audit passes

This comprehensive test plan ensures the color system delivers deterministic, professional-grade color management with seamless library integration while maintaining the highest standards for motion graphics production.
