/**
 * End-to-End Tests for User Workflows
 * Tests complete user journeys across the application
 */

import { test, expect, Page } from '@playwright/test'

// Test data
const sampleCSV = `Company,Position,Status,Applied Date,Location,Notes
Google,Software Engineer,Applied,2024-01-15,Mountain View CA,Applied through website
Microsoft,Product Manager,Interviewing,2024-01-20,Seattle WA,Phone interview scheduled
Apple,UX Designer,Rejected,2024-01-10,Cupertino CA,Portfolio not strong enough`

class ApplicationTrackerPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/')
  }

  async addApplication(application: {
    company: string
    position: string
    status: string
    appliedDate: string
    location?: string
    notes?: string
  }) {
    await this.page.click('[data-testid="add-application-button"]')
    await this.page.fill('[data-testid="company-input"]', application.company)
    await this.page.fill('[data-testid="position-input"]', application.position)
    await this.page.selectOption('[data-testid="status-select"]', application.status)
    await this.page.fill('[data-testid="applied-date-input"]', application.appliedDate)
    
    if (application.location) {
      await this.page.fill('[data-testid="location-input"]', application.location)
    }
    
    if (application.notes) {
      await this.page.fill('[data-testid="notes-textarea"]', application.notes)
    }
    
    await this.page.click('[data-testid="submit-application-button"]')
  }

  async importCSV(csvContent: string) {
    await this.page.click('[data-testid="import-button"]')
    
    // Create a temporary file with CSV content
    const fileInput = this.page.locator('[data-testid="csv-file-input"]')
    await fileInput.setInputFiles({
      name: 'applications.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })
    
    // Wait for file analysis
    await this.page.waitForSelector('[data-testid="field-mapping-section"]')
    
    // Confirm field mapping
    await this.page.click('[data-testid="confirm-mapping-button"]')
    
    // Wait for validation
    await this.page.waitForSelector('[data-testid="import-preview-section"]')
    
    // Complete import
    await this.page.click('[data-testid="import-applications-button"]')
    
    // Wait for success message
    await this.page.waitForSelector('[data-testid="import-success-message"]')
  }

  async searchApplications(query: string) {
    await this.page.fill('[data-testid="search-input"]', query)
    await this.page.waitForTimeout(500) // Wait for debounced search
  }

  async exportApplications(format: 'csv' | 'excel' | 'pdf') {
    await this.page.click('[data-testid="export-button"]')
    await this.page.click(`[data-testid="export-format-${format}"]`)
    await this.page.click('[data-testid="start-export-button"]')
    
    // Wait for export to complete
    await this.page.waitForSelector('[data-testid="download-link"]')
  }

  async getApplicationCount() {
    const rows = await this.page.locator('[data-testid="application-row"]').count()
    return rows
  }

  async getApplicationByCompany(company: string) {
    return this.page.locator(`[data-testid="application-row"]:has-text("${company}")`)
  }
}

test.describe('User Workflows', () => {
  let app: ApplicationTrackerPage

  test.beforeEach(async ({ page }) => {
    app = new ApplicationTrackerPage(page)
    await app.goto()
  })

  test.describe('First-time User Experience', () => {
    test('should show onboarding for new users', async ({ page }) => {
      // Should show welcome message
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
      
      // Should show tour option
      await expect(page.locator('[data-testid="start-tour-button"]')).toBeVisible()
      
      // Start tour
      await page.click('[data-testid="start-tour-button"]')
      
      // Should show tour steps
      await expect(page.locator('[data-testid="tour-step"]')).toBeVisible()
      
      // Complete tour
      await page.click('[data-testid="next-tour-step"]')
      await page.click('[data-testid="next-tour-step"]')
      await page.click('[data-testid="finish-tour-button"]')
      
      // Should hide welcome message after tour
      await expect(page.locator('[data-testid="welcome-message"]')).not.toBeVisible()
    })

    test('should allow loading sample data', async ({ page }) => {
      await page.click('[data-testid="load-sample-data-button"]')
      
      // Should load sample applications
      await expect(page.locator('[data-testid="application-table"]')).toBeVisible()
      
      const applicationCount = await app.getApplicationCount()
      expect(applicationCount).toBeGreaterThan(0)
    })
  })

  test.describe('Application Management', () => {
    test('should add a new application', async ({ page }) => {
      await app.addApplication({
        company: 'Google',
        position: 'Software Engineer',
        status: 'Applied',
        appliedDate: '2024-01-15',
        location: 'Mountain View, CA',
        notes: 'Applied through company website'
      })
      
      // Should show success message
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
      
      // Should appear in the table
      const googleApp = await app.getApplicationByCompany('Google')
      await expect(googleApp).toBeVisible()
      await expect(googleApp.locator('text=Software Engineer')).toBeVisible()
    })

    test('should edit an existing application', async ({ page }) => {
      // First add an application
      await app.addApplication({
        company: 'Microsoft',
        position: 'Product Manager',
        status: 'Applied',
        appliedDate: '2024-01-20'
      })
      
      // Edit the application
      const microsoftApp = await app.getApplicationByCompany('Microsoft')
      await microsoftApp.click('[data-testid="edit-application-button"]')
      
      // Update status
      await page.selectOption('[data-testid="status-select"]', 'Interviewing')
      await page.fill('[data-testid="notes-textarea"]', 'Phone interview scheduled')
      await page.click('[data-testid="save-application-button"]')
      
      // Should show updated status
      await expect(microsoftApp.locator('text=Interviewing')).toBeVisible()
    })

    test('should delete an application', async ({ page }) => {
      // Add an application
      await app.addApplication({
        company: 'Apple',
        position: 'UX Designer',
        status: 'Applied',
        appliedDate: '2024-01-10'
      })
      
      // Delete the application
      const appleApp = await app.getApplicationByCompany('Apple')
      await appleApp.click('[data-testid="delete-application-button"]')
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]')
      
      // Should be removed from table
      await expect(appleApp).not.toBeVisible()
    })
  })

  test.describe('CSV Import Workflow', () => {
    test('should import CSV file successfully', async ({ page }) => {
      await app.importCSV(sampleCSV)
      
      // Should show import success
      await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible()
      
      // Should show imported applications
      const applicationCount = await app.getApplicationCount()
      expect(applicationCount).toBe(3)
      
      // Verify specific applications
      await expect(app.getApplicationByCompany('Google')).toBeVisible()
      await expect(app.getApplicationByCompany('Microsoft')).toBeVisible()
      await expect(app.getApplicationByCompany('Apple')).toBeVisible()
    })

    test('should handle CSV with validation errors', async ({ page }) => {
      const invalidCSV = `Company,Position,Status,Applied Date
,Software Engineer,Applied,2024-01-15
Google,,Applied,invalid-date
Microsoft,Manager,InvalidStatus,2024-01-20`
      
      await page.click('[data-testid="import-button"]')
      
      const fileInput = page.locator('[data-testid="csv-file-input"]')
      await fileInput.setInputFiles({
        name: 'invalid.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(invalidCSV)
      })
      
      await page.waitForSelector('[data-testid="field-mapping-section"]')
      await page.click('[data-testid="confirm-mapping-button"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible()
      await expect(page.locator('text=Company name is required')).toBeVisible()
      await expect(page.locator('text=Position is required')).toBeVisible()
      await expect(page.locator('text=Invalid date format')).toBeVisible()
      
      // Should allow importing valid rows only
      await page.click('[data-testid="import-valid-only-button"]')
      
      // Should import only the valid row
      const applicationCount = await app.getApplicationCount()
      expect(applicationCount).toBe(1)
    })

    test('should detect and handle duplicates', async ({ page }) => {
      // First import
      await app.importCSV(sampleCSV)
      
      // Import same data again
      await page.click('[data-testid="import-button"]')
      
      const fileInput = page.locator('[data-testid="csv-file-input"]')
      await fileInput.setInputFiles({
        name: 'duplicates.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(sampleCSV)
      })
      
      await page.waitForSelector('[data-testid="field-mapping-section"]')
      await page.click('[data-testid="confirm-mapping-button"]')
      
      // Should detect duplicates
      await expect(page.locator('[data-testid="duplicates-detected"]')).toBeVisible()
      
      // Choose to skip duplicates
      await page.click('[data-testid="skip-duplicates-button"]')
      await page.click('[data-testid="import-applications-button"]')
      
      // Should show no new applications imported
      await expect(page.locator('text=0 applications imported')).toBeVisible()
      await expect(page.locator('text=3 duplicates skipped')).toBeVisible()
    })
  })

  test.describe('Search and Filtering', () => {
    test.beforeEach(async () => {
      // Import sample data for search tests
      await app.importCSV(sampleCSV)
    })

    test('should search applications by company', async ({ page }) => {
      await app.searchApplications('Google')
      
      // Should show only Google application
      await expect(app.getApplicationByCompany('Google')).toBeVisible()
      await expect(app.getApplicationByCompany('Microsoft')).not.toBeVisible()
      await expect(app.getApplicationByCompany('Apple')).not.toBeVisible()
    })

    test('should search applications by position', async ({ page }) => {
      await app.searchApplications('Engineer')
      
      // Should show applications with "Engineer" in position
      await expect(app.getApplicationByCompany('Google')).toBeVisible()
      await expect(app.getApplicationByCompany('Microsoft')).not.toBeVisible()
      await expect(app.getApplicationByCompany('Apple')).not.toBeVisible()
    })

    test('should filter by status', async ({ page }) => {
      await page.selectOption('[data-testid="status-filter"]', 'Interviewing')
      
      // Should show only interviewing applications
      await expect(app.getApplicationByCompany('Microsoft')).toBeVisible()
      await expect(app.getApplicationByCompany('Google')).not.toBeVisible()
      await expect(app.getApplicationByCompany('Apple')).not.toBeVisible()
    })

    test('should clear search and filters', async ({ page }) => {
      // Apply search and filter
      await app.searchApplications('Google')
      await page.selectOption('[data-testid="status-filter"]', 'Applied')
      
      // Clear all
      await page.click('[data-testid="clear-filters-button"]')
      
      // Should show all applications
      const applicationCount = await app.getApplicationCount()
      expect(applicationCount).toBe(3)
    })
  })

  test.describe('Data Export', () => {
    test.beforeEach(async () => {
      await app.importCSV(sampleCSV)
    })

    test('should export applications as CSV', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download')
      
      await app.exportApplications('csv')
      await page.click('[data-testid="download-link"]')
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
    })

    test('should export applications as Excel', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download')
      
      await app.exportApplications('excel')
      await page.click('[data-testid="download-link"]')
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.xlsx')
    })

    test('should export applications as PDF', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download')
      
      await app.exportApplications('pdf')
      await page.click('[data-testid="download-link"]')
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.pdf')
    })
  })

  test.describe('AI Insights', () => {
    test.beforeEach(async () => {
      await app.importCSV(sampleCSV)
    })

    test('should generate AI insights', async ({ page }) => {
      await page.click('[data-testid="generate-insights-button"]')
      
      // Should show analysis in progress
      await expect(page.locator('[data-testid="analysis-progress"]')).toBeVisible()
      
      // Should show insights when complete
      await expect(page.locator('[data-testid="ai-insights-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-rate"]')).toBeVisible()
      await expect(page.locator('[data-testid="recommendations"]')).toBeVisible()
    })

    test('should show application patterns', async ({ page }) => {
      await page.click('[data-testid="generate-insights-button"]')
      
      await expect(page.locator('[data-testid="ai-insights-section"]')).toBeVisible()
      
      // Should show pattern analysis
      await expect(page.locator('[data-testid="application-patterns"]')).toBeVisible()
      await expect(page.locator('[data-testid="timing-analysis"]')).toBeVisible()
      await expect(page.locator('[data-testid="industry-insights"]')).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Should show mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      
      // Should be able to add applications on mobile
      await page.click('[data-testid="mobile-menu-button"]')
      await page.click('[data-testid="add-application-button"]')
      
      // Modal should be mobile-friendly
      await expect(page.locator('[data-testid="application-modal"]')).toBeVisible()
      
      // Form should be usable on mobile
      await page.fill('[data-testid="company-input"]', 'Mobile Test Company')
      await page.fill('[data-testid="position-input"]', 'Mobile Test Position')
      await page.selectOption('[data-testid="status-select"]', 'Applied')
      await page.fill('[data-testid="applied-date-input"]', '2024-01-15')
      await page.click('[data-testid="submit-application-button"]')
      
      // Should show success on mobile
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    })

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // Should show tablet-optimized layout
      await expect(page.locator('[data-testid="application-table"]')).toBeVisible()
      
      // Table should be scrollable on tablet
      const table = page.locator('[data-testid="application-table"]')
      await expect(table).toHaveCSS('overflow-x', 'auto')
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Should be able to navigate with Tab key
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="add-application-button"]')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="import-button"]')).toBeFocused()
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter')
      await expect(page.locator('[data-testid="import-modal"]')).toBeVisible()
      
      // Should be able to close with Escape
      await page.keyboard.press('Escape')
      await expect(page.locator('[data-testid="import-modal"]')).not.toBeVisible()
    })

    test('should have proper ARIA labels', async ({ page }) => {
      // Check for proper labeling
      await expect(page.locator('[data-testid="add-application-button"]')).toHaveAttribute('aria-label')
      await expect(page.locator('[data-testid="application-table"]')).toHaveAttribute('aria-label')
      await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute('aria-label')
    })

    test('should work with screen readers', async ({ page }) => {
      // Check for live regions
      await expect(page.locator('[role="status"]')).toBeAttached()
      await expect(page.locator('[role="alert"]')).toBeAttached()
      
      // Check for proper headings structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6')
      const headingCount = await headings.count()
      expect(headingCount).toBeGreaterThan(0)
    })
  })

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now()
      await app.goto()
      await expect(page.locator('[data-testid="application-dashboard"]')).toBeVisible()
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle large datasets efficiently', async ({ page }) => {
      // Generate large CSV
      const largeCSV = [
        'Company,Position,Status,Applied Date',
        ...Array.from({ length: 1000 }, (_, i) => 
          `Company${i},Position${i},Applied,2024-01-${(i % 28) + 1}`
        )
      ].join('\n')
      
      const startTime = Date.now()
      await app.importCSV(largeCSV)
      const importTime = Date.now() - startTime
      
      // Should import within reasonable time (10 seconds)
      expect(importTime).toBeLessThan(10000)
      
      // Should display applications
      const applicationCount = await app.getApplicationCount()
      expect(applicationCount).toBe(1000)
    })
  })
})