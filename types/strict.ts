/**
 * Strict type definitions for TypeScript strict mode compliance
 * This file contains proper type definitions to replace 'any' types
 */

// Generic utility types
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

// Sync Manager Types
export interface SyncAction {
  id: string;
  type: string;
  data: JSONObject;
  timestamp: number;
  retryCount: number;
}

export interface SyncResult {
  actionId: string;
  error?: Error;
  response?: JSONValue;
}

export interface ApplicationActionData extends Record<string, JSONValue | undefined> {
  company?: string;
  position?: string;
  status?: string;
  location?: string;
  appliedDate?: string;
}

// Hydration Utilities Types
export interface HydrationErrorReport {
  componentName: string;
  serverValue: JSONValue;
  clientValue: JSONValue;
  timestamp: number;
  userAgent?: string;
}

// AI Service Types
export interface UserProfile {
  skills: string[];
  experience: string[];
  preferences: {
    industries: string[];
    locations: string[];
    salaryRange?: {
      min: number;
      max: number;
    };
  };
  careerGoals?: string;
}

export interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable';
  score: number;
  monthlyStats: MonthlyStats[];
}

export interface MonthlyStats {
  month: string;
  applications: number;
  responses: number;
  interviews: number;
  offers: number;
  responseRate: number;
}

export interface AIRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
}

// Export Service Types
export interface ExportFieldFormatter {
  (value: JSONValue): string;
}

export interface ExportField {
  key: string;
  label: string;
  selected: boolean;
  type: 'string' | 'date' | 'number' | 'array' | 'object';
  formatter?: ExportFieldFormatter;
}

export interface ExportData {
  exportDate: string;
  totalRecords: number;
  fields: Array<{ key: string; label: string }>;
  applications: JSONObject[];
  aiInsights?: JSONObject[];
  statistics?: JSONObject;
}

export interface PDFDrawPageData {
  pageNumber: number;
  pageCount: number;
  settings: {
    margin: { top: number; left: number; bottom: number; right: number };
  };
}

// Automation Types
export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'days_since';
  value: JSONValue;
}

export interface WorkflowActionConfig {
  type: string;
  [key: string]: JSONValue;
}

export interface AutomationTaskResult {
  success: boolean;
  message?: string;
  data?: JSONObject;
}

export interface SmartAutomationRule {
  field: string;
  operator: 'equals' | 'contains' | 'range' | 'frequency';
  value: JSONValue;
  weight: number;
}

// Notification Service Types
export interface NotificationTemplate {
  subject: string;
  body: string;
  type: 'email' | 'push' | 'sms';
}

export interface ReminderData {
  id: string;
  title: string;
  dueDate: string;
  application?: {
    id: string;
    company: string;
    position: string;
  };
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  digestFrequency: 'daily' | 'weekly' | 'never';
  reminderTiming: number; // hours before due date
}

export interface DailyDigestData {
  upcomingReminders: ReminderData[];
  overdueReminders: ReminderData[];
}

export interface WeeklyDigestData {
  upcomingReminders: ReminderData[];
  weeklyStats: {
    applicationsSubmitted: number;
    interviewsScheduled: number;
    responsesReceived: number;
  };
}

// CSV Data Validator Types
export interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  cleanedData: JSONObject[];
}

export interface CSVRowData {
  [key: string]: string | number | boolean | null;
}

// Component Props Types
export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  position?: string;
  phone?: string;
  notes?: string;
}

export interface ContactFiltersType {
  company?: string;
  position?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface IntegrationSyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
  warnings: string[];
}

export interface PrivacySettings {
  dataRetention: number; // days
  shareAnalytics: boolean;
  allowCookies: boolean;
  exportOnDelete: boolean;
}

// Analytics Types
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TrendsData {
  timeSeriesData: TimeSeriesDataPoint[];
  trendIndicators: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  comparativeAnalysis: {
    currentPeriod: number;
    previousPeriod: number;
    change: number;
    changePercentage: number;
  };
  seasonalPatterns: {
    monthly: MonthlyPattern[];
    weekly: WeeklyPattern[];
    insights: SeasonalInsight[];
  };
  forecasting: ForecastData;
}

export interface MonthlyPattern {
  month: number;
  averageApplications: number;
  successRate: number;
}

export interface WeeklyPattern {
  dayOfWeek: number;
  averageApplications: number;
  responseRate: number;
}

export interface SeasonalInsight {
  type: 'peak' | 'low' | 'trend';
  period: string;
  description: string;
  confidence: number;
}

export interface ForecastData {
  nextMonth: {
    predictedApplications: number;
    confidence: number;
  };
  recommendations: string[];
}

export interface AnalyticsData {
  overview: {
    totalApplications: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    averageResponseTime: number;
  };
  trends: TrendsData;
  distributions: {
    statusDistribution: StatusDistribution[];
    companyPerformance: CompanyPerformance[];
    locationAnalysis: LocationAnalysis[];
  };
  benchmarks: {
    industryAverages: {
      responseRate: number;
      interviewRate: number;
      offerRate: number;
    };
    personalBest: {
      bestMonth: string;
      bestResponseRate: number;
      bestInterviewRate: number;
    };
  };
  insights: AnalyticsInsight[];
  recommendations: AnalyticsRecommendation[];
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface CompanyPerformance {
  company: string;
  applications: number;
  responses: number;
  interviews: number;
  offers: number;
  responseRate: number;
}

export interface LocationAnalysis {
  location: string;
  applications: number;
  averageSalary?: number;
  responseRate: number;
}

export interface AnalyticsInsight {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface AnalyticsRecommendation {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

// Performance Monitoring Types
export interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  [key: string]: JSONValue;
}

export interface WebVitalMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

// Backup Service Types
export interface BackupUserPreferences {
  theme: string;
  language: string;
  notifications: NotificationPreferences;
  [key: string]: JSONValue | NotificationPreferences;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  [key: string]: JSONValue;
}

export interface CSVApplicationData {
  [key: string]: string;
}

// Mock Component Props (for testing)
export interface MockComponentProps {
  children?: React.ReactNode;
  [key: string]: JSONValue | React.ReactNode | undefined;
}

export interface MockFormProps {
  onSubmit?: (data: JSONObject) => void;
  onCancel?: () => void;
  [key: string]: JSONValue | ((data: JSONObject) => void) | (() => void) | undefined;
}

// Generic event handlers
export type EventHandler<T = JSONValue> = (value: T) => void;
export type AsyncEventHandler<T = JSONValue> = (value: T) => Promise<void>;

// Form field types
export type FormFieldValue = string | number | boolean | string[] | null;
export type FormData = Record<string, FormFieldValue>;

// API Response types
export interface APIResponse<T = JSONValue> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Generic callback types
export type Callback = () => void;
export type CallbackWithData<T = JSONValue> = (data: T) => void;
export type AsyncCallback = () => Promise<void>;
export type AsyncCallbackWithData<T = JSONValue> = (data: T) => Promise<void>;