# CAWS File Structure - Complete Project Documentation

## 📁 Project Structure Overview

This document outlines the complete file and folder structure for the Animator project's CAWS (Coder's Assistant Working System) implementation.

## 🏗️ Root Structure

```
Animator/
├── README.md                    # Main project overview
├── AGENTS.md                    # CAWS framework documentation
├── .caws/                       # Active working specifications
├── docs/                        # Detailed documentation
├── apps/
│   ├── contracts/              # OpenAPI specifications
│   └── tools/
│       └── caws/               # CAWS tooling
├── src/                        # Source code
├── tests/                      # Test suites
└── implementation/             # Implementation milestones
```

## 📋 Detailed Structure

### **🔧 CAWS Core Directory (.caws/)**

```
.caws/
├── working-spec.yaml           # Current active feature specification
├── color-system-spec.yaml      # Color system feature spec
├── developer-mode-spec.yaml    # Developer mode feature spec
├── effects-spec.yaml          # Effects system feature spec
├── export-system-spec.yaml    # Export system feature spec
├── media-pipeline-spec.yaml   # Media pipeline feature spec
├── timeline-spec.yaml         # Timeline system feature spec
├── workspace-management-spec.yaml # Workspace management feature spec
├── policy/
│   └── tier-policy.json       # Risk tier configuration and thresholds
├── schemas/
│   ├── working-spec.schema.json # JSON schema for working spec validation
│   └── provenance.schema.json   # JSON schema for provenance tracking
├── templates/
│   ├── working-spec.yaml      # Template for new working specs
│   ├── feature.plan.md        # Template for feature plans
│   ├── test-plan.md          # Template for test plans
│   ├── motion-feature.yaml    # Motion graphics specific template
│   └── pr.md                 # Pull request template
└── validate.js               # Working spec validation script
```

### **📚 Documentation Directory (docs/)**

```
docs/
├── README.md                 # Documentation overview and navigation
├── v.0.plan.md              # Original comprehensive vision document
├── testing-strategy.md      # Project-wide testing strategy
├── collaboration-strategy.md # Multi-player editing strategy
├── api-design.md            # API design principles
├── api-integration.md       # API integration patterns
├── keyboard-shortcuts.md    # Keyboard shortcut documentation
├── features/                # Feature-specific documentation
│   ├── export-system.plan.md
│   ├── library-management.plan.md
│   └── workspace-management.plan.md
├── scene-graph.plan.md      # Scene graph feature plan
├── scene-graph.test-plan.md # Scene graph test plan
├── scene-graph.impact-map.md # Scene graph impact analysis
├── scene-graph.non-functional.md # Scene graph NFRs
├── collaboration.plan.md    # Collaboration feature plan
├── collaboration.test-plan.md # Collaboration test plan
├── color-system.plan.md     # Color system feature plan
├── color-system.test-plan.md # Color system test plan
├── color-system.implementation.md # Color system implementation
├── developer-mode.plan.md   # Developer mode feature plan
├── developer-mode.test-plan.md # Developer mode test plan
├── workspace-management.plan.md # Workspace management feature plan
├── workspace-management.test-plan.md # Workspace management test plan
├── workspace-management.impact-map.md # Workspace management impact analysis
└── workspace-management.non-functional.md # Workspace management NFRs
```

### **🔌 API Contracts Directory (apps/contracts/)**

```
apps/contracts/
├── animator-api.yaml        # Main Animator API specification
├── scene-graph-api.yaml     # Scene graph API specification
├── timeline-api.yaml        # Timeline API specification
├── effects-api.yaml         # Effects API specification
├── media-api.yaml          # Media API specification
├── library-api.yaml        # Library API specification
├── sandbox-api.yaml        # Sandbox API specification
└── developer-mode-api.yaml  # Developer mode API specification
```

### **🛠️ CAWS Tools Directory (apps/tools/caws/)**

```
apps/tools/caws/
├── attest.js               # SBOM and SLSA attestation generation
├── prompt-lint.js          # AI prompt security validation
└── tools-allow.json        # Allowed tools configuration for AI agents
```

### **📁 Implementation Milestones (implementation/milestones/)**

```
implementation/milestones/
├── README.md               # Implementation milestone overview
├── milestone-1-core-infrastructure/
│   └── README.md          # Core infrastructure milestone
├── milestone-2-scene-graph/
│   └── README.md          # Scene graph milestone
├── milestone-3-basic-rendering/
│   └── README.md          # Basic rendering milestone
├── milestone-4-timeline-system/
│   └── README.md          # Timeline system milestone
├── milestone-5-effects-system/
│   └── README.md          # Effects system milestone
└── milestone-6-media-pipeline/
    └── README.md          # Media pipeline milestone
```

### **🏗️ Source Code Structure (src/)**

```
src/
├── core/                   # Core engine (Rust)
│   ├── lib.rs             # Core library
│   ├── evaluator/         # Expression evaluator
│   ├── renderer/          # Rendering system
│   ├── scene-graph/       # Scene graph implementation
│   └── sandbox/           # Execution sandbox
├── api/                   # API layer
│   ├── wrappers/          # Safe API wrappers
│   └── *.ts              # API implementations
├── effects/               # Effects system
├── media/                 # Media pipeline
├── timeline/              # Timeline system
├── types/                 # TypeScript type definitions
├── ui/                    # React UI components
└── test/                  # Test utilities
```

### **🧪 Test Structure (tests/)**

```
tests/
├── effects-system.test.ts     # Effects system tests
├── milestone3-comprehensive.test.ts # Comprehensive milestone tests
├── milestone3-core.test.ts    # Core milestone tests
├── milestone3-path-integration.test.ts # Path integration tests
├── path-renderer.test.ts      # Path renderer tests
├── performance-optimizations.test.ts # Performance tests
├── timeline-debug.test.ts     # Timeline debugging tests
└── timeline-system.test.ts    # Timeline system tests
```

## 📊 File Type Summary

| Type | Count | Purpose |
|------|-------|---------|
| **YAML Specs** | 9 | Feature specifications (1 main + 8 feature-specific) |
| **Markdown Docs** | 25 | Documentation and planning documents |
| **API Specs** | 8 | OpenAPI contract specifications |
| **Test Files** | 8 | Test suite files |
| **Tool Scripts** | 3 | CAWS tooling scripts |
| **Schema Files** | 2 | JSON schemas for validation |
| **Template Files** | 5 | Reusable templates |
| **Milestone Docs** | 6 | Implementation milestone documentation |

## 🎯 CAWS Workflow Integration Points

### **Active Working Specifications**
- **Main Spec**: `.caws/working-spec.yaml` - Current active feature
- **Feature Specs**: Individual feature specifications (8 total)
- **Policy Config**: `.caws/policy/tier-policy.json` - Risk tier thresholds
- **Validation**: `.caws/validate.js` - Working spec validation

### **Documentation Integration**
- **Strategy Docs**: `testing-strategy.md`, `collaboration-strategy.md`
- **Feature Plans**: `*.plan.md` files for each major feature
- **Test Plans**: `*.test-plan.md` files for comprehensive testing
- **Impact Maps**: `*.impact-map.md` files for change analysis

### **Contract Integration**
- **API Specs**: OpenAPI specifications for all major APIs
- **Contract Tests**: Integration with Pact/WireMock for API testing
- **Schema Validation**: JSON schema validation for all contracts

## 🔧 CLI Tool Integration Points

### **Validation Commands**
```bash
# Validate current working spec
node .caws/validate.js .caws/working-spec.yaml

# Validate all feature specs
find .caws -name "*-spec.yaml" -exec node .caws/validate.js {} \;

# Validate all documentation
find docs -name "*.md" -exec markdownlint {} \;
```

### **Generation Commands**
```bash
# Generate new feature spec from template
cp .caws/templates/working-spec.yaml .caws/new-feature-spec.yaml

# Generate feature plan from template
cp .caws/templates/feature.plan.md docs/new-feature.plan.md

# Generate attestation
node apps/tools/caws/attest.js > .agent/attestation.json
```

### **Linting Commands**
```bash
# Lint AI prompts for security
node apps/tools/caws/prompt-lint.js .agent/prompts/*.md --allowlist .agent/tools-allow.json

# Check file naming conventions
node .caws/validate.js --naming

# Validate JSON schemas
node .caws/validate.js --schemas
```

## 📈 Structure Validation Checklist

### **CAWS Compliance**
- [x] `.caws/` directory at project root
- [x] `working-spec.yaml` present and valid
- [x] Policy configuration in place
- [x] Schema validation available
- [x] Template system established

### **Documentation Completeness**
- [x] Strategy documents for major features
- [x] Feature plans for all major components
- [x] Test plans for comprehensive testing
- [x] Impact analysis for major changes

### **API Contract Coverage**
- [x] OpenAPI specs for all major APIs
- [x] Contract test integration points
- [x] Schema validation for contracts

### **Tool Integration**
- [x] Validation tooling in place
- [x] Attestation generation available
- [x] Security scanning implemented

## 🔄 Maintenance Guidelines

### **Adding New Features**
1. Create feature-specific spec in `.caws/`
2. Add corresponding documentation in `docs/`
3. Update main `README.md` navigation
4. Add API contracts to `apps/contracts/`
5. Create comprehensive test plan

### **Updating Documentation**
1. Follow established naming conventions
2. Update navigation in `docs/README.md`
3. Cross-reference related documents
4. Include implementation examples

### **Modifying CAWS Structure**
1. Update this structure document
2. Modify validation scripts accordingly
3. Update CLI tooling integration
4. Communicate changes to team

---

*This structure document serves as the single source of truth for the Animator project's CAWS file organization and should be updated whenever the structure evolves.*


