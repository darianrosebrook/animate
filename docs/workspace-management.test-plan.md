# Workspace Management — Test Plan (CAWS-Compliant)

This document outlines the comprehensive testing strategy for the Workspace Management system, ensuring deterministic behavior, performance, and reliability for hierarchical project organization.

---

## 0) Testing Philosophy & Approach

### **Test-Driven Development**
- **Behavior-Driven Tests**: Tests written before implementation using Gherkin syntax
- **Property-Based Testing**: Fast-check for edge cases and invariants
- **Golden Frame Testing**: Visual validation of UI components and interactions
- **Mutation Testing**: Ensure test coverage catches behavioral changes

### **Test Categories**
- **Unit Tests**: Pure functions, data transformations, business logic
- **Integration Tests**: Component interactions, API endpoints, database operations
- **Contract Tests**: API consumer/provider verification
- **E2E Tests**: Complete user workflows and scenarios
- **Performance Tests**: Load testing, stress testing, benchmarking
- **Accessibility Tests**: WCAG 2.1 AA compliance validation

### **Test Data Strategy**
- **Factories**: Deterministic test data generation with seeded randomness
- **Fixtures**: Real-world scenarios with anonymized production-like data
- **Golden Datasets**: Reference data for visual and behavioral validation
- **Edge Cases**: Boundary conditions, error states, concurrent operations

---

## 1) Unit Testing Strategy

### **Core Business Logic**
```typescript
// Property-based test for hierarchical integrity
it("maintains hierarchical integrity invariant [INV: Hierarchical Integrity]", () => {
  fc.assert(fc.property(
    fc.array(fc.record({
      id: fc.string(),
      parentId: fc.option(fc.string()),
      type: fc.constantFrom('workspace', 'project', 'file')
    })),
    (entities) => {
      // Verify no orphaned files or projects
      const files = entities.filter(e => e.type === 'file');
      const projects = entities.filter(e => e.type === 'project');
      const workspaces = entities.filter(e => e.type === 'workspace');

      files.forEach(file => {
        expect(projects.some(p => p.id === file.parentId)).toBe(true);
      });

      projects.forEach(project => {
        expect(workspaces.some(w => w.id === project.parentId)).toBe(true);
      });

      return true;
    }
  ));
});

// Metadata validation tests
it("enforces metadata consistency [INV: Metadata Consistency]", () => {
  const validMetadata = {
    name: "Test Workspace",
    createdAt: new Date("2025-01-01"),
    tags: ["test", "workspace"]
  };

  // Valid metadata should pass
  expect(() => validateMetadata(validMetadata)).not.toThrow();

  // Invalid metadata should fail
  expect(() => validateMetadata({...validMetadata, createdAt: "invalid"}))
    .toThrow(MetadataValidationError);
});
```

### **Permission System**
```typescript
// Permission inheritance tests
it("correctly inherits permissions [INV: Permission Inheritance]", () => {
  const workspace = createWorkspace({
    permissions: { allowPublicLinks: false }
  });

  const project = createProject({
    workspaceId: workspace.id,
    permissions: {} // Inherits from workspace
  });

  const file = createFile({
    projectId: project.id,
    permissions: { requireApproval: true } // Override
  });

  expect(file.permissions.allowPublicLinks).toBe(false); // Inherited
  expect(file.permissions.requireApproval).toBe(true); // Overridden
});
```

### **CRUD Operations**
```typescript
// Deterministic ID generation
it("generates stable IDs [INV: Deterministic IDs]", () => {
  const workspace1 = createWorkspace({ name: "Test" }, fixedClock("2025-01-01"));
  const workspace2 = createWorkspace({ name: "Test" }, fixedClock("2025-01-01"));

  expect(workspace1.id).toBe(workspace2.id); // Same seed = same ID
});

// Audit trail validation
it("logs all operations with context [INV: Audit Trail]", () => {
  const user = { id: "user_123", name: "Alice" };
  const workspace = createWorkspace({ name: "Test" }, user);

  const auditLog = getAuditLog(workspace.id);
  expect(auditLog).toContainEqual({
    operation: "create",
    entityType: "workspace",
    entityId: workspace.id,
    userId: user.id,
    timestamp: expect.any(Date),
    context: { userAgent: "test", ip: "127.0.0.1" }
  });
});
```

---

## 2) Integration Testing Strategy

### **API Integration**
```typescript
// Workspace API integration
describe("Workspace API Integration", () => {
  let db: TestDatabase;
  let apiClient: WorkspaceAPI;

  beforeEach(async () => {
    db = await setupTestDatabase();
    apiClient = createAPIClient();
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it("creates workspace and propagates to project creation", async () => {
    const workspace = await apiClient.createWorkspace({
      name: "Brand Projects",
      description: "Animation projects for Brand X"
    });

    const project = await apiClient.createProject(workspace.id, {
      name: "Holiday Campaign"
    });

    expect(project.workspaceId).toBe(workspace.id);

    // Verify database consistency
    const dbWorkspace = await db.getWorkspace(workspace.id);
    const dbProject = await db.getProject(project.id);

    expect(dbWorkspace).toBeDefined();
    expect(dbProject.workspaceId).toBe(workspace.id);
  });
});
```

### **Search Integration**
```typescript
// Full-text search integration
describe("Search Integration", () => {
  it("indexes and searches across all entity types", async () => {
    // Create test data
    const workspace = await apiClient.createWorkspace({
      name: "Brand Projects",
      description: "Animation projects for holiday season"
    });

    const project = await apiClient.createProject(workspace.id, {
      name: "Holiday Campaign 2025",
      tags: ["holiday", "campaign", "2025"]
    });

    const file = await apiClient.createFile(project.id, {
      name: "hero-animation-v2.anim",
      metadata: { version: "2.0", approved: true }
    });

    // Test search functionality
    const results = await apiClient.search("holiday");

    expect(results).toContainEqual(
      expect.objectContaining({
        id: project.id,
        type: "project",
        relevance: expect.any(Number)
      })
    );

    expect(results).toContainEqual(
      expect.objectContaining({
        id: workspace.id,
        type: "workspace",
        relevance: expect.any(Number)
      })
    );
  });
});
```

### **Collaboration Integration**
```typescript
// Real-time collaboration integration
describe("Collaboration Integration", () => {
  it("resolves concurrent edits via operational transformation", async () => {
    const file = await apiClient.createFile(projectId, {
      name: "test-file.anim",
      content: "initial content"
    });

    // Simulate concurrent edits
    const user1Edit = { operation: "insert", position: 0, text: "User1: " };
    const user2Edit = { operation: "insert", position: 0, text: "User2: " };

    const result1 = await apiClient.applyEdit(file.id, user1Edit, "user1");
    const result2 = await apiClient.applyEdit(file.id, user2Edit, "user2");

    // Verify operational transformation
    expect(result1.content).toContain("User1:");
    expect(result2.content).toContain("User2:");

    // Both edits should be preserved
    const finalContent = await apiClient.getFileContent(file.id);
    expect(finalContent).toContain("User1:");
    expect(finalContent).toContain("User2:");
  });
});
```

---

## 3) Contract Testing Strategy

### **API Contract Tests**
```typescript
// Workspace API consumer contract
describe("Workspace API Consumer Contract", () => {
  const pact = new Pact({
    consumer: "WorkspaceUI",
    provider: "WorkspaceAPI"
  });

  beforeEach(() => pact.setup());
  afterEach(() => pact.cleanup());

  it("creates workspace successfully", async () => {
    await pact
      .given("no existing workspaces")
      .uponReceiving("a request to create a workspace")
      .withRequest({
        method: "POST",
        path: "/api/v1/workspaces",
        headers: { "Content-Type": "application/json" },
        body: {
          name: "Test Workspace",
          description: "A test workspace"
        }
      })
      .willRespondWith({
        status: 201,
        headers: { "Content-Type": "application/json" },
        body: {
          id: like("workspace_123"),
          name: "Test Workspace",
          description: "A test workspace",
          createdAt: like("2025-01-01T00:00:00Z")
        }
      });

    await pact.verify();
  });
});

// API Provider verification
describe("Workspace API Provider Contract", () => {
  it("implements workspace creation endpoint", async () => {
    const app = createAPIProvider();

    // Provider states
    const providerStates = {
      "no existing workspaces": () => {
        // Clear all workspaces from test database
      },
      "workspace exists": (parameters) => {
        // Create workspace with given parameters
      }
    };

    await providerVerification({
      provider: "WorkspaceAPI",
      providerBaseUrl: app.baseUrl,
      pactUrls: ["./pacts/workspace-ui-workspace-api.json"]
    });
  });
});
```

---

## 4) End-to-End Testing Strategy

### **Critical User Journeys**
```typescript
// Complete workspace creation workflow
test("creates workspace with project and file [E2E]", async ({ page }) => {
  await page.goto("/");

  // Create workspace
  await page.click('[data-testid="create-workspace"]');
  await page.fill('[data-testid="workspace-name"]', "Brand Projects");
  await page.fill('[data-testid="workspace-description"]', "Animation projects");
  await page.click('[data-testid="create-workspace-submit"]');

  // Verify workspace created
  await expect(page.locator('[data-testid="workspace-title"]'))
    .toContainText("Brand Projects");

  // Create project within workspace
  await page.click('[data-testid="create-project"]');
  await page.fill('[data-testid="project-name"]', "Holiday Campaign");
  await page.click('[data-testid="create-project-submit"]');

  // Verify project created and breadcrumb navigation
  await expect(page.locator('[data-testid="project-title"]'))
    .toContainText("Holiday Campaign");

  await expect(page.locator('[data-testid="breadcrumb"]'))
    .toContainText("Workspaces > Brand Projects > Holiday Campaign");

  // Create file within project
  await page.click('[data-testid="create-file"]');
  await page.selectOption('[data-testid="file-type"]', "scene");
  await page.fill('[data-testid="file-name"]', "hero-animation.anim");
  await page.click('[data-testid="create-file-submit"]');

  // Verify complete hierarchy
  await expect(page.locator('[data-testid="file-name"]'))
    .toContainText("hero-animation.anim");

  // Test navigation
  await page.click('[data-testid="breadcrumb-workspace"]');
  await expect(page.locator('[data-testid="workspace-view"]')).toBeVisible();

  await page.click('[data-testid="breadcrumb-project"]');
  await expect(page.locator('[data-testid="project-view"]')).toBeVisible();
});

// Bulk operations workflow
test("performs bulk file operations [E2E]", async ({ page }) => {
  // Setup: Create workspace with multiple files
  await createTestWorkspaceWithFiles(page, {
    workspace: "Test Workspace",
    projects: ["Project A", "Project B"],
    filesPerProject: 10
  });

  // Select multiple files
  await page.click('[data-testid="select-all-files"]');
  await expect(page.locator('[data-testid="selected-count"]'))
    .toContainText("20 files selected");

  // Bulk move operation
  await page.click('[data-testid="bulk-move"]');
  await page.selectOption('[data-testid="target-project"]', "Project B");
  await page.click('[data-testid="confirm-move"]');

  // Verify move completed
  await expect(page.locator('[data-testid="project-a-file-count"]'))
    .toContainText("0 files");
  await expect(page.locator('[data-testid="project-b-file-count"]'))
    .toContainText("20 files");
});
```

### **Performance Scenarios**
```typescript
// Large workspace performance
test("handles large workspace efficiently [E2E:PERF]", async ({ page }) => {
  await createLargeWorkspace(page, {
    projects: 50,
    filesPerProject: 20,
    collaborators: 10
  });

  const startTime = Date.now();

  // Navigate through hierarchy
  await page.goto("/workspaces/large-workspace/projects");
  await page.click('[data-testid="first-project"]');

  const navigationTime = Date.now() - startTime;
  expect(navigationTime).toBeLessThan(2000); // 2s requirement

  // Search performance
  const searchStart = Date.now();
  await page.fill('[data-testid="search-input"]', "animation");
  await page.waitForSelector('[data-testid="search-results"]');

  const searchTime = Date.now() - searchStart;
  expect(searchTime).toBeLessThan(200); // 200ms requirement

  // Memory usage validation
  const memoryUsage = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
  expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB limit
});
```

---

## 5) Accessibility Testing Strategy

### **Keyboard Navigation**
```typescript
test("supports complete keyboard navigation [A11Y]", async ({ page }) => {
  await page.goto("/workspaces");

  // Tab navigation through workspace list
  await page.keyboard.press("Tab");
  await expect(page.locator('[data-testid="first-workspace"]')).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.locator('[data-testid="create-workspace"]')).toBeFocused();

  // Arrow key navigation within workspace
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-testid="second-workspace"]')).toBeFocused();

  // Enter to navigate into workspace
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-testid="workspace-view"]')).toBeVisible();

  // Escape to go back
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-testid="workspace-list"]')).toBeVisible();
});
```

### **Screen Reader Support**
```typescript
test("provides proper screen reader support [A11Y]", async ({ page }) => {
  await page.goto("/workspaces/test-workspace/projects/test-project");

  // Verify ARIA labels
  await expect(page.locator('[data-testid="breadcrumb"]'))
    .toHaveAttribute("aria-label", "Navigation breadcrumb");

  await expect(page.locator('[data-testid="file-list"]'))
    .toHaveAttribute("aria-label", "Files in project");

  // Test live regions for dynamic content
  await page.click('[data-testid="create-file"]');
  await expect(page.locator('[data-testid="status-announcement"]'))
    .toContainText("File created successfully");
});
```

---

## 6) Performance Testing Strategy

### **Load Testing**
```typescript
// Concurrent user load testing
describe("Load Testing", () => {
  it("handles 100 concurrent users creating workspaces", async () => {
    const users = Array.from({ length: 100 }, (_, i) => `user_${i}`);
    const promises = users.map(user =>
      apiClient.createWorkspace({
        name: `Workspace ${user}`,
        createdBy: user
      })
    );

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();

    expect(results).toHaveLength(100);
    expect(endTime - startTime).toBeLessThan(5000); // 5s for 100 operations

    // Verify no data corruption
    const workspaces = await apiClient.listWorkspaces();
    expect(workspaces).toHaveLength(100);
  });
});

// Memory leak testing
describe("Memory Testing", () => {
  it("does not leak memory during extended operations", async () => {
    const initialMemory = await getMemoryUsage();

    // Perform many operations
    for (let i = 0; i < 1000; i++) {
      await apiClient.createFile(projectId, {
        name: `file_${i}.anim`
      });
      if (i % 100 === 0) {
        await apiClient.deleteFile(projectId, `file_${i - 100}.anim`);
      }
    }

    // Force garbage collection if available
    if (global.gc) global.gc();

    const finalMemory = await getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB increase limit
  });
});
```

---

## 7) Security Testing Strategy

### **Permission Testing**
```typescript
// Permission bypass testing
describe("Security Testing", () => {
  it("prevents unauthorized file access", async () => {
    const workspace = await apiClient.createWorkspace({
      name: "Private Workspace",
      visibility: "private"
    });

    const project = await apiClient.createProject(workspace.id, {
      name: "Private Project"
    });

    const file = await apiClient.createFile(project.id, {
      name: "secret-file.anim"
    });

    // User without permissions
    const unauthorizedUser = { id: "hacker", token: "invalid" };

    await expect(
      apiClient.getFile(project.id, file.id, unauthorizedUser)
    ).rejects.toThrow(UnauthorizedError);

    await expect(
      apiClient.updateFile(project.id, file.id, { name: "hacked" }, unauthorizedUser)
    ).rejects.toThrow(UnauthorizedError);
  });

  // Input sanitization
  it("prevents injection attacks", async () => {
    const maliciousInput = {
      name: "Test'; DROP TABLE workspaces; --",
      description: "<script>alert('xss')</script>"
    };

    const workspace = await apiClient.createWorkspace(maliciousInput);

    // Verify input was sanitized
    expect(workspace.name).not.toContain("DROP TABLE");
    expect(workspace.description).not.toContain("<script>");

    // Verify database integrity
    const workspaces = await apiClient.listWorkspaces();
    expect(workspaces.length).toBeGreaterThan(0);
  });
});
```

---

## 8) Test Data Management

### **Factory Functions**
```typescript
// Deterministic workspace factory
export const createTestWorkspace = (overrides: Partial<Workspace> = {}): Workspace => {
  const seed = overrides.name || "Test Workspace";
  const hash = createHash(seed);

  return {
    id: `workspace_${hash}`,
    name: overrides.name || "Test Workspace",
    description: overrides.description || "Test workspace description",
    visibility: overrides.visibility || "team",
    createdAt: overrides.createdAt || new Date("2025-01-01T00:00:00Z"),
    modifiedAt: overrides.modifiedAt || new Date("2025-01-01T00:00:00Z"),
    createdBy: overrides.createdBy || "user_test",
    lastModifiedBy: overrides.lastModifiedBy || "user_test",
    tags: overrides.tags || ["test"],
    customProperties: overrides.customProperties || {},
    statistics: overrides.statistics || {
      totalProjects: 0,
      totalFiles: 0,
      totalSize: "0B",
      activeCollaborators: 0
    },
    settings: overrides.settings || {
      defaultFileType: "scene",
      autoSave: true,
      versionRetention: "30days",
      permissions: {
        allowPublicLinks: false,
        requireApprovalForDeletion: true
      }
    },
    collaboration: overrides.collaboration || {
      owners: ["user_test"],
      admins: [],
      editors: [],
      viewers: [],
      pendingInvites: []
    },
    ...overrides
  };
};
```

### **Test Database Setup**
```typescript
// Test database with realistic data
export const setupTestDatabase = async (): Promise<TestDatabase> => {
  const db = new TestDatabase();

  // Create realistic test data
  const workspaces = await createWorkspaces(db, {
    count: 10,
    projectsPerWorkspace: { min: 2, max: 8 },
    filesPerProject: { min: 5, max: 20 },
    collaborators: { min: 1, max: 5 }
  });

  // Index for search
  await db.rebuildSearchIndex();

  return db;
};
```

---

## 9) Test Execution & CI/CD

### **Test Organization**
```
tests/
├── unit/
│   ├── workspace/
│   ├── project/
│   ├── file/
│   ├── metadata/
│   ├── permissions/
│   └── search/
├── integration/
│   ├── api/
│   ├── database/
│   └── collaboration/
├── contract/
│   ├── workspace-api/
│   └── file-api/
├── e2e/
│   ├── workflows/
│   ├── performance/
│   └── accessibility/
├── performance/
│   ├── load/
│   └── memory/
└── security/
    ├── permissions/
    └── injection/
```

### **CI/CD Pipeline Integration**
```yaml
# GitHub Actions workflow
name: Workspace Management Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - run: npm run test:mutation

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:16, ports: ["5432:5432"] }
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:e2e

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:performance

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:security
```

---

## 10) Quality Gates & Metrics

### **Coverage Requirements**
- **Unit Tests**: > 90% branch coverage for core logic
- **Integration Tests**: > 80% API endpoint coverage
- **E2E Tests**: All critical user journeys covered
- **Mutation Score**: > 70% for business logic

### **Performance Benchmarks**
- **Search Response**: p95 < 200ms for typical queries
- **Navigation**: p95 < 100ms for hierarchy traversal
- **File Operations**: p95 < 500ms for create/update/delete
- **Memory Usage**: < 100MB increase during extended operations

### **Quality Metrics**
- **Test Stability**: < 0.1% flake rate (tests that intermittently fail)
- **Test Speed**: Unit tests < 30s, Integration < 5min, E2E < 15min
- **False Positive Rate**: < 1% for security and permission tests

---

## 11) Test Maintenance & Evolution

### **Test Refactoring**
- **Regular Review**: Quarterly review of test effectiveness
- **Flake Management**: Automatic quarantine of flaky tests with 24h expiry
- **Test Debt Tracking**: Maintain test-to-code ratio and coverage trends
- **Performance Monitoring**: Track test execution time and resource usage

### **Test Data Evolution**
- **Golden Dataset Updates**: Regular refresh of test fixtures
- **Edge Case Expansion**: Continuous addition of new edge cases
- **Performance Scenario Updates**: Update based on production usage patterns

### **Automation & Tooling**
- **Test Generation**: AI-assisted test case generation
- **Visual Regression**: Screenshot testing for UI components
- **API Testing**: Automatic contract testing from OpenAPI specs
- **Load Testing**: Automated performance regression detection

---

## 12) Success Criteria

✅ **All invariants verified** through comprehensive test suite
✅ **Performance requirements met** under realistic load conditions
✅ **Security vulnerabilities prevented** through thorough testing
✅ **Accessibility standards achieved** with comprehensive a11y testing
✅ **User workflows validated** through complete E2E test coverage
✅ **Edge cases handled** through property-based and boundary testing
✅ **Regression prevention** through automated test execution
✅ **Quality metrics maintained** within acceptable thresholds

---

This test plan ensures the Workspace Management system meets **enterprise-grade quality standards** while maintaining the **creative workflow efficiency** that animators require. The comprehensive testing strategy covers all aspects from unit-level business logic to full-system performance and security validation.
