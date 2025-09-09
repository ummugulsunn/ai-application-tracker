/**
 * @swagger
 * /api/ai/analyze-applications:
 *   post:
 *     summary: Analyze job applications with AI
 *     description: |
 *       Use AI to analyze job applications and provide insights such as match scores,
 *       recommendations, and improvement suggestions. This endpoint processes multiple
 *       applications and returns comprehensive analysis results.
 *     tags: [AI]
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [applicationIds]
 *             properties:
 *               applicationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 10
 *                 description: Array of application IDs to analyze
 *                 example: ["clp123abc456def789", "clp456def789abc123"]
 *               analysisType:
 *                 type: string
 *                 enum: [basic, detailed, comprehensive]
 *                 default: basic
 *                 description: Level of analysis to perform
 *               includeRecommendations:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to include AI recommendations
 *           examples:
 *             basic:
 *               summary: Basic analysis request
 *               value:
 *                 applicationIds: ["clp123abc456def789"]
 *                 analysisType: "basic"
 *             detailed:
 *               summary: Detailed analysis with recommendations
 *               value:
 *                 applicationIds: ["clp123abc456def789", "clp456def789abc123"]
 *                 analysisType: "detailed"
 *                 includeRecommendations: true
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       applicationId:
 *                         type: string
 *                         format: uuid
 *                       analysis:
 *                         $ref: '#/components/schemas/AIAnalysis'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalAnalyzed:
 *                       type: integer
 *                     averageMatchScore:
 *                       type: number
 *                     topRecommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *             examples:
 *               success:
 *                 summary: Successful analysis
 *                 value:
 *                   data:
 *                     - applicationId: "clp123abc456def789"
 *                       analysis:
 *                         matchScore: 85.5
 *                         confidence: 0.92
 *                         recommendations:
 *                           - "Highlight your React experience in the cover letter"
 *                           - "Mention your experience with microservices"
 *                         keySkills:
 *                           - skill: "React"
 *                             relevance: 0.95
 *                           - skill: "Node.js"
 *                             relevance: 0.88
 *                         lastAnalyzed: "2024-01-15T10:30:00.000Z"
 *                   summary:
 *                     totalAnalyzed: 1
 *                     averageMatchScore: 85.5
 *                     topRecommendations:
 *                       - "Highlight your React experience"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: AI service rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 code: "AI_RATE_LIMIT_EXCEEDED"
 *                 message: "AI analysis rate limit exceeded. Please try again later."
 *                 details: "Rate limit: 20 requests per minute"
 *                 timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/ai/analyze-resume:
 *   post:
 *     summary: Analyze resume with AI
 *     description: |
 *       Upload and analyze a resume using AI to extract key information,
 *       identify skills, and provide optimization suggestions.
 *     tags: [AI]
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [resume]
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: Resume file (PDF, DOC, DOCX)
 *               analysisType:
 *                 type: string
 *                 enum: [skills, optimization, ats_score]
 *                 default: skills
 *                 description: Type of analysis to perform
 *               targetPosition:
 *                 type: string
 *                 maxLength: 200
 *                 description: Target job position for optimization
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resumeText]
 *             properties:
 *               resumeText:
 *                 type: string
 *                 maxLength: 50000
 *                 description: Resume content as plain text
 *               analysisType:
 *                 type: string
 *                 enum: [skills, optimization, ats_score]
 *                 default: skills
 *               targetPosition:
 *                 type: string
 *                 maxLength: 200
 *           examples:
 *             text_analysis:
 *               summary: Analyze resume text
 *               value:
 *                 resumeText: "John Doe\nSoftware Engineer\n\nExperience:\n- 5 years React development..."
 *                 analysisType: "optimization"
 *                 targetPosition: "Senior Frontend Developer"
 *     responses:
 *       200:
 *         description: Resume analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     extractedInfo:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         skills:
 *                           type: array
 *                           items:
 *                             type: string
 *                         experience:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               company:
 *                                 type: string
 *                               position:
 *                                 type: string
 *                               duration:
 *                                 type: string
 *                     analysis:
 *                       $ref: '#/components/schemas/AIAnalysis'
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           suggestion:
 *                             type: string
 *                           priority:
 *                             type: string
 *                             enum: [low, medium, high]
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 code: "FILE_TOO_LARGE"
 *                 message: "Resume file is too large"
 *                 details: "Maximum file size is 10MB"
 *                 timestamp: "2024-01-15T10:30:00.000Z"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/ai/generate-cover-letter:
 *   post:
 *     summary: Generate AI cover letter
 *     description: |
 *       Generate a personalized cover letter using AI based on the job description,
 *       user's resume, and application details.
 *     tags: [AI]
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [applicationId]
 *             properties:
 *               applicationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the application to generate cover letter for
 *               tone:
 *                 type: string
 *                 enum: [professional, enthusiastic, confident, creative]
 *                 default: professional
 *                 description: Tone of the cover letter
 *               length:
 *                 type: string
 *                 enum: [short, medium, long]
 *                 default: medium
 *                 description: Desired length of the cover letter
 *               customInstructions:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Additional instructions for customization
 *           examples:
 *             basic:
 *               summary: Basic cover letter generation
 *               value:
 *                 applicationId: "clp123abc456def789"
 *                 tone: "professional"
 *                 length: "medium"
 *             custom:
 *               summary: Custom cover letter with instructions
 *               value:
 *                 applicationId: "clp123abc456def789"
 *                 tone: "enthusiastic"
 *                 length: "long"
 *                 customInstructions: "Emphasize my startup experience and mention my passion for fintech"
 *     responses:
 *       200:
 *         description: Cover letter generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     coverLetter:
 *                       type: string
 *                       description: Generated cover letter content
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         wordCount:
 *                           type: integer
 *                         tone:
 *                           type: string
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *                         version:
 *                           type: integer
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Suggestions for improvement
 *             examples:
 *               success:
 *                 summary: Generated cover letter
 *                 value:
 *                   data:
 *                     coverLetter: "Dear Hiring Manager,\n\nI am writing to express my strong interest..."
 *                     metadata:
 *                       wordCount: 250
 *                       tone: "professional"
 *                       generatedAt: "2024-01-15T10:30:00.000Z"
 *                       version: 1
 *                     suggestions:
 *                       - "Consider adding specific metrics from your previous roles"
 *                       - "Mention the company's recent achievements"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 code: "APPLICATION_NOT_FOUND"
 *                 message: "Application not found or insufficient data for cover letter generation"
 *                 timestamp: "2024-01-15T10:30:00.000Z"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/ai/job-recommendations:
 *   get:
 *     summary: Get AI job recommendations
 *     description: |
 *       Get personalized job recommendations based on user's profile, skills,
 *       application history, and preferences using AI analysis.
 *     tags: [AI]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Number of recommendations to return
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - name: location
 *         in: query
 *         description: Preferred job location
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - name: remote
 *         in: query
 *         description: Include remote positions
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *       - name: salaryMin
 *         in: query
 *         description: Minimum salary requirement
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *       - name: experienceLevel
 *         in: query
 *         description: Target experience level
 *         required: false
 *         schema:
 *           type: string
 *           enum: [entry, mid, senior, executive]
 *     responses:
 *       200:
 *         description: Job recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Recommendation ID
 *                       jobTitle:
 *                         type: string
 *                       company:
 *                         type: string
 *                       location:
 *                         type: string
 *                       salary:
 *                         type: object
 *                         properties:
 *                           min:
 *                             type: integer
 *                           max:
 *                             type: integer
 *                           currency:
 *                             type: string
 *                       matchScore:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 100
 *                       reasons:
 *                         type: array
 *                         items:
 *                           type: string
 *                       url:
 *                         type: string
 *                         format: uri
 *                       postedDate:
 *                         type: string
 *                         format: date-time
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     totalRecommendations:
 *                       type: integer
 *                     averageMatchScore:
 *                       type: number
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */