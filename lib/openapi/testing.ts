/**
 * API Testing Utilities for Swagger UI Integration
 * 
 * This module provides utilities for testing API endpoints directly from
 * the Swagger UI interface, including authentication helpers and request interceptors.
 */

export interface ApiTestConfig {
  baseUrl: string;
  authToken?: string;
  csrfToken?: string;
  timeout?: number;
}

export interface TestResponse {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}

/**
 * API Testing Client for Swagger UI
 */
export class ApiTestClient {
  private config: ApiTestConfig;

  constructor(config: ApiTestConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Execute an API test request
   */
  async testRequest(
    method: string,
    path: string,
    options: {
      body?: any;
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
    } = {}
  ): Promise<TestResponse> {
    const start = Date.now();
    
    try {
      const url = new URL(path, this.config.baseUrl);
      
      // Add query parameters
      if (options.queryParams) {
        Object.entries(options.queryParams).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add authentication headers
      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

      // Add CSRF token
      if (this.config.csrfToken) {
        headers['X-CSRF-Token'] = this.config.csrfToken;
      }

      const requestOptions: RequestInit = {
        method: method.toUpperCase(),
        headers,
        credentials: 'include', // Include cookies for session auth
      };

      // Add body for non-GET requests
      if (options.body && method.toUpperCase() !== 'GET') {
        requestOptions.body = JSON.stringify(options.body);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url.toString(), {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const end = Date.now();

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        success: response.ok,
        status: response.status,
        data,
        timing: {
          start,
          end,
          duration: end - start,
        },
      };
    } catch (error) {
      const end = Date.now();
      
      return {
        success: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: {
          start,
          end,
          duration: end - start,
        },
      };
    }
  }

  /**
   * Test authentication by calling a protected endpoint
   */
  async testAuth(): Promise<TestResponse> {
    return this.testRequest('GET', '/api/applications', {
      queryParams: { limit: '1' },
    });
  }

  /**
   * Get CSRF token from the page
   */
  static getCsrfToken(): string | null {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag?.getAttribute('content') || null;
  }

  /**
   * Get session token from cookies
   */
  static getSessionToken(): string | null {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => 
      cookie.trim().startsWith('next-auth.session-token=')
    );
    return sessionCookie?.split('=')[1] || null;
  }
}

/**
 * Sample data generators for API testing
 */
export class ApiTestData {
  /**
   * Generate sample application data
   */
  static generateApplication(overrides: Partial<any> = {}) {
    return {
      company: 'TechCorp Inc.',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      status: 'applied',
      priority: 'medium',
      jobDescription: 'We are looking for a senior software engineer with experience in React and Node.js...',
      requirements: [
        '5+ years of React experience',
        'Experience with Node.js',
        'Strong problem-solving skills',
      ],
      tags: ['react', 'nodejs', 'senior'],
      salary: {
        min: 120000,
        max: 180000,
        currency: 'USD',
      },
      applicationDate: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Generate sample reminder data
   */
  static generateReminder(overrides: Partial<any> = {}) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    return {
      title: 'Follow up on application',
      description: 'Send a follow-up email to the hiring manager',
      dueDate: dueDate.toISOString(),
      priority: 'medium',
      ...overrides,
    };
  }

  /**
   * Generate sample contact data
   */
  static generateContact(overrides: Partial<any> = {}) {
    return {
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      phone: '+1 (555) 123-4567',
      company: 'TechCorp Inc.',
      position: 'Engineering Manager',
      notes: 'Met at tech conference. Very interested in our background.',
      linkedIn: 'https://linkedin.com/in/johnsmith',
      ...overrides,
    };
  }

  /**
   * Generate sample AI analysis request
   */
  static generateAiAnalysisRequest(applicationIds: string[], overrides: Partial<any> = {}) {
    return {
      applicationIds,
      analysisType: 'detailed',
      includeRecommendations: true,
      ...overrides,
    };
  }
}

/**
 * Common test scenarios for API endpoints
 */
export class ApiTestScenarios {
  private client: ApiTestClient;

  constructor(client: ApiTestClient) {
    this.client = client;
  }

  /**
   * Test complete application workflow
   */
  async testApplicationWorkflow(): Promise<{
    create: TestResponse;
    read: TestResponse;
    update: TestResponse;
    delete: TestResponse;
  }> {
    // Create application
    const createResponse = await this.client.testRequest('POST', '/api/applications', {
      body: ApiTestData.generateApplication(),
    });

    let applicationId: string | null = null;
    if (createResponse.success && createResponse.data?.data?.id) {
      applicationId = createResponse.data.data.id;
    }

    // Read application
    const readResponse = applicationId
      ? await this.client.testRequest('GET', `/api/applications/${applicationId}`)
      : { success: false, status: 0, error: 'No application ID from create', timing: { start: 0, end: 0, duration: 0 } };

    // Update application
    const updateResponse = applicationId
      ? await this.client.testRequest('PUT', `/api/applications/${applicationId}`, {
          body: { status: 'interviewing' },
        })
      : { success: false, status: 0, error: 'No application ID from create', timing: { start: 0, end: 0, duration: 0 } };

    // Delete application
    const deleteResponse = applicationId
      ? await this.client.testRequest('DELETE', `/api/applications/${applicationId}`)
      : { success: false, status: 0, error: 'No application ID from create', timing: { start: 0, end: 0, duration: 0 } };

    return {
      create: createResponse,
      read: readResponse,
      update: updateResponse,
      delete: deleteResponse,
    };
  }

  /**
   * Test pagination functionality
   */
  async testPagination(endpoint: string): Promise<{
    firstPage: TestResponse;
    secondPage: TestResponse;
    largePage: TestResponse;
  }> {
    const firstPage = await this.client.testRequest('GET', endpoint, {
      queryParams: { page: '1', limit: '5' },
    });

    const secondPage = await this.client.testRequest('GET', endpoint, {
      queryParams: { page: '2', limit: '5' },
    });

    const largePage = await this.client.testRequest('GET', endpoint, {
      queryParams: { page: '1', limit: '100' },
    });

    return {
      firstPage,
      secondPage,
      largePage,
    };
  }

  /**
   * Test error handling
   */
  async testErrorHandling(): Promise<{
    notFound: TestResponse;
    validation: TestResponse;
    unauthorized: TestResponse;
  }> {
    // Test 404 error
    const notFound = await this.client.testRequest('GET', '/api/applications/nonexistent-id');

    // Test validation error
    const validation = await this.client.testRequest('POST', '/api/applications', {
      body: { company: '' }, // Invalid data
    });

    // Test unauthorized (remove auth temporarily)
    const originalToken = this.client['config'].authToken;
    this.client['config'].authToken = undefined;
    const unauthorized = await this.client.testRequest('GET', '/api/applications');
    this.client['config'].authToken = originalToken;

    return {
      notFound,
      validation,
      unauthorized,
    };
  }

  /**
   * Test performance benchmarks
   */
  async testPerformance(endpoint: string, iterations: number = 5): Promise<{
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    results: TestResponse[];
  }> {
    const results: TestResponse[] = [];

    for (let i = 0; i < iterations; i++) {
      const result = await this.client.testRequest('GET', endpoint);
      results.push(result);
    }

    const responseTimes = results.map(r => r.timing.duration);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    return {
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      results,
    };
  }
}

/**
 * Initialize API testing for Swagger UI
 */
export function initializeApiTesting(): ApiTestClient {
  const baseUrl = window.location.origin;
  const csrfToken = ApiTestClient.getCsrfToken();
  
  return new ApiTestClient({
    baseUrl,
    csrfToken: csrfToken || undefined,
  });
}

// Global API testing utilities for browser console
if (typeof window !== 'undefined') {
  (window as any).ApiTesting = {
    ApiTestClient,
    ApiTestData,
    ApiTestScenarios,
    initializeApiTesting,
  };
}