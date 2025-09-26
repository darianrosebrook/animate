#!/usr/bin/env node

/**
 * @fileoverview Generate SBOM and SLSA-style attestations for CAWS
 * Creates CycloneDX SBOM and in-toto attestation statements
 * @author @darianrosebrook
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Generate CycloneDX SBOM
 * @param {string} projectRoot - Project root directory
 * @returns {Object} - SBOM object
 */
function generateSBOM(projectRoot) {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
  );

  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const components = Object.entries(dependencies).map(([name, version]) => ({
    type: "library",
    name: name,
    version: version,
    purl: `pkg:npm/${name}@${version}`,
    hashes: [], // Would be populated with actual hashes in production
  }));

  return {
    bomFormat: "CycloneDX",
    specVersion: "1.4",
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: {
        components: [
          {
            type: "application",
            name: "caws-attest",
            version: "1.0.0",
          },
        ],
      },
    },
    components: components,
  };
}

/**
 * Generate SLSA provenance attestation
 * @param {string} projectRoot - Project root directory
 * @param {Object} buildInfo - Build information
 * @returns {Object} - Attestation object
 */
function generateAttestation(projectRoot, buildInfo = {}) {
  const now = new Date().toISOString();

  return {
    _type: "https://in-toto.io/Statement/v0.1",
    subject: [
      {
        name: path.basename(projectRoot),
        digest: {
          sha256: hashDirectory(projectRoot),
        },
      },
    ],
    predicateType: "https://slsa.dev/provenance/v0.2",
    predicate: {
      builder: {
        id: "https://github.com/actions/runner",
      },
      buildType: "https://github.com/actions/runner@v2",
      invocation: {
        configSource: {
          uri: "git+https://github.com/example/repo",
          digest: {
            sha1: buildInfo.commit || "unknown",
          },
        },
        parameters: {
          frontend: "github-actions",
          github_run_id: buildInfo.runId || "unknown",
        },
        environment: {
          platform: process.platform,
          architecture: process.arch,
          node_version: process.version,
        },
      },
      buildConfig: {
        buildFlags: [],
      },
      metadata: {
        buildInvocationId: buildInfo.invocationId || crypto.randomUUID(),
        buildStartedOn: now,
        buildFinishedOn: now,
        completeness: {
          parameters: true,
          environment: true,
          materials: false,
        },
        reproducible: false,
      },
      materials: [
        {
          uri: "git+https://github.com/example/repo",
          digest: {
            sha1: buildInfo.commit || "unknown",
          },
        },
      ],
    },
  };
}

/**
 * Generate SHA256 hash of directory contents
 * @param {string} dirPath - Directory path
 * @returns {string} - SHA256 hash
 */
function hashDirectory(dirPath) {
  const files = getAllFiles(dirPath);
  const hashes = files
    .filter((file) => !file.includes(".git") && !file.includes("node_modules"))
    .map((file) => {
      try {
        const content = fs.readFileSync(file);
        return crypto.createHash("sha256").update(content).digest("hex");
      } catch (e) {
        return "";
      }
    })
    .filter((hash) => hash.length > 0)
    .sort();

  return crypto.createHash("sha256").update(hashes.join("")).digest("hex");
}

/**
 * Get all files recursively
 * @param {string} dirPath - Directory path
 * @param {string[]} arrayOfFiles - Accumulator array
 * @returns {string[]} - Array of file paths
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (![".git", "node_modules", ".caws", ".agent"].includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * Main function
 * @param {string} projectRoot - Project root directory
 * @param {Object} options - Options
 * @returns {Object} - Generated artifacts
 */
function generateAttestations(projectRoot, options = {}) {
  const outputDir = options.outputDir || ".agent";

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate SBOM
  const sbom = generateSBOM(projectRoot);
  const sbomPath = path.join(outputDir, "sbom.json");
  fs.writeFileSync(sbomPath, JSON.stringify(sbom, null, 2));

  // Generate attestation
  const attestation = generateAttestation(projectRoot, options.buildInfo || {});
  const attestationPath = path.join(outputDir, "attestation.json");
  fs.writeFileSync(attestationPath, JSON.stringify(attestation, null, 2));

  return {
    sbom: sbomPath,
    attestation: attestationPath,
  };
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectRoot = args[0] || process.cwd();
  const outputDir = args[1] || ".agent";

  try {
    const artifacts = generateAttestations(projectRoot, { outputDir });

    console.log("✅ Generated attestations:");
    console.log(`  SBOM: ${artifacts.sbom}`);
    console.log(`  Attestation: ${artifacts.attestation}`);

    // Output paths for CI
    console.log(`::set-output name=sbom-path::${artifacts.sbom}`);
    console.log(`::set-output name=attestation-path::${artifacts.attestation}`);
  } catch (error) {
    console.error("❌ Failed to generate attestations:", error.message);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  generateSBOM,
  generateAttestation,
  hashDirectory,
  getAllFiles,
  generateAttestations,
};
