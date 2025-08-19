import bcrypt from 'bcryptjs'

export interface User {
  id: string
  username: string
  email: string
  password: string // hashed
  avatar: string
  isOnline: boolean
  socketId?: string
  createdAt: Date
  updatedAt: Date
}

// In-memory user store (TODO: Replace with real database)
class UserStore {
  private users: Map<string, User> = new Map()
  private emailIndex: Map<string, string> = new Map() // email -> userId
  private usernameIndex: Map<string, string> = new Map() // username -> userId

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'password'> & { password: string }): Promise<User> {
    // Check if email or username already exists
    if (this.emailIndex.has(userData.email)) {
      throw new Error('Email already exists')
    }
    if (this.usernameIndex.has(userData.username)) {
      throw new Error('Username already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Create user
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const user: User = {
      ...userData,
      id: userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Store user and update indices
    this.users.set(userId, user)
    this.emailIndex.set(userData.email, userId)
    this.usernameIndex.set(userData.username, userId)

    return user
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email)
    return userId ? this.users.get(userId) || null : null
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const userId = this.usernameIndex.get(username)
    return userId ? this.users.get(userId) || null : null
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password)
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const user = this.users.get(id)
    if (!user) return null

    // Handle username/email changes and update indices
    if (updates.username && updates.username !== user.username) {
      if (this.usernameIndex.has(updates.username)) {
        throw new Error('Username already exists')
      }
      this.usernameIndex.delete(user.username)
      this.usernameIndex.set(updates.username, id)
    }

    if (updates.email && updates.email !== user.email) {
      if (this.emailIndex.has(updates.email)) {
        throw new Error('Email already exists')
      }
      this.emailIndex.delete(user.email)
      this.emailIndex.set(updates.email, id)
    }

    // Hash password if being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10)
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    }

    this.users.set(id, updatedUser)
    return updatedUser
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id)
    if (!user) return false

    this.users.delete(id)
    this.emailIndex.delete(user.email)
    this.usernameIndex.delete(user.username)
    return true
  }

  // Get all users (for admin purposes)
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
  }

  // Get user without password field (for API responses)
  getUserSafe(user: User): Omit<User, 'password'> {
    const { password, ...safeUser } = user
    return safeUser
  }
}

// Export singleton instance
export const userStore = new UserStore()