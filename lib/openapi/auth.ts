/**
 * @swagger
 * components:
 *   securitySchemes:
 *     SessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: next-auth.session-token
 *       description: |
 *         NextAuth.js session-based authentication using secure HTTP-only cookies.
 *         
 *         ## How to Authenticate
 *         
 *         1. **Web Browser**: Authentication is handled automatically through the web interface
 *         2. **API Testing**: Use the "Try it out" feature in this documentation - authentication is handled via cookies
 *         3. **External Applications**: Contact support for API key access
 *         
 *         ## Session Management
 *         
 *         - Sessions expire after 24 hours of inactivity
 *         - Automatic session refresh on active usage
 *         - Secure session storage with HTTP-only cookies
 *         - CSRF protection on all state-changing operations
 *         
 *         ## Authentication Flow
 *         
 *         ```mermaid
 *         sequenceDiagram
 *             participant Client
 *             participant API
 *             participant Auth
 *             participant Database
 *             
 *             Client->>Auth: Login Request
 *             Auth->>Database: Validate Credentials
 *             Database-->>Auth: User Data
 *             Auth-->>Client: Set Session Cookie
 *             Client->>API: API Request + Cookie
 *             API->>Auth: Validate Session
 *             Auth-->>API: User Context
 *             API-->>Client: API Response
 *         ```
 *         
 *         ## Error Responses
 *         
 *         | Status | Code | Description |
 *         |--------|------|-------------|
 *         | 401 | UNAUTHORIZED | No valid session found |
 *         | 403 | FORBIDDEN | Valid session but insufficient permissions |
 *         | 429 | RATE_LIMIT_EXCEEDED | Too many requests from this session |
 *         
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: |
 *         JWT-based authentication for API access (when configured).
 *         
 *         ## Usage
 *         
 *         Include the JWT token in the Authorization header:
 *         ```
 *         Authorization: Bearer <your-jwt-token>
 *         ```
 *         
 *         ## Token Structure
 *         
 *         JWT tokens contain the following claims:
 *         - `sub`: User ID
 *         - `email`: User email address
 *         - `iat`: Issued at timestamp
 *         - `exp`: Expiration timestamp
 *         - `scope`: Permissions scope
 *         
 *         ## Token Lifecycle
 *         
 *         - Tokens expire after 1 hour
 *         - Refresh tokens can be used to obtain new access tokens
 *         - Tokens are signed with RS256 algorithm
 *         
 * /api/auth/session:
 *   get:
 *     summary: Get current session information
 *     description: |
 *       Retrieve information about the current authenticated session including
 *       user details, permissions, and session metadata.
 *     tags: [Authentication]
 *     security:
 *       - SessionAuth: []
 *     responses:
 *       200:
 *         description: Session information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: User ID
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: User email address
 *                     name:
 *                       type: string
 *                       description: User display name
 *                     image:
 *                       type: string
 *                       format: uri
 *                       description: User profile image URL
 *                 expires:
 *                   type: string
 *                   format: date-time
 *                   description: Session expiration time
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: User permissions
 *             examples:
 *               authenticated:
 *                 summary: Authenticated user session
 *                 value:
 *                   user:
 *                     id: "user_123abc456def789"
 *                     email: "user@example.com"
 *                     name: "John Doe"
 *                     image: "https://example.com/avatar.jpg"
 *                   expires: "2024-01-16T10:30:00.000Z"
 *                   permissions: ["read:applications", "write:applications", "read:analytics"]
 *       401:
 *         description: No active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 code: "NO_SESSION"
 *                 message: "No active session found"
 *                 timestamp: "2024-01-15T10:30:00.000Z"
 * 
 * /api/auth/csrf:
 *   get:
 *     summary: Get CSRF token
 *     description: |
 *       Retrieve a CSRF token for protecting state-changing operations.
 *       This token must be included in the X-CSRF-Token header for POST, PUT, DELETE requests.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: CSRF token retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   description: CSRF token for request protection
 *                   example: "abc123def456ghi789"
 *                 expires:
 *                   type: string
 *                   format: date-time
 *                   description: Token expiration time
 *             example:
 *               csrfToken: "abc123def456ghi789"
 *               expires: "2024-01-15T11:30:00.000Z"
 * 
 * /api/auth/providers:
 *   get:
 *     summary: Get available authentication providers
 *     description: |
 *       Retrieve a list of available authentication providers and their configuration.
 *       This endpoint is public and doesn't require authentication.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication providers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 providers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Provider identifier
 *                       name:
 *                         type: string
 *                         description: Provider display name
 *                       type:
 *                         type: string
 *                         enum: [oauth, email, credentials]
 *                         description: Provider type
 *                       signinUrl:
 *                         type: string
 *                         format: uri
 *                         description: Sign-in URL for this provider
 *                       callbackUrl:
 *                         type: string
 *                         format: uri
 *                         description: Callback URL after authentication
 *             examples:
 *               providers:
 *                 summary: Available authentication providers
 *                 value:
 *                   providers:
 *                     - id: "google"
 *                       name: "Google"
 *                       type: "oauth"
 *                       signinUrl: "/api/auth/signin/google"
 *                       callbackUrl: "/api/auth/callback/google"
 *                     - id: "github"
 *                       name: "GitHub"
 *                       type: "oauth"
 *                       signinUrl: "/api/auth/signin/github"
 *                       callbackUrl: "/api/auth/callback/github"
 *                     - id: "email"
 *                       name: "Email"
 *                       type: "email"
 *                       signinUrl: "/api/auth/signin/email"
 *                       callbackUrl: "/api/auth/callback/email"
 * 
 * /api/auth/signin:
 *   post:
 *     summary: Sign in with credentials
 *     description: |
 *       Authenticate using email and password credentials. This endpoint
 *       creates a new session and sets the appropriate cookies.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User password
 *               remember:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to create a persistent session
 *           examples:
 *             signin:
 *               summary: Sign in request
 *               value:
 *                 email: "user@example.com"
 *                 password: "securepassword123"
 *                 remember: true
 *     responses:
 *       200:
 *         description: Authentication successful
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie
 *             schema:
 *               type: string
 *               example: "next-auth.session-token=abc123; HttpOnly; Secure; SameSite=Lax"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                 url:
 *                   type: string
 *                   description: Redirect URL after successful authentication
 *       400:
 *         description: Invalid credentials or request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_credentials:
 *                 summary: Invalid email or password
 *                 value:
 *                   error:
 *                     code: "INVALID_CREDENTIALS"
 *                     message: "Invalid email or password"
 *                     timestamp: "2024-01-15T10:30:00.000Z"
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   error:
 *                     code: "VALIDATION_ERROR"
 *                     message: "Invalid input data"
 *                     details: "Email is required and must be a valid email address"
 *                     timestamp: "2024-01-15T10:30:00.000Z"
 *       429:
 *         description: Too many sign-in attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 code: "TOO_MANY_ATTEMPTS"
 *                 message: "Too many sign-in attempts. Please try again later."
 *                 details: "Rate limit: 5 attempts per 15 minutes"
 *                 timestamp: "2024-01-15T10:30:00.000Z"
 * 
 * /api/auth/signout:
 *   post:
 *     summary: Sign out current session
 *     description: |
 *       Sign out the current user session and clear all authentication cookies.
 *       This endpoint can be called without authentication.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Sign out successful
 *         headers:
 *           Set-Cookie:
 *             description: Clear session cookie
 *             schema:
 *               type: string
 *               example: "next-auth.session-token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Signed out successfully"
 *                 url:
 *                   type: string
 *                   description: Redirect URL after sign out
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */