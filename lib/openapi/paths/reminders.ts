/**
 * @swagger
 * /api/reminders:
 *   get:
 *     summary: Get user's reminders
 *     description: |
 *       Retrieve a paginated list of reminders for the authenticated user.
 *       Supports filtering by completion status, priority, and date ranges.
 *     tags: [Reminders]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - name: completed
 *         in: query
 *         description: Filter by completion status
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: priority
 *         in: query
 *         description: Filter by priority level
 *         required: false
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - name: applicationId
 *         in: query
 *         description: Filter by associated application ID
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: dueBefore
 *         in: query
 *         description: Filter reminders due before this date
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: dueAfter
 *         in: query
 *         description: Filter reminders due after this date
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Successfully retrieved reminders
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
 *                         $ref: '#/components/schemas/Reminder'
 *             examples:
 *               success:
 *                 summary: Successful response with reminders
 *                 value:
 *                   data:
 *                     - id: "rem_123abc456def789"
 *                       userId: "user_123abc456def789"
 *                       applicationId: "clp123abc456def789"
 *                       title: "Follow up on TechCorp application"
 *                       description: "Send a follow-up email to the hiring manager"
 *                       dueDate: "2024-01-20T09:00:00.000Z"
 *                       isCompleted: false
 *                       priority: "high"
 *                       createdAt: "2024-01-15T10:30:00.000Z"
 *                       updatedAt: "2024-01-15T10:30:00.000Z"
 *                   pagination:
 *                     page: 1
 *                     limit: 20
 *                     total: 15
 *                     totalPages: 1
 *                     hasNext: false
 *                     hasPrev: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   post:
 *     summary: Create a new reminder
 *     description: |
 *       Create a new reminder for the authenticated user. Reminders can be
 *       associated with specific job applications or be standalone tasks.
 *     tags: [Reminders]
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, dueDate]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Reminder title
 *                 example: "Follow up on application"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Detailed reminder description
 *                 example: "Send a follow-up email to the hiring manager about the status"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the reminder is due
 *                 example: "2024-01-20T09:00:00.000Z"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Reminder priority level
 *               applicationId:
 *                 type: string
 *                 format: uuid
 *                 description: Associated application ID (optional)
 *                 example: "clp123abc456def789"
 *           examples:
 *             basic:
 *               summary: Basic reminder creation
 *               value:
 *                 title: "Follow up on application"
 *                 dueDate: "2024-01-20T09:00:00.000Z"
 *                 priority: "medium"
 *             detailed:
 *               summary: Detailed reminder with application link
 *               value:
 *                 title: "Follow up on TechCorp application"
 *                 description: "Send a follow-up email to the hiring manager about the status of my application"
 *                 dueDate: "2024-01-20T09:00:00.000Z"
 *                 priority: "high"
 *                 applicationId: "clp123abc456def789"
 *     responses:
 *       201:
 *         description: Reminder created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Reminder'
 *                 message:
 *                   type: string
 *                   example: "Reminder created successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/reminders/{id}:
 *   get:
 *     summary: Get a specific reminder
 *     description: Retrieve detailed information about a specific reminder by ID
 *     tags: [Reminders]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Reminder ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reminder retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Reminder'
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
 *     summary: Update a reminder
 *     description: |
 *       Update an existing reminder. Only the fields provided in the request
 *       body will be updated.
 *     tags: [Reminders]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Reminder ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               isCompleted:
 *                 type: boolean
 *           examples:
 *             complete:
 *               summary: Mark reminder as completed
 *               value:
 *                 isCompleted: true
 *             reschedule:
 *               summary: Reschedule reminder
 *               value:
 *                 dueDate: "2024-01-25T09:00:00.000Z"
 *                 priority: "high"
 *     responses:
 *       200:
 *         description: Reminder updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Reminder'
 *                 message:
 *                   type: string
 *                   example: "Reminder updated successfully"
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
 *     summary: Delete a reminder
 *     description: Permanently delete a reminder. This action cannot be undone.
 *     tags: [Reminders]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Reminder ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reminder deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reminder deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/reminders/upcoming:
 *   get:
 *     summary: Get upcoming reminders
 *     description: |
 *       Get reminders that are due within a specified time period.
 *       Useful for dashboard widgets and notifications.
 *     tags: [Reminders]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         description: Number of days to look ahead
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 7
 *       - name: limit
 *         in: query
 *         description: Maximum number of reminders to return
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Upcoming reminders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reminder'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     totalUpcoming:
 *                       type: integer
 *                     daysAhead:
 *                       type: integer
 *                     overdue:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/reminders/overdue:
 *   get:
 *     summary: Get overdue reminders
 *     description: Get all reminders that are past their due date and not completed
 *     tags: [Reminders]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Maximum number of reminders to return
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: Overdue reminders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Reminder'
 *                       - type: object
 *                         properties:
 *                           daysPastDue:
 *                             type: integer
 *                             description: Number of days past the due date
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     totalOverdue:
 *                       type: integer
 *                     oldestOverdue:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */