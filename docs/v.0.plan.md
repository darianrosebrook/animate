# What a new compositing platform for motion designers must get right

If “Animator” signals multiplayer-first creation, predictable performance at scale, and a thriving platform, then a comprehensive motion design system must be built around four pillars: **real-time collaboration**, **deterministic GPU compositing**, **composable motion primitives**, and an **open, inspectable ecosystem** (files, plugins, render, review). Below is a systems view of the key functionality and the tech stack required to ship it.

---

## 1) Core authoring model: time-based scene graph, not a monolithic timeline

**Goal:** Replace traditional layer-stack models (fragile, order-dependent) with a **declarative scene graph** whose nodes are media, shapes, text, effects, rigs, and controllers. Time is a first-class dimension.

**Invariants**

* Every artifact is a node; nodes form a **directed acyclic graph** (compositing + dependency order).
* Time sampling is explicit: `sample(node, t, rate, interpolation) → Frame/Value`.
* Animations = curves on properties; constraints = expressions over node properties.
* Deterministic evaluation: same file + same inputs → identical frames on any machine.

**Enablers**

* **Graph & timeline views**: Dope sheet (keys in time), curve editor, node graph (dataflow), layer stack (view transform).
* **Parametric components** (“Motion Components”): reusable graphs with exposed ports (timing, easing, style tokens).
* **States & transitions**: a state machine layer (think Framer/SwiftUI transitions, but compositing-grade).
* **Constraints**: layout & rigging akin to blend-shape rigs/IK; 2D first, extensible to 2.5D/3D.

---

## 2) Real-time collaboration: CRDTs across time and space

**Goal:** Multiplayer editing that feels local, supports branching, review, and safe merges—at timeline scale.

**Invariants**

* **Conflict-free replicated data types (CRDTs)** (e.g., Yjs/Automerge) as the document substrate.
* **Subdocument sharding**: assets, sequences, components can be lazily loaded and independently versioned.
* **Branching/merging**: per-sequence or per-component branches; perceptual diffs for curves and frames.
* **Presence primitives**: remote cursors, selection mirrors, per-track locks, and “handoff” on hot properties.

**Capabilities**

* Commenting/annotations pinned to time, layer, keyframe, or pixel region.
* Review modes: compare takes (A/B), onion-skin of two branches, audio-synced comments.
* Role-based access: editor, reviewer, rigger, colorist; timeboxed “review rooms”.

---

## 3) GPU compositing & caching: speed as product philosophy

**Goal:** 60fps canvas interactions on complex graphs; near-instant scrubbing; predictable renders.

**Render pipeline**

* **WebGPU / wgpu** (Rust core → WASM for web; native via Vulkan/Metal/DirectX). WGSL/GLSL for kernels.
* **Tiled, multi-resolution cache** (pyramids/mipmaps) with invalidation keyed by node + time + params.
* **Node fusion & scheduling**: topologically sort effects; fuse adjacent kernels; keep textures resident.
* **Color management**: OCIO-driven; linear scene-referred pipeline; project-wide gamut/transfer functions.
* **Precision & determinism**: define fp precision strategy (fp16/32) per node; golden-frame tests.

**I/O & codecs**

* Ingest: ProRes/DNx/EXR/PNG-seq/H.264/H.265/AV1 (desktop); WebCodecs/MediaCapabilities (web).
* Export: mastering formats (ProRes/EXR), delivery (AV1/HEVC/H.264), web vector (Lottie/Bodymovin), sprite sheets.
* **Background render farm**: autoscaling workers (GPU if available), resumable jobs, deterministic re-render.

---

## 4) Audio: sample-accurate sync, not an afterthought

**Goal:** Reliable audiovisual alignment for motion-to-beat workflows.

* **Sample clock authority**: audio clock drives UI time when scrubbing/previewing.
* **Per-track FX**: EQ, compression, side-chain keying for motion (amplitude → parameter mod).
* **Waveform & spectral views** with beat/marker extraction; Tap-to-tempo maps into easing curves.
* **Engines**: WebAudio (web preview), PortAudio/CoreAudio (desktop); lock-free ring buffers for low-latency.

---

## 5) Expressions, constraints, and simulation

**Goal:** Power without foot-guns; composable, testable, and secure.

* **Expression language**: a sandboxed JS-subset or TypeScript-checked DSL compiled to WASM.
* **Deterministic RNG**: seeded per comp for reproducible randomness.
* **Physics/simulation nodes**: spring, flocking, fields (GPU compute). All time-stable & pausable.
* **Unit tests for rigs**: property suites with expected positions/angles at timestamps.

---

## 6) 2D→2.5D→3D continuum (when you’re ready)

**Goal:** Start 2D-strong; prepare a path to lights, cameras, 3D layers, and GLTF.

* 3D transform stack and camera/lights as nodes; **parallax** and **volumetric** effects later.
* Import GLTF/USDZ as “assets with parameters” (materials, morph targets).
* Depth-aware effects (DOF, fog) via depth textures; compositor remains graph-first.

---

## 7) Motion design “tokens” and systems thinking

**Goal:** Bring Animator-like design-system rigor to motion.

* **Motion tokens**: durations, easings, delay ramps, spring presets, choreography patterns.
* **Variants** on Motion Components: e.g., “Toast/enter|exit|emphasis”.
* **Responsive motion**: scale durations/easings by output FPS/size/user preferences (reduced motion).
* **Linting**: guardrails for minimum readable durations, maximal velocity/overshoot thresholds.

---

## 8) Collaboration primitives for production workflows

**Goal:** Make teams faster than solo experts.

* **Task graph**: simple kanban pinned to sequences/components; “assign a shot” in-product.
* **Review workflows**: time-ranged notes, frame grabs, automated checklists (color space, safety, loudness).
* **Perceptual diffs**: SSIM/LPIPS to compare renders; “what changed” overlays.
* **Live preview apps** (iOS/Android/TV): stream comp previews to device with color transforms applied.

---

## 9) Extensibility and marketplace

**Goal:** A safe, thriving ecosystem where plugins feel native.

* **Plugin SDK tiers**

  1. **Panels/Tools** (UI + doc APIs);
  2. **Node plugins** (effects/generators with WGSL/GLSL/WASM kernels);
  3. **Automation** (batch ops, render hooks).
* **Security sandbox**: capabilities-based permissioning; pure functions for render nodes; worker isolation.
* **Determinism contract**: render plugins must declare precision, I/O types, and be side-effect free.

---

## 10) File format & interoperability

**Goal:** Open, diffable, and long-lived—unlike AEP.

* **Single-source JSON (or FlatBuffers/Cap’n Proto) document** referencing content-addressed assets (CAS).
* **Chunked subdocs** for sequences/components to enable partial checkout and streaming.
* **Interchange**: OTIO (timelines), Lottie (vector anim), GLTF (3D), ICC/OCIO configs (color).
* **Semantic diffs**: keys/curves diff, node-graph topology diff, frame-level change reports.

---

## 11) Performance engineering playbook

* **Zero-GC hot paths** (Rust core), JS only for UI; data marshaling via shared memory/struct of arrays.
* **Frame budget accounting**: UI thread ≤ 4 ms, render thread ≤ 8 ms; back-pressure indicators.
* **Warm caches** on scrub direction change; “predictive decode” ahead of the playhead.
* **Headless mode** for CI renders and rig tests.

---

## 12) ML-assisted features (quality, not gimmicks)

* **Masking/roto**: on-device segmenters; keyframe proposals → editable curves.
* **Beat & cut detection**, text-to-kinetic-type layout suggestions, easing fit from user curves.
* **Search**: “find the keyframe where velocity peaks,” “which comps break color rules?”
* **Explainability**: ML outputs always materialize as editable assets (mattes, curves, tokens).

---

## 13) Accessibility & inclusive motion

* **Project-level “reduced motion” profiles**; audit for vestibular triggers (parallax, strobe).
* Fully keyboard-operable timeline and curve editor; assistive labels for nodes/keys.
* Caption tracks & audio descriptions timelines; color-blind safe ramp checks.

---

## 14) Trust, testing, and governance (teams will demand this)

* **Golden-frame tests**: lock step renders across platforms; threshold-based image diffs.
* **Deterministic build matrix**: OS/GPU/driver reproducibility; render manifests in exports.
* **Lint rules**: color pipeline, motion token adherence, export specs (safe areas, loudness).
* **Provenance**: every render links to doc hash, plugin versions, and color config.

---

## 15) Architecture blueprint (one feasible stack)

* **Core engine:** Rust (scene graph, evaluator, cache, I/O) →

  * **Web**: compile via WASM + WebGPU (wgpu) + WebWorkers + SharedArrayBuffer.
  * **Desktop**: Tauri/Electron shell, native wgpu backends (Metal/Vulkan/DirectX).
* **UI:** React + Canvas/WebGPU overlays; incremental virtualization for large timelines.
* **Collab:** CRDT (Yjs/Automerge) + WebRTC data channels for low-latency presence; doc hosted on durable object / stateful edge (e.g., Cloudflare Durable Objects), with S3-style asset storage (CAS).
* **Media:** FFmpeg-based workers (desktop/cloud) + WebCodecs (browser); GPU upload paths tuned for zero-copy.
* **Color:** OCIO config per project; shaders generated with fixed transforms; ICC display links for preview apps.
* **Search/Index:** property/curve index in SQLite/libSQL; embeddings (optional) for semantic search of comments/assets.

---

## 16) Product surface: what must ship in v1 vs v2

**V1 (production-credible)**

* Robust 2D compositor with shapes, text, images, alpha/blur/color nodes.
* Timeline + curve editor + node graph; keyframe & interpolation suite.
* Real-time collab, comments, branches, reviews.
* Audio tracks with sample-accurate playback and markers.
* Motion components + tokens; export to ProRes/H.264 and Lottie.
* Deterministic renders; golden-frame tests; OCIO pipeline.

**V2 (expansion)**

* Roto/track assist; rigging & constraints; limited physics.
* Device preview apps; render farm autoscaling.
* Partial 3D (cameras/lights, GLTF import); depth-aware effects.
* Marketplace tier-2 plugins (compute nodes).

**V3 (frontier)**

* Full 3D workspace; simulation graphs; collaborative shot management.
* Advanced ML “suggest then materialize” flows; enterprise review rooms.

---

## 17) Differentiators vs other tools (why this is a successor)

* **Multiplayer by design**: branch, review, merge without fear; presence is native, not bolted on.
* **Deterministic GPU pipeline**: renders match previews; performance is predictable and testable.
* **Composable motion system**: tokens + components → portable motion language across products.
* **Open file & marketplace**: diffable, scriptable, CI-friendly; a platform, not a silo.
* **Production governance**: golden-frame CI, perceptual diffs, color discipline as first-class citizens.

---

## 18) Risk ledger & mitigations (what kills projects like this)

* **Media I/O complexity** → start with a constrained “known-good” codec matrix; push everything else to background transcode workers.
* **GPU determinism across vendors** → fix shader precision policy; keep conformance tests; optionally ship your own software fallback for critical nodes.
* **WASM/JS boundary costs** → co-locate hot paths in Rust; batch property updates; use shared memory.
* **CRDT doc bloat** → shard subdocs; periodic compaction; snapshotting.
* **Plugin security/perf** → pure functions for render nodes; capability-gated APIs; review + signing.

---

## 19) Adoption wedge: where to win early

* **Kinetic type & product motion**: teams that live in Animator/Framer want shareable motion systems.
* **Design-system motion**: export motion tokens/components → code (iOS/Android/Web).
* **Marketing micro-shots**: short loops, social assets, in-app animations; fast review is king.
* **Enterprise collaboration**: compliance trails, deterministic renders, branchable docs.

---

## 20) Verification quick-checks (what “done” looks like)

* Scrubbing at ≥ 45fps on a 100-layer comp with mixed blur/color/text.
* Starting a multiplayer session never blocks a solo editor; offline-first edits merge cleanly.
* Exported ProRes matches preview within defined ΔE / SSIM thresholds.
* A Motion Component updated in one doc can be version-upgraded in another with a visible diff and rollback.
* Golden-frame tests pass on two GPUs (e.g., M-series + NVIDIA) with identical hash manifests.

---

### Closing thought

“Animator for other tools” isn’t just AE in the browser; it’s **motion as a collaborative, deterministic, systematized craft**. If you commit to a graph-first core, GPU determinism, multiplayer CRDTs, and a motion-token ecosystem, you’ll not only meet AE’s bar—you’ll redefine the workflow the way Animator did for UI.
