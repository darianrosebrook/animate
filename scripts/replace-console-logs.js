#!/usr/bin/env node

/**
 * @fileoverview Console.log Replacement Script
 * @description Replace console.log statements with proper logger calls
 * @author @darianrosebrook
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Configuration
const SRC_DIR = 'src'
const LOGGER_IMPORT = "import { logger } from '@/core/logging/logger'"

// Patterns to replace
const CONSOLE_PATTERNS = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    description: 'console.log -> logger.info'
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    description: 'console.warn -> logger.warn'
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    description: 'console.error -> logger.error'
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
    description: 'console.debug -> logger.debug'
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info(',
    description: 'console.info -> logger.info'
  }
]

/**
 * Check if file already has logger import
 */
function hasLoggerImport(content) {
  return content.includes("from '@/core/logging/logger'") || 
         content.includes("from '../core/logging/logger'") ||
         content.includes("from '../../core/logging/logger'")
}

/**
 * Add logger import to file
 */
function addLoggerImport(content) {
  // Find the last import statement
  const lines = content.split('\n')
  let lastImportIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i
    }
  }
  
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, LOGGER_IMPORT)
  } else {
    // No imports found, add at the beginning
    lines.unshift(LOGGER_IMPORT)
  }
  
  return lines.join('\n')
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let newContent = content
    let hasChanges = false
    
    // Check if file has console statements
    const hasConsole = CONSOLE_PATTERNS.some(pattern => pattern.pattern.test(content))
    
    if (!hasConsole) {
      return { filePath, changes: 0, skipped: true }
    }
    
    // Replace console statements
    CONSOLE_PATTERNS.forEach(({ pattern, replacement, description }) => {
      const matches = newContent.match(pattern)
      if (matches) {
        newContent = newContent.replace(pattern, replacement)
        hasChanges = true
        console.log(`  ${description}: ${matches.length} replacements`)
      }
    })
    
    // Add logger import if needed
    if (hasChanges && !hasLoggerImport(newContent)) {
      newContent = addLoggerImport(newContent)
      console.log(`  Added logger import`)
    }
    
    // Write file if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8')
      return { filePath, changes: 1, skipped: false }
    }
    
    return { filePath, changes: 0, skipped: true }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
    return { filePath, changes: 0, error: error.message }
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Finding TypeScript/JavaScript files...')
  
  // Find all TypeScript and JavaScript files
  const files = glob.sync(`${SRC_DIR}/**/*.{ts,tsx,js,jsx}`, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  })
  
  console.log(`📁 Found ${files.length} files to process`)
  
  let totalChanges = 0
  let processedFiles = 0
  let skippedFiles = 0
  let errorFiles = 0
  
  files.forEach(filePath => {
    console.log(`\n📄 Processing: ${filePath}`)
    const result = processFile(filePath)
    
    if (result.error) {
      errorFiles++
    } else if (result.skipped) {
      skippedFiles++
      console.log(`  ⏭️  Skipped (no console statements)`)
    } else {
      processedFiles++
      totalChanges += result.changes
      console.log(`  ✅ Processed successfully`)
    }
  })
  
  console.log('\n📊 Summary:')
  console.log(`  📁 Total files: ${files.length}`)
  console.log(`  ✅ Processed: ${processedFiles}`)
  console.log(`  ⏭️  Skipped: ${skippedFiles}`)
  console.log(`  ❌ Errors: ${errorFiles}`)
  console.log(`  🔄 Total changes: ${totalChanges}`)
  
  if (errorFiles > 0) {
    console.log('\n⚠️  Some files had errors. Please check the output above.')
    process.exit(1)
  } else {
    console.log('\n🎉 Console.log replacement completed successfully!')
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { processFile, addLoggerImport, hasLoggerImport }
