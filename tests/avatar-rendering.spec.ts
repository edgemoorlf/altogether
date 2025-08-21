import { test, expect } from '@playwright/test'

test.describe('Avatar Rendering Tests', () => {
  
  test('should render current user avatar without errors', async ({ page }) => {
    console.log('🧪 Testing current user avatar rendering...')
    
    // Capture console errors specifically related to avatar rendering
    const avatarErrors: string[] = []
    const avatarLogs: string[] = []
    
    page.on('console', (msg) => {
      const text = msg.text()
      if (msg.type() === 'error') {
        // Capture avatar-related errors
        if (text.includes('Cannot read properties of null') || 
            text.includes('AvatarSystem') ||
            text.includes('DirectionalPlayer') ||
            text.includes('Scene context is null') ||
            text.includes('createAvatarSprite')) {
          avatarErrors.push(text)
          console.error('🚨 Avatar Error:', text)
        }
      } else if (text.includes('👤 Current user avatar created') || 
                 text.includes('👥 Adding other player') ||
                 text.includes('✅ MainScene creation completed')) {
        avatarLogs.push(text)
        console.log('✅ Avatar Log:', text)
      }
    })
    
    console.log('⏳ Navigating to app...')
    await page.goto('/')
    
    try {
      // Handle login
      await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      console.log('✅ Login dialog found')
      
      await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'avatartest')
      await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass')
      await page.click('button:has-text(\"登 录\")')
      console.log('🔑 Login completed')
      
      // Wait for canvas and scene initialization
      await page.waitForSelector('canvas', { timeout: 15000 })
      console.log('✅ Canvas found')
      
      // Wait for scene to be ready
      await page.waitForTimeout(8000)
      console.log('⏳ Waiting for scene initialization...')
      
      // Check if current user avatar was created successfully
      const hasCurrentUserAvatar = avatarLogs.some(log => 
        log.includes('👤 Current user avatar created') || 
        log.includes('✅ MainScene creation completed')
      )
      
      console.log(`📊 Avatar creation logs: ${avatarLogs.length}`)
      console.log(`🚨 Avatar errors: ${avatarErrors.length}`)
      
      if (avatarErrors.length > 0) {
        console.log('❌ Avatar errors found:')
        avatarErrors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`)
        })
      }
      
      if (avatarLogs.length > 0) {
        console.log('✅ Avatar logs found:')
        avatarLogs.forEach((log, i) => {
          console.log(`   ${i + 1}. ${log}`)
        })
      }
      
      // Test should pass if no avatar-related errors occurred
      expect(avatarErrors.length).toBe(0)
      expect(hasCurrentUserAvatar).toBe(true)
      
      console.log('✅ Current user avatar rendering test passed')
      
    } catch (error) {
      console.error('❌ Avatar test failed:', error)
      await page.screenshot({ path: 'avatar-test-failure.png' })
      throw error
    }
  })
  
  test('should handle multiple users without avatar rendering errors', async ({ page, context }) => {
    console.log('🧪 Testing multiple user avatar rendering...')
    
    const avatarErrors: string[] = []
    const multiPlayerLogs: string[] = []
    
    page.on('console', (msg) => {
      const text = msg.text()
      if (msg.type() === 'error') {
        if (text.includes('Cannot read properties of null') || 
            text.includes('AvatarSystem') ||
            text.includes('DirectionalPlayer') ||
            text.includes('Scene context is null')) {
          avatarErrors.push(text)
          console.error('🚨 Multi-user Avatar Error:', text)
        }
      } else if (text.includes('👥 Adding other player') || 
                 text.includes('👥 User joined') ||
                 text.includes('⏳ Scene not ready, deferring')) {
        multiPlayerLogs.push(text)
        console.log('👥 Multi-user Log:', text)
      }
    })
    
    // First user
    await page.goto('/')
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'user1')
    await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'pass1')
    await page.click('button:has-text(\"登 录\")')
    
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(5000) // Allow scene to fully initialize
    
    // Open second tab for second user
    const page2 = await context.newPage()
    
    page2.on('console', (msg) => {
      const text = msg.text()
      if (msg.type() === 'error' && (
          text.includes('Cannot read properties of null') || 
          text.includes('AvatarSystem') ||
          text.includes('DirectionalPlayer'))) {
        avatarErrors.push(`Page2: ${text}`)
        console.error('🚨 Page2 Avatar Error:', text)
      }
    })
    
    await page2.goto('/')
    await page2.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    await page2.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'user2')
    await page2.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'pass2')
    await page2.click('button:has-text(\"登 录\")')
    
    await page2.waitForSelector('canvas', { timeout: 15000 })
    
    // Wait for both users to be fully connected and avatars created
    await page.waitForTimeout(8000)
    await page2.waitForTimeout(8000)
    
    console.log(`📊 Multi-user logs: ${multiPlayerLogs.length}`)
    console.log(`🚨 Multi-user errors: ${avatarErrors.length}`)
    
    if (avatarErrors.length > 0) {
      console.log('❌ Multi-user avatar errors:')
      avatarErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`)
      })
    }
    
    // Test should pass if no avatar errors occurred with multiple users
    expect(avatarErrors.length).toBe(0)
    
    console.log('✅ Multiple user avatar rendering test passed')
    
    await page2.close()
  })
})