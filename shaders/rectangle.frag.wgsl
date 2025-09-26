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
