import { Application } from '@/types/application'
import type { JSONValue } from '@/types/strict'

export interface DuplicateMatch {
  existingApplication: Application
  similarity: number
  matchReasons: string[]
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean
  matches: DuplicateMatch[]
  confidence: 'high' | 'medium' | 'low'
}

export interface BulkDuplicateResult {
  duplicateGroups: DuplicateGroup[]
  totalDuplicates: number
  highConfidenceCount: number
  mediumConfidenceCount: number
  lowConfidenceCount: number
  recommendations: BulkRecommendation[]
}

export interface DuplicateGroup {
  id: string
  applications: Application[]
  confidence: number
  matchReasons: string[]
  recommendedAction: 'merge' | 'keep_newest' | 'keep_oldest' | 'manual_review'
  mergePreview?: Partial<Application>
}

export interface BulkRecommendation {
  type: 'merge_all' | 'keep_newest' | 'keep_oldest' | 'manual_review'
  groupIds: string[]
  description: string
  confidence: 'high' | 'medium' | 'low'
}

export interface BulkResolutionAction {
  groupId: string
  action: 'merge' | 'keep_newest' | 'keep_oldest' | 'keep_all' | 'delete_duplicates'
  primaryApplicationId?: string
  mergedData?: Partial<Application>
}

/**
 * Detect potential duplicate applications with enhanced intelligence
 */
export function detectDuplicates(
  newApplication: Partial<Application>,
  existingApplications: Application[]
): DuplicateDetectionResult {
  const matches: DuplicateMatch[] = []

  for (const existing of existingApplications) {
    const similarity = calculateSimilarity(newApplication, existing)
    const matchReasons = getMatchReasons(newApplication, existing)

    if (similarity > 0.4) { // Lowered threshold for better detection
      matches.push({
        existingApplication: existing,
        similarity,
        matchReasons
      })
    }
  }

  // Sort matches by similarity (highest first)
  matches.sort((a, b) => b.similarity - a.similarity)

  // Enhanced duplicate determination with multiple criteria
  const isDuplicate = Boolean(matches.length > 0 && matches[0] && (
    matches[0].similarity > 0.8 || // High similarity
    hasExactMatches(matches[0].matchReasons) || // Exact company/URL match
    hasStrongIndicators(newApplication, matches[0].existingApplication) // Strong duplicate indicators
  ))
  
  const confidence = getConfidenceLevel(matches)

  return {
    isDuplicate,
    matches: matches.slice(0, 5), // Return top 5 matches for better options
    confidence
  }
}

/**
 * Check for exact matches that strongly indicate duplicates
 */
function hasExactMatches(matchReasons: string[]): boolean {
  return matchReasons.some(reason => 
    reason.includes('Same job URL') ||
    reason.includes('Same company name') && reason.includes('Same position title')
  )
}

/**
 * Check for strong duplicate indicators
 */
function hasStrongIndicators(app1: Partial<Application>, app2: Application): boolean {
  // Same company and position with similar dates
  if (app1.company?.toLowerCase() === app2.company.toLowerCase() &&
      app1.position?.toLowerCase() === app2.position.toLowerCase() &&
      app1.appliedDate && app2.appliedDate) {
    const date1 = new Date(app1.appliedDate)
    const date2 = new Date(app2.appliedDate)
    const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 30 // Within 30 days
  }

  // Same contact email (strong indicator)
  if (app1.contactEmail && app2.contactEmail &&
      app1.contactEmail.toLowerCase() === app2.contactEmail.toLowerCase()) {
    return true
  }

  return false
}

/**
 * Calculate similarity between two applications with enhanced algorithm
 */
function calculateSimilarity(
  app1: Partial<Application>,
  app2: Application
): number {
  let totalWeight = 0
  let matchedWeight = 0

  // Company name (weight: 35%)
  const companyWeight = 0.35
  totalWeight += companyWeight
  if (app1.company && app2.company) {
    const companySimilarity = enhancedStringSimilarity(
      app1.company.toLowerCase(),
      app2.company.toLowerCase()
    )
    matchedWeight += companySimilarity * companyWeight
  }

  // Position title (weight: 30%)
  const positionWeight = 0.30
  totalWeight += positionWeight
  if (app1.position && app2.position) {
    const positionSimilarity = enhancedStringSimilarity(
      app1.position.toLowerCase(),
      app2.position.toLowerCase()
    )
    matchedWeight += positionSimilarity * positionWeight
  }

  // Location (weight: 10%)
  const locationWeight = 0.10
  totalWeight += locationWeight
  if (app1.location && app2.location) {
    const locationSimilarity = enhancedStringSimilarity(
      app1.location.toLowerCase(),
      app2.location.toLowerCase()
    )
    matchedWeight += locationSimilarity * locationWeight
  }

  // Job URL (weight: 15% - increased importance)
  const urlWeight = 0.15
  if (app1.jobUrl && app2.jobUrl) {
    totalWeight += urlWeight
    const urlSimilarity = app1.jobUrl === app2.jobUrl ? 1 : 0
    matchedWeight += urlSimilarity * urlWeight
  }

  // Contact email (weight: 10%)
  const emailWeight = 0.10
  if (app1.contactEmail && app2.contactEmail) {
    totalWeight += emailWeight
    const emailSimilarity = app1.contactEmail.toLowerCase() === app2.contactEmail.toLowerCase() ? 1 : 0
    matchedWeight += emailSimilarity * emailWeight
  }

  return totalWeight > 0 ? matchedWeight / totalWeight : 0
}

/**
 * Enhanced string similarity with better fuzzy matching
 */
function enhancedStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1
  if (str1.length === 0 || str2.length === 0) return 0

  // Normalize strings for better comparison
  const normalize = (s: string) => s
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  const norm1 = normalize(str1)
  const norm2 = normalize(str2)

  if (norm1 === norm2) return 1

  // Check for substring matches (common for company variations)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const longer = norm1.length > norm2.length ? norm1 : norm2
    const shorter = norm1.length > norm2.length ? norm2 : norm1
    return shorter.length / longer.length * 0.9 // High similarity for substring matches
  }

  // Use Levenshtein distance for fuzzy matching
  return levenshteinSimilarity(norm1, norm2)
}

/**
 * Calculate Levenshtein distance similarity
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j]![i] = Math.min(
        matrix[j]![i - 1]! + 1, // deletion
        matrix[j - 1]![i]! + 1, // insertion
        matrix[j - 1]![i - 1]! + indicator // substitution
      )
    }
  }

  const maxLength = Math.max(str1.length, str2.length)
  return (maxLength - matrix[str2.length]![str1.length]!) / maxLength
}

/**
 * Get detailed reasons why applications might be duplicates
 */
function getMatchReasons(
  app1: Partial<Application>,
  app2: Application
): string[] {
  const reasons: string[] = []

  // Company matching
  if (app1.company && app2.company) {
    const companySimilarity = enhancedStringSimilarity(
      app1.company.toLowerCase(),
      app2.company.toLowerCase()
    )
    
    if (companySimilarity === 1) {
      reasons.push('Identical company name')
    } else if (companySimilarity > 0.9) {
      reasons.push('Very similar company names')
    } else if (companySimilarity > 0.7) {
      reasons.push('Similar company names')
    }
  }

  // Position matching
  if (app1.position && app2.position) {
    const positionSimilarity = enhancedStringSimilarity(
      app1.position.toLowerCase(),
      app2.position.toLowerCase()
    )
    
    if (positionSimilarity === 1) {
      reasons.push('Identical position title')
    } else if (positionSimilarity > 0.8) {
      reasons.push('Very similar position titles')
    } else if (positionSimilarity > 0.6) {
      reasons.push('Similar position titles')
    }
  }

  // Location matching
  if (app1.location && app2.location) {
    const locationSimilarity = enhancedStringSimilarity(
      app1.location.toLowerCase(),
      app2.location.toLowerCase()
    )
    
    if (locationSimilarity === 1) {
      reasons.push('Same location')
    } else if (locationSimilarity > 0.8) {
      reasons.push('Similar locations')
    }
  }

  // Exact matches (high confidence indicators)
  if (app1.jobUrl && app2.jobUrl && app1.jobUrl === app2.jobUrl) {
    reasons.push('Same job URL')
  }

  if (app1.contactEmail && app2.contactEmail && 
      app1.contactEmail.toLowerCase() === app2.contactEmail.toLowerCase()) {
    reasons.push('Same contact email')
  }

  // Date proximity
  if (app1.appliedDate && app2.appliedDate) {
    const date1 = new Date(app1.appliedDate)
    const date2 = new Date(app2.appliedDate)
    const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysDiff === 0) {
      reasons.push('Applied on the same date')
    } else if (daysDiff <= 7) {
      reasons.push(`Applied within ${Math.ceil(daysDiff)} days`)
    } else if (daysDiff <= 30) {
      reasons.push(`Applied within ${Math.ceil(daysDiff)} days`)
    }
  }

  // Status correlation
  if (app1.status && app2.status && app1.status === app2.status) {
    reasons.push(`Both have status: ${app1.status}`)
  }

  // Salary range similarity
  if (app1.salary && app2.salary && 
      app1.salary.toLowerCase() === app2.salary.toLowerCase()) {
    reasons.push('Same salary range')
  }

  return reasons
}

/**
 * Determine confidence level based on matches
 */
function getConfidenceLevel(matches: DuplicateMatch[]): 'high' | 'medium' | 'low' {
  if (matches.length === 0 || !matches[0]) return 'low'

  const highestSimilarity = matches[0].similarity
  const hasExactMatches = matches[0].matchReasons.some(reason => 
    reason.includes('Same company') || reason.includes('Same job URL')
  )

  if (highestSimilarity > 0.9 || hasExactMatches) {
    return 'high'
  } else if (highestSimilarity > 0.7) {
    return 'medium'
  } else {
    return 'low'
  }
}

/**
 * Calculate string similarity using a simpler approach
 */
function stringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1
  if (str1.length === 0 || str2.length === 0) return 0

  // Simple similarity based on common characters and length
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1
  
  // Count matching characters
  let matches = 0
  const shorterChars = shorter.toLowerCase().split('')
  const longerChars = longer.toLowerCase().split('')
  
  for (const char of shorterChars) {
    const index = longerChars.indexOf(char)
    if (index !== -1) {
      matches++
      longerChars.splice(index, 1) // Remove matched character to avoid double counting
    }
  }
  
  return matches / longer.length
}

/**
 * Generate intelligent merge suggestions with conflict resolution
 */
export function generateMergeSuggestions(
  newApp: Partial<Application>,
  existingApp: Application
): Partial<Application> {
  const merged: Partial<Application> = { ...existingApp }

  // Smart field merging with conflict resolution
  merged.company = chooseBestValue(newApp.company, existingApp.company, 'string')
  merged.position = chooseBestValue(newApp.position, existingApp.position, 'string')
  merged.location = chooseBestValue(newApp.location, existingApp.location, 'string')
  merged.type = chooseBestValue(newApp.type, existingApp.type, 'enum')
  
  // Salary: prefer new if provided (user might be updating)
  if (newApp.salary && newApp.salary.trim()) {
    merged.salary = newApp.salary
  }

  // Status: choose more advanced status
  merged.status = chooseBestStatus(newApp.status, existingApp.status)

  // Dates: use most recent information
  merged.appliedDate = chooseBestDate(newApp.appliedDate, existingApp.appliedDate, 'earliest') || existingApp.appliedDate
  merged.responseDate = chooseBestDate(newApp.responseDate, existingApp.responseDate, 'latest')
  merged.interviewDate = chooseBestDate(newApp.interviewDate, existingApp.interviewDate, 'latest')

  // Contact information: prefer new if more complete
  merged.contactPerson = chooseBestValue(newApp.contactPerson, existingApp.contactPerson, 'string')
  merged.contactEmail = chooseBestValue(newApp.contactEmail, existingApp.contactEmail, 'email')
  merged.jobUrl = chooseBestValue(newApp.jobUrl, existingApp.jobUrl, 'url')
  merged.companyWebsite = chooseBestValue(newApp.companyWebsite, existingApp.companyWebsite, 'url')

  // Priority: choose higher priority
  merged.priority = chooseBestPriority(newApp.priority, existingApp.priority)

  // Merge arrays intelligently
  merged.tags = mergeArrays(newApp.tags || [], existingApp.tags || [])
  merged.requirements = mergeArrays(newApp.requirements || [], existingApp.requirements || [])

  // Combine text fields intelligently
  merged.notes = combineTextFields(newApp.notes, existingApp.notes, 'notes')
  merged.jobDescription = combineTextFields(newApp.jobDescription, existingApp.jobDescription, 'description')

  // Preserve AI insights from existing application
  if (existingApp.aiInsights) {
    merged.aiInsights = existingApp.aiInsights
  }
  if (existingApp.aiMatchScore) {
    merged.aiMatchScore = existingApp.aiMatchScore
  }

  return merged
}

/**
 * Choose the best value between two options based on type and quality
 */
function chooseBestValue(
  newValue: string | undefined | null,
  existingValue: string | undefined | null,
  type: 'string' | 'email' | 'url' | 'enum'
): string | undefined {
  // If only one has a value, use it
  if (!newValue && existingValue) return existingValue
  if (newValue && !existingValue) return newValue
  if (!newValue && !existingValue) return existingValue

  // Both have values - choose based on type
  switch (type) {
    case 'string':
      // Prefer longer, more detailed strings
      return String(newValue).length > String(existingValue).length ? newValue : existingValue
    
    case 'email':
      // Prefer valid email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const newIsValid = emailRegex.test(String(newValue))
      const existingIsValid = emailRegex.test(String(existingValue))
      
      if (newIsValid && !existingIsValid) return newValue
      if (!newIsValid && existingIsValid) return existingValue
      return newValue // Prefer new if both valid or both invalid
    
    case 'url':
      // Prefer valid URL format
      try {
        new URL(String(newValue))
        return newValue
      } catch {
        try {
          new URL(String(existingValue))
          return existingValue
        } catch {
          return newValue // Prefer new if both invalid
        }
      }
    
    case 'enum':
      // Prefer new value for enum types
      return newValue
    
    default:
      return newValue
  }
}

/**
 * Choose the best status based on application progression
 */
function chooseBestStatus(
  newStatus?: Application['status'],
  existingStatus?: Application['status']
): Application['status'] {
  if (!newStatus) return existingStatus || 'Pending'
  if (!existingStatus) return newStatus

  const statusPriority = {
    'Pending': 1,
    'Applied': 2,
    'Interviewing': 4,
    'Offered': 5,
    'Accepted': 6,
    'Rejected': 3,
    'Withdrawn': 2
  }

  const newPriority = statusPriority[newStatus] || 0
  const existingPriority = statusPriority[existingStatus] || 0

  return newPriority > existingPriority ? newStatus : existingStatus
}

/**
 * Choose the best priority level
 */
function chooseBestPriority(
  newPriority?: Application['priority'],
  existingPriority?: Application['priority']
): Application['priority'] {
  if (!newPriority) return existingPriority || 'Medium'
  if (!existingPriority) return newPriority

  const priorityOrder = { 'Low': 1, 'Medium': 2, 'High': 3 }
  const newOrder = priorityOrder[newPriority] || 2
  const existingOrder = priorityOrder[existingPriority] || 2

  return newOrder > existingOrder ? newPriority : existingPriority
}

/**
 * Choose the best date based on strategy
 */
function chooseBestDate(
  newDate?: string | null,
  existingDate?: string | null,
  strategy: 'earliest' | 'latest' = 'latest'
): string | undefined {
  if (!newDate && !existingDate) return undefined
  if (!newDate) return existingDate || undefined
  if (!existingDate) return newDate

  const date1 = new Date(newDate)
  const date2 = new Date(existingDate)

  if (isNaN(date1.getTime()) && isNaN(date2.getTime())) return newDate
  if (isNaN(date1.getTime())) return existingDate
  if (isNaN(date2.getTime())) return newDate

  if (strategy === 'earliest') {
    return date1 < date2 ? newDate : existingDate
  } else {
    return date1 > date2 ? newDate : existingDate
  }
}

/**
 * Merge arrays removing duplicates and maintaining order
 */
function mergeArrays(newArray: string[], existingArray: string[]): string[] {
  const combined = [...existingArray, ...newArray]
  return [...new Set(combined.map(item => item.toLowerCase()))]
    .map(lower => combined.find(item => item.toLowerCase() === lower)!)
    .filter(Boolean)
}

/**
 * Combine text fields intelligently
 */
function combineTextFields(
  newText?: string,
  existingText?: string,
  type: 'notes' | 'description' = 'notes'
): string {
  if (!newText && !existingText) return ''
  if (!newText) return existingText || ''
  if (!existingText) return newText

  const newTrimmed = newText.trim()
  const existingTrimmed = existingText.trim()

  // If they're the same, return one
  if (newTrimmed.toLowerCase() === existingTrimmed.toLowerCase()) {
    return newTrimmed.length > existingTrimmed.length ? newTrimmed : existingTrimmed
  }

  // If one contains the other, return the longer one
  if (newTrimmed.toLowerCase().includes(existingTrimmed.toLowerCase())) {
    return newTrimmed
  }
  if (existingTrimmed.toLowerCase().includes(newTrimmed.toLowerCase())) {
    return existingTrimmed
  }

  // Combine them with appropriate separator
  const separator = type === 'notes' ? '\n\n---\n\n' : '\n\n'
  return `${existingTrimmed}${separator}${newTrimmed}`
}

/**
 * Detect duplicates across all applications for bulk operations
 */
export function detectBulkDuplicates(applications: Application[]): BulkDuplicateResult {
  const duplicateGroups: DuplicateGroup[] = []
  const processed = new Set<string>()

  // Find duplicate groups
  for (let i = 0; i < applications.length; i++) {
    if (processed.has(applications[i]!.id)) continue

    const currentApp = applications[i]!
    const group: Application[] = [currentApp]
    processed.add(currentApp.id)

    // Find all similar applications
    for (let j = i + 1; j < applications.length; j++) {
      if (processed.has(applications[j]!.id)) continue

      const similarity = calculateSimilarity(currentApp, applications[j]!)
      const matchReasons = getMatchReasons(currentApp, applications[j]!)

      if (similarity > 0.6) { // Threshold for bulk detection
        group.push(applications[j]!)
        processed.add(applications[j]!.id)
      }
    }

    // Only create groups with duplicates
    if (group.length > 1) {
      const confidence = Math.max(...group.slice(1).map(app => 
        calculateSimilarity(currentApp, app)
      ))
      
      const matchReasons = getMatchReasons(currentApp, group[1]!)
      
      duplicateGroups.push({
        id: `group-${currentApp.id}`,
        applications: group,
        confidence,
        matchReasons,
        recommendedAction: getRecommendedAction(group, confidence),
        mergePreview: generateBulkMergePreview(group)
      })
    }
  }

  // Generate statistics and recommendations
  const stats = generateBulkStats(duplicateGroups)
  const recommendations = generateBulkRecommendations(duplicateGroups)

  return {
    duplicateGroups,
    ...stats,
    recommendations
  }
}

/**
 * Get recommended action for a duplicate group
 */
function getRecommendedAction(
  applications: Application[],
  confidence: number
): 'merge' | 'keep_newest' | 'keep_oldest' | 'manual_review' {
  if (confidence > 0.9) {
    return 'merge'
  } else if (confidence > 0.8) {
    // Check if applications have different statuses - might want to keep newest
    const statuses = [...new Set(applications.map(app => app.status))]
    if (statuses.length > 1) {
      return 'keep_newest'
    }
    return 'merge'
  } else if (confidence > 0.7) {
    return 'keep_newest'
  } else {
    return 'manual_review'
  }
}

/**
 * Generate merge preview for multiple applications
 */
function generateBulkMergePreview(applications: Application[]): Partial<Application> {
  if (applications.length === 0) return {}
  if (applications.length === 1) return applications[0]!

  let merged = { ...applications[0]! }

  // Merge each subsequent application
  for (let i = 1; i < applications.length; i++) {
    merged = generateMergeSuggestions(applications[i]!, merged as Application) as Application
  }

  return merged
}

/**
 * Generate statistics for bulk duplicate detection
 */
function generateBulkStats(duplicateGroups: DuplicateGroup[]) {
  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.applications.length - 1, 0)
  
  const highConfidenceCount = duplicateGroups.filter(g => g.confidence > 0.9).length
  const mediumConfidenceCount = duplicateGroups.filter(g => g.confidence > 0.7 && g.confidence <= 0.9).length
  const lowConfidenceCount = duplicateGroups.filter(g => g.confidence <= 0.7).length

  return {
    totalDuplicates,
    highConfidenceCount,
    mediumConfidenceCount,
    lowConfidenceCount
  }
}

/**
 * Generate bulk recommendations
 */
function generateBulkRecommendations(duplicateGroups: DuplicateGroup[]): BulkRecommendation[] {
  const recommendations: BulkRecommendation[] = []

  // High confidence groups - recommend merge
  const highConfidenceGroups = duplicateGroups.filter(g => g.confidence > 0.9)
  if (highConfidenceGroups.length > 0) {
    recommendations.push({
      type: 'merge_all',
      groupIds: highConfidenceGroups.map(g => g.id),
      description: `Merge ${highConfidenceGroups.length} high-confidence duplicate groups`,
      confidence: 'high'
    })
  }

  // Medium confidence groups - recommend keep newest
  const mediumConfidenceGroups = duplicateGroups.filter(g => g.confidence > 0.7 && g.confidence <= 0.9)
  if (mediumConfidenceGroups.length > 0) {
    recommendations.push({
      type: 'keep_newest',
      groupIds: mediumConfidenceGroups.map(g => g.id),
      description: `Keep newest application from ${mediumConfidenceGroups.length} medium-confidence groups`,
      confidence: 'medium'
    })
  }

  // Low confidence groups - recommend manual review
  const lowConfidenceGroups = duplicateGroups.filter(g => g.confidence <= 0.7)
  if (lowConfidenceGroups.length > 0) {
    recommendations.push({
      type: 'manual_review',
      groupIds: lowConfidenceGroups.map(g => g.id),
      description: `Manually review ${lowConfidenceGroups.length} low-confidence groups`,
      confidence: 'low'
    })
  }

  return recommendations
}

/**
 * Apply bulk resolution actions
 */
export function applyBulkResolutions(
  applications: Application[],
  actions: BulkResolutionAction[]
): {
  updatedApplications: Application[]
  deletedApplicationIds: string[]
  mergedApplications: Application[]
  summary: {
    merged: number
    deleted: number
    kept: number
  }
} {
  const updatedApplications = [...applications]
  const deletedApplicationIds: string[] = []
  const mergedApplications: Application[] = []
  const summary = { merged: 0, deleted: 0, kept: 0 }

  // Group actions by duplicate group
  const actionMap = new Map<string, BulkResolutionAction>()
  actions.forEach(action => actionMap.set(action.groupId, action))

  // Find duplicate groups
  const bulkResult = detectBulkDuplicates(applications)
  
  bulkResult.duplicateGroups.forEach(group => {
    const action = actionMap.get(group.id)
    if (!action) return

    switch (action.action) {
      case 'merge':
        // Keep the first application, merge others into it
        const primaryApp = group.applications[0]!
        const mergedData = action.mergedData || generateBulkMergePreview(group.applications)
        
        // Update primary application
        const primaryIndex = updatedApplications.findIndex(app => app.id === primaryApp.id)
        if (primaryIndex !== -1) {
          updatedApplications[primaryIndex] = { ...primaryApp, ...mergedData } as Application
          mergedApplications.push(updatedApplications[primaryIndex]!)
        }
        
        // Mark others for deletion
        group.applications.slice(1).forEach(app => {
          deletedApplicationIds.push(app.id)
        })
        
        summary.merged++
        summary.deleted += group.applications.length - 1
        break

      case 'keep_newest':
        // Keep the application with the most recent applied date
        const sortedByDate = [...group.applications].sort((a, b) => 
          new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
        )
        const newestApp = sortedByDate[0]!
        
        // Mark others for deletion
        group.applications.filter(app => app.id !== newestApp.id).forEach(app => {
          deletedApplicationIds.push(app.id)
        })
        
        summary.kept++
        summary.deleted += group.applications.length - 1
        break

      case 'keep_oldest':
        // Keep the application with the earliest applied date
        const sortedByDateOld = [...group.applications].sort((a, b) => 
          new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime()
        )
        const oldestApp = sortedByDateOld[0]!
        
        // Mark others for deletion
        group.applications.filter(app => app.id !== oldestApp.id).forEach(app => {
          deletedApplicationIds.push(app.id)
        })
        
        summary.kept++
        summary.deleted += group.applications.length - 1
        break

      case 'delete_duplicates':
        // Keep first, delete all others
        group.applications.slice(1).forEach(app => {
          deletedApplicationIds.push(app.id)
        })
        
        summary.kept++
        summary.deleted += group.applications.length - 1
        break

      case 'keep_all':
        // No action needed
        summary.kept += group.applications.length
        break
    }
  })

  // Remove deleted applications
  const finalApplications = updatedApplications.filter(app => 
    !deletedApplicationIds.includes(app.id)
  )

  return {
    updatedApplications: finalApplications,
    deletedApplicationIds,
    mergedApplications,
    summary
  }
}