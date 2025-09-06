import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthUser, UserProfile } from '@/types/auth'

interface AuthStore {
  // Authentication state
  user: AuthUser | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
  
  // Guest mode state
  guestId: string | null
  hasGuestData: boolean
  
  // Session management
  rememberMe: boolean
  sessionExpiry: Date | null
  
  // Actions
  setUser: (user: AuthUser | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setGuestMode: (guestId: string) => void
  setRememberMe: (remember: boolean) => void
  updateSessionExpiry: () => void
  
  // Authentication actions
  login: (user: AuthUser, profile?: UserProfile, rememberMe?: boolean) => void
  logout: () => void
  switchToRegistered: (user: AuthUser, profile: UserProfile) => void
  
  // Guest data management
  checkGuestData: () => boolean
  clearGuestData: () => void
  
  // Utility methods
  isSessionValid: () => boolean
  shouldPromptRegistration: () => boolean
}

const GUEST_ID_KEY = 'guest-user-id'
const SESSION_DURATION_HOURS = 24
const REMEMBER_ME_DURATION_DAYS = 30

// Generate a unique guest ID
const generateGuestId = (): string => {
  return `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Check if there's existing guest data in localStorage
const checkExistingGuestData = (): boolean => {
  try {
    const applicationStore = localStorage.getItem('application-store')
    if (applicationStore) {
      const parsed = JSON.parse(applicationStore)
      return parsed?.state?.applications?.length > 0
    }
    return false
  } catch {
    return false
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      guestId: null,
      hasGuestData: false,
      rememberMe: false,
      sessionExpiry: null,

      // Basic setters
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isGuest: false 
        })
      },

      setProfile: (profile) => {
        set({ profile })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setGuestMode: (guestId) => {
        set({ 
          guestId,
          isGuest: true,
          isAuthenticated: false,
          user: null,
          profile: null,
          hasGuestData: checkExistingGuestData()
        })
      },

      setRememberMe: (remember) => {
        set({ rememberMe: remember })
        get().updateSessionExpiry()
      },

      updateSessionExpiry: () => {
        const { rememberMe } = get()
        const now = new Date()
        const expiry = new Date(now)
        
        if (rememberMe) {
          expiry.setDate(now.getDate() + REMEMBER_ME_DURATION_DAYS)
        } else {
          expiry.setHours(now.getHours() + SESSION_DURATION_HOURS)
        }
        
        set({ sessionExpiry: expiry })
      },

      // Authentication actions
      login: (user, profile, rememberMe = false) => {
        set({ 
          user,
          profile,
          isAuthenticated: true,
          isGuest: false,
          guestId: null,
          rememberMe,
          isLoading: false
        })
        
        // Update session expiry
        get().updateSessionExpiry()
        
        // Initialize user preferences if authenticated
        if (profile?.preferences) {
          // Load preferences into preferences store
          import('@/store/preferencesStore').then(({ usePreferencesStore }) => {
            usePreferencesStore.getState().setPreferences(profile.preferences!)
          })
        }
        
        // Clear guest data after successful login
        if (get().hasGuestData) {
          // Note: We don't clear immediately - migration happens first
          console.log('User logged in with existing guest data - migration needed')
        }
      },

      logout: () => {
        set({ 
          user: null,
          profile: null,
          isAuthenticated: false,
          isGuest: false,
          guestId: null,
          rememberMe: false,
          sessionExpiry: null,
          isLoading: false
        })
        
        // Clear any stored session data
        try {
          localStorage.removeItem('nextauth.session-token')
          localStorage.removeItem('__Secure-next-auth.session-token')
        } catch (error) {
          console.warn('Failed to clear session tokens:', error)
        }
      },

      switchToRegistered: (user, profile) => {
        const { guestId, hasGuestData } = get()
        
        set({ 
          user,
          profile,
          isAuthenticated: true,
          isGuest: false,
          guestId: null,
          hasGuestData: false,
          isLoading: false
        })
        
        // Update session expiry
        get().updateSessionExpiry()
        
        console.log(`Switched from guest (${guestId}) to registered user (${user.id})`)
        
        if (hasGuestData) {
          console.log('Guest data migration completed')
        }
      },

      // Guest data management
      checkGuestData: () => {
        const hasData = checkExistingGuestData()
        set({ hasGuestData: hasData })
        return hasData
      },

      clearGuestData: () => {
        try {
          // Clear application store data
          localStorage.removeItem('application-store')
          
          // Clear onboarding store data
          localStorage.removeItem('onboarding-store')
          
          set({ hasGuestData: false })
          
          console.log('Guest data cleared')
        } catch (error) {
          console.error('Failed to clear guest data:', error)
        }
      },

      // Utility methods
      isSessionValid: () => {
        const { sessionExpiry, isAuthenticated } = get()
        
        if (!isAuthenticated || !sessionExpiry) {
          return false
        }
        
        return new Date() < sessionExpiry
      },

      shouldPromptRegistration: () => {
        const { isGuest, hasGuestData } = get()
        
        // Prompt registration if user is in guest mode and has meaningful data
        return isGuest && hasGuestData
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        guestId: state.guestId,
        hasGuestData: state.hasGuestData,
        rememberMe: state.rememberMe,
        sessionExpiry: state.sessionExpiry
      })
    }
  )
)

// Initialize guest mode if no user is authenticated
export const initializeAuthState = () => {
  const store = useAuthStore.getState()
  
  // If no user is authenticated and not in guest mode, set up guest mode
  if (!store.isAuthenticated && !store.isGuest) {
    let guestId = store.guestId
    
    // Generate new guest ID if none exists
    if (!guestId) {
      guestId = generateGuestId()
    }
    
    store.setGuestMode(guestId)
    store.checkGuestData()
    
    console.log(`Initialized guest mode with ID: ${guestId}`)
  }
  
  // Check if session is still valid for authenticated users
  if (store.isAuthenticated && !store.isSessionValid()) {
    console.log('Session expired, logging out')
    store.logout()
  }
}