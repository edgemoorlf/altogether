import { store } from '../store'
import { toggleWebRTCPanel, setWebRTCPanel, toggleGameDebug, setGameDebug, toggleSocketDebug, setSocketDebug } from '../store/debugSlice'

// Console debug helpers - available globally via window object
const debugHelpers = {
  // WebRTC Debug Panel
  showWebRTC: () => store.dispatch(setWebRTCPanel(true)),
  hideWebRTC: () => store.dispatch(setWebRTCPanel(false)),
  toggleWebRTC: () => store.dispatch(toggleWebRTCPanel()),
  
  // Game Debug
  showGame: () => store.dispatch(setGameDebug(true)),
  hideGame: () => store.dispatch(setGameDebug(false)),
  toggleGame: () => store.dispatch(toggleGameDebug()),
  
  // Socket Debug
  showSocket: () => store.dispatch(setSocketDebug(true)),
  hideSocket: () => store.dispatch(setSocketDebug(false)),
  toggleSocket: () => store.dispatch(toggleSocketDebug()),
  
  // Show all debug info
  showAll: () => {
    store.dispatch(setWebRTCPanel(true))
    store.dispatch(setGameDebug(true))
    store.dispatch(setSocketDebug(true))
    console.log('🔧 All debug panels enabled')
  },
  
  // Hide all debug info
  hideAll: () => {
    store.dispatch(setWebRTCPanel(false))
    store.dispatch(setGameDebug(false))
    store.dispatch(setSocketDebug(false))
    console.log('🔧 All debug panels disabled')
  },
  
  // Show help
  help: () => {
    console.log(`
🔧 Altogether Debug Console Commands:

WebRTC Debug Panel:
  debug.showWebRTC()   - Show WebRTC debug panel
  debug.hideWebRTC()   - Hide WebRTC debug panel  
  debug.toggleWebRTC() - Toggle WebRTC debug panel

Game Debug:
  debug.showGame()     - Show game debug info
  debug.hideGame()     - Hide game debug info
  debug.toggleGame()   - Toggle game debug info

Socket Debug:
  debug.showSocket()   - Show socket debug info
  debug.hideSocket()   - Hide socket debug info
  debug.toggleSocket() - Toggle socket debug info

General:
  debug.showAll()      - Show all debug panels
  debug.hideAll()      - Hide all debug panels
  debug.help()         - Show this help message
  debug.status()       - Show current debug states
    `)
  },
  
  // Show current status
  status: () => {
    const state = store.getState().debug
    console.log('🔧 Debug Panel Status:', {
      WebRTC: state.showWebRTCPanel ? '✅ ON' : '❌ OFF',
      Game: state.showGameDebug ? '✅ ON' : '❌ OFF', 
      Socket: state.showSocketDebug ? '✅ ON' : '❌ OFF'
    })
    return state
  }
}

// Make debug helpers available globally
export const setupDebugConsole = () => {
  // Add to window object for global access
  ;(window as any).debug = debugHelpers
  
  // Log initial setup
  console.log(`
🎮 Altogether Debug Console Ready!

Type 'debug.help()' to see all available commands
Type 'debug.showWebRTC()' to show the WebRTC debug panel
  `)
}

export default debugHelpers