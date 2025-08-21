import { test, expect } from '@playwright/test'

test.describe('Virtual Office - Simple Load Test', () => {
  test('should load virtual office without physics errors', async ({ page }) => {
    console.log('🧪 Testing simplified virtual office load...')
    
    // Capture console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.error('Browser console error:', msg.text())
      }
    })
    
    // Navigate to the app
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForSelector('canvas', { timeout: 15000 })
    
    // Wait a bit for scene creation
    await page.waitForTimeout(5000)
    
    // Check for specific physics/collision errors
    const hasPhysicsErrors = consoleErrors.some(error => 
      error.includes('body[key] is not a function') ||
      error.includes('PhysicsGroup') ||
      error.includes('createCallbackHandler')
    )
    
    console.log('Total console errors:', consoleErrors.length)
    console.log('Physics-related errors detected:', hasPhysicsErrors)
    
    if (consoleErrors.length > 0) {
      console.log('All console errors:', consoleErrors)
    }
    
    // Test should pass if no physics group errors
    expect(hasPhysicsErrors).toBe(false)
    
    console.log('✅ Virtual office load test completed successfully!')
  })
})