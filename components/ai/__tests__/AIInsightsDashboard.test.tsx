import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIInsightsDashboard from '../AIInsightsDashboard';
import { Application } from '@/types/application';

// Mock the useAI hook
jest.mock('@/lib/hooks/useAI', () => ({
  useAI: () => ({
    analyzeApplicationPatterns: jest.fn().mockResolvedValue({
      insights: {
        successRate: 15.5,
        responseRate: 25.2,
        interviewRate: 8.1,
        averageResponseTime: 12,
        bestPerformingCompanies: [
          { name: 'Tech Corp', successRate: 25, applicationCount: 4 }
        ],
        optimalApplicationTiming: {
          dayOfWeek: 'Tuesday',
          timeOfDay: 'Morning',
          confidence: 65,
          reasoning: 'Based on your application data'
        },
        applicationFrequency: {
          recommended: 5,
          current: 3.2,
          reasoning: 'Balanced approach for quality applications'
        },
        trends: [
          {
            period: '2024-01',
            applicationCount: 8,
            successRate: 12.5,
            responseRate: 25.0,
            trend: 'improving'
          }
        ],
        keyInsights: [
          'Your success rate is above average',
          'Consider applying more frequently'
        ],
        actionableRecommendations: [
          {
            priority: 'high',
            action: 'Increase application frequency',
            reasoning: 'Current rate is below optimal',
            expectedImpact: 'More opportunities'
          }
        ]
      }
    }),
    isLoading: false,
    error: null,
    clearError: jest.fn()
  })
}));

// Mock the date formatting hook
jest.mock('@/lib/utils/dateFormatting', () => ({
  useProgressiveDateDisplay: () => ({
    relative: '2 minutes ago'
  })
}));

const mockApplications: Application[] = [
  {
    id: '1',
    company: 'Tech Corp',
    position: 'Software Engineer',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120,000 - $150,000',
    status: 'Applied',
    priority: 'High',
    appliedDate: '2024-01-15',
    responseDate: null,
    interviewDate: null,
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    companyWebsite: '',
    jobUrl: '',
    jobDescription: '',
    requirements: [],
    notes: 'Test application',
    tags: [],
    offerDate: null,
    rejectionDate: null,
    followUpDate: null,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
];

describe('AIInsightsDashboard', () => {
  it('renders empty state when no applications', () => {
    render(<AIInsightsDashboard applications={[]} />);
    
    expect(screen.getByText('No Applications Yet')).toBeInTheDocument();
    expect(screen.getByText('Add some applications to get AI-powered insights about your job search patterns.')).toBeInTheDocument();
  });

  it('renders industry benchmarks in empty state', () => {
    render(<AIInsightsDashboard applications={[]} />);
    
    expect(screen.getByText('Industry Benchmarks')).toBeInTheDocument();
    expect(screen.getByText('Average Success Rate:')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
  });

  it('renders dashboard with applications', () => {
    render(<AIInsightsDashboard applications={mockApplications} />);
    
    expect(screen.getByText('AI Insights Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Patterns')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('displays key metrics in overview tab', () => {
    render(<AIInsightsDashboard applications={mockApplications} />);
    
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Response Rate')).toBeInTheDocument();
    expect(screen.getByText('Interview Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
  });

  it('shows refresh button', () => {
    render(<AIInsightsDashboard applications={mockApplications} />);
    
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });
});