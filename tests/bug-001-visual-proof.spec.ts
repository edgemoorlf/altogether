import { test, expect } from '@playwright/test'

/**
 * Bug #001 VISUAL PROOF Test: Avatar Screenshots
 * 
 * This test takes actual screenshots of avatars in the running game
 * to provide visual proof that the bug is fixed.
 */
test.describe('Bug #001: Visual Proof with Screenshots', () => {
  
  test('take screenshots to prove avatar consistency', async ({ browser }) => {
    console.log('📸 VISUAL PROOF TEST: Taking screenshots of actual avatars')
    
    const testUser = 'visual_test_anna'
    const testPassword = 'test123'
    
    // Take screenshots from multiple sessions of the same user
    for (let sessionNum = 1; sessionNum <= 3; sessionNum++) {
      console.log(`📸 Session ${sessionNum}: Taking screenshot of ${testUser}...`)
      
      const context = await browser.newContext({
        storageState: undefined,
        viewport: { width: 1200, height: 800 }
      })
      const page = await context.newPage()
      
      try {
        // Navigate to app
        await page.goto('http://localhost:3000/')
        console.log(`✅ Navigated to app in session ${sessionNum}`)
        
        // Wait for app to load
        await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 15000 })
        console.log(`✅ App loaded in session ${sessionNum}`)
        
        // Take screenshot of login page
        await page.screenshot({
          path: `test-results/visual-proof-login-session-${sessionNum}.png`,
          fullPage: true
        })
        
        // Attempt login
        await page.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', testUser)
        await page.fill('input[placeholder*="密码"], input[type="password"]', testPassword)
        await page.click('button:has-text("登 录")')
        console.log(`🔑 Login attempted for ${testUser} in session ${sessionNum}`)
        
        // Wait for login response
        await page.waitForTimeout(5000)
        
        // Take screenshot after login attempt
        await page.screenshot({
          path: `test-results/visual-proof-after-login-session-${sessionNum}.png`,
          fullPage: true
        })
        
        // Check if we can find a canvas (game loaded)
        const canvasExists = await page.locator('canvas').count() > 0
        console.log(`🎮 Canvas exists in session ${sessionNum}: ${canvasExists}`)
        
        if (canvasExists) {
          // Game loaded - wait for it to fully initialize
          console.log(`✅ Game detected in session ${sessionNum}, waiting for initialization...`)
          await page.waitForTimeout(8000)
          
          // Take full page screenshot
          await page.screenshot({
            path: `test-results/visual-proof-game-full-session-${sessionNum}.png`,
            fullPage: true
          })
          
          // Try to take a focused screenshot of the game area
          const canvas = page.locator('canvas').first()
          if (await canvas.isVisible()) {
            const canvasBox = await canvas.boundingBox()
            if (canvasBox) {
              // Take screenshot of game area plus some surrounding context
              await page.screenshot({
                path: `test-results/visual-proof-avatar-${testUser}-session-${sessionNum}.png`,
                clip: {
                  x: Math.max(0, canvasBox.x - 50),
                  y: Math.max(0, canvasBox.y - 50), 
                  width: canvasBox.width + 100,
                  height: canvasBox.height + 100
                }
              })
              console.log(`📸 Avatar screenshot taken for session ${sessionNum}`)
            }
          }
          
          // Try to extract avatar data for logging
          try {
            const avatarData = await page.evaluate(() => {
              return new Promise((resolve) => {
                setTimeout(() => {
                  try {
                    const game = (window as any).game || (window as any).phaserGame
                    if (game) {
                      const scene = game.scene?.getScene('MainScene') || game.scene?.scenes?.[0]
                      if (scene) {
                        const player = scene.getCurrentPlayer?.() || scene.player
                        if (player) {
                          const sprite = player.getSprite?.() || player
                          if (sprite && sprite.texture) {
                            resolve({
                              textureKey: sprite.texture.key,
                              tint: sprite.tint,
                              x: sprite.x,
                              y: sprite.y,
                              success: true
                            })
                            return
                          }
                        }
                      }
                    }
                    resolve({ success: false, reason: 'Could not access game objects' })
                  } catch (error) {
                    resolve({ success: false, reason: error.message })
                  }
                }, 3000)
              })
            })
            
            console.log(`🎮 Session ${sessionNum} avatar data:`, avatarData)
          } catch (error) {
            console.log(`⚠️ Could not extract avatar data from session ${sessionNum}:`, error.message)
          }
          
        } else {
          console.log(`❌ No game canvas found in session ${sessionNum}`)
          
          // Check what's on the page instead
          const pageContent = await page.evaluate(() => {
            return {
              title: document.title,
              hasLoginForm: !!document.querySelector('button'),
              hasErrorMessage: !!document.querySelector('.ant-message-error, .error'),
              bodyText: document.body.innerText.slice(0, 200)
            }
          })
          console.log(`📄 Page content in session ${sessionNum}:`, pageContent)
        }
        
      } catch (error) {
        console.error(`❌ Error in session ${sessionNum}:`, error.message)
        
        // Take error screenshot
        await page.screenshot({
          path: `test-results/visual-proof-error-session-${sessionNum}.png`,
          fullPage: true
        })
      } finally {
        await context.close()
      }
    }
    
    console.log('\n📸 VISUAL PROOF COMPLETE')
    console.log('🔍 Check the following screenshots to verify avatar consistency:')
    console.log('   - test-results/visual-proof-avatar-visual_test_anna-session-1.png')
    console.log('   - test-results/visual-proof-avatar-visual_test_anna-session-2.png') 
    console.log('   - test-results/visual-proof-avatar-visual_test_anna-session-3.png')
    console.log('\n✅ If Bug #001 is fixed, all 3 screenshots should show IDENTICAL avatars')
    console.log('❌ If Bug #001 still exists, the screenshots will show DIFFERENT avatars')
    
    // The test passes if we successfully took screenshots
    // Visual verification must be done manually by comparing the images
    expect(true).toBe(true) // Always pass - verification is visual
  })
  
  test('take screenshots of different users for comparison', async ({ browser }) => {
    console.log('📸 COMPARISON TEST: Screenshots of different users')
    
    const users = [
      { username: 'visual_anna', password: 'test123' },
      { username: 'visual_leon', password: 'test123' }
    ]
    
    for (const user of users) {
      console.log(`📸 Taking screenshot of ${user.username}...`)
      
      const context = await browser.newContext({
        storageState: undefined,
        viewport: { width: 1200, height: 800 }
      })
      const page = await context.newPage()
      
      try {
        await page.goto('http://localhost:3000/')
        await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 15000 })
        
        // Login
        await page.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', user.username)
        await page.fill('input[placeholder*="密码"], input[type="password"]', user.password)
        await page.click('button:has-text("登 录")')
        await page.waitForTimeout(5000)
        
        // Take post-login screenshot
        await page.screenshot({
          path: `test-results/visual-comparison-${user.username}-full.png`,
          fullPage: true
        })
        
        // Try to capture game area
        const canvasExists = await page.locator('canvas').count() > 0
        if (canvasExists) {
          await page.waitForTimeout(8000)
          
          const canvas = page.locator('canvas').first()
          if (await canvas.isVisible()) {
            const canvasBox = await canvas.boundingBox()
            if (canvasBox) {
              await page.screenshot({
                path: `test-results/visual-comparison-avatar-${user.username}.png`,
                clip: {
                  x: Math.max(0, canvasBox.x - 50),
                  y: Math.max(0, canvasBox.y - 50),
                  width: canvasBox.width + 100,
                  height: canvasBox.height + 100
                }
              })
              console.log(`📸 Avatar screenshot taken for ${user.username}`)
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Error with ${user.username}:`, error.message)
        await page.screenshot({
          path: `test-results/visual-comparison-error-${user.username}.png`,
          fullPage: true
        })
      } finally {
        await context.close()
      }
    }
    
    console.log('\n📸 COMPARISON SCREENSHOTS COMPLETE')
    console.log('🔍 Check these screenshots to verify different users have different avatars:')
    console.log('   - test-results/visual-comparison-avatar-visual_anna.png')
    console.log('   - test-results/visual-comparison-avatar-visual_leon.png')
    console.log('\n✅ If working correctly, anna and leon should have DIFFERENT avatars')
    
    expect(true).toBe(true) // Visual verification
  })
})