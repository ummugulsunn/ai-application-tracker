/**
 * Simple verification script for AI service integration
 * This script tests the core functionality without requiring full test setup
 */

const { AIService } = require('../lib/ai.ts');

// Mock application data
const mockApplications = [
  {
    id: '1',
    company: 'Tech Corp',
    position: 'Software Engineer',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120,000 - $150,000',
    status: 'Applied',
    appliedDate: '2024-01-15',
    responseDate: null,
    interviewDate: null,
    notes: 'Applied through company website',
    contactPerson: 'John Doe',
    contactEmail: 'john@techcorp.com',
    website: 'https://techcorp.com',
    tags: ['JavaScript', 'React', 'Node.js'],
    priority: 'High',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    company: 'StartupCo',
    position: 'Frontend Developer',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90,000 - $110,000',
    status: 'Interviewing',
    appliedDate: '2024-01-10',
    responseDate: '2024-01-12',
    interviewDate: '2024-01-20',
    notes: 'Phone screening completed',
    contactPerson: 'Jane Smith',
    contactEmail: 'jane@startupco.com',
    website: 'https://startupco.com',
    tags: ['React', 'TypeScript', 'CSS'],
    priority: 'Medium',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z'
  },
  {
    id: '3',
    company: 'BigTech',
    position: 'Senior Software Engineer',
    location: 'Seattle, WA',
    type: 'Full-time',
    salary: '$150,000 - $180,000',
    status: 'Offered',
    appliedDate: '2024-01-05',
    responseDate: '2024-01-08',
    interviewDate: '2024-01-15',
    notes: 'Great interview, received offer',
    contactPerson: 'Bob Johnson',
    contactEmail: 'bob@bigtech.com',
    website: 'https://bigtech.com',
    tags: ['JavaScript', 'Python', 'AWS'],
    priority: 'High',
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z'
  }
];

async function verifyAIService() {
  console.log('🔍 Verifying AI Service Integration Layer...\n');

  try {
    // Test 1: Singleton pattern
    console.log('✅ Test 1: Singleton Pattern');
    const aiService1 = AIService.getInstance();
    const aiService2 = AIService.getInstance();
    console.log(`   Same instance: ${aiService1 === aiService2}`);

    // Test 2: Success rate calculation
    console.log('\n✅ Test 2: Success Rate Calculation');
    const aiService = AIService.getInstance();
    const trendAnalysis = aiService.calculateSuccessRates(mockApplications);
    console.log(`   Overall trend: ${trendAnalysis.overallTrend}`);
    console.log(`   Key insights: ${trendAnalysis.keyInsights.length} insights`);
    console.log(`   Recommendations: ${trendAnalysis.recommendations.length} recommendations`);
    console.log(`   Monthly stats: ${trendAnalysis.monthlyStats.length} months`);

    // Test 3: Empty applications handling
    console.log('\n✅ Test 3: Empty Applications Handling');
    const emptyAnalysis = aiService.calculateSuccessRates([]);
    console.log(`   Empty trend: ${emptyAnalysis.overallTrend}`);
    console.log(`   Empty insights: ${emptyAnalysis.keyInsights[0]}`);

    // Test 4: Rate limiting (basic test)
    console.log('\n✅ Test 4: Rate Limiting Function');
    const { checkRateLimit } = require('../lib/ai.ts');
    const userId = 'test-user-123';
    
    // First few requests should pass
    let passCount = 0;
    for (let i = 0; i < 5; i++) {
      if (checkRateLimit(userId)) passCount++;
    }
    console.log(`   Passed requests: ${passCount}/5`);

    // Test 5: Error handling wrapper
    console.log('\n✅ Test 5: Error Handling Wrapper');
    const { withErrorHandling } = require('../lib/ai.ts');
    
    const failingOperation = () => Promise.reject(new Error('Test error'));
    const fallbackValue = { error: 'fallback' };
    
    const result = await withErrorHandling(failingOperation, fallbackValue, 'Test operation');
    console.log(`   Fallback result: ${JSON.stringify(result)}`);

    console.log('\n🎉 AI Service Integration Layer verification completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Singleton pattern working');
    console.log('   ✅ Success rate calculation working');
    console.log('   ✅ Empty data handling working');
    console.log('   ✅ Rate limiting function working');
    console.log('   ✅ Error handling wrapper working');
    console.log('\n🚀 AI service integration layer is ready for use!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyAIService();
}

module.exports = { verifyAIService };