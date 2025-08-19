import { configureStore } from '@reduxjs/toolkit'
import gameReducer from './gameSlice'
import userReducer from './userSlice'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    game: gameReducer,
    user: userReducer,
    auth: authReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch