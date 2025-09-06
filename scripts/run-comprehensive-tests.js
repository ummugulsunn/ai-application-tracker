#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all test suites and generates comprehensive reports
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

function runCommand(command, description) {
  log(`\n${description}...`, 'cyan')
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8'
    })
    log(`✅ ${description} completed successfully`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} failed`, 'red')
    console.error(error.message)
    return false
  }
}

function generateTestReport() {
  const reportDir = 'test-results'
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const report = {
    timestamp: new Date().toISOString(),
    testSuites: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      coverage: null
    }
  }

  // Read Jest coverage report if it exists
  const coveragePath = path.join('coverage', 'coverage-summary.json')
  if (fs.existsSync(coveragePath)) {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
    report.coverage = coverage.total
  }

  // Read Playwright results if they exist
  const playwrightResultsPath = path.join('test-results', 'results.json')
  if (fs.existsSync(playwrightResultsPath)) {
    const playwrightResults = JSON.parse(fs.readFileSync(playwrightResultsPath, 'utf8'))
    report.testSuites.e2e = playwrightResults
  }

  // Write comprehensive report
  fs.writeFileSync(
    path.join(reportDir, 'comprehensive-report.json'),
    JSON.stringify(report, null, 2)
  )

  return report
}

function displaySummary(report) {
  log('\n' + '='.repeat(60), 'bright')
  log('COMPREHENSIVE TEST SUMMARY', 'bright')
  log('='.repeat(60), 'bright')

  if (report.coverage) {
    log('\nCode Coverage:', 'yellow')
    log(`  Lines: ${report.coverage.lines.pct}%`, 'cyan')
    log(`  Functions: ${report.coverage.functions.pct}%`, 'cyan')
    log(`  Branches: ${report.coverage.branches.pct}%`, 'cyan')
    log(`  Statements: ${report.coverage.statements.pct}%`, 'cyan')
  }

  if (report.testSuites.e2e) {
    log('\nEnd-to-End Tests:', 'yellow')
    log(`  Total: ${report.testSuites.e2e.stats?.total || 'N/A'}`, 'cyan')
    log(`  Passed: ${report.testSuites.e2e.stats?.passed || 'N/A'}`, 'green')
    log(`  Failed: ${report.testSuites.e2e.stats?.failed || 'N/A'}`, 'red')
  }

  log('\nTest Reports Generated:', 'yellow')
  log('  📊 Coverage Report: coverage/lcov-report/index.html', 'cyan')
  log('  🎭 Playwright Report: playwright-report/index.html', 'cyan')
  log('  📋 Comprehensive Report: test-results/comprehensive-report.json', 'cyan')
}

async function main() {
  log('🚀 Starting Comprehensive Test Suite', 'bright')
  
  const results = {
    unit: false,
    integration: false,
    accessibility: false,
    performance: false,
    e2e: false
  }

  // Run unit tests
  results.unit = runCommand(
    'npm run test:unit -- --coverage --watchAll=false',
    'Running Unit Tests'
  )

  // Run integration tests
  results.integration = runCommand(
    'npm run test:integration -- --watchAll=false',
    'Running Integration Tests'
  )

  // Run accessibility tests
  results.accessibility = runCommand(
    'npm run test:accessibility -- --watchAll=false',
    'Running Accessibility Tests'
  )

  // Run performance tests
  results.performance = runCommand(
    'npm run test:performance -- --watchAll=false',
    'Running Performance Tests'
  )

  // Run E2E tests
  results.e2e = runCommand(
    'npm run test:e2e',
    'Running End-to-End Tests'
  )

  // Generate comprehensive report
  log('\nGenerating comprehensive test report...', 'cyan')
  const report = generateTestReport()
  
  // Display summary
  displaySummary(report)

  // Check if all tests passed
  const allPassed = Object.values(results).every(result => result === true)
  
  if (allPassed) {
    log('\n🎉 All tests passed successfully!', 'green')
    process.exit(0)
  } else {
    log('\n❌ Some tests failed. Check the reports for details.', 'red')
    process.exit(1)
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  log('Comprehensive Test Runner', 'bright')
  log('\nUsage: node scripts/run-comprehensive-tests.js [options]', 'cyan')
  log('\nOptions:', 'yellow')
  log('  --help, -h     Show this help message')
  log('  --unit-only    Run only unit tests')
  log('  --e2e-only     Run only E2E tests')
  log('  --no-coverage  Skip coverage collection')
  process.exit(0)
}

if (args.includes('--unit-only')) {
  runCommand('npm run test:unit -- --coverage --watchAll=false', 'Running Unit Tests Only')
  process.exit(0)
}

if (args.includes('--e2e-only')) {
  runCommand('npm run test:e2e', 'Running E2E Tests Only')
  process.exit(0)
}

// Run main function
main().catch(error => {
  log(`❌ Test runner failed: ${error.message}`, 'red')
  process.exit(1)
})