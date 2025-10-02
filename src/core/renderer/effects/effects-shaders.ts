/**
 * @fileoverview Effects Shader System - WGSL implementations for GPU-accelerated effects
 * @author @darianrosebrook
 */

import { WebGPUContext } from '../webgpu-context'
import { logger } from '@/core/logging/logger'

/**
 * Base effect shader interface
 */
export interface EffectShader {
  name: string
  vertexShader: string
  fragmentShader: string
  uniforms: Record<string, unknown>
  requiredFeatures: string[]
  performanceProfile: 'low' | 'medium' | 'high'
}

/**
 * Gaussian Blur shader implementation
 */
export const gaussianBlurShader: EffectShader = {
  name: 'gaussian_blur',
  vertexShader: `
    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) texCoord: vec2<f32>,
    }

    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
      var output: VertexOutput;
      let pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(1.0, 1.0)
      );
      let texCoord = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, 0.0)
      );
      output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
      output.texCoord = texCoord[vertexIndex];
      return output;
    }
  `,
  fragmentShader: `
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var inputSampler: sampler;
    @group(0) @binding(2) var<uniform> uniforms: GaussianBlurUniforms;

    struct GaussianBlurUniforms {
      radius: f32,
      sigma: f32,
      direction: u32, // 0 = horizontal, 1 = vertical
      textureSize: vec2<f32>,
    }

    fn gaussian_weight(distance: f32, sigma: f32) -> f32 {
      return exp(-(distance * distance) / (2.0 * sigma * sigma)) / (sigma * sqrt(2.0 * 3.14159265359));
    }

    @fragment
    fn fs_main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
      let texSize = uniforms.textureSize;
      let uv = texCoord;
      let halfRadius = uniforms.radius * 0.5;
      let sigma = uniforms.sigma;

      var color = vec4<f32>(0.0);
      var totalWeight = 0.0;

      // Sample multiple points for blur
      for (var i = -halfRadius; i <= halfRadius; i += 1.0) {
        let offset = vec2<f32>(
          select(0.0, i / texSize.x, uniforms.direction == 0u),
          select(i / texSize.y, 0.0, uniforms.direction == 0u)
        );
        let sampleUV = uv + offset;
        let sampleColor = textureSample(inputTexture, inputSampler, sampleUV);

        let distance = abs(f32(i));
        let weight = gaussian_weight(distance, sigma);

        color += sampleColor * weight;
        totalWeight += weight;
      }

      return color / totalWeight;
    }
  `,
  uniforms: {
    radius: 5.0,
    sigma: 2.0,
    direction: 0,
    textureSize: [1920, 1080],
  },
  requiredFeatures: ['texture-sampling'],
  performanceProfile: 'medium',
}

/**
 * Brightness/Contrast shader implementation
 */
export const brightnessContrastShader: EffectShader = {
  name: 'brightness_contrast',
  vertexShader: `
    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) texCoord: vec2<f32>,
    }

    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
      var output: VertexOutput;
      let pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(1.0, 1.0)
      );
      let texCoord = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, 0.0)
      );
      output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
      output.texCoord = texCoord[vertexIndex];
      return output;
    }
  `,
  fragmentShader: `
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var inputSampler: sampler;
    @group(0) @binding(2) var<uniform> uniforms: BrightnessContrastUniforms;

    struct BrightnessContrastUniforms {
      brightness: f32, // -100 to 100
      contrast: f32,   // -100 to 100
      preserveLuminosity: u32,
    }

    @fragment
    fn fs_main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
      let color = textureSample(inputTexture, inputSampler, texCoord);

      // Apply brightness (linear adjustment)
      var result = color;
      if (uniforms.brightness != 0.0) {
        let brightness = uniforms.brightness * 0.01; // Normalize to -1 to 1
        result = vec4<f32>(color.rgb + brightness, color.a);
      }

      // Apply contrast (pivot around 0.5)
      if (uniforms.contrast != 0.0) {
        let contrast = uniforms.contrast * 0.01 + 1.0; // Normalize to 0 to 2
        let pivot = 0.5;
        result = vec4<f32>(
          pow((result.rgb - pivot) * contrast + pivot, vec3<f32>(1.0 / 2.2)),
          result.a
        );
      }

      // Preserve luminosity if requested
      if (uniforms.preserveLuminosity == 1u) {
        let originalLuma = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114));
        let newLuma = dot(result.rgb, vec3<f32>(0.299, 0.587, 0.114));
        let lumaRatio = originalLuma / max(newLuma, 0.001);
        result = vec4<f32>(result.rgb * lumaRatio, result.a);
      }

      return result;
    }
  `,
  uniforms: {
    brightness: 0.0,
    contrast: 0.0,
    preserveLuminosity: 0,
  },
  requiredFeatures: ['texture-sampling'],
  performanceProfile: 'low',
}

/**
 * Levels correction shader implementation
 */
export const levelsShader: EffectShader = {
  name: 'levels',
  vertexShader: `
    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) texCoord: vec2<f32>,
    }

    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
      var output: VertexOutput;
      let pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(1.0, 1.0)
      );
      let texCoord = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, 0.0)
      );
      output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
      output.texCoord = texCoord[vertexIndex];
      return output;
    }
  `,
  fragmentShader: `
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var inputSampler: sampler;
    @group(0) @binding(2) var<uniform> uniforms: LevelsUniforms;

    struct LevelsUniforms {
      inputBlack: f32,  // 0-255
      inputWhite: f32,  // 0-255
      gamma: f32,       // 0.1-10
      outputBlack: f32, // 0-255
      outputWhite: f32, // 0-255
      channel: u32,     // 0=rgb, 1=red, 2=green, 3=blue
    }

    @fragment
    fn fs_main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
      let color = textureSample(inputTexture, inputSampler, texCoord);

      // Normalize to 0-1 range
      let inputBlack = uniforms.inputBlack / 255.0;
      let inputWhite = uniforms.inputWhite / 255.0;
      let outputBlack = uniforms.outputBlack / 255.0;
      let outputWhite = uniforms.outputWhite / 255.0;

      var result = color;

      // Apply levels correction per channel or RGB
      if (uniforms.channel == 0u) {
        // RGB channels
        result = vec4<f32>(
          apply_levels(color.r, inputBlack, inputWhite, uniforms.gamma, outputBlack, outputWhite),
          apply_levels(color.g, inputBlack, inputWhite, uniforms.gamma, outputBlack, outputWhite),
          apply_levels(color.b, inputBlack, inputWhite, uniforms.gamma, outputBlack, outputWhite),
          color.a
        );
      } else {
        // Single channel
        let channelIndex = uniforms.channel - 1u;
        let channels = array<f32, 3>(color.r, color.g, color.b);
        let originalValue = channels[channelIndex];
        let correctedValue = apply_levels(originalValue, inputBlack, inputWhite, uniforms.gamma, outputBlack, outputWhite);

        if (channelIndex == 0u) {
          result = vec4<f32>(correctedValue, color.g, color.b, color.a);
        } else if (channelIndex == 1u) {
          result = vec4<f32>(color.r, correctedValue, color.b, color.a);
        } else {
          result = vec4<f32>(color.r, color.g, correctedValue, color.a);
        }
      }

      return result;
    }

    fn apply_levels(value: f32, inputBlack: f32, inputWhite: f32, gamma: f32, outputBlack: f32, outputWhite: f32) -> f32 {
      // Normalize input
      let normalized = (value - inputBlack) / (inputWhite - inputBlack);

      // Apply gamma correction
      let gammaCorrected = pow(max(normalized, 0.0), 1.0 / gamma);

      // Map to output range
      let result = outputBlack + gammaCorrected * (outputWhite - outputBlack);

      return clamp(result, 0.0, 1.0);
    }
  `,
  uniforms: {
    inputBlack: 0.0,
    inputWhite: 255.0,
    gamma: 1.0,
    outputBlack: 0.0,
    outputWhite: 255.0,
    channel: 0,
  },
  requiredFeatures: ['texture-sampling'],
  performanceProfile: 'low',
}

/**
 * Motion Blur shader implementation
 */
export const motionBlurShader: EffectShader = {
  name: 'motion_blur',
  vertexShader: `
    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) texCoord: vec2<f32>,
    }

    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
      var output: VertexOutput;
      let pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(1.0, 1.0)
      );
      let texCoord = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, 0.0)
      );
      output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
      output.texCoord = texCoord[vertexIndex];
      return output;
    }
  `,
  fragmentShader: `
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var inputSampler: sampler;
    @group(0) @binding(2) var<uniform> uniforms: MotionBlurUniforms;

    struct MotionBlurUniforms {
      angle: f32,      // 0-360 degrees
      distance: f32,   // 0-100
      steps: u32,      // 2-32
      shutterAngle: f32, // 0-360
    }

    @fragment
    fn fs_main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
      let angleRad = radians(uniforms.angle);
      let direction = vec2<f32>(cos(angleRad), sin(angleRad));
      let stepSize = uniforms.distance * 0.001; // Normalize distance
      let numSteps = f32(uniforms.steps);

      var color = vec4<f32>(0.0);
      let weight = 1.0 / numSteps;

      for (var i = 0.0; i < numSteps; i += 1.0) {
        let offset = direction * stepSize * (i - numSteps * 0.5) / numSteps;
        let sampleUV = texCoord + offset;
        let sampleColor = textureSample(inputTexture, inputSampler, sampleUV);
        color += sampleColor * weight;
      }

      return color;
    }
  `,
  uniforms: {
    angle: 0.0,
    distance: 10.0,
    steps: 16,
    shutterAngle: 180.0,
  },
  requiredFeatures: ['texture-sampling'],
  performanceProfile: 'medium',
}

/**
 * Wave distortion shader implementation
 */
export const waveShader: EffectShader = {
  name: 'wave',
  vertexShader: `
    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) texCoord: vec2<f32>,
    }

    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
      var output: VertexOutput;
      let pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(1.0, 1.0)
      );
      let texCoord = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, 0.0)
      );
      output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
      output.texCoord = texCoord[vertexIndex];
      return output;
    }
  `,
  fragmentShader: `
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var inputSampler: sampler;
    @group(0) @binding(2) var<uniform> uniforms: WaveUniforms;

    struct WaveUniforms {
      waveType: u32,    // 0=sine, 1=triangle, 2=square, 3=sawtooth
      amplitude: f32,   // 0-100
      frequency: f32,   // 0.1-50
      phase: f32,       // 0-360
      direction: f32,   // 0-360
    }

    fn wave_function(x: f32, waveType: u32) -> f32 {
      let normalizedX = x * uniforms.frequency + radians(uniforms.phase);

      switch (waveType) {
        case 0u: { return sin(normalizedX); }           // Sine
        case 1u: { return abs(fract(normalizedX * 0.5) * 2.0 - 1.0) * 2.0 - 1.0; } // Triangle
        case 2u: { return sign(sin(normalizedX)); }     // Square
        case 3u: { return fract(normalizedX) * 2.0 - 1.0; } // Sawtooth
        default: { return 0.0; }
      }
    }

    @fragment
    fn fs_main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
      let angleRad = radians(uniforms.direction);
      let direction = vec2<f32>(cos(angleRad), sin(angleRad));
      let waveValue = wave_function(dot(texCoord, direction), uniforms.waveType);

      let displacement = direction * waveValue * uniforms.amplitude * 0.01;
      let distortedUV = texCoord + displacement;

      return textureSample(inputTexture, inputSampler, distortedUV);
    }
  `,
  uniforms: {
    waveType: 0,
    amplitude: 10.0,
    frequency: 2.0,
    phase: 0.0,
    direction: 0.0,
  },
  requiredFeatures: ['texture-sampling'],
  performanceProfile: 'low',
}

/**
 * Chroma Key shader implementation
 */
export const chromaKeyShader: EffectShader = {
  name: 'chroma_key',
  vertexShader: `
    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) texCoord: vec2<f32>,
    }

    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
      var output: VertexOutput;
      let pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(1.0, 1.0)
      );
      let texCoord = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, 0.0)
      );
      output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
      output.texCoord = texCoord[vertexIndex];
      return output;
    }
  `,
  fragmentShader: `
    @group(0) @binding(0) var inputTexture: texture_2d<f32>;
    @group(0) @binding(1) var inputSampler: sampler;
    @group(0) @binding(2) var<uniform> uniforms: ChromaKeyUniforms;

    struct ChromaKeyUniforms {
      keyColor: vec3<f32>,      // RGB key color (0-1)
      tolerance: f32,           // 0-100
      edgeThin: f32,            // 0-100
      edgeFeather: f32,         // 0-100
      spillSuppression: f32,    // 0-100
      alphaOperation: u32,      // 0=normal, 1=min, 2=max, 3=screen
    }

    @fragment
    fn fs_main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
      let color = textureSample(inputTexture, inputSampler, texCoord);

      // Calculate color distance from key color
      let colorDiff = color.rgb - uniforms.keyColor;
      let distance = length(colorDiff);

      // Normalize tolerance to 0-1 range and scale by sqrt(3) for proper coverage
      let tolerance = uniforms.tolerance * 0.01 * 1.732; // sqrt(3) for RGB cube diagonal

      // Create base alpha based on color distance
      var alpha = 1.0 - smoothstep(0.0, tolerance, distance);

      // Apply edge thinning
      if (uniforms.edgeThin > 0.0) {
        let edgeThinAmount = uniforms.edgeThin * 0.01;
        alpha = pow(alpha, 1.0 + edgeThinAmount * 4.0);
      }

      // Apply edge feathering
      if (uniforms.edgeFeather > 0.0) {
        let featherAmount = uniforms.edgeFeather * 0.01;
        let feather = 1.0 - alpha;
        alpha = 1.0 - smoothstep(0.0, featherAmount, feather);
      }

      // Apply spill suppression
      if (uniforms.spillSuppression > 0.0 && alpha > 0.0) {
        let spillAmount = uniforms.spillSuppression * 0.01;
        let spillMask = 1.0 - smoothstep(0.0, tolerance * 0.5, distance);

        // Desaturate colors near the key color
        let gray = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114));
        let desaturated = mix(color.rgb, vec3<f32>(gray), spillMask * spillAmount);

        return vec4<f32>(desaturated, alpha);
      }

      // Apply alpha operation
      switch (uniforms.alphaOperation) {
        case 1u: { // min
          alpha = min(alpha, color.a);
          break;
        }
        case 2u: { // max
          alpha = max(alpha, color.a);
          break;
        }
        case 3u: { // screen
          alpha = 1.0 - (1.0 - alpha) * (1.0 - color.a);
          break;
        }
        default: { // normal
          alpha = alpha * color.a;
          break;
        }
      }

      return vec4<f32>(color.rgb, alpha);
    }
  `,
  uniforms: {
    keyColor: [0.0, 1.0, 0.0], // Green screen default
    tolerance: 20.0,
    edgeThin: 0.0,
    edgeFeather: 10.0,
    spillSuppression: 50.0,
    alphaOperation: 0,
  },
  requiredFeatures: ['texture-sampling'],
  performanceProfile: 'medium',
}

/**
 * Noise generation shader implementation
 */
export const noiseShader: EffectShader = {
  name: 'noise',
  vertexShader: `
    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) texCoord: vec2<f32>,
    }

    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
      var output: VertexOutput;
      let pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(1.0, 1.0)
      );
      let texCoord = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(0.0, 0.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, 0.0)
      );
      output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
      output.texCoord = texCoord[vertexIndex];
      return output;
    }
  `,
  fragmentShader: `
    @group(0) @binding(0) var<uniform> uniforms: NoiseUniforms;

    struct NoiseUniforms {
      noiseType: u32,   // 0=perlin, 1=simplex, 2=worley, 3=random
      scale: f32,       // 0.1-100
      intensity: f32,   // 0-100
      seed: f32,        // Random seed
      octaves: u32,     // Number of octaves (1-8)
      persistence: f32, // Persistence (0-1)
      lacunarity: f32,  // Lacunarity (1-4)
    }

    // Simple pseudo-random function
    fn random(st: vec2<f32>) -> f32 {
      return fract(sin(dot(st.xy, vec2<f32>(12.9898, 78.233))) * 43758.5453123);
    }

    // Perlin-like noise function
    fn noise(st: vec2<f32>) -> f32 {
      let i = floor(st);
      let f = fract(st);

      let a = random(i);
      let b = random(i + vec2<f32>(1.0, 0.0));
      let c = random(i + vec2<f32>(0.0, 1.0));
      let d = random(i + vec2<f32>(1.0, 1.0));

      let u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    // Fractal noise function
    fn fractal_noise(st: vec2<f32>) -> f32 {
      var value = 0.0;
      var amplitude = 1.0;
      var frequency = 0.0;
      var maxValue = 0.0;

      for (var i = 0u; i < uniforms.octaves; i++) {
        value += noise(st * uniforms.scale * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= uniforms.persistence;
        frequency *= uniforms.lacunarity + 1.0;
      }

      return value / maxValue;
    }

    @fragment
    fn fs_main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
      var noiseValue = 0.0;

      switch (uniforms.noiseType) {
        case 0u: { // Perlin
          noiseValue = fractal_noise(texCoord);
          break;
        }
        case 1u: { // Simplex (simplified)
          noiseValue = fractal_noise(texCoord * 1.5);
          break;
        }
        case 2u: { // Worley (simplified)
          noiseValue = random(texCoord * uniforms.scale);
          break;
        }
        case 3u: { // Random
          noiseValue = random(texCoord * uniforms.scale + uniforms.seed);
          break;
        }
        default: {
          noiseValue = 0.0;
          break;
        }
      }

      let intensity = uniforms.intensity * 0.01;
      let gray = 0.5 + noiseValue * intensity;

      return vec4<f32>(gray, gray, gray, 1.0);
    }
  `,
  uniforms: {
    noiseType: 0,
    scale: 10.0,
    intensity: 50.0,
    seed: 0.0,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
  },
  requiredFeatures: [],
  performanceProfile: 'low',
}

/**
 * Effect shader registry
 */
export const effectShaders: Record<string, EffectShader> = {
  gaussian_blur: gaussianBlurShader,
  brightness_contrast: brightnessContrastShader,
  levels: levelsShader,
  motion_blur: motionBlurShader,
  wave: waveShader,
  chroma_key: chromaKeyShader,
  noise: noiseShader,
}

/**
 * Effect shader manager for loading and managing effect shaders
 */
export class EffectShaderManager {
  private webgpuContext: WebGPUContext
  private compiledShaders: Map<
    string,
    { vertexModule: GPUShaderModule; fragmentModule: GPUShaderModule }
  > = new Map()

  constructor(webgpuContext: WebGPUContext) {
    this.webgpuContext = webgpuContext
  }

  /**
   * Get compiled shader modules for an effect
   */
  async getShaderModules(effectName: string): Promise<{
    vertexModule: GPUShaderModule
    fragmentModule: GPUShaderModule
  } | null> {
    // Check cache first
    const cached = this.compiledShaders.get(effectName)
    if (cached) {
      return cached
    }

    const shader = effectShaders[effectName]
    if (!shader) {
      return null
    }

    const device = this.webgpuContext.getDevice()
    if (!device) {
      return null
    }

    try {
      const vertexModule = device.createShaderModule({
        label: `${effectName}_vertex`,
        code: shader.vertexShader,
      })

      const fragmentModule = device.createShaderModule({
        label: `${effectName}_fragment`,
        code: shader.fragmentShader,
      })

      const result = { vertexModule, fragmentModule }
      this.compiledShaders.set(effectName, result)

      return result
    } catch (error) {
      logger.error(
        `Failed to compile shader for effect ${effectName}:`,
        error as Error
      )
      return null
    }
  }

  /**
   * Get all available effect names
   */
  getAvailableEffects(): string[] {
    return Object.keys(effectShaders)
  }

  /**
   * Get shader information for an effect
   */
  getShaderInfo(effectName: string): EffectShader | null {
    return effectShaders[effectName] || null
  }

  /**
   * Precompile all effect shaders for faster loading
   */
  async precompileAllShaders(): Promise<void> {
    const effectNames = this.getAvailableEffects()

    await Promise.all(effectNames.map((name) => this.getShaderModules(name)))
  }

  /**
   * Clear compiled shader cache
   */
  clearCache(): void {
    this.compiledShaders.clear()
  }
}
