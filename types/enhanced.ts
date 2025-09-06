/**
 * Enhanced TypeScript types for improved type safety and developer experience
 */

// Utility types for better type safety
export type NonEmptyArray<T> = [T, ...T[]]

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// Brand types for better type safety
export type Brand<T, B> = T & { __brand: B }

export type UUID = Brand<string, 'UUID'>
export type EmailAddress = Brand<string, 'EmailAddress'>
export type PhoneNumber = Brand<string, 'PhoneNumber'>
export type URL = Brand<string, 'URL'>
export type ISODateString = Brand<string, 'ISODateString'>

// Result type for error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// Async result type
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

// Loading state type
export type LoadingState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// API response types
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

// Form types
export interface FormField<T = string> {
  value: T
  error?: string
  touched: boolean
  dirty: boolean
}

export interface FormState<T extends Record<string, any>> {
  fields: {
    [K in keyof T]: FormField<T[K]>
  }
  isValid: boolean
  isSubmitting: boolean
  submitCount: number
}

// Event handler types
export type EventHandler<T = Event> = (event: T) => void
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  'data-testid'?: string
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean
  loading?: boolean
  onClick?: EventHandler<React.MouseEvent>
}

// Storage types
export interface StorageAdapter<T> {
  get(key: string): Promise<T | null>
  set(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}

// Validation types
export interface ValidationRule<T> {
  validate: (value: T) => boolean | string
  message?: string
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[]
}

// Theme types
export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  error: string
  warning: string
  success: string
  info: string
}

export interface ThemeSpacing {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

export interface ThemeBreakpoints {
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

export interface Theme {
  colors: ThemeColors
  spacing: ThemeSpacing
  breakpoints: ThemeBreakpoints
  borderRadius: string
  fontFamily: string
  fontSize: Record<string, string>
  fontWeight: Record<string, number>
  lineHeight: Record<string, string>
  shadows: Record<string, string>
  transitions: Record<string, string>
}

// Analytics types
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: Date
  userId?: string
  sessionId?: string
}

export interface AnalyticsTracker {
  track(event: AnalyticsEvent): void
  identify(userId: string, properties?: Record<string, any>): void
  page(name: string, properties?: Record<string, any>): void
}

// Performance types
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
  memoryUsage?: number
  bundleSize?: number
}

// Accessibility types
export interface AccessibilityOptions {
  announceChanges?: boolean
  focusManagement?: boolean
  keyboardNavigation?: boolean
  screenReaderSupport?: boolean
  highContrast?: boolean
  reducedMotion?: boolean
}

// Feature flag types
export interface FeatureFlags {
  [key: string]: boolean | string | number
}

export interface FeatureFlagProvider {
  isEnabled(flag: string): boolean
  getValue<T>(flag: string, defaultValue: T): T
  getAllFlags(): FeatureFlags
}

// Configuration types
export interface AppConfig {
  apiUrl: string
  environment: 'development' | 'staging' | 'production'
  version: string
  features: FeatureFlags
  analytics: {
    enabled: boolean
    trackingId?: string
  }
  ai: {
    enabled: boolean
    provider: string
    apiKey?: string
  }
  storage: {
    type: 'local' | 'indexeddb' | 'cloud'
    encryption: boolean
  }
}

// Hook types
export interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: (...args: any[]) => Promise<void>
  reset: () => void
}

export interface UseLocalStorage<T> {
  value: T | null
  setValue: (value: T) => void
  removeValue: () => void
  loading: boolean
  error: Error | null
}

// Utility function types
export type Debounced<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
}

export type Throttled<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void
  cancel: () => void
}

// Type guards
export const isNonNull = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined
}

export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value)
}

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean'
}

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value)
}

export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function'
}

// Type assertion helpers
export const assertIsString = (value: unknown, message?: string): asserts value is string => {
  if (!isString(value)) {
    throw new Error(message || `Expected string, got ${typeof value}`)
  }
}

export const assertIsNumber = (value: unknown, message?: string): asserts value is number => {
  if (!isNumber(value)) {
    throw new Error(message || `Expected number, got ${typeof value}`)
  }
}

export const assertIsObject = (value: unknown, message?: string): asserts value is Record<string, unknown> => {
  if (!isObject(value)) {
    throw new Error(message || `Expected object, got ${typeof value}`)
  }
}

// Branded type creators
export const createUUID = (value: string): UUID => {
  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid UUID format: ${value}`)
  }
  return value as UUID
}

export const createEmailAddress = (value: string): EmailAddress => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    throw new Error(`Invalid email format: ${value}`)
  }
  return value as EmailAddress
}

export const createURL = (value: string): URL => {
  try {
    new globalThis.URL(value)
    return value as URL
  } catch {
    throw new Error(`Invalid URL format: ${value}`)
  }
}

export const createISODateString = (value: string): ISODateString => {
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date string: ${value}`)
  }
  return value as ISODateString
}