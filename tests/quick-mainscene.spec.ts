import { test, expect } from '@playwright/test'

test.describe('MainScene Quick Test', () => {
  
  test('should load MainScene without critical errors', async ({ page }) => {
    console.log('🚀 Quick test: MainScene functionality')
    
    // Navigate to the app
    await page.goto('/')
    
    // Capture console messages
    const criticalErrors: string[] = []
    
    page.on('console', (msg) => {
      const text = msg.text()
      if (msg.type() === 'error') {
        // Only capture critical errors we're trying to fix
        if (text.includes('bodyType') || 
            text.includes('AvatarSystem') ||
            text.includes('body[key] is not a function') ||
            text.includes('Error creating MainScene')) {
          criticalErrors.push(text)
          console.error('❌ Critical Error:', text)
        }
      } else if (text.includes('✅ MainScene creation completed successfully')) {
        console.log('✅ MainScene created successfully!')
      }
    })
    
    console.log('⏳ Waiting for login dialog...')
    
    try {
      // Handle login process
      await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      console.log('✅ Login dialog found')
      
      // Fill in login form
      await page.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', 'testuser')
      await page.fill('input[placeholder*="密码"], input[type="password"]', 'testpass')
      
      // Click login button
      await page.click('button:has-text("登 录")')
      console.log('🔑 Login attempted')
      
      // Wait for game canvas to appear after login
      console.log('⏳ Waiting for canvas after login...')
      await page.waitForSelector('canvas', { timeout: 30000 })
      console.log('✅ Canvas found')
      
      // Give it time to initialize
      await page.waitForTimeout(10000)
      
      console.log(`📊 Critical errors found: ${criticalErrors.length}`)
      
      if (criticalErrors.length > 0) {
        console.log('❌ Critical errors:')
        criticalErrors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`)
        })
      } else {
        console.log('✅ No critical errors found!')
      }
      
      // Test passes if no critical errors
      expect(criticalErrors.length).toBe(0)
      
    } catch (error) {
      console.error('❌ Test failed:', error)
      
      // Take additional screenshot for debugging
      await page.screenshot({ path: 'debug-screenshot.png' })
      console.log('📷 Debug screenshot saved as debug-screenshot.png')
      
      throw error
    }
  })
})