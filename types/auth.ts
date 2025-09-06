import { User } from "@prisma/client"

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  name?: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  location?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  location?: string
  experienceLevel?: "Entry" | "Mid" | "Senior" | "Executive"
  desiredSalaryMin?: number
  desiredSalaryMax?: number
  preferredLocations: string[]
  skills: string[]
  industries: string[]
  jobTypes: string[]
  resumeUrl?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  preferences?: UserPreferences
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  // Notification preferences
  emailNotifications: boolean
  reminderFrequency: "Daily" | "Weekly" | "Never"
  aiRecommendations: boolean
  followUpReminders: boolean
  interviewReminders: boolean
  applicationDeadlines: boolean
  
  // Dashboard customization
  dashboardLayout: "compact" | "comfortable" | "spacious"
  defaultView: "table" | "cards" | "kanban"
  itemsPerPage: number
  showCompletedApplications: boolean
  defaultSortBy: "appliedDate" | "company" | "position" | "status" | "priority"
  defaultSortOrder: "asc" | "desc"
  
  // Privacy controls
  dataRetention: "1year" | "2years" | "5years" | "indefinite"
  shareAnalytics: boolean
  allowDataExport: boolean
  
  // UI preferences
  theme: "light" | "dark" | "system"
  language: string
  timezone: string
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
  currency: string
}

export interface NotificationSettings {
  email: boolean
  inApp: boolean
  frequency: "immediate" | "daily" | "weekly"
  types: {
    followUps: boolean
    interviews: boolean
    deadlines: boolean
    recommendations: boolean
    insights: boolean
  }
}

export interface PrivacySettings {
  dataRetention: "1year" | "2years" | "5years" | "indefinite"
  shareAnalytics: boolean
  allowDataExport: boolean
  allowDataDeletion: boolean
  cookieConsent: boolean
  trackingConsent: boolean
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp?: string
}