import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

// JWT secret (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'altogether-dev-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  username: string
  email: string
  iat?: number
  exp?: number
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export class AuthService {
  // Generate JWT token
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })
  }

  // Verify JWT token
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  // Middleware to authenticate requests
  static authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    try {
      const payload = AuthService.verifyToken(token)
      req.user = payload
      next()
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      })
    }
  }

  // Optional authentication middleware (doesn't fail if no token)
  static optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      try {
        const payload = AuthService.verifyToken(token)
        req.user = payload
      } catch (error) {
        // Token is invalid, but we continue without user
        console.log('Invalid token in optional auth:', error)
      }
    }

    next()
  }

  // Refresh token (generate new token with updated info)
  static refreshToken(currentToken: string): string {
    const payload = AuthService.verifyToken(currentToken)
    // Remove the iat and exp fields for new token
    const { iat, exp, ...refreshPayload } = payload
    return AuthService.generateToken(refreshPayload)
  }
}

// Validation helpers
export class ValidationService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validateUsername(username: string): boolean {
    // Username: 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  static validatePassword(password: string): boolean {
    // Password: at least 6 characters
    return password && password.length >= 6
  }

  static validateRegisterData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.username) {
      errors.push('Username is required')
    } else if (!this.validateUsername(data.username)) {
      errors.push('Username must be 3-20 characters, alphanumeric and underscores only')
    }

    if (!data.email) {
      errors.push('Email is required')
    } else if (!this.validateEmail(data.email)) {
      errors.push('Invalid email format')
    }

    if (!data.password) {
      errors.push('Password is required')
    } else if (!this.validatePassword(data.password)) {
      errors.push('Password must be at least 6 characters')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  static validateLoginData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.username && !data.email) {
      errors.push('Username or email is required')
    }

    if (!data.password) {
      errors.push('Password is required')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}