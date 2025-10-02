/**
 * @fileoverview Professional Transition Effects Implementation
 * @author @darianrosebrook
 */

import { EffectCategory, EffectParameterType } from './effects-types'

/**
 * Linear wipe transition parameters
 */
export interface LinearWipeParameters {
  progress: number // Transition progress (0-1)
  direction: 'left' | 'right' | 'up' | 'down'
  softness: number // Edge softness (0-1)
}

/**
 * Radial wipe transition parameters
 */
export interface RadialWipeParameters {
  progress: number // Transition progress (0-1)
  center: { x: number; y: number } // Wipe center (0-1)
  angle: number // Wipe angle in degrees
  softness: number // Edge softness (0-1)
}

/**
 * Clock wipe transition parameters
 */
export interface ClockWipeParameters {
  progress: number // Transition progress (0-1)
  center: { x: number; y: number } // Wipe center (0-1)
  clockwise: boolean // Wipe direction
  softness: number // Edge softness (0-1)
}

/**
 * Slide transition parameters
 */
export interface SlideTransitionParameters {
  progress: number // Transition progress (0-1)
  direction: 'left' | 'right' | 'up' | 'down'
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce'
  bounce: number // Bounce intensity (0-1)
}

/**
 * Zoom transition parameters
 */
export interface ZoomTransitionParameters {
  progress: number // Transition progress (0-1)
  zoomType: 'in' | 'out' | 'rotate'
  pivot: { x: number; y: number } // Zoom pivot point (0-1)
  rotation: number // Rotation in degrees
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

/**
 * Morph transition parameters
 */
export interface MorphTransitionParameters {
  progress: number // Transition progress (0-1)
  morphType: 'dissolve' | 'push' | 'squeeze' | 'slide'
  direction: 'horizontal' | 'vertical' | 'radial'
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

/**
 * Pattern wipe transition parameters
 */
export interface PatternWipeParameters {
  progress: number // Transition progress (0-1)
  pattern: 'checkerboard' | 'stripes' | 'dots' | 'waves' | 'spiral'
  size: number // Pattern size (1-100)
  softness: number // Edge softness (0-1)
}

/**
 * Linear wipe transition effect
 */
export const linearWipeTransition = {
  name: 'linear-wipe',
  displayName: 'Linear Wipe',
  category: EffectCategory.Transition,
  description: 'Linear wipe transition between two layers',
  parameters: [
    {
      name: 'progress',
      displayName: 'Progress',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Transition progress (0-1)',
      animatable: true,
    },
    {
      name: 'direction',
      displayName: 'Direction',
      type: EffectParameterType.Enum,
      defaultValue: 'right',
      options: ['left', 'right', 'up', 'down'],
      description: 'Wipe direction',
      animatable: false,
    },
    {
      name: 'softness',
      displayName: 'Softness',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Edge softness (0-1)',
      animatable: true,
    },
  ],
  shader: linearWipeShader(),
  passes: 1,
  performance: {
    estimatedRenderTimeMs: 2.0,
    memoryUsageMB: 4.0,
  },
}

/**
 * Radial wipe transition effect
 */
export const radialWipeTransition = {
  name: 'radial-wipe',
  displayName: 'Radial Wipe',
  category: EffectCategory.Transition,
  description: 'Radial wipe transition from a center point',
  parameters: [
    {
      name: 'progress',
      displayName: 'Progress',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Transition progress (0-1)',
      animatable: true,
    },
    {
      name: 'center',
      displayName: 'Center',
      type: EffectParameterType.Point,
      defaultValue: { x: 0.5, y: 0.5 },
      description: 'Wipe center point (0-1)',
      animatable: true,
    },
    {
      name: 'angle',
      displayName: 'Angle',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: -180.0,
      max: 180.0,
      step: 1.0,
      description: 'Wipe angle in degrees',
      animatable: true,
    },
    {
      name: 'softness',
      displayName: 'Softness',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Edge softness (0-1)',
      animatable: true,
    },
  ],
  shader: radialWipeShader(),
  passes: 1,
  performance: {
    estimatedRenderTimeMs: 3.0,
    memoryUsageMB: 6.0,
  },
}

/**
 * Clock wipe transition effect
 */
export const clockWipeTransition = {
  name: 'clock-wipe',
  displayName: 'Clock Wipe',
  category: EffectCategory.Transition,
  description: 'Clock-style wipe transition',
  parameters: [
    {
      name: 'progress',
      displayName: 'Progress',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Transition progress (0-1)',
      animatable: true,
    },
    {
      name: 'center',
      displayName: 'Center',
      type: EffectParameterType.Point,
      defaultValue: { x: 0.5, y: 0.5 },
      description: 'Wipe center point (0-1)',
      animatable: true,
    },
    {
      name: 'clockwise',
      displayName: 'Clockwise',
      type: EffectParameterType.Boolean,
      defaultValue: true,
      description: 'Wipe direction',
      animatable: false,
    },
    {
      name: 'softness',
      displayName: 'Softness',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Edge softness (0-1)',
      animatable: true,
    },
  ],
  shader: clockWipeShader(),
  passes: 1,
  performance: {
    estimatedRenderTimeMs: 4.0,
    memoryUsageMB: 8.0,
  },
}

/**
 * Slide transition effect
 */
export const slideTransition = {
  name: 'slide',
  displayName: 'Slide',
  category: EffectCategory.Transition,
  description: 'Directional slide transition with easing',
  parameters: [
    {
      name: 'progress',
      displayName: 'Progress',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Transition progress (0-1)',
      animatable: true,
    },
    {
      name: 'direction',
      displayName: 'Direction',
      type: EffectParameterType.Enum,
      defaultValue: 'left',
      options: ['left', 'right', 'up', 'down'],
      description: 'Slide direction',
      animatable: false,
    },
    {
      name: 'easing',
      displayName: 'Easing',
      type: EffectParameterType.Enum,
      defaultValue: 'ease-in-out',
      options: ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'bounce'],
      description: 'Easing function',
      animatable: false,
    },
    {
      name: 'bounce',
      displayName: 'Bounce',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Bounce intensity (0-1)',
      animatable: true,
    },
  ],
  shader: slideTransitionShader(),
  passes: 1,
  performance: {
    estimatedRenderTimeMs: 2.0,
    memoryUsageMB: 4.0,
  },
}

/**
 * Zoom transition effect
 */
export const zoomTransition = {
  name: 'zoom',
  displayName: 'Zoom',
  category: EffectCategory.Transition,
  description: 'Zoom transition with rotation and pivot control',
  parameters: [
    {
      name: 'progress',
      displayName: 'Progress',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Transition progress (0-1)',
      animatable: true,
    },
    {
      name: 'zoomType',
      displayName: 'Zoom Type',
      type: EffectParameterType.Enum,
      defaultValue: 'in',
      options: ['in', 'out', 'rotate'],
      description: 'Type of zoom effect',
      animatable: false,
    },
    {
      name: 'pivot',
      displayName: 'Pivot',
      type: EffectParameterType.Point,
      defaultValue: { x: 0.5, y: 0.5 },
      description: 'Zoom pivot point (0-1)',
      animatable: true,
    },
    {
      name: 'rotation',
      displayName: 'Rotation',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: -360.0,
      max: 360.0,
      step: 1.0,
      description: 'Rotation in degrees',
      animatable: true,
    },
    {
      name: 'easing',
      displayName: 'Easing',
      type: EffectParameterType.Enum,
      defaultValue: 'ease-in-out',
      options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
      description: 'Easing function',
      animatable: false,
    },
  ],
  shader: zoomTransitionShader(),
  passes: 1,
  performance: {
    estimatedRenderTimeMs: 3.0,
    memoryUsageMB: 6.0,
  },
}

/**
 * Morph transition effect
 */
export const morphTransition = {
  name: 'morph',
  displayName: 'Morph',
  category: EffectCategory.Transition,
  description: 'Morph transition between shapes and forms',
  parameters: [
    {
      name: 'progress',
      displayName: 'Progress',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Transition progress (0-1)',
      animatable: true,
    },
    {
      name: 'morphType',
      displayName: 'Morph Type',
      type: EffectParameterType.Enum,
      defaultValue: 'dissolve',
      options: ['dissolve', 'push', 'squeeze', 'slide'],
      description: 'Type of morph effect',
      animatable: false,
    },
    {
      name: 'direction',
      displayName: 'Direction',
      type: EffectParameterType.Enum,
      defaultValue: 'horizontal',
      options: ['horizontal', 'vertical', 'radial'],
      description: 'Morph direction',
      animatable: false,
    },
    {
      name: 'easing',
      displayName: 'Easing',
      type: EffectParameterType.Enum,
      defaultValue: 'ease-in-out',
      options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
      description: 'Easing function',
      animatable: false,
    },
  ],
  shader: morphTransitionShader(),
  passes: 1,
  performance: {
    estimatedRenderTimeMs: 4.0,
    memoryUsageMB: 8.0,
  },
}

/**
 * Pattern wipe transition effect
 */
export const patternWipeTransition = {
  name: 'pattern-wipe',
  displayName: 'Pattern Wipe',
  category: EffectCategory.Transition,
  description: 'Pattern-based wipe transition',
  parameters: [
    {
      name: 'progress',
      displayName: 'Progress',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Transition progress (0-1)',
      animatable: true,
    },
    {
      name: 'pattern',
      displayName: 'Pattern',
      type: EffectParameterType.Enum,
      defaultValue: 'checkerboard',
      options: ['checkerboard', 'stripes', 'dots', 'waves', 'spiral'],
      description: 'Wipe pattern type',
      animatable: false,
    },
    {
      name: 'size',
      displayName: 'Size',
      type: EffectParameterType.Float,
      defaultValue: 20.0,
      min: 1.0,
      max: 100.0,
      step: 1.0,
      description: 'Pattern size (1-100)',
      animatable: true,
    },
    {
      name: 'softness',
      displayName: 'Softness',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Edge softness (0-1)',
      animatable: true,
    },
  ],
  shader: patternWipeShader(),
  passes: 1,
  performance: {
    estimatedRenderTimeMs: 5.0,
    memoryUsageMB: 10.0,
  },
}

/**
 * Linear wipe shader
 */
function linearWipeShader(): string {
  return `
    struct WipeParams {
      progress: f32,
      direction: u32, // 0=left, 1=right, 2=up, 3=down
      softness: f32,
    }

    @group(0) @binding(0) var fromTexture: texture_2d<f32>;
    @group(0) @binding(1) var toTexture: texture_2d<f32>;
    @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: WipeParams;

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(fromTexture));
      let uv = coord / texSize;

      var wipePosition = 0.0;
      switch params.direction {
        case 0u: { wipePosition = uv.x; }      // left to right
        case 1u: { wipePosition = 1.0 - uv.x; } // right to left
        case 2u: { wipePosition = uv.y; }      // top to bottom
        case 3u: { wipePosition = 1.0 - uv.y; } // bottom to top
        default: { wipePosition = uv.x; }
      }

      let threshold = params.progress;
      let softness = params.softness * 0.1;

      var mixFactor = 0.0;
      if (wipePosition < threshold - softness) {
        mixFactor = 0.0; // Show from layer
      } else if (wipePosition > threshold + softness) {
        mixFactor = 1.0; // Show to layer
      } else {
        mixFactor = smoothstep(threshold - softness, threshold + softness, wipePosition);
      }

      let fromColor = textureLoad(fromTexture, id.xy, 0);
      let toColor = textureLoad(toTexture, id.xy, 0);
      let result = mix(fromColor, toColor, mixFactor);

      textureStore(outputTexture, id.xy, result);
    }
  `
}

/**
 * Radial wipe shader
 */
function radialWipeShader(): string {
  return `
    struct RadialParams {
      progress: f32,
      centerX: f32,
      centerY: f32,
      angle: f32,
      softness: f32,
    }

    @group(0) @binding(0) var fromTexture: texture_2d<f32>;
    @group(0) @binding(1) var toTexture: texture_2d<f32>;
    @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: RadialParams;

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(fromTexture));
      let uv = coord / texSize;

      let center = vec2<f32>(params.centerX, params.centerY);
      let offset = uv - center;
      let distance = length(offset);
      let angle = atan2(offset.y, offset.x) + 3.14159; // 0 to 2π

      let normalizedAngle = angle / 6.28318; // 0 to 1
      let adjustedAngle = (normalizedAngle - (params.angle / 360.0)) % 1.0;

      let wipeRadius = params.progress * 1.414; // Diagonal of unit square
      let currentRadius = distance;
      let threshold = wipeRadius;

      let softness = params.softness * 0.1;
      var mixFactor = 0.0;

      if (currentRadius < threshold - softness) {
        mixFactor = 0.0;
      } else if (currentRadius > threshold + softness) {
        mixFactor = 1.0;
      } else {
        mixFactor = smoothstep(threshold - softness, threshold + softness, currentRadius);
      }

      let fromColor = textureLoad(fromTexture, id.xy, 0);
      let toColor = textureLoad(toTexture, id.xy, 0);
      let result = mix(fromColor, toColor, mixFactor);

      textureStore(outputTexture, id.xy, result);
    }
  `
}

/**
 * Clock wipe shader
 */
function clockWipeShader(): string {
  return `
    struct ClockParams {
      progress: f32,
      centerX: f32,
      centerY: f32,
      clockwise: u32, // 0=false, 1=true
      softness: f32,
    }

    @group(0) @binding(0) var fromTexture: texture_2d<f32>;
    @group(0) @binding(1) var toTexture: texture_2d<f32>;
    @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: ClockParams;

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(fromTexture));
      let uv = coord / texSize;

      let center = vec2<f32>(params.centerX, params.centerY);
      let offset = uv - center;
      let distance = length(offset);
      let angle = atan2(offset.y, offset.x);

      // Normalize angle to 0-1 range
      var normalizedAngle = (angle + 3.14159) / 6.28318;

      if (params.clockwise == 0u) {
        normalizedAngle = 1.0 - normalizedAngle;
      }

      let threshold = params.progress;
      let softness = params.softness * 0.1;

      var mixFactor = 0.0;
      if (normalizedAngle < threshold - softness) {
        mixFactor = 0.0;
      } else if (normalizedAngle > threshold + softness) {
        mixFactor = 1.0;
      } else {
        mixFactor = smoothstep(threshold - softness, threshold + softness, normalizedAngle);
      }

      let fromColor = textureLoad(fromTexture, id.xy, 0);
      let toColor = textureLoad(toTexture, id.xy, 0);
      let result = mix(fromColor, toColor, mixFactor);

      textureStore(outputTexture, id.xy, result);
    }
  `
}

/**
 * Slide transition shader
 */
function slideTransitionShader(): string {
  return `
    struct SlideParams {
      progress: f32,
      direction: u32, // 0=left, 1=right, 2=up, 3=down
      easing: u32,    // 0=linear, 1=ease-in, 2=ease-out, 3=ease-in-out, 4=bounce
      bounce: f32,
    }

    @group(0) @binding(0) var fromTexture: texture_2d<f32>;
    @group(0) @binding(1) var toTexture: texture_2d<f32>;
    @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: SlideParams;

    fn easeInOut(t: f32) -> f32 {
      return select(select(2.0 * t * t, -2.0 * t * t + 4.0 * t - 1.0, t < 0.5), 1.0, t >= 1.0);
    }

    fn easeIn(t: f32) -> f32 {
      return t * t;
    }

    fn easeOut(t: f32) -> f32 {
      return 1.0 - (1.0 - t) * (1.0 - t);
    }

    fn bounce(t: f32) -> f32 {
      if (t < 0.3636) {
        return 7.5625 * t * t;
      } else if (t < 0.7272) {
        let t2 = t - 0.5454;
        return 7.5625 * t2 * t2 + 0.75;
      } else if (t < 0.9090) {
        let t2 = t - 0.8181;
        return 7.5625 * t2 * t2 + 0.9375;
      } else {
        let t2 = t - 0.9545;
        return 7.5625 * t2 * t2 + 0.984375;
      }
    }

    fn applyEasing(t: f32, easingType: u32) -> f32 {
      switch easingType {
        case 0u: { return t; }
        case 1u: { return easeIn(t); }
        case 2u: { return easeOut(t); }
        case 3u: { return easeInOut(t); }
        case 4u: { return bounce(t); }
        default: { return t; }
      }
    }

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(fromTexture));
      let uv = coord / texSize;

      let easedProgress = applyEasing(params.progress, params.easing);
      let bounceOffset = sin(easedProgress * 3.14159 * 4.0) * params.bounce * (1.0 - easedProgress);

      var slideOffset = vec2<f32>(0.0);
      switch params.direction {
        case 0u: { slideOffset.x = easedProgress + bounceOffset; }      // left
        case 1u: { slideOffset.x = -(easedProgress + bounceOffset); }   // right
        case 2u: { slideOffset.y = easedProgress + bounceOffset; }      // up
        case 3u: { slideOffset.y = -(easedProgress + bounceOffset); }   // down
        default: { slideOffset.x = easedProgress + bounceOffset; }
      }

      let fromUv = uv + slideOffset;
      let toUv = uv - slideOffset;

      let fromColor = textureLoad(fromTexture, vec2<u32>(fromUv * texSize), 0);
      let toColor = textureLoad(toTexture, vec2<u32>(toUv * texSize), 0);

      // Blend based on progress
      let mixFactor = smoothstep(0.0, 1.0, easedProgress);
      let result = mix(fromColor, toColor, mixFactor);

      textureStore(outputTexture, id.xy, result);
    }
  `
}

/**
 * Zoom transition shader
 */
function zoomTransitionShader(): string {
  return `
    struct ZoomParams {
      progress: f32,
      zoomType: u32,  // 0=in, 1=out, 2=rotate
      pivotX: f32,
      pivotY: f32,
      rotation: f32,
      easing: u32,    // 0=linear, 1=ease-in, 2=ease-out, 3=ease-in-out
    }

    @group(0) @binding(0) var fromTexture: texture_2d<f32>;
    @group(0) @binding(1) var toTexture: texture_2d<f32>;
    @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: ZoomParams;

    fn easeInOut(t: f32) -> f32 {
      return select(select(2.0 * t * t, -2.0 * t * t + 4.0 * t - 1.0, t < 0.5), 1.0, t >= 1.0);
    }

    fn easeIn(t: f32) -> f32 {
      return t * t;
    }

    fn easeOut(t: f32) -> f32 {
      return 1.0 - (1.0 - t) * (1.0 - t);
    }

    fn applyEasing(t: f32, easingType: u32) -> f32 {
      switch easingType {
        case 0u: { return t; }
        case 1u: { return easeIn(t); }
        case 2u: { return easeOut(t); }
        case 3u: { return easeInOut(t); }
        default: { return t; }
      }
    }

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(fromTexture));
      let uv = coord / texSize;

      let pivot = vec2<f32>(params.pivotX, params.pivotY);
      let easedProgress = applyEasing(params.progress, params.easing);

      var scale = 1.0;
      var rotation = 0.0;

      switch params.zoomType {
        case 0u: { // zoom in
          scale = 1.0 + easedProgress * 2.0;
        }
        case 1u: { // zoom out
          scale = 1.0 - easedProgress * 0.5;
        }
        case 2u: { // rotate
          rotation = params.rotation * easedProgress * 0.017453; // degrees to radians
        }
        default: {
          scale = 1.0;
        }
      }

      // Apply transformation
      let centeredUv = uv - pivot;
      let rotatedUv = vec2<f32>(
        centeredUv.x * cos(rotation) - centeredUv.y * sin(rotation),
        centeredUv.x * sin(rotation) + centeredUv.y * cos(rotation)
      );
      let scaledUv = rotatedUv / scale + pivot;

      let fromColor = textureLoad(fromTexture, vec2<u32>(scaledUv * texSize), 0);
      let toColor = textureLoad(toTexture, vec2<u32>(uv * texSize), 0);

      let mixFactor = smoothstep(0.0, 1.0, easedProgress);
      let result = mix(fromColor, toColor, mixFactor);

      textureStore(outputTexture, id.xy, result);
    }
  `
}

/**
 * Morph transition shader
 */
function morphTransitionShader(): string {
  return `
    struct MorphParams {
      progress: f32,
      morphType: u32, // 0=dissolve, 1=push, 2=squeeze, 3=slide
      direction: u32, // 0=horizontal, 1=vertical, 2=radial
      easing: u32,    // 0=linear, 1=ease-in, 2=ease-out, 3=ease-in-out
    }

    @group(0) @binding(0) var fromTexture: texture_2d<f32>;
    @group(0) @binding(1) var toTexture: texture_2d<f32>;
    @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: MorphParams;

    fn easeInOut(t: f32) -> f32 {
      return select(select(2.0 * t * t, -2.0 * t * t + 4.0 * t - 1.0, t < 0.5), 1.0, t >= 1.0);
    }

    fn applyEasing(t: f32, easingType: u32) -> f32 {
      switch easingType {
        case 0u: { return t; }
        case 1u: { return t * t; }
        case 2u: { return 1.0 - (1.0 - t) * (1.0 - t); }
        case 3u: { return easeInOut(t); }
        default: { return t; }
      }
    }

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(fromTexture));
      let uv = coord / texSize;

      let easedProgress = applyEasing(params.progress, params.easing);

      var fromUv = uv;
      var toUv = uv;
      var mixFactor = easedProgress;

      switch params.morphType {
        case 0u: { // dissolve
          mixFactor = easedProgress;
        }
        case 1u: { // push
          if (params.direction == 0u) { // horizontal
            fromUv.x = uv.x - easedProgress;
            toUv.x = uv.x + (1.0 - easedProgress);
          } else if (params.direction == 1u) { // vertical
            fromUv.y = uv.y - easedProgress;
            toUv.y = uv.y + (1.0 - easedProgress);
          }
        }
        case 2u: { // squeeze
          if (params.direction == 0u) { // horizontal
            let squeeze = 1.0 - easedProgress * 0.5;
            fromUv = (uv - 0.5) / squeeze + 0.5;
            toUv = uv;
          } else if (params.direction == 1u) { // vertical
            let squeeze = 1.0 - easedProgress * 0.5;
            fromUv = (uv - 0.5) / squeeze + 0.5;
            toUv = uv;
          }
        }
        case 3u: { // slide
          if (params.direction == 0u) { // horizontal
            fromUv.x = uv.x - easedProgress;
            toUv.x = uv.x - easedProgress + 1.0;
          } else if (params.direction == 1u) { // vertical
            fromUv.y = uv.y - easedProgress;
            toUv.y = uv.y - easedProgress + 1.0;
          }
        }
        default: {
          mixFactor = easedProgress;
        }
      }

      let fromColor = textureLoad(fromTexture, vec2<u32>(fromUv * texSize), 0);
      let toColor = textureLoad(toTexture, vec2<u32>(toUv * texSize), 0);

      let result = mix(fromColor, toColor, mixFactor);
      textureStore(outputTexture, id.xy, result);
    }
  `
}

/**
 * Pattern wipe shader
 */
function patternWipeShader(): string {
  return `
    struct PatternParams {
      progress: f32,
      pattern: u32,   // 0=checkerboard, 1=stripes, 2=dots, 3=waves, 4=spiral
      size: f32,
      softness: f32,
    }

    @group(0) @binding(0) var fromTexture: texture_2d<f32>;
    @group(0) @binding(1) var toTexture: texture_2d<f32>;
    @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: PatternParams;

    fn checkerboardPattern(uv: vec2<f32>, size: f32) -> f32 {
      let gridUv = floor(uv * size);
      return f32((i32(gridUv.x) + i32(gridUv.y)) % 2);
    }

    fn stripesPattern(uv: vec2<f32>, size: f32) -> f32 {
      return f32(i32(uv.x * size) % 2);
    }

    fn dotsPattern(uv: vec2<f32>, size: f32) -> f32 {
      let gridUv = uv * size;
      let cellUv = fract(gridUv) - 0.5;
      return 1.0 - smoothstep(0.3, 0.5, length(cellUv));
    }

    fn wavesPattern(uv: vec2<f32>, size: f32) -> f32 {
      let wave = sin(uv.x * size * 6.28318) * 0.5 + 0.5;
      return step(uv.y * size, wave);
    }

    fn spiralPattern(uv: vec2<f32>, size: f32) -> f32 {
      let center = vec2<f32>(0.5, 0.5);
      let offset = uv - center;
      let distance = length(offset);
      let angle = atan2(offset.y, offset.x);
      let spiral = angle / 6.28318 + distance * size * 0.5;
      return f32(i32(spiral) % 2);
    }

    fn getPatternValue(uv: vec2<f32>, pattern: u32, size: f32) -> f32 {
      switch pattern {
        case 0u: { return checkerboardPattern(uv, size); }
        case 1u: { return stripesPattern(uv, size); }
        case 2u: { return dotsPattern(uv, size); }
        case 3u: { return wavesPattern(uv, size); }
        case 4u: { return spiralPattern(uv, size); }
        default: { return checkerboardPattern(uv, size); }
      }
    }

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(fromTexture));
      let uv = coord / texSize;

      let patternValue = getPatternValue(uv, params.pattern, params.size);
      let threshold = params.progress;
      let softness = params.softness * 0.1;

      var mixFactor = 0.0;
      if (patternValue < threshold - softness) {
        mixFactor = 0.0;
      } else if (patternValue > threshold + softness) {
        mixFactor = 1.0;
      } else {
        mixFactor = smoothstep(threshold - softness, threshold + softness, patternValue);
      }

      let fromColor = textureLoad(fromTexture, id.xy, 0);
      let toColor = textureLoad(toTexture, id.xy, 0);
      let result = mix(fromColor, toColor, mixFactor);

      textureStore(outputTexture, id.xy, result);
    }
  `
}
