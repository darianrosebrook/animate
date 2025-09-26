/**
 * @fileoverview Scene Graph Module Exports
 * @author @darianrosebrook
 */

// Core scene graph
export { SceneGraph } from './scene-graph'

// Node implementations
export {
  TransformNode,
  createTransformNode,
  createTransformNodeWithDefaults,
} from './nodes/transform-node'
export {
  ShapeNode,
  ShapeType,
  createShapeNode,
  createRectangleNode,
  createCircleNode,
  createPathNode,
} from './nodes/shape-node'

// Re-export types for convenience
export type {
  SceneNode,
  PropertyMap,
  PropertyValue,
  Time,
  EvaluationContext,
  Point2D,
  Point3D,
  Size2D,
  Color,
  Transform,
  Result,
  AnimatorError,
} from '@/types'
