# CAWS v1.0 — Engineering-Grade Operating System for Coding Agents

## Purpose
Our "engineering-grade" operating system for coding agents that (1) forces planning before code, (2) bakes in tests as first-class artifacts, (3) creates explainable provenance, and (4) enforces quality via automated CI gates. It's expressed as a Working Spec + Ruleset the agent must follow, with schemas, templates, scripts, and verification hooks that enable better collaboration between agent and our human in the loop.

## 1) Core Framework

### Risk Tiering → Drives Rigor
• **Tier 1** (Core/critical path, auth/billing, migrations): highest rigor; mutation ≥ 70, branch cov ≥ 90, contract tests mandatory, chaos tests optional, manual review required.
• **Tier 2** (Common features, data writes, cross-service APIs): mutation ≥ 50, branch cov ≥ 80, contracts mandatory if any external API, e2e smoke required.
• **Tier 3** (Low risk, read-only UI, internal tooling): mutation ≥ 30, branch cov ≥ 70, integration happy-path + unit thoroughness, e2e optional.

Agent must infer and declare tier in the plan; human reviewer may bump it up, never down.

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

#### Tier Policy Configuration
```json
{
  "1": {"min_branch": 0.90, "min_mutation": 0.70, "requires_contracts": true, "requires_manual_review": true, "max_files": 40, "max_loc": 1500, "allowed_modes": ["feature","refactor","fix"]},
  "2": {"min_branch": 0.80, "min_mutation": 0.50, "requires_contracts": true, "max_files": 25, "max_loc": 1000, "allowed_modes": ["feature","refactor","fix"]},
  "3": {"min_branch": 0.70, "min_mutation": 0.30, "requires_contracts": false, "max_files": 15, "max_loc": 600, "allowed_modes": ["feature","refactor","fix","doc","chore"]}
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

### C) Repository Scaffold
```
.caws/
  policy/tier-policy.json
  schemas/{working-spec.schema.json, provenance.schema.json}
  templates/{pr.md, feature.plan.md, test-plan.md}
apps/contracts/     # OpenAPI/GraphQL/Pact
docs/                # human docs; ADRs
src/
tests/
  unit/
  contract/
  integration/
  e2e/
  axe/
  mutation/
apps/tools/caws/
  validate.ts
  gates.ts          # thresholds, trust score
  provenance.ts
  prompt-lint.js    # prompt hygiene & tool allowlist
  attest.js         # SBOM + SLSA attestation generator
  tools-allow.json  # allowed tools for agents
codemod/            # AST transformation scripts for refactor mode
  rename.ts         # example codemod for renaming modules
.agent/             # provenance artifacts (generated)
  sbom.json
  attestation.json
  provenance.json
  tools-allow.json
.github/
  workflows/caws.yml
CODEOWNERS
```

## 3) Templates & Examples

### Working Spec YAML Template
```yaml
id: FEAT-1234
title: "Apply coupon at checkout"
risk_tier: 2
mode: feature
change_budget:
  max_files: 25
  max_loc: 1000
blast_radius:
  modules: ["checkout", "discounts"]
  data_migration: true
operational_rollback_slo: "5m"
threats:
  - "Race condition in concurrent coupon application"
  - "Expired coupon validation bypass"
scope:
  in: ["apply percentage/fixed coupons", "stacking rules per business policy"]
  out: ["gift cards", "multi-currency proration"]
invariants:
  - "Total ≥ 0"
  - "Coupon validity window respected (server time)"
  - "Max one store-wide coupon; stacking only with product-specific coupons"
acceptance:
  - id: A1
    given: "valid percentage coupon and eligible cart"
    when:  "user applies coupon"
    then:  "subtotal reduces by rate; taxes recomputed; UI reflects discount"
  - id: A2
    given: "expired coupon"
    when:  "apply"
    then:  "explainable error; no state change"
non_functional:
  a11y: ["keyboard reachable apply/remove", "announce errors with aria-live"]
  perf: { api_p95_ms: 250 }
  security: ["server-side validation; no client trust"]
contracts:
  - type: openapi
    path: "apps/contracts/checkout.yaml#/applyCoupon"
observability:
  logs: ["coupon.apply result, reason"]
  metrics: ["coupon_apply_success_count", "failure_reason"]
  traces: ["applyCoupon span with coupon_id, cart_id"]
migrations:
  - "add coupon_usages table with FK and unique constraints"
rollback: ["feature flag kill-switch; revert migration step DDL"]
```

### PR Description Template
```markdown
## Summary
What changed and why (business value), link to ticket.

## Working Spec
- Risk Tier: 2
- Invariants: ...
- Acceptance IDs covered: A1, A2, ...

## Contracts
- OpenAPI diff: apps/contracts/checkout.yaml (v1.3 → v1.4)
- Consumer tests: ✅ 12
- Provider verification: ✅

## Tests
- Unit: 74 tests, branch cov 86% (target 80%)
- Mutation: 56% (target 50%) – survived mutants listed below (rationale)
- Integration: 8 flows (Testcontainers Postgres)
- E2E smoke: 3 (Playwright) – recordings & traces attached
- A11y: axe 0 critical; keyboard path video attached

## Non-functional
- API p95 212ms (budget 250ms)
- Zero SAST criticals; deps policy compliant

## Observability
- New metrics: coupon_apply_success_count
- OTel spans: applyCoupon with attributes

## Migration & Rollback
- DDL: coupons_usages (idempotent)
- Kill switch env: FEATURE_COUPONS_APPLY=false

## Known Limits / Follow-ups
- Stacking with gift cards is out of scope (FEAT-1290)
```

### Testing Patterns

#### Property-Based Unit Test
```typescript
import fc from "fast-check";
import { applyCoupon } from "../../src/discount";
import { fixedClock } from "../helpers/clock";

it("total never < 0 [INV: Total ≥ 0]", () => {
  const cart = cartArb(); const coupon = couponArb();
  fc.assert(fc.property(cart, coupon, (c,k) => {
    const r = applyCoupon(c,k,fixedClock("2025-09-17T00:00:00Z"));
    return r.total >= 0;
  }));
});
```

#### Contract Consumer Test
```typescript
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { ApplyCouponResponse } from "../../apps/contracts/checkout.types";

const server = setupServer(
  http.post("/applyCoupon", () => HttpResponse.json({ success:true, subtotal:90 } satisfies ApplyCouponResponse))
);
beforeAll(()=>server.listen()); afterAll(()=>server.close());

it("conforms to /applyCoupon schema [contract]", async () => {
  const res = await client.applyCoupon({ code:"SAVE10" });
  expect(res.success).toBe(true);
});
```

#### Integration Test with Testcontainers
```typescript
import { StartedPostgreSqlContainer, PostgreSqlContainer } from "@testcontainers/postgresql";
let pg: StartedPostgreSqlContainer;

beforeAll(async ()=> { pg = await new PostgreSqlContainer().start(); await migrate(pg); });
afterAll(async ()=> await pg.stop());

it("persists coupon usage [flow A1]", async () => {
  await seed(pg).withCustomer().withEligibleItems();
  const res = await api(pg).applyCoupon("SAVE10");
  expect(res.status).toBe(200);
  const cnt = await countUsages(pg, "SAVE10");
  expect(cnt).toBe(1);
});
```

#### E2E Smoke Test
```typescript
test("apply coupon updates subtotal [A1]", async ({ page }) => {
  await page.goto("/checkout");
  await page.getByRole("textbox", { name: /coupon/i }).fill("SAVE10");
  await page.getByRole("button", { name: /apply/i }).click();
  await expect(page.getByRole("status")).toHaveText(/discount applied/i);
  await expect(page.getByTestId("subtotal")).toContainText("$90.00");
});
```

## 4) Agent Conduct Rules (Hard Constraints)

1. **Spec adherence**: Do not implement beyond scope.in; if discovered dependency changes spec, open "Spec delta" in PR and update tests first.
2. **No hidden state/time/net**: All non-determinism injected and controlled in tests.
3. **Explainable mocks**: Only mock boundaries; never mock the function under test; document any mock behavior in comments.
4. **Idempotency & error paths**: Provide tests for retries/timeouts/cancel; assert invariants on error.
5. **Observability parity**: Every key acceptance path emits logs/metrics/traces; tests assert on them when feasible (e.g., fake exporter assertions).
6. **Data safety**: No real PII in fixtures; factories generate realistic but synthetic data.
7. **Accessibility required**: For UI changes: keyboard path test + axe scan; for API: error messages human-readable and localizable.
8. **Performance ownership**: Include micro-bench (where hot path) or budget check; document algorithmic complexity if changed.
9. **Docs as code**: Update README/usage snippets; add example code; regenerate typed clients from contracts.
10. **Rollback ready**: Feature-flag new behavior; write a reversible migration or provide kill-switch.

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

## 7) Language & Tooling Ecosystem

### TypeScript Stack (Recommended)
• **Testing**: Jest/Vitest, fast-check, Playwright, Testcontainers, Stryker, MSW or Pact
• **Quality**: ESLint + types, LHCI, axe-core
• **CI**: GitHub Actions with Node 20

### Python Stack
• **Testing**: pytest, hypothesis, Playwright (Python), Testcontainers-py, mutmut, Schemathesis
• **Quality**: bandit/semgrep, Lighthouse CI, axe-core

### JVM Stack
• **Testing**: JUnit5, jqwik, Testcontainers, PIT (mutation), Pact-JVM
• **Quality**: OWASP dependency check, SonarQube, axe-core

**Note**: Mutation testing is non-negotiable for tiers ≥2; it's the only reliable guard against assertion theater.

## 8) Review Rubric (Scriptable Scoring)

| Category | Weight | Criteria | 0 | 1 | 2 |
|----------|--------|----------|----|----|----|
| Spec clarity & invariants | ×5 | Clear, testable invariants | Missing/unclear | Basic coverage | Comprehensive + edge cases |
| Contract correctness & versioning | ×5 | Schema accuracy + versioning | Errors present | Minor issues | Perfect + versioned |
| Unit thoroughness & edge coverage | ×5 | Branch coverage + property tests | <70% coverage | Meets tier minimum | >90% + properties |
| Integration realism | ×4 | Real containers + seeds | Mocked heavily | Basic containers | Full stack + realistic data |
| E2E relevance & stability | ×3 | Critical paths + semantic selectors | Brittle selectors | Basic coverage | Semantic + stable |
| Mutation adequacy | ×4 | Score vs tier threshold | <50% | Meets minimum | >80% |
| A11y pathways & results | ×3 | Keyboard + axe clean | Major issues | Basic compliance | Full WCAG + keyboard |
| Perf/Resilience | ×3 | Budgets + timeouts/retries | No checks | Basic budgets | Full resilience |
| Observability | ×3 | Logs/metrics/traces asserted | Missing | Basic emission | Asserted in tests |
| Migration safety & rollback | ×3 | Reversible + kill-switch | No rollback | Basic revert | Full rollback + testing |
| Docs & PR explainability | ×3 | Clear rationale + limits | Minimal | Basic docs | Comprehensive + ADR |
| **Mode compliance** | ×3 | Changes match declared `mode` | Violations | Minor drift | Full compliance |
| **Scope & budget discipline** | ×3 | Diff within `scope.in` & budget | Exceeded | Near limit | Within limits |
| **Supply-chain attestations** | ×2 | SBOM + SLSA attestation | Missing | Partial | Complete & valid |

**Target**: ≥ 82/100 (weighted sum). Calculator in `apps/tools/caws/rubric.ts`.

## 9) Anti-patterns (Explicitly Rejected)

• **Over-mocked integration tests**: mocking ORM or HTTP client where containerized integration is feasible.
• **UI tests keyed on CSS classes**: brittle selectors instead of semantic roles/labels.
• **Coupling tests to implementation details**: private method calls, internal sequence assertions.
• **"Retry until green" CI culture**: quarantines without expiry or owner.
• **100% coverage mandates**: without mutation testing or risk awareness.

## 13) Failure-Mode Cards (Common Traps & Recovery)

Add a small section of "If you see X, do Y":

1. **Symptom:** Large rename + re-exports create `*-copy.ts` or `enhanced-*.ts`.
   **Action:** Switch to **refactor mode**. Generate `codemod/rename.ts` that updates imports/exports in place. Validate with `tsc --noEmit` and run mutation tests to ensure unchanged behavior.

2. **Symptom:** Contract change proliferates across services.
   **Action:** Declare **blast\_radius.modules**; create consumer **Pact** tests first. Stage changes behind a feature flag; ship provider compatibility for both old/new fields.

3. **Symptom:** Flaky time-based tests.
   **Action:** Inject `Clock` and use fixed timestamps; assert **idempotency** with property tests.

4. **Symptom:** Agent proposes new external tool/library.
   **Action:** Fail unless added to `tool_allowlist`. Require SBOM delta review and perf/a11y/security notes in the PR.

## 10) Cursor/Codex Agent Integration

### Agent Commands
• `agent plan` → emits plan + test matrix
• `agent verify` → runs local gates; generates provenance
• `agent prove` → creates provenance manifest
• `agent doc` → updates README/changelog from spec

### Guardrails
• **Templates**: Inject Working Spec YAML + PR template on "New Feature" command
• **Scaffold**: Pre-wire tests/* skeletons with containers and contracts
• **Context discipline**: Restrict writes to spec-touched modules; deny outside scope unless spec updated
• **Feedback loop**: PR comments show coverage, mutation diff, contract verification summary

## 11) Adoption Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Add .caws/ directory with schemas and templates
- [ ] Create apps/tools/caws/ validation scripts
- [ ] Wire basic GitHub Actions workflow
- [ ] Add CODEOWNERS for Tier-1 paths

### Phase 2: Quality Gates (Week 2)
- [ ] Enable Testcontainers for integration tests
- [ ] Add mutation testing with tier thresholds
- [ ] Implement trust score calculation
- [ ] Add axe + Playwright smoke for UI changes

### Phase 3: Operational Excellence (Week 3)
- [ ] Publish provenance manifest with PRs
- [ ] Implement flake detector and quarantine process
- [ ] Add waiver system with trust score caps
- [ ] Socialize review rubric and block merges <80

### Phase 4: Continuous Improvement (Ongoing)
- [ ] Monitor drift in contract usage
- [ ] Refine tooling based on feedback
- [ ] Expand language support as needed
- [ ] Track trust score trends and flake rates

## 12) Trust Score Formula

```typescript
const weights = {
  coverage: 0.20,
  mutation: 0.20,
  contracts: 0.16,
  a11y: 0.08,
  perf: 0.08,
  flake: 0.08,
  mode: 0.06,
  scope: 0.06,
  supplychain: 0.04
};

function trustScore(tier: string, prov: Provenance) {
  const wsum = Object.values(weights).reduce((a,b)=>a+b,0);
  const score =
    weights.coverage * normalize(prov.results.coverage_branch, tiers[tier].min_branch, 0.95) +
    weights.mutation * normalize(prov.results.mutation_score, tiers[tier].min_mutation, 0.9) +
    weights.contracts * (tiers[tier].requires_contracts ? (prov.results.contracts.consumer && prov.results.contracts.provider ? 1 : 0) : 1) +
    weights.a11y * (prov.results.a11y === "pass" ? 1 : 0) +
    weights.perf * budgetOk(prov.results.perf) +
    weights.flake * (prov.results.flake_rate <= 0.005 ? 1 : 0.5) +
    weights.mode * (prov.results.mode_compliance === "full" ? 1 : 0.5) +
    weights.scope * (prov.results.scope_within_budget ? 1 : 0) +
    weights.supplychain * (prov.results.sbom_valid && prov.results.attestation_valid ? 1 : 0);
  return Math.round((score/wsum)*100);
}
```

This v1.0 combines the philosophical foundation of our system with the practical, executable implementation details needed for immediate adoption. The framework provides both the "why" (quality principles) and the "how" (automated enforcement) needed for engineering-grade AI coding agents.
