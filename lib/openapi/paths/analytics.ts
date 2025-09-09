/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     description: |
 *       Retrieve comprehensive analytics data for the user's dashboard including
 *       application statistics, success rates, and trends over time.
 *     tags: [Analytics]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         description: Time period for analytics
 *         required: false
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year, all]
 *           default: month
 *       - name: includeComparisons
 *         in: query
 *         description: Include period-over-period comparisons
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalApplications:
 *                           type: integer
 *                           description: Total number of applications
 *                         activeApplications:
 *                           type: integer
 *                           description: Applications in progress
 *                         successRate:
 *                           type: number
 *                           description: Success rate percentage
 *                         averageResponseTime:
 *                           type: number
 *                           description: Average response time in days
 *                     statusBreakdown:
 *                       type: object
 *                       properties:
 *                         applied:
 *                           type: integer
 *                         interviewing:
 *                           type: integer
 *                         offered:
 *                           type: integer
 *                         rejected:
 *                           type: integer
 *                         withdrawn:
 *                           type: integer
 *                     trends:
 *                       type: object
 *                       properties:
 *                         applicationsOverTime:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date
 *                               count:
 *                                 type: integer
 *                         responseRates:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               period:
 *                                 type: string
 *                               rate:
 *                                 type: number
 *                     topCompanies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           company:
 *                             type: string
 *                           applications:
 *                             type: integer
 *                           successRate:
 *                             type: number
 *                     comparisons:
 *                       type: object
 *                       properties:
 *                         previousPeriod:
 *                           type: object
 *                           properties:
 *                             applicationsChange:
 *                               type: number
 *                             successRateChange:
 *                               type: number
 *             examples:
 *               success:
 *                 summary: Dashboard analytics data
 *                 value:
 *                   data:
 *                     summary:
 *                       totalApplications: 45
 *                       activeApplications: 12
 *                       successRate: 18.5
 *                       averageResponseTime: 7.2
 *                     statusBreakdown:
 *                       applied: 12
 *                       interviewing: 8
 *                       offered: 3
 *                       rejected: 20
 *                       withdrawn: 2
 *                     trends:
 *                       applicationsOverTime:
 *                         - date: "2024-01-01"
 *                           count: 5
 *                         - date: "2024-01-08"
 *                           count: 8
 *                     topCompanies:
 *                       - company: "TechCorp Inc."
 *                         applications: 3
 *                         successRate: 33.3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/analytics/trends:
 *   get:
 *     summary: Get detailed trend analysis
 *     description: |
 *       Get detailed trend analysis including application patterns, success rates,
 *       and predictive insights based on historical data.
 *     tags: [Analytics]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: metric
 *         in: query
 *         description: Specific metric to analyze
 *         required: false
 *         schema:
 *           type: string
 *           enum: [applications, responses, interviews, offers, rejections]
 *       - name: granularity
 *         in: query
 *         description: Data granularity
 *         required: false
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: weekly
 *       - name: startDate
 *         in: query
 *         description: Start date for analysis
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         description: End date for analysis
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Trend analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           value:
 *                             type: number
 *                           change:
 *                             type: number
 *                           changePercent:
 *                             type: number
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [trend, pattern, anomaly, prediction]
 *                           message:
 *                             type: string
 *                           confidence:
 *                             type: number
 *                           impact:
 *                             type: string
 *                             enum: [low, medium, high]
 *                     predictions:
 *                       type: object
 *                       properties:
 *                         nextPeriod:
 *                           type: object
 *                           properties:
 *                             predicted:
 *                               type: number
 *                             confidence:
 *                               type: number
 *                             range:
 *                               type: object
 *                               properties:
 *                                 min:
 *                                   type: number
 *                                 max:
 *                                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/analytics/export:
 *   post:
 *     summary: Export analytics data
 *     description: |
 *       Export analytics data in various formats for external analysis or reporting.
 *       Supports CSV, JSON, and PDF formats with customizable data selection.
 *     tags: [Analytics]
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
 *                 enum: [csv, json, pdf]
 *                 description: Export format
 *               period:
 *                 type: string
 *                 enum: [week, month, quarter, year, all]
 *                 default: all
 *                 description: Time period to export
 *               includeCharts:
 *                 type: boolean
 *                 default: false
 *                 description: Include charts in PDF export
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [applications, responses, interviews, offers, rejections, trends]
 *                 description: Specific metrics to include
 *           examples:
 *             csv_export:
 *               summary: Export as CSV
 *               value:
 *                 format: "csv"
 *                 period: "quarter"
 *                 metrics: ["applications", "responses", "offers"]
 *             pdf_report:
 *               summary: Export as PDF report
 *               value:
 *                 format: "pdf"
 *                 period: "year"
 *                 includeCharts: true
 *                 metrics: ["applications", "responses", "interviews", "offers", "trends"]
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