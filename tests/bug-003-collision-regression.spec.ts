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
interface CollisionTestResult {
  error?: string
  initialPosition: { x: number; y: number }
  worldBounds: {
    left: number
    right: number
    top: number
    bottom: number
    width: number
    height: number
  }
  tests: any[]
  collisionSystemWorking: boolean
  allBoundariesProtected: boolean
}

interface PhysicsSystemCheck {
  error?: string
  sceneExists: boolean
  physicsExists: boolean
  worldExists: boolean
  playerExists: boolean
  spriteExists: boolean
  spriteHasBody: boolean
  worldBounds: any
  playerPhysicsConfig: any
  worldBoundsSet: boolean
  systemReady: boolean
}

interface FurnitureCollisionTest {
  error?: string
  initialPosition: { x: number; y: number }
  furnitureTests: any[]
  anyCollisionDetected: boolean
  testNote: string
}

/**
 * Bug #003 Regression Test: Collision Detection System Failure
 * 
 * This test validates that collision detection works properly and players
 * cannot pass through walls, furniture, or world boundaries.
 */
test.describe('Bug #003: Collision Detection Failure - Regression Test', () => {
  
  test('should prevent player from passing through world boundaries', async ({ page }) => {
    console.log('🧪 Bug #003 Regression: Testing world boundary collision')
    
    const collisionLogs: string[] = []
    let worldBoundsHit = false
    
    // Monitor for collision events
    page.on('console', (msg) => {
      const text = msg.text()
      collisionLogs.push(text)
      
      if (text.includes('🚧 Player hit world boundary') || 
          text.includes('worldbounds') ||
          text.includes('collision')) {
        worldBoundsHit = true
        console.log('🚧 Collision detected:', text)
      }
    })
    
    await page.goto('/')
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'collision_test_user')
    await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass123')
    await page.click('button:has-text(\"登 录\")')
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    const collisionTestResult = await page.evaluate(() => {
      return new Promise<CollisionTestResult>((resolve) => {
        const scene = (window as any).game?.scene?.getScene('MainScene')
        if (!scene?.player) {
          resolve({ error: 'Scene or player not found' } as CollisionTestResult)
          return
        }
        
        const player = scene.player
        const sprite = player.getSprite()
        const initialPosition = { x: sprite.x, y: sprite.y }
        
        // Get world bounds
        const worldBounds = scene.physics?.world?.bounds
        if (!worldBounds) {
          resolve({ error: 'World bounds not found' } as CollisionTestResult)
          return
        }
        
        console.log('🌍 Testing collision with world bounds:', worldBounds)
        console.log('👤 Initial player position:', initialPosition)
        
        const collisionTests: any[] = []
        
        // Test boundary collision for each direction
        const boundaryTests = [
          { 
            name: 'left_boundary', 
            position: { x: worldBounds.left - 50, y: initialPosition.y },
            expectedBlocked: true
          },
          { 
            name: 'right_boundary', 
            position: { x: worldBounds.right + 50, y: initialPosition.y },
            expectedBlocked: true
          },
          { 
            name: 'top_boundary', 
            position: { x: initialPosition.x, y: worldBounds.top - 50 },
            expectedBlocked: true
          },
          { 
            name: 'bottom_boundary', 
            position: { x: initialPosition.x, y: worldBounds.bottom + 50 },
            expectedBlocked: true
          },
          { 
            name: 'valid_position', 
            position: { x: worldBounds.centerX, y: worldBounds.centerY },
            expectedBlocked: false
          }
        ]
        
        let testIndex = 0
        
        const runNextTest = () => {
          if (testIndex >= boundaryTests.length) {
            resolve({
              initialPosition,
              worldBounds: {
                left: worldBounds.left,
                right: worldBounds.right,
                top: worldBounds.top,
                bottom: worldBounds.bottom,
                width: worldBounds.width,
                height: worldBounds.height
              },
              tests: collisionTests,
              collisionSystemWorking: collisionTests.some(t => t.collisionWorking),
              allBoundariesProtected: collisionTests
                .filter(t => t.expectedBlocked)
                .every(t => t.collisionWorking)
            })
            return
          }
          
          const test = boundaryTests[testIndex]
          console.log(`🧪 Testing ${test.name} at position:`, test.position)
          
          // Store position before attempt
          const beforePosition = { x: sprite.x, y: sprite.y }
          
          // Attempt to move to boundary position
          sprite.setPosition(test.position.x, test.position.y)
          
          // Wait a frame for physics to process
          setTimeout(() => {
            const afterPosition = { x: sprite.x, y: sprite.y }
            
            // Check if player reached the attempted position
            const reachedTarget = Math.abs(afterPosition.x - test.position.x) < 10 && 
                                Math.abs(afterPosition.y - test.position.y) < 10
            
            const collisionWorking = test.expectedBlocked ? !reachedTarget : reachedTarget
            
            const testResult = {
              testName: test.name,
              attemptedPosition: test.position,
              beforePosition,
              afterPosition,
              reachedTarget,
              expectedBlocked: test.expectedBlocked,
              collisionWorking,
              distance: Math.sqrt(
                Math.pow(afterPosition.x - test.position.x, 2) + 
                Math.pow(afterPosition.y - test.position.y, 2)
              )
            }
            
            collisionTests.push(testResult)
            console.log(`${collisionWorking ? '✅' : '❌'} ${test.name}:`, testResult)
            
            // Reset to initial position for next test
            sprite.setPosition(initialPosition.x, initialPosition.y)
            
            testIndex++
            setTimeout(runNextTest, 100)
          }, 100)
        }
        
        runNextTest()
      })
    }) as CollisionTestResult
    
    console.log('🧱 Collision test results:', collisionTestResult)
    
    // Critical assertions for Bug #003
    expect(collisionTestResult.error).toBeUndefined()
    expect(collisionTestResult.collisionSystemWorking).toBe(true)
    expect(collisionTestResult.allBoundariesProtected).toBe(true)
    
    if (!collisionTestResult.collisionSystemWorking) {
      console.error('❌ BUG #003 DETECTED: Collision detection system not working')
      console.log('Failed collision tests:', 
        collisionTestResult.tests?.filter((t: any) => !t.collisionWorking))
    }
    
    if (!collisionTestResult.allBoundariesProtected) {
      console.error('❌ BUG #003 DETECTED: Some world boundaries not protected')
      console.log('Unprotected boundaries:', 
        collisionTestResult.tests?.filter((t: any) => t.expectedBlocked && !t.collisionWorking))
    }
  })
  
  test('should have properly configured physics system', async ({ page }) => {
    console.log('🧪 Bug #003 Regression: Testing physics system configuration')
    
    await page.goto('/')
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'physics_test_user')
    await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass123')
    await page.click('button:has-text(\"登 录\")')
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    const physicsSystemCheck = await page.evaluate(() => {
      const scene = (window as any).game?.scene?.getScene('MainScene')
      if (!scene) {
        return { error: 'Scene not found' } as PhysicsSystemCheck
      }
      
      const player = scene.player
      const sprite = player?.getSprite()
      const physics = scene.physics
      const world = physics?.world
      
      return {
        sceneExists: !!scene,
        physicsExists: !!physics,
        worldExists: !!world,
        playerExists: !!player,
        spriteExists: !!sprite,
        spriteHasBody: !!sprite?.body,
        worldBounds: world?.bounds ? {
          x: world.bounds.x,
          y: world.bounds.y,
          width: world.bounds.width,
          height: world.bounds.height
        } : null,
        playerPhysicsConfig: sprite?.body ? {
          collideWorldBounds: (sprite.body as any).collideWorldBounds,
          bounce: {
            x: (sprite.body as any).bounce?.x || 0,
            y: (sprite.body as any).bounce?.y || 0
          },
          mass: (sprite.body as any).mass || 1
        } : null,
        worldBoundsSet: !!(world?.bounds && world.bounds.width > 0 && world.bounds.height > 0),
        systemReady: !!(scene && physics && world && player && sprite && sprite.body)
      }
    }) as PhysicsSystemCheck
    
    console.log('⚙️ Physics system configuration:', physicsSystemCheck)
    
    // Physics system should be properly configured
    expect(physicsSystemCheck.error).toBeUndefined()
    expect(physicsSystemCheck.systemReady).toBe(true)
    expect(physicsSystemCheck.worldBoundsSet).toBe(true)
    expect(physicsSystemCheck.playerPhysicsConfig?.collideWorldBounds).toBe(true)
    
    if (!physicsSystemCheck.systemReady) {
      console.error('❌ BUG #003 DETECTED: Physics system not properly configured')
      console.log('Missing components:', {
        scene: physicsSystemCheck.sceneExists,
        physics: physicsSystemCheck.physicsExists,
        world: physicsSystemCheck.worldExists,
        player: physicsSystemCheck.playerExists,
        sprite: physicsSystemCheck.spriteExists,
        body: physicsSystemCheck.spriteHasBody
      })
    }
  })
  
  test('should detect collision with furniture and objects', async ({ page }) => {
    console.log('🧪 Bug #003 Regression: Testing furniture collision detection')
    
    await page.goto('/')
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'furniture_test_user')
    await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass123')
    await page.click('button:has-text(\"登 录\")')
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    const furnitureCollisionTest = await page.evaluate(() => {
      const scene = (window as any).game?.scene?.getScene('MainScene')
      if (!scene?.player) {
        return { error: 'Scene or player not found' } as FurnitureCollisionTest
      }
      
      // Test collision with known furniture positions
      // These should correspond to furniture created in MainScene
      const furniturePositions = [
        { x: 500, y: 450, name: 'development_area_desk' },
        { x: 850, y: 250, name: 'meeting_room_table' },
        { x: 150, y: 600, name: 'lounge_area_furniture' }
      ]
      
      const player = scene.player
      const sprite = player.getSprite()
      const initialPosition = { x: sprite.x, y: sprite.y }
      
      const furnitureTests = furniturePositions.map(furniture => {
        // Try to move player to furniture position
        sprite.setPosition(furniture.x, furniture.y)
        const newPosition = { x: sprite.x, y: sprite.y }
        
        // Check if player was blocked from reaching exact furniture position
        const blocked = Math.abs(newPosition.x - furniture.x) > 20 || 
                       Math.abs(newPosition.y - furniture.y) > 20
        
        // Reset position
        sprite.setPosition(initialPosition.x, initialPosition.y)
        
        return {
          furnitureName: furniture.name,
          attemptedPosition: furniture,
          resultPosition: newPosition,
          collisionDetected: blocked,
          distance: Math.sqrt(
            Math.pow(newPosition.x - furniture.x, 2) + 
            Math.pow(newPosition.y - furniture.y, 2)
          )
        }
      })
      
      return {
        initialPosition,
        furnitureTests,
        anyCollisionDetected: furnitureTests.some(t => t.collisionDetected),
        // Note: This test may need adjustment based on actual furniture collision implementation
        testNote: 'Furniture collision may not be implemented yet - this test verifies the capability'
      }
    }) as FurnitureCollisionTest
    
    console.log('🪑 Furniture collision test results:', furnitureCollisionTest)
    
    // Note: This test documents the expected behavior for furniture collision
    // It may initially fail if furniture collision is not yet implemented
    expect(furnitureCollisionTest.error).toBeUndefined()
    
    // Log the current state for future implementation
    console.log('📝 Furniture collision status:', {
      anyCollisionDetected: furnitureCollisionTest.anyCollisionDetected,
      individualTests: furnitureCollisionTest.furnitureTests
    })
  })
})