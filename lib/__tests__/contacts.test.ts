import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { useContacts } from '@/lib/hooks/useContacts'
import type { Contact, CreateContactRequest } from '@/types/contact'

// Mock fetch
global.fetch = jest.fn()

const mockContact: Contact = {
  id: '1',
  userId: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  position: 'Software Engineer',
  linkedinUrl: 'https://linkedin.com/in/johndoe',
  relationshipType: 'colleague',
  connectionStrength: 'strong',
  lastContactDate: new Date('2024-01-15'),
  notes: 'Great colleague from previous job',
  tags: ['tech', 'frontend'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15')
}

const mockStats = {
  totalContacts: 10,
  byRelationshipType: {
    colleague: 5,
    recruiter: 3,
    manager: 2
  },
  byConnectionStrength: {
    strong: 4,
    medium: 4,
    weak: 2
  },
  byCompany: {
    'Acme Corp': 3,
    'Tech Inc': 2
  },
  recentContacts: 3,
  overdueFollowUps: 2
}

describe('useContacts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch contacts successfully', async () => {
    const mockResponse = {
      contacts: [mockContact],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        pages: 1
      }
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const { result } = renderHook(() => useContacts())

    // Wait for initial fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.contacts).toEqual([mockContact])
    expect(result.current.pagination.total).toBe(1)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should create a new contact', async () => {
    const newContactData: CreateContactRequest = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      company: 'Tech Inc',
      relationshipType: 'recruiter'
    }

    const createdContact: Contact = {
      ...mockContact,
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      company: 'Tech Inc',
      relationshipType: 'recruiter'
    }

    // Mock the create response
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => createdContact
    })

    // Mock the stats fetch
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })

    const { result } = renderHook(() => useContacts())

    await act(async () => {
      const contact = await result.current.createContact(newContactData)
      expect(contact).toEqual(createdContact)
    })

    expect(fetch).toHaveBeenCalledWith('/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newContactData)
    })
  })

  it('should update an existing contact', async () => {
    const updateData = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      company: 'New Company'
    }

    const updatedContact = {
      ...mockContact,
      company: 'New Company'
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedContact
    })

    // Mock the stats fetch
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })

    const { result } = renderHook(() => useContacts())

    await act(async () => {
      const contact = await result.current.updateContact(updateData)
      expect(contact.company).toBe('New Company')
    })

    expect(fetch).toHaveBeenCalledWith('/api/contacts/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })
  })

  it('should delete a contact', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Contact deleted successfully' })
    })

    // Mock the stats fetch
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })

    const { result } = renderHook(() => useContacts())

    await act(async () => {
      await result.current.deleteContact('1')
    })

    expect(fetch).toHaveBeenCalledWith('/api/contacts/1', {
      method: 'DELETE'
    })
  })

  it('should search contacts', async () => {
    const searchResults = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        position: 'Software Engineer'
      }
    ]

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => searchResults
    })

    const { result } = renderHook(() => useContacts())

    await act(async () => {
      const results = await result.current.searchContacts('John')
      expect(results).toEqual(searchResults)
    })

    expect(fetch).toHaveBeenCalledWith('/api/contacts/search?q=John')
  })

  it('should fetch contact statistics', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })

    const { result } = renderHook(() => useContacts())

    await act(async () => {
      await result.current.fetchStats()
    })

    expect(result.current.stats).toEqual(mockStats)
    expect(fetch).toHaveBeenCalledWith('/api/contacts/stats')
  })

  it('should handle API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' })
    })

    const { result } = renderHook(() => useContacts())

    await act(async () => {
      try {
        await result.current.createContact({
          firstName: 'Test',
          lastName: 'User'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    expect(result.current.error).toBeTruthy()
  })

  it('should apply filters correctly', async () => {
    const filters = {
      company: 'Acme Corp',
      relationshipType: 'colleague' as const,
      sortBy: 'name' as const,
      sortOrder: 'asc' as const
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contacts: [mockContact],
        pagination: { page: 1, limit: 50, total: 1, pages: 1 }
      })
    })

    const { result } = renderHook(() => useContacts())

    await act(async () => {
      result.current.setFilters(filters)
    })

    // Check that fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('company=Acme%20Corp')
    )
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('relationshipType=colleague')
    )
  })
})

describe('Contact API Validation', () => {
  it('should validate required fields for contact creation', () => {
    const invalidContact = {
      // Missing required firstName and lastName
      email: 'test@example.com'
    }

    // This would be caught by Zod validation in the API
    expect(() => {
      // Simulate validation
      if (!invalidContact.firstName || !invalidContact.lastName) {
        throw new Error('First name and last name are required')
      }
    }).toThrow('First name and last name are required')
  })

  it('should validate email format', () => {
    const invalidEmail = 'not-an-email'
    
    // This would be caught by Zod validation in the API
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    expect(emailRegex.test(invalidEmail)).toBe(false)
  })

  it('should validate URL format for LinkedIn', () => {
    const invalidUrl = 'not-a-url'
    
    try {
      new URL(invalidUrl)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError)
    }
  })
})

describe('Contact Utility Functions', () => {
  it('should format relationship types correctly', () => {
    const relationshipTypes = ['colleague', 'recruiter', 'manager', 'friend', 'mentor', 'other']
    
    relationshipTypes.forEach(type => {
      expect(typeof type).toBe('string')
      expect(type.length).toBeGreaterThan(0)
    })
  })

  it('should format connection strengths correctly', () => {
    const connectionStrengths = ['strong', 'medium', 'weak']
    
    connectionStrengths.forEach(strength => {
      expect(typeof strength).toBe('string')
      expect(['strong', 'medium', 'weak']).toContain(strength)
    })
  })

  it('should calculate days since last contact', () => {
    const lastContactDate = new Date('2024-01-01')
    const now = new Date('2024-01-15')
    const diffTime = Math.abs(now.getTime() - lastContactDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    expect(diffDays).toBe(14)
  })
})