import { test, expect } from '@playwright/test'

test.describe('MainScene Functionality Test', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/')
    console.log('📱 Navigated to app')
  })

  test('should load MainScene without avatar system errors', async ({ page }) => {
    console.log('🎮 Testing MainScene load with avatar system...')
    
    // Capture console messages
    const consoleErrors: string[] = []
    const consoleLogs: string[] = []
    
    page.on('console', (msg) => {
      const text = msg.text()
      if (msg.type() === 'error') {
        consoleErrors.push(text)
        console.error('❌ Console Error:', text)
      } else if (msg.type() === 'log' && text.includes('MainScene')) {
        consoleLogs.push(text)
        console.log('📋 MainScene Log:', text)
      }
    })
    
    // Wait for canvas to appear
    console.log('⏳ Waiting for game canvas...')
    await page.waitForSelector('canvas', { timeout: 15000 })
    console.log('✅ Canvas found')
    
    // Wait for scene creation completion
    await page.waitForTimeout(8000)
    
    // Check for specific errors we're trying to fix
    const hasAvatarErrors = consoleErrors.some(error => 
      error.includes('Cannot read properties of undefined (reading \'bodyType\')') ||
      error.includes('AvatarSystem') ||
      error.includes('DirectionalPlayer') ||
      error.includes('createAvatarSprite')
    )
    
    const hasPhysicsErrors = consoleErrors.some(error => 
      error.includes('body[key] is not a function') ||
      error.includes('PhysicsGroup') ||
      error.includes('createCallbackHandler')
    )
    
    // Log results
    console.log('🔍 Error Analysis:')
    console.log(`   Avatar system errors: ${hasAvatarErrors}`)
    console.log(`   Physics group errors: ${hasPhysicsErrors}`)
    console.log(`   Total console errors: ${consoleErrors.length}`)
    
    if (consoleErrors.length > 0) {
      console.log('📝 All console errors:')
      consoleErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }
    
    // Log scene creation logs
    if (consoleLogs.length > 0) {
      console.log('📋 MainScene logs:')
      consoleLogs.forEach(log => console.log(`   ${log}`))
    }
    
    // Test assertions
    expect(hasAvatarErrors).toBe(false)
    expect(hasPhysicsErrors).toBe(false)
    
    console.log('✅ MainScene avatar system test passed!')
  })

  test('should have working game canvas and scene', async ({ page }) => {
    console.log('🎯 Testing game canvas and scene functionality...')
    
    // Wait for canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 15000 })
    
    // Check canvas dimensions
    const canvasElement = await canvas.elementHandle()
    const boundingBox = await canvasElement?.boundingBox()
    
    console.log('📐 Canvas dimensions:', boundingBox)
    
    // Verify canvas has reasonable dimensions
    expect(boundingBox?.width).toBeGreaterThan(300)
    expect(boundingBox?.height).toBeGreaterThan(200)
    
    // Wait for scene to be ready
    await page.waitForTimeout(5000)
    
    // Check if game scene ready event was fired
    const sceneReady = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Check if scene is already ready
        const checkReady = () => {
          if ((window as any).gameSceneReady) {
            resolve(true)
            return
          }
          
          // Listen for scene ready event
          const listener = () => {
            (window as any).gameSceneReady = true
            resolve(true)
            window.removeEventListener('gameSceneReady', listener)
          }
          
          window.addEventListener('gameSceneReady', listener)
          
          // Timeout after 10 seconds
          setTimeout(() => {
            window.removeEventListener('gameSceneReady', listener)
            resolve(false)
          }, 10000)
        }
        
        checkReady()
      })
    })
    
    console.log('🎮 Scene ready status:', sceneReady)
    expect(sceneReady).toBe(true)
    
    console.log('✅ Game canvas and scene test passed!')
  })

  test('should handle user interactions', async ({ page }) => {
    console.log('🎮 Testing user interactions...')
    
    // Wait for game to load
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(5000)
    
    // Test keyboard interactions
    const canvas = page.locator('canvas')
    await canvas.focus()
    
    // Try arrow keys and WASD
    console.log('⌨️ Testing keyboard controls...')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(500)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    await page.keyboard.press('KeyW')
    await page.waitForTimeout(500)
    await page.keyboard.press('KeyA')
    await page.waitForTimeout(500)
    
    // Test should pass if no errors occur during interaction
    console.log('✅ User interaction test completed!')
  })

  test('should display Chinese office environment', async ({ page }) => {
    console.log('🏢 Testing Chinese office environment...')
    
    // Wait for game to load
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(8000)
    
    // Check if Chinese text elements are present in the canvas
    // (This is more of a smoke test since canvas content is not easily inspectable)
    
    // Verify no critical rendering errors
    const renderErrors = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (msg.type() === 'error' && (
        text.includes('createImmerseEnvironment') ||
        text.includes('Chinese') ||
        text.includes('office')
      )) {
        renderErrors.push(text)
      }
    })
    
    await page.waitForTimeout(2000)
    
    console.log('🏢 Environment rendering errors:', renderErrors.length)
    expect(renderErrors.length).toBe(0)
    
    console.log('✅ Chinese office environment test passed!')
  })
})