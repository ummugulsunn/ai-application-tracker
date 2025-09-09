import swaggerJSDoc from 'swagger-jsdoc';

// OpenAPI specification configuration
const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'AI Application Tracker API',
    version: '1.0.0',
    description: `
# AI Application Tracker API

A comprehensive API for managing job applications with AI-powered insights, automation, and analytics.

## Features

- **Application Management**: Full CRUD operations for job applications
- **AI Integration**: Resume analysis, cover letter generation, and job recommendations
- **Automation**: Smart workflows and suggestions
- **Analytics**: Advanced reporting and insights
- **Integrations**: Calendar, email, and job board synchronization
- **Backup & Recovery**: Comprehensive data protection

## Authentication

This API uses NextAuth.js for authentication. Most endpoints require a valid session.

### Authentication Methods

- **Session-based**: Browser sessions with CSRF protection
- **JWT**: For API access (when configured)

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **General endpoints**: 100 requests per minute per IP
- **AI endpoints**: 20 requests per minute per user
- **Export endpoints**: 5 requests per minute per user

## Error Handling

All endpoints return consistent error responses:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error context (optional)",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

## Data Formats

- **Dates**: ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- **IDs**: UUIDs or cuid format
- **Pagination**: Cursor-based pagination for large datasets
    `,
    contact: {
      name: 'AI Application Tracker',
      url: 'https://github.com/yourusername/ai-application-tracker',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://your-production-domain.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      SessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'NextAuth.js session cookie',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for API access',
      },
    },
    schemas: {
      Application: {
        type: 'object',
        required: ['id', 'company', 'position', 'status', 'userId'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the application',
            example: 'clp123abc456def789',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the user who owns this application',
            example: 'user_123abc456def789',
          },
          company: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Company name',
            example: 'TechCorp Inc.',
          },
          position: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Job position title',
            example: 'Senior Software Engineer',
          },
          location: {
            type: 'string',
            maxLength: 100,
            description: 'Job location',
            example: 'San Francisco, CA',
            nullable: true,
          },
          status: {
            type: 'string',
            enum: ['applied', 'interviewing', 'offered', 'rejected', 'withdrawn'],
            description: 'Current application status',
            example: 'applied',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Application priority level',
            example: 'high',
            default: 'medium',
          },
          jobDescription: {
            type: 'string',
            maxLength: 10000,
            description: 'Job description text',
            nullable: true,
          },
          requirements: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: 500,
            },
            maxItems: 20,
            description: 'Job requirements list',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: 50,
            },
            maxItems: 10,
            description: 'Custom tags for categorization',
          },
          salary: {
            type: 'object',
            properties: {
              min: {
                type: 'number',
                minimum: 0,
                description: 'Minimum salary',
              },
              max: {
                type: 'number',
                minimum: 0,
                description: 'Maximum salary',
              },
              currency: {
                type: 'string',
                enum: ['USD', 'EUR', 'GBP', 'CAD'],
                default: 'USD',
              },
            },
            nullable: true,
          },
          applicationDate: {
            type: 'string',
            format: 'date-time',
            description: 'Date when application was submitted',
            example: '2024-01-15T10:30:00.000Z',
          },
          responseDate: {
            type: 'string',
            format: 'date-time',
            description: 'Date of first response from company',
            nullable: true,
          },
          interviewDate: {
            type: 'string',
            format: 'date-time',
            description: 'Scheduled interview date',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Record creation timestamp',
            readOnly: true,
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Record last update timestamp',
            readOnly: true,
          },
        },
      },
      ApplicationCreate: {
        type: 'object',
        required: ['company', 'position'],
        properties: {
          company: { $ref: '#/components/schemas/Application/properties/company' },
          position: { $ref: '#/components/schemas/Application/properties/position' },
          location: { $ref: '#/components/schemas/Application/properties/location' },
          status: { $ref: '#/components/schemas/Application/properties/status' },
          priority: { $ref: '#/components/schemas/Application/properties/priority' },
          jobDescription: { $ref: '#/components/schemas/Application/properties/jobDescription' },
          requirements: { $ref: '#/components/schemas/Application/properties/requirements' },
          tags: { $ref: '#/components/schemas/Application/properties/tags' },
          salary: { $ref: '#/components/schemas/Application/properties/salary' },
          applicationDate: { $ref: '#/components/schemas/Application/properties/applicationDate' },
          responseDate: { $ref: '#/components/schemas/Application/properties/responseDate' },
          interviewDate: { $ref: '#/components/schemas/Application/properties/interviewDate' },
        },
      },
      ApplicationUpdate: {
        type: 'object',
        properties: {
          company: { $ref: '#/components/schemas/Application/properties/company' },
          position: { $ref: '#/components/schemas/Application/properties/position' },
          location: { $ref: '#/components/schemas/Application/properties/location' },
          status: { $ref: '#/components/schemas/Application/properties/status' },
          priority: { $ref: '#/components/schemas/Application/properties/priority' },
          jobDescription: { $ref: '#/components/schemas/Application/properties/jobDescription' },
          requirements: { $ref: '#/components/schemas/Application/properties/requirements' },
          tags: { $ref: '#/components/schemas/Application/properties/tags' },
          salary: { $ref: '#/components/schemas/Application/properties/salary' },
          applicationDate: { $ref: '#/components/schemas/Application/properties/applicationDate' },
          responseDate: { $ref: '#/components/schemas/Application/properties/responseDate' },
          interviewDate: { $ref: '#/components/schemas/Application/properties/interviewDate' },
        },
      },
      Reminder: {
        type: 'object',
        required: ['id', 'title', 'dueDate', 'userId'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the reminder',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the user who owns this reminder',
          },
          applicationId: {
            type: 'string',
            format: 'uuid',
            description: 'Associated application ID',
            nullable: true,
          },
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Reminder title',
            example: 'Follow up on application',
          },
          description: {
            type: 'string',
            maxLength: 1000,
            description: 'Detailed reminder description',
            nullable: true,
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'When the reminder is due',
          },
          isCompleted: {
            type: 'boolean',
            description: 'Whether the reminder has been completed',
            default: false,
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Reminder priority level',
            default: 'medium',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            readOnly: true,
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            readOnly: true,
          },
        },
      },
      Contact: {
        type: 'object',
        required: ['id', 'name', 'userId'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the contact',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the user who owns this contact',
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Contact full name',
            example: 'John Smith',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Contact email address',
            example: 'john.smith@company.com',
            nullable: true,
          },
          phone: {
            type: 'string',
            maxLength: 20,
            description: 'Contact phone number',
            nullable: true,
          },
          company: {
            type: 'string',
            maxLength: 100,
            description: 'Company name',
            nullable: true,
          },
          position: {
            type: 'string',
            maxLength: 100,
            description: 'Job title/position',
            nullable: true,
          },
          notes: {
            type: 'string',
            maxLength: 2000,
            description: 'Additional notes about the contact',
            nullable: true,
          },
          linkedIn: {
            type: 'string',
            format: 'uri',
            description: 'LinkedIn profile URL',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            readOnly: true,
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            readOnly: true,
          },
        },
      },
      AIAnalysis: {
        type: 'object',
        properties: {
          matchScore: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'AI-calculated match score (0-100)',
            example: 85.5,
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Confidence level of the analysis (0-1)',
            example: 0.92,
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'AI-generated recommendations',
            example: [
              'Highlight your React experience in the cover letter',
              'Mention your experience with microservices architecture',
            ],
          },
          keySkills: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                skill: {
                  type: 'string',
                  description: 'Skill name',
                },
                relevance: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  description: 'Relevance score (0-1)',
                },
              },
            },
            description: 'Identified key skills and their relevance',
          },
          improvementAreas: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Areas for improvement',
          },
          lastAnalyzed: {
            type: 'string',
            format: 'date-time',
            description: 'When the analysis was performed',
          },
        },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message', 'timestamp'],
            properties: {
              code: {
                type: 'string',
                description: 'Error code for programmatic handling',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                description: 'Human-readable error message',
                example: 'The provided data is invalid',
              },
              details: {
                type: 'string',
                description: 'Additional error context',
                example: 'Company name is required',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'When the error occurred',
              },
            },
          },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {},
            description: 'Array of data items',
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                minimum: 1,
                description: 'Current page number',
              },
              limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                description: 'Items per page',
              },
              total: {
                type: 'integer',
                minimum: 0,
                description: 'Total number of items',
              },
              totalPages: {
                type: 'integer',
                minimum: 0,
                description: 'Total number of pages',
              },
              hasNext: {
                type: 'boolean',
                description: 'Whether there are more pages',
              },
              hasPrev: {
                type: 'boolean',
                description: 'Whether there are previous pages',
              },
            },
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions to access this resource',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'NOT_FOUND',
                message: 'The requested resource was not found',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Invalid input data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'The provided data is invalid',
                details: 'Company name is required and must be between 1 and 100 characters',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
                details: 'Rate limit: 100 requests per minute',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
      SearchParam: {
        name: 'search',
        in: 'query',
        description: 'Search query string',
        required: false,
        schema: {
          type: 'string',
          maxLength: 100,
        },
      },
      SortParam: {
        name: 'sort',
        in: 'query',
        description: 'Sort field and direction (e.g., "createdAt:desc")',
        required: false,
        schema: {
          type: 'string',
          pattern: '^[a-zA-Z]+:(asc|desc)$',
          example: 'createdAt:desc',
        },
      },
    },
  },
  security: [
    {
      SessionAuth: [],
    },
  ],
  tags: [
    {
      name: 'Applications',
      description: 'Job application management endpoints',
    },
    {
      name: 'AI',
      description: 'AI-powered analysis and recommendations',
    },
    {
      name: 'Reminders',
      description: 'Reminder and notification management',
    },
    {
      name: 'Contacts',
      description: 'Contact and networking management',
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting endpoints',
    },
    {
      name: 'Automation',
      description: 'Workflow automation and suggestions',
    },
    {
      name: 'Integrations',
      description: 'Third-party service integrations',
    },
    {
      name: 'Export',
      description: 'Data export and backup endpoints',
    },
    {
      name: 'System',
      description: 'System health and monitoring endpoints',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './app/api/**/*.ts',
    './lib/openapi/paths/*.ts',
    './lib/openapi/auth.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;