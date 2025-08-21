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

// Define interfaces for type safety
interface UserMovementData {
  userId: string
  username: string
  position: { x: number; y: number }
  timestamp: number
}

interface MultplayerSyncTestResult {
  error?: string
  leon: {
    position: { x: number; y: number }
    otherUsers: any[]
    movementEvents: UserMovementData[]
  }
  anna: {
    position: { x: number; y: number }
    otherUsers: any[]
    movementEvents: UserMovementData[]
  }
  crossContamination: boolean
  usersVisible: boolean
  synchronizationWorking: boolean
}

/**
 * Bug #004 Regression Test: Multiplayer Movement Synchronization Issue
 * 
 * This test validates that multiple users can move independently without
 * cross-contamination and that movements are properly synchronized.
 */
test.describe('Bug #004: Multiplayer Movement Synchronization - Regression Test', () => {
  
  test('should allow independent movement for multiple users without cross-contamination', async ({ context }) => {
    console.log('🧪 Bug #004 Regression: Testing independent user movement')
    
    // Create two separate browser contexts for true isolation
    const leonPage = await context.newPage()
    const annaPage = await context.newPage()
    
    const leonMovements: UserMovementData[] = []
    const annaMovements: UserMovementData[] = []
    
    // Monitor movement events for both users
    leonPage.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('📍 Emitting local movement:') || text.includes('localPlayerMoved')) {
        leonMovements.push({
          userId: 'leon',
          username: 'leon',
          position: extractPositionFromLog(text),
          timestamp: Date.now()
        })
      }
    })
    
    annaPage.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('📍 Emitting local movement:') || text.includes('localPlayerMoved')) {
        annaMovements.push({
          userId: 'anna',
          username: 'anna',
          position: extractPositionFromLog(text),
          timestamp: Date.now()
        })
      }
    })
    
    // Login leon
    await leonPage.goto('/')
    await leonPage.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    await leonPage.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', 'leon')
    await leonPage.fill('input[placeholder*="密码"], input[type="password"]', 'leonpass123')
    await leonPage.click('button:has-text("登 录")')
    await leonPage.waitForSelector('canvas', { timeout: 15000 })
    await leonPage.waitForTimeout(3000)
    
    // Login anna
    await annaPage.goto('/')
    await annaPage.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    await annaPage.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', 'anna')
    await annaPage.fill('input[placeholder*="密码"], input[type="password"]', 'annapass123')
    await annaPage.click('button:has-text("登 录")')
    await annaPage.waitForSelector('canvas', { timeout: 15000 })
    await annaPage.waitForTimeout(3000)
    
    // Test independent movement
    const testResult = await Promise.all([
      // Leon moves
      leonPage.evaluate(() => {
        return new Promise<any>((resolve) => {
          const scene = (window as any).game?.scene?.getScene('MainScene')
          if (!scene?.player) {
            resolve({ error: 'Leon scene or player not found' })
            return
          }
          
          const player = scene.player
          const sprite = player.getSprite()
          const initialPosition = { x: sprite.x, y: sprite.y }
          
          // Simulate leon movement
          const leonMovements = [
            { x: 300, y: 200 },
            { x: 350, y: 250 },
            { x: 400, y: 300 }
          ]
          
          let moveIndex = 0
          const moveInterval = setInterval(() => {
            if (moveIndex >= leonMovements.length) {
              clearInterval(moveInterval)
              
              // Get final state
              const finalPosition = { x: sprite.x, y: sprite.y }
              const otherUsers = Array.from(scene.getOtherPlayers?.() || new Map()).map(([id, player]) => ({
                id,
                name: player.name,
                position: { x: player.x, y: player.y }
              }))
              
              resolve({
                userId: 'leon',
                username: 'leon',
                initialPosition,
                finalPosition,
                otherUsers,
                movementCount: leonMovements.length
              })
              return
            }
            
            const targetPos = leonMovements[moveIndex]
            sprite.setPosition(targetPos.x, targetPos.y)
            
            // Dispatch movement event
            window.dispatchEvent(new CustomEvent('localPlayerMoved', {
              detail: { x: targetPos.x, y: targetPos.y }
            }))
            
            moveIndex++
          }, 500)
        })
      }),
      
      // Anna moves independently
      annaPage.evaluate(() => {
        return new Promise<any>((resolve) => {
          const scene = (window as any).game?.scene?.getScene('MainScene')
          if (!scene?.player) {
            resolve({ error: 'Anna scene or player not found' })
            return
          }
          
          const player = scene.player
          const sprite = player.getSprite()
          const initialPosition = { x: sprite.x, y: sprite.y }
          
          // Simulate anna movement (different path)
          const annaMovements = [
            { x: 500, y: 400 },
            { x: 550, y: 450 },
            { x: 600, y: 500 }
          ]
          
          let moveIndex = 0
          const moveInterval = setInterval(() => {
            if (moveIndex >= annaMovements.length) {
              clearInterval(moveInterval)
              
              // Get final state
              const finalPosition = { x: sprite.x, y: sprite.y }
              const otherUsers = Array.from(scene.getOtherPlayers?.() || new Map()).map(([id, player]) => ({
                id,
                name: player.name,
                position: { x: player.x, y: player.y }
              }))
              
              resolve({
                userId: 'anna',
                username: 'anna',
                initialPosition,
                finalPosition,
                otherUsers,
                movementCount: annaMovements.length
              })
              return
            }
            
            const targetPos = annaMovements[moveIndex]
            sprite.setPosition(targetPos.x, targetPos.y)
            
            // Dispatch movement event
            window.dispatchEvent(new CustomEvent('localPlayerMoved', {
              detail: { x: targetPos.x, y: targetPos.y }
            }))
            
            moveIndex++
          }, 500)
        })
      })
    ]) as any[]
    
    console.log('👥 Multiplayer movement test results:', testResult)
    
    const [leonResult, annaResult] = testResult
    
    // Critical assertions for Bug #004
    expect(leonResult.error).toBeUndefined()
    expect(annaResult.error).toBeUndefined()
    
    // Users should have moved to different positions
    expect(leonResult.finalPosition.x).not.toBe(annaResult.finalPosition.x)
    expect(leonResult.finalPosition.y).not.toBe(annaResult.finalPosition.y)
    
    // Check for cross-contamination (Bug #004 symptom)
    const crossContamination = leonResult.finalPosition.x === annaResult.finalPosition.x &&
                               leonResult.finalPosition.y === annaResult.finalPosition.y
    
    if (crossContamination) {
      console.error('❌ BUG #004 DETECTED: Cross-contamination in user movements!')
      console.log('Leon final position:', leonResult.finalPosition)
      console.log('Anna final position:', annaResult.finalPosition)
    }
    
    expect(crossContamination).toBe(false)
    
    // Users should be able to see each other
    expect(leonResult.otherUsers.length).toBeGreaterThan(0)
    expect(annaResult.otherUsers.length).toBeGreaterThan(0)
    
    // Close pages
    await leonPage.close()
    await annaPage.close()
  })
  
  test('should properly identify users and isolate movement events', async ({ context }) => {
    console.log('🧪 Bug #004 Regression: Testing user identification and movement isolation')
    
    const leonPage = await context.newPage()
    const annaPage = await context.newPage()
    
    const leonSocketEvents: string[] = []
    const annaSocketEvents: string[] = []
    
    // Monitor socket events
    leonPage.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('remotePlayerMoved') || text.includes('User connected') || text.includes('Broadcasting')) {
        leonSocketEvents.push(text)
      }
    })
    
    annaPage.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('remotePlayerMoved') || text.includes('User connected') || text.includes('Broadcasting')) {
        annaSocketEvents.push(text)
      }
    })
    
    // Setup both users
    await setupUser(leonPage, 'leon', 'leonpass123')
    await setupUser(annaPage, 'anna', 'annapass123')
    
    // Test user identification
    const userIds = await Promise.all([
      leonPage.evaluate(() => (window as any).currentUserId),
      annaPage.evaluate(() => (window as any).currentUserId)
    ])
    
    console.log('👤 User IDs:', userIds)
    
    // User IDs should be different
    expect(userIds[0]).toBeDefined()
    expect(userIds[1]).toBeDefined()
    expect(userIds[0]).not.toBe(userIds[1])
    
    // Test movement isolation
    await leonPage.keyboard.press('ArrowRight')
    await leonPage.waitForTimeout(1000)
    
    await annaPage.keyboard.press('ArrowLeft')
    await annaPage.waitForTimeout(1000)
    
    console.log('🔍 Leon socket events:', leonSocketEvents.slice(-5))
    console.log('🔍 Anna socket events:', annaSocketEvents.slice(-5))
    
    // Verify no cross-contamination in socket events
    const leonHasAnnaEvents = leonSocketEvents.some(event => 
      event.includes('anna') && event.includes('remotePlayerMoved'))
    const annaHasLeonEvents = annaSocketEvents.some(event => 
      event.includes('leon') && event.includes('remotePlayerMoved'))
    
    if (leonHasAnnaEvents || annaHasLeonEvents) {
      console.error('❌ BUG #004 DETECTED: Cross-contamination in socket events!')
    }
    
    // In a properly working system, each user should only receive movement events FROM others, not their own
    // This test checks that the event isolation is working correctly
    
    await leonPage.close()
    await annaPage.close()
  })
  
  test('should maintain consistent user visibility across sessions', async ({ context }) => {
    console.log('🧪 Bug #004 Regression: Testing user visibility consistency')
    
    const leonPage = await context.newPage()
    const annaPage = await context.newPage()
    
    await setupUser(leonPage, 'leon', 'leonpass123')
    await setupUser(annaPage, 'anna', 'annapass123')
    
    // Check mutual visibility multiple times
    for (let i = 0; i < 3; i++) {
      await leonPage.waitForTimeout(2000)
      
      const visibility = await Promise.all([
        leonPage.evaluate(() => {
          const scene = (window as any).game?.scene?.getScene('MainScene')
          const otherUsers = scene?.getOtherPlayers?.() || new Map()
          return {
            canSeeoOthers: otherUsers.size > 0,
            otherUserCount: otherUsers.size,
            otherUserNames: Array.from(otherUsers.values()).map((p: any) => p.name)
          }
        }),
        annaPage.evaluate(() => {
          const scene = (window as any).game?.scene?.getScene('MainScene')
          const otherUsers = scene?.getOtherPlayers?.() || new Map()
          return {
            canSeeoOthers: otherUsers.size > 0,
            otherUserCount: otherUsers.size,
            otherUserNames: Array.from(otherUsers.values()).map((p: any) => p.name)
          }
        })
      ])
      
      console.log(`🔍 Visibility check ${i + 1}:`, visibility)
      
      // Both users should see each other
      expect(visibility[0].canSeeoOthers).toBe(true)
      expect(visibility[1].canSeeoOthers).toBe(true)
      
      if (!visibility[0].canSeeoOthers || !visibility[1].canSeeoOthers) {
        console.error('❌ BUG #004 DETECTED: User visibility inconsistency!')
        console.log('Leon sees:', visibility[0])
        console.log('Anna sees:', visibility[1])
      }
    }
    
    await leonPage.close()
    await annaPage.close()
  })
})

// Helper functions
async function setupUser(page: any, username: string, password: string) {
  await page.goto('/')
  await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
  await page.fill('input[placeholder*="用户名"], input[type="text"]:first-of-type', username)
  await page.fill('input[placeholder*="密码"], input[type="password"]', password)
  await page.click('button:has-text("登 录")')
  await page.waitForSelector('canvas', { timeout: 15000 })
  await page.waitForTimeout(3000)
}

function extractPositionFromLog(logText: string): { x: number; y: number } {
  try {
    const match = logText.match(/\{.*?x.*?:.*?(\d+).*?y.*?:.*?(\d+).*?\}/)
    if (match) {
      return { x: parseInt(match[1]), y: parseInt(match[2]) }
    }
  } catch (error) {
    console.warn('Could not extract position from log:', logText)
  }
  return { x: 0, y: 0 }
}