'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  tag: string;
  requiresAuth: boolean;
}

const apiEndpoints: ApiEndpoint[] = [
  // Applications
  { method: 'GET', path: '/api/applications', description: 'Get user\'s job applications with filtering and pagination', tag: 'Applications', requiresAuth: true },
  { method: 'POST', path: '/api/applications', description: 'Create a new job application', tag: 'Applications', requiresAuth: true },
  { method: 'GET', path: '/api/applications/{id}', description: 'Get a specific job application by ID', tag: 'Applications', requiresAuth: true },
  { method: 'PUT', path: '/api/applications/{id}', description: 'Update an existing job application', tag: 'Applications', requiresAuth: true },
  { method: 'DELETE', path: '/api/applications/{id}', description: 'Delete a job application', tag: 'Applications', requiresAuth: true },

  // AI Services
  { method: 'POST', path: '/api/ai/analyze-applications', description: 'Analyze job applications with AI for insights and recommendations', tag: 'AI', requiresAuth: true },
  { method: 'POST', path: '/api/ai/analyze-resume', description: 'Analyze resume content and provide optimization suggestions', tag: 'AI', requiresAuth: true },
  { method: 'POST', path: '/api/ai/generate-cover-letter', description: 'Generate personalized cover letters using AI', tag: 'AI', requiresAuth: true },
  { method: 'GET', path: '/api/ai/job-recommendations', description: 'Get AI-powered job recommendations based on user profile', tag: 'AI', requiresAuth: true },

  // Reminders
  { method: 'GET', path: '/api/reminders', description: 'Get user\'s reminders with filtering options', tag: 'Reminders', requiresAuth: true },
  { method: 'POST', path: '/api/reminders', description: 'Create a new reminder', tag: 'Reminders', requiresAuth: true },
  { method: 'GET', path: '/api/reminders/{id}', description: 'Get a specific reminder by ID', tag: 'Reminders', requiresAuth: true },
  { method: 'PUT', path: '/api/reminders/{id}', description: 'Update an existing reminder', tag: 'Reminders', requiresAuth: true },
  { method: 'DELETE', path: '/api/reminders/{id}', description: 'Delete a reminder', tag: 'Reminders', requiresAuth: true },
  { method: 'GET', path: '/api/reminders/upcoming', description: 'Get upcoming reminders within specified timeframe', tag: 'Reminders', requiresAuth: true },
  { method: 'GET', path: '/api/reminders/overdue', description: 'Get overdue reminders', tag: 'Reminders', requiresAuth: true },

  // Contacts
  { method: 'GET', path: '/api/contacts', description: 'Get user\'s contacts with search and filtering', tag: 'Contacts', requiresAuth: true },
  { method: 'POST', path: '/api/contacts', description: 'Create a new contact', tag: 'Contacts', requiresAuth: true },
  { method: 'GET', path: '/api/contacts/{id}', description: 'Get a specific contact by ID', tag: 'Contacts', requiresAuth: true },
  { method: 'PUT', path: '/api/contacts/{id}', description: 'Update an existing contact', tag: 'Contacts', requiresAuth: true },
  { method: 'DELETE', path: '/api/contacts/{id}', description: 'Delete a contact', tag: 'Contacts', requiresAuth: true },

  // Analytics
  { method: 'GET', path: '/api/analytics/dashboard', description: 'Get comprehensive dashboard analytics', tag: 'Analytics', requiresAuth: true },
  { method: 'GET', path: '/api/analytics/trends', description: 'Get detailed trend analysis and predictions', tag: 'Analytics', requiresAuth: true },
  { method: 'POST', path: '/api/analytics/export', description: 'Export analytics data in various formats', tag: 'Analytics', requiresAuth: true },

  // System
  { method: 'GET', path: '/api/health', description: 'Check system health and service status', tag: 'System', requiresAuth: false },
  { method: 'GET', path: '/api/feature-flags', description: 'Get current feature flags configuration', tag: 'System', requiresAuth: true },
  { method: 'POST', path: '/api/errors', description: 'Report client-side errors for monitoring', tag: 'System', requiresAuth: true },
  { method: 'POST', path: '/api/export', description: 'Export user data for backup or migration', tag: 'Export', requiresAuth: true },

  // Authentication
  { method: 'GET', path: '/api/auth/session', description: 'Get current session information', tag: 'Authentication', requiresAuth: true },
  { method: 'GET', path: '/api/auth/csrf', description: 'Get CSRF token for request protection', tag: 'Authentication', requiresAuth: false },
  { method: 'GET', path: '/api/auth/providers', description: 'Get available authentication providers', tag: 'Authentication', requiresAuth: false },
  { method: 'POST', path: '/api/auth/signin', description: 'Sign in with credentials', tag: 'Authentication', requiresAuth: false },
  { method: 'POST', path: '/api/auth/signout', description: 'Sign out current session', tag: 'Authentication', requiresAuth: false },
];

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 border-green-200',
  POST: 'bg-blue-100 text-blue-800 border-blue-200',
  PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  PATCH: 'bg-purple-100 text-purple-800 border-purple-200',
};

export default function ApiOverviewPage() {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const tags = ['All', ...Array.from(new Set(apiEndpoints.map(endpoint => endpoint.tag)))];

  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesTag = selectedTag === 'All' || endpoint.tag === selectedTag;
    const matchesSearch = searchQuery === '' || 
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const groupedEndpoints = filteredEndpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.tag]) {
      acc[endpoint.tag] = [];
    }
    acc[endpoint.tag].push(endpoint);
    return acc;
  }, {} as Record<string, ApiEndpoint[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Application Tracker API
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
              Comprehensive REST API for managing job applications with AI-powered insights, 
              automation, and analytics. Built with modern standards and best practices.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/docs">
                <Button size="lg">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Interactive Documentation
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={() => window.open('/api/docs', '_blank')}>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download OpenAPI Spec
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-900">{apiEndpoints.length}</div>
              <div className="text-sm text-blue-700">Total Endpoints</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">{tags.length - 1}</div>
              <div className="text-sm text-blue-700">API Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">OpenAPI 3.0</div>
              <div className="text-sm text-blue-700">Specification</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">REST</div>
              <div className="text-sm text-blue-700">Architecture</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">AI-Powered</h3>
              </div>
              <p className="text-gray-600">
                Advanced AI integration for resume analysis, cover letter generation, and job recommendations.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Secure</h3>
              </div>
              <p className="text-gray-600">
                Enterprise-grade security with session-based authentication, CSRF protection, and rate limiting.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">High Performance</h3>
              </div>
              <p className="text-gray-600">
                Optimized for speed with caching, pagination, and efficient database queries.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              </div>
              <p className="text-gray-600">
                Comprehensive analytics and reporting with trend analysis and predictive insights.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-2 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Developer Friendly</h3>
              </div>
              <p className="text-gray-600">
                Comprehensive documentation, interactive testing, and consistent error handling.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Automation</h3>
              </div>
              <p className="text-gray-600">
                Smart automation features including workflow management and intelligent suggestions.
              </p>
            </Card>
          </div>
        </div>

        {/* API Explorer */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Explorer</h2>
          
          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Endpoints
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by path or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Category
                </label>
                <select
                  id="tag"
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {tags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-8">
            {Object.entries(groupedEndpoints).map(([tag, endpoints]) => (
              <div key={tag}>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-sm mr-3">
                    {endpoints.length}
                  </span>
                  {tag}
                </h3>
                <div className="space-y-3">
                  {endpoints.map((endpoint, index) => (
                    <Card key={`${endpoint.method}-${endpoint.path}-${index}`} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${methodColors[endpoint.method]}`}>
                              {endpoint.method}
                            </span>
                            <code className="ml-3 text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                              {endpoint.path}
                            </code>
                            {endpoint.requiresAuth && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Auth Required
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">{endpoint.description}</p>
                        </div>
                        <Link href={`/docs#tag/${endpoint.tag}`}>
                          <Button variant="outline" size="sm">
                            Try it out
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Getting Started</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>The API uses session-based authentication with secure HTTP-only cookies.</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">For web applications:</p>
                  <p>Authentication is handled automatically through the web interface.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">For API testing:</p>
                  <p>Use the interactive documentation - authentication is handled via cookies.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Limits</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">General endpoints:</p>
                  <p>100 requests per minute per IP</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">AI endpoints:</p>
                  <p>20 requests per minute per user</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">Export endpoints:</p>
                  <p>5 requests per minute per user</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Request</h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`// Get user's applications
fetch('/api/applications?limit=10&status=applied', {
  method: 'GET',
  credentials: 'include', // Include session cookies
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => response.json())
.then(data => console.log(data));`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}