// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me'
  },
  ROOMS: {
    LIST: '/api/rooms',
    GET: (id: string) => `/api/rooms/${id}`,
    CREATE: '/api/rooms'
  }
} as const

// Socket event names
export const SOCKET_EVENTS = {
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

// Game constants
export const GAME_CONFIG = {
  PLAYER_SPEED: 200,
  WORLD_WIDTH: 1200,
  WORLD_HEIGHT: 800,
  PLAYER_SIZE: 32
} as const

// Room types
export const ROOM_TYPES = {
  OFFICE: 'office',
  MEETING: 'meeting',
  SOCIAL: 'social',
  CUSTOM: 'custom'
} as const

// Default values
export const DEFAULTS = {
  ROOM_MAX_USERS: 10,
  CHAT_MESSAGE_LIMIT: 100,
  HEARTBEAT_INTERVAL: 30000 // 30 seconds
} as const