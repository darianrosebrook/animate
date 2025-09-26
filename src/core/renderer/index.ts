/**
 * @fileoverview Renderer Module Exports
 * @author @darianrosebrook
 */

// Core rendering classes
export { WebGPUContext } from './webgpu-context'
export { ShaderManager } from './shaders'
export { Renderer } from './renderer'

// Shaders
export {
  rectangleVertexShader,
  rectangleFragmentShader,
  circleVertexShader,
  circleFragmentShader,
  pathVertexShader,
  pathFragmentShader,
} from './shaders'

// Re-export types for convenience
export type { Result, AnimatorError, Time, EvaluationContext, SceneGraph, RenderOutput } from '@/types'
