import { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'

interface UserSocket {
  id: string
  userId?: string
  username?: string
  room?: string
  position?: { x: number; y: number }
}

const connectedUsers = new Map<string, UserSocket>()

export const setupSocketHandlers = (io: SocketServer) => {
  io.use((socket, next) => {
    // Optional: JWT authentication for socket connections
    const token = socket.handshake.auth.token
    const username = socket.handshake.auth.username
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        socket.data.userId = decoded.userId
        socket.data.username = decoded.username
        console.log('🔑 Socket authenticated via JWT:', decoded.username)
      } catch (error) {
        // Continue without auth for now (development)
        console.log('Socket auth failed, continuing without auth')
      }
    }
    
    // For development: Also check for direct username in auth
    if (username && !socket.data.username) {
      socket.data.username = username
      console.log('🔑 Socket authenticated via username:', username)
    }
    
    next()
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)
    
    // Store connected user
    connectedUsers.set(socket.id, {
      id: socket.id,
      userId: socket.data.userId,
      username: socket.data.username || `User-${socket.id.slice(0, 6)}`
    })

    // Send welcome message with all existing users and their positions
    const existingUsers = Array.from(connectedUsers.values()).filter(u => u.id !== socket.id)
    socket.emit('welcome', {
      message: '欢迎来到 Altogether 虚拟办公室!',
      userId: socket.id,
      connectedUsers: Array.from(connectedUsers.values()),
      existingUserPositions: existingUsers.map(u => ({
        userId: u.id,
        username: u.username,
        position: u.position || { x: 400, y: 300 }
      }))
    })

    // Broadcast to others that a new user joined
    socket.broadcast.emit('userJoined', {
      userId: socket.id,
      username: connectedUsers.get(socket.id)?.username,
      position: { x: 400, y: 300 } // Default spawn position
    })

    // Handle joining a room
    socket.on('joinRoom', (roomId: string) => {
      const user = connectedUsers.get(socket.id)
      if (user) {
        // Leave current room
        if (user.room) {
          socket.leave(user.room)
          socket.to(user.room).emit('userLeftRoom', {
            userId: socket.id,
            username: user.username
          })
        }

        // Join new room
        socket.join(roomId)
        user.room = roomId
        connectedUsers.set(socket.id, user)

        socket.to(roomId).emit('userJoinedRoom', {
          userId: socket.id,
          username: user.username
        })

        socket.emit('roomJoined', { roomId })
      }
    })

    // Handle user movement
    socket.on('playerMove', (data: { x: number; y: number }) => {
      const user = connectedUsers.get(socket.id)
      if (!user) {
        console.warn('❌ Movement from unknown user:', socket.id)
        return
      }

      // Validate movement data
      if (!data || typeof data.x !== 'number' || typeof data.y !== 'number' || 
          isNaN(data.x) || isNaN(data.y) ||
          data.x === null || data.x === undefined || 
          data.y === null || data.y === undefined) {
        console.warn(`❌ Invalid movement data from ${user.username}:`, data)
        return
      }

      // Additional bounds checking
      if (data.x < -1000 || data.x > 2000 || data.y < -1000 || data.y > 1500) {
        console.warn(`❌ Movement out of bounds from ${user.username}:`, data)
        return
      }

      // Update user position
      user.position = { x: data.x, y: data.y }
      connectedUsers.set(socket.id, user)
      
      console.log(`📍 Player ${user.username} moved to:`, { x: data.x, y: data.y })
      
      // Broadcast to all other users in the same room
      if (user.room) {
        console.log(`📡 Broadcasting movement to room: ${user.room}`)
        socket.to(user.room).emit('playerMoved', {
          userId: socket.id,
          position: { x: data.x, y: data.y }
        })
      } else {
        // Broadcast to all other users globally if not in a specific room
        console.log(`📡 Broadcasting movement globally`)
        socket.broadcast.emit('playerMoved', {
          userId: socket.id,
          position: { x: data.x, y: data.y }
        })
      }
    })

    // Handle chat messages
    socket.on('chatMessage', (data: { message: string; roomId?: string }) => {
      const user = connectedUsers.get(socket.id)
      if (user && data.message.trim()) {
        const chatData = {
          userId: socket.id,
          username: user.username,
          message: data.message.trim(),
          timestamp: new Date().toISOString()
        }

        console.log('💬 Chat message from', user.username + ':', data.message)

        if (data.roomId) {
          // Send to specific room
          socket.to(data.roomId).emit('chatMessage', chatData)
        } else {
          // Broadcast to all users in the same room or globally
          const targetRoom = user.room || ''
          if (targetRoom) {
            socket.to(targetRoom).emit('chatMessage', chatData)
          } else {
            socket.broadcast.emit('chatMessage', chatData)
          }
        }
      }
    })

    // Handle voice/video call signals
    socket.on('callOffer', (data: { targetUserId: string; offer: any }) => {
      socket.to(data.targetUserId).emit('callOffer', {
        fromUserId: socket.id,
        offer: data.offer
      })
    })

    socket.on('callAnswer', (data: { targetUserId: string; answer: any }) => {
      socket.to(data.targetUserId).emit('callAnswer', {
        fromUserId: socket.id,
        answer: data.answer
      })
    })

    socket.on('iceCandidate', (data: { targetUserId: string; candidate: any }) => {
      socket.to(data.targetUserId).emit('iceCandidate', {
        fromUserId: socket.id,
        candidate: data.candidate
      })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`)
      
      const user = connectedUsers.get(socket.id)
      if (user?.room) {
        socket.to(user.room).emit('userLeftRoom', {
          userId: socket.id,
          username: user.username
        })
      }

      socket.broadcast.emit('userLeft', {
        userId: socket.id
      })

      connectedUsers.delete(socket.id)
    })
  })
}