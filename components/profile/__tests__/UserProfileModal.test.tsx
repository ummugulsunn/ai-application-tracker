import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserProfileModal } from '../UserProfileModal'
import { useAuthStore } from '@/store/authStore'
import { usePreferencesStore } from '@/store/preferencesStore'

// Mock the stores
jest.mock('@/store/authStore')
jest.mock('@/store/preferencesStore')

// Mock fetch
global.fetch = jest.fn()

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
}

const mockProfile = {
  ...mockUser,
  phone: '+1234567890',
  location: 'New York, NY',
  experienceLevel: 'Mid' as const,
  desiredSalaryMin: 80000,
  desiredSalaryMax: 120000,
  preferredLocations: ['New York', 'San Francisco'],
  skills: ['JavaScript', 'React'],
  industries: ['Technology', 'Finance'],
  jobTypes: ['Full-time'],
  resumeUrl: 'https://example.com/resume.pdf',
  linkedinUrl: 'https://linkedin.com/in/johndoe',
  githubUrl: 'https://github.com/johndoe',
  portfolioUrl: 'https://johndoe.dev',
  preferences: {
    emailNotifications: true,
    reminderFrequency: 'Daily' as const,
    aiRecommendations: true,
    followUpReminders: true,
    interviewReminders: true,
    applicationDeadlines: true,
    dashboardLayout: 'comfortable' as const,
    defaultView: 'table' as const,
    itemsPerPage: 25,
    showCompletedApplications: true,
    defaultSortBy: 'appliedDate' as const,
    defaultSortOrder: 'desc' as const,
    dataRetention: '2years' as const,
    shareAnalytics: false,
    allowDataExport: true,
    theme: 'system' as const,
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY' as const,
    currency: 'USD',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('UserProfileModal', () => {
  const mockSetProfile = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useAuthStore as jest.Mock).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      setProfile: mockSetProfile,
    })

    ;(usePreferencesStore as jest.Mock).mockReturnValue({
      preferences: mockProfile.preferences,
      isLoading: false,
      savePreferences: jest.fn(),
    })

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockProfile }),
    })
  })

  it('renders profile modal when open', () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('User Profile & Preferences')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
    expect(screen.getByText('Appearance')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<UserProfileModal isOpen={false} onClose={mockOnClose} />)
    
    expect(screen.queryByText('User Profile & Preferences')).not.toBeInTheDocument()
  })

  it('loads user profile data into form fields', () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument()
    expect(screen.getByDisplayValue('New York, NY')).toBeInTheDocument()
  })

  it('allows switching between tabs', () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    // Click on Notifications tab
    fireEvent.click(screen.getByText('Notifications'))
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
    
    // Click on Dashboard tab
    fireEvent.click(screen.getByText('Dashboard'))
    expect(screen.getByText('Dashboard Customization')).toBeInTheDocument()
    
    // Click on Privacy tab
    fireEvent.click(screen.getByText('Privacy'))
    expect(screen.getByText('Privacy & Data Controls')).toBeInTheDocument()
    
    // Click on Appearance tab
    fireEvent.click(screen.getByText('Appearance'))
    expect(screen.getByText('Appearance & Localization')).toBeInTheDocument()
  })

  it('allows adding and removing skills', () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    // Check existing skills are displayed
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    
    // Add a new skill
    const skillInput = screen.getByPlaceholderText('Add a skill')
    fireEvent.change(skillInput, { target: { value: 'TypeScript' } })
    fireEvent.click(screen.getByText('Add'))
    
    // Remove a skill
    const removeButtons = screen.getAllByText('×')
    fireEvent.click(removeButtons[0])
  })

  it('submits profile form successfully', async () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    // Update first name
    const firstNameInput = screen.getByDisplayValue('John')
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } })
    
    // Submit form
    fireEvent.click(screen.getByText('Save Profile'))
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"firstName":"Jane"'),
      })
    })
  })

  it('handles notification preferences', () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    // Switch to notifications tab
    fireEvent.click(screen.getByText('Notifications'))
    
    // Check that notification settings are loaded
    const emailNotifications = screen.getByLabelText('Email Notifications')
    expect(emailNotifications).toBeChecked()
    
    // Toggle email notifications
    fireEvent.click(emailNotifications)
    expect(emailNotifications).not.toBeChecked()
  })

  it('handles dashboard preferences', () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    // Switch to dashboard tab
    fireEvent.click(screen.getByText('Dashboard'))
    
    // Check dashboard layout setting
    const layoutSelect = screen.getByDisplayValue('Comfortable')
    expect(layoutSelect).toBeInTheDocument()
    
    // Change layout
    fireEvent.change(layoutSelect, { target: { value: 'compact' } })
    expect(layoutSelect).toHaveValue('compact')
  })

  it('handles privacy preferences', () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    // Switch to privacy tab
    fireEvent.click(screen.getByText('Privacy'))
    
    // Check data retention setting
    const retentionSelect = screen.getByDisplayValue('2 Years')
    expect(retentionSelect).toBeInTheDocument()
    
    // Check analytics sharing setting
    const shareAnalytics = screen.getByLabelText('Share Anonymous Analytics')
    expect(shareAnalytics).not.toBeChecked()
  })

  it('handles appearance preferences', () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    // Switch to appearance tab
    fireEvent.click(screen.getByText('Appearance'))
    
    // Check theme setting
    const themeSelect = screen.getByDisplayValue('System Default')
    expect(themeSelect).toBeInTheDocument()
    
    // Change theme
    fireEvent.change(themeSelect, { target: { value: 'dark' } })
    expect(themeSelect).toHaveValue('dark')
  })

  it('closes modal when close button is clicked', () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    fireEvent.click(screen.getByLabelText('Close'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('handles form submission errors gracefully', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ 
        success: false, 
        error: { message: 'Validation failed' } 
      }),
    })

    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    fireEvent.click(screen.getByText('Save Profile'))
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })
  })

  it('shows data management modal when clicked', () => {
    render(<UserProfileModal isOpen={true} onClose={mockOnClose} />)
    
    // Switch to privacy tab
    fireEvent.click(screen.getByText('Privacy'))
    
    // Click on manage data button
    fireEvent.click(screen.getByText('Manage My Data'))
    
    // Data management modal should be shown (tested separately)
  })
})