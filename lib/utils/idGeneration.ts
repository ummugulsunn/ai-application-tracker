/**
 * Utility functions for generating deterministic, hydration-safe IDs
 * These functions ensure consistent ID generation across server and client renders
 */

/**
 * Generates a deterministic ID based on input data
 * This ensures the same input always produces the same ID, preventing hydration mismatches
 */
export function generateDeterministicId(data: string[], prefix: string = 'app'): string {
  const dataString = data.filter(Boolean).join('-')
  let hash = 0
  
  // Simple hash function that produces consistent results
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to positive number and encode as base36
  const positiveHash = Math.abs(hash).toString(36)
  return `${prefix}-${positiveHash}`
}

/**
 * Generates a deterministic application ID based on application data
 */
export function generateApplicationId(
  company: string, 
  position: string, 
  location: string, 
  timestamp?: string
): string {
  const data = [
    company || 'unknown',
    position || 'unknown', 
    location || 'unknown',
    timestamp || new Date().toISOString()
  ]
  return generateDeterministicId(data, 'app')
}

/**
 * Generates a deterministic ID for duplicate resolution
 */
export function generateDuplicateId(
  originalId: string,
  index: number
): string {
  return generateDeterministicId([originalId, index.toString()], 'dup')
}

/**
 * Validates that an ID is in the expected format and doesn't contain
 * elements that could cause hydration mismatches
 */
export function validateIdStability(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  
  // Check for patterns that suggest non-deterministic generation
  const hasTimestamp = /\d{13}/.test(id) // 13-digit timestamps
  const hasRandom = /random|Math\.random/.test(id)
  const hasDateNow = /Date\.now/.test(id)
  
  return !hasTimestamp && !hasRandom && !hasDateNow
}

/**
 * Ensures all IDs in a list are unique, generating deterministic fallbacks for duplicates
 */
export function ensureUniqueIds<T extends { id: string }>(
  items: T[],
  getIdData: (item: T, index: number) => string[]
): T[] {
  const seen = new Set<string>()
  
  return items.map((item, index) => {
    let id = item.id
    
    if (!id || seen.has(id)) {
      // Generate deterministic fallback ID
      const idData = getIdData(item, index)
      id = generateDeterministicId(idData, 'fix')
    }
    
    seen.add(id)
    return { ...item, id }
  })
}