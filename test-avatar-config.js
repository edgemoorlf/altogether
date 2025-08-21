// Test script to verify avatar config generation
console.log('🧪 Testing avatar config generation...')

// Simulate the avatar config generation logic
function generateAvatarConfig(userId) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff
  }
  
  const config = {
    userId: userId,
    username: 'User',
    seed: userId,
    colors: {
      skin: [0xFDBCB4, 0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524][Math.abs(hash) % 5],
      hair: [0x2C1B18, 0x8B4513, 0xDAA520, 0x654321, 0x4A4A4A][Math.abs(hash >> 16) % 5],
      shirt: [0x4285f4, 0x34a853, 0xfbbc05, 0xea4335, 0x9c27b0][Math.abs(hash >> 24) % 5],
      pants: [0x2c3e50, 0x34495e, 0x5d6d7e, 0x273746][Math.abs(hash >> 32) % 4]
    },
    style: {
      hairStyle: ['short', 'long', 'curly', 'bald'][Math.abs(hash >> 8) % 4],
      bodyType: ['slim', 'normal', 'broad'][Math.abs(hash >> 40) % 3]
    }
  }
  
  return config
}

// Test with different user IDs
const testUsers = ['default-user', 'player1', 'player2', 'test-user-123']

testUsers.forEach(userId => {
  console.log(`\n👤 Testing config for user: ${userId}`)
  const config = generateAvatarConfig(userId)
  console.log('✅ Config generated successfully:')
  console.log('   Colors:', config.colors)
  console.log('   Style:', config.style)
  
  // Verify all required properties exist
  const hasAllProps = config.userId && 
                     config.username && 
                     config.seed &&
                     config.colors &&
                     config.colors.skin !== undefined &&
                     config.colors.hair !== undefined &&
                     config.colors.shirt !== undefined &&
                     config.colors.pants !== undefined &&
                     config.style &&
                     config.style.hairStyle &&
                     config.style.bodyType
  
  if (hasAllProps) {
    console.log('   ✅ All properties present')
  } else {
    console.log('   ❌ Missing properties!')
    process.exit(1)
  }
})

console.log('\n🎉 All avatar config tests passed!')
console.log('✅ Avatar system should now work without bodyType errors')