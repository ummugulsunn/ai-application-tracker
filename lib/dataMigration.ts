import { Application } from '@/types/application'
import { useApplicationStore } from '@/store/applicationStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { AuthUser } from '@/types/auth'

export interface MigrationResult {
  success: boolean
  migratedApplications: number
  migratedOnboardingData: boolean
  errors: string[]
}

export interface GuestData {
  applications: Application[]
  onboardingProgress: any
  preferences: any
}

/**
 * Extract all guest data from local storage
 */
export const extractGuestData = (): GuestData | null => {
  try {
    const applicationStoreData = localStorage.getItem('application-store')
    const onboardingStoreData = localStorage.getItem('onboarding-store')
    
    let applications: Application[] = []
    let onboardingProgress: any = null
    let preferences: any = null
    
    // Extract application data
    if (applicationStoreData) {
      const parsed = JSON.parse(applicationStoreData)
      applications = parsed?.state?.applications || []
    }
    
    // Extract onboarding data
    if (onboardingStoreData) {
      const parsed = JSON.parse(onboardingStoreData)
      onboardingProgress = parsed?.state || null
    }
    
    // Only return data if there's meaningful content
    if (applications.length > 0 || onboardingProgress) {
      return {
        applications,
        onboardingProgress,
        preferences
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to extract guest data:', error)
    return null
  }
}

/**
 * Migrate guest data to registered user account
 */
export const migrateGuestDataToUser = async (
  user: AuthUser,
  guestData?: GuestData
): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: false,
    migratedApplications: 0,
    migratedOnboardingData: false,
    errors: []
  }
  
  try {
    // Extract guest data if not provided
    const dataToMigrate = guestData || extractGuestData()
    
    if (!dataToMigrate) {
      result.success = true // No data to migrate is still success
      return result
    }
    
    // Migrate applications to database
    if (dataToMigrate.applications.length > 0) {
      try {
        const response = await fetch('/api/applications/migrate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applications: dataToMigrate.applications,
            userId: user.id
          })
        })
        
        if (response.ok) {
          const migrationResult = await response.json()
          result.migratedApplications = migrationResult.data?.migratedCount || dataToMigrate.applications.length
        } else {
          const error = await response.json()
          result.errors.push(`Failed to migrate applications: ${error.error?.message || 'Unknown error'}`)
        }
      } catch (error) {
        result.errors.push(`Application migration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Migrate onboarding progress
    if (dataToMigrate.onboardingProgress) {
      try {
        const response = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            progress: dataToMigrate.onboardingProgress,
            userId: user.id
          })
        })
        
        if (response.ok) {
          result.migratedOnboardingData = true
        } else {
          const error = await response.json()
          result.errors.push(`Failed to migrate onboarding data: ${error.error?.message || 'Unknown error'}`)
        }
      } catch (error) {
        result.errors.push(`Onboarding migration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Consider migration successful if no critical errors occurred
    result.success = result.errors.length === 0 || (result.migratedApplications > 0 || result.migratedOnboardingData)
    
    return result
  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Sync local data with server after migration
 */
export const syncAfterMigration = async (user: AuthUser): Promise<void> => {
  try {
    // Fetch updated applications from server
    const response = await fetch('/api/applications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (response.ok) {
      const { data: applications } = await response.json()
      
      // Update local store with server data
      const applicationStore = useApplicationStore.getState()
      applicationStore.importApplications(applications)
      
      console.log(`Synced ${applications.length} applications from server`)
    }
  } catch (error) {
    console.error('Failed to sync after migration:', error)
  }
}

/**
 * Clear guest data after successful migration
 */
export const clearGuestDataAfterMigration = (): void => {
  try {
    // Clear application store
    localStorage.removeItem('application-store')
    
    // Clear onboarding store
    localStorage.removeItem('onboarding-store')
    
    // Clear any other guest-specific data
    localStorage.removeItem('guest-preferences')
    
    console.log('Guest data cleared after migration')
  } catch (error) {
    console.error('Failed to clear guest data after migration:', error)
  }
}

/**
 * Complete migration workflow
 */
export const performCompleteMigration = async (user: AuthUser): Promise<MigrationResult> => {
  // Extract guest data first
  const guestData = extractGuestData()
  
  if (!guestData) {
    return {
      success: true,
      migratedApplications: 0,
      migratedOnboardingData: false,
      errors: []
    }
  }
  
  // Perform migration
  const migrationResult = await migrateGuestDataToUser(user, guestData)
  
  if (migrationResult.success) {
    // Sync with server
    await syncAfterMigration(user)
    
    // Clear guest data
    clearGuestDataAfterMigration()
    
    console.log('Complete migration workflow finished successfully', migrationResult)
  } else {
    console.error('Migration failed', migrationResult)
  }
  
  return migrationResult
}

/**
 * Check if user has guest data that needs migration
 */
export const hasDataToMigrate = (): boolean => {
  const guestData = extractGuestData()
  return guestData !== null && (
    guestData.applications.length > 0 || 
    guestData.onboardingProgress !== null
  )
}

/**
 * Get migration preview for user confirmation
 */
export const getMigrationPreview = (): {
  applicationCount: number
  hasOnboardingData: boolean
  estimatedDataSize: string
} => {
  const guestData = extractGuestData()
  
  if (!guestData) {
    return {
      applicationCount: 0,
      hasOnboardingData: false,
      estimatedDataSize: '0 KB'
    }
  }
  
  // Estimate data size
  const dataString = JSON.stringify(guestData)
  const sizeInBytes = new Blob([dataString]).size
  const sizeInKB = Math.round(sizeInBytes / 1024)
  
  return {
    applicationCount: guestData.applications.length,
    hasOnboardingData: !!guestData.onboardingProgress,
    estimatedDataSize: sizeInKB > 0 ? `${sizeInKB} KB` : '< 1 KB'
  }
}