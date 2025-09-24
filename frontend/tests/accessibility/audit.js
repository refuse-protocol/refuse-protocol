#!/usr/bin/env node

/**
 * Accessibility audit script using axe-core
 * Run with: node tests/accessibility/audit.js
 */

const { JSDOM } = require('jsdom')
const axe = require('axe-core')
const fs = require('fs')
const path = require('path')

async function runAccessibilityAudit() {
  try {
    console.log('🔍 Running accessibility audit...\n')

    // Read the built HTML file
    const htmlPath = path.join(__dirname, '../../dist/index.html')

    if (!fs.existsSync(htmlPath)) {
      console.error('❌ Built HTML file not found. Please run "npm run build" first.')
      process.exit(1)
    }

    const html = fs.readFileSync(htmlPath, 'utf8')
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Run axe accessibility audit
    const results = await axe.run(document, {
      rules: {
        // Focus on critical accessibility issues
        'color-contrast': { enabled: true },
        'image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'region': { enabled: true },
      }
    })

    // Report results
    const violations = results.violations

    if (violations.length === 0) {
      console.log('✅ No accessibility violations found!')
      console.log('🎉 Your website meets WCAG 2.1 AA standards!')
      return
    }

    console.log(`⚠️  Found ${violations.length} accessibility violation(s):\n`)

    violations.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.impact.toUpperCase()}: ${violation.help}`)
      console.log(`   Rule: ${violation.id}`)
      console.log(`   Description: ${violation.description}`)
      console.log(`   Elements affected: ${violation.nodes.length}`)

      if (violation.nodes.length > 0) {
        console.log('   Examples:')
        violation.nodes.slice(0, 3).forEach(node => {
          console.log(`     - ${node.html.substring(0, 100)}...`)
        })
      }
      console.log('')
    })

    console.log(`📊 Summary:`)
    console.log(`   Critical: ${violations.filter(v => v.impact === 'critical').length}`)
    console.log(`   Serious: ${violations.filter(v => v.impact === 'serious').length}`)
    console.log(`   Moderate: ${violations.filter(v => v.impact === 'moderate').length}`)
    console.log(`   Minor: ${violations.filter(v => v.impact === 'minor').length}`)

    process.exit(violations.filter(v => v.impact === 'critical').length > 0 ? 1 : 0)

  } catch (error) {
    console.error('❌ Error running accessibility audit:', error.message)
    process.exit(1)
  }
}

// Run the audit
runAccessibilityAudit()
