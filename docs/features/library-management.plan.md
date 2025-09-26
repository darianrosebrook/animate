# Library Management — Feature Plan (for a "Figma for After Effects" successor)

This plan treats "libraries" as **versioned, composable, permissioned bundles** of motion assets: Components, Presets (effects, expressions, LUTs), Tokens (color/typography/motion), Variable Collections with Modes, Media (vectors/rasters/3D), Rigs/Constraints, and Test Manifests. It prioritizes **determinism, multiplayer safety, and enterprise governance** without sacrificing speed.

---

## 0) Problem Statement & Objectives

**Problem.** Motion projects duplicate patterns (easings, rigs, transitions) with no safe way to reuse, update, or govern them across teams. Updating a component is risky; discovering what changed and where it breaks is slow; licensing and provenance are opaque.

**Objectives.**

1. **Create → Publish → Consume** libraries with **semantic versioning** and **deterministic linking**.
2. **Variables & Modes** (e.g., light/dark, locale, reduced motion) drive adaptive output across projects.
3. **Safe Upgrades** via visual diffs (frames/curves), breaking change detection, and project lockfiles.
4. **Governance**: permissions, deprecation, provenance, licensing, and attestation.
5. **Performance**: local-first caches, instant search, delta updates, zero-copy media where possible.

**Non-Goals (v1).** Full 3D asset management, binary diffing of heavy codecs, marketplace billing.

---

## 1) Definitions & Scope

* **Library**: A named, versioned set of items. Types:

  * **Components**: Node graphs + parameters + variants.
  * **Presets**: Effect stacks, curves, expression snippets, LUTs.
  * **Tokens**: Color, type, spacing, **motion tokens** (durations/easings), accessibility presets.
  * **Variable Collections** + **Modes**: Named axes (theme = light/dark; motion = full/reduced; density = compact/cozy).
  * **Assets**: Vectors, bitmaps, audio, 3D, fonts; content-addressed.
  * **Rigs/Constraints**: Parametric rigs; IK/springs definitions.
  * **Tests**: Golden-frame manifests, curve/property assertions; usage examples.
* **Registry Levels**: **Local (document)** → **Team (workspace)** → **Org** → **Remote/Marketplace**.
* **Link Strategies**: **Reference (locked version)** vs **Embed (copy)**; fork later if desired.

---

## 2) Invariants (enforced)

1. **Determinism**: Same library version + same inputs ⇒ identical frames/values.
2. **Immutability**: A published version is read-only. Changes require a new version.
3. **SemVer**: `MAJOR.MINOR.PATCH` with machine-checked breaking change rules.
4. **Addressability**: Every item has a stable **URN** and **content digest**.
5. **Provenance**: Each version ships a manifest with author, model/agent info (if auto-generated), tests, and SBOM/attestation for code-adjacent assets.
6. **Modes are total**: For any referenced variable key, every active Mode combination must resolve to a value or provide a default/fallback.
7. **No silent breakages**: A consumer project locks versions; upgrades require an explicit action and surfaces diffs.
8. **A11y first-class**: Variable Collections must support a **Reduced Motion** axis; audits fail if unresolved.

---

## 3) User Roles & Permissions

* **Owner**: Manage visibility; promote maintainers; publish/deprecate.
* **Maintainer**: Edit drafts; run tests; publish minor/patch; propose majors.
* **Contributor**: PR-like proposals; cannot publish.
* **Consumer**: Use/lock versions; request changes; pin Modes.

**Visibility:** Private (team), Org, Public.

---

## 4) Architecture Overview

* **Doc Model:** CRDT document with **subdocument sharding**; library references are **immutable edges** with version pins.
* **Registry:** Multi-tenant service (or self-hosted) with:

  * **Metadata store** (Postgres/libSQL): item graph, versions, permissions, provenance.
  * **CAS (S3-compatible)**: content-addressed blobs (media, compiled shader kernels, LUTs).
  * **Index** (SQLite/Meilisearch): full-text, tags, type facets.
* **Sync:** Client caches + background sync; delta packs for metadata; streaming for big assets.
* **Evaluation:** Engine resolves variables/modes **at render time** using a scoped resolver; can **bake** for export.

---

## 5) Data Model (high-level)

### 5.1 Item Envelope

```json
{
  "urn": "org:brand.motion/Toast@1.4.2#enter",
  "type": "component",
  "version": "1.4.2",
  "digest": "b3a1…",           // sha256 of canonical JSON
  "dependencies": [
    {"urn": "org:brand.tokens/motion@2.1.0", "range": "^2.1"}
  ],
  "modes": ["theme", "motion"],
  "exports": {
    "variants": ["enter","exit","emphasis"],
    "props": [
      {"name":"duration","type":"time","default":"160ms","token":"motion.duration.s"},
      {"name":"easing","type":"cubic","token":"motion.easing.standard"}
    ]
  },
  "tests": { "golden": ["frames/enter@1s.png", "frames/exit@1s.png"] },
  "provenance": {
    "author":"darian", "agent":"CAWS-Agent/1.2", "model_hash":"…",
    "sbom":"sbom.json", "attestation":"intoto.json"
  },
  "license": "CC-BY-4.0"
}
```

### 5.2 Variable Collections & Modes

```json
{
  "urn": "org:brand.variables/ui@3.0.0",
  "type": "variables",
  "axes": [
    {"name":"theme","values":["light","dark"]},
    {"name":"motion","values":["full","reduced"]}
  ],
  "vars": [
    {
      "key": "color.surface",
      "type": "color",
      "values": {
        "theme=light": "#FFFFFF",
        "theme=dark":  "#121212"
      },
      "fallback": "#FFFFFF"
    },
    {
      "key": "motion.duration.s",
      "type": "time",
      "values": {
        "motion=full": "160ms",
        "motion=reduced": "0ms"
      },
      "fallback": "160ms"
    }
  ]
}
```

### 5.3 Project Lockfile

```yaml
libraries:
  - urn: org:brand.motion/Toast
    version: 1.4.2
    integrity: sha256-b3a1…
  - urn: org:brand.variables/ui
    version: 3.0.0
mode-pins:
  theme: dark
  motion: reduced
```

---

## 6) Versioning & Dependency Policy

* **SemVer enforcement** via **schema/policy checks**:

  * **MAJOR**: breaking API/prop renames, removed variants, default value changes that affect visual output beyond tolerance.
  * **MINOR**: additive props/variants, additive tokens, backward-compatible default tweaks within tolerance.
  * **PATCH**: bug fixes within golden-frame tolerance, perf improvements, doc fixes.
* **Ranges** on dependencies (`^2.1`) allowed for **design-time**, but **project lockfile** pins exact versions for render.
* **Breaking Change Detector**:

  * Curve/graph shape diffs; SSIM/LPIPS for golden frames with per-component thresholds.
  * Token schema diffs (deleted/renamed keys).
  * Variable axes diff (removed values requires major).

---

## 7) Publishing Workflow

1. **Draft**: Create/edit items in a **Workspace**. Run **component tests** (unit + golden frames).
2. **Validate**: Policy checks: SemVer, provenance completeness, A11y motion axis coverage, license headers.
3. **Review**: Maintainers approve; visual diff shows **before/after** frames and parameter curves.
4. **Publish**: Immutable version emitted; CAS artifacts uploaded; index updated.
5. **Distribute**: Release channels: **canary**, **beta**, **stable** per library.
6. **Deprecate**: Mark versions deprecated; provide **migration scripts** (codemods for props/graph), and **mapping tables**.

---

## 8) Consumption & Update Workflow

* **Add Library**: From Registry or local pack; select version/channel; add to lockfile.
* **Insert Asset**: Place Component/Presets; select Variant; bind to Variables.
* **Mode Preview**: Toggle Modes (theme/motion/locale); auditor warns on unresolved keys.
* **Update Available**: Badge in Library panel; **Update Assistant** shows:

  * SemVer type, changelog, diffed curves & frames, test status.
  * **Safety score** (component tests pass? diffs within tolerance?).
  * "Update all" or **selective upgrade**; create a branch for safe trial; 1-click rollback.

---

## 9) UI Surfaces

* **Library Panel**: tree view by Type/Tag; search facets; version & channel selector; pin Modes.
* **Inspector**: for selected item—props, variants, tokens linked, dependency graph.
* **Update Assistant**: batch upgrade UX with diffs, safety score, and lockfile changes preview.
* **Conflict Resolver**: for variable collisions (namespaces, priority rules).
* **Dependency Graph**: visualize project→libraries→dependencies; show vulnerable/deprecated nodes.
* **Publish Dialog**: policy & test checklist, version bump suggestion, release notes editor.
* **A11y Motion Auditor**: Mode matrix coverage, "vestibular risk" flags.

---

## 10) Performance & Storage

* **CAS** for big blobs; **dedupe** by content digest across projects.
* **Delta metadata packs** (protobuf/flatbuffers) for fast library queries.
* **Local Index** for search (sqlite) with background sync.
* **Lazy hydrate**: insert stub; fetch heavy assets on reveal/use.
* **Frame budgets**: Library UI operations (search/filter) < 200ms p95; insert component < 150ms p95 from warm cache.

---

## 11) Search & Discovery

* **Facets**: type, tags, axes (theme=dark), owner, popularity, last updated.
* **Semantic search** (optional): embeddings over names/descriptions; re-rank by exact match.
* **In-context suggestions**: When users create similar graphs, suggest existing components; never auto-replace without consent.

---

## 12) Governance, Security, and Licensing

* **Provenance manifests** required: author, SBOM, model/agent hash if AI-assisted, tests present.
* **Attestations** (SLSA/in-toto) for publish events; signed with org key.
* **License metadata** per item; enforcements (e.g., font EULAs block public publish).
* **Access Controls**: Org/Team roles; audit logs (who inserted which version where).
* **Secret hygiene**: Expressions/presets cannot embed secrets; static analyzers block.

---

## 13) APIs (Selected)

* **Registry API**

  * `GET /libraries/:slug`: list versions, channels, tags.
  * `GET /libraries/:slug/:version/manifest`: metadata + dependency list + tests.
  * `PUT /libraries/:slug/:version/channel`: promote/demote canary/beta/stable (maintainer only).
  * `POST /libraries/:slug/releases`: publish (requires provenance, tests).
* **Client SDK**

  * `resolve(urn, {version, modes}) → item`
  * `diff(oldURN, newURN) → {curvesDiff, goldenDiff, schemaDiff}`
  * `validateModes(item, modePins) → report`
  * `lock(library, version) → lockfile update`
* **CLI**

  * `lib publish`, `lib diff`, `lib pack/unpack`, `lib promote`, `lib audit`

---

## 14) Testing Strategy

* **Schema tests**: Verify invariants for each item type.
* **Component tests** (headless):

  * **Golden-frame**: render canonical timestamps; SSIM/LPIPS thresholds per component class.
  * **Curve/property**: assert parameterized outputs at t, ddt continuity for motion smoothness.
  * **Mode matrix**: every active combination yields resolvable values.
* **Integration**: Install library into a fixture project; run Update Assistant dry-run.
* **Perf**: Cache warm/cold timings; registry query latency; CAS throughput.
* **A11y**: Reduced Motion axis causes specific animation branches to short-circuit where declared.

---

## 15) Metrics & SLOs

* **Adoption**: % of projects using libraries; avg components/library per project.
* **Health**: Broken references rate (< 0.1% p95), unresolved variable rate (< 0.05%).
* **Upgrade**: Mean time to upgrade (MTTU); upgrade success rate; rollback rate.
* **Dedupe**: CAS dedupe ratio; saved storage GB.
* **Perf**: Search p95; insert p95; publish pipeline p95.
* **Governance**: % versions with complete provenance; attestation verification rate.

---

## 16) Failure Modes & Mitigations

1. **Breaking change slips as MINOR**
   *Mitigation:* Golden-frame + schema diff gate; if > tolerance, force MAJOR.
2. **Mode explosion (combinatorics)**
   *Mitigation:* Mode rules: axes limited to 3; coverage matrix UI + linter for sparse definitions; defaults required.
3. **Dependency hell**
   *Mitigation:* Lockfile with **peer dependency** semantics (e.g., Components require Tokens `^2.x`); Update Assistant resolves or blocks.
4. **Orphaned media**
   *Mitigation:* Mark-and-sweep GC for CAS; references tracked by digests.
5. **License violations**
   *Mitigation:* License classifier; block public publish; watermark warnings in UI.
6. **Stale local caches**
   *Mitigation:* Epoch-based cache invalidation; background revalidate; "use offline snapshot" banner.

---

## 17) Rollout Plan

**V1 (90 days) — Core reuse & safety**

* Library Panel (browse/search), publish stable versions, lockfile pinning.
* Components/Presets/Tokens/Variables with Modes (theme, motion).
* Update Assistant with semantic diffs; golden-frame tests.
* CAS storage, registry API, provenance manifest, basic permissions.

**V1.5 — Governance & scale**

* Release channels (canary/beta/stable), deprecation workflows, migration scripts.
* Project-wide Mode pins and A11y Motion Auditor.
* Perf tuning: delta metadata packs, index shards.

**V2 — Ecosystem & automation**

* Rigs/Constraints as first-class assets.
* Library PRs (proposals) and review UI; semantic search.
* Export pipelines to code (iOS/Android/Web) for tokens/components; attestations extend to CI.

---

## 18) Acceptance Criteria (executable)

* Insert a component from `org:brand.motion/Toast@1.4.2` into a project with **theme=dark, motion=reduced** and render → matches golden frames within SSIM ≥ 0.98.
* Upgrade the same component to `1.5.0`:

  * Update Assistant surfaces curve/frame diffs and indicates **non-breaking** MINOR.
  * One-click rollback restores lockfile and state.
* Publish a new Variables collection with **missing** reduced motion values → publish blocked with actionable lints.
* Deprecate `1.2.x` series; consumers receive non-blocking banners; new projects cannot pin deprecated versions unless override flag set.
* Search for "toast enter" returns component in < 200ms p95; insert in < 150ms p95 from warm cache.

---

## 19) Developer Experience (DX) & Automation

* **Codemods**: When variables/tokens rename, offer codemod across consumer docs (PR generated).
* **CLI Packs**: `lib pack` to export a portable `.libpack` (manifest + blobs) for air-gapped workflows.
* **CI Hooks**: On publish, run consumer CI of top N dependent projects (canary gate) and attach results to release notes.

---

## 20) Policy Snippets (ready to drop)

**SemVer policy (diff-driven):**

* Remove variant/prop → MAJOR
* Change default value altering visual output beyond component threshold → MAJOR
* Add prop/variant with defaults preserving golden frames → MINOR
* Bug fix within tolerance → PATCH

**Mode policy:**

* Every Variables release must include values for all existing axes or provide explicit fallbacks.
* Reduced Motion axis: durations can map to `0ms` or swap to non-parallax alternatives.

---

### Closing

This plan turns library management into an **engineered system**: reproducible, versioned, testable, and governable. Designers get **speed** (search/insert/update), engineers get **safety** (lockfiles, diffs, tests), and leadership gets **control** (permissions, provenance, policy). Ship V1 with Components/Presets/Tokens/Variables + Modes and the Update Assistant; layer governance and ecosystem support as adoption grows.
