import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: string
  username: string
  email: string
  avatar: string
  isOnline: boolean
  socketId: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('auth_token'),
  loading: false,
  error: null
}

interface LoginPayload {
  user: User
  token: string
}

interface RegisterPayload {
  user: User
  token: string
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    
    loginSuccess: (state, action: PayloadAction<LoginPayload>) => {
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.loading = false
      state.error = null
      // Store token in localStorage
      localStorage.setItem('auth_token', action.payload.token)
    },
    
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.loading = false
      state.error = action.payload
      // Remove token from localStorage
      localStorage.removeItem('auth_token')
    },
    
    registerStart: (state) => {
      state.loading = true
      state.error = null
    },
    
    registerSuccess: (state, action: PayloadAction<RegisterPayload>) => {
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.loading = false
      state.error = null
      // Store token in localStorage
      localStorage.setItem('auth_token', action.payload.token)
    },
    
    registerFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.loading = false
      state.error = action.payload
    },
    
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.loading = false
      state.error = null
      // Remove token from localStorage
      localStorage.removeItem('auth_token')
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    // Initialize auth state from localStorage on app load
    initializeAuth: (state) => {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData)
          state.isAuthenticated = true
          state.user = user
          state.token = token
        } catch (error) {
          // Clear invalid data
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
        }
      }
    }
  },
})

// Action creators (for convenience)
export const login = (payload: LoginPayload) => (dispatch: any) => {
  dispatch(loginStart())
  try {
    dispatch(loginSuccess(payload))
    // Store user data in localStorage for persistence
    localStorage.setItem('user_data', JSON.stringify(payload.user))
  } catch (error) {
    dispatch(loginFailure('登录失败'))
  }
}

export const register = (payload: RegisterPayload) => (dispatch: any) => {
  dispatch(registerStart())
  try {
    dispatch(registerSuccess(payload))
    // Store user data in localStorage for persistence
    localStorage.setItem('user_data', JSON.stringify(payload.user))
  } catch (error) {
    dispatch(registerFailure('注册失败'))
  }
}

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
  updateUser,
  clearError,
  initializeAuth
} = authSlice.actions

export default authSlice.reducer