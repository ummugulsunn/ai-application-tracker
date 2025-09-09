'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <LoadingSpinner className="h-8 w-8" />,
});

interface ApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  [key: string]: unknown;
}

export default function APIDocumentationPage() {
  const [spec, setSpec] = useState<ApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch('/api/docs');
        if (!response.ok) {
          throw new Error(`Failed to fetch API specification: ${response.statusText}`);
        }
        const specData = await response.json();
        setSpec(specData);
      } catch (err) {
        console.error('Error fetching API spec:', err);
        setError(err instanceof Error ? err.message : 'Failed to load API documentation');
      } finally {
        setLoading(false);
      }
    };

    fetchSpec();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner className="h-12 w-12 mx-auto mb-4" />
            <p className="text-gray-600">Loading API documentation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Documentation</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {spec?.info?.title || 'API Documentation'}
              </h1>
              <p className="text-gray-600 mt-1">
                Version {spec?.info?.version || '1.0.0'} • Interactive API Documentation
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => window.open('/api/docs', '_blank')}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download OpenAPI Spec
              </Button>
              <Button
                onClick={() => navigator.clipboard.writeText(window.location.origin + '/api/docs')}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy API URL
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="#tag/Applications" className="text-blue-600 hover:text-blue-800 font-medium">
              Applications API
            </a>
            <a href="#tag/AI" className="text-blue-600 hover:text-blue-800 font-medium">
              AI Services
            </a>
            <a href="#tag/Reminders" className="text-blue-600 hover:text-blue-800 font-medium">
              Reminders
            </a>
            <a href="#tag/Analytics" className="text-blue-600 hover:text-blue-800 font-medium">
              Analytics
            </a>
            <a href="#tag/Automation" className="text-blue-600 hover:text-blue-800 font-medium">
              Automation
            </a>
            <a href="#tag/Integrations" className="text-blue-600 hover:text-blue-800 font-medium">
              Integrations
            </a>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {spec && (
            <SwaggerUI
              spec={spec}
              docExpansion="list"
              defaultModelsExpandDepth={2}
              defaultModelExpandDepth={2}
              displayOperationId={false}
              displayRequestDuration={true}
              filter={true}
              showExtensions={true}
              showCommonExtensions={true}
              tryItOutEnabled={true}
              requestInterceptor={(request: Record<string, unknown>) => {
                // Add CSRF token if available
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (csrfToken) {
                  request.headers['X-CSRF-Token'] = csrfToken;
                }
                return request;
              }}
              responseInterceptor={(response: Record<string, unknown>) => {
                // Log responses for debugging
                if (process.env.NODE_ENV === 'development') {
                  console.log('API Response:', response);
                }
                return response;
              }}
              onComplete={(system: Record<string, unknown>) => {
                // Custom completion handler
                console.log('Swagger UI loaded successfully');
              }}
              plugins={[
                // Custom plugins can be added here
              ]}
              layout="BaseLayout"
              deepLinking={true}
              persistAuthorization={true}
              supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              This documentation is automatically generated from the API code.
              For questions or issues, please{' '}
              <a href="https://github.com/yourusername/ai-application-tracker/issues" className="text-blue-600 hover:text-blue-800">
                create an issue on GitHub
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}