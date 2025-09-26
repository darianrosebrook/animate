# Animator - Animator for Motion Design

> *"Motion as a collaborative, deterministic, systematized craft"*

[![CAWS](https://img.shields.io/badge/CAWS-Engineering%20Grade-blue)](#)
[![Risk Tier 1](https://img.shields.io/badge/Risk%20Tier-1%20Core-red)](#)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 Vision

**Animator** is a modern, collaborative animation software positioned as the "animator's engineering toolkit" - a comprehensive solution for motion design built for the 21st century. We combine real-time collaboration, deterministic GPU compositing, and an open ecosystem to create tools that animators actually deserve.

## 🚀 Key Differentiators

- **🎨 Real-time Collaboration**: CRDT-based multiplayer editing with conflict-free replication
- **⚡ Deterministic Rendering**: Identical output across all platforms and GPU vendors
- **🔧 Open Ecosystem**: Diffable files, plugin architecture, and CI-friendly workflows
- **♿ Accessibility First**: Full keyboard navigation and screen reader support from day one
- **🔒 Security Sandboxed**: Safe expression evaluation and input validation

## 📁 Project Structure

```
├── README.md                    # Main project overview (this file)
├── AGENTS.md                    # CAWS engineering framework
├── .caws/                       # Active working specifications
│   └── working-spec.yaml       # Current feature specification
├── docs/                        # Detailed documentation
│   ├── README.md               # Documentation overview
│   ├── v.0.plan.md             # Original vision document
│   ├── scene-graph.plan.md     # Core system design
│   ├── scene-graph.test-plan.md # Testing strategy
│   ├── scene-graph.impact-map.md # Migration planning
│   └── scene-graph.non-functional.md # A11y, perf, security specs
├── apps/                        # Application modules
│   ├── contracts/              # OpenAPI specifications
│   │   ├── scene-graph-api.yaml
│   │   └── timeline-api.yaml
│   └── tools/                  # Development tools
│       ├── caws/               # CAWS tooling
│       │   ├── attest.js       # SBOM generation
│       │   ├── prompt-lint.js  # AI prompt validation
│       │   └── tools-allow.json # Allowed tools list
│       ├── package.json
│       └── README.md          # Tools documentation
├── src/                        # Source code (when implemented)
├── tests/                      # Test suites (when implemented)
└── codemod/                    # AST transformation scripts
```

## 🏗️ Architecture

### Core Philosophy
We replace other tools' historically layer-stack model with a **declarative scene graph** where time is a first-class dimension. This provides:

- **Deterministic evaluation**: Same inputs = identical outputs
- **Composable systems**: Motion components and tokens
- **Performance by design**: GPU-accelerated rendering with caching
- **Collaboration ready**: CRDT-based conflict resolution

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Core Engine** | Rust → WebAssembly | High-performance scene evaluation |
| **Rendering** | WebGPU | Cross-platform GPU acceleration |
| **Collaboration** | Yjs/Automerge | Conflict-free replicated data types |
| **UI Framework** | React | Component-based user interface |
| **Storage** | SQLite + CAS | Reliable data with content addressing |
| **Testing** | Jest + fast-check | Property-based test validation |

## 📊 Current Status

### ✅ Completed (Planning Phase)
- **[Risk Tier 1]** Core Scene Graph specification
- **[Risk Tier 1]** Timeline evaluation engine design
- **CAWS Framework** implementation and tooling
- **Comprehensive test strategies** with property-based testing
- **OpenAPI contracts** for all major APIs
- **Migration and rollback** planning

### 🚧 Next Phase (Implementation)
1. **Core Scene Graph** - Foundational node system
2. **Timeline Engine** - Time-based evaluation
3. **GPU Rendering** - WebGPU acceleration
4. **Collaboration** - Real-time multiplayer

### 📈 Risk Assessment

| Tier | Focus | Coverage | Mutation | Testing |
|------|-------|----------|----------|---------|
| **1** | Core critical path | 90% branch | 70% score | Contract + chaos |
| **2** | Important features | 80% branch | 50% score | E2E smoke |
| **3** | Quality of life | 70% branch | 30% score | Integration |

## 🛠️ Development

### Prerequisites
- **Node.js** 20+
- **Modern browser** with WebGPU support
- **Git** for version control

### Quick Start
```bash
# Clone the repository (replace with actual repository URL when available)
git clone <repository-url>
cd animator

# Install dependencies
npm install

# Review the CAWS framework
cat AGENTS.md

# Check current working spec
cat .caws/working-spec.yaml

# Explore documentation
ls docs/
```

### CAWS Workflow
This project follows the **CAWS (Coding Agent Workflow System)** methodology:

1. **Plan**: Create working spec with risk tier assessment
2. **Implement**: Contract-first development with comprehensive testing
3. **Verify**: Quality gates with mutation testing and security scanning
4. **Document**: Explainable provenance and migration strategies

## 📚 Documentation

- **[📖 Full Documentation](docs/README.md)** - Comprehensive project documentation
- **[🎯 Vision Document](docs/v.0.plan.md)** - Original product vision and strategy
- **[🏗️ Architecture](docs/scene-graph.plan.md)** - Core system design and interfaces
- **[🧪 Testing](docs/scene-graph.test-plan.md)** - Comprehensive test strategies
- **[🔄 Migration](docs/scene-graph.impact-map.md)** - Deployment and migration planning
- **[⚡ Performance](docs/scene-graph.non-functional.md)** - A11y, performance, and security specs

## 🤝 Contributing

We welcome contributions from developers, animators, and designers! This project follows strict engineering practices:

### Contribution Process
1. **Create Working Spec** - Draft YAML specification in `.caws/working-spec.yaml`
2. **Risk Assessment** - Determine appropriate tier (1-3)
3. **Plan Documentation** - Create feature plan with design sketches
4. **Test Strategy** - Define comprehensive test coverage
5. **Implementation** - Follow contract-first development
6. **Verification** - Ensure all CAWS quality gates pass

### Quality Standards
- **70% mutation score** for Tier 1 features
- **Contract tests** must pass before implementation
- **Accessibility compliance** (WCAG 2.1 AA)
- **Security sandboxing** for all user inputs
- **Comprehensive documentation** for all changes

## 🔒 Security & Ethics

- **Sandboxed execution** for all user expressions
- **Input validation** and sanitization
- **Memory safety** with bounds checking
- **Accessibility-first** design philosophy
- **Open source** with transparent development

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CAWS Framework** for engineering excellence
- **Animation Community** for inspiration and feedback
- **Open Source Contributors** for making this possible

---

**Building the tools animators deserve** 🎨✨

For questions or support, please open an issue or reach out to the development team.
