import { z } from "zod"

// Common validation patterns
const emailSchema = z.string().email("Invalid email address").min(1, "Email is required")
const passwordSchema = z.string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be less than 128 characters")
const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format").optional().or(z.literal(""))
const urlSchema = z.string().url("Invalid URL format").optional().or(z.literal(""))
const nonEmptyStringSchema = z.string().min(1, "This field is required")
const optionalStringSchema = z.string().max(1000).optional().or(z.literal(""))

// Enums for consistent data types
export const JobTypeEnum = z.enum(["Full-time", "Part-time", "Internship", "Contract", "Freelance"])
export const ApplicationStatusEnum = z.enum(["Pending", "Applied", "Interviewing", "Offered", "Rejected", "Accepted", "Withdrawn"])
export const PriorityEnum = z.enum(["Low", "Medium", "High"])
export const ExperienceLevelEnum = z.enum(["Entry", "Mid", "Senior", "Executive"])
export const NotificationFrequencyEnum = z.enum(["Daily", "Weekly", "Never"])

// Authentication schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nonEmptyStringSchema.max(100, "First name must be less than 100 characters"),
  lastName: nonEmptyStringSchema.max(100, "Last name must be less than 100 characters"),
  phone: phoneSchema,
  location: z.string().max(255, "Location must be less than 255 characters").optional().or(z.literal("")),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name must be less than 100 characters").optional(),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name must be less than 100 characters").optional(),
  phone: phoneSchema,
  location: z.string().max(255, "Location must be less than 255 characters").optional().or(z.literal("")),
  experienceLevel: ExperienceLevelEnum.optional(),
  desiredSalaryMin: z.number().min(0, "Salary must be positive").max(10000000, "Salary must be realistic").optional(),
  desiredSalaryMax: z.number().min(0, "Salary must be positive").max(10000000, "Salary must be realistic").optional(),
  preferredLocations: z.array(z.string().max(255, "Location must be less than 255 characters")).max(10, "Maximum 10 preferred locations").optional(),
  skills: z.array(z.string().max(100, "Skill must be less than 100 characters")).max(50, "Maximum 50 skills").optional(),
  industries: z.array(z.string().max(100, "Industry must be less than 100 characters")).max(20, "Maximum 20 industries").optional(),
  jobTypes: z.array(JobTypeEnum).max(5, "Maximum 5 job types").optional(),
  resumeUrl: urlSchema,
  linkedinUrl: urlSchema,
  githubUrl: urlSchema,
  portfolioUrl: urlSchema,
}).refine((data) => {
  if (data.desiredSalaryMin && data.desiredSalaryMax) {
    return data.desiredSalaryMin <= data.desiredSalaryMax
  }
  return true
}, {
  message: "Minimum salary must be less than or equal to maximum salary",
  path: ["desiredSalaryMax"]
})

// Application schemas
export const applicationSchema = z.object({
  company: nonEmptyStringSchema.max(255, "Company name must be less than 255 characters"),
  position: nonEmptyStringSchema.max(255, "Position must be less than 255 characters"),
  location: z.string().max(255, "Location must be less than 255 characters").optional().or(z.literal("")),
  jobType: JobTypeEnum.optional(),
  salaryRange: z.string().max(100, "Salary range must be less than 100 characters").optional().or(z.literal("")),
  status: ApplicationStatusEnum,
  priority: PriorityEnum.default("Medium"),
  appliedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").or(z.date()),
  responseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(z.literal("")).or(z.date().optional()),
  interviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(z.literal("")).or(z.date().optional()),
  offerDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(z.literal("")).or(z.date().optional()),
  rejectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(z.literal("")).or(z.date().optional()),
  notes: z.string().max(5000, "Notes must be less than 5000 characters").optional().or(z.literal("")),
  jobDescription: z.string().max(10000, "Job description must be less than 10000 characters").optional().or(z.literal("")),
  requirements: z.array(z.string().max(500, "Requirement must be less than 500 characters")).max(50, "Maximum 50 requirements").optional(),
  contactPerson: z.string().max(255, "Contact person must be less than 255 characters").optional().or(z.literal("")),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  contactPhone: phoneSchema,
  companyWebsite: urlSchema,
  jobUrl: urlSchema,
  tags: z.array(z.string().max(50, "Tag must be less than 50 characters")).max(20, "Maximum 20 tags").optional(),
  followUpDate: z.date().optional(),
}).refine((data) => {
  // Validate date logic
  const dates = [
    { date: data.appliedDate, name: "Applied" },
    { date: data.responseDate, name: "Response" },
    { date: data.interviewDate, name: "Interview" },
    { date: data.offerDate, name: "Offer" },
    { date: data.rejectionDate, name: "Rejection" }
  ].filter(d => d.date)

  for (let i = 0; i < dates.length - 1; i++) {
    if (dates[i]!.date! > dates[i + 1]!.date!) {
      return false
    }
  }
  return true
}, {
  message: "Dates must be in chronological order",
  path: ["appliedDate"]
})

export const updateApplicationSchema = z.object({
  id: z.string().uuid("Invalid application ID"),
  company: z.string().max(255, "Company name must be less than 255 characters").optional(),
  position: z.string().max(255, "Position must be less than 255 characters").optional(),
  location: z.string().max(255, "Location must be less than 255 characters").optional().or(z.literal("")),
  jobType: JobTypeEnum.optional(),
  salaryRange: z.string().max(100, "Salary range must be less than 100 characters").optional().or(z.literal("")),
  status: ApplicationStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  appliedDate: z.date().optional(),
  responseDate: z.date().optional(),
  interviewDate: z.date().optional(),
  offerDate: z.date().optional(),
  rejectionDate: z.date().optional(),
  notes: z.string().max(5000, "Notes must be less than 5000 characters").optional().or(z.literal("")),
  jobDescription: z.string().max(10000, "Job description must be less than 10000 characters").optional().or(z.literal("")),
  requirements: z.array(z.string().max(500, "Requirement must be less than 500 characters")).max(50, "Maximum 50 requirements").optional(),
  contactPerson: z.string().max(255, "Contact person must be less than 255 characters").optional().or(z.literal("")),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  contactPhone: phoneSchema,
  companyWebsite: urlSchema,
  jobUrl: urlSchema,
  tags: z.array(z.string().max(50, "Tag must be less than 50 characters")).max(20, "Maximum 20 tags").optional(),
  followUpDate: z.date().optional(),
})

// CSV Import schemas
export const csvImportConfigSchema = z.object({
  delimiter: z.enum([",", ";", "\t", "|"]).default(","),
  encoding: z.enum(["utf-8", "iso-8859-1", "windows-1252"]).default("utf-8"),
  hasHeader: z.boolean().default(true),
  skipEmptyLines: z.boolean().default(true),
  trimWhitespace: z.boolean().default(true),
})

export const fieldMappingSchema = z.object({
  csvColumn: nonEmptyStringSchema,
  applicationField: z.string(),
  confidence: z.number().min(0).max(1),
  required: z.boolean().default(false),
  transformer: z.string().optional(),
})

export const csvImportSchema = z.object({
  config: csvImportConfigSchema,
  fieldMappings: z.array(fieldMappingSchema),
  validateOnly: z.boolean().default(false),
})

// AI Analysis schemas
export const aiInsightsSchema = z.object({
  matchReasons: z.array(z.string().max(500, "Match reason must be less than 500 characters")).max(10, "Maximum 10 match reasons"),
  improvementSuggestions: z.array(z.string().max(500, "Suggestion must be less than 500 characters")).max(10, "Maximum 10 suggestions"),
  successProbability: z.number().min(0).max(1),
  recommendedActions: z.array(z.string().max(500, "Action must be less than 500 characters")).max(10, "Maximum 10 actions"),
  competitorAnalysis: z.object({
    similarRoles: z.number().min(0),
    averageRequirements: z.array(z.string().max(200, "Requirement must be less than 200 characters")).max(20, "Maximum 20 requirements"),
    salaryBenchmark: z.string().max(100, "Salary benchmark must be less than 100 characters"),
  }).optional(),
})

export const aiAnalysisRequestSchema = z.object({
  analysisType: z.enum(["resume", "application_pattern", "job_match", "success_rate"]),
  inputData: z.record(z.any()),
  userId: z.string().uuid("Invalid user ID").optional(),
})

// Notification and reminder schemas
export const reminderSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  reminderType: z.enum(["follow_up", "interview_prep", "deadline", "custom"]),
  title: nonEmptyStringSchema.max(255, "Title must be less than 255 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional().or(z.literal("")),
  dueDate: z.date().min(new Date(), "Due date must be in the future"),
  isCompleted: z.boolean().default(false),
})

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  reminderFrequency: NotificationFrequencyEnum.default("Weekly"),
  aiRecommendations: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
})

// Search and filter schemas
export const applicationFilterSchema = z.object({
  status: z.array(ApplicationStatusEnum).optional(),
  priority: z.array(PriorityEnum).optional(),
  jobType: z.array(JobTypeEnum).optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  tags: z.array(z.string()).optional(),
  hasResponse: z.boolean().optional(),
  hasInterview: z.boolean().optional(),
  hasOffer: z.boolean().optional(),
})

export const searchQuerySchema = z.object({
  query: z.string().max(500, "Search query must be less than 500 characters").optional(),
  filters: applicationFilterSchema.optional(),
  sortBy: z.enum(["appliedDate", "company", "position", "status", "priority", "responseDate"]).default("appliedDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Export schemas
export const exportConfigSchema = z.object({
  format: z.enum(["csv", "excel", "pdf", "json"]),
  fields: z.array(z.string()).optional(),
  filters: applicationFilterSchema.optional(),
  includeNotes: z.boolean().default(true),
  includeAnalytics: z.boolean().default(false),
})

// Error handling schemas
export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
  timestamp: z.string(),
  path: z.string(),
})

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.literal(true),
  data: dataSchema,
  timestamp: z.string(),
})

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ApplicationInput = z.infer<typeof applicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
export type CSVImportConfig = z.infer<typeof csvImportConfigSchema>
export type FieldMapping = z.infer<typeof fieldMappingSchema>
export type CSVImportInput = z.infer<typeof csvImportSchema>
export type AIInsights = z.infer<typeof aiInsightsSchema>
export type AIAnalysisRequest = z.infer<typeof aiAnalysisRequestSchema>
export type ReminderInput = z.infer<typeof reminderSchema>
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>
export type ApplicationFilter = z.infer<typeof applicationFilterSchema>
export type SearchQuery = z.infer<typeof searchQuerySchema>
export type ExportConfig = z.infer<typeof exportConfigSchema>
export type APIError = z.infer<typeof apiErrorSchema>

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success
}

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success
}

export const validateUrl = (url: string): boolean => {
  if (!url || url === "") return true
  return urlSchema.safeParse(url).success
}

export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || phone === "") return true
  return phoneSchema.safeParse(phone).success
}

// Custom validation error formatter
export const formatValidationErrors = (error: z.ZodError): Record<string, string> => {
  const formattedErrors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    formattedErrors[path] = err.message
  })
  
  return formattedErrors
}