/**
 * @fileoverview Animator Core Engine - Rust WASM module
 * @author @darianrosebrook
 */

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use thiserror::Error;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

/// Core error types for the Animator engine
#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub enum AnimatorError {
    #[error("Node not found: {node_id}")]
    NodeNotFound { node_id: String },
    #[error("Invalid property: {property}")]
    InvalidProperty { property: String },
    #[error("Render error: {message}")]
    RenderError { message: String },
    #[error("Evaluation error: {message}")]
    EvaluationError { message: String },
}

impl From<AnimatorError> for JsValue {
    fn from(error: AnimatorError) -> Self {
        JsValue::from_str(&error.to_string())
    }
}

/// Core types for the scene graph
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point2D {
    pub x: f32,
    pub y: f32,
}

#[wasm_bindgen]
impl Point2D {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f32, y: f32) -> Point2D {
        Point2D { x, y }
    }
}

/// Core scene node representation
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneNode {
    pub id: String,
    pub name: String,
    pub node_type: String,
    pub properties: JsValue,
}

#[wasm_bindgen]
impl SceneNode {
    #[wasm_bindgen(constructor)]
    pub fn new(id: &str, name: &str, node_type: &str) -> SceneNode {
        SceneNode {
            id: id.to_string(),
            name: name.to_string(),
            node_type: node_type.to_string(),
            properties: JsValue::NULL,
        }
    }
}

/// Core rendering context
#[wasm_bindgen]
pub struct RenderContext {
    pub time: f64,
    pub frame_rate: f64,
    pub width: u32,
    pub height: u32,
}

#[wasm_bindgen]
impl RenderContext {
    #[wasm_bindgen(constructor)]
    pub fn new(time: f64, frame_rate: f64, width: u32, height: u32) -> RenderContext {
        RenderContext {
            time,
            frame_rate,
            width,
            height,
        }
    }
}

/// Main Animator engine
#[wasm_bindgen]
pub struct AnimatorEngine {
    scene_graph: Vec<SceneNode>,
    gpu_device: Option<wgpu::Device>,
    gpu_queue: Option<wgpu::Queue>,
    render_pipeline: Option<wgpu::RenderPipeline>,
    shader_modules: std::collections::HashMap<String, wgpu::ShaderModule>,
}

#[wasm_bindgen]
impl AnimatorEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> AnimatorEngine {
        console_error_panic_hook::set_once();

        AnimatorEngine {
            scene_graph: Vec::new(),
            gpu_device: None,
            gpu_queue: None,
            render_pipeline: None,
            shader_modules: std::collections::HashMap::new(),
        }
    }

    /// Initialize the engine and set up WebGPU context
    #[wasm_bindgen]
    pub async fn initialize(&mut self) -> Result<(), JsValue> {
        console_log!("Animator engine initializing...");

        // Initialize WebGPU context
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::BROWSER_WEBGPU | wgpu::Backends::GL,
            dx12_shader_compiler: Default::default(),
        });

        let window = web_sys::window().ok_or("No global `window` exists")?;
        let document = window.document().ok_or("Should have a document on window")?;
        let canvas = document
            .get_element_by_id("animator-canvas")
            .ok_or("No canvas element found")?
            .dyn_into::<web_sys::HtmlCanvasElement>()
            .map_err(|_| "Canvas element is not an HtmlCanvasElement")?;

        let surface = instance.create_surface_from_canvas(&canvas)
            .map_err(|e| format!("Failed to create surface: {:?}", e))?;

        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: Some(&surface),
                force_fallback_adapter: false,
            })
            .await
            .ok_or("Failed to find an appropriate adapter")?;

        let (device, queue) = adapter
            .request_device(
                &wgpu::DeviceDescriptor {
                    features: wgpu::Features::empty(),
                    limits: wgpu::Limits::default(),
                    label: Some("Animator Device"),
                },
                None,
            )
            .await
            .map_err(|e| format!("Failed to create device: {:?}", e))?;

        // Configure the surface
        let surface_caps = surface.get_capabilities(&adapter);
        let surface_format = surface_caps.formats[0];

        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format: surface_format,
            width: canvas.width(),
            height: canvas.height(),
            present_mode: surface_caps.present_modes[0],
            alpha_mode: surface_caps.alpha_modes[0],
            view_formats: vec![],
        };

        surface.configure(&device, &config);

        // Create shader modules for basic 2D rendering
        let rectangle_vs_module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("Rectangle Vertex Shader"),
            source: wgpu::ShaderSource::Wgsl(include_str!("../../shaders/rectangle.vert.wgsl").into()),
        });

        let rectangle_fs_module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("Rectangle Fragment Shader"),
            source: wgpu::ShaderSource::Wgsl(include_str!("../../shaders/rectangle.frag.wgsl").into()),
        });

        // Create render pipeline
        let render_pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("Render Pipeline Layout"),
            bind_group_layouts: &[],
            push_constant_ranges: &[],
        });

        let render_pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("Render Pipeline"),
            layout: Some(&render_pipeline_layout),
            vertex: wgpu::VertexState {
                module: &rectangle_vs_module,
                entry_point: "main",
                buffers: &[],
            },
            fragment: Some(wgpu::FragmentState {
                module: &rectangle_fs_module,
                entry_point: "main",
                targets: &[Some(wgpu::ColorTargetState {
                    format: config.format,
                    blend: Some(wgpu::BlendState::REPLACE),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::TriangleList,
                strip_index_format: None,
                front_face: wgpu::FrontFace::Ccw,
                cull_mode: Some(wgpu::Face::Back),
                polygon_mode: wgpu::PolygonMode::Fill,
                unclipped_depth: false,
                conservative: false,
            },
            depth_stencil: None,
            multisample: wgpu::MultisampleState {
                count: 1,
                mask: !0,
                alpha_to_coverage_enabled: false,
            },
            multiview: None,
        });

        // Store GPU resources
        self.gpu_device = Some(device);
        self.gpu_queue = Some(queue);
        self.render_pipeline = Some(render_pipeline);
        self.shader_modules.insert("rectangle_vs".to_string(), rectangle_vs_module);
        self.shader_modules.insert("rectangle_fs".to_string(), rectangle_fs_module);

        console_log!("WebGPU context initialized successfully");
        Ok(())
    }

    /// Add a node to the scene graph
    #[wasm_bindgen]
    pub fn add_node(&mut self, node: SceneNode) -> Result<(), JsValue> {
        console_log!("Adding node: {}", node.name);
        self.scene_graph.push(node);
        Ok(())
    }

    /// Render a frame
    #[wasm_bindgen]
    pub async fn render_frame(&self, context: &RenderContext) -> Result<JsValue, JsValue> {
        console_log!("Rendering frame at time: {}", context.time);

        // Get GPU resources
        let device = self.gpu_device.as_ref()
            .ok_or("GPU device not initialized")?;
        let queue = self.gpu_queue.as_ref()
            .ok_or("GPU queue not initialized")?;
        let pipeline = self.render_pipeline.as_ref()
            .ok_or("Render pipeline not initialized")?;

        // Get the window and canvas
        let window = web_sys::window().ok_or("No global `window` exists")?;
        let document = window.document().ok_or("Should have a document on window")?;
        let canvas = document
            .get_element_by_id("animator-canvas")
            .ok_or("No canvas element found")?
            .dyn_into::<web_sys::HtmlCanvasElement>()
            .map_err(|_| "Canvas element is not an HtmlCanvasElement")?;

        // Get the surface (we need to recreate it since it's not stored)
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::BROWSER_WEBGPU | wgpu::Backends::GL,
            dx12_shader_compiler: Default::default(),
        });

        let surface = instance.create_surface_from_canvas(&canvas)
            .map_err(|e| format!("Failed to create surface: {:?}", e))?;

        // Get current surface texture
        let output = surface.get_current_texture()
            .map_err(|e| format!("Failed to get surface texture: {:?}", e))?;

        let view = output.texture.create_view(&wgpu::TextureViewDescriptor::default());

        // Create command encoder
        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("Render Encoder"),
        });

        // Begin render pass
        {
            let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("Render Pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(wgpu::Color {
                            r: 0.1,
                            g: 0.1,
                            b: 0.1,
                            a: 1.0,
                        }),
                        store: true,
                    },
                })],
                depth_stencil_attachment: None,
            });

            // Set render pipeline and draw a test rectangle
            render_pass.set_pipeline(pipeline);

            // For now, draw a simple test rectangle
            // In a real implementation, this would iterate through scene graph nodes
            render_pass.draw(0..6, 0..1);
        }

        // Submit commands
        queue.submit(std::iter::once(encoder.finish()));
        output.present();

        // Return frame metadata
        let frame_data = js_sys::Object::new();
        js_sys::Reflect::set(&frame_data, &"width".into(), &context.width.into())?;
        js_sys::Reflect::set(&frame_data, &"height".into(), &context.height.into())?;
        js_sys::Reflect::set(&frame_data, &"timestamp".into(), &context.time.into())?;
        js_sys::Reflect::set(&frame_data, &"rendered".into(), &true.into())?;

        Ok(frame_data.into())
    }

    /// Get the current scene graph
    #[wasm_bindgen]
    pub fn get_scene_graph(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.scene_graph)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Evaluate the scene at a specific time
    #[wasm_bindgen]
    pub fn evaluate_scene(&self, time: f64) -> Result<JsValue, JsValue> {
        console_log!("Evaluating scene at time: {}", time);

        // Scene evaluation implementation
        // For now, return basic evaluated scene state
        let mut evaluated_nodes = Vec::new();

        // Traverse scene graph and evaluate each node
        for node in &self.scene_graph {
            let evaluated_node = self.evaluate_node(node, time)?;
            evaluated_nodes.push(evaluated_node);
        }

        // Create evaluation result
        let result = js_sys::Object::new();
        js_sys::Reflect::set(&result, &"time".into(), &time.into())?;
        js_sys::Reflect::set(&result, &"node_count".into(), &(evaluated_nodes.len() as u32).into())?;
        js_sys::Reflect::set(&result, &"nodes".into(), &serde_wasm_bindgen::to_value(&evaluated_nodes)?)?;

        Ok(result.into())
    }

    /// Evaluate a single scene node at the given time
    fn evaluate_node(&self, node: &SceneNode, time: f64) -> Result<SceneNode, JsValue> {
        console_log!("Evaluating node: {} at time: {}", node.id, time);

        // For now, return node with evaluated properties
        // In a full implementation, this would:
        // 1. Parse the properties JSON
        // 2. Evaluate animation curves for each property
        // 3. Apply time-based interpolation
        // 4. Handle hierarchical transforms

        let evaluated_properties = self.evaluate_properties(&node.properties, time)?;

        Ok(SceneNode {
            id: node.id.clone(),
            name: node.name.clone(),
            node_type: node.node_type.clone(),
            properties: evaluated_properties,
        })
    }

    /// Evaluate node properties at the given time
    fn evaluate_properties(&self, properties: &JsValue, time: f64) -> Result<JsValue, JsValue> {
        // Basic property evaluation - in production, implement proper animation curve evaluation
        // For now, return properties as-is since we don't have animation data structure yet

        // TODO: Implement proper property evaluation:
        // 1. Parse properties JSON to extract animation curves
        // 2. Evaluate each curve at the given time
        // 3. Handle different interpolation types (linear, bezier, etc.)
        // 4. Support hierarchical property evaluation

        Ok(properties.clone())
    }
}

/// Utility functions exposed to JavaScript
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Animator!", name)
}

#[wasm_bindgen]
pub fn version() -> String {
    "0.1.0".to_string()
}

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Animator WASM module initialized");
}
