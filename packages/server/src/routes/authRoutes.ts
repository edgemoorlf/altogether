import express from 'express'

const router = express.Router()

// Mock authentication for development
router.post('/login', (req, res) => {
  const { username, password } = req.body
  
  // Basic validation
  if (!username || !password) {
    return res.status(400).json({
      error: 'Username and password are required'
    })
  }

  // Mock user for development
  const mockUser = {
    id: `user_${Date.now()}`,
    username,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    isOnline: true
  }

  // In production, this would generate a real JWT
  const mockToken = `mock_jwt_${mockUser.id}`

  res.json({
    success: true,
    user: mockUser,
    token: mockToken
  })
})

router.post('/register', (req, res) => {
  const { username, password, email } = req.body
  
  if (!username || !password || !email) {
    return res.status(400).json({
      error: 'Username, password, and email are required'
    })
  }

  // Mock registration
  const mockUser = {
    id: `user_${Date.now()}`,
    username,
    email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    isOnline: true,
    createdAt: new Date().toISOString()
  }

  const mockToken = `mock_jwt_${mockUser.id}`

  res.status(201).json({
    success: true,
    user: mockUser,
    token: mockToken
  })
})

router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

// Get current user info (requires auth in production)
router.get('/me', (req, res) => {
  // Mock current user
  res.json({
    success: true,
    user: {
      id: 'current_user',
      username: 'demo_user',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      isOnline: true
    }
  })
})

export default router