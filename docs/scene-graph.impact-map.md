# Scene Graph and Timeline System - Change Impact Map

## Module Impact Assessment

### Core Modules Affected
| Module | Impact Level | Description | Migration Required |
|--------|--------------|-------------|-------------------|
| **evaluator** | **HIGH** | Complete rewrite of evaluation engine | ✅ Major migration |
| **scene-graph** | **HIGH** | New data structures and algorithms | ✅ Schema migration |
| **timeline** | **HIGH** | New time-based evaluation system | ✅ Behavior migration |
| **render** | **MEDIUM** | Integration with new evaluation pipeline | ✅ API adaptation |
| **ui-components** | **MEDIUM** | Timeline and canvas updates | ✅ Component updates |
| **storage** | **LOW** | New database schema | ✅ Schema migration |
| **exporter** | **LOW** | Frame access pattern changes | ✅ Minor adaptation |

### Data Migration Strategy

#### Phase 1: Schema Migration (Database)
```sql
-- Migration: Create new scene graph tables
CREATE TABLE scene_graph_nodes (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    transform_data JSONB NOT NULL,
    properties JSONB DEFAULT '{}',
    parent_id UUID REFERENCES scene_graph_nodes(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE keyframes (
    id UUID PRIMARY KEY,
    node_id UUID NOT NULL REFERENCES scene_graph_nodes(id),
    property_name VARCHAR(100) NOT NULL,
    time_ms INTEGER NOT NULL,
    value JSONB NOT NULL,
    easing_type VARCHAR(50) DEFAULT 'linear',
    easing_params JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE timeline_tracks (
    id UUID PRIMARY KEY,
    scene_id UUID NOT NULL REFERENCES scene_graph_nodes(id),
    track_type VARCHAR(50) NOT NULL,
    duration_ms INTEGER NOT NULL,
    playback_rate DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration: Migrate existing timeline data
INSERT INTO scene_graph_nodes (id, project_id, node_type, transform_data, properties)
SELECT
    id,
    project_id,
    'composition',
    '{"x": 0, "y": 0, "scale": 1, "rotation": 0}'::jsonb,
    row_to_json(timeline_data)::jsonb
FROM existing_timelines;
```

#### Phase 2: Data Transformation
```typescript
// Migration function: Transform legacy timeline to scene graph
async function migrateTimelineToSceneGraph(legacyTimeline: LegacyTimeline): Promise<SceneNode> {
  const compositionNode = createSceneNode({
    type: 'composition',
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    properties: new Map()
  });

  // Migrate layers to nodes
  for (const layer of legacyTimeline.layers) {
    const layerNode = createSceneNode({
      type: layer.type,
      transform: layer.transform,
      properties: migrateProperties(layer.properties)
    });

    compositionNode.addChild(layerNode);

    // Migrate keyframes
    for (const keyframe of layer.keyframes) {
      layerNode.properties.get(keyframe.property)?.addKeyframe({
        time: keyframe.time,
        value: keyframe.value,
        easing: keyframe.easing
      });
    }
  }

  return compositionNode;
}
```

#### Phase 3: Rollback Strategy
```typescript
// Feature flag for safe rollback
const FEATURE_SCENE_GRAPH_ENABLED = process.env.FEATURE_SCENE_GRAPH_ENABLED === 'true';

// Rollback function
async function rollbackToLegacyTimeline(sceneGraph: SceneNode): Promise<LegacyTimeline> {
  if (!FEATURE_SCENE_GRAPH_ENABLED) {
    throw new Error('Cannot rollback: feature flag disabled');
  }

  const legacyTimeline: LegacyTimeline = {
    id: generateId(),
    layers: []
  };

  // Convert nodes back to layers
  for (const node of sceneGraph.children) {
    const layer = convertNodeToLayer(node);
    legacyTimeline.layers.push(layer);
  }

  return legacyTimeline;
}
```

## Roll-forward Strategy

### Gradual Rollout Plan
1. **Week 1**: Enable for internal testing only
2. **Week 2**: Enable for beta users (10% of user base)
3. **Week 3**: Enable for 50% of users with feature flag
4. **Week 4**: Full rollout with monitoring
5. **Week 5**: Remove legacy code paths

### Monitoring and Validation
```typescript
// Rollout monitoring
const rolloutMonitor = {
  track: (event: string, properties: Record<string, any>) => {
    analytics.track(`scene_graph_${event}`, {
      userId: currentUser.id,
      sceneComplexity: calculateComplexity(sceneGraph),
      performance: measurePerformance(),
      ...properties
    });
  },

  validate: (sceneGraph: SceneNode) => {
    const issues = [];

    if (!isDAG(sceneGraph)) {
      issues.push('Circular dependency detected');
    }

    if (calculateComplexity(sceneGraph) > 1000) {
      issues.push('Scene complexity too high for current rollout phase');
    }

    if (issues.length > 0) {
      throw new RolloutValidationError(issues);
    }
  }
};
```

## Rollback Strategy

### Immediate Rollback Triggers
- **Performance degradation**: Frame time > 50ms for 1 minute
- **Error rate**: >5% evaluation errors in 5-minute window
- **Memory usage**: >90% of available memory sustained
- **User reports**: >10 crash reports in 1 hour

### Automated Rollback Process
```typescript
class RollbackManager {
  private readonly rollbackThresholds = {
    errorRate: 0.05,      // 5% error rate
    frameTime: 50,        // 50ms frame time
    memoryUsage: 0.9,     // 90% memory usage
    crashReports: 10      // 10 crashes per hour
  };

  async checkAndRollback(): Promise<void> {
    const metrics = await this.collectMetrics();

    if (this.shouldRollback(metrics)) {
      await this.executeRollback();
      await this.notifyTeam('Automated rollback executed');
    }
  }

  private shouldRollback(metrics: SystemMetrics): boolean {
    return (
      metrics.errorRate > this.rollbackThresholds.errorRate ||
      metrics.avgFrameTime > this.rollbackThresholds.frameTime ||
      metrics.memoryUsage > this.rollbackThresholds.memoryUsage ||
      metrics.crashReports > this.rollbackThresholds.crashReports
    );
  }

  private async executeRollback(): Promise<void> {
    // Set feature flag to false
    await this.setFeatureFlag('SCENE_GRAPH_ENABLED', false);

    // Migrate active scenes back to legacy format
    const activeScenes = await this.getActiveScenes();
    for (const scene of activeScenes) {
      const legacyTimeline = await rollbackToLegacyTimeline(scene);
      await this.saveLegacyTimeline(legacyTimeline);
    }

    // Restart affected services
    await this.restartServices(['timeline-service', 'render-service']);
  }
}
```

## Data Safety Measures

### Pre-Migration Validation
```typescript
async function validateMigrationSafety(legacyTimeline: LegacyTimeline): Promise<ValidationResult> {
  const issues: string[] = [];

  // Check for unsupported features
  if (hasNestedCompositions(legacyTimeline)) {
    issues.push('Nested compositions not yet supported in scene graph');
  }

  if (hasAdvancedExpressions(legacyTimeline)) {
    issues.push('Advanced expressions require expression engine');
  }

  // Check complexity limits
  const complexity = calculateTimelineComplexity(legacyTimeline);
  if (complexity > MIGRATION_COMPLEXITY_LIMIT) {
    issues.push(`Timeline too complex: ${complexity} > ${MIGRATION_COMPLEXITY_LIMIT}`);
  }

  return {
    canMigrate: issues.length === 0,
    issues,
    complexity
  };
}
```

### Migration Testing Strategy
```typescript
describe('Migration Safety', () => {
  test('round-trip migration preserves data', async () => {
    const originalTimeline = createComplexTimeline();
    const sceneGraph = await migrateTimelineToSceneGraph(originalTimeline);
    const migratedBack = await rollbackToLegacyTimeline(sceneGraph);

    expect(deepEqual(originalTimeline, migratedBack)).toBe(true);
  });

  test('migration handles edge cases gracefully', async () => {
    const edgeCaseTimeline = createEdgeCaseTimeline();
    const result = await validateMigrationSafety(edgeCaseTimeline);

    expect(result.canMigrate).toBe(false);
    expect(result.issues).toContain('Unsupported feature detected');
  });

  test('migration respects complexity limits', async () => {
    const complexTimeline = createVeryComplexTimeline();
    const result = await validateMigrationSafety(complexTimeline);

    expect(result.canMigrate).toBe(false);
    expect(result.issues).toContain('Timeline too complex');
  });
});
```

## Communication Strategy

### User Communication
```markdown
# Scene Graph Migration Notice

## What Changed
- Timeline system upgraded to scene graph architecture
- Improved performance for complex animations
- Better collaboration features coming soon

## What to Expect
- Smoother timeline scrubbing
- More reliable rendering
- Better memory management

## Rollback Available
If you experience issues, the system will automatically roll back to the previous version.

## Report Issues
Use the in-app feedback tool or contact support@animator.com
```

### Team Communication
- **Daily standups**: Migration progress and issues
- **Migration war room**: Dedicated channel for migration issues
- **Status dashboard**: Real-time migration metrics
- **Post-mortem reviews**: After each migration phase

## Success Metrics

### Technical Metrics
- **Migration success rate**: >99% of timelines migrate successfully
- **Performance improvement**: >30% reduction in frame evaluation time
- **Memory reduction**: >25% reduction in memory usage
- **Error rate**: <1% increase in user-facing errors

### User Experience Metrics
- **User satisfaction**: NPS score > 7 during migration
- **Usage retention**: <5% drop in daily active users
- **Support tickets**: <50% increase in support volume
- **Feature adoption**: >80% of users use new features within 30 days
