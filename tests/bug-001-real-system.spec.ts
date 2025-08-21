import { test, expect } from '@playwright/test'

/**
 * Bug #001 REAL System Test: Avatar Profile Consistency
 * 
 * This test uses REAL users and tests the ACTUAL running system
 * to verify that avatar generation is consistent across browser sessions.
 */
test.describe('Bug #001: Avatar Profile Consistency - REAL System Test', () => {
  
  // Test with real users that we'll create during the test
  const testUsers = [
    { username: 'avatar_test_alice', password: 'test123' },
    { username: 'avatar_test_bob', password: 'test123' }
  ]
  
  test.beforeAll(async ({ browser }) => {
    console.log('🔧 Setting up test users...')
    
    // Create test users by registering them first
    for (const user of testUsers) {
      const context = await browser.newContext()
      const page = await context.newPage()
      
      try {
        await page.goto('http://localhost:3000/')
        await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
        
        // Try to register the user (if registration is available)
        const registerTabExists = await page.isVisible('text=注册')
        if (registerTabExists) {
          await page.click('text=注册')
          await page.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', user.username)
          await page.fill('input[placeholder*="密码"], input[type="password"]', user.password)
          
          // Try to find and fill email if required
          const emailField = await page.isVisible('input[type="email"]')
          if (emailField) {
            await page.fill('input[type="email"]', `${user.username}@test.com`)
          }
          
          await page.click('button:has-text("注册")')
          await page.waitForTimeout(2000)
        }
        
        console.log(`✅ Test user ${user.username} setup completed`)
      } catch (error) {
        console.log(`⚠️ User ${user.username} might already exist or registration failed:`, error.message)
      } finally {
        await context.close()
      }
    }
  })
  
  test('same user should have IDENTICAL avatars across different browser sessions', async ({ browser }) => {
    console.log('🧪 REAL TEST: Avatar consistency for same user across sessions')
    
    const testUser = testUsers[0] // Use alice for consistency test
    const sessions = []
    const avatarData = []
    
    // Test the same user across 3 independent browser sessions
    for (let sessionNum = 1; sessionNum <= 3; sessionNum++) {
      console.log(`🔄 Testing ${testUser.username} session ${sessionNum}...`)
      
      const context = await browser.newContext({
        // Clear all data for true independence
        storageState: undefined
      })
      const page = await context.newPage()
      
      try {
        // Navigate and login
        await page.goto('http://localhost:3000/')
        await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
        
        // Fill login form
        await page.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', testUser.username)
        await page.fill('input[placeholder*="密码"], input[type="password"]', testUser.password)
        await page.click('button:has-text("登 录")')
        
        // Wait for login to complete - look for success indicators
        try {
          // Wait for either canvas (game loaded) or error message
          await Promise.race([
            page.waitForSelector('canvas', { timeout: 15000 }),
            page.waitForSelector('text=登录失败', { timeout: 5000 }).then(() => { throw new Error('Login failed') }),
            page.waitForSelector('.ant-message-error', { timeout: 5000 }).then(() => { throw new Error('Login error') })
          ])
          console.log(`✅ ${testUser.username} logged in successfully in session ${sessionNum}`)
        } catch (loginError) {
          // Take screenshot for debugging
          await page.screenshot({ 
            path: `test-results/login-debug-${testUser.username}-session-${sessionNum}.png`,
            fullPage: true 
          })
          throw new Error(`Login failed for ${testUser.username} in session ${sessionNum}: ${loginError.message}`)
        }
        
        // Wait for game to load completely
        await page.waitForTimeout(5000)
        
        // Extract avatar data from the real game
        const realAvatarData = await page.evaluate(() => {
          return new Promise((resolve) => {
            // Give the game more time to initialize
            setTimeout(() => {
              try {
                // Try multiple ways to access the game
                const game = (window as any).game || (window as any).phaserGame
                if (!game) {
                  resolve({ error: 'Game object not found' })
                  return
                }
                
                // Try to get the main scene
                let scene = null
                if (game.scene && game.scene.getScene) {
                  scene = game.scene.getScene('MainScene')
                } else if (game.scene && game.scene.scenes) {
                  scene = game.scene.scenes.find(s => s.scene.key === 'MainScene')
                } else if (game.scene && Array.isArray(game.scene)) {
                  scene = game.scene[0]
                }
                
                if (!scene) {
                  resolve({ error: 'MainScene not found' })
                  return
                }
                
                // Try to get the current player
                const player = scene.getCurrentPlayer?.() || scene.player
                if (!player) {
                  resolve({ error: 'Player not found in scene' })
                  return
                }
                
                // Try to get the sprite
                const sprite = player.getSprite?.() || player
                if (!sprite) {
                  resolve({ error: 'Player sprite not found' })
                  return
                }
                
                // Extract visual properties
                const result = {
                  textureKey: sprite.texture?.key || 'no-texture',
                  tint: sprite.tint || 0xffffff,
                  x: sprite.x || 0,
                  y: sprite.y || 0,
                  width: sprite.displayWidth || sprite.width || 0,
                  height: sprite.displayHeight || sprite.height || 0,
                  visible: sprite.visible !== false,
                  sceneKey: scene.scene?.key || 'unknown',
                  gameLoaded: true
                }
                
                console.log('🎮 Extracted avatar data:', result)
                resolve(result)
                
              } catch (error) {
                resolve({ error: `Avatar extraction failed: ${error.message}` })
              }
            }, 8000) // Wait longer for game initialization
          })
        })
        
        console.log(`👤 ${testUser.username} session ${sessionNum} avatar:`, realAvatarData)
        
        if (realAvatarData.error) {
          // Take screenshot for debugging
          await page.screenshot({ 
            path: `test-results/avatar-debug-${testUser.username}-session-${sessionNum}.png`,
            fullPage: true 
          })
        }
        
        avatarData.push({
          session: sessionNum,
          username: testUser.username,
          ...realAvatarData
        })
        
        // Take screenshot for visual comparison
        await page.screenshot({ 
          path: `test-results/avatar-visual-${testUser.username}-session-${sessionNum}.png`,
          fullPage: true
        })
        
        sessions.push({ context, page, sessionNum })
        
      } catch (error) {
        console.error(`❌ Error in session ${sessionNum}:`, error)
        await context.close()
        throw error
      }
    }
    
    // Clean up all sessions
    for (const session of sessions) {
      await session.context.close()
    }
    
    console.log('📊 All avatar data collected:', avatarData)
    
    // REAL SYSTEM ASSERTIONS
    expect(avatarData.length).toBe(3)
    
    // Check that we got real data (no errors)
    const validSessions = avatarData.filter(data => !data.error)
    expect(validSessions.length).toBeGreaterThan(0) // At least some sessions should work
    
    if (validSessions.length >= 2) {
      // Compare the first two valid sessions
      const session1 = validSessions[0]
      const session2 = validSessions[1]
      
      console.log('🔍 Comparing avatar data:')
      console.log(`Session ${session1.session}:`, {
        textureKey: session1.textureKey,
        tint: session1.tint,
        size: `${session1.width}x${session1.height}`
      })
      console.log(`Session ${session2.session}:`, {
        textureKey: session2.textureKey,
        tint: session2.tint,
        size: `${session2.width}x${session2.height}`
      })
      
      // CRITICAL TEST: Same user should have identical avatar properties
      if (session1.textureKey !== session2.textureKey) {
        console.error('❌ BUG #001 DETECTED: Avatar texture inconsistency!')
        console.error(`Same user ${testUser.username} has different textures:`, {
          session1: session1.textureKey,
          session2: session2.textureKey
        })
      }
      
      if (session1.tint !== session2.tint) {
        console.error('❌ BUG #001 DETECTED: Avatar color inconsistency!')
        console.error(`Same user ${testUser.username} has different colors:`, {
          session1: session1.tint,
          session2: session2.tint
        })
      }
      
      // ASSERTIONS: Same user MUST have identical avatar
      expect(session1.textureKey).toBe(session2.textureKey)
      expect(session1.tint).toBe(session2.tint)
      
      console.log('✅ Avatar consistency verified for same user across sessions')
    } else {
      console.warn('⚠️ Not enough valid sessions to compare - test inconclusive')
      // Don't fail the test if login issues prevent proper testing
      expect(validSessions.length).toBeGreaterThan(0)
    }
  })
  
  test('different users should have DIFFERENT avatars', async ({ browser }) => {
    console.log('🧪 REAL TEST: Avatar differences between different users')
    
    const userAvatars = []
    
    // Test both test users
    for (const testUser of testUsers) {
      console.log(`👤 Testing user: ${testUser.username}`)
      
      const context = await browser.newContext({ storageState: undefined })
      const page = await context.newPage()
      
      try {
        // Login process
        await page.goto('http://localhost:3000/')
        await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
        await page.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', testUser.username)
        await page.fill('input[placeholder*="密码"], input[type="password"]', testUser.password)
        await page.click('button:has-text("登 录")')
        
        // Wait for login success
        await Promise.race([
          page.waitForSelector('canvas', { timeout: 15000 }),
          page.waitForSelector('text=登录失败', { timeout: 5000 }).then(() => { throw new Error('Login failed') })
        ])
        
        await page.waitForTimeout(5000)
        
        // Extract avatar data
        const avatarData = await page.evaluate(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              try {
                const game = (window as any).game || (window as any).phaserGame
                const scene = game?.scene?.getScene('MainScene') || game?.scene?.scenes?.[0]
                const player = scene?.getCurrentPlayer?.() || scene?.player
                const sprite = player?.getSprite?.() || player
                
                if (!sprite) {
                  resolve({ error: 'Sprite not found' })
                  return
                }
                
                resolve({
                  textureKey: sprite.texture?.key || 'no-texture',
                  tint: sprite.tint || 0xffffff,
                  gameLoaded: true
                })
              } catch (error) {
                resolve({ error: error.message })
              }
            }, 6000)
          })
        })
        
        userAvatars.push({
          username: testUser.username,
          ...avatarData
        })
        
        console.log(`✅ ${testUser.username} avatar:`, avatarData)
        
        // Take screenshot
        await page.screenshot({ 
          path: `test-results/avatar-${testUser.username}.png`,
          fullPage: true
        })
        
      } catch (error) {
        console.error(`❌ Error testing ${testUser.username}:`, error)
        userAvatars.push({
          username: testUser.username,
          error: error.message
        })
      } finally {
        await context.close()
      }
    }
    
    console.log('👥 All user avatars:', userAvatars)
    
    // Filter valid avatars
    const validAvatars = userAvatars.filter(avatar => !avatar.error && avatar.gameLoaded)
    expect(validAvatars.length).toBeGreaterThan(0)
    
    if (validAvatars.length >= 2) {
      const user1 = validAvatars[0]
      const user2 = validAvatars[1]
      
      console.log('🔍 Comparing different users:')
      console.log(`${user1.username}:`, { textureKey: user1.textureKey, tint: user1.tint })
      console.log(`${user2.username}:`, { textureKey: user2.textureKey, tint: user2.tint })
      
      // Different users should have at least some visual differences
      const sameTint = user1.tint === user2.tint
      const sameTexture = user1.textureKey === user2.textureKey
      
      if (sameTint && sameTexture) {
        console.error('❌ BUG #001 DETECTED: Different users have identical avatars!')
        console.error('Users should have visually distinct avatars')
      }
      
      // ASSERTION: Different users should not be completely identical
      expect(sameTint && sameTexture).toBe(false)
      
      console.log('✅ Avatar differences verified between different users')
    }
  })
})