import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface GameState {
  isGameLoaded: boolean
  currentRoom: string | null
  playerPosition: { x: number; y: number } | null
  connectedUsers: string[]
  isAudioEnabled: boolean
  isVideoEnabled: boolean
}

const initialState: GameState = {
  isGameLoaded: false,
  currentRoom: null,
  playerPosition: null,
  connectedUsers: [],
  isAudioEnabled: false,
  isVideoEnabled: false,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameLoaded: (state, action: PayloadAction<boolean>) => {
      state.isGameLoaded = action.payload
    },
    setCurrentRoom: (state, action: PayloadAction<string>) => {
      state.currentRoom = action.payload
    },
    setPlayerPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.playerPosition = action.payload
    },
    setConnectedUsers: (state, action: PayloadAction<string[]>) => {
      state.connectedUsers = action.payload
    },
    toggleAudio: (state) => {
      state.isAudioEnabled = !state.isAudioEnabled
    },
    toggleVideo: (state) => {
      state.isVideoEnabled = !state.isVideoEnabled
    },
  },
})

export const {
  setGameLoaded,
  setCurrentRoom,
  setPlayerPosition,
  setConnectedUsers,
  toggleAudio,
  toggleVideo,
} = gameSlice.actions

export default gameSlice.reducer