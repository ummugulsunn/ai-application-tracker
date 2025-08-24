import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Application, ApplicationStats, FilterOptions, SortOptions } from '@/types/application'

interface ApplicationStore {
  applications: Application[]
  filters: FilterOptions
  sortOptions: SortOptions
  searchQuery: string
  
  // Actions
  addApplication: (application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateApplication: (id: string, updates: Partial<Application>) => void
  deleteApplication: (id: string) => void
  importApplications: (applications: Application[]) => void
  exportApplications: () => string
  
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

export const useApplicationStore = create<ApplicationStore>()(
  persist(
    (set, get) => ({
      applications: [],
      filters: defaultFilters,
      sortOptions: defaultSortOptions,
      searchQuery: '',

      addApplication: (applicationData) => {
        const now = new Date().toISOString()
        const newApplication: Application = {
          ...applicationData,
          id: Date.now().toString(),
          createdAt: now,
          updatedAt: now
        }
        
        set((state) => ({
          applications: [...state.applications, newApplication]
        }))
      },

      updateApplication: (id, updates) => {
        set((state) => ({
          applications: state.applications.map(app =>
            app.id === id
              ? { ...app, ...updates, updatedAt: new Date().toISOString() }
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
        const processedApplications = newApplications.map(app => ({
          ...app,
          id: app.id || Date.now().toString(),
          createdAt: app.createdAt || now,
          updatedAt: now
        }))
        
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
            const appliedDate = new Date(app.appliedDate)
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
            return (response.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)
          })
        
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
      partialize: (state) => ({ applications: state.applications })
    }
  )
)
