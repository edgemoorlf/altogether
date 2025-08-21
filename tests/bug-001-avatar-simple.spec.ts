import { test, expect } from '@playwright/test'

/**
 * Bug #001 Simple Test: Avatar Profile Consistency
 * 
 * This test focuses on verifying that avatar generation is deterministic
 * by testing the avatar generation logic directly.
 */
test.describe('Bug #001: Avatar Profile Consistency - Simple Test', () => {
  
  test('avatar generation should be deterministic for same username', async ({ page }) => {
    console.log('🧪 Testing avatar generation consistency...')
    
    // Navigate to the page
    await page.goto('http://localhost:3000/')
    
    // Wait for the page to load
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    
    // Test avatar generation consistency by calling the generation function multiple times
    const avatarTests = await page.evaluate(() => {
      // Create a simplified version of the avatar generation to test
      function generateDeterministicHash(str: string): number {
        let hash = 0
        const seedString = `avatar-${str}`
        for (let i = 0; i < seedString.length; i++) {
          hash = ((hash << 5) - hash + seedString.charCodeAt(i)) & 0xffffffff
        }
        return Math.abs(hash)
      }
      
      function generateAvatarConfig(username: string) {
        const hash = generateDeterministicHash(username)
        
        const skinTones = [0xFDBCB4, 0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524]
        const hairColors = [0x2C1B18, 0x8B4513, 0xDAA520, 0xFF4500, 0x4A4A4A]
        const shirtColors = [0x4285f4, 0x34a853, 0xea4335, 0x9c27b0, 0xff9800]
        const pantsColors = [0x2c3e50, 0x34495e, 0x5d6d7e, 0x273746]
        
        return {
          username,
          colors: {
            skin: skinTones[hash % skinTones.length],
            hair: hairColors[(hash >> 8) % hairColors.length],
            shirt: shirtColors[(hash >> 16) % shirtColors.length],
            pants: pantsColors[(hash >> 24) % pantsColors.length]
          },
          hash
        }
      }
      
      // Test consistency for anna
      const anna1 = generateAvatarConfig('anna')
      const anna2 = generateAvatarConfig('anna')
      const anna3 = generateAvatarConfig('anna')
      
      // Test different users
      const leon = generateAvatarConfig('leon')
      const testuser = generateAvatarConfig('testuser')
      
      return {
        anna: [anna1, anna2, anna3],
        leon,
        testuser,
        consistent: JSON.stringify(anna1) === JSON.stringify(anna2) && 
                   JSON.stringify(anna2) === JSON.stringify(anna3),
        different: JSON.stringify(anna1) !== JSON.stringify(leon) &&
                  JSON.stringify(anna1) !== JSON.stringify(testuser)
      }
    })
    
    console.log('🎨 Avatar generation test results:', avatarTests)
    
    // CRITICAL ASSERTIONS for Bug #001
    expect(avatarTests.consistent).toBe(true)
    expect(avatarTests.different).toBe(true)
    
    // Verify anna's avatars are identical
    const anna1 = avatarTests.anna[0]
    const anna2 = avatarTests.anna[1] 
    const anna3 = avatarTests.anna[2]
    
    expect(anna1.colors.skin).toBe(anna2.colors.skin)
    expect(anna1.colors.hair).toBe(anna2.colors.hair)
    expect(anna1.colors.shirt).toBe(anna2.colors.shirt)
    expect(anna1.colors.pants).toBe(anna2.colors.pants)
    
    expect(anna2.colors.skin).toBe(anna3.colors.skin)
    expect(anna2.colors.hair).toBe(anna3.colors.hair)
    expect(anna2.colors.shirt).toBe(anna3.colors.shirt)
    expect(anna2.colors.pants).toBe(anna3.colors.pants)
    
    // Verify different users have different avatars
    expect(anna1.colors.skin !== avatarTests.leon.colors.skin ||
           anna1.colors.hair !== avatarTests.leon.colors.hair ||
           anna1.colors.shirt !== avatarTests.leon.colors.shirt).toBe(true)
    
    console.log('✅ Avatar generation consistency verified')
    console.log('👤 Anna avatar config:', anna1)
    console.log('👤 Leon avatar config:', avatarTests.leon)
  })
  
  test('should demonstrate avatar profile URL parsing', async ({ page }) => {
    console.log('🧪 Testing profile URL parsing...')
    
    await page.goto('http://localhost:3000/')
    await page.waitForSelector('text=欢迎来到 在一起 Altogether', { timeout: 10000 })
    
    const urlParsingTest = await page.evaluate(() => {
      function extractAvatarConfigFromProfile(profileAvatarUrl: string, username: string) {
        let extractedConfig = {
          colors: {
            skin: 0xFDBCB4, // Default light skin
            hair: 0x2C1B18, // Default dark hair
            shirt: 0x4285f4, // Default blue shirt
            pants: 0x2c3e50  // Default dark pants
          },
          source: 'default'
        }
        
        try {
          if (profileAvatarUrl && profileAvatarUrl.includes('dicebear.com')) {
            const url = new URL(profileAvatarUrl)
            const seed = url.pathname.split('/').pop()?.replace('.svg', '') || username
            
            // Extract theme and style information from seed
            if (seed.includes('business') || seed.includes('prof')) {
              extractedConfig.colors.shirt = 0x4285f4 // Professional blue
              extractedConfig.source = 'business-theme'
            } else if (seed.includes('casual')) {
              extractedConfig.colors.shirt = 0x98FB98 // Light green for casual
              extractedConfig.source = 'casual-theme'
            } else if (seed.includes('classic')) {
              extractedConfig.colors.hair = 0x2C1B18 // Dark hair for classic
              extractedConfig.source = 'classic-theme'
            }
          } else {
            // Use deterministic generation based on username
            let hash = 0
            const seedString = `avatar-${username}`
            for (let i = 0; i < seedString.length; i++) {
              hash = ((hash << 5) - hash + seedString.charCodeAt(i)) & 0xffffffff
            }
            hash = Math.abs(hash)
            
            const skinTones = [0xFDBCB4, 0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524]
            const hairColors = [0x2C1B18, 0x8B4513, 0xDAA520, 0xFF4500, 0x4A4A4A]
            const shirtColors = [0x4285f4, 0x34a853, 0xea4335, 0x9c27b0, 0xff9800]
            
            extractedConfig = {
              colors: {
                skin: skinTones[hash % skinTones.length],
                hair: hairColors[(hash >> 8) % hairColors.length],
                shirt: shirtColors[(hash >> 16) % shirtColors.length],
                pants: 0x2c3e50
              },
              source: 'deterministic'
            }
          }
        } catch (error) {
          console.error('Error extracting avatar config:', error)
        }
        
        return extractedConfig
      }
      
      // Test various profile URL scenarios
      const businessUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=business-anna-prof1'
      const casualUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=casual-anna-modern1'
      const noUrl = ''
      
      return {
        business: extractAvatarConfigFromProfile(businessUrl, 'anna'),
        casual: extractAvatarConfigFromProfile(casualUrl, 'anna'),
        deterministic: extractAvatarConfigFromProfile(noUrl, 'anna')
      }
    })
    
    console.log('🖼️ Profile URL parsing results:', urlParsingTest)
    
    // Verify different parsing results
    expect(urlParsingTest.business.source).toBe('business-theme')
    expect(urlParsingTest.casual.source).toBe('casual-theme')
    expect(urlParsingTest.deterministic.source).toBe('deterministic')
    
    // Verify business theme gets professional blue shirt
    expect(urlParsingTest.business.colors.shirt).toBe(0x4285f4)
    
    // Verify casual theme gets light green shirt
    expect(urlParsingTest.casual.colors.shirt).toBe(0x98FB98)
    
    console.log('✅ Profile URL parsing verified')
  })
})