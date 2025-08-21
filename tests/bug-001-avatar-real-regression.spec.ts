import { test, expect } from '@playwright/test'

// Define interfaces for type safety
interface AvatarData {
  error?: string
  sessionNumber?: string | number
  textureKey?: string
  displayWidth?: number
  displayHeight?: number
  tint?: number
  avatarConfig?: any
  position?: { x: number; y: number }
  timestamp?: number
}

interface SessionData {
  session: number
  error?: string
  sessionNumber?: string | number
  textureKey?: string
  displayWidth?: number
  displayHeight?: number
  tint?: number
  avatarConfig?: any
  position?: { x: number; y: number }
  timestamp?: number
}

interface UserAvatarData {
  username: string
  error?: string
  textureKey?: string
  tint?: number
}

declare global {
  interface Window {
    sessionNum?: number
    isTestEnvironment?: boolean
  }
}

/**
 * Bug #001 Regression Test: Avatar Profile Inconsistency
 * 
 * REAL TEST: This test verifies that the same user gets identical avatars
 * across different browser sessions and that avatar generation is deterministic.
 */
test.describe('Bug #001: Avatar Profile Inconsistency - REAL Regression Test', () => {
  
  test('should generate IDENTICAL avatars for same user across different browser sessions', async ({ browser }) => {
    console.log('🧪 Bug #001 REAL Regression: Testing avatar consistency for same user across sessions')
    
    // Test the same user (anna) across multiple independent browser contexts
    const sessions: Array<{ context: any; page: any; sessionNum: number }> = []
    const avatarData: SessionData[] = []
    
    for (let sessionNum = 1; sessionNum <= 2; sessionNum++) { // Reduced to 2 sessions for faster testing
      console.log(`🔄 Testing anna session ${sessionNum}...`)
      
      // Create completely independent browser context for each session
      const context = await browser.newContext()
      const page = await context.newPage()
      
      try {
        // Navigate and login as anna
        await page.goto('http://localhost:3000/')
        
        // Wait for the welcome text
        await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
        
        // Fill in credentials
        await page.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', 'anna')
        await page.fill('input[placeholder*="密码"], input[type="password"]', 'annapass123')
        
        // Click login
        await page.click('button:has-text("登 录")')
        
        // Wait for either canvas or error message, with longer timeout
        try {
          await page.waitForSelector('canvas', { timeout: 20000 })
          console.log(`✅ Canvas loaded for anna session ${sessionNum}`)
        } catch (canvasError) {
          console.log(`⚠️ Canvas not found, checking for other elements...`)
          
          // Take a screenshot to see what's happening
          await page.screenshot({ 
            path: `test-results/debug-anna-session-${sessionNum}.png`,
            fullPage: true
          })
          
          // Check if login failed or if we're still on login page
          const loginVisible = await page.isVisible('button:has-text("登 录")')
          if (loginVisible) {
            throw new Error(`Login failed for anna session ${sessionNum}`)
          }
          
          // If login succeeded but no canvas, maybe the game is loading
          await page.waitForTimeout(5000)
          console.log(`⏳ Waiting additional time for game to load...`)
        }
        
        // Wait for game to fully load
        await page.waitForTimeout(3000)
        
        // Extract REAL avatar configuration from the actual game
        const realAvatarData = await page.evaluate(() => {
          return new Promise<AvatarData>((resolve) => {
            setTimeout(() => {
              try {
                // Try multiple ways to access the game
                const game = (window as any).game || (window as any).phaserGame
                console.log('🎮 Game object:', game)
                
                if (!game) {
                  resolve({ error: 'Game not found' })
                  return
                }
                
                const scene = game.scene?.getScene('MainScene') || game.scene?.scenes?.[0]
                if (!scene) {
                  resolve({ error: 'Scene not found' })
                  return
                }
                
                const player = scene.getCurrentPlayer?.() || scene.player
                if (!player) {
                  resolve({ error: 'Player not found' })
                  return
                }
                
                const sprite = player.getSprite?.() || player
                if (!sprite) {
                  resolve({ error: 'Sprite not found' })
                  return
                }
                
                // Get the actual texture key and visual properties
                const textureKey = sprite.texture?.key
                const displayWidth = sprite.displayWidth
                const displayHeight = sprite.displayHeight
                const tint = sprite.tint
                
                // Try to get the avatar config if available
                let avatarConfig: any = null
                try {
                  // Access the avatar configuration if it's stored on the player
                  avatarConfig = (player as any).avatarConfig || 
                               (scene as any).currentUserAvatarConfig ||
                               'not-available'
                } catch (e) {
                  avatarConfig = 'error-accessing'
                }
                
                resolve({
                  sessionNumber: window.sessionNum || sessionNum,
                  textureKey,
                  displayWidth,
                  displayHeight,
                  tint,
                  avatarConfig,
                  position: { x: sprite.x, y: sprite.y },
                  timestamp: Date.now()
                })
              } catch (error) {
                resolve({ error: error.toString() })
              }
            }, 3000) // Wait longer for avatar to be fully rendered
          })
        })
        
        console.log(`👤 Anna session ${sessionNum} avatar data:`, realAvatarData)
        avatarData.push({
          session: sessionNum,
          ...realAvatarData
        })
        
        // Take a screenshot of the actual game for visual comparison
        const screenshotPath = `test-results/anna-avatar-session-${sessionNum}.png`
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true // Capture full page to see the entire game
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
    
    // CRITICAL ASSERTIONS for Bug #001
    expect(avatarData.length).toBe(2)
    
    // Verify no errors occurred
    for (const data of avatarData) {
      expect(data.error).toBeUndefined()
    }
    
    // MAIN TEST: All sessions should have IDENTICAL avatar data
    const firstSession = avatarData[0]
    const secondSession = avatarData[1]
    
    // Check texture consistency
    if (firstSession.textureKey !== secondSession.textureKey) {
      console.error('❌ BUG #001 DETECTED: Avatar texture inconsistency!')
      console.log('Session 1 texture:', firstSession.textureKey)
      console.log('Session 2 texture:', secondSession.textureKey)
    }
    
    // Check visual properties consistency
    if (firstSession.tint !== secondSession.tint) {
      console.error('❌ BUG #001 DETECTED: Avatar tint/color inconsistency!')
      console.log('Session 1 tint:', firstSession.tint)
      console.log('Session 2 tint:', secondSession.tint)
    }
    
    // Check avatar config consistency (if available)
    if (firstSession.avatarConfig !== 'not-available' && 
        firstSession.avatarConfig !== 'error-accessing') {
      if (JSON.stringify(firstSession.avatarConfig) !== JSON.stringify(secondSession.avatarConfig)) {
        console.error('❌ BUG #001 DETECTED: Avatar configuration inconsistency!')
        console.log('Session 1 config:', firstSession.avatarConfig)
        console.log('Session 2 config:', secondSession.avatarConfig)
      }
    }
    
    // ASSERT: Texture keys must be identical across all sessions
    expect(firstSession.textureKey).toBe(secondSession.textureKey)
    
    // ASSERT: Visual properties must be identical across all sessions
    expect(firstSession.tint).toBe(secondSession.tint)
    
    console.log('✅ Bug #001 test completed - avatar consistency verified')
  })
  
  test('should generate DIFFERENT avatars for different users', async ({ browser }) => {
    console.log('🧪 Bug #001 REAL Regression: Testing avatar differences between leon and anna')
    
    // Test different users to ensure they have different avatars
    const users = ['leon', 'anna', 'testuser']
    const userAvatars: UserAvatarData[] = []
    
    for (const username of users) {
      console.log(`👤 Testing user: ${username}`)
      
      const context = await browser.newContext()
      const page = await context.newPage()
      
      try {
        await page.goto('http://localhost:3000/')
        await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
        await page.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', username)
        await page.fill('input[placeholder*="密码"], input[type="password"]', 'testpass123')
        await page.click('button:has-text("登 录")')
        await page.waitForSelector('canvas', { timeout: 15000 })
        await page.waitForTimeout(5000)
        
        const avatarData = await page.evaluate(() => {
          return new Promise<any>((resolve) => {
            setTimeout(() => {
              try {
                const scene = (window as any).game?.scene?.getScene('MainScene')
                const player = scene?.getCurrentPlayer?.()
                const sprite = player?.getSprite()
                
                if (!sprite) {
                  resolve({ error: 'No sprite found' })
                  return
                }
                
                resolve({
                  textureKey: sprite.texture?.key,
                  tint: sprite.tint,
                  username: 'extracted-from-game'
                })
              } catch (error) {
                resolve({ error: error.toString() })
              }
            }, 2000)
          })
        })
        
        userAvatars.push({
          username,
          error: avatarData.error,
          textureKey: avatarData.textureKey,
          tint: avatarData.tint
        })
        
        await context.close()
        
      } catch (error) {
        console.error(`❌ Error testing user ${username}:`, error)
        await context.close()
        throw error
      }
    }
    
    console.log('👥 All user avatars:', userAvatars)
    
    // Verify different users have different avatars
    expect(userAvatars.length).toBe(3)
    
    // Check that users have different texture keys or tints
    const textureKeys = userAvatars.map(u => u.textureKey)
    const tints = userAvatars.map(u => u.tint)
    
    // At least some users should have different avatars
    const allSameTexture = textureKeys.every(t => t === textureKeys[0])
    const allSameTint = tints.every(t => t === tints[0])
    
    if (allSameTexture && allSameTint) {
      console.error('❌ BUG #001 DETECTED: All users have identical avatars!')
      console.log('All textures:', textureKeys)
      console.log('All tints:', tints)
    }
    
    // Different users should have some visual differences
    expect(allSameTexture && allSameTint).toBe(false)
  })
  
  test.beforeEach(async ({ page }) => {
    // Set a flag to help identify test sessions
    await page.addInitScript(() => {
      (window as any).isTestEnvironment = true
    })
  })
})