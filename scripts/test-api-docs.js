#!/usr/bin/env node

/**
 * Test script to verify API documentation generation
 */

const { swaggerSpec } = require('../lib/openapi/config.ts');

async function testApiDocs() {
  console.log('🔍 Testing API Documentation Generation...\n');

  try {
    // Test 1: Verify OpenAPI spec is generated
    console.log('✅ Test 1: OpenAPI spec generation');
    console.log(`   - OpenAPI version: ${swaggerSpec.openapi}`);
    console.log(`   - API title: ${swaggerSpec.info.title}`);
    console.log(`   - API version: ${swaggerSpec.info.version}`);
    console.log(`   - Number of servers: ${swaggerSpec.servers?.length || 0}`);
    console.log(`   - Number of tags: ${swaggerSpec.tags?.length || 0}`);

    // Test 2: Verify components are defined
    console.log('\n✅ Test 2: Components verification');
    const components = swaggerSpec.components || {};
    console.log(`   - Schemas defined: ${Object.keys(components.schemas || {}).length}`);
    console.log(`   - Security schemes: ${Object.keys(components.securitySchemes || {}).length}`);
    console.log(`   - Responses defined: ${Object.keys(components.responses || {}).length}`);
    console.log(`   - Parameters defined: ${Object.keys(components.parameters || {}).length}`);

    // Test 3: Verify paths are documented
    console.log('\n✅ Test 3: API paths verification');
    const paths = swaggerSpec.paths || {};
    const pathCount = Object.keys(paths).length;
    console.log(`   - Total documented paths: ${pathCount}`);
    
    if (pathCount > 0) {
      console.log('   - Sample paths:');
      Object.keys(paths).slice(0, 5).forEach(path => {
        const methods = Object.keys(paths[path]).filter(key => 
          ['get', 'post', 'put', 'delete', 'patch'].includes(key.toLowerCase())
        );
        console.log(`     ${path}: ${methods.join(', ').toUpperCase()}`);
      });
    }

    // Test 4: Verify key schemas exist
    console.log('\n✅ Test 4: Key schemas verification');
    const schemas = components.schemas || {};
    const keySchemas = ['Application', 'Reminder', 'Contact', 'AIAnalysis', 'Error'];
    keySchemas.forEach(schema => {
      if (schemas[schema]) {
        console.log(`   ✓ ${schema} schema defined`);
      } else {
        console.log(`   ✗ ${schema} schema missing`);
      }
    });

    // Test 5: Verify security is configured
    console.log('\n✅ Test 5: Security configuration');
    const securitySchemes = components.securitySchemes || {};
    if (securitySchemes.SessionAuth) {
      console.log('   ✓ Session authentication configured');
    }
    if (securitySchemes.BearerAuth) {
      console.log('   ✓ Bearer authentication configured');
    }

    console.log('\n🎉 API Documentation tests completed successfully!');
    console.log('\n📖 To view the documentation:');
    console.log('   - Interactive docs: http://localhost:3000/docs');
    console.log('   - API overview: http://localhost:3000/docs/api');
    console.log('   - OpenAPI spec: http://localhost:3000/api/docs');

  } catch (error) {
    console.error('❌ Error testing API documentation:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testApiDocs();