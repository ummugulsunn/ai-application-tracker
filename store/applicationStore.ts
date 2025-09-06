import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Application, ApplicationStats, FilterOptions, SortOptions, AIInsights } from '@/types/application'
import { generateApplicationId, ensureUniqueIds } from '@/lib/utils/idGeneration'

interface ApplicationStore {
  applications: Application[]
  filters: FilterOptions
  sortOptions: SortOptions
  searchQuery: string
  isLoading: boolean
  syncStatus: 'idle' | 'syncing' | 'error'
  
  // Actions
  addApplication: (application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateApplication: (id: string, updates: Partial<Application>) => void
  deleteApplication: (id: string) => void
  deleteApplications: (ids: string[]) => void
  importApplications: (applications: Application[]) => void
  exportApplications: () => string
  
  // AI Enhancement actions
  updateAIInsights: (id: string, insights: AIInsights) => void
  bulkUpdateAIInsights: (updates: { id: string; insights: AIInsights }[]) => void
  getApplicationsForAIAnalysis: () => Application[]
  
  // Database persistence actions
  syncToDatabase: () => Promise<void>
  syncFromDatabase: () => Promise<void>
  setLoading: (loading: boolean) => void
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void
  
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
      isLoading: false,
      syncStatus: 'idle',

      addApplication: (applicationData) => {
        const now = new Date().toISOString()
        const newApplication: Application = {
          ...applicationData,
          id: generateApplicationId(
            applicationData.company,
            applicationData.position,
            applicationData.location,
            now
          ),
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

      deleteApplications: (ids) => {
        if (!Array.isArray(ids) || ids.length === 0) return
        set((state) => ({
          applications: state.applications.filter(app => !ids.includes(app.id))
        }))
      },

      importApplications: (newApplications) => {
        const now = new Date().toISOString()
        const processedApplications = newApplications.map((app, index) => {
          const safeId = app.id && String(app.id).trim().length > 0
            ? String(app.id)
            : generateApplicationId(
                app.company || 'unknown',
                app.position || 'unknown',
                app.location || 'unknown',
                `import-${index}`
              )
          
          return {
            ...app,
            id: safeId,
            createdAt: app.createdAt || now,
            updatedAt: now,
            // Ensure AI fields are properly initialized
            requirements: app.requirements || [],
            aiMatchScore: app.aiMatchScore || undefined,
            aiInsights: app.aiInsights || undefined,
            followUpDate: app.followUpDate || undefined,
            offerDate: app.offerDate || null,
            rejectionDate: app.rejectionDate || null,
            jobDescription: app.jobDescription || '',
            contactPhone: app.contactPhone || '',
            companyWebsite: app.companyWebsite || '',
            jobUrl: app.jobUrl || ''
          }
        })
        
        set((state) => ({
          applications: [...state.applications, ...processedApplications]
        }))

        // Ensure uniqueness after import using utility function
        const current = get().applications
        const uniqueApplications = ensureUniqueIds(current, (app, index) => [
          app.company || 'unknown',
          app.position || 'unknown', 
          app.location || 'unknown',
          index.toString()
        ])
        
        if (uniqueApplications.length !== current.length || 
            uniqueApplications.some((app, i) => app.id !== current[i]?.id)) {
          set({ applications: uniqueApplications })
        }
      },

      exportApplications: () => {
        const { applications } = get()
        const headers = [
          'Company', 'Position', 'Location', 'Type', 'Salary', 'Status',
          'Applied Date', 'Response Date', 'Interview Date', 'Notes',
          'Contact Person', 'Contact Email', 'Website', 'Tags', 'Priority',
          'Job Description', 'Requirements', 'AI Match Score', 'Follow Up Date',
          'Offer Date', 'Rejection Date', 'Job URL', 'Company Website'
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
          app.priority,
          app.jobDescription || '',
          app.requirements?.join(';') || '',
          app.aiMatchScore?.toString() || '',
          app.followUpDate || '',
          app.offerDate || '',
          app.rejectionDate || '',
          app.jobUrl || '',
          app.companyWebsite || ''
        ])
        
        const csvContent = [headers, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n')
        
        return csvContent
      },

      // AI Enhancement methods
      updateAIInsights: (id, insights) => {
        set((state) => ({
          applications: state.applications.map(app =>
            app.id === id
              ? { 
                  ...app, 
                  aiInsights: insights,
                  aiMatchScore: insights.successProbability,
                  updatedAt: new Date().toISOString() 
                }
              : app
          )
        }))
      },

      bulkUpdateAIInsights: (updates) => {
        set((state) => ({
          applications: state.applications.map(app => {
            const update = updates.find(u => u.id === app.id)
            if (update) {
              return {
                ...app,
                aiInsights: update.insights,
                aiMatchScore: update.insights.successProbability,
                updatedAt: new Date().toISOString()
              }
            }
            return app
          })
        }))
      },

      getApplicationsForAIAnalysis: () => {
        const { applications } = get()
        // Return applications that don't have AI insights or have outdated insights (older than 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        return applications.filter(app => 
          !app.aiInsights || 
          new Date(app.aiInsights.analysisDate) < sevenDaysAgo
        )
      },

      // Database persistence methods
      syncToDatabase: async () => {
        const { applications } = get()
        set({ syncStatus: 'syncing' })
        
        try {
          // This will be implemented when authentication is ready
          // For now, we'll just simulate the sync
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // TODO: Implement actual API call to sync applications to database
          // const response = await fetch('/api/applications/sync', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ applications })
          // })
          
          set({ syncStatus: 'idle' })
        } catch (error) {
          console.error('Failed to sync to database:', error)
          set({ syncStatus: 'error' })
        }
      },

      syncFromDatabase: async () => {
        set({ isLoading: true, syncStatus: 'syncing' })
        
        try {
          // This will be implemented when authentication is ready
          // For now, we'll just simulate the sync
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // TODO: Implement actual API call to fetch applications from database
          // const response = await fetch('/api/applications')
          // const { applications } = await response.json()
          // set({ applications })
          
          set({ isLoading: false, syncStatus: 'idle' })
        } catch (error) {
          console.error('Failed to sync from database:', error)
          set({ isLoading: false, syncStatus: 'error' })
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setSyncStatus: (status) => {
        set({ syncStatus: status })
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
        // One-time fix: ensure there are no duplicate IDs from older data
        const current = get().applications
        const uniqueApplications = ensureUniqueIds(current, (app, index) => [
          app.company || 'unknown',
          app.position || 'unknown',
          app.location || 'unknown', 
          index.toString()
        ])
        
        if (uniqueApplications.length !== current.length || 
            uniqueApplications.some((app, i) => app.id !== current[i]?.id)) {
          set({ applications: uniqueApplications })
        }

        const { applications, filters, searchQuery, sortOptions } = get()
        
        let filtered = applications

        // Apply search (enhanced with AI fields)
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(app =>
            app.company.toLowerCase().includes(query) ||
            app.position.toLowerCase().includes(query) ||
            app.location.toLowerCase().includes(query) ||
            app.notes.toLowerCase().includes(query) ||
            app.tags.some(tag => tag.toLowerCase().includes(query)) ||
            app.jobDescription?.toLowerCase().includes(query) ||
            app.requirements?.some(req => req.toLowerCase().includes(query)) ||
            app.contactPerson.toLowerCase().includes(query) ||
            app.aiInsights?.matchReasons.some(reason => reason.toLowerCase().includes(query))
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
          
          // Handle null/undefined values
          if ((aValue === null || aValue === undefined) && (bValue === null || bValue === undefined)) return 0
          if (aValue === null || aValue === undefined) return sortOptions.direction === 'asc' ? 1 : -1
          if (bValue === null || bValue === undefined) return sortOptions.direction === 'asc' ? -1 : 1
          
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
          topLocations: [] as string[],
          averageMatchScore: 0,
          aiAnalyzedCount: 0,
          highPotentialCount: 0,
          improvementOpportunities: 0
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

        // AI Enhancement stats
        const applicationsWithAI = applications.filter(app => app.aiInsights)
        stats.aiAnalyzedCount = applicationsWithAI.length

        if (applicationsWithAI.length > 0) {
          const matchScores = applicationsWithAI
            .filter(app => app.aiMatchScore !== undefined)
            .map(app => app.aiMatchScore!)
          
          if (matchScores.length > 0) {
            stats.averageMatchScore = Math.round(
              matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length
            )
          }

          stats.highPotentialCount = applicationsWithAI.filter(
            app => app.aiInsights!.successProbability >= 70
          ).length

          stats.improvementOpportunities = applicationsWithAI.filter(
            app => app.aiInsights!.improvementSuggestions.length > 0
          ).length
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
      partialize: (state) => ({ 
        applications: state.applications,
        filters: state.filters,
        sortOptions: state.sortOptions
      })
    }
  )
)
