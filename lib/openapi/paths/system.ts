/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: |
 *       Check the health status of the API and its dependencies including
 *       database connectivity, external service availability, and system metrics.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Health check timestamp
 *                 version:
 *                   type: string
 *                   description: API version
 *                   example: "1.0.0"
 *                 uptime:
 *                   type: number
 *                   description: System uptime in seconds
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                         responseTime:
 *                           type: number
 *                           description: Database response time in milliseconds
 *                         lastChecked:
 *                           type: string
 *                           format: date-time
 *                     ai_service:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy, degraded]
 *                         responseTime:
 *                           type: number
 *                         lastChecked:
 *                           type: string
 *                           format: date-time
 *                     external_apis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy, degraded]
 *                         services:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               responseTime:
 *                                 type: number
 *             examples:
 *               healthy:
 *                 summary: All systems healthy
 *                 value:
 *                   status: "healthy"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                   version: "1.0.0"
 *                   uptime: 86400
 *                   checks:
 *                     database:
 *                       status: "healthy"
 *                       responseTime: 15
 *                       lastChecked: "2024-01-15T10:30:00.000Z"
 *                     ai_service:
 *                       status: "healthy"
 *                       responseTime: 250
 *                       lastChecked: "2024-01-15T10:29:45.000Z"
 *                     external_apis:
 *                       status: "healthy"
 *                       services:
 *                         - name: "OpenAI"
 *                           status: "healthy"
 *                           responseTime: 180
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       service:
 *                         type: string
 *                       error:
 *                         type: string
 *                       lastChecked:
 *                         type: string
 *                         format: date-time
 *             example:
 *               status: "unhealthy"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *               errors:
 *                 - service: "database"
 *                   error: "Connection timeout"
 *                   lastChecked: "2024-01-15T10:30:00.000Z"
 * 
 * /api/feature-flags:
 *   get:
 *     summary: Get feature flags
 *     description: |
 *       Retrieve the current feature flags configuration for the authenticated user.
 *       Feature flags control the availability of experimental or premium features.
 *     tags: [System]
 *     security:
 *       - SessionAuth: []
 *     responses:
 *       200:
 *         description: Feature flags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     flags:
 *                       type: object
 *                       additionalProperties:
 *                         type: boolean
 *                       description: Feature flag key-value pairs
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                         environment:
 *                           type: string
 *                           enum: [development, staging, production]
 *                         userId:
 *                           type: string
 *             examples:
 *               success:
 *                 summary: Feature flags response
 *                 value:
 *                   data:
 *                     flags:
 *                       ai_resume_analysis: true
 *                       advanced_analytics: true
 *                       beta_features: false
 *                       premium_integrations: false
 *                       experimental_ui: false
 *                     metadata:
 *                       lastUpdated: "2024-01-15T10:30:00.000Z"
 *                       environment: "production"
 *                       userId: "user_123abc456def789"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/errors:
 *   post:
 *     summary: Report client-side error
 *     description: |
 *       Report client-side errors for monitoring and debugging purposes.
 *       This endpoint helps track frontend issues and user experience problems.
 *     tags: [System]
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [error, context]
 *             properties:
 *               error:
 *                 type: object
 *                 required: [message, stack]
 *                 properties:
 *                   message:
 *                     type: string
 *                     description: Error message
 *                     example: "Cannot read property 'map' of undefined"
 *                   stack:
 *                     type: string
 *                     description: Error stack trace
 *                   name:
 *                     type: string
 *                     description: Error type
 *                     example: "TypeError"
 *               context:
 *                 type: object
 *                 required: [url, userAgent]
 *                 properties:
 *                   url:
 *                     type: string
 *                     format: uri
 *                     description: URL where error occurred
 *                   userAgent:
 *                     type: string
 *                     description: User agent string
 *                   userId:
 *                     type: string
 *                     description: User ID (if authenticated)
 *                   sessionId:
 *                     type: string
 *                     description: Session identifier
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: When the error occurred
 *                   component:
 *                     type: string
 *                     description: React component where error occurred
 *                   action:
 *                     type: string
 *                     description: User action that triggered the error
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *                 description: Error severity level
 *           examples:
 *             javascript_error:
 *               summary: JavaScript runtime error
 *               value:
 *                 error:
 *                   message: "Cannot read property 'map' of undefined"
 *                   stack: "TypeError: Cannot read property 'map' of undefined\n    at ApplicationTable.tsx:45:12"
 *                   name: "TypeError"
 *                 context:
 *                   url: "https://app.example.com/dashboard"
 *                   userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
 *                   userId: "user_123abc456def789"
 *                   sessionId: "sess_abc123def456"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                   component: "ApplicationTable"
 *                   action: "filter_applications"
 *                 severity: "high"
 *     responses:
 *       200:
 *         description: Error reported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error reported successfully"
 *                 errorId:
 *                   type: string
 *                   description: Unique identifier for the reported error
 *                   example: "err_123abc456def789"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/export:
 *   post:
 *     summary: Export user data
 *     description: |
 *       Export all user data in various formats for backup, migration, or compliance purposes.
 *       Supports full data export including applications, reminders, contacts, and settings.
 *     tags: [Export]
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [format]
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv, xlsx]
 *                 description: Export format
 *               includeData:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [applications, reminders, contacts, settings, analytics]
 *                 default: [applications, reminders, contacts]
 *                 description: Data types to include in export
 *               dateRange:
 *                 type: object
 *                 properties:
 *                   from:
 *                     type: string
 *                     format: date
 *                   to:
 *                     type: string
 *                     format: date
 *                 description: Date range filter for time-based data
 *           examples:
 *             full_export:
 *               summary: Full data export
 *               value:
 *                 format: "json"
 *                 includeData: ["applications", "reminders", "contacts", "settings"]
 *             applications_only:
 *               summary: Applications export with date range
 *               value:
 *                 format: "xlsx"
 *                 includeData: ["applications"]
 *                 dateRange:
 *                   from: "2024-01-01"
 *                   to: "2024-12-31"
 *     responses:
 *       200:
 *         description: Export completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     downloadUrl:
 *                       type: string
 *                       format: uri
 *                       description: URL to download the exported file
 *                     filename:
 *                       type: string
 *                       description: Generated filename
 *                     size:
 *                       type: integer
 *                       description: File size in bytes
 *                     recordCounts:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       description: Number of records exported by type
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the download link expires
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: Export rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 code: "EXPORT_RATE_LIMIT_EXCEEDED"
 *                 message: "Export rate limit exceeded. Please try again later."
 *                 details: "Rate limit: 5 exports per minute"
 *                 timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */