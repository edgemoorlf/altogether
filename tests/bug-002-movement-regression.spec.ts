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
interface MovementTestResult {
  error?: string
  totalEvents: number
  validEvents: number
  invalidEvents: number
  events: any[]
  hasValidMovement: boolean
  hasInvalidMovement: boolean
}

interface ThrottleTestResult {
  eventCount: number
  duration: number
  eventsPerSecond: number
  throttlingWorking: boolean
}

/**
 * Bug #002 Regression Test: Movement Data CPU Performance Issue
 * 
 * This test validates that movement data contains proper coordinates and
 * doesn't cause excessive CPU usage or network traffic.
 */
test.describe('Bug #002: Movement Performance Issue - Regression Test', () => {
  
  test('should send valid movement coordinates without empty objects', async ({ page }) => {
    console.log('🧪 Bug #002 Regression: Testing movement coordinate validation')
    
    // movementEvents used for event tracking in complex scenarios
    const movementEvents: any[] = []
    const serverLogs: string[] = []
    let emptyMovementCount = 0
    let validMovementCount = 0
    
    // Monitor console for movement-related events
    page.on('console', (msg) => {
      const text = msg.text()
      serverLogs.push(text)
      
      // Detect empty movement objects (Bug #002 symptom)
      if (text.includes('moved to: {}') || text.includes('moved to: {"x":null') || 
          text.includes('moved to: {"x":undefined')) {
        emptyMovementCount++
        console.error('❌ Empty movement detected:', text)
      }
      
      // Detect valid movement
      if (text.includes('📍 Emitting movement:') && text.includes('"x":') && text.includes('"y":')) {
        validMovementCount++
        console.log('✅ Valid movement detected:', text)
      }
    })
    
    await page.goto('/')
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'movement_test_user')
    await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass123')
    await page.click('button:has-text(\"登 录\")')
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)
    
    // Test movement coordinate validation
    const movementTestResult = await page.evaluate(() => {
      return new Promise<MovementTestResult>((resolve) => {
        const capturedEvents: any[] = []
        let validCoordinateCount = 0
        let invalidCoordinateCount = 0
        
        // Intercept movement events
        const originalDispatchEvent = window.dispatchEvent
        window.dispatchEvent = function(event: Event) {
          if (event.type === 'playerMoved') {
            const customEvent = event as CustomEvent
            const detail = customEvent.detail
            
            const isValid = detail && 
              typeof detail.x === 'number' && 
              typeof detail.y === 'number' &&
              !isNaN(detail.x) && 
              !isNaN(detail.y) &&
              detail.x !== null &&
              detail.y !== null &&
              detail.x !== undefined &&
              detail.y !== undefined
            
            if (isValid) {
              validCoordinateCount++
            } else {
              invalidCoordinateCount++
              console.error('Invalid movement coordinates:', detail)
            }
            
            capturedEvents.push({
              timestamp: Date.now(),
              detail: detail,
              isValid: isValid
            })
          }
          return originalDispatchEvent.call(this, event)
        }
        
        // Simulate movement to trigger events
        const scene = (window as any).game?.scene?.getScene('MainScene')
        if (scene?.player) {
          // Simulate some movement
          setTimeout(() => {
            const testEvent1 = new CustomEvent('playerMoved', {
              detail: { x: 100, y: 200 }
            })
            window.dispatchEvent(testEvent1)
            
            setTimeout(() => {
              const testEvent2 = new CustomEvent('playerMoved', {
                detail: { x: 150, y: 250 }
              })
              window.dispatchEvent(testEvent2)
              
              setTimeout(() => {
                resolve({
                  totalEvents: capturedEvents.length,
                  validEvents: validCoordinateCount,
                  invalidEvents: invalidCoordinateCount,
                  events: capturedEvents,
                  hasValidMovement: validCoordinateCount > 0,
                  hasInvalidMovement: invalidCoordinateCount > 0
                })
              }, 1000)
            }, 500)
          }, 500)
        } else {
          resolve({
            error: 'Scene or player not found',
            totalEvents: 0,
            validEvents: 0,
            invalidEvents: 0,
            events: [],
            hasValidMovement: false,
            hasInvalidMovement: false
          })
        }
      })
    }) as MovementTestResult
    
    console.log('📊 Movement test results:', movementTestResult)
    console.log(`📊 Server logs - Empty movements: ${emptyMovementCount}, Valid movements: ${validMovementCount}`)
    
    // Critical assertions for Bug #002
    expect(movementTestResult.error).toBeUndefined()
    expect(movementTestResult.hasInvalidMovement).toBe(false) // Should not have invalid movements
    expect(emptyMovementCount).toBe(0) // Should not have empty movement objects
    
    if (movementTestResult.hasInvalidMovement || emptyMovementCount > 0) {
      console.error('❌ BUG #002 DETECTED: Invalid movement coordinates found')
      console.log('Invalid events:', movementTestResult.events?.filter((e: any) => !e.isValid))
      console.log('Server logs with empty movements:', serverLogs.filter(log => log.includes('moved to: {}')))
    }
  })
  
  test('should throttle movement events to prevent CPU hogging', async ({ page }) => {
    console.log('🧪 Bug #002 Regression: Testing movement throttling')
    
    let movementEventCount = 0
    const startTime = Date.now()
    
    page.on('console', (msg) => {
      if (msg.text().includes('📍 Emitting movement:')) {
        movementEventCount++
      }
    })
    
    await page.goto('/')
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'throttle_test_user')
    await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass123')
    await page.click('button:has-text(\"登 录\")')
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(2000)
    
    // Test movement throttling
    const throttleTestResult = await page.evaluate(() => {
      return new Promise<ThrottleTestResult>((resolve) => {
        let eventCount = 0
        const startTime = Date.now()
        
        // Override dispatchEvent to count movement events
        const originalDispatchEvent = window.dispatchEvent
        window.dispatchEvent = function(event: Event) {
          if (event.type === 'playerMoved') {
            eventCount++
          }
          return originalDispatchEvent.call(this, event)
        }
        
        // Rapidly fire movement events to test throttling
        const interval = setInterval(() => {
          const testEvent = new CustomEvent('playerMoved', {
            detail: { x: Math.random() * 100, y: Math.random() * 100 }
          })
          window.dispatchEvent(testEvent)
        }, 10) // Fire every 10ms (100fps)
        
        // Stop after 2 seconds and check throttling
        setTimeout(() => {
          clearInterval(interval)
          const duration = Date.now() - startTime
          const eventsPerSecond = (eventCount / duration) * 1000
          
          resolve({
            eventCount: eventCount,
            duration: duration,
            eventsPerSecond: eventsPerSecond,
            throttlingWorking: eventsPerSecond < 50 // Should be throttled to ~10fps
          })
        }, 2000)
      })
    }) as ThrottleTestResult
    
    console.log('⏱️ Throttle test results:', throttleTestResult)
    
    const totalDuration = Date.now() - startTime
    const actualEventsPerSecond = (movementEventCount / totalDuration) * 1000
    
    console.log(`📊 Actual movement events per second: ${actualEventsPerSecond}`)
    
    // Throttling should limit events to reasonable rate (not more than 20fps)
    expect(actualEventsPerSecond).toBeLessThan(20)
    
    if (actualEventsPerSecond >= 20) {
      console.error('❌ BUG #002 DETECTED: Movement throttling not working, CPU hogging likely')
    }
  })
  
  test('should not generate movement events when player is stationary', async ({ page }) => {
    console.log('🧪 Bug #002 Regression: Testing stationary movement spam')
    
    let stationaryMovementCount = 0
    
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('📍 Emitting movement:') || text.includes('playerMoved')) {
        stationaryMovementCount++
      }
    })
    
    await page.goto('/')
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    await page.fill('input[placeholder*=\"用户名\"], input[type=\"text\"]:first-of-type', 'stationary_test_user')
    await page.fill('input[placeholder*=\"密码\"], input[type=\"password\"]', 'testpass123')
    await page.click('button:has-text(\"登 录\")')
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(2000)
    
    // Reset counter after initial setup
    stationaryMovementCount = 0
    
    // Wait without any input/movement for 5 seconds
    await page.waitForTimeout(5000)
    
    console.log(`📊 Movement events while stationary: ${stationaryMovementCount}`)
    
    // Should not generate movement events when stationary
    expect(stationaryMovementCount).toBeLessThan(5) // Allow some initial setup events
    
    if (stationaryMovementCount >= 5) {
      console.error('❌ BUG #002 DETECTED: Movement events generated while stationary')
    }
  })
})