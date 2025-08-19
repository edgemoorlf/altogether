import { Router, Request, Response } from 'express'
import { userStore, User } from '../models/User.js'
import { AuthService, ValidationService } from '../middleware/auth.js'

const router = Router()

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body

    // Validate input data
    const validation = ValidationService.validateRegisterData(req.body)
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      })
    }

    // Generate avatar URL
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`

    // Create user
    const user = await userStore.createUser({
      username,
      email,
      password,
      avatar,
      isOnline: false
    })

    // Generate JWT token
    const token = AuthService.generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    // Return success response (without password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userStore.getUserSafe(user),
        token
      }
    })

  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.message === 'Email already exists' || error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    })
  }
})

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body

    // Validate input data
    const validation = ValidationService.validateLoginData(req.body)
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      })
    }

    // Find user by username or email
    let user: User | null = null
    if (email) {
      user = await userStore.getUserByEmail(email)
    } else if (username) {
      user = await userStore.getUserByUsername(username)
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Validate password
    const isValidPassword = await userStore.validatePassword(user, password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Update user as online
    await userStore.updateUser(user.id, { isOnline: true })
    user = await userStore.getUserById(user.id) // Get updated user

    // Generate JWT token
    const token = AuthService.generateToken({
      userId: user!.id,
      username: user!.username,
      email: user!.email
    })

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userStore.getUserSafe(user!),
        token
      }
    })

  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    })
  }
})

// Logout user
router.post('/logout', AuthService.authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId

    // Update user as offline
    await userStore.updateUser(userId, { isOnline: false, socketId: undefined })

    res.json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error: any) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    })
  }
})

// Get current user profile
router.get('/me', AuthService.authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const user = await userStore.getUserById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: {
        user: userStore.getUserSafe(user)
      }
    })

  } catch (error: any) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Update user profile
router.put('/profile', AuthService.authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const { username, email, avatar } = req.body

    // Validate updates if provided
    const updates: any = {}
    
    if (username !== undefined) {
      if (!ValidationService.validateUsername(username)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid username format'
        })
      }
      updates.username = username
    }

    if (email !== undefined) {
      if (!ValidationService.validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        })
      }
      updates.email = email
    }

    if (avatar !== undefined) {
      updates.avatar = avatar
    }

    // Update user
    const updatedUser = await userStore.updateUser(userId, updates)

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userStore.getUserSafe(updatedUser)
      }
    })

  } catch (error: any) {
    console.error('Update profile error:', error)
    
    if (error.message === 'Email already exists' || error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during profile update'
    })
  }
})

// Refresh token
router.post('/refresh', AuthService.authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentToken = req.headers['authorization']?.split(' ')[1]
    
    if (!currentToken) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      })
    }

    // Generate new token
    const newToken = AuthService.refreshToken(currentToken)

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken
      }
    })

  } catch (error: any) {
    console.error('Token refresh error:', error)
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    })
  }
})

export default router