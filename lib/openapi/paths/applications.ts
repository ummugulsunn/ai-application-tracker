/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get user's job applications
 *     description: |
 *       Retrieve a paginated list of job applications for the authenticated user.
 *       Supports filtering, searching, and sorting capabilities.
 *     tags: [Applications]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - name: status
 *         in: query
 *         description: Filter by application status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [applied, interviewing, offered, rejected, withdrawn]
 *       - name: priority
 *         in: query
 *         description: Filter by priority level
 *         required: false
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - name: company
 *         in: query
 *         description: Filter by company name (partial match)
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - name: dateFrom
 *         in: query
 *         description: Filter applications from this date (ISO 8601)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: dateTo
 *         in: query
 *         description: Filter applications to this date (ISO 8601)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Successfully retrieved applications
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Application'
 *             examples:
 *               success:
 *                 summary: Successful response with applications
 *                 value:
 *                   data:
 *                     - id: "clp123abc456def789"
 *                       userId: "user_123abc456def789"
 *                       company: "TechCorp Inc."
 *                       position: "Senior Software Engineer"
 *                       location: "San Francisco, CA"
 *                       status: "applied"
 *                       priority: "high"
 *                       applicationDate: "2024-01-15T10:30:00.000Z"
 *                       createdAt: "2024-01-15T10:30:00.000Z"
 *                       updatedAt: "2024-01-15T10:30:00.000Z"
 *                   pagination:
 *                     page: 1
 *                     limit: 20
 *                     total: 45
 *                     totalPages: 3
 *                     hasNext: true
 *                     hasPrev: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   post:
 *     summary: Create a new job application
 *     description: |
 *       Create a new job application record. The system will automatically
 *       generate timestamps and assign the application to the authenticated user.
 *     tags: [Applications]
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplicationCreate'
 *           examples:
 *             basic:
 *               summary: Basic application creation
 *               value:
 *                 company: "TechCorp Inc."
 *                 position: "Senior Software Engineer"
 *                 location: "San Francisco, CA"
 *                 status: "applied"
 *                 applicationDate: "2024-01-15T10:30:00.000Z"
 *             detailed:
 *               summary: Detailed application with all fields
 *               value:
 *                 company: "TechCorp Inc."
 *                 position: "Senior Software Engineer"
 *                 location: "San Francisco, CA"
 *                 status: "applied"
 *                 priority: "high"
 *                 jobDescription: "We are looking for a senior software engineer..."
 *                 requirements:
 *                   - "5+ years of React experience"
 *                   - "Experience with Node.js"
 *                   - "Strong problem-solving skills"
 *                 tags: ["react", "nodejs", "senior"]
 *                 salary:
 *                   min: 120000
 *                   max: 180000
 *                   currency: "USD"
 *                 applicationDate: "2024-01-15T10:30:00.000Z"
 *     responses:
 *       201:
 *         description: Application created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Application'
 *                 message:
 *                   type: string
 *                   example: "Application created successfully"
 *             examples:
 *               success:
 *                 summary: Successful creation
 *                 value:
 *                   data:
 *                     id: "clp123abc456def789"
 *                     userId: "user_123abc456def789"
 *                     company: "TechCorp Inc."
 *                     position: "Senior Software Engineer"
 *                     location: "San Francisco, CA"
 *                     status: "applied"
 *                     priority: "high"
 *                     applicationDate: "2024-01-15T10:30:00.000Z"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                   message: "Application created successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/applications/{id}:
 *   get:
 *     summary: Get a specific job application
 *     description: Retrieve detailed information about a specific job application by ID
 *     tags: [Applications]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Application ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "clp123abc456def789"
 *     responses:
 *       200:
 *         description: Application retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Application'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   put:
 *     summary: Update a job application
 *     description: |
 *       Update an existing job application. Only the fields provided in the request
 *       body will be updated. The updatedAt timestamp will be automatically set.
 *     tags: [Applications]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Application ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplicationUpdate'
 *           examples:
 *             status_update:
 *               summary: Update application status
 *               value:
 *                 status: "interviewing"
 *                 interviewDate: "2024-01-20T14:00:00.000Z"
 *             full_update:
 *               summary: Update multiple fields
 *               value:
 *                 status: "interviewing"
 *                 priority: "high"
 *                 interviewDate: "2024-01-20T14:00:00.000Z"
 *                 tags: ["react", "nodejs", "senior", "urgent"]
 *     responses:
 *       200:
 *         description: Application updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Application'
 *                 message:
 *                   type: string
 *                   example: "Application updated successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   delete:
 *     summary: Delete a job application
 *     description: |
 *       Permanently delete a job application. This action cannot be undone.
 *       All associated reminders and activities will also be deleted.
 *     tags: [Applications]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Application ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Application deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Application deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */