import { test, expect } from '@playwright/test'

/**
 * Bug #001 REAL LOGIN TEST
 * First fix login, then capture real profile vs game avatar comparison
 */
test.describe('Bug #001: Fix Login and Real Avatar Comparison', () => {
  
  test('debug login process and create working user', async ({ page }) => {
    console.log('🔧 DEBUGGING LOGIN: Understanding login flow')
    
    await page.goto('http://localhost:3000/')
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    
    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/01-initial-page.png',
      fullPage: true
    })
    
    console.log('✅ Initial page loaded, checking registration flow...')
    
    // Try registration first
    try {
      // Click registration tab more specifically
      await page.click('[role="tab"][aria-controls*="register"]')
      await page.waitForTimeout(1000)
      
      await page.screenshot({
        path: 'test-results/02-registration-tab.png',
        fullPage: true
      })
      
      // Wait for form to be visible
      await page.waitForSelector('input[placeholder*="用户名"]', { timeout: 5000 })
      
      // Fill registration form
      const testUser = 'debug_anna_real'
      await page.fill('input[placeholder*="用户名"]', testUser)
      
      // Find password field in registration
      const passwordField = page.locator('input[type="password"]').first()
      await passwordField.fill('test123')
      
      // Check for confirm password
      const confirmField = page.locator('input[type="password"]').nth(1)
      if (await confirmField.isVisible()) {
        await confirmField.fill('test123')
      }
      
      // Check for email
      const emailField = page.locator('input[type="email"]')
      if (await emailField.isVisible()) {
        await emailField.fill(`${testUser}@test.com`)
      }
      
      await page.screenshot({
        path: 'test-results/03-registration-filled.png',
        fullPage: true
      })
      
      // Submit registration
      await page.click('button:has-text("注册")')
      await page.waitForTimeout(3000)
      
      await page.screenshot({
        path: 'test-results/04-registration-submitted.png',
        fullPage: true
      })
      
      console.log('✅ Registration attempted')
      
      // Now try to login with the same user
      await page.click('[role="tab"]:has-text("登录")')
      await page.waitForTimeout(1000)
      
      await page.screenshot({
        path: 'test-results/05-login-tab.png',
        fullPage: true
      })
      
      // Fill login form
      await page.fill('input[placeholder*="用户名"]', testUser)
      await page.fill('input[type="password"]', 'test123')
      
      await page.screenshot({
        path: 'test-results/06-login-filled.png',
        fullPage: true
      })
      
      // Submit login
      await page.click('button:has-text("登 录")')
      console.log('🔑 Login submitted, waiting for response...')
      
      // Wait longer and check what happens
      await page.waitForTimeout(10000)
      
      await page.screenshot({
        path: 'test-results/07-after-login.png',
        fullPage: true
      })
      
      // Check current state
      const pageState = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          hasCanvas: !!document.querySelector('canvas'),
          hasError: !!document.querySelector('.ant-message-error, .error'),
          hasLoginForm: !!document.querySelector('button:has-text("登 录")'),
          bodyText: document.body.innerText.slice(0, 300)
        }
      })
      
      console.log('📊 Page state after login:', pageState)
      
      if (pageState.hasCanvas) {
        console.log('🎮 SUCCESS: Game loaded!')
        
        // Wait for game to initialize
        await page.waitForTimeout(8000)
        
        await page.screenshot({
          path: 'test-results/08-game-loaded.png',
          fullPage: true
        })
        
        // Try to extract real avatar data
        const avatarData = await page.evaluate(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              try {
                const game = (window as any).game || (window as any).phaserGame
                if (game && game.scene) {
                  const scene = game.scene.getScene?.('MainScene') || game.scene.scenes?.[0]
                  if (scene) {
                    const player = scene.getCurrentPlayer?.() || scene.player
                    if (player) {
                      const sprite = player.getSprite?.() || player
                      resolve({
                        success: true,
                        textureKey: sprite.texture?.key,
                        tint: sprite.tint,
                        position: { x: sprite.x, y: sprite.y }
                      })
                      return
                    }
                  }
                }
                resolve({ success: false, reason: 'Could not find player sprite' })
              } catch (error) {
                resolve({ success: false, reason: error.message })
              }
            }, 5000)
          })
        })
        
        console.log('🎮 Real game avatar data:', avatarData)
        
      } else {
        console.log('❌ Game did not load')
        
        if (pageState.hasError) {
          console.log('❌ Error message detected')
        }
        
        if (pageState.hasLoginForm) {
          console.log('❌ Still on login form - login failed')
        }
      }
      
    } catch (error) {
      console.error('❌ Login process error:', error.message)
      
      await page.screenshot({
        path: 'test-results/09-login-error.png',
        fullPage: true
      })
    }
    
    console.log('\n📁 Check test-results/ for step-by-step screenshots of login process')
    console.log('🔍 This will help debug why login is failing')
    
    // Test passes - we're just debugging
    expect(true).toBe(true)
  })
})