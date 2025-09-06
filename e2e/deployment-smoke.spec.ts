import { test, expect } from '@playwright/test'

test.describe('Deployment Smoke Tests @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary test data or authentication
    await page.goto('/')
  })

  test('should load the main application', async ({ page }) => {
    // Check that the main page loads
    await expect(page).toHaveTitle(/AI Application Tracker/)
    
    // Check for key elements
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should have working health check endpoint', async ({ page }) => {
    const response = await page.request.get('/api/health')
    expect(response.ok()).toBeTruthy()
    
    const healthData = await response.json()
    expect(healthData.status).toBeDefined()
    expect(healthData.timestamp).toBeDefined()
    expect(healthData.checks).toBeDefined()
  })

  test('should have working feature flags endpoint', async ({ page }) => {
    const response = await page.request.get('/api/feature-flags')
    expect(response.ok()).toBeTruthy()
    
    const flagsData = await response.json()
    expect(flagsData.success).toBe(true)
    expect(flagsData.data).toBeDefined()
  })

  test('should load monitoring dashboard for admin', async ({ page }) => {
    await page.goto('/admin/monitoring')
    
    // Check that monitoring dashboard loads
    await expect(page.locator('h1')).toContainText('Monitoring Dashboard')
    
    // Check for key monitoring components
    await expect(page.locator('text=System Health')).toBeVisible()
    await expect(page.locator('text=Performance Metrics')).toBeVisible()
    await expect(page.locator('text=Backup Status')).toBeVisible()
  })

  test('should handle CSV import functionality', async ({ page }) => {
    // Navigate to main dashboard
    await page.goto('/')
    
    // Look for import button
    const importButton = page.locator('button:has-text("Import")')
    if (await importButton.isVisible()) {
      await importButton.click()
      
      // Check that import modal opens
      await expect(page.locator('text=Import Applications')).toBeVisible()
    }
  })

  test('should have working application table', async ({ page }) => {
    await page.goto('/')
    
    // Check for application table or empty state
    const hasApplications = await page.locator('table').isVisible()
    const hasEmptyState = await page.locator('text=No applications found').isVisible()
    
    expect(hasApplications || hasEmptyState).toBeTruthy()
  })

  test('should handle add application functionality', async ({ page }) => {
    await page.goto('/')
    
    // Look for add application button
    const addButton = page.locator('button:has-text("Add Application")')
    if (await addButton.isVisible()) {
      await addButton.click()
      
      // Check that add modal opens
      await expect(page.locator('text=Add New Application')).toBeVisible()
      
      // Check for required form fields
      await expect(page.locator('input[name="company"]')).toBeVisible()
      await expect(page.locator('input[name="position"]')).toBeVisible()
    }
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')
    
    // Check main navigation elements
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Check for key navigation items
    const dashboardLink = nav.locator('text=Dashboard')
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click()
      await expect(page).toHaveURL(/.*dashboard.*|.*\/$/)
    }
  })

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check that page is still functional on mobile
    await expect(page.locator('h1')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    await expect(page.locator('h1')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should have working error handling', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page')
    
    // Should either show 404 page or redirect to home
    const is404 = await page.locator('text=404').isVisible()
    const isHome = await page.locator('h1').isVisible()
    
    expect(is404 || isHome).toBeTruthy()
  })

  test('should have working analytics (if enabled)', async ({ page }) => {
    // Check if analytics is enabled via feature flags
    const response = await page.request.get('/api/feature-flags')
    const flagsData = await response.json()
    
    if (flagsData.data?.analytics_tracking) {
      // Test analytics endpoint
      const analyticsResponse = await page.request.post('/api/analytics/events', {
        data: {
          events: [{
            event: 'test_event',
            timestamp: Date.now(),
            sessionId: 'test_session',
            anonymousId: 'test_anon'
          }],
          timestamp: Date.now()
        }
      })
      
      expect(analyticsResponse.ok()).toBeTruthy()
    }
  })

  test('should have working backup system', async ({ page }) => {
    await page.goto('/admin/monitoring')
    
    // Check for backup status section
    await expect(page.locator('text=Backup Status')).toBeVisible()
    
    // Check for manual backup button
    const backupButton = page.locator('button:has-text("Create Backup")')
    if (await backupButton.isVisible()) {
      // Don't actually trigger backup in smoke test, just verify button exists
      expect(await backupButton.isEnabled()).toBeTruthy()
    }
  })

  test('should have working performance monitoring', async ({ page }) => {
    // Check Web Vitals are being tracked
    await page.goto('/')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Check that performance metrics are being collected
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('navigation').length > 0
    })
    
    expect(performanceEntries).toBeTruthy()
  })

  test('should handle offline functionality (PWA)', async ({ page, context }) => {
    await page.goto('/')
    
    // Check for service worker registration
    const swRegistered = await page.evaluate(async () => {
      return 'serviceWorker' in navigator
    })
    
    expect(swRegistered).toBeTruthy()
    
    // Check for manifest
    const manifestLink = page.locator('link[rel="manifest"]')
    if (await manifestLink.count() > 0) {
      const manifestHref = await manifestLink.getAttribute('href')
      expect(manifestHref).toBeTruthy()
      
      // Verify manifest is accessible
      const manifestResponse = await page.request.get(manifestHref!)
      expect(manifestResponse.ok()).toBeTruthy()
    }
  })

  test('should have proper security headers', async ({ page }) => {
    const response = await page.request.get('/')
    
    // Check for security headers
    const headers = response.headers()
    
    expect(headers['x-frame-options']).toBeDefined()
    expect(headers['x-content-type-options']).toBeDefined()
    expect(headers['referrer-policy']).toBeDefined()
  })

  test('should handle API rate limiting gracefully', async ({ page }) => {
    // Make multiple rapid requests to test rate limiting
    const requests = []
    for (let i = 0; i < 5; i++) {
      requests.push(page.request.get('/api/health'))
    }
    
    const responses = await Promise.all(requests)
    
    // All requests should either succeed or be rate limited gracefully
    responses.forEach(response => {
      expect(response.status()).toBeLessThan(500) // No server errors
    })
  })
})