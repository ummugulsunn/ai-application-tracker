#!/usr/bin/env node

/**
 * Demo script for CSV Template System
 * Shows template detection, mapping generation, and CSV creation
 */

const { CSVTemplateSystem } = require('../lib/csv/templates')
const { FieldDetector } = require('../lib/csv/field-detector')

console.log('🎯 CSV Template System Demo\n')

// 1. Show available templates
console.log('📋 Available Templates:')
const templates = CSVTemplateSystem.getAllTemplates()
templates.forEach(template => {
  console.log(`  • ${template.name} (${template.id}) - ${template.description}`)
})
console.log()

// 2. Demo template detection
console.log('🔍 Template Detection Demo:')
const testHeaders = [
  { name: 'LinkedIn Export', headers: ['Company', 'Position', 'Location', 'Applied Date', 'Status', 'Notes'] },
  { name: 'Indeed Format', headers: ['Company Name', 'Job Title', 'Location', 'Date Applied', 'Application Status'] },
  { name: 'Custom Headers', headers: ['Employer', 'Role', 'City', 'Applied', 'Current Status'] }
]

testHeaders.forEach(test => {
  console.log(`\n  Testing: ${test.name}`)
  console.log(`  Headers: ${test.headers.join(', ')}`)
  
  const detection = CSVTemplateSystem.detectTemplate(test.headers)
  if (detection.template) {
    console.log(`  ✅ Detected: ${detection.template.name} (${Math.round(detection.confidence * 100)}% confidence)`)
    console.log(`  📊 Matched ${detection.matchedFields} fields`)
  } else {
    console.log(`  ❌ No template detected (${Math.round(detection.confidence * 100)}% confidence)`)
  }
})

// 3. Demo field mapping generation
console.log('\n\n🗺️  Field Mapping Demo:')
const mappingTest = {
  templateId: 'linkedin',
  headers: ['Company', 'Job Title', 'Location', 'Status', 'Applied Date']
}

console.log(`\nGenerating mapping for template: ${mappingTest.templateId}`)
console.log(`CSV Headers: ${mappingTest.headers.join(', ')}`)

const mappingResult = CSVTemplateSystem.generateMappingFromTemplate(
  mappingTest.templateId, 
  mappingTest.headers
)

console.log('\nGenerated Mapping:')
Object.entries(mappingResult.mapping).forEach(([field, column]) => {
  const confidence = mappingResult.confidence[field] || 0
  const confidenceIcon = confidence > 0.8 ? '🟢' : confidence > 0.5 ? '🟡' : '🔴'
  console.log(`  ${confidenceIcon} ${field} → "${column}" (${Math.round(confidence * 100)}%)`)
})

if (mappingResult.unmappedHeaders.length > 0) {
  console.log(`\nUnmapped headers: ${mappingResult.unmappedHeaders.join(', ')}`)
}

if (mappingResult.missingFields.length > 0) {
  console.log(`\nMissing required fields: ${mappingResult.missingFields.join(', ')}`)
}

// 4. Demo CSV generation
console.log('\n\n📄 CSV Generation Demo:')
const csvTemplates = ['linkedin', 'indeed', 'custom']

csvTemplates.forEach(templateId => {
  console.log(`\n${templateId.toUpperCase()} Template:`)
  try {
    const csvContent = CSVTemplateSystem.generateTemplateCSV(templateId, false) // Header only
    const headerLine = csvContent.split('\n')[0]
    console.log(`  Headers: ${headerLine}`)
    
    // Show field count
    const template = CSVTemplateSystem.getTemplate(templateId)
    const requiredFields = template.fieldMappings.filter(m => m.required).length
    console.log(`  📊 ${template.fieldMappings.length} total fields, ${requiredFields} required`)
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
  }
})

// 5. Demo sample data generation
console.log('\n\n🎲 Sample Data Generation Demo:')
try {
  const sampleData = CSVTemplateSystem.generateSampleData('linkedin', 3)
  console.log('\nGenerated sample data for LinkedIn template:')
  
  // Show as table
  const headers = Object.keys(sampleData[0] || {})
  console.log(`\n  ${headers.join(' | ')}`)
  console.log(`  ${headers.map(() => '---').join(' | ')}`)
  
  sampleData.forEach((row, index) => {
    const values = headers.map(header => (row[header] || '').toString().substring(0, 15))
    console.log(`  ${values.join(' | ')}`)
  })
} catch (error) {
  console.log(`❌ Error generating sample data: ${error.message}`)
}

// 6. Demo enhanced field detection
console.log('\n\n🧠 Enhanced Field Detection Demo:')
const enhancedTest = ['Company Name', 'Position Title', 'Work Location', 'Application Status']
console.log(`\nTesting enhanced detection with: ${enhancedTest.join(', ')}`)

const enhancedDetection = FieldDetector.detectColumns(enhancedTest)
console.log('\nDetected mappings:')
Object.entries(enhancedDetection.detectedMapping).forEach(([field, column]) => {
  const confidence = enhancedDetection.confidence[field] || 0
  const confidenceIcon = confidence > 0.8 ? '🟢' : confidence > 0.5 ? '🟡' : '🔴'
  console.log(`  ${confidenceIcon} ${field} → "${column}" (${Math.round(confidence * 100)}%)`)
})

if (enhancedDetection.suggestions.length > 0) {
  console.log('\nSuggestions:')
  enhancedDetection.suggestions.forEach(suggestion => {
    console.log(`  💡 ${suggestion}`)
  })
}

console.log('\n✅ Demo completed successfully!')
console.log('\n📚 Next steps:')
console.log('  • Use TemplateGallery component in your UI')
console.log('  • Call API endpoints for template management')
console.log('  • Integrate with existing CSV import workflow')
console.log('  • Customize templates for your specific needs')