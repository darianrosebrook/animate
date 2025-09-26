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
}

#[wasm_bindgen]
impl AnimatorEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> AnimatorEngine {
        console_error_panic_hook::set_once();

        AnimatorEngine {
            scene_graph: Vec::new(),
        }
    }

    /// Initialize the engine and set up WebGL context
    #[wasm_bindgen]
    pub fn initialize(&mut self) -> Result<(), JsValue> {
        console_log!("Animator engine initializing...");

        // TODO: Initialize WebGPU context
        // TODO: Set up shader compilation
        // TODO: Initialize render pipeline

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
    pub fn render_frame(&self, context: &RenderContext) -> Result<JsValue, JsValue> {
        console_log!("Rendering frame at time: {}", context.time);

        // TODO: Implement actual rendering logic
        // For now, return a simple frame buffer representation

        let frame_data = js_sys::Object::new();
        js_sys::Reflect::set(&frame_data, &"width".into(), &context.width.into())?;
        js_sys::Reflect::set(&frame_data, &"height".into(), &context.height.into())?;
        js_sys::Reflect::set(&frame_data, &"timestamp".into(), &context.time.into())?;

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

        // TODO: Implement scene evaluation logic
        let result = js_sys::Object::new();
        js_sys::Reflect::set(&result, &"time".into(), &time.into())?;
        js_sys::Reflect::set(&result, &"node_count".into(), &(self.scene_graph.len() as u32).into())?;

        Ok(result.into())
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
