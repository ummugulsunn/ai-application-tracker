import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Application, ApplicationStats, FilterOptions, SortOptions } from '../types/application'

interface ApplicationStore {
  applications: Application[]
  filters: FilterOptions
  sortOptions: SortOptions
  searchQuery: string
  isInitialized: boolean
  
  // Actions
  addApplication: (application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateApplication: (id: string, updates: Partial<Application>) => void
  deleteApplication: (id: string) => void
  importApplications: (applications: Application[]) => void
  exportApplications: () => string
  initializeSampleData: () => void
  cleanupInvalidData: () => void
  
  // Filters and search
  setFilters: (filters: Partial<FilterOptions>) => void
  setSortOptions: (sortOptions: SortOptions) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
  
  // Computed values
  getFilteredApplications: () => Application[]
  getStats: () => ApplicationStats
}

const defaultFilters: FilterOptions = {
  status: [],
  type: [],
  location: [],
  priority: [],
  tags: [],
  dateRange: { start: null, end: null }
}

const defaultSortOptions: SortOptions = {
  field: 'appliedDate',
  direction: 'desc'
}

// Pre-defined sample data with stable IDs
const sampleData: Application[] = [
  {
    id: 'sample-spotify-001',
    company: 'Spotify',
    position: 'Software Engineer Intern',
    location: 'Stockholm, Sweden',
    type: 'Internship',
    salary: '15,000 SEK/month',
    status: 'Applied',
    appliedDate: '2024-01-15',
    responseDate: null,
    interviewDate: null,
    notes: 'Applied through LinkedIn. Position focuses on backend development.',
    contactPerson: 'Sarah Johnson',
    contactEmail: 'careers@spotify.com',
    website: 'https://spotify.com/careers',
    tags: ['Backend', 'Music', 'Sweden'],
    priority: 'High',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'sample-klarna-002',
    company: 'Klarna',
    position: 'Data Science Intern',
    location: 'Stockholm, Sweden',
    type: 'Internship',
    salary: '14,000 SEK/month',
    status: 'Interviewing',
    appliedDate: '2024-01-10',
    responseDate: '2024-01-20',
    interviewDate: '2024-02-05',
    notes: 'First round interview scheduled. Technical assessment completed.',
    contactPerson: 'Marcus Andersson',
    contactEmail: 'internships@klarna.com',
    website: 'https://klarna.com/careers',
    tags: ['Data Science', 'Fintech', 'Sweden'],
    priority: 'High',
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z'
  },
  {
    id: 'sample-ericsson-003',
    company: 'Ericsson',
    position: 'Network Engineering Intern',
    location: 'Gothenburg, Sweden',
    type: 'Internship',
    salary: '12,000 SEK/month',
    status: 'Pending',
    appliedDate: '2024-01-20',
    responseDate: null,
    interviewDate: null,
    notes: 'Application submitted. Waiting for response.',
    contactPerson: 'Elena Petrova',
    contactEmail: 'career@ericsson.com',
    website: 'https://ericsson.com/careers',
    tags: ['Networking', 'Telecom', 'Sweden'],
    priority: 'Medium',
    createdAt: '2024-01-20T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z'
  }
]

// Generate unique ID for new applications
let idCounter = 0
const generateUniqueId = (): string => {
  idCounter++
  const random = Math.random().toString(36).substr(2, 9)
  return `app_${idCounter}_${random}`
}

// Helper function to validate and clean dates
const validateAndCleanDate = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
  } catch {
    return null
  }
}

// Helper function to clean application data
const cleanApplicationData = (app: any): Application => {
  return {
    ...app,
    appliedDate: validateAndCleanDate(app.appliedDate) || new Date().toISOString().split('T')[0],
    responseDate: validateAndCleanDate(app.responseDate),
    interviewDate: validateAndCleanDate(app.interviewDate),
    createdAt: validateAndCleanDate(app.createdAt) || new Date().toISOString(),
    updatedAt: validateAndCleanDate(app.updatedAt) || new Date().toISOString()
  }
}

export const useApplicationStore = create<ApplicationStore>()(
  persist(
    (set, get) => ({
      applications: [],
      filters: defaultFilters,
      sortOptions: defaultSortOptions,
      searchQuery: '',
      isInitialized: false,

      initializeSampleData: () => {
        const { applications, isInitialized } = get()
        if (!isInitialized && applications.length === 0) {
          // Clean sample data before setting
          const cleanedSampleData = sampleData.map(cleanApplicationData)
          set({ applications: cleanedSampleData, isInitialized: true })
        } else if (isInitialized && applications.length > 0) {
          // Clean existing applications to fix any invalid dates
          const cleanedApplications = applications.map(cleanApplicationData)
          set({ applications: cleanedApplications })
        }
      },

      addApplication: (applicationData) => {
        const now = new Date().toISOString()
        let newId: string
        let attempts = 0
        
        // Ensure unique ID (max 10 attempts to prevent infinite loop)
        do {
          newId = generateUniqueId()
          attempts++
        } while (
          attempts < 10 && 
          get().applications.some(app => app.id === newId)
        )
        
        const newApplication: Application = {
          ...applicationData,
          id: newId,
          createdAt: now,
          updatedAt: now
        }
        
        // Clean the application data before adding
        const cleanedApplication = cleanApplicationData(newApplication)
        
        set((state) => ({
          applications: [...state.applications, cleanedApplication]
        }))
      },

      updateApplication: (id, updates) => {
        set((state) => ({
          applications: state.applications.map(app =>
            app.id === id
              ? cleanApplicationData({ ...app, ...updates, updatedAt: new Date().toISOString() })
              : app
          )
        }))
      },

      deleteApplication: (id) => {
        set((state) => ({
          applications: state.applications.filter(app => app.id !== id)
        }))
      },

      importApplications: (newApplications) => {
        const now = new Date().toISOString()
        const processedApplications = newApplications.map(app => {
          let newId = String(app.id || '')
          let attempts = 0
          
          // Ensure string ID and uniqueness
          if (!newId) newId = generateUniqueId()
          if (!newId.startsWith('app_') && /^\d+$/.test(newId)) {
            newId = `app_${newId}`
          }
          while (
            attempts < 10 && 
            get().applications.some(existing => existing.id === newId)
          ) {
            newId = generateUniqueId()
            attempts++
          }
          
          // Clean the application data before adding
          const cleanedApp = cleanApplicationData({
            ...app,
            id: newId,
            createdAt: app.createdAt || now,
            updatedAt: now
          })
          
          return cleanedApp
        })
        
        set((state) => ({
          applications: [...state.applications, ...processedApplications]
        }))
      },

      exportApplications: () => {
        const { applications } = get()
        const headers = [
          'Company', 'Position', 'Location', 'Type', 'Salary', 'Status',
          'Applied Date', 'Response Date', 'Interview Date', 'Notes',
          'Contact Person', 'Contact Email', 'Website', 'Tags', 'Priority'
        ]
        
        const csvData = applications.map(app => [
          app.company,
          app.position,
          app.location,
          app.type,
          app.salary,
          app.status,
          app.appliedDate,
          app.responseDate || '',
          app.interviewDate || '',
          app.notes,
          app.contactPerson,
          app.contactEmail,
          app.website,
          app.tags.join(';'),
          app.priority
        ])
        
        const csvContent = [headers, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n')
        
        return csvContent
      },

      cleanupInvalidData: () => {
        set((state) => ({
          applications: state.applications.map(cleanApplicationData)
        }))
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }))
      },

      setSortOptions: (sortOptions) => {
        set({ sortOptions })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      clearFilters: () => {
        set({ filters: defaultFilters, searchQuery: '' })
      },

      getFilteredApplications: () => {
        const { applications, filters, searchQuery, sortOptions } = get()
        
        let filtered = applications

        // Apply search
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(app =>
            app.company.toLowerCase().includes(query) ||
            app.position.toLowerCase().includes(query) ||
            app.location.toLowerCase().includes(query) ||
            app.notes.toLowerCase().includes(query) ||
            app.tags.some(tag => tag.toLowerCase().includes(query))
          )
        }

        // Apply filters
        if (filters.status.length > 0) {
          filtered = filtered.filter(app => filters.status.includes(app.status))
        }
        if (filters.type.length > 0) {
          filtered = filtered.filter(app => filters.type.includes(app.type))
        }
        if (filters.location.length > 0) {
          filtered = filtered.filter(app => filters.location.includes(app.location))
        }
        if (filters.priority.length > 0) {
          filtered = filtered.filter(app => filters.priority.includes(app.priority))
        }
        if (filters.tags.length > 0) {
          filtered = filtered.filter(app =>
            app.tags.some(tag => filters.tags.includes(tag))
          )
        }
        if (filters.dateRange.start || filters.dateRange.end) {
          filtered = filtered.filter(app => {
            if (!app.appliedDate) return true // Skip apps without applied date
            const appliedDate = new Date(app.appliedDate)
            if (isNaN(appliedDate.getTime())) return true // Skip invalid dates
            const start = filters.dateRange.start ? new Date(filters.dateRange.start) : null
            const end = filters.dateRange.end ? new Date(filters.dateRange.end) : null
            
            if (start && appliedDate < start) return false
            if (end && appliedDate > end) return false
            return true
          })
        }

        // Apply sorting
        filtered.sort((a, b) => {
          const aValue = a[sortOptions.field]
          const bValue = b[sortOptions.field]
          
          // Handle null/undefined values
          if (aValue == null && bValue == null) return 0
          if (aValue == null) return 1
          if (bValue == null) return -1
          
          if (aValue < bValue) return sortOptions.direction === 'asc' ? -1 : 1
          if (aValue > bValue) return sortOptions.direction === 'asc' ? 1 : -1
          return 0
        })

        return filtered
      },

      getStats: () => {
        const { applications } = get()
        
        const stats = applications.reduce((acc, app) => {
          acc.total++
          acc[app.status.toLowerCase() as keyof ApplicationStats]++
          return acc
        }, {
          total: 0,
          pending: 0,
          applied: 0,
          interviewing: 0,
          offered: 0,
          rejected: 0,
          accepted: 0,
          successRate: 0,
          averageResponseTime: 0,
          topCompanies: [] as string[],
          topLocations: [] as string[]
        } as ApplicationStats)

        // Calculate success rate
        if (stats.applied > 0) {
          stats.successRate = Math.round((stats.accepted / stats.applied) * 100)
        }

        // Calculate average response time
        const responseTimes = applications
          .filter(app => app.responseDate && app.appliedDate)
          .map(app => {
            const applied = new Date(app.appliedDate!)
            const response = new Date(app.responseDate!)
            
            // Validate dates before calculation
            if (isNaN(applied.getTime()) || isNaN(response.getTime())) {
              return null
            }
            
            return (response.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)
          })
          .filter(time => time !== null) as number[]
        
        if (responseTimes.length > 0) {
          stats.averageResponseTime = Math.round(
            responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          )
        }

        // Get top companies and locations
        const companyCounts = applications.reduce((acc, app) => {
          acc[app.company] = (acc[app.company] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const locationCounts = applications.reduce((acc, app) => {
          acc[app.location] = (acc[app.location] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        stats.topCompanies = Object.entries(companyCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([company]) => company)

        stats.topLocations = Object.entries(locationCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([location]) => location)

        return stats
      }
    }),
    {
      name: 'application-store',
      version: 2,
      migrate: (persisted: any, version: number) => {
        // Sanitize IDs and remove duplicates
        const state = persisted || {}
        const apps: Application[] = Array.isArray(state.applications) ? state.applications : []
        const seen = new Set<string>()
        const fixed: Application[] = []
        for (const app of apps) {
          let id = String(app.id ?? '')
          if (!id) id = generateUniqueId()
          if (!id.startsWith('app_') && /^\d+$/.test(id)) {
            id = `app_${id}`
          }
          let attempts = 0
          while (attempts < 10 && seen.has(id)) {
            id = generateUniqueId()
            attempts++
          }
          seen.add(id)
          fixed.push({ ...app, id })
        }
        return { ...state, applications: fixed }
      },
      partialize: (state) => ({ 
        applications: state.applications,
        isInitialized: state.isInitialized
      })
    }
  )
)
