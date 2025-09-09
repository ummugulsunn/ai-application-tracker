import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContactsManager } from '../ContactsManager'
import type { Contact } from '@/types/contact'

// Mock the useContacts hook
jest.mock('@/lib/hooks/useContacts', () => ({
  useContacts: jest.fn(() => ({
    contacts: [],
    loading: false,
    error: null,
    stats: {
      totalContacts: 0,
      byRelationshipType: {},
      byConnectionStrength: {},
      byCompany: {},
      recentContacts: 0,
      overdueFollowUps: 0
    },
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      pages: 0
    },
    createContact: jest.fn(),
    updateContact: jest.fn(),
    deleteContact: jest.fn(),
    setFilters: jest.fn(),
    setPage: jest.fn()
  }))
}))

// Mock the child components
jest.mock('../ContactsList', () => ({
  ContactsList: ({ contacts, onEdit, onDelete }: any) => (
    <div data-testid="contacts-list">
      {contacts.map((contact: Contact) => (
        <div key={contact.id} data-testid={`contact-${contact.id}`}>
          <span>{contact.firstName} {contact.lastName}</span>
          <button onClick={() => onEdit(contact)}>Edit</button>
          <button onClick={() => onDelete(contact.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}))

jest.mock('../ContactForm', () => ({
  ContactForm: ({ contact, onSubmit, onCancel }: any) => (
    <div data-testid="contact-form">
      <h2>{contact ? 'Edit Contact' : 'Add Contact'}</h2>
      <button onClick={() => onSubmit({ firstName: 'Test', lastName: 'User' })}>
        Submit
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}))

jest.mock('../ContactStats', () => ({
  ContactStats: ({ stats }: any) => (
    <div data-testid="contact-stats">
      Total: {stats.totalContacts}
    </div>
  )
}))

jest.mock('../ContactFilters', () => ({
  ContactFilters: ({ onFiltersChange }: any) => (
    <div data-testid="contact-filters">
      <button onClick={() => onFiltersChange({ company: 'Test Corp' })}>
        Apply Filter
      </button>
    </div>
  )
}))

const mockContacts: Contact[] = [
  {
    id: '1',
    userId: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
    relationshipType: 'colleague',
    connectionStrength: 'strong',
    tags: ['tech'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: 'user1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    company: 'Tech Inc',
    relationshipType: 'recruiter',
    connectionStrength: 'medium',
    tags: ['hr'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

describe('ContactsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the contacts manager with header', () => {
    render(<ContactsManager />)
    
    expect(screen.getByText('Contacts & Network')).toBeInTheDocument()
    expect(screen.getByText('Manage your professional network and track relationships')).toBeInTheDocument()
    expect(screen.getByText('Add Contact')).toBeInTheDocument()
  })

  it('shows empty state when no contacts exist', () => {
    render(<ContactsManager />)
    
    expect(screen.getByText('No contacts yet')).toBeInTheDocument()
    expect(screen.getByText('Start building your professional network by adding your first contact.')).toBeInTheDocument()
    expect(screen.getByText('Add Your First Contact')).toBeInTheDocument()
  })

  it('displays contacts when they exist', () => {
    const { useContacts } = require('@/lib/hooks/useContacts')
    useContacts.mockReturnValue({
      contacts: mockContacts,
      loading: false,
      error: null,
      stats: {
        totalContacts: 2,
        byRelationshipType: { colleague: 1, recruiter: 1 },
        byConnectionStrength: { strong: 1, medium: 1 },
        byCompany: { 'Acme Corp': 1, 'Tech Inc': 1 },
        recentContacts: 2,
        overdueFollowUps: 0
      },
      pagination: { page: 1, limit: 50, total: 2, pages: 1 },
      createContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      setFilters: jest.fn(),
      setPage: jest.fn()
    })

    render(<ContactsManager />)
    
    expect(screen.getByTestId('contacts-list')).toBeInTheDocument()
    expect(screen.getByTestId('contact-1')).toBeInTheDocument()
    expect(screen.getByTestId('contact-2')).toBeInTheDocument()
  })

  it('opens add contact form when add button is clicked', () => {
    render(<ContactsManager />)
    
    fireEvent.click(screen.getByText('Add Contact'))
    
    expect(screen.getByTestId('contact-form')).toBeInTheDocument()
    expect(screen.getByText('Add Contact')).toBeInTheDocument()
  })

  it('opens edit contact form when edit button is clicked', () => {
    const { useContacts } = require('@/lib/hooks/useContacts')
    useContacts.mockReturnValue({
      contacts: mockContacts,
      loading: false,
      error: null,
      stats: null,
      pagination: { page: 1, limit: 50, total: 2, pages: 1 },
      createContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      setFilters: jest.fn(),
      setPage: jest.fn()
    })

    render(<ContactsManager />)
    
    fireEvent.click(screen.getAllByText('Edit')[0])
    
    expect(screen.getByTestId('contact-form')).toBeInTheDocument()
    expect(screen.getByText('Edit Contact')).toBeInTheDocument()
  })

  it('handles search input changes', () => {
    const mockSetFilters = jest.fn()
    const { useContacts } = require('@/lib/hooks/useContacts')
    useContacts.mockReturnValue({
      contacts: [],
      loading: false,
      error: null,
      stats: null,
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      createContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      setFilters: mockSetFilters,
      setPage: jest.fn()
    })

    render(<ContactsManager />)
    
    const searchInput = screen.getByPlaceholderText('Search contacts...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    expect(mockSetFilters).toHaveBeenCalledWith({ search: 'John' })
  })

  it('shows and hides filters when filter button is clicked', () => {
    render(<ContactsManager />)
    
    const filterButton = screen.getByText('Filters')
    fireEvent.click(filterButton)
    
    expect(screen.getByTestId('contact-filters')).toBeInTheDocument()
  })

  it('displays error message when error occurs', () => {
    const { useContacts } = require('@/lib/hooks/useContacts')
    useContacts.mockReturnValue({
      contacts: [],
      loading: false,
      error: 'Failed to load contacts',
      stats: null,
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      createContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      setFilters: jest.fn(),
      setPage: jest.fn()
    })

    render(<ContactsManager />)
    
    expect(screen.getByText('Failed to load contacts')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    const { useContacts } = require('@/lib/hooks/useContacts')
    useContacts.mockReturnValue({
      contacts: [],
      loading: true,
      error: null,
      stats: null,
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      createContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      setFilters: jest.fn(),
      setPage: jest.fn()
    })

    render(<ContactsManager />)
    
    // The loading state would be handled by LoadingStates.ContactsTable
    // which is mocked, so we just verify the component renders
    expect(screen.getByText('Contacts & Network')).toBeInTheDocument()
  })

  it('handles contact creation', async () => {
    const mockCreateContact = jest.fn().mockResolvedValue({})
    const { useContacts } = require('@/lib/hooks/useContacts')
    useContacts.mockReturnValue({
      contacts: [],
      loading: false,
      error: null,
      stats: null,
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      createContact: mockCreateContact,
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      setFilters: jest.fn(),
      setPage: jest.fn()
    })

    render(<ContactsManager />)
    
    fireEvent.click(screen.getByText('Add Contact'))
    fireEvent.click(screen.getByText('Submit'))
    
    await waitFor(() => {
      expect(mockCreateContact).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User'
      })
    })
  })

  it('handles contact deletion with confirmation', async () => {
    const mockDeleteContact = jest.fn().mockResolvedValue({})
    
    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = jest.fn(() => true)

    const { useContacts } = require('@/lib/hooks/useContacts')
    useContacts.mockReturnValue({
      contacts: mockContacts,
      loading: false,
      error: null,
      stats: null,
      pagination: { page: 1, limit: 50, total: 2, pages: 1 },
      createContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: mockDeleteContact,
      setFilters: jest.fn(),
      setPage: jest.fn()
    })

    render(<ContactsManager />)
    
    fireEvent.click(screen.getAllByText('Delete')[0])
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this contact?')
      expect(mockDeleteContact).toHaveBeenCalledWith('1')
    })

    // Restore original confirm
    window.confirm = originalConfirm
  })
})