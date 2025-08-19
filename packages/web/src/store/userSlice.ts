import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  username: string
  avatar: string
  isOnline: boolean
  socketId?: string
}

interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
  onlineUsers: User[]
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  onlineUsers: [],
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload
      state.isAuthenticated = true
    },
    logout: (state) => {
      state.currentUser = null
      state.isAuthenticated = false
    },
    setOnlineUsers: (state, action: PayloadAction<User[]>) => {
      state.onlineUsers = action.payload
    },
    addOnlineUser: (state, action: PayloadAction<User>) => {
      const existingUser = state.onlineUsers.find(user => user.id === action.payload.id)
      if (!existingUser) {
        state.onlineUsers.push(action.payload)
      }
    },
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(user => user.id !== action.payload)
    },
  },
})

export const {
  setCurrentUser,
  logout,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
} = userSlice.actions

export default userSlice.reducer