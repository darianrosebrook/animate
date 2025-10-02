/**
 * @fileoverview Advanced Distortion Effects Implementation
 * @author @darianrosebrook
 */

import { EffectCategory, EffectParameterType } from './effects-types'

/**
 * Wave distortion effect parameters
 */
export interface WaveDistortionParameters {
  frequency: number // Wave frequency (0.1-10)
  amplitude: number // Wave amplitude (0-50)
  speed: number // Animation speed (-5 to 5)
  direction: 'horizontal' | 'vertical' | 'both'
  waveType: 'sine' | 'triangle' | 'square' | 'sawtooth'
  center: { x: number; y: number } // Center point of distortion (0-1)
  falloff: number // Distance falloff (0-1)
}

/**
 * Ripple distortion effect parameters
 */
export interface RippleDistortionParameters {
  frequency: number // Ripple frequency (0.1-20)
  amplitude: number // Ripple amplitude (0-100)
  speed: number // Animation speed (-10 to 10)
  epicenter: { x: number; y: number } // Ripple center point (0-1)
  decay: number // Distance decay (0-1)
  ringCount: number // Number of ripple rings (1-10)
}

/**
 * Displacement mapping effect parameters
 */
export interface DisplacementMapParameters {
  mapTexture: string // ID of displacement map texture
  strength: number // Displacement strength (0-200)
  scale: { x: number; y: number } // Displacement scale
  offset: { x: number; y: number } // Displacement offset
  wrapMode: 'clamp' | 'repeat' | 'mirror'
}

/**
 * Lens distortion effect parameters
 */
export interface LensDistortionParameters {
  curvature: number // Lens curvature (-1 to 1)
  cubicDistortion: number // Cubic distortion coefficient (-1 to 1)
  scale: number // Scale factor (0.5-2)
  center: { x: number; y: number } // Distortion center (0-1)
  chromaticAberration: number // Color separation (0-10)
}

/**
 * Chromatic aberration effect parameters
 */
export interface ChromaticAberrationParameters {
  intensity: number // Aberration intensity (0-50)
  direction: 'horizontal' | 'vertical' | 'both'
  center: { x: number; y: number } // Aberration center (0-1)
  falloff: number // Distance falloff (0-1)
}

/**
 * Wave distortion effect definition
 */
export const waveDistortionEffect = {
  name: 'wave-distortion',
  displayName: 'Wave Distortion',
  category: EffectCategory.Distortion,
  description:
    'Creates wave-like displacement effects with customizable patterns',
  parameters: [
    {
      name: 'frequency',
      displayName: 'Frequency',
      type: EffectParameterType.Float,
      defaultValue: 2.0,
      min: 0.1,
      max: 10.0,
      step: 0.1,
      description: 'Wave frequency (0.1-10)',
      animatable: true,
    },
    {
      name: 'amplitude',
      displayName: 'Amplitude',
      type: EffectParameterType.Float,
      defaultValue: 20.0,
      min: 0.0,
      max: 50.0,
      step: 1.0,
      description: 'Wave amplitude in pixels',
      animatable: true,
    },
    {
      name: 'speed',
      displayName: 'Speed',
      type: EffectParameterType.Float,
      defaultValue: 1.0,
      min: -5.0,
      max: 5.0,
      step: 0.1,
      description: 'Animation speed (-5 to 5)',
      animatable: true,
    },
    {
      name: 'direction',
      displayName: 'Direction',
      type: EffectParameterType.Enum,
      defaultValue: 'both',
      options: ['horizontal', 'vertical', 'both'],
      description: 'Wave direction',
      animatable: false,
    },
    {
      name: 'waveType',
      displayName: 'Wave Type',
      type: EffectParameterType.Enum,
      defaultValue: 'sine',
      options: ['sine', 'triangle', 'square', 'sawtooth'],
      description: 'Waveform shape',
      animatable: false,
    },
    {
      name: 'center',
      displayName: 'Center',
      type: EffectParameterType.Point,
      defaultValue: { x: 0.5, y: 0.5 },
      description: 'Center point of distortion (0-1)',
      animatable: true,
    },
    {
      name: 'falloff',
      displayName: 'Falloff',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Distance falloff (0-1)',
      animatable: true,
    },
  ],
  shader: waveDistortionShader(),
  passes: 1,
  performance: {
    estimatedRenderTimeMs: 8.0,
    memoryUsageMB: 16.0,
  },
}

/**
 * Ripple distortion effect definition
 */
export const rippleDistortionEffect = {
  name: 'ripple-distortion',
  displayName: 'Ripple Distortion',
  category: EffectCategory.Distortion,
  description: 'Creates expanding ripple effects from a central point',
  parameters: [
    {
      name: 'frequency',
      displayName: 'Frequency',
      type: EffectParameterType.Float,
      defaultValue: 5.0,
      min: 0.1,
      max: 20.0,
      step: 0.1,
      description: 'Ripple frequency (0.1-20)',
      animatable: true,
    },
    {
      name: 'amplitude',
      displayName: 'Amplitude',
      type: EffectParameterType.Float,
      defaultValue: 30.0,
      min: 0.0,
      max: 100.0,
      step: 1.0,
      description: 'Ripple amplitude in pixels',
      animatable: true,
    },
    {
      name: 'speed',
      displayName: 'Speed',
      type: EffectParameterType.Float,
      defaultValue: 2.0,
      min: -10.0,
      max: 10.0,
      step: 0.1,
      description: 'Animation speed (-10 to 10)',
      animatable: true,
    },
    {
      name: 'epicenter',
      displayName: 'Epicenter',
      type: EffectParameterType.Point,
      defaultValue: { x: 0.5, y: 0.5 },
      description: 'Ripple center point (0-1)',
      animatable: true,
    },
    {
      name: 'decay',
      displayName: 'Decay',
      type: EffectParameterType.Float,
      defaultValue: 0.5,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Distance decay (0-1)',
      animatable: true,
    },
    {
      name: 'ringCount',
      displayName: 'Ring Count',
      type: EffectParameterType.Int,
      defaultValue: 3,
      min: 1,
      max: 10,
      step: 1,
      description: 'Number of ripple rings (1-10)',
      animatable: false,
    },
  ],
  shader: rippleDistortionShader(),
  passes: 1,
  performance: {
    estimatedRenderTimeMs: 6.0,
    memoryUsageMB: 12.0,
  },
}

/**
 * Displacement map effect definition
 */
export const displacementMapEffect = {
  name: 'displacement-map',
  displayName: 'Displacement Map',
  category: EffectCategory.Distortion,
  description: 'Displaces pixels based on a texture map',
  parameters: [
    {
      name: 'mapTexture',
      displayName: 'Map Texture',
      type: EffectParameterType.Texture,
      description: 'Texture to use as displacement map',
      animatable: false,
    },
    {
      name: 'strength',
      displayName: 'Strength',
      type: EffectParameterType.Float,
      defaultValue: 50.0,
      min: 0.0,
      max: 200.0,
      step: 1.0,
      description: 'Displacement strength (0-200)',
      animatable: true,
    },
    {
      name: 'scale',
      displayName: 'Scale',
      type: EffectParameterType.Point,
      defaultValue: { x: 1.0, y: 1.0 },
      description: 'Displacement scale',
      animatable: true,
    },
    {
      name: 'offset',
      displayName: 'Offset',
      type: EffectParameterType.Point,
      defaultValue: { x: 0.0, y: 0.0 },
      description: 'Displacement offset',
      animatable: true,
    },
    {
      name: 'wrapMode',
      displayName: 'Wrap Mode',
      type: EffectParameterType.Enum,
      defaultValue: 'clamp',
      options: ['clamp', 'repeat', 'mirror'],
      description: 'Texture wrapping mode',
      animatable: false,
    },
  ],
  shader: displacementMapShader(),
  passes: 2, // Displacement pass + composite pass
  performance: {
    estimatedRenderTimeMs: 12.0,
    memoryUsageMB: 32.0,
  },
}

/**
 * Lens distortion effect definition
 */
export const lensDistortionEffect = {
  name: 'lens-distortion',
  displayName: 'Lens Distortion',
  category: EffectCategory.Distortion,
  description: 'Simulates camera lens distortion effects',
  parameters: [
    {
      name: 'curvature',
      displayName: 'Curvature',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: -1.0,
      max: 1.0,
      step: 0.01,
      description: 'Lens curvature (-1 to 1)',
      animatable: true,
    },
    {
      name: 'cubicDistortion',
      displayName: 'Cubic Distortion',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: -1.0,
      max: 1.0,
      step: 0.01,
      description: 'Cubic distortion coefficient (-1 to 1)',
      animatable: true,
    },
    {
      name: 'scale',
      displayName: 'Scale',
      type: EffectParameterType.Float,
      defaultValue: 1.0,
      min: 0.5,
      max: 2.0,
      step: 0.01,
      description: 'Scale factor (0.5-2)',
      animatable: true,
    },
    {
      name: 'center',
      displayName: 'Center',
      type: EffectParameterType.Point,
      defaultValue: { x: 0.5, y: 0.5 },
      description: 'Distortion center (0-1)',
      animatable: true,
    },
    {
      name: 'chromaticAberration',
      displayName: 'Chromatic Aberration',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 10.0,
      step: 0.1,
      description: 'Color separation (0-10)',
      animatable: true,
    },
  ],
  shader: lensDistortionShader(),
  passes: 2, // Distortion pass + chromatic aberration pass
  performance: {
    estimatedRenderTimeMs: 10.0,
    memoryUsageMB: 24.0,
  },
}

/**
 * Chromatic aberration effect definition
 */
export const chromaticAberrationEffect = {
  name: 'chromatic-aberration',
  displayName: 'Chromatic Aberration',
  category: EffectCategory.Distortion,
  description: 'Separates RGB channels for realistic lens aberration',
  parameters: [
    {
      name: 'intensity',
      displayName: 'Intensity',
      type: EffectParameterType.Float,
      defaultValue: 5.0,
      min: 0.0,
      max: 50.0,
      step: 0.5,
      description: 'Aberration intensity (0-50)',
      animatable: true,
    },
    {
      name: 'direction',
      displayName: 'Direction',
      type: EffectParameterType.Enum,
      defaultValue: 'both',
      options: ['horizontal', 'vertical', 'both'],
      description: 'Aberration direction',
      animatable: false,
    },
    {
      name: 'center',
      displayName: 'Center',
      type: EffectParameterType.Point,
      defaultValue: { x: 0.5, y: 0.5 },
      description: 'Aberration center (0-1)',
      animatable: true,
    },
    {
      name: 'falloff',
      displayName: 'Falloff',
      type: EffectParameterType.Float,
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Distance falloff (0-1)',
      animatable: true,
    },
  ],
  shader: chromaticAberrationShader(),
  passes: 1,
  performance: {
    estimatedRenderTimeMs: 4.0,
    memoryUsageMB: 8.0,
  },
}

/**
 * Wave distortion shader
 */
function waveDistortionShader(): string {
  return `
    struct WaveParams {
      frequency: f32,
      amplitude: f32,
      speed: f32,
      direction: u32, // 0=horizontal, 1=vertical, 2=both
      waveType: u32,  // 0=sine, 1=triangle, 2=square, 3=sawtooth
      centerX: f32,
      centerY: f32,
      falloff: f32,
      time: f32,
    }

    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: WaveParams;

    fn getWaveOffset(x: f32, y: f32, time: f32) -> f32 {
      let centerX = params.centerX;
      let centerY = params.centerY;
      let distance = distance(vec2<f32>(x, y), vec2<f32>(centerX, centerY));
      let falloff = 1.0 - smoothstep(0.0, params.falloff, distance);

      var wavePhase = 0.0;
      if (params.direction == 0u || params.direction == 2u) {
        wavePhase += x * params.frequency + time * params.speed;
      }
      if (params.direction == 1u || params.direction == 2u) {
        wavePhase += y * params.frequency + time * params.speed;
      }

      var wave = 0.0;
      switch params.waveType {
        case 0u: { wave = sin(wavePhase); }           // Sine
        case 1u: { wave = 2.0 * abs(fract(wavePhase) - 0.5) - 1.0; } // Triangle
        case 2u: { wave = sign(sin(wavePhase)); }     // Square
        case 3u: { wave = 2.0 * fract(wavePhase) - 1.0; } // Sawtooth
        default: { wave = sin(wavePhase); }
      }

      return wave * params.amplitude * falloff * 0.01;
    }

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(inputTexture));
      let uv = coord / texSize;

      let offset = getWaveOffset(uv.x, uv.y, params.time);

      var sampleUv = uv;
      if (params.direction == 0u || params.direction == 2u) {
        sampleUv.x += offset;
      }
      if (params.direction == 1u || params.direction == 2u) {
        sampleUv.y += offset;
      }

      // Clamp to texture bounds
      sampleUv = clamp(sampleUv, vec2<f32>(0.0), vec2<f32>(1.0));

      let sampleCoord = vec2<u32>(sampleUv * texSize);
      let color = textureLoad(inputTexture, sampleCoord, 0);

      textureStore(outputTexture, id.xy, color);
    }
  `
}

/**
 * Ripple distortion shader
 */
function rippleDistortionShader(): string {
  return `
    struct RippleParams {
      frequency: f32,
      amplitude: f32,
      speed: f32,
      epicenterX: f32,
      epicenterY: f32,
      decay: f32,
      ringCount: f32,
      time: f32,
    }

    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: RippleParams;

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(inputTexture));
      let uv = coord / texSize;

      let epicenter = vec2<f32>(params.epicenterX, params.epicenterY);
      let distance = distance(uv, epicenter);

      let wave = sin(distance * params.frequency * 6.28318 - params.time * params.speed);
      let decay = exp(-distance * params.decay);
      let ripple = wave * params.amplitude * decay * 0.01;

      let sampleUv = uv + normalize(uv - epicenter) * ripple;
      sampleUv = clamp(sampleUv, vec2<f32>(0.0), vec2<f32>(1.0));

      let sampleCoord = vec2<u32>(sampleUv * texSize);
      let color = textureLoad(inputTexture, sampleCoord, 0);

      textureStore(outputTexture, id.xy, color);
    }
  `
}

/**
 * Displacement map shader
 */
function displacementMapShader(): string {
  return `
    struct DisplacementParams {
      strength: f32,
      scaleX: f32,
      scaleY: f32,
      offsetX: f32,
      offsetY: f32,
      wrapMode: u32, // 0=clamp, 1=repeat, 2=mirror
    }

    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var displacementTexture: texture_2d<f32>;
    @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: DisplacementParams;

    fn getWrappedCoord(uv: vec2<f32>) -> vec2<f32> {
      var wrappedUv = uv;

      switch params.wrapMode {
        case 1u: { // repeat
          wrappedUv = fract(uv);
        }
        case 2u: { // mirror
          wrappedUv = abs(fract(uv * 0.5) * 2.0 - 1.0);
        }
        default: { // clamp
          wrappedUv = clamp(uv, vec2<f32>(0.0), vec2<f32>(1.0));
        }
      }

      return wrappedUv;
    }

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(inputTexture));
      let uv = coord / texSize;

      let scaledUv = uv * vec2<f32>(params.scaleX, params.scaleY) + vec2<f32>(params.offsetX, params.offsetY);
      let displacementUv = getWrappedCoord(scaledUv);

      let displacementCoord = vec2<u32>(displacementUv * vec2<f32>(textureDimensions(displacementTexture)));
      let displacement = textureLoad(displacementTexture, displacementCoord, 0);

      // Convert displacement from [0,1] to [-0.5, 0.5]
      let displacementOffset = (displacement.rg - 0.5) * params.strength * 0.01;

      let sampleUv = uv + displacementOffset;
      let clampedUv = clamp(sampleUv, vec2<f32>(0.0), vec2<f32>(1.0));

      let sampleCoord = vec2<u32>(clampedUv * texSize);
      let color = textureLoad(inputTexture, sampleCoord, 0);

      textureStore(outputTexture, id.xy, color);
    }
  `
}

/**
 * Lens distortion shader
 */
function lensDistortionShader(): string {
  return `
    struct LensParams {
      curvature: f32,
      cubicDistortion: f32,
      scale: f32,
      centerX: f32,
      centerY: f32,
      chromaticAberration: f32,
    }

    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: LensParams;

    // Apply lens distortion to UV coordinates
    fn distortUV(uv: vec2<f32>, center: vec2<f32>) -> vec2<f32> {
      let offset = uv - center;
      let distance = length(offset);

      if (distance == 0.0) {
        return uv;
      }

      let normalizedDistance = distance * params.scale;
      let distortion = normalizedDistance * (1.0 + params.curvature * normalizedDistance * normalizedDistance +
                                          params.cubicDistortion * normalizedDistance * normalizedDistance * normalizedDistance);

      return center + normalize(offset) * distortion;
    }

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(inputTexture));
      let uv = coord / texSize;

      let center = vec2<f32>(params.centerX, params.centerY);

      // Apply chromatic aberration by sampling different UVs for each channel
      let distortionR = distortUV(uv, center);
      let distortionG = distortUV(uv + normalize(uv - center) * params.chromaticAberration * 0.001, center);
      let distortionB = distortUV(uv + normalize(uv - center) * params.chromaticAberration * 0.002, center);

      let clampedUvR = clamp(distortionR, vec2<f32>(0.0), vec2<f32>(1.0));
      let clampedUvG = clamp(distortionG, vec2<f32>(0.0), vec2<f32>(1.0));
      let clampedUvB = clamp(distortionB, vec2<f32>(0.0), vec2<f32>(1.0));

      let coordR = vec2<u32>(clampedUvR * texSize);
      let coordG = vec2<u32>(clampedUvG * texSize);
      let coordB = vec2<u32>(clampedUvB * texSize);

      let colorR = textureLoad(inputTexture, coordR, 0).r;
      let colorG = textureLoad(inputTexture, coordG, 0).g;
      let colorB = textureLoad(inputTexture, coordB, 0).b;
      let alpha = textureLoad(inputTexture, coordR, 0).a;

      let color = vec4<f32>(colorR, colorG, colorB, alpha);
      textureStore(outputTexture, id.xy, color);
    }
  `
}

/**
 * Chromatic aberration shader
 */
function chromaticAberrationShader(): string {
  return `
    struct ChromaticParams {
      intensity: f32,
      direction: u32, // 0=horizontal, 1=vertical, 2=both
      centerX: f32,
      centerY: f32,
      falloff: f32,
    }

    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
    @group(1) @binding(0) var<uniform> params: ChromaticParams;

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let coord = vec2<f32>(id.xy);
      let texSize = vec2<f32>(textureDimensions(inputTexture));
      let uv = coord / texSize;

      let center = vec2<f32>(params.centerX, params.centerY);
      let distance = distance(uv, center);
      let falloff = 1.0 - smoothstep(0.0, params.falloff, distance);

      var offset = vec2<f32>(0.0);
      if (params.direction == 0u || params.direction == 2u) {
        offset.x = params.intensity * falloff * 0.001;
      }
      if (params.direction == 1u || params.direction == 2u) {
        offset.y = params.intensity * falloff * 0.001;
      }

      // Sample different positions for each color channel
      let uvR = uv + offset;
      let uvG = uv;
      let uvB = uv - offset;

      let clampedUvR = clamp(uvR, vec2<f32>(0.0), vec2<f32>(1.0));
      let clampedUvG = clamp(uvG, vec2<f32>(0.0), vec2<f32>(1.0));
      let clampedUvB = clamp(uvB, vec2<f32>(0.0), vec2<f32>(1.0));

      let coordR = vec2<u32>(clampedUvR * texSize);
      let coordG = vec2<u32>(clampedUvG * texSize);
      let coordB = vec2<u32>(clampedUvB * texSize);

      let colorR = textureLoad(inputTexture, coordR, 0).r;
      let colorG = textureLoad(inputTexture, coordG, 0).g;
      let colorB = textureLoad(inputTexture, coordB, 0).b;
      let alpha = textureLoad(inputTexture, coordR, 0).a;

      let color = vec4<f32>(colorR, colorG, colorB, alpha);
      textureStore(outputTexture, id.xy, color);
    }
  `
}
