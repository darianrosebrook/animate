#!/usr/bin/env node

/**
 * @fileoverview AST codemod template for CAWS refactor mode
 * Updates import/export statements when renaming modules
 * @author @darianrosebrook
 * @example npx ts-morph ./codemod/rename.ts src/ --oldName="old-module" --newName="new-module"
 */

import { Node, Project, SyntaxKind } from "ts-morph";

const project = new Project();

/**
 * Update import declarations
 * @param {string} oldName - Old module name
 * @param {string} newName - New module name
 */
function updateImports(oldName: string, newName: string) {
  const sourceFiles = project.getSourceFiles();

  sourceFiles.forEach((sourceFile) => {
    // Update import declarations
    sourceFile.getImportDeclarations().forEach((imp) => {
      const moduleSpecifier = imp.getModuleSpecifierValue();

      if (moduleSpecifier === oldName) {
        imp.setModuleSpecifier(newName);
      }
    });

    // Update export declarations
    sourceFile.getExportDeclarations().forEach((exp) => {
      const moduleSpecifier = exp.getModuleSpecifierValue();

      if (moduleSpecifier === oldName) {
        exp.setModuleSpecifier(newName);
      }
    });

    // Update dynamic imports
    sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call) => call.getExpression().getText() === "import")
      .forEach((call) => {
        const args = call.getArguments();
        if (args.length > 0 && args[0].getText() === `"${oldName}"`) {
          args[0].replaceWithText(`"${newName}"`);
        }
      });
  });
}

/**
 * Validate that the refactor preserves semantics
 * @param {string[]} files - Files to validate
 * @returns {boolean} - True if validation passes
 */
function validateRefactor(files: string[]): boolean {
  // Add semantic validation logic here
  // For example:
  // - Ensure no broken imports
  // - Check TypeScript compilation
  // - Run tests to ensure behavior is preserved

  console.log("🔍 Running semantic validation...");

  // TypeScript compilation check
  const diagnostics = project.getPreEmitDiagnostics();
  if (diagnostics.length > 0) {
    console.error("❌ TypeScript compilation errors found:");
    diagnostics.forEach((diag) => {
      console.error(`  ${diag.getMessageText()}`);
    });
    return false;
  }

  console.log("✅ Semantic validation passed");
  return true;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const files = args.filter((arg) => !arg.startsWith("--"));
  const oldName = args
    .find((arg) => arg.startsWith("--oldName="))
    ?.split("=")[1];
  const newName = args
    .find((arg) => arg.startsWith("--newName="))
    ?.split("=")[1];

  if (!oldName || !newName) {
    console.error(
      'Usage: codemod/rename.ts <files> --oldName="old-module" --newName="new-module"'
    );
    process.exit(1);
  }

  try {
    // Add source files
    project.addSourceFilesAtPaths(
      files.length > 0 ? files : "src/**/*.{ts,tsx}"
    );

    console.log(`🔄 Renaming ${oldName} → ${newName}`);

    // Perform the transformation
    updateImports(oldName, newName);

    // Validate the changes
    if (!validateRefactor(files)) {
      process.exit(1);
    }

    // Save all changes
    project.saveSync();

    console.log("✅ Refactor completed successfully");
    console.log("📝 Changes made:");
    console.log(`  - Updated ${project.getSourceFiles().length} files`);
    console.log(`  - Changed ${oldName} to ${newName} in imports/exports`);
  } catch (error) {
    console.error("❌ Refactor failed:", error.message);
    process.exit(1);
  }
}

// Export for testing
export { updateImports, validateRefactor };
