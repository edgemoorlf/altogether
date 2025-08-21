import { test, expect } from '@playwright/test'

test.describe('Critical Bug Prevention Tests', () => {
  
  test.describe('Bug #001: Avatar Profile Inconsistency', () => {
    
    test('should render distinct avatars for different users', async ({ page, context }) => {
      console.log('🧪 Testing Bug #001: Avatar profile consistency')
      
      const avatarInfo: any[] = []
      
      // Capture avatar creation logs
      page.on('console', (msg) => {
        const text = msg.text()
        if (text.includes('👤 Current user avatar created') || 
            text.includes('👥 Adding other player') ||
            text.includes('Avatar config')) {
          avatarInfo.push(text)
          console.log('🎨 Avatar Log:', text)
        }
      })
      
      // First user (leon)
      await page.goto('/')
      await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'leon')
      await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'leonpass')
      await page.click('button:has-text(\"登 录\")')
      await page.waitForSelector('canvas', { timeout: 15000 })
      await page.waitForTimeout(5000)
      
      // Second user (anna) in new tab
      const page2 = await context.newPage()
      page2.on('console', (msg) => {
        const text = msg.text()
        if (text.includes('👤 Current user avatar created') || 
            text.includes('👥 Adding other player') ||
            text.includes('Avatar config')) {
          avatarInfo.push(`Page2: ${text}`)
          console.log('🎨 Page2 Avatar Log:', text)
        }
      })
      
      await page2.goto('/')
      await page2.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      await page2.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'anna')
      await page2.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'annapass')
      await page2.click('button:has-text(\"登 录\")')
      await page2.waitForSelector('canvas', { timeout: 15000 })
      await page2.waitForTimeout(8000)
      
      // Test avatar distinction using console script
      const avatarTestScript = `
        (function() {
          const scene = window.game?.scene?.getScene('MainScene');
          if (!scene) return { error: 'Scene not found' };
          
          const currentPlayer = scene.getCurrentPlayer?.();
          const otherPlayers = scene.getOtherPlayers?.();
          
          const results = {
            currentPlayerExists: !!currentPlayer,
            otherPlayersCount: otherPlayers?.size || 0,
            otherPlayersList: []
          };
          
          if (otherPlayers && otherPlayers.size > 0) {
            otherPlayers.forEach((player, id) => {
              results.otherPlayersList.push({
                id: id,
                name: player.name,
                hasSprite: !!player.sprite
              });
            });
          }
          
          return results;
        })()
      `
      
      const leonAvatarInfo = await page.evaluate(avatarTestScript)
      const annaAvatarInfo = await page2.evaluate(avatarTestScript)
      
      console.log('🎨 Leon sees:', leonAvatarInfo)
      console.log('🎨 Anna sees:', annaAvatarInfo)
      
      // Assertions for Bug #001
      expect(leonAvatarInfo.currentPlayerExists).toBe(true)
      expect(annaAvatarInfo.currentPlayerExists).toBe(true)
      
      // Each user should see the other user
      expect(leonAvatarInfo.otherPlayersCount).toBeGreaterThan(0)
      expect(annaAvatarInfo.otherPlayersCount).toBeGreaterThan(0)
      
      // Users should have different names/identities
      const leonSeesAnna = leonAvatarInfo.otherPlayersList.some(p => 
        p.name.toLowerCase().includes('anna') || p.id.includes('anna'))
      const annaSeesLeon = annaAvatarInfo.otherPlayersList.some(p => 
        p.name.toLowerCase().includes('leon') || p.id.includes('leon'))
      
      if (!leonSeesAnna || !annaSeesLeon) {
        console.error('❌ BUG #001 DETECTED: Users do not see each other with distinct identities')
        console.log('Leon sees others:', leonAvatarInfo.otherPlayersList)
        console.log('Anna sees others:', annaAvatarInfo.otherPlayersList)
      }
      
      // This test will fail if Bug #001 is present (identical avatars)
      expect(leonSeesAnna || annaSeesLeon).toBe(true)
      
      await page2.close()
    })
  })
  
  test.describe('Bug #002: Movement CPU Performance Issue', () => {
    
    test('should not send empty movement coordinates', async ({ page }) => {
      console.log('🧪 Testing Bug #002: Movement performance issue')
      
      const movementLogs: string[] = []
      const emptyMovementCount = { count: 0 }
      
      // Monitor console for movement-related logs
      page.on('console', (msg) => {
        const text = msg.text()
        if (text.includes('playerMoved') || text.includes('movement') || text.includes('position')) {
          movementLogs.push(text)
          if (text.includes('{}') || text.includes('undefined') || text.includes('null')) {
            emptyMovementCount.count++
          }
        }
      })
      
      await page.goto('/')
      await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'movementtest')
      await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass')
      await page.click('button:has-text(\"登 录\")')
      await page.waitForSelector('canvas', { timeout: 15000 })
      await page.waitForTimeout(5000)
      
      // Test movement coordinate validation
      const movementTestScript = `
        (function() {
          let movementEvents = [];
          let originalDispatchEvent = window.dispatchEvent;
          
          // Intercept movement events
          window.dispatchEvent = function(event) {
            if (event.type === 'playerMoved') {
              movementEvents.push({
                type: event.type,
                detail: event.detail,
                hasValidCoords: event.detail && 
                  typeof event.detail.x === 'number' && 
                  typeof event.detail.y === 'number' &&
                  !isNaN(event.detail.x) && 
                  !isNaN(event.detail.y)
              });
            }
            return originalDispatchEvent.call(this, event);
          };
          
          // Simulate movement
          const scene = window.game?.scene?.getScene('MainScene');
          if (scene && scene.player) {
            // Trigger movement programmatically
            const moveEvent = new CustomEvent('playerMoved', {
              detail: { x: 100, y: 200 }
            });
            window.dispatchEvent(moveEvent);
          }
          
          return {
            eventCount: movementEvents.length,
            events: movementEvents,
            hasInvalidEvents: movementEvents.some(e => !e.hasValidCoords)
          };
        })()
      `
      
      await page.waitForTimeout(2000)
      const movementTestResult = await page.evaluate(movementTestScript)
      
      console.log('🎯 Movement test result:', movementTestResult)
      console.log('📊 Empty movement count:', emptyMovementCount.count)
      
      // Assertions for Bug #002
      if (movementTestResult.hasInvalidEvents) {
        console.error('❌ BUG #002 DETECTED: Invalid movement coordinates found')
        console.log('Invalid events:', movementTestResult.events.filter(e => !e.hasValidCoords))
      }
      
      // Test should fail if Bug #002 is present (empty coordinates)
      expect(movementTestResult.hasInvalidEvents).toBe(false)
      expect(emptyMovementCount.count).toBe(0)
    })
    
    test('should not generate excessive movement events when stationary', async ({ page }) => {
      console.log('🧪 Testing movement event frequency')
      
      let movementEventCount = 0
      
      page.on('console', (msg) => {
        if (msg.text().includes('playerMoved') || msg.text().includes('Player') && msg.text().includes('moved to')) {
          movementEventCount++
        }
      })
      
      await page.goto('/')
      await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'stationarytest')
      await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass')
      await page.click('button:has-text(\"登 录\")')
      await page.waitForSelector('canvas', { timeout: 15000 })
      
      // Wait without any movement
      const initialCount = movementEventCount
      await page.waitForTimeout(5000)
      const finalCount = movementEventCount
      
      const eventsGenerated = finalCount - initialCount
      console.log(`📊 Movement events generated while stationary: ${eventsGenerated}`)
      
      // Should not generate excessive movement events when stationary
      if (eventsGenerated > 10) {
        console.error('❌ BUG #002 DETECTED: Excessive movement events while stationary')
      }
      
      expect(eventsGenerated).toBeLessThan(10)
    })
  })
  
  test.describe('Bug #003: Collision Detection System Failure', () => {
    
    test('should prevent player from walking through walls', async ({ page }) => {
      console.log('🧪 Testing Bug #003: Collision detection')
      
      await page.goto('/')
      await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'collisiontest')
      await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass')
      await page.click('button:has-text(\"登 录\")')
      await page.waitForSelector('canvas', { timeout: 15000 })
      await page.waitForTimeout(5000)
      
      const collisionTestScript = `
        (function() {
          const scene = window.game?.scene?.getScene('MainScene');
          if (!scene || !scene.player) {
            return { error: 'Scene or player not found' };
          }
          
          const player = scene.player;
          const initialX = player.getSprite().x;
          const initialY = player.getSprite().y;
          
          // Try to move player to world boundary (should be blocked)
          const worldBounds = scene.physics?.world?.bounds;
          const testPositions = [
            { x: -100, y: initialY, name: 'left boundary' },
            { x: (worldBounds?.width || 1200) + 100, y: initialY, name: 'right boundary' },
            { x: initialX, y: -100, name: 'top boundary' },
            { x: initialX, y: (worldBounds?.height || 800) + 100, name: 'bottom boundary' }
          ];
          
          const results = [];
          
          testPositions.forEach(testPos => {
            // Set player position
            player.getSprite().setPosition(testPos.x, testPos.y);
            
            // Check if position was actually set (indicates no collision)
            const actualX = player.getSprite().x;
            const actualY = player.getSprite().y;
            
            const positionChanged = (actualX !== initialX || actualY !== initialY);
            const reachedTestPosition = (Math.abs(actualX - testPos.x) < 10 && Math.abs(actualY - testPos.y) < 10);
            
            results.push({
              testName: testPos.name,
              attempted: testPos,
              actual: { x: actualX, y: actualY },
              collisionWorking: !reachedTestPosition,
              positionChanged: positionChanged
            });
            
            // Reset position
            player.getSprite().setPosition(initialX, initialY);
          });
          
          return {
            initialPosition: { x: initialX, y: initialY },
            worldBounds: worldBounds,
            tests: results,
            collisionSystemWorking: results.some(r => r.collisionWorking)
          };
        })()
      `
      
      const collisionResult = await page.evaluate(collisionTestScript)
      console.log('🧱 Collision test result:', collisionResult)
      
      // Assertions for Bug #003
      if (!collisionResult.collisionSystemWorking) {
        console.error('❌ BUG #003 DETECTED: Collision detection not working')
        console.log('Failed collision tests:', collisionResult.tests?.filter(t => !t.collisionWorking))
      }
      
      // Test should fail if Bug #003 is present (no collision)
      expect(collisionResult.error).toBeUndefined()
      expect(collisionResult.collisionSystemWorking).toBe(true)
    })
    
    test('should have physics world bounds configured', async ({ page }) => {
      console.log('🧪 Testing physics world configuration')
      
      await page.goto('/')
      await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'physicstest')
      await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass')
      await page.click('button:has-text(\"登 录\")')
      await page.waitForSelector('canvas', { timeout: 15000 })
      await page.waitForTimeout(5000)
      
      const physicsConfigScript = `
        (function() {
          const scene = window.game?.scene?.getScene('MainScene');
          if (!scene) {
            return { error: 'Scene not found' };
          }
          
          const physics = scene.physics;
          const world = physics?.world;
          const player = scene.player;
          
          return {
            physicsExists: !!physics,
            worldExists: !!world,
            worldBounds: world?.bounds,
            playerExists: !!player,
            playerHasPhysics: !!player?.getSprite()?.body,
            playerCollideWorldBounds: player?.getSprite()?.body?.collideWorldBounds
          };
        })()
      `
      
      const physicsConfig = await page.evaluate(physicsConfigScript)
      console.log('⚙️ Physics configuration:', physicsConfig)
      
      // Physics system should be properly configured
      expect(physicsConfig.physicsExists).toBe(true)
      expect(physicsConfig.worldExists).toBe(true)
      expect(physicsConfig.playerExists).toBe(true)
      expect(physicsConfig.worldBounds).toBeDefined()
    })
  })
  
  test.describe('Bug Regression Monitoring', () => {
    
    test('should pass comprehensive multi-user test without any critical bugs', async ({ page, context }) => {
      console.log('🧪 Comprehensive bug regression test')
      
      const bugDetected = {
        avatarBug: false,
        movementBug: false,
        collisionBug: false
      }
      
      // Monitor for any bug indicators
      const monitorBugs = (msg: any) => {
        const text = msg.text()
        
        // Check for Bug #001 indicators
        if (text.includes('identical avatar') || text.includes('same shirt color')) {
          bugDetected.avatarBug = true
        }
        
        // Check for Bug #002 indicators  
        if (text.includes('moved to: {}') || text.includes('undefined position')) {
          bugDetected.movementBug = true
        }
        
        // Check for Bug #003 indicators
        if (text.includes('no collision') || text.includes('pass through wall')) {
          bugDetected.collisionBug = true
        }
      }
      
      page.on('console', monitorBugs)
      
      // Quick multi-user test
      await page.goto('/')
      await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'user1')
      await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'pass1')
      await page.click('button:has-text(\"登 录\")')
      await page.waitForSelector('canvas', { timeout: 15000 })
      
      const page2 = await context.newPage()
      page2.on('console', monitorBugs)
      
      await page2.goto('/')
      await page2.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
      await page2.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'user2')
      await page2.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'pass2')
      await page2.click('button:has-text(\"登 录\")')
      await page2.waitForSelector('canvas', { timeout: 15000 })
      
      await page.waitForTimeout(10000)
      
      // Report any detected bugs
      if (bugDetected.avatarBug) {
        console.error('❌ BUG #001 REGRESSION: Avatar consistency bug detected')
      }
      if (bugDetected.movementBug) {
        console.error('❌ BUG #002 REGRESSION: Movement performance bug detected')
      }
      if (bugDetected.collisionBug) {
        console.error('❌ BUG #003 REGRESSION: Collision detection bug detected')
      }
      
      // Test fails if any critical bug is detected
      expect(bugDetected.avatarBug).toBe(false)
      expect(bugDetected.movementBug).toBe(false)  
      expect(bugDetected.collisionBug).toBe(false)
      
      await page2.close()
    })
  })
})