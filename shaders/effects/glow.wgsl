/**
 * @fileoverview Glow Effect Shader (WGSL)
 * @description GPU-accelerated glow effect using multi-pass Gaussian blur
 * @author @darianrosebrook
 */

// Effect uniforms structure
struct GlowUniforms {
  resolution: vec2<f32>,
  intensity: f32,
  radius: f32,
  color: vec3<f32>,
  threshold: f32,
  time: f32,
  padding: f32,
}

@group(0) @binding(0) var<uniform> uniforms: GlowUniforms;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;
@group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var linearSampler: sampler;

/**
 * Calculate Gaussian blur weight for a given distance
 */
fn gaussianWeight(distance: f32, sigma: f32) -> f32 {
  let coefficient = 1.0 / sqrt(2.0 * 3.14159265359 * sigma * sigma);
  let exponent = -(distance * distance) / (2.0 * sigma * sigma);
  return coefficient * exp(exponent);
}

/**
 * Apply threshold to color - only bright areas glow
 */
fn applyThreshold(color: vec4<f32>, threshold: f32) -> vec4<f32> {
  let luminance = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114));
  if (luminance < threshold) {
    return vec4<f32>(0.0, 0.0, 0.0, color.a);
  }
  return color;
}

/**
 * Horizontal blur pass
 */
@compute @workgroup_size(8, 8)
fn horizontalBlur(@builtin(global_invocation_id) id: vec3<u32>) {
  let coord = vec2<f32>(f32(id.x), f32(id.y));
  let uv = coord / uniforms.resolution;
  
  // Check bounds
  if (coord.x >= uniforms.resolution.x || coord.y >= uniforms.resolution.y) {
    return;
  }
  
  // Calculate sigma from radius
  let sigma = uniforms.radius / 3.0;
  let kernelSize = i32(ceil(uniforms.radius * 2.0));
  
  var color = vec4<f32>(0.0);
  var totalWeight = 0.0;
  
  // Horizontal blur sampling
  for (var i = -kernelSize; i <= kernelSize; i++) {
    let offset = vec2<f32>(f32(i), 0.0) / uniforms.resolution;
    let sampleUV = uv + offset;
    
    // Clamp to texture bounds
    if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0) {
      let weight = gaussianWeight(f32(i), sigma);
      let sample = textureSampleLevel(inputTexture, linearSampler, sampleUV, 0.0);
      
      // Apply threshold to create glow from bright areas
      let thresholded = applyThreshold(sample, uniforms.threshold);
      
      color += thresholded * weight;
      totalWeight += weight;
    }
  }
  
  // Normalize
  if (totalWeight > 0.0) {
    color /= totalWeight;
  }
  
  // Apply color tint
  color = vec4<f32>(color.rgb * uniforms.color, color.a);
  
  textureStore(outputTexture, vec2<i32>(id.xy), color);
}

/**
 * Vertical blur pass
 */
@compute @workgroup_size(8, 8)
fn verticalBlur(@builtin(global_invocation_id) id: vec3<u32>) {
  let coord = vec2<f32>(f32(id.x), f32(id.y));
  let uv = coord / uniforms.resolution;
  
  // Check bounds
  if (coord.x >= uniforms.resolution.x || coord.y >= uniforms.resolution.y) {
    return;
  }
  
  // Calculate sigma from radius
  let sigma = uniforms.radius / 3.0;
  let kernelSize = i32(ceil(uniforms.radius * 2.0));
  
  var color = vec4<f32>(0.0);
  var totalWeight = 0.0;
  
  // Vertical blur sampling
  for (var i = -kernelSize; i <= kernelSize; i++) {
    let offset = vec2<f32>(0.0, f32(i)) / uniforms.resolution;
    let sampleUV = uv + offset;
    
    // Clamp to texture bounds
    if (sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
      let weight = gaussianWeight(f32(i), sigma);
      let sample = textureSampleLevel(inputTexture, linearSampler, sampleUV, 0.0);
      
      color += sample * weight;
      totalWeight += weight;
    }
  }
  
  // Normalize
  if (totalWeight > 0.0) {
    color /= totalWeight;
  }
  
  textureStore(outputTexture, vec2<i32>(id.xy), color);
}

/**
 * Composite pass - blend glow with original
 */
@compute @workgroup_size(8, 8)
fn composite(@builtin(global_invocation_id) id: vec3<u32>) {
  let coord = vec2<f32>(f32(id.x), f32(id.y));
  let uv = coord / uniforms.resolution;
  
  // Check bounds
  if (coord.x >= uniforms.resolution.x || coord.y >= uniforms.resolution.y) {
    return;
  }
  
  // Sample original and glow
  let original = textureSampleLevel(inputTexture, linearSampler, uv, 0.0);
  
  // Note: In multi-pass rendering, we'll have the blurred glow in a separate texture
  // For now, this is a placeholder for the composite logic
  let glow = vec4<f32>(0.0); // TODO: Sample from glow texture
  
  // Screen blend mode for glow
  let blended = original + glow * uniforms.intensity;
  
  // Preserve alpha
  let result = vec4<f32>(blended.rgb, original.a);
  
  textureStore(outputTexture, vec2<i32>(id.xy), result);
}

