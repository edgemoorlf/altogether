import { io, Socket } from 'socket.io-client'
import { store } from '../store'
import { setOnlineUsers, addOnlineUser, removeOnlineUser } from '../store/userSlice'

// Import constants directly since shared package might not be built yet
const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // User events
  WELCOME: 'welcome',
  USER_JOINED: 'userJoined',
  USER_LEFT: 'userLeft',
  
  // Room events
  JOIN_ROOM: 'joinRoom',
  ROOM_JOINED: 'roomJoined',
  USER_JOINED_ROOM: 'userJoinedRoom',
  USER_LEFT_ROOM: 'userLeftRoom',
  
  // Movement events
  PLAYER_MOVE: 'playerMove',
  PLAYER_MOVED: 'playerMoved',
  
  // Chat events
  CHAT_MESSAGE: 'chatMessage',
  
  // WebRTC events
  CALL_OFFER: 'callOffer',
  CALL_ANSWER: 'callAnswer',
  ICE_CANDIDATE: 'iceCandidate'
} as const

class SocketService {
  private socket: Socket | null = null
  private isConnected = false

  connect() {
    if (this.socket?.connected) {
      return this.socket
    }

    const serverUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://your-production-domain.com' 
      : 'http://localhost:3001'

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })

    this.setupEventListeners()
    return this.socket
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true
      console.log('✅ Connected to server:', this.socket?.id)
    })

    this.socket.on('disconnect', () => {
      this.isConnected = false
      console.log('❌ Disconnected from server')
    })

    // Welcome event
    this.socket.on(SOCKET_EVENTS.WELCOME, (data) => {
      console.log('👋 Welcome message:', data.message)
      store.dispatch(setOnlineUsers(data.connectedUsers || []))
    })

    // User events
    this.socket.on(SOCKET_EVENTS.USER_JOINED, (data) => {
      console.log('👤 User joined:', data.username)
      store.dispatch(addOnlineUser({
        id: data.userId,
        username: data.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
        isOnline: true,
        socketId: data.userId
      }))
    })

    this.socket.on(SOCKET_EVENTS.USER_LEFT, (data) => {
      console.log('👋 User left:', data.userId)
      store.dispatch(removeOnlineUser(data.userId))
      // Dispatch to game scene
      window.dispatchEvent(new CustomEvent('userLeft', { detail: data }))
    })

    // Movement events
    this.socket.on(SOCKET_EVENTS.PLAYER_MOVED, (data) => {
      // This will be handled by the game scene
      window.dispatchEvent(new CustomEvent('playerMoved', { detail: data }))
    })

    // Room events
    this.socket.on(SOCKET_EVENTS.ROOM_JOINED, (data) => {
      console.log('🏠 Joined room:', data.roomId)
    })

    this.socket.on(SOCKET_EVENTS.USER_JOINED_ROOM, (data) => {
      console.log('👥 User joined room:', data.username)
    })

    this.socket.on(SOCKET_EVENTS.USER_LEFT_ROOM, (data) => {
      console.log('👋 User left room:', data.username)
    })

    // Chat events (for future implementation)
    this.socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (data) => {
      console.log('💬 Chat message:', data)
      // Dispatch custom event for chat component
      window.dispatchEvent(new CustomEvent('chatMessage', { detail: data }))
    })

    // WebRTC events
    this.socket.on(SOCKET_EVENTS.CALL_OFFER, (data) => {
      console.log('📞 Received call offer from:', data.fromUserId)
      window.dispatchEvent(new CustomEvent('webrtcCallOffer', { 
        detail: { userId: data.fromUserId, offer: data.offer } 
      }))
    })

    this.socket.on(SOCKET_EVENTS.CALL_ANSWER, (data) => {
      console.log('📞 Received call answer from:', data.fromUserId)
      window.dispatchEvent(new CustomEvent('webrtcCallAnswer', { 
        detail: { userId: data.fromUserId, answer: data.answer } 
      }))
    })

    this.socket.on(SOCKET_EVENTS.ICE_CANDIDATE, (data) => {
      console.log('🧊 Received ICE candidate from:', data.fromUserId)
      window.dispatchEvent(new CustomEvent('webrtcIceCandidate', { 
        detail: { userId: data.fromUserId, candidate: data.candidate } 
      }))
    })
  }

  // Send player movement
  sendPlayerMove(position: { x: number; y: number }) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.PLAYER_MOVE, position)
    }
  }

  // Join a room
  joinRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomId)
    }
  }

  // Send chat message
  sendChatMessage(message: string, roomId?: string) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { message, roomId })
    }
  }

  // WebRTC signaling methods
  sendCallOffer(targetUserId: string, offer: RTCSessionDescriptionInit) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.CALL_OFFER, { targetUserId, offer })
    }
  }

  sendCallAnswer(targetUserId: string, answer: RTCSessionDescriptionInit) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.CALL_ANSWER, { targetUserId, answer })
    }
  }

  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidate) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.ICE_CANDIDATE, { targetUserId, candidate })
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  get connected() {
    return this.isConnected
  }

  get socketId() {
    return this.socket?.id
  }
}

// Export singleton instance
export const socketService = new SocketService()