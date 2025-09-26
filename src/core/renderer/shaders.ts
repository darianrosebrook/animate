/**
 * @fileoverview WGSL Shader Library for 2D Graphics
 * @author @darianrosebrook
 */

/**
 * Basic 2D shape rendering shaders
 */

/**
 * Rectangle vertex shader
 */
export const rectangleVertexShader = `
struct VertexInput {
  @location(0) position: vec2<f32>,
  @location(1) texCoord: vec2<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
}

struct Uniforms {
  transform: mat4x4<f32>,
  color: vec4<f32>,
  size: vec2<f32>,
  position: vec2<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  // Apply transform
  let transformedPos = uniforms.transform * vec4<f32>(input.position, 0.0, 1.0);

  // Apply position offset
  output.position = vec4<f32>(
    transformedPos.x + uniforms.position.x,
    transformedPos.y + uniforms.position.y,
    transformedPos.z,
    transformedPos.w
  );

  output.texCoord = input.texCoord;
  return output;
}
`

/**
 * Rectangle fragment shader
 */
export const rectangleFragmentShader = `
struct FragmentInput {
  @location(0) texCoord: vec2<f32>,
}

struct Uniforms {
  transform: mat4x4<f32>,
  color: vec4<f32>,
  size: vec2<f32>,
  position: vec2<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  // Simple rectangle rendering with rounded corners
  let halfSize = uniforms.size * 0.5;
  let center = vec2<f32>(0.5, 0.5);

  // Calculate distance from center
  let dist = distance(input.texCoord, center);

  // Apply rounded corners (simplified)
  let cornerRadius = 0.1; // Could be made uniform
  let roundedDist = dist - cornerRadius;

  // Create rounded rectangle
  if (roundedDist > 0.0) {
    discard;
  }

  return uniforms.color;
}
`

/**
 * Circle vertex shader
 */
export const circleVertexShader = `
struct VertexInput {
  @location(0) position: vec2<f32>,
  @location(1) texCoord: vec2<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
}

struct Uniforms {
  transform: mat4x4<f32>,
  color: vec4<f32>,
  size: vec2<f32>,
  position: vec2<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  // Apply transform
  let transformedPos = uniforms.transform * vec4<f32>(input.position, 0.0, 1.0);

  // Apply position offset
  output.position = vec4<f32>(
    transformedPos.x + uniforms.position.x,
    transformedPos.y + uniforms.position.y,
    transformedPos.z,
    transformedPos.w
  );

  output.texCoord = input.texCoord;
  return output;
}
`

/**
 * Circle fragment shader
 */
export const circleFragmentShader = `
struct FragmentInput {
  @location(0) texCoord: vec2<f32>,
}

struct Uniforms {
  transform: mat4x4<f32>,
  color: vec4<f32>,
  size: vec2<f32>,
  position: vec2<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  // Calculate distance from center
  let center = vec2<f32>(0.5, 0.5);
  let dist = distance(input.texCoord, center);

  // Create circle
  let radius = 0.5;
  if (dist > radius) {
    discard;
  }

  return uniforms.color;
}
`

/**
 * Path/SVG vertex shader
 */
export const pathVertexShader = `
struct VertexInput {
  @location(0) position: vec2<f32>,
  @location(1) texCoord: vec2<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
}

struct Uniforms {
  transform: mat4x4<f32>,
  color: vec4<f32>,
  size: vec2<f32>,
  position: vec2<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  // Apply transform
  let transformedPos = uniforms.transform * vec4<f32>(input.position, 0.0, 1.0);

  // Apply position offset
  output.position = vec4<f32>(
    transformedPos.x + uniforms.position.x,
    transformedPos.y + uniforms.position.y,
    transformedPos.z,
    transformedPos.w
  );

  output.texCoord = input.texCoord;
  return output;
}
`

/**
 * Path/SVG fragment shader
 */
export const pathFragmentShader = `
struct FragmentInput {
  @location(0) texCoord: vec2<f32>,
}

struct Uniforms {
  transform: mat4x4<f32>,
  color: vec4<f32>,
  size: vec2<f32>,
  position: vec2<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  // For now, just render as filled shape
  // TODO: Implement proper SVG path rendering
  return uniforms.color;
}
`

/**
 * Shader compilation and management
 */
export class ShaderManager {
  private device: GPUDevice
  private compiledShaders: Map<string, GPUShaderModule> = new Map()

  constructor(device: GPUDevice) {
    this.device = device
  }

  /**
   * Compile a WGSL shader
   */
  compileShader(code: string, label?: string): GPUShaderModule {
    const shaderModule = this.device.createShaderModule({
      code,
      label,
    })

    // Store for reuse
    const key = this.getShaderKey(code)
    this.compiledShaders.set(key, shaderModule)

    return shaderModule
  }

  /**
   * Get compiled shader or compile if not cached
   */
  getShader(code: string, label?: string): GPUShaderModule {
    const key = this.getShaderKey(code)
    let shader = this.compiledShaders.get(key)

    if (!shader) {
      shader = this.compileShader(code, label)
    }

    return shader
  }

  /**
   * Create a render pipeline with shaders
   */
  createPipeline(
    vertexShader: string,
    fragmentShader: string,
    bindGroupLayouts: GPUBindGroupLayout[] = [],
    targets: GPUColorTargetState[] = []
  ): GPURenderPipeline {
    const vertexModule = this.getShader(vertexShader, 'Vertex Shader')
    const fragmentModule = this.getShader(fragmentShader, 'Fragment Shader')

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts,
    })

    return this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertexModule,
        entryPoint: 'main',
      },
      fragment: {
        module: fragmentModule,
        entryPoint: 'main',
        targets,
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none',
      },
    })
  }

  /**
   * Generate shader key for caching
   */
  private getShaderKey(code: string): string {
    // Simple hash for caching (in production, use proper hashing)
    let hash = 0
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  /**
   * Clean up compiled shaders
   */
  destroy(): void {
    this.compiledShaders.clear()
  }
}
