# Milestone 2: Scene Graph Foundation

## Overview
Implement the core scene graph data structure - the foundation that defines how all visual elements are organized, animated, and rendered in Animator.

## Goals
- ✅ Immutable scene graph with structural sharing
- ✅ Property system with animation curves
- ✅ Expression evaluation engine
- ✅ Basic node types (transform, shape, text, media)

## Implementation Plan

### Phase 2.1: Scene Graph Data Structure
**Duration**: 3-4 days

**Tasks:**
1. **Core Data Types**
   - Define `SceneNode` base trait and implementations
   - Implement immutable scene graph with structural sharing
   - Add node hierarchy management (parent/child relationships)

2. **Node Type System**
   ```rust
   pub enum SceneNode {
       Transform(TransformNode),
       Shape(ShapeNode),
       Text(TextNode),
       Media(MediaNode),
       Effect(EffectNode),
       Group(GroupNode),
   }
   ```

3. **Graph Operations**
   - Topological sorting for evaluation order
   - Dependency tracking for invalidation
   - Efficient traversal and querying

### Phase 2.2: Property System
**Duration**: 2-3 days

**Tasks:**
1. **Property Definitions**
   - Type-safe property system with validation
   - Property inheritance and overriding
   - Dynamic property binding

2. **Animation System**
   - Keyframe storage and interpolation
   - Animation curve evaluation (linear, bezier, stepped)
   - Time-based property sampling

3. **Expression Engine**
   - JavaScript/TypeScript expression evaluation
   - Dependency tracking for reactive updates
   - Sandboxed execution environment

### Phase 2.3: Node Implementations
**Duration**: 4-5 days

**Tasks:**
1. **TransformNode**
   - Position, rotation, scale, anchor point
   - Transform matrix computation
   - Hierarchical transformation

2. **ShapeNode**
   - Vector path representation
   - Fill and stroke properties
   - Boolean operations (union, subtract, intersect)

3. **TextNode**
   - Typography with font management
   - Text layout and measurement
   - Rich text formatting

4. **MediaNode**
   - Image and video reference handling
   - Time remapping capabilities
   - Asset loading and caching

### Phase 2.4: Evaluation Engine
**Duration**: 2-3 days

**Tasks:**
1. **Scene Evaluation**
   - Time-based scene sampling
   - Property value computation
   - Expression evaluation pipeline

2. **Invalidation System**
   - Fine-grained dirty tracking
   - Efficient update propagation
   - Minimal recomputation on changes

3. **Performance Optimization**
   - Memoization of expensive computations
   - Parallel evaluation where possible
   - Memory-efficient data structures

## Success Criteria

### Functional Requirements
- [ ] Scene graph can represent basic compositions
- [ ] Properties can be animated with keyframes
- [ ] Expressions evaluate correctly and update reactively
- [ ] Node hierarchy and transforms work correctly

### Performance Requirements
- [ ] Scene evaluation < 16ms for typical compositions
- [ ] Memory usage scales linearly with scene complexity
- [ ] Property updates propagate efficiently

### Quality Requirements
- [ ] All node types have comprehensive unit tests
- [ ] Property system handles edge cases correctly
- [ ] Expression evaluation is deterministic
- [ ] Scene serialization/deserialization works

## Technical Specifications

### Core Interfaces
```rust
pub trait SceneNode {
    fn node_type(&self) -> NodeType;
    fn properties(&self) -> &PropertyMap;
    fn evaluate(&self, time: f64, context: &EvaluationContext) -> NodeOutput;
    fn dependencies(&self) -> Vec<NodeId>;
}

pub struct EvaluationContext {
    pub time: f64,
    pub frame_rate: f64,
    pub resolution: (u32, u32),
    pub global_properties: PropertyMap,
}
```

### Memory Layout
- **Structure of Arrays**: Properties stored separately for cache efficiency
- **Immutable Updates**: Copy-on-write for efficient state management
- **Rc/Arc Usage**: Shared ownership for node references

### Expression System
```typescript
interface ExpressionContext {
  time: number;
  node: SceneNode;
  properties: PropertyMap;
  globals: PropertyMap;
}

type Expression = (context: ExpressionContext) => any;
```

## Testing Strategy

### Unit Tests
- Property evaluation with various interpolation modes
- Node hierarchy and transform calculations
- Expression parsing and evaluation
- Scene graph serialization

### Property-Based Tests
- Random scene graph generation and evaluation
- Property animation with various keyframe patterns
- Expression evaluation with dependency chains

### Integration Tests
- Complete scene evaluation with multiple node types
- Animation playback with time scrubbing
- Expression reactivity to property changes

## Risk Assessment

### Technical Risks
- **Performance**: Scene evaluation may be too slow for complex scenes
  - **Mitigation**: Profile early, optimize hot paths, add caching layers

- **Memory Management**: Large scene graphs may consume excessive memory
  - **Mitigation**: Implement memory pools, add size limits, monitor usage

- **Expression Complexity**: Complex expressions may be difficult to debug
  - **Mitigation**: Add expression debugging tools, clear error messages

### Timeline Risks
- **Interdependency**: Issues in property system may block node implementation
  - **Mitigation**: Build property system first, use mock implementations for early testing

## Next Milestone Dependencies
- Milestone 3 (Basic Rendering) requires scene graph evaluation
- Timeline system needs property animation capabilities
- Collaboration features depend on serializable scene structure

## Deliverables
- [ ] Complete scene graph implementation with all core node types
- [ ] Property system with animation and expression support
- [ ] Evaluation engine with performance optimizations
- [ ] Comprehensive test suite with >90% coverage
- [ ] Performance benchmarks and optimization guidelines
