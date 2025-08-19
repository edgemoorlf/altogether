// User types
export interface User {
  id: string
  username: string
  email?: string
  avatar: string
  isOnline: boolean
  createdAt?: string
}

export interface UserPosition {
  x: number
  y: number
}

export interface ConnectedUser extends User {
  socketId: string
  room?: string
  position?: UserPosition
}

// Room types
export interface Room {
  id: string
  name: string
  description: string
  maxUsers: number
  currentUsers: number
  type: 'office' | 'meeting' | 'social' | 'custom'
  createdAt?: string
}

// Chat types
export interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: string
  roomId?: string
}

// Game types
export interface GameState {
  isGameLoaded: boolean
  currentRoom: string | null
  playerPosition: UserPosition | null
  connectedUsers: string[]
  isAudioEnabled: boolean
  isVideoEnabled: boolean
}

// Socket events
export interface SocketEvents {
  // Connection events
  welcome: {
    message: string
    userId: string
    connectedUsers: ConnectedUser[]
  }
  
  userJoined: {
    userId: string
    username: string
  }
  
  userLeft: {
    userId: string
  }

  // Room events
  joinRoom: string // roomId
  roomJoined: {
    roomId: string
  }
  
  userJoinedRoom: {
    userId: string
    username: string
  }
  
  userLeftRoom: {
    userId: string
    username: string
  }

  // Movement events
  playerMove: UserPosition
  playerMoved: {
    userId: string
    position: UserPosition
  }

  // Chat events
  chatMessage: ChatMessage

  // WebRTC events
  callOffer: {
    targetUserId: string
    offer: any
  }
  
  callAnswer: {
    targetUserId: string
    answer: any
  }
  
  iceCandidate: {
    targetUserId: string
    candidate: any
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AuthResponse {
  success: boolean
  user: User
  token: string
}

export interface RoomsResponse {
  success: boolean
  rooms: Room[]
}