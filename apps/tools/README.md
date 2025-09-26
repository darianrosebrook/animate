# CAWS Tools - Development Tooling

This directory contains the **CAWS (Coding Agent Workflow System)** development tools that enforce engineering quality gates and provide provenance tracking for the Animator project.

## 🛠️ Tools Overview

| Tool | Purpose | When to Use | Output |
|------|---------|-------------|---------|
| **attest.js** | Generate SBOM + SLSA attestation | Before releases, security audits, or compliance checks | JSON file with dependency tree and security metadata |
| **prompt-lint.js** | Validate AI prompts for security | Before using AI agents, or when creating new prompts | Validation report showing security issues |
| **tools-allow.json** | Define allowed tools for AI agents | When configuring security policies or restricting agent capabilities | Configuration file controlling agent permissions |

## 🔧 Tool Details

### attest.js *(Supply Chain Security)*
Generates **SBOM (Software Bill of Materials)** and **SLSA (Supply chain Levels for Software Artifacts)** attestations for CI/CD provenance tracking.

**When to use:**
- Before software releases or deployments
- During security audits or compliance checks
- When generating build provenance for regulators

**Usage:**
```bash
# Generate attestation for current state
node apps/tools/caws/attest.js > .agent/attestation.json

# In CI/CD pipeline
npx @cyclonedx/cyclonedx-npm --output-file .agent/sbom.json
node apps/tools/caws/attest.js > .agent/attestation.json
```

**What it captures:**
- Complete dependency tree with license information
- Build environment and toolchain details
- Cryptographic signatures for supply chain verification
- Security vulnerability assessments

### prompt-lint.js *(AI Agent Security)*
Validates AI prompts for security compliance and ensures only allowed tools are used in automated development workflows.

**When to use:**
- Before committing AI-generated prompts to version control
- When setting up new AI agent workflows
- During security reviews of automation scripts

**Usage:**
```bash
# Validate a single prompt file
node apps/tools/caws/prompt-lint.js prompts/my-prompt.md --allowlist tools-allow.json

# Validate all prompts in a directory
node apps/tools/caws/prompt-lint.js .agent/prompts/*.md --allowlist .agent/tools-allow.json

# In CI/CD pipeline (example)
node apps/tools/caws/prompt-lint.js .agent/prompts/*.md --allowlist .agent/tools-allow.json || exit 1
```

**Security checks performed:**
- ✅ Tool allowlist enforcement (prevents unauthorized tool usage)
- ✅ Secret scanning (detects passwords, tokens, keys in prompts)
- ✅ Context firebreak validation (prevents secrets leaking to AI)
- ✅ Security policy compliance (enforces organizational standards)

### tools-allow.json *(Agent Permissions)*
Defines the permitted tool set for AI agents to prevent security risks while maintaining development productivity.

**When to modify:**
- Adding new safe tools to the development workflow
- Restricting agent capabilities for security hardening
- Configuring different permission levels for different environments

**Configuration example:**
```json
{
  "allowed_tools": [
    "read_file",      // Safe to read project files
    "search_replace", // Can modify files within project scope
    "list_dir",       // Can navigate project structure
    "grep",          // Can search code and documentation
    "run_terminal_cmd" // Can run build scripts and tests
  ],
  "security_context": {
    "max_file_size": "10MB",      // Prevent processing huge files
    "allowed_domains": ["internal", "github.com"], // Restrict network access
    "blocked_patterns": ["password", "token", "secret", "key"], // Block sensitive data
    "file_scope": ["src/", "tests/", "docs/"] // Limit file modifications
  }
}
```

## 🔐 Security Features

### Prompt Security *(AI Agent Protection)*
- **Tool Allowlisting**: Only explicitly permitted tools can be used
- **Context Firebreaks**: Prevents secrets from entering AI context
- **Pattern Blocking**: Blocks sensitive data patterns like passwords, tokens
- **Size Limits**: Prevents oversized file processing that could cause issues

### SBOM Generation *(Supply Chain Security)*
- **Dependency Tracking**: Complete software bill of materials
- **License Compliance**: License verification and compatibility checking
- **Vulnerability Scanning**: Integration with security databases
- **Provenance Tracking**: Cryptographic attestation of build process

## 🏗️ Integration with CAWS

### Development Workflow
These tools integrate with the broader CAWS framework throughout the development lifecycle:

**1. Development Phase:**
```bash
# Before using AI agents
node apps/tools/caws/prompt-lint.js prompts/*.md --allowlist tools-allow.json

# Generate attestation after major changes
node apps/tools/caws/attest.js > .agent/attestation.json
```

**2. Pre-commit:**
```bash
# Run security checks before commit
npm run security:scan
npm run prompt:validate
```

**3. CI/CD Pipeline:**
```bash
# Automated quality gates
- name: Security Scan
  run: node apps/tools/caws/prompt-lint.js .agent/prompts/*.md --allowlist .agent/tools-allow.json

- name: Generate SBOM
  run: node apps/tools/caws/attest.js > .agent/attestation.json

- name: Verify Attestation
  run: node apps/tools/caws/validate-attestation.js .agent/attestation.json
```

**4. Pull Request Validation:**
- Automatic prompt security validation
- SBOM generation and verification
- License compliance checking
- Provenance tracking for all changes

## 🚨 Common Issues & Solutions

### Prompt Security Issues
**Problem:** `Error: Tool 'xyz' not in allowlist`
**Solution:** Add the tool to `tools-allow.json` or use an allowed alternative

**Problem:** `Error: Secret detected in prompt`
**Solution:** Remove sensitive data from prompts, use environment variables instead

### SBOM Generation Issues
**Problem:** `Error: Missing dependencies in SBOM`
**Solution:** Run `npm install` first, then regenerate SBOM

**Problem:** `Error: License compliance failed`
**Solution:** Review and update incompatible dependencies

## 📊 Quality Gates

### Required Gates
- ✅ **Prompt Security**: All AI prompts validated
- ✅ **Tool Compliance**: Only allowed tools used
- ✅ **SBOM Generation**: Complete software bill of materials
- ✅ **Attestation Signing**: Cryptographic verification

### Optional Gates
- 🔄 **Vulnerability Scanning**: Security vulnerability detection
- 🔄 **License Compatibility**: License compliance checking
- 🔄 **Dependency Analysis**: Deep dependency tree analysis

## 🚀 Usage in Development

### For AI Agents
```bash
# Validate prompt before use
node apps/tools/caws/prompt-lint.js prompt.md --allowlist tools-allow.json

# Generate attestation after changes
node apps/tools/caws/attest.js > attestation.json
```

### For Human Developers
```bash
# Run security checks
npm run security:scan

# Generate provenance
npm run provenance:generate

# Validate all gates
npm run caws:validate
```

## 📈 Monitoring & Alerts

### Metrics Tracked
- **Prompt validation success rate**
- **Security violation frequency**
- **SBOM completeness scores**
- **Attestation generation time**

### Alert Conditions
- 🚨 **High**: Security violations detected
- ⚠️ **Medium**: SBOM generation failures
- ℹ️ **Low**: License compatibility issues

## 🔄 CI/CD Integration

The tools are integrated into the GitHub Actions workflow:

```yaml
- name: Generate SBOM
  run: npx @cyclonedx/cyclonedx-npm --output-file .agent/sbom.json

- name: Create Attestation
  run: node apps/tools/caws/attest.js > .agent/attestation.json

- name: Prompt Security Check
  run: node apps/tools/caws/prompt-lint.js .agent/prompts/*.md --allowlist .agent/tools-allow.json
```

## 📚 References

- **[CAWS Framework](../../AGENTS.md)** - Complete engineering methodology
- **[Working Spec](../../.caws/working-spec.yaml)** - Current feature specification
- **[Security Policy](../docs/security-policy.md)** - Security requirements and procedures

---

*Part of the CAWS engineering-grade development system for the Animator project.*
