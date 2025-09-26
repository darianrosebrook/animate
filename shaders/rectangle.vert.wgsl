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
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput;

    // Generate quad vertices
    var positions = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 0.0),
        vec2<f32>(1.0, 0.0),
        vec2<f32>(0.0, 1.0),
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 0.0),
        vec2<f32>(1.0, 1.0)
    );

    var texCoords = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 0.0),
        vec2<f32>(1.0, 0.0),
        vec2<f32>(0.0, 1.0),
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 0.0),
        vec2<f32>(1.0, 1.0)
    );

    let pos = positions[vertexIndex];
    let texCoord = texCoords[vertexIndex];

    // Apply transform and position
    let worldPos = uniforms.transform * vec4<f32>(pos * uniforms.size, 0.0, 1.0);
    output.position = vec4<f32>(worldPos.x + uniforms.position.x, worldPos.y + uniforms.position.y, 0.0, 1.0);
    output.texCoord = texCoord;

    return output;
}
