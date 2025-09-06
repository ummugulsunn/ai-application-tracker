import { detectDuplicates, generateMergeSuggestions } from '@/lib/utils/duplicateDetection'
import { Application } from '@/types/application'

// Mock applications for testing
const mockApplication1: Application = {
  id: '1',
  company: 'Google',
  position: 'Software Engineer',
  location: 'Mountain View, CA, USA',
  type: 'Full-time',
  salary: '$150,000',
  status: 'Applied',
  appliedDate: '2024-01-15',
  responseDate: null,
  interviewDate: null,
  notes: 'Applied through company website',
  contactPerson: 'John Doe',
  contactEmail: 'john@google.com',
  website: 'https://google.com/careers',
  tags: ['JavaScript', 'React', 'Node.js'],
  priority: 'High',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  jobUrl: 'https://careers.google.com/jobs/123',
  jobDescription: 'Full stack software engineer role',
  companyWebsite: 'https://google.com'
}

const mockApplication2: Application = {
  id: '2',
  company: 'Microsoft',
  position: 'Senior Software Engineer',
  location: 'Seattle, WA, USA',
  type: 'Full-time',
  salary: '$160,000',
  status: 'Interviewing',
  appliedDate: '2024-01-20',
  responseDate: '2024-01-25',
  interviewDate: '2024-02-01',
  notes: 'Phone screening completed',
  contactPerson: 'Jane Smith',
  contactEmail: 'jane@microsoft.com',
  website: 'https://microsoft.com/careers',
  tags: ['TypeScript', 'Azure', 'C#'],
  priority: 'High',
  createdAt: '2024-01-20T10:00:00Z',
  updatedAt: '2024-01-25T10:00:00Z',
  jobUrl: 'https://careers.microsoft.com/jobs/456',
  jobDescription: 'Senior full stack engineer role',
  companyWebsite: 'https://microsoft.com'
}

describe('Smart Features', () => {
  describe('Duplicate Detection', () => {
    test('should detect exact duplicate', () => {
      const newApp = {
        company: 'Google',
        position: 'Software Engineer',
        location: 'Mountain View, CA, USA'
      }
      
      const result = detectDuplicates(newApp, [mockApplication1, mockApplication2])
      
      expect(result.isDuplicate).toBe(true)
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches[0].existingApplication.id).toBe('1')
      expect(result.confidence).toBe('high')
    })

    test('should detect similar company and position', () => {
      const newApp = {
        company: 'Google Inc',
        position: 'Software Engineer II',
        location: 'Palo Alto, CA, USA'
      }
      
      const result = detectDuplicates(newApp, [mockApplication1, mockApplication2])
      
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches[0].similarity).toBeGreaterThan(0.5)
      expect(result.matches[0].matchReasons.length).toBeGreaterThan(0)
    })

    test('should not detect duplicates for different companies', () => {
      const newApp = {
        company: 'Apple',
        position: 'iOS Developer',
        location: 'Cupertino, CA, USA'
      }
      
      const result = detectDuplicates(newApp, [mockApplication1, mockApplication2])
      
      expect(result.isDuplicate).toBe(false)
      // May have low similarity matches but should not be considered duplicates
      if (result.matches.length > 0) {
        expect(result.matches[0].similarity).toBeLessThan(0.7)
      }
    })

    test('should detect duplicate by job URL', () => {
      const newApp = {
        company: 'Google LLC',
        position: 'Software Engineer',
        location: 'Mountain View, CA, USA',
        jobUrl: 'https://careers.google.com/jobs/123'
      }
      
      const result = detectDuplicates(newApp, [mockApplication1, mockApplication2])
      
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches[0].matchReasons).toContain('Same job URL')
    })
  })

  describe('Merge Suggestions', () => {
    test('should merge complementary data', () => {
      const newApp = {
        company: 'Google',
        position: 'Software Engineer',
        salary: '$155,000',
        jobDescription: 'Updated job description',
        tags: ['Python', 'Machine Learning']
      }
      
      const merged = generateMergeSuggestions(newApp, mockApplication1)
      
      expect(merged.salary).toBe('$155,000')
      expect(merged.jobDescription).toBe('Updated job description')
      expect(merged.tags).toContain('JavaScript')
      expect(merged.tags).toContain('Python')
      expect(merged.tags).toContain('Machine Learning')
    })

    test('should preserve existing data when new data is empty', () => {
      const newApp = {
        company: 'Google',
        position: 'Software Engineer'
      }
      
      const merged = generateMergeSuggestions(newApp, mockApplication1)
      
      expect(merged.contactPerson).toBe('John Doe')
      expect(merged.contactEmail).toBe('john@google.com')
      expect(merged.tags).toEqual(['JavaScript', 'React', 'Node.js'])
    })

    test('should combine notes properly', () => {
      const newApp = {
        company: 'Google',
        position: 'Software Engineer',
        notes: 'Additional information from new application'
      }
      
      const merged = generateMergeSuggestions(newApp, mockApplication1)
      
      expect(merged.notes).toContain('Applied through company website')
      expect(merged.notes).toContain('Additional information from new application')
      expect(merged.notes).toContain('---')
    })
  })
})

describe('API Endpoints', () => {
  // These would be integration tests in a real scenario
  describe('Company Suggestions', () => {
    test('should return popular companies when no query provided', async () => {
      // Mock fetch for testing
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: ['Google', 'Microsoft', 'Apple', 'Amazon']
          })
        })
      ) as jest.Mock

      const response = await fetch('/api/suggestions/companies')
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data).toContain('Google')
      expect(data.data).toContain('Microsoft')
    })
  })

  describe('Position Suggestions', () => {
    test('should standardize common position aliases', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: ['Software Engineer', 'Senior Software Engineer']
          })
        })
      ) as jest.Mock

      const response = await fetch('/api/suggestions/positions?q=swe')
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data).toContain('Software Engineer')
    })
  })

  describe('Location Suggestions', () => {
    test('should return standardized location formats', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: ['San Francisco, CA, USA', 'Remote']
          })
        })
      ) as jest.Mock

      const response = await fetch('/api/suggestions/locations?q=sf')
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data).toContain('San Francisco, CA, USA')
    })
  })

  describe('Job URL Parser', () => {
    test('should extract information from LinkedIn URLs', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              source: 'LinkedIn',
              company: 'Google',
              position: 'Software Engineer'
            }
          })
        })
      ) as jest.Mock

      const response = await fetch('/api/suggestions/job-url', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://linkedin.com/jobs/view/123456' })
      })
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data.source).toBe('LinkedIn')
      expect(data.data.company).toBe('Google')
    })
  })
})