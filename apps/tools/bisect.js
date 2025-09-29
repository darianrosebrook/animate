#!/usr/bin/env node

/**
 * @fileoverview Git Bisect Tool for Regression Hunting
 * @author @darianrosebrook
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/**
 * Bisect tool for automated regression hunting
 */
class BisectTool {
  constructor() {
    this.repoRoot = this.findRepoRoot()
    this.logFile = path.join(this.repoRoot, 'bisect.log')
  }

  /**
   * Find the Git repository root
   */
  findRepoRoot() {
    try {
      return execSync('git rev-parse --show-toplevel', {
        encoding: 'utf8',
      }).trim()
    } catch (error) {
      throw new Error('Not in a Git repository')
    }
  }

  /**
   * Run Git bisect with a test command
   */
  async runBisect(goodCommit, badCommit, testCommand) {
    console.log('🔍 Starting Git bisect...')
    console.log(`Good commit: ${goodCommit}`)
    console.log(`Bad commit: ${badCommit}`)
    console.log(`Test command: ${testCommand}`)

    try {
      // Start bisect
      execSync(`git bisect start`, { cwd: this.repoRoot })
      execSync(`git bisect good ${goodCommit}`, { cwd: this.repoRoot })
      execSync(`git bisect bad ${badCommit}`, { cwd: this.repoRoot })

      let currentCommit = ''
      let iterations = 0
      const maxIterations = 10 // Prevent infinite loops

      while (iterations < maxIterations) {
        iterations++
        currentCommit = execSync('git rev-parse HEAD', {
          cwd: this.repoRoot,
          encoding: 'utf8',
        }).trim()

        console.log(
          `\n🔄 Testing commit: ${currentCommit} (iteration ${iterations})`
        )

        // Run test command
        try {
          execSync(testCommand, { cwd: this.repoRoot, stdio: 'inherit' })
          console.log('✅ Test passed - marking as good')
          execSync('git bisect good', { cwd: this.repoRoot })
        } catch (error) {
          console.log('❌ Test failed - marking as bad')
          execSync('git bisect bad', { cwd: this.repoRoot })
        }

        // Check if bisect is done
        const status = execSync('git bisect log', {
          cwd: this.repoRoot,
          encoding: 'utf8',
        })
        if (status.includes('is the first bad commit')) {
          console.log('🎯 Found the first bad commit!')
          this.logResult(currentCommit, 'bad')
          break
        }
      }

      // End bisect
      execSync('git bisect reset', { cwd: this.repoRoot })
      console.log('✅ Bisect completed')
    } catch (error) {
      console.error('❌ Bisect failed:', error.message)
      execSync('git bisect reset', { cwd: this.repoRoot })
      this.logResult(currentCommit, 'error')
      throw error
    }
  }

  /**
   * Log bisect result
   */
  logResult(commit, status) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      commit,
      status,
      repoRoot: this.repoRoot,
    }

    let logs = []
    if (fs.existsSync(this.logFile)) {
      logs = JSON.parse(fs.readFileSync(this.logFile, 'utf8'))
    }
    logs.push(logEntry)
    fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2))
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.log(
      'Usage: node bisect.js <good-commit> <bad-commit> <test-command>'
    )
    console.log('Example: node bisect.js HEAD~10 HEAD "npm test"')
    process.exit(1)
  }

  const [goodCommit, badCommit, testCommand] = args
  const tool = new BisectTool()

  tool
    .runBisect(goodCommit, badCommit, testCommand)
    .then(() => console.log('Bisect completed successfully'))
    .catch((error) => {
      console.error('Bisect failed:', error.message)
      process.exit(1)
    })
}

module.exports = BisectTool
