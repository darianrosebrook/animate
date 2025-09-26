#!/usr/bin/env node

/**
 * @fileoverview Prompt and tool hygiene linter for CAWS agents
 * Validates prompts don't contain secrets and tools are in allowlist
 * @author @darianrosebrook
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Check if a string contains potential secrets
 * @param {string} content - Content to check
 * @returns {boolean} - True if potential secrets found
 */
function containsSecrets(content) {
  const secretPatterns = [
    /password[\s:=]\s*['"][^'"]{3,}['"]/i,
    /secret[\s:=]\s*['"][^'"]{3,}['"]/i,
    /key[\s:=]\s*['"][^'"]{3,}['"]/i,
    /token[\s:=]\s*['"][^'"]{3,}['"]/i,
    /api_key[\s:=]\s*['"][^'"]{3,}['"]/i,
    /sk-[a-zA-Z0-9]{32,}/, // OpenAI API keys
    /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access tokens
    /pk_test_[a-zA-Z0-9]{32,}/, // Stripe test keys
    /pk_live_[a-zA-Z0-9]{32,}/, // Stripe live keys
    /AKIA[0-9A-Z]{16}/, // AWS access key IDs
  ];

  return secretPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check if tool is in allowlist
 * @param {string} tool - Tool name to check
 * @param {string[]} allowlist - Array of allowed tools
 * @returns {boolean} - True if tool is allowed
 */
function isToolAllowed(tool, allowlist) {
  return allowlist.some((allowed) => {
    // Support wildcards and exact matches
    if (allowed.includes("*")) {
      const pattern = allowed.replace(/\*/g, ".*");
      return new RegExp(`^${pattern}$`).test(tool);
    }
    return allowed === tool;
  });
}

/**
 * Hash content for provenance
 * @param {string} content - Content to hash
 * @returns {string} - SHA256 hash
 */
function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Main linting function
 * @param {string[]} files - Files to lint
 * @param {string} allowlistPath - Path to tool allowlist
 * @returns {Object} - Linting results
 */
function lintPrompts(files, allowlistPath) {
  const results = {
    passed: true,
    errors: [],
    warnings: [],
  };

  // Load allowlist
  let allowlist = [];
  if (fs.existsSync(allowlistPath)) {
    try {
      allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
    } catch (e) {
      results.errors.push(`Failed to parse allowlist: ${e.message}`);
      results.passed = false;
      return results;
    }
  }

  files.forEach((file) => {
    if (!fs.existsSync(file)) {
      results.errors.push(`File not found: ${file}`);
      return;
    }

    const content = fs.readFileSync(file, "utf8");

    // Check for secrets
    if (containsSecrets(content)) {
      results.errors.push(`Potential secrets found in ${file}`);
      results.passed = false;
    }

    // Extract and validate tools
    const toolMatches = content.match(/tool[\s:=]\s*['"]([^'"]+)['"]/g) || [];
    const tools = toolMatches.map(
      (match) => match.match(/tool[\s:=]\s*['"]([^'"]+)['"]/)[1]
    );

    tools.forEach((tool) => {
      if (!isToolAllowed(tool, allowlist)) {
        results.errors.push(`Tool not in allowlist: ${tool} in ${file}`);
        results.passed = false;
      }
    });

    // Add provenance info
    results[file] = {
      hash: hashContent(content),
      tools: tools,
      size: content.length,
    };
  });

  return results;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: prompt-lint.js <prompt-file> [allowlist-path]");
    process.exit(1);
  }

  const files = args[0].includes("*")
    ? require("glob").sync(args[0])
    : [args[0]];

  const allowlistPath = args[1] || ".agent/tools-allow.json";

  const results = lintPrompts(files, allowlistPath);

  if (!results.passed) {
    console.error("❌ Prompt linting failed:");
    results.errors.forEach((err) => console.error(`  ${err}`));
    process.exit(1);
  }

  console.log("✅ All prompts passed linting");
  console.log(`Checked ${files.length} files`);
}

// Export for testing
module.exports = { lintPrompts, containsSecrets, isToolAllowed, hashContent };
