import { useState, useEffect, useCallback } from 'react'
import { useApplicationStore } from '@/store/applicationStore'

interface SmartSuggestionsHook {
  companySuggestions: string[]
  positionSuggestions: string[]
  locationSuggestions: string[]
  addCompanySuggestion: (company: string) => void
  addPositionSuggestion: (position: string) => void
  addLocationSuggestion: (location: string) => void
  getCompanySuggestions: (query: string) => Promise<string[]>
  getPositionSuggestions: (query: string) => Promise<string[]>
  getLocationSuggestions: (query: string) => Promise<string[]>
}

export function useSmartSuggestions(): SmartSuggestionsHook {
  const { applications } = useApplicationStore()
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([])
  const [positionSuggestions, setPositionSuggestions] = useState<string[]>([])
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])

  // Extract unique values from existing applications
  useEffect(() => {
    const companies = [...new Set(applications.map(app => app.company).filter(Boolean))]
    const positions = [...new Set(applications.map(app => app.position).filter(Boolean))]
    const locations = [...new Set(applications.map(app => app.location).filter(Boolean))]

    setCompanySuggestions(companies)
    setPositionSuggestions(positions)
    setLocationSuggestions(locations)
  }, [applications])

  // Add new suggestions to cache
  const addCompanySuggestion = useCallback(async (company: string) => {
    if (!company.trim()) return
    
    try {
      await fetch('/api/suggestions/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: company.trim() })
      })
      
      setCompanySuggestions(prev => {
        const newSuggestions = [...new Set([...prev, company.trim()])]
        return newSuggestions.sort()
      })
    } catch (error) {
      console.error('Error adding company suggestion:', error)
    }
  }, [])

  const addPositionSuggestion = useCallback(async (position: string) => {
    if (!position.trim()) return
    
    try {
      await fetch('/api/suggestions/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: position.trim() })
      })
      
      setPositionSuggestions(prev => {
        const newSuggestions = [...new Set([...prev, position.trim()])]
        return newSuggestions.sort()
      })
    } catch (error) {
      console.error('Error adding position suggestion:', error)
    }
  }, [])

  const addLocationSuggestion = useCallback(async (location: string) => {
    if (!location.trim()) return
    
    try {
      await fetch('/api/suggestions/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: location.trim() })
      })
      
      setLocationSuggestions(prev => {
        const newSuggestions = [...new Set([...prev, location.trim()])]
        return newSuggestions.sort()
      })
    } catch (error) {
      console.error('Error adding location suggestion:', error)
    }
  }, [])

  // Fetch suggestions from API
  const getCompanySuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (!query.trim()) return companySuggestions.slice(0, 10)
    
    try {
      const response = await fetch(`/api/suggestions/companies?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      
      if (data.success) {
        // Combine API suggestions with local suggestions
        const localMatches = companySuggestions.filter(company => 
          company.toLowerCase().includes(query.toLowerCase())
        )
        
        const combined = [...new Set([...data.data, ...localMatches])]
        return combined.slice(0, 10)
      }
      
      return companySuggestions.filter(company => 
        company.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    } catch (error) {
      console.error('Error fetching company suggestions:', error)
      return companySuggestions.filter(company => 
        company.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    }
  }, [companySuggestions])

  const getPositionSuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (!query.trim()) return positionSuggestions.slice(0, 10)
    
    try {
      const response = await fetch(`/api/suggestions/positions?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      
      if (data.success) {
        // Combine API suggestions with local suggestions
        const localMatches = positionSuggestions.filter(position => 
          position.toLowerCase().includes(query.toLowerCase())
        )
        
        const combined = [...new Set([...data.data, ...localMatches])]
        return combined.slice(0, 10)
      }
      
      return positionSuggestions.filter(position => 
        position.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    } catch (error) {
      console.error('Error fetching position suggestions:', error)
      return positionSuggestions.filter(position => 
        position.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    }
  }, [positionSuggestions])

  const getLocationSuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (!query.trim()) return locationSuggestions.slice(0, 10)
    
    try {
      const response = await fetch(`/api/suggestions/locations?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      
      if (data.success) {
        // Combine API suggestions with local suggestions
        const localMatches = locationSuggestions.filter(location => 
          location.toLowerCase().includes(query.toLowerCase())
        )
        
        const combined = [...new Set([...data.data, ...localMatches])]
        return combined.slice(0, 10)
      }
      
      return locationSuggestions.filter(location => 
        location.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
      return locationSuggestions.filter(location => 
        location.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    }
  }, [locationSuggestions])

  return {
    companySuggestions,
    positionSuggestions,
    locationSuggestions,
    addCompanySuggestion,
    addPositionSuggestion,
    addLocationSuggestion,
    getCompanySuggestions,
    getPositionSuggestions,
    getLocationSuggestions
  }
}