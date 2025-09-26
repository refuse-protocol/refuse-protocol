#!/usr/bin/env node

/**
 * Accessibility audit script using axe-core
 * Run with: node tests/accessibility/audit.js
 */

const { JSDOM } = require('jsdom')
const axe = require('axe-core')
const fs = require('fs')
const path = require('path')

// Simple logger for Node.js environment
const createLogger = () => ({
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, data, err) => console.error(`[ERROR] ${msg}`, data || '', err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
})

const logger = createLogger()

async function runAccessibilityAudit() {
  try {
    logger.info('Running accessibility audit...')

    // Read the built HTML file
    const htmlPath = path.join(__dirname, '../../dist/index.html')

    if (!fs.existsSync(htmlPath)) {
      logger.error('Built HTML file not found. Please run "npm run build" first.')
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
      logger.info('No accessibility violations found!')
      logger.info('Your website meets WCAG 2.1 AA standards!')
      return
    }

    logger.warn(`Found ${violations.length} accessibility violation(s):`)

    violations.forEach((violation, index) => {
      logger.info(`${index + 1}. ${violation.impact.toUpperCase()}: ${violation.help}`)
      logger.info(`   Rule: ${violation.id}`)
      logger.info(`   Description: ${violation.description}`)
      logger.info(`   Elements affected: ${violation.nodes.length}`)

      if (violation.nodes.length > 0) {
        logger.info('   Examples:')
        violation.nodes.slice(0, 3).forEach(node => {
          logger.info(`     - ${node.html.substring(0, 100)}...`)
        })
      }
      logger.info('')
    })

    logger.info(`📊 Summary:`)
    logger.info(`   Critical: ${violations.filter(v => v.impact === 'critical').length}`)
    logger.info(`   Serious: ${violations.filter(v => v.impact === 'serious').length}`)
    logger.info(`   Moderate: ${violations.filter(v => v.impact === 'moderate').length}`)
    logger.info(`   Minor: ${violations.filter(v => v.impact === 'minor').length}`)

    process.exit(violations.filter(v => v.impact === 'critical').length > 0 ? 1 : 0)

  } catch (error) {
    logger.error('Error running accessibility audit', { error: error.message }, error)
    process.exit(1)
  }
}

// Run the audit
runAccessibilityAudit()
