# Animator CAWS v1.0 — Engineering-Grade Operating System for Motion Graphics Development

## Purpose
Our "engineering-grade" operating system for coding agents that (1) forces planning before code, (2) bakes in tests as first-class artifacts, (3) creates explainable provenance, and (4) enforces quality via automated CI gates. It's expressed as a Working Spec + Ruleset the agent must follow, with schemas, templates, scripts, and verification hooks that enable better collaboration between agent and our human in the loop.

This CAWS instance is specifically tailored for the Animator project - a comprehensive motion graphics platform. The framework enforces deterministic rendering, real-time collaboration, and production-grade quality standards essential for motion design workflows.

## Animator-Specific Context

**Domain Challenges:**
- **Deterministic Rendering**: Pixel-perfect output across different GPUs, platforms, and rendering backends
- **Real-time Collaboration**: Multi-user editing with conflict-free replicated data types at timeline scale
- **Performance Criticality**: 60fps timeline interaction with complex compositions and GPU-intensive effects
- **Media Pipeline Complexity**: Professional codec support with hardware-accelerated decoding/encoding
- **Cross-Platform Fidelity**: Identical output on web, desktop, and mobile platforms

**Quality Standards:**
- **Golden Frame Testing**: Automated validation against reference renders with perceptual difference scoring
- **Accessibility Compliance**: WCAG 2.1 AA compliance for motion and interaction design
- **Broadcast Standards**: Professional audio/video compliance with EBU R128, ATSC A/85
- **Performance Budgeting**: Strict frame time budgets with real-time monitoring and adaptive quality

## 1) Core Framework

### Risk Tiering → Drives Rigor (Animator-Specific)

• **Tier 1** (Core rendering engine, scene graph, collaboration, deterministic output): highest rigor; mutation ≥ 70, branch cov ≥ 90, golden-frame tests mandatory, cross-platform validation required, manual review required.
• **Tier 2** (Media pipeline, audio system, plugin architecture, export functionality): mutation ≥ 50, branch cov ≥ 80, integration tests with Testcontainers mandatory, codec compliance testing required.
• **Tier 3** (UI components, preview systems, documentation, developer tools): mutation ≥ 30, branch cov ≥ 70, accessibility testing mandatory, performance budget validation required.

**Animator-Specific Tier Guidelines:**
- **Tier 1**: Changes affecting rendering output, collaboration state, or core data models
- **Tier 2**: New effects, media format support, plugin APIs, or performance optimizations
- **Tier 3**: UI improvements, documentation updates, development tooling, or non-critical features

Agent must infer and declare tier in the plan; human reviewer may bump it up, never down. Motion graphics features default to Tier 2 due to visual quality implications.

### New Invariants (Repository-Level "Operating Envelope")

1. **Atomic Change Budget**
   * *Invariant:* "A PR must fit into one of: `refactor`, `feature`, `fix`, `doc`, `chore`—and must touch only files that the Working Spec's `scope.in` names."
   * *Reason:* Kills scope-creep; enables deterministic review.
   * *Gate:* CI rejects PRs that modify files outside `scope.in` unless `spec_delta` is present.

2. **In-place Refactor (No Shadow Copies)**
   * *Invariant:* Refactors perform **in-place** edits with AST codemods; **no parallel files** (e.g., `enhanced-*.ts`).
   * *Gate:* a naming linter blocks new files that share stem with suffix/prefix (`enhanced|new|v2|copy|final`).

3. **Determinism & Idempotency**
   * *Invariant:* All new code must be testable with injected clock/uuid/random; repeated requests must be safe (where applicable) and asserted in tests.
   * *Gate:* mutation tests + property tests include at least one idempotency predicate for Tier ≥2.

4. **Prompt & Tool Security Envelope** (for agent workflows)
   * *Invariant:* Agents operate with **tool allow-lists**, **redacted secrets**, and **context firebreaks** (no raw secrets in model context; never post `.env`, keys, or tokens back into diffs).
   * *Gate:* prompt-lint and secret-scan on the agent prompt files + PR diffs.

5. **Supply-chain Provenance**
   * *Invariant:* Every CI build produces an SBOM + SLSA-style attestation attached to the PR.
   * *Gate:* trust score requires valid SBOM/attestation.

### Required Inputs (No Code Until Present)
• **Working Spec YAML** (see schema below) with user story, scope, invariants, acceptance tests, non-functional budgets, risk tier.
• **Interface Contracts**: OpenAPI/GraphQL SDL/proto/Pact provider/consumer stubs.
• **Test Plan**: unit cases, properties, fixtures, integration flows, e2e smokes; data setup/teardown; flake controls.
• **Change Impact Map**: touched modules, migrations, roll-forward/rollback.
• **A11y/Perf/Sec budgets**: keyboard path(s), axe rules to enforce; perf budget (TTI/LCP/API latency); SAST/secret scanning & deps policy.

If any are missing, agent must generate a draft and request confirmation inside the PR description before implementing.

### The Loop: Plan → Implement → Verify → Document

#### 2.1 Plan (agent output, committed as feature.plan.md)
• **Design sketch**: sequence diagram or pseudo-API table.
• **Test matrix**: aligned to user intent (unit/contract/integration/e2e) with edge cases and property predicates.
• **Data plan**: factories/fixtures, seed strategy, anonymized sample payloads.
• **Observability plan**: logs/metrics/traces; which spans and attributes will verify correctness in prod.

#### 2.2 Implement (rules)
• **Contract-first**: generate/validate types from OpenAPI/SDL; add contract tests (Pact/WireMock/MSW) before impl.
• **Unit focus**: pure logic isolated; mocks only at boundaries you own (clock, fs, network).
• **State seams**: inject time/uuid/random; ensure determinism; guard for idempotency where relevant.
• **Migration discipline**: forwards-compatible; provide up/down, dry-run, and backfill strategy.

### Mode Matrix

| Mode | Contracts | New Files | Required Artifacts |
|------|-----------|-----------|-------------------|
| **refactor** | Must not change | Discouraged; only when splitting modules with 1:1 mapping and codemod provided | Codemod script + semantic diff report |
| **feature** | Required first; consumer/provider tests green before implementation | Allowed; must be listed in scope.in | Migration plan, feature flag, performance budget |
| **fix** | Unchanged | Discouraged; prefer in-place edits | Red test → green; root cause note in PR |
| **doc** | N/A | Allowed for documentation files | Updated README/usage snippets |
| **chore** | N/A | Limited to build/tooling changes | Version updates, dependency changes |

### Cursor/Codex Execution Guard
Add a commit policy hook to reject commit sets that introduce duplicate stems:
```bash
# .git/hooks/pre-commit (or CI script)
PATTERN='/(copy|final|enhanced|v2)[.-]|/(new-)| - copy\.'
git diff --cached --name-only | grep -E "$PATTERN" && {
  echo "❌ Disallowed filename pattern. Use in-place refactor or codemod."
  exit 1
}
```

#### 2.3 Verify (must pass locally and in CI)
• **Static checks**: typecheck, lint (code + tests), import hygiene, dead-code scan, secret scan.
• **Tests**:
  • **Unit**: fast, deterministic; cover branches and edge conditions; property-based where feasible.
  • **Contract**: consumer/provider; versioned and stored under apps/contracts/.
  • **Integration**: real DB or Testcontainers; seed data via factories; verify persistence, transactions, retries/timeouts.
  • **E2E smoke**: Playwright/Cypress; critical user paths only; semantic selectors; screenshot+trace on failure.
  • **Mutation testing**: minimum scores per tier; non-conformant builds fail.
  • **Non-functional checks**: axe rules; Lighthouse CI budgets or API latency budgets; SAST/dep scan clean.
  • **Flake policy**: tests that intermittently fail are quarantined within 24h with an open ticket; no retries as policy, only as temporary band-aid with expiry.

#### 2.4 Document & Deliver
• **PR bundle** (template below) with:
  • Working Spec YAML
  • Test Plan & Coverage/Mutation summary, Contract artifacts
  • Risk assessment, Rollback plan, Observability notes (dashboards/queries)
  • Changelog (semver impact), Migration notes
  • Traceability: PR title references ticket; commits follow conventional commits; each test cites the requirement ID in test name or annotation.
  • Explainability: agent includes a 10-line "rationale" and "known-limits" section.

## 2) Machine-Enforceable Implementation

### A) Executable Schemas & Validation

#### Working Spec JSON Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CAWS Working Spec",
  "type": "object",
  "required": ["id", "title", "risk_tier", "mode", "change_budget", "blast_radius", "operational_rollback_slo", "scope", "invariants", "acceptance", "non_functional", "contracts"],
  "properties": {
    "id": { "type": "string", "pattern": "^[A-Z]+-\\d+$" },
    "title": { "type": "string", "minLength": 8 },
    "risk_tier": { "type": "integer", "enum": [1,2,3] },
    "mode": { "type": "string", "enum": ["refactor", "feature", "fix", "doc", "chore"] },
    "change_budget": {
      "type": "object",
      "properties": {
        "max_files": { "type": "integer", "minimum": 1 },
        "max_loc":   { "type": "integer", "minimum": 1 }
      },
      "required": ["max_files","max_loc"],
      "additionalProperties": false
    },
    "blast_radius": {
      "type": "object",
      "properties": {
        "modules": { "type": "array", "items": { "type": "string" } },
        "data_migration": { "type": "boolean" }
      },
      "required": ["modules","data_migration"],
      "additionalProperties": false
    },
    "operational_rollback_slo": { "type": "string", "pattern": "^[0-9]+m$|^[0-9]+h$" },
    "threats": { "type": "array", "items": { "type": "string" } },
    "scope": {
      "type": "object",
      "required": ["in","out"],
      "properties": {
        "in":  { "type": "array", "items": { "type": "string" }, "minItems": 1 },
        "out": { "type": "array", "items": { "type": "string" } }
      }
    },
    "invariants": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
    "acceptance": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id","given","when","then"],
        "properties": {
          "id":   { "type": "string", "pattern": "^A\\d+$" },
          "given":{ "type": "string" },
          "when": { "type": "string" },
          "then": { "type": "string" }
        }
      }
    },
    "non_functional": {
      "type": "object",
      "properties": {
        "a11y": { "type": "array", "items": { "type": "string" } },
        "perf": {
          "type": "object",
          "properties": {
            "api_p95_ms": { "type": "integer", "minimum": 1 },
            "lcp_ms": { "type": "integer", "minimum": 1 }
          },
          "additionalProperties": false
        },
        "security": { "type": "array", "items": { "type": "string" } }
      },
      "additionalProperties": false
    },
    "contracts": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["type","path"],
        "properties": {
          "type": { "type": "string", "enum": ["openapi","graphql","proto","pact"] },
          "path": { "type": "string" }
        }
      }
    },
    "observability": {
      "type": "object",
      "properties": {
        "logs":    { "type": "array", "items": { "type": "string" } },
        "metrics": { "type": "array", "items": { "type": "string" } },
        "traces":  { "type": "array", "items": { "type": "string" } }
      }
    },
    "migrations": { "type": "array", "items": { "type": "string" } },
    "rollback":   { "type": "array", "items": { "type": "string" } }
  },
  "additionalProperties": false
}
```

#### Provenance Manifest Schema
```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "type":"object",
  "required":["agent","model","model_hash","tool_allowlist","commit","artifacts","results","approvals","sbom","attestation"],
  "properties":{
    "agent":{"type":"string"},
    "model":{"type":"string"},
    "model_hash":{"type":"string"},
    "tool_allowlist":{"type":"array","items":{"type":"string"}},
    "prompts":{"type":"array","items":{"type":"string"}},
    "commit":{"type":"string"},
    "artifacts":{"type":"array","items":{"type":"string"}},
    "results":{
      "type":"object",
      "properties":{
        "coverage_branch":{"type":"number"},
        "mutation_score":{"type":"number"},
        "tests_passed":{"type":"integer"},
        "contracts":{"type":"object","properties":{"consumer":{"type":"boolean"},"provider":{"type":"boolean"}}},
        "a11y":{"type":"string"},
        "perf":{"type":"object"}
      },
      "additionalProperties": true
    },
    "approvals":{"type":"array","items":{"type":"string"}},
    "sbom":{"type":"string"},
    "attestation":{"type":"string"}
  }
}
```

#### Tier Policy Configuration (Animator-Specific)
```json
{
  "1": {
    "min_branch": 0.90,
    "min_mutation": 0.70,
    "requires_contracts": true,
    "requires_manual_review": true,
    "requires_golden_frame_tests": true,
    "requires_cross_platform_validation": true,
    "max_files": 40,
    "max_loc": 1500,
    "allowed_modes": ["feature","refactor","fix"],
    "perf_budget_required": true,
    "a11y_required": true
  },
  "2": {
    "min_branch": 0.80,
    "min_mutation": 0.50,
    "requires_contracts": true,
    "requires_codec_compliance_testing": true,
    "max_files": 25,
    "max_loc": 1000,
    "allowed_modes": ["feature","refactor","fix"],
    "perf_budget_required": true,
    "a11y_required": true
  },
  "3": {
    "min_branch": 0.70,
    "min_mutation": 0.30,
    "requires_contracts": false,
    "requires_accessibility_testing": true,
    "max_files": 15,
    "max_loc": 600,
    "allowed_modes": ["feature","refactor","fix","doc","chore"],
    "perf_budget_required": false,
    "a11y_required": true
  }
}
```

### B) CI/CD Quality Gates (Automated)

#### Complete GitHub Actions Pipeline
```yaml
name: CAWS Quality Gates
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  naming_guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Block shadow file patterns
        run: |
          BAD=$(git diff --name-only origin/${{ github.base_ref }}... | \
            grep -E '/(copy|final|enhanced|v2)[.-]|/(new-)|(^|/)_.+\.| - copy\.' || true)
          if [ -n "$BAD" ]; then
            echo "❌ Shadow/duplicate filename patterns detected:"
            echo "$BAD"
            exit 1
          fi

  scope_guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Ensure changes are within scope.in
        run: |
          yq -o=json '.caws/working-spec.yaml' > .caws/ws.json
          jq -r '.scope.in[]' .caws/ws.json | sed 's|^|^|; s|$|/|' > .caws/paths.txt
          CHANGED=$(git diff --name-only origin/${{ github.base_ref }}...)
          OUT=""
          for f in $CHANGED; do
            if ! grep -q -E -f .caws/paths.txt <<< "$f"; then OUT="$OUT\n$f"; fi
          done
          if [ -n "$OUT" ]; then
            echo -e "❌ Files outside scope.in:\n$OUT"
            echo "If intentional, add a Spec Delta to .caws/working-spec.yaml and include affected paths."
            exit 1
          fi

  budget_guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Enforce max files/LOC from change_budget
        run: |
          yq -o=json '.caws/working-spec.yaml' > .caws/ws.json
          MAXF=$(jq -r '.change_budget.max_files' .caws/ws.json)
          MAXL=$(jq -r '.change_budget.max_loc' .caws/ws.json)
          FILES=$(git diff --name-only origin/${{ github.base_ref }}... | wc -l)
          LOC=$(git diff --unified=0 origin/${{ github.base_ref }}... | grep -E '^\+|^-' | wc -l)
          echo "Files:$FILES LOC:$LOC (budget Files:$MAXF LOC:$MAXL)"
          [ "$FILES" -le "$MAXF" ] && [ "$LOC" -le "$MAXL" ] || (echo "❌ Budget exceeded"; exit 1)

  setup:
    runs-on: ubuntu-latest
    outputs:
      risk: ${{ steps.risk.outputs.tier }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - name: Parse Working Spec
        id: risk
        run: |
          pipx install yq
          yq -o=json '.caws/working-spec.yaml' > .caws/working-spec.json
          echo "tier=$(jq -r .risk_tier .caws/working-spec.json)" >> $GITHUB_OUTPUT
      - name: Validate Spec
        run: node apps/tools/caws/validate.js .caws/working-spec.json

  static:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run typecheck && npm run lint && npm run dep:policy && npm run sast && npm run secret:scan

  unit:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - name: Enforce Branch Coverage
        run: node apps/tools/caws/gates.js coverage --tier ${{ needs.setup.outputs.risk }}

  mutation:
    needs: unit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test:mutation
      - run: node apps/tools/caws/gates.js mutation --tier ${{ needs.setup.outputs.risk }}

  contracts:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test:contract
      - run: node apps/tools/caws/gates.js contracts --tier ${{ needs.setup.outputs.risk }}

  integration:
    needs: [setup]
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:16, env: { POSTGRES_PASSWORD: pass }, ports: ["5432:5432"], options: >-
        --health-cmd="pg_isready -U postgres" --health-interval=10s --health-timeout=5s --health-retries=5 }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test:integration

  e2e_a11y:
    needs: [integration]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test:e2e:smoke
      - run: npm run test:axe

  perf:
    if: needs.setup.outputs.risk != '3'
    needs: [integration]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run perf:budgets

  provenance_trust:
    needs: [naming_guard, scope_guard, budget_guard, static, unit, mutation, contracts, integration, e2e_a11y, perf]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - name: Generate SBOM
        run: npx @cyclonedx/cyclonedx-npm --output-file .agent/sbom.json
      - name: Create Attestation
        run: node apps/tools/caws/attest.js > .agent/attestation.json
      - name: Prompt/Tool lint
        run: node apps/tools/caws/prompt-lint.js .agent/prompts/*.md --allowlist .agent/tools-allow.json
      - name: Generate Provenance
        run: node apps/tools/caws/provenance.js > .agent/provenance.json
      - name: Validate Provenance
        run: node apps/tools/caws/validate-prov.js .agent/provenance.json
      - name: Compute Trust Score
        run: node apps/tools/caws/gates.js trust --tier ${{ needs.setup.outputs.risk }}
```

### C) Repository Scaffold (Animator-Specific)
```
.caws/
  policy/tier-policy.json
  schemas/{working-spec.schema.json, provenance.schema.json}
  templates/{pr.md, feature.plan.md, test-plan.md, motion-feature.yaml}
apps/contracts/     # OpenAPI for scene-graph, timeline, plugin APIs
  scene-graph-api.yaml
  timeline-api.yaml
  plugin-api.yaml
docs/                # human docs; ADRs; comprehensive plan
  v.0.plan.md       # comprehensive technical specification
  scene-graph.impact-map.md
  scene-graph.non-functional.md
  scene-graph.test-plan.md
src/
  core/             # Rust core engine (scene graph, evaluator, cache)
    scene-graph/
    renderer/
    audio/
    collaboration/
  ui/               # TypeScript/React UI layer
    components/
    canvas/
    timeline/
    properties/
  effects/          # GPU effects and shaders
    blur/
    color/
    distortion/
    generators/
  plugins/          # Plugin system and SDK
    runtime/
    sdk/
    examples/
tests/
  unit/             # Fast, deterministic unit tests
    core/
    effects/
    expressions/
  contract/         # Pact contract tests for APIs
    scene-graph/
    timeline/
    plugins/
  integration/      # Testcontainers with media fixtures
    rendering/
    audio/
    collaboration/
  e2e/              # Playwright for critical user paths
    composition/
    collaboration/
    export/
  axe/              # Accessibility testing
    motion/
    keyboard/
    screen-reader/
  mutation/         # Mutation testing for deterministic systems
    core-logic/
    rendering/
  golden-frame/     # Reference render validation
    compositions/
    effects/
    cross-platform/
apps/tools/caws/    # CAWS tooling and validation
  validate.ts
  gates.ts          # thresholds, trust score, golden-frame validation
  provenance.ts
  prompt-lint.js    # prompt hygiene & tool allowlist
  attest.js         # SBOM + SLSA attestation generator
  tools-allow.json  # allowed tools for agents
  motion-tools.json # motion graphics specific tools
codemod/            # AST transformation scripts for refactor mode
  rename.ts         # example codemod for renaming modules
  scene-refactor.ts # scene graph refactoring tools
.agent/             # provenance artifacts (generated)
  sbom.json
  attestation.json
  provenance.json
  tools-allow.json
  golden-frames/    # reference render repository
.github/
  workflows/caws.yml # comprehensive CI/CD with GPU testing
  workflows/render-farm.yml # distributed rendering pipeline
  CODEOWNERS        # tier-1 path ownership
LICENSE
README.md
```

## 3) Templates & Examples

### Working Spec YAML Template (Motion Graphics Feature)
```yaml
id: MOTION-1234
title: "Add GPU-accelerated glow effect with real-time parameter feedback"
risk_tier: 2
mode: feature
change_budget:
  max_files: 25
  max_loc: 1200
blast_radius:
  modules: ["renderer", "effects", "timeline", "preview"]
  data_migration: false
operational_rollback_slo: "15m"
threats:
  - "Performance regression on low-end GPUs"
  - "Color accuracy drift across different color spaces"
  - "Inconsistent behavior between preview and export rendering"
scope:
  in: ["glow effect implementation", "GPU shader optimization", "real-time parameter preview", "color space handling"]
  out: ["3D lighting effects", "particle systems", "advanced color grading"]
invariants:
  - "Glow effect maintains deterministic output across all supported GPUs"
  - "Real-time parameter changes reflect immediately in timeline preview (≤16ms response)"
  - "Glow effect preserves alpha channel and layer blending modes"
  - "Performance impact ≤5% on existing compositions with similar effects"
acceptance:
  - id: A1
    given: "composition with 50+ layers including text, shapes, and media"
    when:  "apply glow effect with intensity=0.8, radius=20, color=#FF6B35"
    then:  "glow renders correctly in real-time preview; exported ProRes matches preview within ΔE < 1.0"
  - id: A2
    given: "glow effect applied to layer with alpha transparency"
    when:  "scrub timeline at 60fps"
    then:  "smooth playback without frame drops; alpha compositing preserved"
  - id: A3
    given: "glow effect with extreme parameters (radius=100, intensity=2.0)"
    when:  "render at 4K resolution"
    then:  "graceful fallback to software rendering if GPU memory insufficient"
non_functional:
  a11y: ["glow effect supports reduced motion preferences", "parameter controls keyboard accessible", "effect preview announced to screen readers"]
  perf: { render_thread_ms: 8, memory_mb: 256, gpu_memory_mb: 512 }
  security: ["shader inputs sanitized", "GPU memory bounds checked", "no resource leaks in effect lifecycle"]
contracts:
  - type: openapi
    path: "apps/contracts/scene-graph-api.yaml#/effects/glow"
  - type: openapi
    path: "apps/contracts/timeline-api.yaml#/preview-updates"
observability:
  logs: ["glow_effect.render_time", "glow_effect.parameter_change", "glow_effect.gpu_memory_usage"]
  metrics: ["glow_effect_success_rate", "glow_effect_avg_render_time", "glow_effect_memory_peak"]
  traces: ["glow_effect span with layer_id, parameters, render_context"]
migrations: []
rollback: ["feature flag kill-switch; shader cache invalidation; parameter reset to defaults"]
```

### PR Description Template (Motion Graphics Feature)
```markdown
## Summary
Added GPU-accelerated glow effect with real-time parameter feedback, enabling designers to create professional lighting effects with immediate visual feedback. This addresses the need for high-performance effects that maintain deterministic output across platforms.

## Working Spec
- Risk Tier: 2 (media pipeline, effects system)
- Motion Design Invariants: Deterministic rendering, real-time preview (≤16ms), alpha preservation
- Acceptance IDs covered: A1, A2, A3

## Contracts
- Scene Graph API: apps/contracts/scene-graph-api.yaml#/effects/glow (v1.2 → v1.3)
- Timeline API: apps/contracts/timeline-api.yaml#/preview-updates (v1.1 → v1.2)
- Consumer tests: ✅ 18 (effect application, parameter validation)
- Provider verification: ✅ (rendering pipeline, preview system)

## Tests
- Unit: 89 tests, branch cov 92% (target 80%) - core logic, shader validation, parameter handling
- Mutation: 68% (target 50%) - rendering logic, color space conversion, performance paths
- Integration: 12 flows (Testcontainers with media fixtures) - effect composition, timeline preview, export pipeline
- E2E smoke: 6 (Playwright) - effect application workflow, real-time preview, cross-platform rendering
- Golden Frame: 4 reference renders validated (ΔE < 1.0, SSIM > 0.98) across GPU types
- A11y: axe 0 critical; keyboard navigation tested; reduced motion support verified

## Non-functional
- Render thread 6.2ms avg (budget 8ms) - maintains 60fps timeline interaction
- GPU memory 184MB peak (budget 512MB) - efficient resource usage
- Zero SAST criticals; WGSL shaders security reviewed

## Observability
- New metrics: glow_effect_render_time, glow_effect_success_rate, gpu_memory_usage
- OTel spans: glow_effect with layer_id, parameters, render_context
- Performance dashboards: real-time effect performance monitoring

## Migration & Rollback
- Database: none required (shader cache auto-invalidates)
- Kill switch env: FEATURE_GLOW_EFFECT=false
- Rollback: shader cache clear; parameter defaults reset

## Known Limits / Follow-ups
- 3D mesh glow effects deferred to MOTION-1250 (requires depth buffer integration)
- Advanced color grading integration planned for MOTION-1260
- Particle system integration for animated glow effects in MOTION-1270

## Files Changed
- `src/effects/glow/` - Core glow effect implementation
- `src/renderer/shaders/` - WGSL glow shaders with optimization
- `src/timeline/preview/` - Real-time parameter feedback system
- `tests/golden-frame/effects/` - Reference render validation
- `apps/contracts/scene-graph-api.yaml` - Effect API contract updates
```

### Testing Patterns (Motion Graphics-Specific)

#### Property-Based Unit Test (Deterministic Rendering)
```typescript
import fc from "fast-check";
import { applyGlowEffect } from "../../src/effects/glow";
import { fixedClock } from "../helpers/clock";
import { createTestScene } from "../helpers/scene-fixtures";

it("glow effect maintains deterministic output [INV: Deterministic Rendering]", () => {
  const scene = createTestScene();
  const effectParams = {
    intensity: fc.float({ min: 0, max: 2 }),
    radius: fc.integer({ min: 1, max: 100 }),
    color: fc.tuple(fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }))
  };

  fc.assert(fc.property(effectParams, (params) => {
    const result1 = applyGlowEffect(scene, params, fixedClock("2025-09-17T10:00:00Z"));
    const result2 = applyGlowEffect(scene, params, fixedClock("2025-09-17T10:00:00Z"));
    return buffersEqual(result1.frameBuffer, result2.frameBuffer);
  }));
});
```

#### Contract Consumer Test (Scene Graph API)
```typescript
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { GlowEffectRequest, GlowEffectResponse } from "../../apps/contracts/scene-graph.types";

const server = setupServer(
  http.post("/api/v1/effects/glow", ({ request }) => {
    const body = request.body as GlowEffectRequest;
    return HttpResponse.json({
      success: true,
      effectId: "glow_123",
      renderTimeMs: 6.2,
      memoryUsageMb: 45.2
    } satisfies GlowEffectResponse);
  })
);
beforeAll(() => server.listen()); afterAll(() => server.close());

it("glow effect API conforms to scene-graph contract [contract]", async () => {
  const response = await client.applyGlowEffect({
    layerId: "layer_456",
    intensity: 0.8,
    radius: 20,
    color: { r: 255, g: 107, b: 53 }
  });

  expect(response.success).toBe(true);
  expect(response.renderTimeMs).toBeLessThan(16); // Real-time requirement
});
```

#### Integration Test with Testcontainers (Media Pipeline)
```typescript
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer } from "@testcontainers/generic-container";
import { createSceneWithMedia } from "../helpers/media-fixtures";

let pg: StartedPostgreSqlContainer;
let ffmpeg: GenericContainer;

beforeAll(async () => {
  pg = await new PostgreSqlContainer().start();
  await migrateMediaDb(pg);
  ffmpeg = await new GenericContainer("ffmpeg:latest").start();
});
afterAll(async () => { await pg.stop(); await ffmpeg.stop(); });

it("glow effect processes media layers correctly [integration]", async () => {
  const scene = await createSceneWithMedia(pg, {
    videoFile: "test-assets/sample_video.mp4",
    imageFile: "test-assets/logo.png"
  });

  const result = await renderer.renderGlowEffect({
    sceneId: scene.id,
    effectParams: { intensity: 0.5, radius: 10 }
  });

  expect(result.renderTimeMs).toBeLessThan(16);
  expect(result.outputFormat).toBe("rgba_f32"); // GPU pipeline format
  expect(result.frameCount).toBe(scene.frameCount);
});
```

#### Golden Frame Test (Reference Render Validation)
```typescript
import { compareGoldenFrame } from "../helpers/golden-frame";
import { createComplexScene } from "../helpers/complex-fixtures";

test("glow effect matches golden frame reference [golden-frame]", async () => {
  const scene = createComplexScene({
    layers: 50,
    effects: ["blur", "color_correction", "glow"],
    resolution: "1920x1080"
  });

  const renderedFrame = await renderer.renderFrame(scene, 30); // Frame 30
  const goldenFrame = await loadGoldenFrame("effects/glow/complex_scene_frame_30");

  const comparison = compareGoldenFrame(renderedFrame, goldenFrame, {
    deltaEThreshold: 1.0,    // Perceptual color difference
    ssimThreshold: 0.98,     // Structural similarity
    alphaTolerance: 0.01     // Alpha channel tolerance
  });

  expect(comparison.passes).toBe(true);
  expect(comparison.maxDeltaE).toBeLessThan(1.0);
  expect(comparison.ssim).toBeGreaterThan(0.98);
});
```

#### E2E Smoke Test (Motion Graphics Workflow)
```typescript
test("apply glow effect updates timeline preview in real-time [e2e]", async ({ page }) => {
  await page.goto("/animator/composition/test-comp");

  // Apply glow effect to selected layer
  await page.getByRole("button", { name: /effects/i }).click();
  await page.getByRole("button", { name: /add glow/i }).click();

  // Verify real-time parameter feedback
  await page.getByLabel("Glow Intensity").fill("0.8");
  await page.getByLabel("Glow Radius").fill("20");

  // Timeline should update immediately (≤16ms)
  await expect(page.getByTestId("timeline-scrubber")).toBeVisible();
  await page.dragTimelineToFrame(30);

  // Verify preview updates without frame drops
  const previewUpdateTime = await measurePreviewUpdateTime();
  expect(previewUpdateTime).toBeLessThan(16);

  // Export and verify quality
  await page.getByRole("button", { name: /export/i }).click();
  await page.getByRole("button", { name: /prores 422/i }).click();

  const exportResult = await waitForExportCompletion();
  expect(exportResult.qualityScore).toBeGreaterThan(0.95); // SSIM vs preview
});
```

## 4) Agent Conduct Rules (Hard Constraints - Motion Graphics)

1. **Spec adherence**: Do not implement beyond scope.in; if discovered dependency changes spec, open "Spec delta" in PR and update golden-frame tests first.
2. **Deterministic rendering**: All visual output must be pixel-identical across platforms; GPU shaders must be deterministic with seeded randomness.
3. **Real-time performance**: All timeline interactions must maintain 60fps; parameter changes must reflect in ≤16ms; document frame budget impact.
4. **Visual quality invariants**: Effects must preserve alpha channels, maintain color accuracy (ΔE < 1.0), and support all blend modes.
5. **GPU safety**: Shader bounds checking mandatory; memory leaks forbidden; graceful fallback to software rendering required.
6. **Cross-platform validation**: Test on multiple GPU vendors (NVIDIA/AMD/Intel/Apple); golden-frame validation on reference hardware.
7. **Accessibility required**: Motion effects must support reduced motion preferences; keyboard navigation mandatory; screen reader announcements required.
8. **Media pipeline integrity**: Codec compliance testing mandatory; no data corruption in decode/encode cycles; professional format support.
9. **Observability parity**: Every render path emits timing metrics; GPU memory usage tracked; performance regressions trigger alerts.
10. **Rollback ready**: Feature-flag all visual changes; shader cache invalidation; parameter defaults reset; export quality validation.

**Motion Graphics-Specific Rules:**
- **Golden frame validation**: All visual changes require golden-frame test approval before merge
- **Performance regression prevention**: 5%+ performance degradation blocks merge; requires optimization or scope reduction
- **Visual artifact prevention**: No flickering, color banding, or alpha compositing errors allowed
- **Memory safety**: GPU memory leaks must be impossible; automatic cleanup on effect disposal
- **Color accuracy**: All color transformations must maintain professional color fidelity across gamuts

## 5) Trust & Telemetry

• **Provenance manifest** (.agent/provenance.json): agent name/version, prompts, model, commit SHAs, test results hashes, generated files list, and human approvals. Stored with the PR for auditability.
• **Trust score per PR**: composite of rubric + gates + historical flake rate; expose in a PR check and weekly dashboard.
• **Drift watch**: monitor contract usage in prod; alert if undocumented fields appear.

## 6) Operational Excellence

### Flake Management
• **Detector**: compute week-over-week pass variance per spec ID.
• **Policy**: >0.5% variance → auto-label flake:quarantine, open ticket with owner + expiry (7 days).
• **Implementation**: Store test run hashes in .agent/provenance.json; nightly job aggregates and posts a table to dashboard.

### Waivers & Escalation
• **Temporary waiver requires**:
  • waivers.yml with: gate, reason, owner, expiry ISO date (≤ 14 days), compensating control.
  • PR must link to ticket; trust score maximum capped at 79 with active waivers.
• **Escalation**: unresolved flake/waiver past expiry auto-blocks merges across the repo until cleared.

### Security & Performance Checks
• **Secrets**: run gitleaks/trufflehog on changed files; CAWS gate blocks any hit above low severity.
• **SAST**: language-appropriate tools; gate requires zero criticals.
• **Performance**: k6 scripts for API budgets; LHCI for web budgets; regressions fail gate.
• **Migrations**: lint for reversibility; dry-run in CI; forward-compat contract tests.

## 7) Language & Tooling Ecosystem (Motion Graphics)

### Core Stack (TypeScript + Rust + WGSL)
• **Testing**: Jest/Vitest, fast-check, Playwright, Testcontainers, Stryker, MSW, Pact
• **Quality**: ESLint + types, LHCI, axe-core, WGSL shader validation
• **CI**: GitHub Actions with GPU runners, golden-frame validation
• **Performance**: WebGPU profiling, render time analysis, memory leak detection
• **Motion Graphics**: Custom property-based testing for deterministic rendering, perceptual diff tools

### Media Processing Stack
• **FFmpeg Integration**: Node-ffmpeg, fluent-ffmpeg for codec testing
• **Image Processing**: Sharp, Jimp for texture and asset validation
• **Audio Analysis**: Web Audio API testing, audio feature extraction validation
• **Codec Testing**: Comprehensive codec compliance testing across platforms

### GPU & Rendering Stack
• **WebGPU Testing**: wgpu-rs testing, cross-platform GPU validation
• **Shader Testing**: WGSL compilation testing, shader performance profiling
• **Render Validation**: Golden frame comparison, perceptual difference scoring
• **Memory Testing**: GPU memory leak detection, resource usage validation

### Specialized Motion Graphics Tools
• **Color Science**: Delta-E color difference validation, gamut mapping testing
• **Animation Testing**: Interpolation accuracy testing, timing precision validation
• **Visual Regression**: Automated screenshot comparison with motion-specific thresholds
• **Performance Budgeting**: Frame time analysis, GPU utilization monitoring

**Note**: Golden-frame testing is non-negotiable for visual changes; mutation testing mandatory for deterministic systems; all GPU code requires cross-platform validation on multiple vendors (NVIDIA, AMD, Intel, Apple Silicon).

## 8) Review Rubric (Scriptable Scoring - Motion Graphics)

| Category | Weight | Criteria | 0 | 1 | 2 |
|----------|--------|----------|----|----|----|
| Spec clarity & invariants | ×5 | Clear, testable invariants | Missing/unclear | Basic coverage | Comprehensive + visual edge cases |
| Contract correctness & versioning | ×5 | API schema accuracy + versioning | Errors present | Minor issues | Perfect + versioned |
| Unit thoroughness & deterministic testing | ×5 | Branch coverage + property tests | <70% coverage | Meets tier minimum | >90% + deterministic rendering |
| Golden frame validation | ×4 | Reference render validation | No golden frames | Basic validation | Cross-platform golden frame coverage |
| Integration realism & media pipeline | ×4 | Real containers + media fixtures | Mocked heavily | Basic containers | Full media pipeline + codec testing |
| GPU/rendering testing | ×4 | Cross-platform GPU validation | Single GPU only | Multi-vendor testing | Full GPU matrix + performance validation |
| E2E motion workflow stability | ×3 | Critical motion paths + semantic selectors | Brittle selectors | Basic coverage | Motion-specific semantic + stable |
| Mutation adequacy for visual logic | ×4 | Score vs tier threshold | <50% | Meets minimum | >80% + visual mutants |
| A11y motion & interaction pathways | ×3 | Motion accessibility + keyboard | Major issues | Basic compliance | Full WCAG + reduced motion support |
| Render perf & GPU resilience | ×3 | Frame budgets + GPU error handling | No GPU checks | Basic budgets | Full GPU resilience + monitoring |
| Visual quality & color accuracy | ×3 | Perceptual diff + color science | No quality checks | Basic validation | ΔE < 1.0 + gamut coverage |
| Observability & render telemetry | ×3 | Render metrics/traces asserted | Missing | Basic emission | Full render observability in tests |
| Migration safety & visual rollback | ×3 | Reversible + shader cache invalidation | No rollback | Basic revert | Full visual rollback + testing |
| Motion docs & PR explainability | ×3 | Clear visual rationale + limits | Minimal | Basic docs | Comprehensive + motion examples |
| **Mode compliance** | ×3 | Changes match declared `mode` | Violations | Minor drift | Full compliance |
| **Scope & budget discipline** | ×3 | Diff within `scope.in` & budget | Exceeded | Near limit | Within limits |
| **Render determinism** | ×2 | Cross-platform identical output | Platform variance | Basic consistency | Pixel-perfect across all platforms |

**Target**: ≥ 85/100 (weighted sum). Calculator in `apps/tools/caws/rubric.ts`. Motion graphics features must achieve ≥90 for visual categories.

## 9) Anti-patterns (Explicitly Rejected - Motion Graphics)

• **Over-mocked rendering tests**: Mocking GPU shaders or media pipelines instead of testing with real GPU contexts and codec fixtures.
• **UI tests keyed on visual appearance**: Testing visual output with CSS selectors instead of semantic roles and perceptual validation.
• **Non-deterministic rendering**: GPU shaders without seeded randomness or platform-dependent visual output.
• **Performance-ignorant effects**: Adding visual effects without frame budget analysis or GPU memory impact assessment.
• **Color-unsafe operations**: Color transformations without gamut mapping or cross-platform color validation.
• **Media pipeline brittleness**: Codec assumptions without comprehensive format testing or graceful fallback handling.
• **"Retry until green" CI culture**: Quarantining flaky golden-frame tests without expiry or visual regression investigation.
• **100% coverage without visual validation**: High test coverage without golden-frame validation or perceptual difference testing.

## 13) Failure-Mode Cards (Motion Graphics Traps & Recovery)

Add a small section of "If you see X, do Y":

1. **Symptom:** GPU shaders produce different output across platforms (NVIDIA vs AMD vs Apple Silicon).
   **Action:** Switch to **Tier 1** classification. Implement deterministic shaders with fixed precision policy. Add golden-frame tests for all target platforms. Use software fallback rendering for validation.

2. **Symptom:** Visual effects cause performance regression (frame drops during timeline scrubbing).
   **Action:** Declare **perf_budget_required**. Implement frame time budgeting with real-time monitoring. Add performance regression tests with 5% degradation threshold. Optimize or reduce effect scope.

3. **Symptom:** Color differences between preview and export (ΔE > 1.0).
   **Action:** Declare **color_accuracy_required**. Implement end-to-end color management pipeline. Add perceptual validation tests with SSIM scoring. Validate against professional color standards (Rec. 709, P3).

4. **Symptom:** Flaky golden-frame tests with visual differences.
   **Action:** Inject `GpuContext` with fixed seed. Implement deterministic random number generation. Add cross-platform validation fixtures. Investigate GPU driver differences and implement workarounds.

5. **Symptom:** Agent proposes new GPU library or shader framework.
   **Action:** Fail unless added to `motion-tools.json`. Require cross-platform validation on 4+ GPU vendors. Add SBOM security review and performance benchmarking. Implement graceful fallback to software rendering.

6. **Symptom:** Memory leaks in GPU-accelerated effects (increasing memory usage over time).
   **Action:** Switch to **Tier 1** for GPU changes. Implement GPU memory pool management. Add memory leak detection tests. Validate memory cleanup on effect disposal and timeline navigation.

7. **Symptom:** Accessibility issues with motion effects (no reduced motion support, poor keyboard navigation).
   **Action:** Add accessibility testing requirements. Implement reduced motion preferences. Add keyboard navigation tests. Validate with screen readers and motion-sensitive users.

## 10) Animator Agent Integration

### Agent Commands (Motion Graphics-Specific)
• `agent plan` → emits motion feature plan + golden-frame test matrix
• `agent render` → generates GPU shaders and preview implementations
• `agent validate` → runs cross-platform GPU validation and golden-frame testing
• `agent optimize` → optimizes shaders for performance and memory usage
• `agent prove` → creates provenance manifest with visual validation results
• `agent doc` → updates motion documentation and shader specifications

### Guardrails (Motion Graphics)
• **Templates**: Inject Motion Graphics Working Spec YAML + golden-frame test requirements
• **Scaffold**: Pre-wire GPU tests, golden-frame fixtures, and shader validation
• **Context discipline**: Restrict writes to rendering pipeline; require visual diff approval for UI changes
• **Performance gates**: Automatic frame budget validation and GPU memory impact assessment
• **Visual validation**: Golden-frame testing required before PR approval
• **Feedback loop**: PR comments show render performance, GPU compatibility, and visual quality scores

### Motion Graphics Agent Rules
- **Visual changes require golden-frame tests**: Any shader or rendering changes must include reference validation
- **Cross-platform GPU testing mandatory**: All GPU code tested on NVIDIA, AMD, Intel, and Apple Silicon
- **Performance regression prevention**: 5%+ performance degradation blocks merge
- **Color accuracy validation**: ΔE < 1.0 requirement for all color transformations
- **Memory safety**: GPU memory leak detection required for all shader operations

## 11) Animator Adoption Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up .caws/ directory with motion graphics schemas and templates
- [ ] Create GPU testing infrastructure with cross-platform validation
- [ ] Wire GitHub Actions workflow with golden-frame testing pipeline
- [ ] Add CODEOWNERS for Tier-1 rendering and core engine paths
- [ ] Implement basic shader validation and compilation testing

### Phase 2: Motion Graphics Quality Gates (Week 3-4)
- [ ] Enable GPU-accelerated testing with real hardware runners
- [ ] Add golden-frame validation for all visual effects
- [ ] Implement mutation testing for deterministic rendering systems
- [ ] Add perceptual difference scoring (ΔE, SSIM) validation
- [ ] Set up cross-platform GPU matrix testing (NVIDIA, AMD, Intel, Apple Silicon)

### Phase 3: Production Motion Workflows (Week 5-6)
- [ ] Publish comprehensive provenance manifest with render validation
- [ ] Implement visual regression detection and quarantine process
- [ ] Add automated performance budgeting with frame time validation
- [ ] Set up codec compliance testing pipeline
- [ ] Socialize motion graphics review rubric and block merges <85

### Phase 4: Advanced Motion Graphics (Week 7-8)
- [ ] Add ML-assisted motion analysis and optimization
- [ ] Implement advanced color science validation (gamut mapping, HDR)
- [ ] Set up distributed rendering farm for golden-frame validation
- [ ] Add real-time collaboration testing and validation
- [ ] Implement comprehensive accessibility testing for motion effects

### Phase 5: Enterprise Motion Production (Week 9+)
- [ ] Monitor visual quality drift across different output formats
- [ ] Refine GPU performance optimization based on real-world usage
- [ ] Expand plugin ecosystem with CAWS-compliant validation
- [ ] Track visual quality trends and user experience metrics
- [ ] Implement automated visual compliance checking for brand guidelines

## 12) Motion Graphics Trust Score Formula

```typescript
const weights = {
  coverage: 0.15,
  mutation: 0.15,
  golden_frame: 0.15,    // Visual quality validation
  contracts: 0.12,
  gpu_validation: 0.12,  // Cross-platform GPU testing
  a11y: 0.08,
  perf: 0.08,
  visual_quality: 0.08,  // ΔE, SSIM scoring
  flake: 0.04,
  mode: 0.04,
  scope: 0.04,
  supplychain: 0.02
};

function motionGraphicsTrustScore(tier: string, prov: Provenance) {
  const wsum = Object.values(weights).reduce((a,b)=>a+b,0);
  const score =
    weights.coverage * normalize(prov.results.coverage_branch, tiers[tier].min_branch, 0.95) +
    weights.mutation * normalize(prov.results.mutation_score, tiers[tier].min_mutation, 0.9) +
    weights.golden_frame * (prov.results.golden_frame_pass_rate || 0) +
    weights.contracts * (tiers[tier].requires_contracts ? (prov.results.contracts.consumer && prov.results.contracts.provider ? 1 : 0) : 1) +
    weights.gpu_validation * (prov.results.gpu_platforms_tested >= 3 ? 1 : prov.results.gpu_platforms_tested / 3) +
    weights.a11y * (prov.results.a11y === "pass" ? 1 : 0) +
    weights.perf * budgetOk(prov.results.perf) +
    weights.visual_quality * (prov.results.delta_e <= 1.0 && prov.results.ssim >= 0.98 ? 1 : 0.5) +
    weights.flake * (prov.results.flake_rate <= 0.005 ? 1 : 0.5) +
    weights.mode * (prov.results.mode_compliance === "full" ? 1 : 0.5) +
    weights.scope * (prov.results.scope_within_budget ? 1 : 0) +
    weights.supplychain * (prov.results.sbom_valid && prov.results.attestation_valid ? 1 : 0);
  return Math.round((score/wsum)*100);
}
```

## Motion Graphics Vision

Animator CAWS v1.0 combines the philosophical foundation of engineering-grade development with the practical, executable implementation details needed for production-quality motion graphics software. The framework provides both the "why" (quality principles) and the "how" (automated enforcement) needed for AI-assisted development of deterministic, cross-platform motion graphics tools.

**The result is a development environment that:**
- **Ensures visual quality** with golden-frame testing and perceptual validation
- **Maintains performance** with real-time frame budgeting and GPU optimization
- **Enables collaboration** with deterministic rendering and conflict-free multi-user editing
- **Scales safely** with tiered risk assessment and comprehensive testing strategies
- **Produces reliable software** with automated quality gates and trust scoring

This foundation enables the development of Animator - a motion graphics platform that achieves the holy trinity of creative tools: powerful enough for professionals, accessible enough for beginners, and reliable enough for production use.

---

*Animator CAWS v1.0 - Engineering-grade motion graphics development with deterministic rendering, cross-platform compatibility, and production-quality assurance.*
