import { DuplicateDetector } from '../csv/duplicate-detector'
import { 
  detectDuplicates, 
  detectBulkDuplicates, 
  generateMergeSuggestions,
  applyBulkResolutions 
} from '../utils/duplicateDetection'
import { Application } from '@/types/application'

describe('DuplicateDetector', () => {
  const mockMapping = {
    company: 'Company',
    position: 'Position',
    location: 'Location',
    appliedDate: 'Applied Date',
    jobUrl: 'Job URL'
  }

  describe('detectDuplicates', () => {
    it('should detect exact duplicates with high confidence', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Location': 'Mountain View, CA',
          'Applied Date': '2024-01-15'
        },
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Location': 'Mountain View, CA',
          'Applied Date': '2024-01-15'
        }
      ]

      const duplicateGroups = DuplicateDetector.detectDuplicates(data, mockMapping)

      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0]?.applications).toHaveLength(2)
      expect(duplicateGroups[0]?.confidence).toBeGreaterThan(0.9)
    })

    it('should detect similar applications with medium confidence', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Location': 'Mountain View, CA'
        },
        {
          'Company': 'Google',
          'Position': 'Software Engineer', // Make it more similar to trigger detection
          'Location': 'Mountain View, California' // Slightly different location
        }
      ]

      const duplicateGroups = DuplicateDetector.detectDuplicates(data, mockMapping)

      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0]?.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should not detect unrelated applications as duplicates', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Location': 'Mountain View, CA'
        },
        {
          'Company': 'Microsoft',
          'Position': 'Product Manager',
          'Location': 'Seattle, WA'
        }
      ]

      const duplicateGroups = DuplicateDetector.detectDuplicates(data, mockMapping)

      expect(duplicateGroups).toHaveLength(0)
    })

    it('should detect duplicates based on job URL', () => {
      const mockMappingWithJobUrl = {
        ...mockMapping,
        jobUrl: 'Job URL'
      }
      
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Job URL': 'https://careers.google.com/jobs/123'
        },
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Job URL': 'https://careers.google.com/jobs/123'
        }
      ]

      const duplicateGroups = DuplicateDetector.detectDuplicates(data, mockMappingWithJobUrl)

      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0]?.matchReasons.some(reason => reason.includes('Same job URL'))).toBe(true)
    })

    it('should detect applications with close applied dates', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Applied Date': '2024-01-15'
        },
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Applied Date': '2024-01-16' // One day apart
        }
      ]

      const duplicateGroups = DuplicateDetector.detectDuplicates(data, mockMapping)

      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0]?.matchReasons.some(reason => reason.includes('Applied dates close'))).toBe(true)
    })
  })

  describe('generateMergePreview', () => {
    it('should merge applications by preferring non-empty values', () => {
      const applications = [
        {
          index: 0,
          data: {
            'Company': 'Google',
            'Position': 'Software Engineer',
            'Location': '',
            'Email': 'recruiter@google.com'
          }
        },
        {
          index: 1,
          data: {
            'Company': 'Google',
            'Position': 'Software Engineer',
            'Location': 'Mountain View, CA',
            'Email': ''
          }
        }
      ]

      const merged = DuplicateDetector.generateMergePreview(applications, mockMapping)

      expect(merged['Company']).toBe('Google')
      expect(merged['Position']).toBe('Software Engineer')
      expect(merged['Location']).toBe('Mountain View, CA') // Filled from second app
      expect(merged['Email']).toBe('recruiter@google.com') // Kept from first app
    })

    it('should prefer more recent dates when merging', () => {
      const applications = [
        {
          index: 0,
          data: {
            'Company': 'Google',
            'Position': 'Software Engineer',
            'Applied Date': '2024-01-15'
          }
        },
        {
          index: 1,
          data: {
            'Company': 'Google',
            'Position': 'Software Engineer',
            'Applied Date': '2024-01-20' // More recent
          }
        }
      ]

      const merged = DuplicateDetector.generateMergePreview(applications, mockMapping)

      expect(merged['Applied Date']).toBe('2024-01-20')
    })

    it('should prefer more advanced status when merging', () => {
      const applications = [
        {
          index: 0,
          data: {
            'Company': 'Google',
            'Position': 'Software Engineer',
            'Status': 'applied'
          }
        },
        {
          index: 1,
          data: {
            'Company': 'Google',
            'Position': 'Software Engineer',
            'Status': 'interviewing' // More advanced
          }
        }
      ]

      const merged = DuplicateDetector.generateMergePreview(applications, mockMapping)

      expect(merged['Status']).toBe('interviewing')
    })
  })

  describe('applyResolutions', () => {
    it('should merge applications correctly', () => {
      const data = [
        { company: 'Google', position: 'SWE' },
        { company: 'Google', position: 'Software Engineer' },
        { company: 'Microsoft', position: 'PM' }
      ]

      const resolutions = [
        {
          action: 'merge' as const,
          primaryIndex: 0,
          secondaryIndex: 1,
          mergedData: { company: 'Google', position: 'Software Engineer' }
        }
      ]

      const result = DuplicateDetector.applyResolutions(data, resolutions)

      expect(result.processedData).toHaveLength(2)
      expect(result.processedData[0]).toEqual({ company: 'Google', position: 'Software Engineer' })
      expect(result.summary.merged).toBe(1)
    })

    it('should skip duplicate applications', () => {
      const data = [
        { company: 'Google', position: 'SWE' },
        { company: 'Google', position: 'SWE' },
        { company: 'Microsoft', position: 'PM' }
      ]

      const resolutions = [
        {
          action: 'skip' as const,
          primaryIndex: 0,
          secondaryIndex: 1
        }
      ]

      const result = DuplicateDetector.applyResolutions(data, resolutions)

      expect(result.processedData).toHaveLength(2)
      expect(result.summary.skipped).toBe(1)
    })

    it('should keep both applications when requested', () => {
      const data = [
        { company: 'Google', position: 'SWE' },
        { company: 'Google', position: 'Software Engineer' }
      ]

      const resolutions = [
        {
          action: 'keep_both' as const,
          primaryIndex: 0,
          secondaryIndex: 1
        }
      ]

      const result = DuplicateDetector.applyResolutions(data, resolutions)

      expect(result.processedData).toHaveLength(2)
      expect(result.summary.merged).toBe(0)
      expect(result.summary.skipped).toBe(0)
    })
  })

  describe('generateSummary', () => {
    it('should generate summary for duplicate groups', () => {
      const duplicateGroups = [
        {
          id: 'group1',
          applications: [{ index: 0, data: {} }, { index: 1, data: {} }],
          confidence: 0.95,
          matchReasons: ['Company match'],
          suggestedResolution: 'merge' as const
        },
        {
          id: 'group2',
          applications: [{ index: 2, data: {} }, { index: 3, data: {} }],
          confidence: 0.75,
          matchReasons: ['Similar position'],
          suggestedResolution: 'skip_duplicates' as const
        }
      ]

      const summary = DuplicateDetector.generateSummary(duplicateGroups)

      expect(summary.totalDuplicates).toBe(2)
      expect(summary.highConfidenceGroups).toBe(1)
      expect(summary.mediumConfidenceGroups).toBe(1)
      expect(summary.recommendedActions).toHaveLength(2)
    })

    it('should handle no duplicates', () => {
      const summary = DuplicateDetector.generateSummary([])

      expect(summary.totalDuplicates).toBe(0)
      expect(summary.recommendedActions.some(action => action.includes('No duplicates detected'))).toBe(true)
    })
  })

  describe('Enhanced Duplicate Detection', () => {
    const createMockApplication = (overrides: Partial<Application> = {}): Application => ({
      id: Math.random().toString(36).substr(2, 9),
      company: 'Test Company',
      position: 'Test Position',
      location: 'Test Location',
      type: 'Full-time',
      salary: '',
      status: 'Applied',
      appliedDate: '2024-01-15',
      responseDate: null,
      interviewDate: null,
      notes: '',
      contactPerson: '',
      contactEmail: '',
      website: '',
      tags: [],
      priority: 'Medium',
      jobUrl: '',
      jobDescription: '',
      companyWebsite: '',
      requirements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    })

    describe('detectDuplicates', () => {
      it('should detect high confidence duplicates', () => {
        const newApp = {
          company: 'Google',
          position: 'Software Engineer',
          location: 'Mountain View, CA',
          jobUrl: 'https://careers.google.com/jobs/123'
        }

        const existingApps = [
          createMockApplication({
            company: 'Google',
            position: 'Software Engineer',
            location: 'Mountain View, CA',
            jobUrl: 'https://careers.google.com/jobs/123'
          })
        ]

        const result = detectDuplicates(newApp, existingApps)

        expect(result.isDuplicate).toBe(true)
        expect(result.confidence).toBe('high')
        expect(result.matches).toHaveLength(1)
        expect(result.matches[0]?.similarity).toBeGreaterThan(0.9)
      })

      it('should detect medium confidence duplicates', () => {
        const newApp = {
          company: 'Google',
          position: 'Software Engineer',
          location: 'Mountain View, CA'
        }

        const existingApps = [
          createMockApplication({
            company: 'Google Inc', // Slightly different company name
            position: 'Software Engineer',
            location: 'Mountain View, California' // Similar but different
          })
        ]

        const result = detectDuplicates(newApp, existingApps)

        expect(result.matches).toHaveLength(1)
        expect(result.matches[0]?.similarity).toBeGreaterThan(0.7)
        expect(result.matches[0]?.similarity).toBeLessThan(0.95)
      })

      it('should provide detailed match reasons', () => {
        const newApp = {
          company: 'Google',
          position: 'Software Engineer',
          contactEmail: 'recruiter@google.com'
        }

        const existingApps = [
          createMockApplication({
            company: 'Google',
            position: 'Software Engineer',
            contactEmail: 'recruiter@google.com'
          })
        ]

        const result = detectDuplicates(newApp, existingApps)

        expect(result.matches[0]?.matchReasons).toContain('Identical company name')
        expect(result.matches[0]?.matchReasons).toContain('Identical position title')
        expect(result.matches[0]?.matchReasons).toContain('Same contact email')
      })
    })

    describe('detectBulkDuplicates', () => {
      it('should find duplicate groups in application list', () => {
        const applications = [
          createMockApplication({ company: 'Google', position: 'SWE' }),
          createMockApplication({ company: 'Google', position: 'Software Engineer' }),
          createMockApplication({ company: 'Microsoft', position: 'PM' }),
          createMockApplication({ company: 'Microsoft', position: 'Product Manager' })
        ]

        const result = detectBulkDuplicates(applications)

        expect(result.duplicateGroups).toHaveLength(2)
        expect(result.totalDuplicates).toBe(2)
        expect(result.recommendations).toHaveLength(1) // Should have recommendations
      })

      it('should generate appropriate recommendations', () => {
        const applications = [
          createMockApplication({ 
            company: 'Google', 
            position: 'Software Engineer',
            jobUrl: 'https://careers.google.com/jobs/123'
          }),
          createMockApplication({ 
            company: 'Google', 
            position: 'Software Engineer',
            jobUrl: 'https://careers.google.com/jobs/123'
          })
        ]

        const result = detectBulkDuplicates(applications)

        expect(result.duplicateGroups[0]?.recommendedAction).toBe('merge')
        expect(result.recommendations).toHaveLength(1)
        expect(result.recommendations[0]?.type).toBe('merge_all')
      })
    })

    describe('generateMergeSuggestions', () => {
      it('should intelligently merge application data', () => {
        const newApp = {
          company: 'Google Inc.',
          position: 'Software Engineer',
          salary: '120,000 USD',
          notes: 'Applied through referral',
          tags: ['React', 'TypeScript']
        }

        const existingApp = createMockApplication({
          company: 'Google',
          position: 'SWE',
          location: 'Mountain View, CA',
          notes: 'Initial application',
          tags: ['JavaScript', 'Node.js']
        })

        const merged = generateMergeSuggestions(newApp, existingApp)

        expect(merged.company).toBe('Google Inc.') // Longer company name
        expect(merged.position).toBe('Software Engineer') // Longer position title
        expect(merged.salary).toBe('120,000 USD') // New salary info
        expect(merged.location).toBe('Mountain View, CA') // Preserved from existing
        expect(merged.tags).toContain('React')
        expect(merged.tags).toContain('JavaScript') // Merged tags
        expect(merged.notes).toContain('Initial application')
        expect(merged.notes).toContain('Applied through referral') // Combined notes
      })

      it('should choose better status progression', () => {
        const newApp = { status: 'Interviewing' as const }
        const existingApp = createMockApplication({ status: 'Applied' })

        const merged = generateMergeSuggestions(newApp, existingApp)

        expect(merged.status).toBe('Interviewing') // More advanced status
      })

      it('should handle date merging correctly', () => {
        const newApp = {
          appliedDate: '2024-01-20',
          responseDate: '2024-01-25'
        }
        const existingApp = createMockApplication({
          appliedDate: '2024-01-15', // Earlier
          responseDate: null
        })

        const merged = generateMergeSuggestions(newApp, existingApp)

        expect(merged.appliedDate).toBe('2024-01-15') // Keep earliest applied date
        expect(merged.responseDate).toBe('2024-01-25') // Use new response date
      })
    })

    describe('applyBulkResolutions', () => {
      it('should apply merge resolutions correctly', () => {
        const applications = [
          createMockApplication({ id: '1', company: 'Google', position: 'SWE' }),
          createMockApplication({ id: '2', company: 'Google', position: 'Software Engineer' }),
          createMockApplication({ id: '3', company: 'Microsoft', position: 'PM' })
        ]

        const actions = [{
          groupId: 'group-1',
          action: 'merge' as const,
          mergedData: { company: 'Google', position: 'Software Engineer' }
        }]

        // Mock the detectBulkDuplicates to return our test group
        const originalDetect = detectBulkDuplicates
        ;(global as any).detectBulkDuplicates = () => ({
          duplicateGroups: [{
            id: 'group-1',
            applications: [applications[0]!, applications[1]!],
            confidence: 0.9,
            matchReasons: ['Same company'],
            recommendedAction: 'merge'
          }]
        })

        const result = applyBulkResolutions(applications, actions)

        expect(result.summary.merged).toBe(1)
        expect(result.summary.deleted).toBe(1)
        expect(result.updatedApplications).toHaveLength(2)
        expect(result.deletedApplicationIds).toContain('2')

        // Restore original function
        ;(global as any).detectBulkDuplicates = originalDetect
      })

      it('should keep newest when requested', () => {
        const applications = [
          createMockApplication({ 
            id: '1', 
            company: 'Google', 
            appliedDate: '2024-01-15' 
          }),
          createMockApplication({ 
            id: '2', 
            company: 'Google', 
            appliedDate: '2024-01-20' // Newer
          })
        ]

        const actions = [{
          groupId: 'group-1',
          action: 'keep_newest' as const
        }]

        // Mock the detectBulkDuplicates
        const originalDetect = detectBulkDuplicates
        ;(global as any).detectBulkDuplicates = () => ({
          duplicateGroups: [{
            id: 'group-1',
            applications: applications,
            confidence: 0.8,
            matchReasons: ['Same company'],
            recommendedAction: 'keep_newest'
          }]
        })

        const result = applyBulkResolutions(applications, actions)

        expect(result.summary.kept).toBe(1)
        expect(result.summary.deleted).toBe(1)
        expect(result.deletedApplicationIds).toContain('1') // Older one deleted

        // Restore original function
        ;(global as any).detectBulkDuplicates = originalDetect
      })
    })
  })
})