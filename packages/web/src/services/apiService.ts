// API configuration and service functions for authentication

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-domain.com/api' 
  : 'http://localhost:3001/api'

export interface LoginRequest {
  username?: string
  email?: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  avatar?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: string[]
}

export interface AuthResponseData {
  user: {
    id: string
    username: string
    email: string
    avatar: string
    isOnline: boolean
    socketId?: string
    createdAt: string
    updatedAt: string
  }
  token: string
}

class ApiService {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Helper method to make HTTP requests
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add authorization header if token exists
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      }
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponseData>> {
    return this.request<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponseData>> {
    return this.request<AuthResponseData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  async getProfile(): Promise<ApiResponse<{ user: AuthResponseData['user'] }>> {
    return this.request('/auth/me')
  }

  async updateProfile(updates: UpdateProfileRequest): Promise<ApiResponse<{ user: AuthResponseData['user'] }>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request('/auth/refresh', {
      method: 'POST',
    })
  }

  // Helper method to check if we're authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token')
    if (!token) return false

    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Date.now() / 1000
      return payload.exp > now
    } catch {
      return false
    }
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  // Set authentication data
  setAuth(token: string, user: AuthResponseData['user']): void {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(user))
  }
}

// Export singleton instance
export const apiService = new ApiService()