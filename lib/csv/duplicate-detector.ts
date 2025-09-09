import { Application } from '@/types/application'

export interface DuplicateMatch {
  originalIndex: number
  duplicateIndex: number
  confidence: number
  matchReasons: string[]
  suggestedAction: 'merge' | 'skip' | 'update' | 'keep_both'
  mergePreview?: Partial<Application>
}

export interface DuplicateGroup {
  id: string
  applications: Array<{
    index: number
    data: Record<string, unknown>
    isExisting?: boolean
  }>
  confidence: number
  matchReasons: string[]
  suggestedResolution: 'merge' | 'skip_duplicates' | 'keep_all'
}

export interface DuplicateResolution {
  action: 'merge' | 'skip' | 'update' | 'keep_both'
  primaryIndex: number
  secondaryIndex: number
  mergedData?: Record<string, unknown>
}

/**
 * Advanced duplicate detection and resolution system
 */
export class DuplicateDetector {
  private static readonly SIMILARITY_THRESHOLD = 0.7
  private static readonly HIGH_CONFIDENCE_THRESHOLD = 0.9

  /**
   * Detect duplicates within CSV data
   */
  static detectDuplicates(
    data: Record<string, unknown>[],
    mapping: Record<string, string>,
    existingApplications?: Application[]
  ): DuplicateGroup[] {
    const duplicateGroups: DuplicateGroup[] = []
    const processed = new Set<number>()

    // Create combined dataset for comparison
    const allData = [
      ...data.map((item, index) => ({ index, data: item, isExisting: false })),
      ...(existingApplications || []).map((app, index) => ({ 
        index: data.length + index, 
        data: this.applicationToRowData(app, mapping), 
        isExisting: true 
      }))
    ]

    for (let i = 0; i < allData.length; i++) {
      if (processed.has(i)) continue

      const group: DuplicateGroup = {
        id: `group-${i}`,
        applications: [allData[i]!],
        confidence: 0,
        matchReasons: [],
        suggestedResolution: 'keep_all'
      }

      // Find all similar applications
      for (let j = i + 1; j < allData.length; j++) {
        if (processed.has(j)) continue

        const similarity = this.calculateSimilarity(
          allData[i]!.data,
          allData[j]!.data,
          mapping
        )

        if (similarity.confidence >= this.SIMILARITY_THRESHOLD) {
          group.applications.push(allData[j]!)
          processed.add(j)
          
          // Update group confidence and reasons
          if (similarity.confidence > group.confidence) {
            group.confidence = similarity.confidence
            group.matchReasons = similarity.reasons
          }
        }
      }

      // Only add groups with duplicates
      if (group.applications.length > 1) {
        group.suggestedResolution = this.suggestResolution(group)
        duplicateGroups.push(group)
        processed.add(i)
      }
    }

    return duplicateGroups
  }

  /**
   * Calculate similarity between two applications
   */
  private static calculateSimilarity(
    app1: Record<string, unknown>,
    app2: Record<string, unknown>,
    mapping: Record<string, string>
  ): { confidence: number; reasons: string[] } {
    const reasons: string[] = []
    let totalWeight = 0
    let matchedWeight = 0

    // Company match (high weight)
    const company1 = this.normalizeString(this.getFieldValue(app1, mapping.company))
    const company2 = this.normalizeString(this.getFieldValue(app2, mapping.company))
    totalWeight += 40
    if (company1 && company2) {
      const companySimilarity = this.stringSimilarity(company1, company2)
      if (companySimilarity > 0.8) {
        matchedWeight += 40 * companySimilarity
        reasons.push(`Company match: "${company1}" ≈ "${company2}"`)
      }
    }

    // Position match (high weight)
    const position1 = this.normalizeString(this.getFieldValue(app1, mapping.position))
    const position2 = this.normalizeString(this.getFieldValue(app2, mapping.position))
    totalWeight += 30
    if (position1 && position2) {
      const positionSimilarity = this.stringSimilarity(position1, position2)
      if (positionSimilarity > 0.7) {
        matchedWeight += 30 * positionSimilarity
        reasons.push(`Position match: "${position1}" ≈ "${position2}"`)
      }
    }

    // Location match (medium weight)
    const location1 = this.normalizeString(this.getFieldValue(app1, mapping.location))
    const location2 = this.normalizeString(this.getFieldValue(app2, mapping.location))
    totalWeight += 15
    if (location1 && location2) {
      const locationSimilarity = this.stringSimilarity(location1, location2)
      if (locationSimilarity > 0.8) {
        matchedWeight += 15 * locationSimilarity
        reasons.push(`Location match: "${location1}" ≈ "${location2}"`)
      }
    }

    // Applied date match (medium weight)
    const date1 = this.getFieldValue(app1, mapping.appliedDate)
    const date2 = this.getFieldValue(app2, mapping.appliedDate)
    totalWeight += 10
    if (date1 && date2) {
      const dateDiff = Math.abs(new Date(date1).getTime() - new Date(date2).getTime())
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24)
      if (daysDiff <= 7) { // Within a week
        matchedWeight += 10 * (1 - daysDiff / 7)
        reasons.push(`Applied dates close: ${date1} and ${date2}`)
      }
    }

    // Job URL match (high confidence if exact)
    const url1 = this.normalizeString(this.getFieldValue(app1, mapping.jobUrl))
    const url2 = this.normalizeString(this.getFieldValue(app2, mapping.jobUrl))
    totalWeight += 5
    if (url1 && url2 && url1 === url2) {
      matchedWeight += 5
      reasons.push(`Same job URL: ${url1}`)
    }

    const confidence = totalWeight > 0 ? matchedWeight / totalWeight : 0
    return { confidence, reasons }
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1
    if (str1.length === 0 || str2.length === 0) return 0

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
   * Normalize string for comparison
   */
  private static normalizeString(str: string): string {
    if (!str) return ''
    return str.toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
  }

  /**
   * Get field value from row data
   */
  private static getFieldValue(rowData: Record<string, unknown>, fieldName?: string): string {
    if (!fieldName || !rowData) return ''
    return String(rowData[fieldName] || '').trim()
  }

  /**
   * Convert Application to row data format
   */
  private static applicationToRowData(app: Application, mapping: Record<string, string>): Record<string, unknown> {
    const rowData: Record<string, unknown> = {}
    
    Object.entries(mapping).forEach(([appField, csvColumn]) => {
      const value = (app as any)[appField]
      if (value !== undefined && value !== null) {
        rowData[csvColumn] = value
      }
    })

    return rowData
  }

  /**
   * Suggest resolution strategy for duplicate group
   */
  private static suggestResolution(group: DuplicateGroup): 'merge' | 'skip_duplicates' | 'keep_all' {
    if (group.confidence >= this.HIGH_CONFIDENCE_THRESHOLD) {
      // High confidence duplicates - suggest merge
      return 'merge'
    } else if (group.confidence >= this.SIMILARITY_THRESHOLD) {
      // Medium confidence - suggest skipping duplicates
      return 'skip_duplicates'
    } else {
      // Low confidence - keep all
      return 'keep_all'
    }
  }

  /**
   * Generate merge preview for duplicate applications
   */
  static generateMergePreview(
    applications: Array<{ index: number; data: Record<string, unknown>; isExisting?: boolean }>,
    mapping: Record<string, string>
  ): Record<string, unknown> {
    if (applications.length < 2) return applications[0]?.data

    const merged = { ...applications[0]!.data }

    // Merge strategy: prefer non-empty values, newer dates, more complete data
    applications.slice(1).forEach(app => {
      Object.keys(app.data).forEach(field => {
        const currentValue = merged[field]
        const newValue = app.data[field]

        if (!currentValue && newValue) {
          // Fill empty fields
          merged[field] = newValue
        } else if (currentValue && newValue && currentValue !== newValue) {
          // Handle conflicts based on field type
          const appField = Object.keys(mapping).find(key => mapping[key] === field)
          
          if (appField && this.isDateField(appField)) {
            // For dates, prefer the later date (more recent information)
            const currentDate = new Date(currentValue)
            const newDate = new Date(newValue)
            if (!isNaN(newDate.getTime()) && newDate > currentDate) {
              merged[field] = newValue
            }
          } else if (appField && this.isStatusField(appField)) {
            // For status, prefer more advanced status
            const statusPriority = {
              'pending': 1, 'applied': 2, 'interviewing': 3, 
              'offered': 4, 'accepted': 5, 'rejected': 3, 'withdrawn': 2
            }
            const currentPriority = statusPriority[currentValue.toLowerCase() as keyof typeof statusPriority] || 0
            const newPriority = statusPriority[newValue.toLowerCase() as keyof typeof statusPriority] || 0
            if (newPriority > currentPriority) {
              merged[field] = newValue
            }
          } else if (String(newValue).length > String(currentValue).length) {
            // For text fields, prefer longer/more detailed content
            merged[field] = newValue
          }
        }
      })
    })

    return merged
  }

  /**
   * Check if field is a date field
   */
  private static isDateField(fieldName: string): boolean {
    return fieldName.toLowerCase().includes('date')
  }

  /**
   * Check if field is a status field
   */
  private static isStatusField(fieldName: string): boolean {
    return fieldName.toLowerCase() === 'status'
  }

  /**
   * Apply duplicate resolutions to dataset
   */
  static applyResolutions(
    data: Record<string, unknown>[],
    resolutions: DuplicateResolution[]
  ): { processedData: Record<string, unknown>[]; summary: { merged: number; skipped: number; updated: number } } {
    const processedData = [...data]
    const toRemove = new Set<number>()
    const summary = { merged: 0, skipped: 0, updated: 0 }

    resolutions.forEach(resolution => {
      switch (resolution.action) {
        case 'merge':
          if (resolution.mergedData) {
            processedData[resolution.primaryIndex] = resolution.mergedData
            toRemove.add(resolution.secondaryIndex)
            summary.merged++
          }
          break
        
        case 'skip':
          toRemove.add(resolution.secondaryIndex)
          summary.skipped++
          break
        
        case 'update':
          if (resolution.mergedData) {
            processedData[resolution.primaryIndex] = resolution.mergedData
            summary.updated++
          }
          break
        
        case 'keep_both':
          // No action needed
          break
      }
    })

    // Remove skipped/merged items (in reverse order to maintain indices)
    const sortedIndices = Array.from(toRemove).sort((a, b) => b - a)
    sortedIndices.forEach(index => {
      processedData.splice(index, 1)
    })

    return { processedData, summary }
  }

  /**
   * Generate duplicate detection summary
   */
  static generateSummary(duplicateGroups: DuplicateGroup[]): {
    totalDuplicates: number
    highConfidenceGroups: number
    mediumConfidenceGroups: number
    lowConfidenceGroups: number
    recommendedActions: string[]
  } {
    const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.applications.length - 1, 0)
    const highConfidenceGroups = duplicateGroups.filter(g => g.confidence >= this.HIGH_CONFIDENCE_THRESHOLD).length
    const mediumConfidenceGroups = duplicateGroups.filter(g => 
      g.confidence >= this.SIMILARITY_THRESHOLD && g.confidence < this.HIGH_CONFIDENCE_THRESHOLD
    ).length
    const lowConfidenceGroups = duplicateGroups.filter(g => g.confidence < this.SIMILARITY_THRESHOLD).length

    const recommendedActions: string[] = []

    if (highConfidenceGroups > 0) {
      recommendedActions.push(`${highConfidenceGroups} high-confidence duplicate groups found - recommend merging`)
    }
    if (mediumConfidenceGroups > 0) {
      recommendedActions.push(`${mediumConfidenceGroups} medium-confidence groups found - review before importing`)
    }
    if (lowConfidenceGroups > 0) {
      recommendedActions.push(`${lowConfidenceGroups} low-confidence groups found - likely safe to keep all`)
    }
    if (totalDuplicates === 0) {
      recommendedActions.push('No duplicates detected - safe to proceed with import')
    }

    return {
      totalDuplicates,
      highConfidenceGroups,
      mediumConfidenceGroups,
      lowConfidenceGroups,
      recommendedActions
    }
  }
}