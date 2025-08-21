import { createSlice } from '@reduxjs/toolkit'

interface DebugState {
  showWebRTCPanel: boolean
  showGameDebug: boolean
  showSocketDebug: boolean
}

const initialState: DebugState = {
  showWebRTCPanel: false,
  showGameDebug: false,
  showSocketDebug: false
}

const debugSlice = createSlice({
  name: 'debug',
  initialState,
  reducers: {
    toggleWebRTCPanel: (state) => {
      state.showWebRTCPanel = !state.showWebRTCPanel
      console.log(`🔧 WebRTC Debug Panel: ${state.showWebRTCPanel ? 'ON' : 'OFF'}`)
    },
    setWebRTCPanel: (state, action) => {
      state.showWebRTCPanel = action.payload
      console.log(`🔧 WebRTC Debug Panel: ${state.showWebRTCPanel ? 'ON' : 'OFF'}`)
    },
    toggleGameDebug: (state) => {
      state.showGameDebug = !state.showGameDebug
      console.log(`🎮 Game Debug: ${state.showGameDebug ? 'ON' : 'OFF'}`)
    },
    setGameDebug: (state, action) => {
      state.showGameDebug = action.payload
      console.log(`🎮 Game Debug: ${state.showGameDebug ? 'ON' : 'OFF'}`)
    },
    toggleSocketDebug: (state) => {
      state.showSocketDebug = !state.showSocketDebug
      console.log(`📡 Socket Debug: ${state.showSocketDebug ? 'ON' : 'OFF'}`)
    },
    setSocketDebug: (state, action) => {
      state.showSocketDebug = action.payload
      console.log(`📡 Socket Debug: ${state.showSocketDebug ? 'ON' : 'OFF'}`)
    }
  }
})

export const { 
  toggleWebRTCPanel, 
  setWebRTCPanel, 
  toggleGameDebug, 
  setGameDebug, 
  toggleSocketDebug, 
  setSocketDebug 
} = debugSlice.actions

export default debugSlice.reducer