import { test, expect } from '@playwright/test'

// Extend Window interface to include game property
declare global {
  interface Window {
    game?: {
      scene?: {
        getScene(key: string): any
      }
    }
  }
}

/**
 * Bug #001 Regression Test: Avatar Profile Inconsistency
 * 
 * This test specifically validates that different users have distinct avatar appearances
 * and that avatars are consistent with user profiles.
 */
test.describe('Bug #001: Avatar Profile Inconsistency - Regression Test', () => {
  
  test('should generate distinct avatars for leon and anna users', async ({ page }) => {
    console.log('🧪 Bug #001 Regression: Testing avatar distinctiveness between leon and anna')
    
    // Test data for known users
    const users = [
      { username: 'leon', password: 'leonpass123' },
      { username: 'anna', password: 'annapass123' }
    ]
    
    const avatarData: any[] = []
    
    // Function to extract avatar configuration from console logs
    const extractAvatarConfig = (logs: string[]) => {
      const avatarLogs = logs.filter(log => 
        log.includes('Avatar config') || 
        log.includes('generateAvatarConfig') ||
        log.includes('shirt') ||
        log.includes('colors')
      )
      return avatarLogs
    }
    
    // Test both users sequentially
    for (const user of users) {
      const userLogs: string[] = []
      
      // Capture console logs for avatar generation
      page.on('console', (msg) => {
        const text = msg.text()
        userLogs.push(text)
      })
      
      // Login as user
      await page.goto('/')
      await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', user.username)
      await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', user.password)
      await page.click('button:has-text(\"登 录\")')
      await page.waitForSelector('canvas', { timeout: 15000 })
      await page.waitForTimeout(3000)
      
      // Extract avatar configuration
      const avatarTestScript = `
        (function() {
          const scene = window.game?.scene?.getScene('MainScene');
          if (!scene) return { error: 'Scene not found' };
          
          const player = scene.getCurrentPlayer?.();
          if (!player) return { error: 'Player not found' };
          
          // Try to access avatar configuration
          const sprite = player.getSprite();
          return {
            username: '${user.username}',
            playerExists: !!player,
            spriteExists: !!sprite,
            spriteTexture: sprite?.texture?.key || 'unknown',
            position: { x: sprite?.x || 0, y: sprite?.y || 0 },
            // Extract any avatar-related data from the scene
            avatarGenerator: !!scene.avatarGenerator,
            timestamp: Date.now()
          };
        })()
      `
      
      const avatarInfo = await page.evaluate(avatarTestScript)
      avatarData.push({
        ...(avatarInfo as object),
        logs: extractAvatarConfig(userLogs)
      })
      
      console.log(`🎨 ${user.username} avatar info:`, avatarInfo)
      
      // Logout/cleanup for next user
      await page.goto('/')
    }
    
    // Validate avatar distinctiveness
    console.log('📊 Avatar comparison data:', avatarData)
    
    // Test assertions for Bug #001
    expect(avatarData).toHaveLength(2)
    expect(avatarData[0].playerExists).toBe(true)
    expect(avatarData[1].playerExists).toBe(true)
    
    // Check that avatars have different configurations
    const leon = avatarData.find(a => a.username === 'leon')
    const anna = avatarData.find(a => a.username === 'anna')
    
    expect(leon).toBeDefined()
    expect(anna).toBeDefined()
    
    // Critical test: avatars should have different textures/appearances
    const avatarsDifferent = leon.spriteTexture !== anna.spriteTexture ||
                            JSON.stringify(leon.logs) !== JSON.stringify(anna.logs)
    
    if (!avatarsDifferent) {
      console.error('❌ BUG #001 DETECTED: Leon and Anna have identical avatars!')
      console.log('Leon texture:', leon.spriteTexture)
      console.log('Anna texture:', anna.spriteTexture)
      console.log('Leon logs:', leon.logs)
      console.log('Anna logs:', anna.logs)
    }
    
    expect(avatarsDifferent).toBe(true)
  })
  
  test('should maintain avatar consistency across sessions', async ({ page }) => {
    console.log('🧪 Bug #001 Regression: Testing avatar session consistency')
    
    const user = { username: 'consistency_test_user', password: 'testpass123' }
    const sessions: any[] = []
    
    // Test same user across multiple sessions
    for (let session = 1; session <= 2; session++) {
      await page.goto('/')
      await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', user.username)
      await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', user.password)
      await page.click('button:has-text(\"登 录\")')
      await page.waitForSelector('canvas', { timeout: 15000 })
      await page.waitForTimeout(3000)
      
      const sessionData = await page.evaluate(() => {
        const scene = (window as any).game?.scene?.getScene('MainScene');
        const player = scene?.getCurrentPlayer?.();
        const sprite = player?.getSprite();
        return {
          spriteTexture: sprite?.texture?.key || 'unknown',
          position: { x: sprite?.x || 0, y: sprite?.y || 0 }
        };
      })
      
      sessions.push({ session, ...sessionData })
      console.log(`Session ${session} data:`, sessionData)
      
      // Logout between sessions
      await page.goto('/')
    }
    
    // Avatar should be consistent across sessions
    expect(sessions[0].spriteTexture).toBe(sessions[1].spriteTexture)
  })
})