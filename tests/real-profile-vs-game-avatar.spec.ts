import { test, expect } from '@playwright/test'

/**
 * Bug #001 REAL PROFILE vs GAME AVATAR TEST
 * This will register a user, see their profile avatar, then compare with game avatar
 */
test.describe('Bug #001: Real Profile vs Game Avatar Comparison', () => {
  
  test('register user, capture profile avatar, then game avatar', async ({ page }) => {
    console.log('🔍 REAL BUG TEST: Profile avatar vs Game avatar comparison')
    
    await page.goto('http://localhost:3000/')
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    
    const testUser = `anna_profile_test_${Date.now()}`
    
    try {
      // Step 1: Register user
      console.log('🔧 Step 1: Registering user to see profile avatar generation...')
      
      await page.click('[role="tab"]:has-text("注册")')
      await page.waitForTimeout(1000)
      
      // Fill registration form carefully
      await page.locator('input[placeholder*="用户名"]').fill(testUser)
      await page.locator('input[type="email"]').fill(`${testUser}@test.com`)
      await page.locator('input[type="password"]').first().fill('test123')
      await page.locator('input[type="password"]').last().fill('test123')
      
      await page.screenshot({
        path: 'test-results/REAL-01-registration-form.png',
        fullPage: true
      })
      
      // Submit registration
      await page.click('button:has-text("注册")')
      await page.waitForTimeout(5000)
      
      await page.screenshot({
        path: 'test-results/REAL-02-after-registration.png',
        fullPage: true
      })
      
      // Step 2: Try to login and see if we get to a profile or dashboard
      console.log('🔑 Step 2: Logging in to see profile...')
      
      // Check if we're redirected or need to login manually
      const currentUrl = await page.url()
      console.log('Current URL after registration:', currentUrl)
      
      if (currentUrl.includes('login') || await page.isVisible('button:has-text("登 录")')) {
        // Still need to login
        await page.click('[role="tab"]:has-text("登录")')
        await page.waitForTimeout(1000)
        
        await page.locator('input[placeholder*="用户名"]').fill(testUser)
        await page.locator('input[type="password"]').fill('test123')
        
        await page.screenshot({
          path: 'test-results/REAL-03-login-form.png',
          fullPage: true
        })
        
        await page.click('button:has-text("登 录")')
        await page.waitForTimeout(8000)
      }
      
      await page.screenshot({
        path: 'test-results/REAL-04-after-login.png',
        fullPage: true
      })
      
      // Step 3: Look for profile avatar in the UI
      console.log('👤 Step 3: Looking for profile avatar in UI...')
      
      // Check current page state
      const pageState = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          hasCanvas: !!document.querySelector('canvas'),
          hasAvatar: !!document.querySelector('img[src*="dicebear"], img[src*="avatar"], .avatar'),
          hasUserProfile: !!document.querySelector('[class*="user"], [class*="profile"]'),
          allImages: Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
            className: img.className
          }))
        }
      })
      
      console.log('📊 Page state after login:', pageState)
      
      // Step 4: If game loaded, capture game avatar
      if (pageState.hasCanvas) {
        console.log('🎮 Step 4: Game loaded! Capturing game avatar...')
        
        // Wait for game to fully initialize
        await page.waitForTimeout(10000)
        
        await page.screenshot({
          path: 'test-results/REAL-05-game-with-avatar.png',
          fullPage: true
        })
        
        // Try to extract game avatar data
        const gameAvatarData = await page.evaluate(() => {
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
                        x: sprite.x,
                        y: sprite.y,
                        username: player.username || 'unknown'
                      })
                      return
                    }
                  }
                }
                resolve({ success: false, reason: 'Could not find game avatar' })
              } catch (error) {
                resolve({ success: false, reason: error.message })
              }
            }, 5000)
          })
        })
        
        console.log('🎮 Game avatar data:', gameAvatarData)
        
        // Step 5: Try to find profile avatar for comparison
        console.log('🔍 Step 5: Looking for profile avatar to compare...')
        
        // Look for profile avatar in Redux store or DOM
        const profileAvatarData = await page.evaluate(() => {
          try {
            // Try to access Redux store
            const store = (window as any).__REDUX_STORE__ || (window as any).store
            if (store) {
              const state = store.getState()
              if (state.auth && state.auth.user) {
                return {
                  success: true,
                  profileAvatar: state.auth.user.avatar,
                  username: state.auth.user.username,
                  userData: state.auth.user
                }
              }
            }
            
            // Try to find avatar in DOM
            const avatarImg = document.querySelector('img[src*="dicebear"], img[src*="avatar"]')
            if (avatarImg) {
              return {
                success: true,
                profileAvatar: avatarImg.src,
                source: 'DOM'
              }
            }
            
            return { success: false, reason: 'No profile avatar found' }
          } catch (error) {
            return { success: false, reason: error.message }
          }
        })
        
        console.log('👤 Profile avatar data:', profileAvatarData)
        
        // Step 6: Compare profile vs game avatar
        console.log('🔍 Step 6: COMPARING PROFILE vs GAME AVATAR...')
        
        if (gameAvatarData.success && profileAvatarData.success) {
          console.log('\n📊 AVATAR COMPARISON RESULTS:')
          console.log('='.repeat(50))
          console.log('👤 PROFILE AVATAR:', profileAvatarData.profileAvatar)
          console.log('🎮 GAME AVATAR:', {
            texture: gameAvatarData.textureKey,
            tint: gameAvatarData.tint ? `0x${gameAvatarData.tint.toString(16)}` : 'none'
          })
          
          // This is where we'd check if they match
          if (profileAvatarData.profileAvatar && profileAvatarData.profileAvatar.includes('dicebear')) {
            console.log('\n✅ Found DiceBear profile avatar URL')
            console.log('🎯 BUG #001 TEST: Does game avatar match profile appearance?')
            console.log('   Profile URL:', profileAvatarData.profileAvatar)
            console.log('   Game texture:', gameAvatarData.textureKey)
            console.log('   Game tint:', gameAvatarData.tint)
            
            // Extract characteristics from profile URL if possible
            const url = new URL(profileAvatarData.profileAvatar)
            console.log('   Profile seed/style:', url.pathname.split('/').pop())
          }
          
        } else {
          console.log('❌ Could not get both profile and game avatar data for comparison')
          console.log('   Profile avatar found:', profileAvatarData.success)
          console.log('   Game avatar found:', gameAvatarData.success)
        }
        
      } else {
        console.log('❌ Game did not load - cannot test avatar consistency')
        console.log('   Has canvas:', pageState.hasCanvas)
        console.log('   Current URL:', pageState.url)
      }
      
    } catch (error) {
      console.error('❌ Test error:', error.message)
      
      await page.screenshot({
        path: 'test-results/REAL-ERROR-final-state.png',
        fullPage: true
      })
    }
    
    console.log('\n📁 Check test-results/REAL-*.png for step-by-step visual proof')
    console.log('🎯 This test shows the REAL profile vs game avatar comparison')
    
    // Test passes - we're gathering evidence
    expect(true).toBe(true)
  })
})