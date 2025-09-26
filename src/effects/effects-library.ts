/**
 * @fileoverview Effects Library with Built-in Professional Effects
 * @author @darianrosebrook
 */

import { Result, AnimatorError } from '@/types'
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
      return presets.filter(p => p.effectType === effectType)
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
      description: 'Creates a soft glow around objects with customizable intensity and color',
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
      description: 'High-quality Gaussian blur with configurable radius and quality',
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
      description: 'Professional color grading with brightness, contrast, and saturation controls',
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
}
