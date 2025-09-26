#!/usr/bin/env node

/**
 * CAWS Working Spec Validator
 * Validates working spec files against schema requirements
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function validateWorkingSpec(specPath) {
  console.log(`🔍 Validating working spec: ${specPath}`)

  // Check if file exists
  if (!fs.existsSync(specPath)) {
    console.error(`❌ Working spec file not found: ${specPath}`)
    return false
  }

  try {
    // Parse YAML
    const yaml = fs.readFileSync(specPath, 'utf8')
    const spec = require('js-yaml').load(yaml)

    // Basic validation checks
    const errors = []

    // Required fields
    const requiredFields = [
      'id',
      'title',
      'risk_tier',
      'mode',
      'change_budget',
      'blast_radius',
      'operational_rollback_slo',
      'scope',
      'invariants',
      'acceptance',
      'non_functional',
      'contracts',
    ]

    for (const field of requiredFields) {
      if (!spec[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    }

    // ID format validation
    if (spec.id && !/^[A-Z]+-\d+$/.test(spec.id)) {
      errors.push('ID must match pattern: ^[A-Z]+-\\d+$ (e.g., MOTION-1234)')
    }

    // Risk tier validation
    if (spec.risk_tier && ![1, 2, 3].includes(spec.risk_tier)) {
      errors.push('Risk tier must be 1, 2, or 3')
    }

    // Mode validation
    const validModes = ['refactor', 'feature', 'fix', 'doc', 'chore']
    if (spec.mode && !validModes.includes(spec.mode)) {
      errors.push(`Mode must be one of: ${validModes.join(', ')}`)
    }

    // Change budget validation
    if (spec.change_budget) {
      if (!spec.change_budget.max_files || spec.change_budget.max_files < 1) {
        errors.push('change_budget.max_files must be >= 1')
      }
      if (!spec.change_budget.max_loc || spec.change_budget.max_loc < 1) {
        errors.push('change_budget.max_loc must be >= 1')
      }
    }

    // Scope validation
    if (spec.scope) {
      if (
        !spec.scope.in ||
        !Array.isArray(spec.scope.in) ||
        spec.scope.in.length === 0
      ) {
        errors.push('scope.in must be a non-empty array')
      }
      if (!spec.scope.out || !Array.isArray(spec.scope.out)) {
        errors.push('scope.out must be an array')
      }
    }

    // Invariants validation
    if (
      spec.invariants &&
      (!Array.isArray(spec.invariants) || spec.invariants.length === 0)
    ) {
      errors.push('invariants must be a non-empty array')
    }

    // Acceptance criteria validation
    if (spec.acceptance) {
      if (!Array.isArray(spec.acceptance) || spec.acceptance.length === 0) {
        errors.push('acceptance must be a non-empty array')
      } else {
        for (let i = 0; i < spec.acceptance.length; i++) {
          const criteria = spec.acceptance[i]
          if (
            !criteria.id ||
            !criteria.given ||
            !criteria.when ||
            !criteria.then
          ) {
            errors.push(
              `acceptance[${i}] missing required fields (id, given, when, then)`
            )
          }
          if (criteria.id && !/^A\d+$/.test(criteria.id)) {
            errors.push(
              `acceptance[${i}].id must match pattern: ^A\\d+$ (e.g., A1)`
            )
          }
        }
      }
    }

    // Rollback SLO validation
    if (
      spec.operational_rollback_slo &&
      !/^[0-9]+m$|^[0-9]+h$/.test(spec.operational_rollback_slo)
    ) {
      errors.push(
        'operational_rollback_slo must match pattern: ^[0-9]+m$|^[0-9]+h$ (e.g., 15m, 2h)'
      )
    }

    if (errors.length > 0) {
      console.error('❌ Working spec validation failed:')
      errors.forEach((error) => console.error(`  - ${error}`))
      return false
    }

    console.log('✅ Working spec validation passed')
    return true
  } catch (error) {
    console.error(`❌ Error parsing working spec: ${error.message}`)
    return false
  }
}

function main() {
  const specPath = process.argv[2] || '.caws/working-spec.yaml'

  if (!fs.existsSync(specPath)) {
    console.log('📝 No working spec found. Creating template...')
    const templatePath = '.caws/templates/working-spec.yaml'
    if (fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf8')
      fs.writeFileSync(specPath, template)
      console.log(`✅ Created working spec template: ${specPath}`)
      console.log(
        '📝 Please edit the template with your specific feature details'
      )
    } else {
      console.error(
        '❌ Template not found. Please create .caws/working-spec.yaml manually'
      )
    }
    return
  }

  const isValid = validateWorkingSpec(specPath)
  process.exit(isValid ? 0 : 1)
}

if (require.main === module) {
  main()
}
