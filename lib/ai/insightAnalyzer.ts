import { Application } from '@/types/application';

export interface PositionTypeAnalysis {
  type: string;
  successRate: number;
  responseRate: number;
  totalApplications: number;
  averageResponseTime: number;
  topCompanies: string[];
}

export interface TimingAnalysis {
  dayOfWeek: {
    [key: string]: {
      applications: number;
      successRate: number;
      responseRate: number;
    };
  };
  monthlyTrends: {
    month: string;
    applications: number;
    successRate: number;
    responseRate: number;
    trend: 'improving' | 'declining' | 'stable';
  }[];
}

export interface CompanyAnalysis {
  name: string;
  applications: number;
  successRate: number;
  responseRate: number;
  averageResponseTime: number;
  lastApplication: Date;
}

/**
 * Analyze position types to identify which have higher success rates
 * Requirement 3.5: Suggest which types of positions have higher success rates with supporting data
 */
export function analyzePositionTypes(applications: Application[]): PositionTypeAnalysis[] {
  const typeGroups = applications.reduce((acc, app) => {
    const type = app.type || 'Unknown';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(app);
    return acc;
  }, {} as Record<string, Application[]>);

  return Object.entries(typeGroups).map(([type, apps]) => {
    const successful = apps.filter(app => ['Offered', 'Accepted'].includes(app.status));
    const responded = apps.filter(app => 
      ['Interviewing', 'Offered', 'Accepted', 'Rejected'].includes(app.status)
    );

    // Calculate average response time
    const responseTimes = apps
      .filter(app => app.responseDate && app.appliedDate)
      .map(app => {
        const applied = new Date(app.appliedDate).getTime();
        const responded = new Date(app.responseDate!).getTime();
        return (responded - applied) / (1000 * 60 * 60 * 24); // days
      });

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Get top companies for this position type
    const companyCounts = apps.reduce((acc, app) => {
      acc[app.company] = (acc[app.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCompanies = Object.entries(companyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([company]) => company);

    return {
      type,
      successRate: apps.length > 0 ? (successful.length / apps.length) * 100 : 0,
      responseRate: apps.length > 0 ? (responded.length / apps.length) * 100 : 0,
      totalApplications: apps.length,
      averageResponseTime,
      topCompanies
    };
  }).sort((a, b) => b.successRate - a.successRate);
}

/**
 * Analyze application timing patterns
 * Requirement 3.8: Provide trend analysis showing improvement over time
 */
export function analyzeApplicationTiming(applications: Application[]): TimingAnalysis {
  // Analyze by day of week
  const dayOfWeekAnalysis = applications.reduce((acc, app) => {
    const dayOfWeek = new Date(app.appliedDate).toLocaleDateString('en-US', { weekday: 'long' });
    if (!acc[dayOfWeek]) {
      acc[dayOfWeek] = { applications: 0, successful: 0, responded: 0 };
    }
    
    acc[dayOfWeek].applications++;
    if (['Offered', 'Accepted'].includes(app.status)) {
      acc[dayOfWeek].successful++;
    }
    if (['Interviewing', 'Offered', 'Accepted', 'Rejected'].includes(app.status)) {
      acc[dayOfWeek].responded++;
    }
    
    return acc;
  }, {} as Record<string, { applications: number; successful: number; responded: number }>);

  const dayOfWeek = Object.entries(dayOfWeekAnalysis).reduce((acc, [day, stats]) => {
    acc[day] = {
      applications: stats.applications,
      successRate: stats.applications > 0 ? (stats.successful / stats.applications) * 100 : 0,
      responseRate: stats.applications > 0 ? (stats.responded / stats.applications) * 100 : 0
    };
    return acc;
  }, {} as Record<string, { applications: number; successRate: number; responseRate: number }>);

  // Analyze monthly trends
  const monthlyGroups = applications.reduce((acc, app) => {
    const month = new Date(app.appliedDate).toISOString().slice(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(app);
    return acc;
  }, {} as Record<string, Application[]>);

  const monthlyTrends = Object.entries(monthlyGroups)
    .map(([month, apps]) => {
      const successful = apps.filter(app => ['Offered', 'Accepted'].includes(app.status));
      const responded = apps.filter(app => 
        ['Interviewing', 'Offered', 'Accepted', 'Rejected'].includes(app.status)
      );
      
      const successRate = apps.length > 0 ? (successful.length / apps.length) * 100 : 0;
      const responseRate = apps.length > 0 ? (responded.length / apps.length) * 100 : 0;
      
      return {
        month,
        applications: apps.length,
        successRate,
        responseRate,
        trend: 'stable' as 'improving' | 'declining' | 'stable'
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  // Determine trends
  for (let i = 1; i < monthlyTrends.length; i++) {
    const current = monthlyTrends[i];
    const previous = monthlyTrends[i - 1];
    
    if (current && previous) {
      if (current.successRate > previous.successRate + 5) {
        current.trend = 'improving';
      } else if (current.successRate < previous.successRate - 5) {
        current.trend = 'declining';
      }
    }
  }

  return {
    dayOfWeek,
    monthlyTrends
  };
}

/**
 * Analyze company performance
 */
export function analyzeCompanyPerformance(applications: Application[]): CompanyAnalysis[] {
  const companyGroups = applications.reduce((acc, app) => {
    if (!acc[app.company]) {
      acc[app.company] = [];
    }
    acc[app.company]!.push(app);
    return acc;
  }, {} as Record<string, Application[]>);

  return Object.entries(companyGroups).map(([company, apps]) => {
    const successful = apps.filter(app => ['Offered', 'Accepted'].includes(app.status));
    const responded = apps.filter(app => 
      ['Interviewing', 'Offered', 'Accepted', 'Rejected'].includes(app.status)
    );

    // Calculate average response time
    const responseTimes = apps
      .filter(app => app.responseDate && app.appliedDate)
      .map(app => {
        const applied = new Date(app.appliedDate).getTime();
        const responded = new Date(app.responseDate!).getTime();
        return (responded - applied) / (1000 * 60 * 60 * 24); // days
      });

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Get last application date
    const lastApplication = new Date(Math.max(...apps.map(app => new Date(app.appliedDate).getTime())));

    return {
      name: company,
      applications: apps.length,
      successRate: apps.length > 0 ? (successful.length / apps.length) * 100 : 0,
      responseRate: apps.length > 0 ? (responded.length / apps.length) * 100 : 0,
      averageResponseTime,
      lastApplication
    };
  }).sort((a, b) => b.successRate - a.successRate);
}

/**
 * Generate industry benchmarks and best practices
 * Requirement 3.6: Provide helpful general best practices and industry benchmarks
 */
export function getIndustryBenchmarks() {
  return {
    averageSuccessRate: 15,
    averageResponseRate: 25,
    averageInterviewRate: 8,
    averageResponseTime: 12,
    optimalApplicationsPerWeek: 5,
    bestApplicationDays: ['Tuesday', 'Wednesday', 'Thursday'],
    bestApplicationTimes: ['9-11 AM', '2-4 PM'],
    bestPractices: [
      'Customize your resume for each application',
      'Research the company before applying',
      'Follow up after 1-2 weeks if no response',
      'Apply to 5-10 positions per week for optimal results',
      'Tuesday-Thursday are the best days to apply',
      'Morning applications (9-11 AM) get better response rates',
      'Include relevant keywords from the job description',
      'Write personalized cover letters when possible'
    ],
    industryInsights: [
      'Tech companies typically respond within 1-2 weeks',
      'Startups have higher response rates but lower success rates',
      'Remote positions are 30% more competitive',
      'Applications submitted in the morning get 20% more responses',
      'Companies with 50-500 employees have the highest success rates',
      'Following up increases response rates by 15%'
    ],
    commonMistakes: [
      'Applying to too many positions without customization',
      'Not following up on applications',
      'Applying on Mondays or Fridays',
      'Using generic cover letters',
      'Not researching the company culture'
    ]
  };
}

/**
 * Generate actionable recommendations based on user data
 * Requirement 3.5 & 3.7: Provide actionable recommendations in multiple formats
 */
export function generateActionableRecommendations(
  applications: Application[],
  positionAnalysis: PositionTypeAnalysis[],
  timingAnalysis: TimingAnalysis,
  companyAnalysis: CompanyAnalysis[]
): Array<{
  priority: 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
  expectedImpact: string;
  category: 'timing' | 'targeting' | 'follow-up' | 'strategy';
}> {
  const recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    reasoning: string;
    expectedImpact: string;
    category: 'timing' | 'targeting' | 'follow-up' | 'strategy';
  }> = [];
  const benchmarks = getIndustryBenchmarks();

  // Calculate current metrics
  const totalApps = applications.length;
  const successRate = totalApps > 0 ? 
    (applications.filter(app => ['Offered', 'Accepted'].includes(app.status)).length / totalApps) * 100 : 0;
  const responseRate = totalApps > 0 ? 
    (applications.filter(app => ['Interviewing', 'Offered', 'Accepted', 'Rejected'].includes(app.status)).length / totalApps) * 100 : 0;

  // Success rate recommendations
  if (successRate < benchmarks.averageSuccessRate) {
    recommendations.push({
      priority: 'high' as const,
      action: 'Improve application targeting and customization',
      reasoning: `Your success rate (${successRate.toFixed(1)}%) is below the industry average (${benchmarks.averageSuccessRate}%)`,
      expectedImpact: 'Could increase success rate by 5-10%',
      category: 'targeting'
    });
  }

  // Response rate recommendations
  if (responseRate < benchmarks.averageResponseRate) {
    recommendations.push({
      priority: 'high' as const,
      action: 'Enhance resume and cover letter quality',
      reasoning: `Your response rate (${responseRate.toFixed(1)}%) is below average (${benchmarks.averageResponseRate}%)`,
      expectedImpact: 'Could increase response rate by 10-15%',
      category: 'targeting'
    });
  }

  // Position type recommendations
  if (positionAnalysis.length > 1) {
    const bestType = positionAnalysis[0];
    const worstType = positionAnalysis[positionAnalysis.length - 1];
    
    if (bestType && worstType && bestType.successRate > worstType.successRate + 10) {
      recommendations.push({
        priority: 'medium' as const,
        action: `Focus more on ${bestType.type} positions`,
        reasoning: `${bestType.type} positions have a ${bestType.successRate.toFixed(1)}% success rate vs ${worstType.successRate.toFixed(1)}% for ${worstType.type}`,
        expectedImpact: 'Could improve overall success rate',
        category: 'targeting'
      });
    }
  }

  // Timing recommendations
  const bestDay = Object.entries(timingAnalysis.dayOfWeek)
    .sort(([, a], [, b]) => b.successRate - a.successRate)[0];
  
  if (bestDay && bestDay[1].successRate > 0) {
    recommendations.push({
      priority: 'low' as const,
      action: `Apply more on ${bestDay[0]}s`,
      reasoning: `Your ${bestDay[0]} applications have a ${bestDay[1].successRate.toFixed(1)}% success rate`,
      expectedImpact: 'Could improve response rates by 5-10%',
      category: 'timing'
    });
  }

  // Follow-up recommendations
  const pendingApps = applications.filter(app => 
    app.status === 'Applied' && 
    new Date().getTime() - new Date(app.appliedDate).getTime() > 14 * 24 * 60 * 60 * 1000
  );

  if (pendingApps.length > 3) {
    recommendations.push({
      priority: 'medium' as const,
      action: `Follow up on ${pendingApps.length} pending applications`,
      reasoning: 'You have applications over 2 weeks old with no response',
      expectedImpact: 'Could convert 10-20% to responses',
      category: 'follow-up'
    });
  }

  // Application frequency recommendations
  const recentApps = applications.filter(app => 
    new Date().getTime() - new Date(app.appliedDate).getTime() < 30 * 24 * 60 * 60 * 1000
  );
  const weeklyRate = recentApps.length / 4; // Approximate weekly rate

  if (weeklyRate < 3) {
    recommendations.push({
      priority: 'medium' as const,
      action: 'Increase application frequency',
      reasoning: `You're applying to ${weeklyRate.toFixed(1)} positions per week, recommended is ${benchmarks.optimalApplicationsPerWeek}`,
      expectedImpact: 'More applications lead to more opportunities',
      category: 'strategy'
    });
  } else if (weeklyRate > 15) {
    recommendations.push({
      priority: 'medium' as const,
      action: 'Focus on quality over quantity',
      reasoning: `You're applying to ${weeklyRate.toFixed(1)} positions per week, which may reduce customization quality`,
      expectedImpact: 'Better targeting could improve success rates',
      category: 'strategy'
    });
  }

  return recommendations.slice(0, 6); // Return top 6 recommendations
}

/**
 * Calculate trend score for overall progress
 * Requirement 3.8: Provide trend analysis showing improvement over time
 */
export function calculateTrendScore(monthlyTrends: TimingAnalysis['monthlyTrends']): {
  score: number;
  direction: 'improving' | 'declining' | 'stable';
  confidence: number;
} {
  if (monthlyTrends.length < 2) {
    return { score: 0, direction: 'stable', confidence: 0 };
  }

  const recent = monthlyTrends.slice(-3); // Last 3 months
  const older = monthlyTrends.slice(0, -3);

  if (older.length === 0) {
    return { score: 0, direction: 'stable', confidence: 30 };
  }

  const recentAvgSuccess = recent.reduce((sum, month) => sum + month.successRate, 0) / recent.length;
  const olderAvgSuccess = older.reduce((sum, month) => sum + month.successRate, 0) / older.length;

  const difference = recentAvgSuccess - olderAvgSuccess;
  const score = Math.min(100, Math.max(-100, difference * 5)); // Scale the difference

  let direction: 'improving' | 'declining' | 'stable';
  if (difference > 5) {
    direction = 'improving';
  } else if (difference < -5) {
    direction = 'declining';
  } else {
    direction = 'stable';
  }

  // Confidence based on data points and consistency
  const confidence = Math.min(100, (monthlyTrends.length * 10) + (Math.abs(difference) * 2));

  return { score, direction, confidence };
}