import { useState, useEffect, useCallback } from 'react'
import type { Contact, CreateContactRequest, UpdateContactRequest, ContactFilters, ContactStats } from '@/types/contact'

interface UseContactsReturn {
  contacts: Contact[]
  loading: boolean
  error: string | null
  stats: ContactStats | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  createContact: (data: CreateContactRequest) => Promise<Contact>
  updateContact: (data: UpdateContactRequest) => Promise<Contact>
  deleteContact: (id: string) => Promise<void>
  fetchContacts: (filters?: ContactFilters) => Promise<void>
  fetchStats: () => Promise<void>
  searchContacts: (query: string, type?: string) => Promise<any[]>
  setFilters: (filters: ContactFilters) => void
  setPage: (page: number) => void
}

export function useContacts(): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ContactStats | null>(null)
  const [filters, setFilters] = useState<ContactFilters>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  const fetchContacts = useCallback(async (newFilters?: ContactFilters) => {
    try {
      setLoading(true)
      setError(null)

      const currentFilters = newFilters || filters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (currentFilters.search) params.append('search', currentFilters.search)
      if (currentFilters.company) params.append('company', currentFilters.company)
      if (currentFilters.relationshipType) params.append('relationshipType', currentFilters.relationshipType)
      if (currentFilters.connectionStrength) params.append('connectionStrength', currentFilters.connectionStrength)
      if (currentFilters.tags?.length) params.append('tags', currentFilters.tags.join(','))
      if (currentFilters.sortBy) params.append('sortBy', currentFilters.sortBy)
      if (currentFilters.sortOrder) params.append('sortOrder', currentFilters.sortOrder)

      const response = await fetch(`/api/contacts?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }

      const data = await response.json()
      setContacts(data.contacts)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/contacts/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch contact stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching contact stats:', err)
    }
  }, [])

  const createContact = useCallback(async (data: CreateContactRequest): Promise<Contact> => {
    try {
      setError(null)
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create contact')
      }

      const contact = await response.json()
      setContacts(prev => [contact, ...prev])
      await fetchStats() // Refresh stats
      return contact
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchStats])

  const updateContact = useCallback(async (data: UpdateContactRequest): Promise<Contact> => {
    try {
      setError(null)
      const response = await fetch(`/api/contacts/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update contact')
      }

      const updatedContact = await response.json()
      setContacts(prev => 
        prev.map(contact => 
          contact.id === data.id ? updatedContact : contact
        )
      )
      await fetchStats() // Refresh stats
      return updatedContact
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchStats])

  const deleteContact = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete contact')
      }

      setContacts(prev => prev.filter(contact => contact.id !== id))
      await fetchStats() // Refresh stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchStats])

  const searchContacts = useCallback(async (query: string, type?: string): Promise<any[]> => {
    try {
      const params = new URLSearchParams({ q: query })
      if (type) params.append('type', type)

      const response = await fetch(`/api/contacts/search?${params}`)
      if (!response.ok) {
        throw new Error('Failed to search contacts')
      }

      return await response.json()
    } catch (err) {
      console.error('Error searching contacts:', err)
      return []
    }
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const handleSetFilters = useCallback((newFilters: ContactFilters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  // Fetch contacts when filters or pagination change
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    contacts,
    loading,
    error,
    stats,
    pagination,
    createContact,
    updateContact,
    deleteContact,
    fetchContacts,
    fetchStats,
    searchContacts,
    setFilters: handleSetFilters,
    setPage
  }
}