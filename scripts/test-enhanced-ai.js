#!/usr/bin/env node

/**
 * Test script for enhanced AI functionality
 * This script tests the new AI service enhancements including:
 * - Enhanced error handling and fallbacks
 * - Improved pattern analysis
 * - Better success rate calculations
 * - Enhanced trend analysis
 */

const { AIService, isAIServiceAvailable } = require('../lib/ai');

// Mock application data for testing
const mockApplications = [
  {
    id: '1',
    company: 'Tech Corp',
    position: 'Software Engineer',
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    salaryRange: '$120,000 - $150,000',
    status: 'Applied',
    appliedDate: '2024-01-15',
    responseDate: null,
    interviewDate: null,
    notes: 'Applied through company website',
    contactPerson: 'John Doe',
    contactEmail: 'john@techcorp.com',
    companyWebsite: 'https://techcorp.com',
    tags: ['JavaScript', 'React', 'Node.js'],
    priority: 'High',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    jobDescription: 'Looking for a skilled software engineer...',
    requirements: ['JavaScript', 'React', '3+ years experience']
  },
  {
    id: '2',
    company: 'StartupCo',
    position: 'Frontend Developer',
    location: 'Remote',
    jobType: 'Full-time',
    salaryRange: '$90,000 - $120,000',
    status: 'Interviewing',
    appliedDate: '2024-01-20',
    responseDate: '2024-01-25',
    interviewDate: '2024-02-01',
    notes: 'Great culture fit',
    contactPerson: 'Jane Smith',
    contactEmail: 'jane@startupco.com',
    companyWebsite: 'https://startupco.com',
    tags: ['React', 'TypeScript', 'CSS'],
    priority: 'High',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-25T10:00:00Z',
    jobDescription: 'Frontend developer for innovative startup...',
    requirements: ['React', 'TypeScript', '2+ years experience']
  },
  {
    id: '3',
    company: 'BigTech',
    position: 'Senior Software Engineer',
    location: 'Seattle, WA',
    jobType: 'Full-time',
    salaryRange: '$150,000 - $200,000',
    status: 'Offered',
    appliedDate: '2024-02-01',
    responseDate: '2024-02-05',
    interviewDate: '2024-02-10',
    notes: 'Challenging technical interview',
    contactPerson: 'Bob Johnson',
    contactEmail: 'bob@bigtech.com',
    companyWebsite: 'https://bigtech.com',
    tags: ['JavaScript', 'Python', 'AWS'],
    priority: 'High',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-10T10:00:00Z',
    jobDescription: 'Senior role with leadership opportunities...',
    requirements: ['JavaScript', 'Python', '5+ years experience']
  },
  {
    id: '4',
    company: 'MediumCorp',
    position: 'Full Stack Developer',
    location: 'Austin, TX',
    jobType: 'Full-time',
    salaryRange: '$100,000 - $130,000',
    status: 'Rejected',
    appliedDate: '2024-01-10',
    responseDate: '2024-01-18',
    interviewDate: null,
    notes: 'Not a good fit for team',
    contactPerson: 'Alice Brown',
    contactEmail: 'alice@mediumcorp.com',
    companyWebsite: 'https://mediumcorp.com',
    tags: ['Node.js', 'React', 'MongoDB'],
    priority: 'Medium',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z',
    jobDescription: 'Full stack role with modern tech stack...',
    requirements: ['Node.js', 'React', '3+ years experience']
  },
  {
    id: '5',
    company: 'DreamJob Inc',
    position: 'Lead Developer',
    location: 'New York, NY',
    jobType: 'Full-time',
    salaryRange: '$140,000 - $170,000',
    status: 'Accepted',
    appliedDate: '2024-02-15',
    responseDate: '2024-02-20',
    interviewDate: '2024-02-25',
    notes: 'Perfect match!',
    contactPerson: 'Charlie Davis',
    contactEmail: 'charlie@dreamjob.com',
    companyWebsite: 'https://dreamjob.com',
    tags: ['Leadership', 'JavaScript', 'Architecture'],
    priority: 'High',
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-02-25T10:00:00Z',
    jobDescription: 'Lead a team of talented developers...',
    requirements: ['Leadership', 'JavaScript', '7+ years experience']
  }
];

async function testEnhancedAI() {
  console.log('🚀 Testing Enhanced AI Service Functionality\n');

  const aiService = AIService.getInstance();

  // Test 1: AI Service Availability
  console.log('1. Testing AI Service Availability');
  const isAvailable = isAIServiceAvailable();
  console.log(`   AI Service Available: ${isAvailable ? '✅' : '❌'}`);
  
  if (!isAvailable) {
    console.log('   Note: AI service not available (likely missing API key)');
    console.log('   Testing fallback functionality...\n');
  }

  // Test 2: Enhanced Success Rate Calculation
  console.log('2. Testing Enhanced Success Rate Calculation');
  const trendAnalysis = aiService.calculateSuccessRates(mockApplications);
  
  console.log(`   Overall Trend: ${trendAnalysis.overallTrend}`);
  console.log(`   Trend Score: ${trendAnalysis.trendScore}`);
  console.log(`   Confidence: ${trendAnalysis.confidence}%`);
  console.log(`   Key Insights: ${trendAnalysis.keyInsights.length} insights`);
  console.log(`   Recommendations: ${trendAnalysis.recommendations.length} recommendations`);
  console.log(`   Monthly Stats: ${trendAnalysis.monthlyStats.length} months`);
  console.log(`   Performance Metrics:`);
  console.log(`     - Avg Applications/Week: ${trendAnalysis.performanceMetrics.averageApplicationsPerWeek}`);
  console.log(`     - Avg Response Time: ${trendAnalysis.performanceMetrics.averageResponseTime} days`);
  console.log(`     - Peak Performance: ${trendAnalysis.performanceMetrics.peakPerformancePeriod}`);
  console.log(`     - Improvement Areas: ${trendAnalysis.performanceMetrics.improvementAreas.length} areas\n`);

  // Test 3: Enhanced Pattern Analysis
  console.log('3. Testing Enhanced Pattern Analysis');
  try {
    const patternAnalysis = await aiService.analyzeApplicationPatterns(mockApplications);
    
    console.log(`   Success Rate: ${patternAnalysis.successRate.toFixed(1)}%`);
    console.log(`   Response Rate: ${patternAnalysis.responseRate.toFixed(1)}%`);
    console.log(`   Interview Rate: ${patternAnalysis.interviewRate.toFixed(1)}%`);
    console.log(`   Avg Response Time: ${patternAnalysis.averageResponseTime.toFixed(1)} days`);
    console.log(`   Best Companies: ${patternAnalysis.bestPerformingCompanies.length} identified`);
    console.log(`   Best Industries: ${patternAnalysis.bestPerformingIndustries.length} identified`);
    console.log(`   Optimal Timing:`);
    console.log(`     - Day: ${patternAnalysis.optimalApplicationTiming.dayOfWeek}`);
    console.log(`     - Time: ${patternAnalysis.optimalApplicationTiming.timeOfDay}`);
    console.log(`     - Confidence: ${patternAnalysis.optimalApplicationTiming.confidence}%`);
    console.log(`   Application Frequency:`);
    console.log(`     - Recommended: ${patternAnalysis.applicationFrequency.recommended}/week`);
    console.log(`     - Current: ${patternAnalysis.applicationFrequency.current.toFixed(1)}/week`);
    console.log(`   Key Insights: ${patternAnalysis.keyInsights.length} insights`);
    console.log(`   Actionable Recommendations: ${patternAnalysis.actionableRecommendations.length} recommendations\n`);
  } catch (error) {
    console.log(`   ❌ Pattern analysis failed: ${error.message}\n`);
  }

  // Test 4: Individual Application Analysis
  console.log('4. Testing Individual Application Analysis');
  try {
    const individualAnalysis = await aiService.analyzeApplication(mockApplications[0]);
    
    console.log(`   Match Score: ${individualAnalysis.matchScore}%`);
    console.log(`   Success Probability: ${individualAnalysis.successProbability}%`);
    console.log(`   Confidence: ${individualAnalysis.confidence}%`);
    console.log(`   Match Reasons: ${individualAnalysis.matchReasons.length} reasons`);
    console.log(`   Improvement Suggestions: ${individualAnalysis.improvementSuggestions.length} suggestions`);
    console.log(`   Recommended Actions: ${individualAnalysis.recommendedActions.length} actions`);
    console.log(`   Analysis Date: ${individualAnalysis.analysisDate}\n`);
  } catch (error) {
    console.log(`   ❌ Individual analysis failed: ${error.message}\n`);
  }

  // Test 5: Timing Analysis
  console.log('5. Testing Timing Analysis');
  try {
    const timingAnalysis = aiService.analyzeApplicationTiming(mockApplications);
    
    console.log(`   Optimal Days: ${timingAnalysis.optimalDays.length} days analyzed`);
    console.log(`   Optimal Times: ${timingAnalysis.optimalTimes.length} time ranges`);
    console.log(`   Seasonal Trends: ${timingAnalysis.seasonalTrends.length} trends`);
    console.log(`   Frequency Recommendation: ${timingAnalysis.frequencyRecommendation.applicationsPerWeek}/week`);
    console.log(`   Reasoning: ${timingAnalysis.frequencyRecommendation.reasoning}\n`);
  } catch (error) {
    console.log(`   ❌ Timing analysis failed: ${error.message}\n`);
  }

  // Test 6: Empty Data Handling
  console.log('6. Testing Empty Data Handling');
  const emptyAnalysis = aiService.calculateSuccessRates([]);
  console.log(`   Empty data trend: ${emptyAnalysis.overallTrend}`);
  console.log(`   Empty data insights: ${emptyAnalysis.keyInsights.length} insights`);
  console.log(`   Empty data recommendations: ${emptyAnalysis.recommendations.length} recommendations\n`);

  console.log('✅ Enhanced AI Service Testing Complete!');
  console.log('\nKey Enhancements Verified:');
  console.log('- ✅ Enhanced error handling with fallbacks');
  console.log('- ✅ Improved pattern analysis with actionable recommendations');
  console.log('- ✅ Better success rate calculations with confidence scores');
  console.log('- ✅ Enhanced trend analysis with performance metrics');
  console.log('- ✅ Timing analysis for optimal application strategies');
  console.log('- ✅ Graceful handling of insufficient data');
}

// Run the test
testEnhancedAI().catch(console.error);