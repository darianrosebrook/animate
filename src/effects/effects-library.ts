/**
 * @fileoverview Effects Library with Built-in Professional Effects
 * @author @darianrosebrook
 */

import { Result } from '@/types'
import {
  EffectLibrary as IEffectLibrary,
  EffectType,
  EffectPreset,
  EffectCategory,
  EffectParameterType,
} from './effects-types'

/**
 * Built-in effects library with professional GPU-accelerated effects
 */
export class EffectsLibrary implements IEffectLibrary {
  private effectTypes: Map<string, EffectType> = new Map()
  private presets: Map<string, EffectPreset> = new Map()

  constructor() {
    this.initializeBuiltInEffects()
  }

  getEffectTypes(): EffectType[] {
    return Array.from(this.effectTypes.values())
  }

  getEffectType(name: string): EffectType | null {
    return this.effectTypes.get(name) || null
  }

  getPresets(effectType?: string): EffectPreset[] {
    const presets = Array.from(this.presets.values())
    if (effectType) {
      return presets.filter((p) => p.effectType === effectType)
    }
    return presets
  }

  savePreset(preset: EffectPreset): Result<void> {
    try {
      this.presets.set(preset.id, preset)
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PRESET_SAVE_ERROR',
          message: `Failed to save preset: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  deletePreset(presetId: string): Result<void> {
    try {
      this.presets.delete(presetId)
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PRESET_DELETE_ERROR',
          message: `Failed to delete preset: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  loadPreset(presetId: string): EffectPreset | null {
    return this.presets.get(presetId) || null
  }

  private initializeBuiltInEffects(): void {
    // Glow Effect
    this.effectTypes.set('glow', {
      name: 'glow',
      displayName: 'Glow',
      category: EffectCategory.Blur,
      description:
        'Creates a soft glow around objects with customizable intensity and color',
      parameters: [
        {
          name: 'intensity',
          displayName: 'Intensity',
          type: EffectParameterType.Float,
          defaultValue: 1.0,
          min: 0.0,
          max: 5.0,
          step: 0.1,
          description: 'Glow intensity (0-5)',
          animatable: true,
        },
        {
          name: 'radius',
          displayName: 'Radius',
          type: EffectParameterType.Float,
          defaultValue: 10.0,
          min: 1.0,
          max: 50.0,
          step: 1.0,
          description: 'Glow radius in pixels',
          animatable: true,
        },
        {
          name: 'color',
          displayName: 'Color',
          type: EffectParameterType.Color,
          defaultValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
          description: 'Glow color',
          animatable: true,
        },
        {
          name: 'quality',
          displayName: 'Quality',
          type: EffectParameterType.Enum,
          defaultValue: 'medium',
          options: ['low', 'medium', 'high', 'ultra'],
          description: 'Render quality affecting performance',
          animatable: false,
        },
      ],
      shader: this.getGlowShader(),
      passes: 2, // Blur pass + composite pass
      performance: {
        estimatedRenderTimeMs: 8.0,
        memoryUsageMB: 32.0,
      },
    })

    // Gaussian Blur Effect
    this.effectTypes.set('gaussian-blur', {
      name: 'gaussian-blur',
      displayName: 'Gaussian Blur',
      category: EffectCategory.Blur,
      description:
        'High-quality Gaussian blur with configurable radius and quality',
      parameters: [
        {
          name: 'radius',
          displayName: 'Radius',
          type: EffectParameterType.Float,
          defaultValue: 5.0,
          min: 0.5,
          max: 25.0,
          step: 0.5,
          description: 'Blur radius in pixels',
          animatable: true,
        },
        {
          name: 'quality',
          displayName: 'Quality',
          type: EffectParameterType.Enum,
          defaultValue: 'medium',
          options: ['low', 'medium', 'high'],
          description: 'Blur quality affecting performance',
          animatable: false,
        },
      ],
      shader: this.getGaussianBlurShader(),
      passes: 2, // Horizontal + vertical blur passes
      performance: {
        estimatedRenderTimeMs: 6.0,
        memoryUsageMB: 24.0,
      },
    })

    // Color Correction Effect
    this.effectTypes.set('color-correction', {
      name: 'color-correction',
      displayName: 'Color Correction',
      category: EffectCategory.Color,
      description:
        'Professional color grading with brightness, contrast, and saturation controls',
      parameters: [
        {
          name: 'brightness',
          displayName: 'Brightness',
          type: EffectParameterType.Float,
          defaultValue: 0.0,
          min: -1.0,
          max: 1.0,
          step: 0.01,
          description: 'Brightness adjustment (-1 to 1)',
          animatable: true,
        },
        {
          name: 'contrast',
          displayName: 'Contrast',
          type: EffectParameterType.Float,
          defaultValue: 1.0,
          min: 0.0,
          max: 3.0,
          step: 0.01,
          description: 'Contrast multiplier (0 to 3)',
          animatable: true,
        },
        {
          name: 'saturation',
          displayName: 'Saturation',
          type: EffectParameterType.Float,
          defaultValue: 1.0,
          min: 0.0,
          max: 3.0,
          step: 0.01,
          description: 'Saturation multiplier (0 to 3)',
          animatable: true,
        },
        {
          name: 'gamma',
          displayName: 'Gamma',
          type: EffectParameterType.Float,
          defaultValue: 1.0,
          min: 0.1,
          max: 4.0,
          step: 0.01,
          description: 'Gamma correction (0.1 to 4.0)',
          animatable: true,
        },
      ],
      shader: this.getColorCorrectionShader(),
      passes: 1,
      performance: {
        estimatedRenderTimeMs: 2.0,
        memoryUsageMB: 8.0,
      },
    })

    // Vignette Effect
    this.effectTypes.set('vignette', {
      name: 'vignette',
      displayName: 'Vignette',
      category: EffectCategory.Color,
      description: 'Adds a darkening vignette around the edges of the frame',
      parameters: [
        {
          name: 'intensity',
          displayName: 'Intensity',
          type: EffectParameterType.Float,
          defaultValue: 0.5,
          min: 0.0,
          max: 2.0,
          step: 0.01,
          description: 'Vignette intensity (0 to 2)',
          animatable: true,
        },
        {
          name: 'radius',
          displayName: 'Radius',
          type: EffectParameterType.Float,
          defaultValue: 0.8,
          min: 0.1,
          max: 2.0,
          step: 0.01,
          description: 'Vignette radius (0.1 to 2.0)',
          animatable: true,
        },
        {
          name: 'feather',
          displayName: 'Feather',
          type: EffectParameterType.Float,
          defaultValue: 0.5,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          description: 'Vignette edge softness (0 to 1)',
          animatable: true,
        },
      ],
      shader: this.getVignetteShader(),
      passes: 1,
      performance: {
        estimatedRenderTimeMs: 1.5,
        memoryUsageMB: 4.0,
      },
    })

    // Motion Blur Effect
    this.effectTypes.set('motion-blur', {
      name: 'motion-blur',
      displayName: 'Motion Blur',
      category: EffectCategory.Blur,
      description:
        'Creates motion blur based on object velocity and movement direction',
      parameters: [
        {
          name: 'intensity',
          displayName: 'Intensity',
          type: EffectParameterType.Float,
          defaultValue: 1.0,
          min: 0.0,
          max: 3.0,
          step: 0.1,
          description: 'Blur intensity based on velocity',
          animatable: true,
        },
        {
          name: 'samples',
          displayName: 'Samples',
          type: EffectParameterType.Int,
          defaultValue: 8,
          min: 4,
          max: 16,
          step: 1,
          description: 'Number of blur samples for quality',
          animatable: false,
        },
        {
          name: 'velocity_scale',
          displayName: 'Velocity Scale',
          type: EffectParameterType.Float,
          defaultValue: 1.0,
          min: 0.1,
          max: 5.0,
          step: 0.1,
          description: 'Scale factor for velocity-based blur',
          animatable: true,
        },
      ],
      shader: this.getMotionBlurShader(),
      passes: 2, // Velocity calculation + blur passes
      performance: {
        estimatedRenderTimeMs: 12.0,
        memoryUsageMB: 48.0,
      },
    })

    // Depth of Field Effect
    this.effectTypes.set('depth-of-field', {
      name: 'depth-of-field',
      displayName: 'Depth of Field',
      category: EffectCategory.Blur,
      description:
        'Simulates camera focus with blur based on depth information',
      parameters: [
        {
          name: 'focus_distance',
          displayName: 'Focus Distance',
          type: EffectParameterType.Float,
          defaultValue: 0.5,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          description: 'Distance at which objects are in focus',
          animatable: true,
        },
        {
          name: 'focus_range',
          displayName: 'Focus Range',
          type: EffectParameterType.Float,
          defaultValue: 0.1,
          min: 0.0,
          max: 0.5,
          step: 0.01,
          description: 'Range around focus distance that stays sharp',
          animatable: true,
        },
        {
          name: 'blur_amount',
          displayName: 'Blur Amount',
          type: EffectParameterType.Float,
          defaultValue: 2.0,
          min: 0.0,
          max: 10.0,
          step: 0.1,
          description: 'Maximum blur amount for out-of-focus areas',
          animatable: true,
        },
        {
          name: 'aperture_blades',
          displayName: 'Aperture Blades',
          type: EffectParameterType.Int,
          defaultValue: 6,
          min: 3,
          max: 12,
          step: 1,
          description: 'Number of aperture blades for bokeh shape',
          animatable: false,
        },
      ],
      shader: this.getDepthOfFieldShader(),
      passes: 3, // Depth sampling + blur + composite passes
      performance: {
        estimatedRenderTimeMs: 18.0,
        memoryUsageMB: 64.0,
      },
    })

    // Particle System Effect
    this.effectTypes.set('particles', {
      name: 'particles',
      displayName: 'Particle System',
      category: EffectCategory.Generative,
      description: 'GPU-accelerated particle system with physics simulation',
      parameters: [
        {
          name: 'count',
          displayName: 'Particle Count',
          type: EffectParameterType.Int,
          defaultValue: 1000,
          min: 100,
          max: 10000,
          step: 100,
          description: 'Number of particles to simulate',
          animatable: false,
        },
        {
          name: 'lifetime',
          displayName: 'Lifetime',
          type: EffectParameterType.Float,
          defaultValue: 2.0,
          min: 0.5,
          max: 10.0,
          step: 0.1,
          description: 'Particle lifetime in seconds',
          animatable: true,
        },
        {
          name: 'gravity',
          displayName: 'Gravity',
          type: EffectParameterType.Point,
          defaultValue: { x: 0.0, y: -9.8 },
          description: 'Gravity vector for particle physics',
          animatable: true,
        },
        {
          name: 'start_velocity',
          displayName: 'Start Velocity',
          type: EffectParameterType.Point,
          defaultValue: { x: 0.0, y: 5.0 },
          description: 'Initial velocity for new particles',
          animatable: true,
        },
        {
          name: 'color_over_time',
          displayName: 'Color Over Time',
          type: EffectParameterType.Color,
          defaultValue: [
            { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
            { r: 1.0, g: 0.5, b: 0.0, a: 0.8 },
            { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          ],
          description: 'Color gradient over particle lifetime',
          animatable: false,
        },
      ],
      shader: this.getParticleShader(),
      passes: 2, // Physics simulation + rendering passes
      performance: {
        estimatedRenderTimeMs: 15.0,
        memoryUsageMB: 96.0,
      },
    })

    // Transition Effects
    this.effectTypes.set('crossfade', {
      name: 'crossfade',
      displayName: 'Crossfade',
      category: EffectCategory.Composite,
      description:
        'Smooth transition between two layers with customizable easing',
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
          name: 'easing',
          displayName: 'Easing',
          type: EffectParameterType.Enum,
          defaultValue: 'ease-in-out',
          options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
          description: 'Easing function for transition',
          animatable: false,
        },
      ],
      shader: this.getCrossfadeShader(),
      passes: 1,
      performance: {
        estimatedRenderTimeMs: 2.0,
        memoryUsageMB: 8.0,
      },
    })

    // Initialize some default presets
    this.initializeDefaultPresets()
  }

  private initializeDefaultPresets(): void {
    // Glow presets
    this.presets.set('glow-subtle', {
      id: 'glow-subtle',
      name: 'Subtle Glow',
      description: 'Soft, subtle glow for highlights',
      effectType: 'glow',
      parameters: {
        intensity: 0.5,
        radius: 8.0,
        color: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        quality: 'medium',
      },
      category: 'professional',
    })

    this.presets.set('glow-dramatic', {
      id: 'glow-dramatic',
      name: 'Dramatic Glow',
      description: 'Strong, dramatic glow effect',
      effectType: 'glow',
      parameters: {
        intensity: 2.0,
        radius: 20.0,
        color: { r: 1.0, g: 0.8, b: 0.4, a: 1.0 },
        quality: 'high',
      },
      category: 'creative',
    })

    // Blur presets
    this.presets.set('blur-light', {
      id: 'blur-light',
      name: 'Light Blur',
      description: 'Subtle blur for depth of field',
      effectType: 'gaussian-blur',
      parameters: {
        radius: 3.0,
        quality: 'medium',
      },
      category: 'professional',
    })

    // Color correction presets
    this.presets.set('color-vintage', {
      id: 'color-vintage',
      name: 'Vintage Look',
      description: 'Warm, vintage color grading',
      effectType: 'color-correction',
      parameters: {
        brightness: -0.1,
        contrast: 1.2,
        saturation: 0.8,
        gamma: 1.1,
      },
      category: 'creative',
    })

    this.presets.set('color-cinematic', {
      id: 'color-cinematic',
      name: 'Cinematic',
      description: 'Professional cinematic color grade',
      effectType: 'color-correction',
      parameters: {
        brightness: 0.0,
        contrast: 1.3,
        saturation: 1.1,
        gamma: 1.0,
      },
      category: 'professional',
    })

    // Motion blur presets
    this.presets.set('motion-blur-subtle', {
      id: 'motion-blur-subtle',
      name: 'Subtle Motion Blur',
      description: 'Light motion blur for smooth movement',
      effectType: 'motion-blur',
      parameters: {
        intensity: 0.5,
        samples: 8,
        velocity_scale: 1.0,
      },
      category: 'professional',
    })

    this.presets.set('motion-blur-dramatic', {
      id: 'motion-blur-dramatic',
      name: 'Dramatic Motion Blur',
      description: 'Strong motion blur for dynamic effects',
      effectType: 'motion-blur',
      parameters: {
        intensity: 2.0,
        samples: 12,
        velocity_scale: 2.0,
      },
      category: 'creative',
    })

    // Depth of field presets
    this.presets.set('dof-portrait', {
      id: 'dof-portrait',
      name: 'Portrait Focus',
      description: 'Shallow depth of field for portrait photography',
      effectType: 'depth-of-field',
      parameters: {
        focus_distance: 0.3,
        focus_range: 0.05,
        blur_amount: 3.0,
        aperture_blades: 8,
      },
      category: 'professional',
    })

    this.presets.set('dof-landscape', {
      id: 'dof-landscape',
      name: 'Landscape Focus',
      description: 'Deep depth of field for landscape photography',
      effectType: 'depth-of-field',
      parameters: {
        focus_distance: 0.6,
        focus_range: 0.3,
        blur_amount: 1.0,
        aperture_blades: 6,
      },
      category: 'professional',
    })

    // Particle presets
    this.presets.set('particles-fire', {
      id: 'particles-fire',
      name: 'Fire Particles',
      description: 'Warm fire-like particle effect',
      effectType: 'particles',
      parameters: {
        count: 2000,
        lifetime: 1.5,
        gravity: { x: 0.0, y: -2.0 },
        start_velocity: { x: 0.0, y: 8.0 },
        color_over_time: [
          { r: 1.0, g: 0.8, b: 0.2, a: 1.0 },
          { r: 1.0, g: 0.4, b: 0.0, a: 0.9 },
          { r: 0.2, g: 0.1, b: 0.0, a: 0.0 },
        ],
      },
      category: 'creative',
    })

    this.presets.set('particles-snow', {
      id: 'particles-snow',
      name: 'Snow Particles',
      description: 'Gentle falling snow effect',
      effectType: 'particles',
      parameters: {
        count: 1000,
        lifetime: 5.0,
        gravity: { x: 0.0, y: -1.0 },
        start_velocity: { x: 0.0, y: 2.0 },
        color_over_time: [
          { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
          { r: 0.9, g: 0.9, b: 1.0, a: 0.8 },
          { r: 0.8, g: 0.8, b: 1.0, a: 0.0 },
        ],
      },
      category: 'creative',
    })

    // Crossfade presets
    this.presets.set('crossfade-smooth', {
      id: 'crossfade-smooth',
      name: 'Smooth Crossfade',
      description: 'Smooth transition with ease-in-out',
      effectType: 'crossfade',
      parameters: {
        progress: 0.5,
        easing: 3, // ease-in-out
      },
      category: 'professional',
    })

    this.presets.set('crossfade-fast', {
      id: 'crossfade-fast',
      name: 'Fast Crossfade',
      description: 'Quick transition with linear easing',
      effectType: 'crossfade',
      parameters: {
        progress: 0.5,
        easing: 0, // linear
      },
      category: 'professional',
    })
  }

  private getGlowShader(): string {
    return `
      struct GlowParams {
        intensity: f32,
        radius: f32,
        color: vec4<f32>,
      }

      @group(0) @binding(0) var inputTexture: texture_2d<f32>;
      @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(1) @binding(0) var<uniform> params: GlowParams;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(id.xy);
        let texSize = vec2<f32>(textureDimensions(inputTexture));
        let uv = coord / texSize;

        // Sample original texture
        let original = textureLoad(inputTexture, id.xy, 0);

        // Create glow by sampling surrounding pixels
        var glow = vec4<f32>(0.0);
        let radius = i32(params.radius);

        for (var y = -radius; y <= radius; y++) {
          for (var x = -radius; x <= radius; x++) {
            let offset = vec2<i32>(x, y);
            let sampleCoord = vec2<i32>(id.xy) + offset;

            if (sampleCoord.x >= 0 && sampleCoord.x < i32(texSize.x) &&
                sampleCoord.y >= 0 && sampleCoord.y < i32(texSize.y)) {
              let sample = textureLoad(inputTexture, sampleCoord, 0);
              let distance = f32(max(abs(x), abs(y)));
              let weight = exp(-distance * distance / (2.0 * params.radius * params.radius));

              glow += sample * weight;
            }
          }
        }

        let glowCount = f32((radius * 2 + 1) * (radius * 2 + 1));
        glow /= glowCount;

        // Mix glow with original based on intensity
        let result = mix(original, glow * params.color, params.intensity * 0.2);
        textureStore(outputTexture, id.xy, result);
      }
    `
  }

  private getGaussianBlurShader(): string {
    return `
      struct BlurParams {
        radius: f32,
        direction: vec2<f32>,
      }

      @group(0) @binding(0) var inputTexture: texture_2d<f32>;
      @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(1) @binding(0) var<uniform> params: BlurParams;

      // Gaussian weights for different radii
      fn getGaussianWeight(distance: f32) -> f32 {
        // Simplified Gaussian weights
        let weights = array<f32, 13>(
          0.227027, 0.194594, 0.121621, 0.054054, 0.016216,
          0.003691, 0.000629, 0.000081, 0.000008, 0.000001,
          0.000000, 0.000000, 0.000000
        );
        let index = i32(distance);
        if (index >= 0 && index < 13) {
          return weights[index];
        }
        return 0.0;
      }

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(id.xy);
        let texSize = vec2<f32>(textureDimensions(inputTexture));
        let uv = coord / texSize;

        let original = textureLoad(inputTexture, id.xy, 0);
        var blurred = vec4<f32>(0.0);
        var totalWeight = 0.0;

        let radius = i32(params.radius);

        for (var i = -radius; i <= radius; i++) {
          let offset = vec2<f32>(f32(i) * params.direction.x, f32(i) * params.direction.y);
          let sampleCoord = coord + offset;

          if (sampleCoord.x >= 0.0 && sampleCoord.x < texSize.x &&
              sampleCoord.y >= 0.0 && sampleCoord.y < texSize.y) {
            let sample = textureLoad(inputTexture, vec2<u32>(sampleCoord), 0);
            let distance = abs(f32(i));
            let weight = getGaussianWeight(distance);
            blurred += sample * weight;
            totalWeight += weight;
          }
        }

        if (totalWeight > 0.0) {
          blurred /= totalWeight;
        }

        textureStore(outputTexture, id.xy, blurred);
      }
    `
  }

  private getColorCorrectionShader(): string {
    return `
      struct ColorCorrectionParams {
        brightness: f32,
        contrast: f32,
        saturation: f32,
        gamma: f32,
      }

      @group(0) @binding(0) var inputTexture: texture_2d<f32>;
      @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(1) @binding(0) var<uniform> params: ColorCorrectionParams;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let original = textureLoad(inputTexture, id.xy, 0);

        // Apply brightness
        var color = original.rgb + params.brightness;

        // Apply contrast
        color = (color - 0.5) * params.contrast + 0.5;

        // Apply saturation
        let gray = dot(color, vec3<f32>(0.299, 0.587, 0.114));
        color = mix(vec3<f32>(gray), color, params.saturation);

        // Apply gamma
        color = pow(color, vec3<f32>(1.0 / params.gamma));

        let result = vec4<f32>(color, original.a);
        textureStore(outputTexture, id.xy, result);
      }
    `
  }

  private getVignetteShader(): string {
    return `
      struct VignetteParams {
        intensity: f32,
        radius: f32,
        feather: f32,
      }

      @group(0) @binding(0) var inputTexture: texture_2d<f32>;
      @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(1) @binding(0) var<uniform> params: VignetteParams;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(id.xy);
        let texSize = vec2<f32>(textureDimensions(inputTexture));
        let uv = coord / texSize;

        let original = textureLoad(inputTexture, id.xy, 0);

        // Calculate distance from center
        let center = texSize * 0.5;
        let distance = distance(coord, center);
        let maxDistance = length(center);

        // Create vignette mask
        let normalizedDistance = distance / maxDistance;
        let vignette = 1.0 - smoothstep(params.radius, params.radius + params.feather, normalizedDistance);

        // Apply vignette
        let darkened = original.rgb * pow(vignette, params.intensity);
        let result = vec4<f32>(darkened, original.a);

        textureStore(outputTexture, id.xy, result);
      }
    `
  }

  private getMotionBlurShader(): string {
    return `
      struct MotionBlurParams {
        intensity: f32,
        samples: i32,
        velocity_scale: f32,
      }

      @group(0) @binding(0) var inputTexture: texture_2d<f32>;
      @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(1) @binding(0) var<uniform> params: MotionBlurParams;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(id.xy);
        let texSize = vec2<f32>(textureDimensions(inputTexture));
        let uv = coord / texSize;

        // Sample current frame
        let current = textureLoad(inputTexture, id.xy, 0);

        // Simulate motion blur by sampling along velocity direction
        var blurred = vec4<f32>(0.0);
        let sampleCount = f32(params.samples);

        for (var i = 0; i < params.samples; i++) {
          let t = f32(i) / (sampleCount - 1.0) - 0.5; // Center around current frame
          let sampleUv = uv; // In a real implementation, this would use velocity buffer

          if (sampleUv.x >= 0.0 && sampleUv.x <= 1.0 &&
              sampleUv.y >= 0.0 && sampleUv.y <= 1.0) {
            let sampleCoord = vec2<u32>(sampleUv * texSize);
            let sample = textureLoad(inputTexture, sampleCoord, 0);
            blurred += sample;
          }
        }

        blurred /= sampleCount;
        let result = mix(current, blurred, params.intensity);
        textureStore(outputTexture, id.xy, result);
      }
    `
  }

  private getDepthOfFieldShader(): string {
    return `
      struct DepthOfFieldParams {
        focus_distance: f32,
        focus_range: f32,
        blur_amount: f32,
        aperture_blades: i32,
      }

      @group(0) @binding(0) var inputTexture: texture_2d<f32>;
      @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(1) @binding(0) var<uniform> params: DepthOfFieldParams;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(id.xy);
        let texSize = vec2<f32>(textureDimensions(inputTexture));
        let uv = coord / texSize;

        // Sample original texture
        let original = textureLoad(inputTexture, id.xy, 0);

        // Calculate focus based on depth (simplified - would use depth buffer in practice)
        let depth = length(uv - vec2<f32>(0.5, 0.5)); // Simplified depth calculation
        let focusDiff = abs(depth - params.focus_distance);

        if (focusDiff < params.focus_range) {
          // In focus - no blur
          textureStore(outputTexture, id.xy, original);
        } else {
          // Out of focus - apply blur
          var blurred = vec4<f32>(0.0);
          let blurRadius = (focusDiff - params.focus_range) * params.blur_amount;
          let samples = i32(ceil(blurRadius * 2.0));

          for (var y = -samples; y <= samples; y++) {
            for (var x = -samples; x <= samples; x++) {
              let offset = vec2<f32>(f32(x), f32(y));
              let distance = length(offset);

              if (distance <= blurRadius) {
                let sampleCoord = vec2<i32>(id.xy) + vec2<i32>(offset);
                if (sampleCoord.x >= 0 && sampleCoord.x < i32(texSize.x) &&
                    sampleCoord.y >= 0 && sampleCoord.y < i32(texSize.y)) {
                  let sample = textureLoad(inputTexture, sampleCoord, 0);
                  let weight = 1.0 - (distance / blurRadius);
                  blurred += sample * weight;
                }
              }
            }
          }

          let sampleCount = f32((samples * 2 + 1) * (samples * 2 + 1));
          blurred /= sampleCount;
          textureStore(outputTexture, id.xy, blurred);
        }
      }
    `
  }

  private getParticleShader(): string {
    return `
      struct ParticleParams {
        count: i32,
        lifetime: f32,
        gravity: vec2<f32>,
        start_velocity: vec2<f32>,
        color_over_time: array<vec4<f32>, 3>,
      }

      @group(0) @binding(0) var inputTexture: texture_2d<f32>;
      @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(1) @binding(0) var<uniform> params: ParticleParams;

      // Particle data would typically be in a separate buffer
      // This is a simplified implementation showing the concept

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let coord = vec2<f32>(id.xy);
        let texSize = vec2<f32>(textureDimensions(inputTexture));

        // Sample original texture
        let original = textureLoad(inputTexture, id.xy, 0);

        // Simplified particle rendering
        // In a real implementation, this would:
        // 1. Read particle positions from a buffer
        // 2. Update particle physics
        // 3. Render particles as sprites or points

        var result = original;

        // Add some particle-like effects for demonstration
        let time = f32(id.x) * 0.01; // Simplified time
        let particlePos = vec2<f32>(
          sin(time) * 0.3 + 0.5,
          cos(time * 1.3) * 0.3 + 0.5
        );

        let screenPos = particlePos * texSize;
        let distance = length(coord - screenPos);

        if (distance < 5.0) {
          let alpha = 1.0 - (distance / 5.0);
          let particleColor = vec4<f32>(1.0, 0.5, 0.0, alpha * 0.8);
          result = mix(result, particleColor, alpha);
        }

        textureStore(outputTexture, id.xy, result);
      }
    `
  }

  private getCrossfadeShader(): string {
    return `
      struct CrossfadeParams {
        progress: f32,
        easing: i32, // 0=linear, 1=ease-in, 2=ease-out, 3=ease-in-out
      }

      @group(0) @binding(0) var fromTexture: texture_2d<f32>;
      @group(0) @binding(1) var toTexture: texture_2d<f32>;
      @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(1) @binding(0) var<uniform> params: CrossfadeParams;

      fn easeInOut(t: f32) -> f32 {
        return select(select(2.0 * t * t, -2.0 * t * t + 4.0 * t - 1.0, t < 0.5), 1.0, t >= 1.0);
      }

      fn easeIn(t: f32) -> f32 {
        return t * t;
      }

      fn easeOut(t: f32) -> f32 {
        return 1.0 - (1.0 - t) * (1.0 - t);
      }

      fn applyEasing(t: f32, easingType: i32) -> f32 {
        switch easingType {
          case 0: { return t; }
          case 1: { return easeIn(t); }
          case 2: { return easeOut(t); }
          case 3: { return easeInOut(t); }
          default: { return t; }
        }
      }

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let fromColor = textureLoad(fromTexture, id.xy, 0);
        let toColor = textureLoad(toTexture, id.xy, 0);

        let easedProgress = applyEasing(params.progress, params.easing);
        let result = mix(fromColor, toColor, easedProgress);

        textureStore(outputTexture, id.xy, result);
      }
    `
  }
}
