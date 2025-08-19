import express from 'express'

const router = express.Router()

// Mock rooms data
const mockRooms = [
  {
    id: 'office-main',
    name: '主办公区',
    description: '开放式办公空间',
    maxUsers: 50,
    currentUsers: 0,
    type: 'office'
  },
  {
    id: 'meeting-room-1',
    name: '会议室 1',
    description: '小型会议室，适合5-8人',
    maxUsers: 8,
    currentUsers: 0,
    type: 'meeting'
  },
  {
    id: 'break-area',
    name: '休息区',
    description: '放松聊天的地方',
    maxUsers: 20,
    currentUsers: 0,
    type: 'social'
  }
]

// Get all rooms
router.get('/', (req, res) => {
  res.json({
    success: true,
    rooms: mockRooms
  })
})

// Get specific room
router.get('/:roomId', (req, res) => {
  const { roomId } = req.params
  const room = mockRooms.find(r => r.id === roomId)
  
  if (!room) {
    return res.status(404).json({
      error: 'Room not found'
    })
  }

  res.json({
    success: true,
    room
  })
})

// Create new room (basic implementation)
router.post('/', (req, res) => {
  const { name, description, maxUsers = 10, type = 'office' } = req.body
  
  if (!name) {
    return res.status(400).json({
      error: 'Room name is required'
    })
  }

  const newRoom = {
    id: `room_${Date.now()}`,
    name,
    description: description || '',
    maxUsers,
    currentUsers: 0,
    type,
    createdAt: new Date().toISOString()
  }

  mockRooms.push(newRoom)

  res.status(201).json({
    success: true,
    room: newRoom
  })
})

export default router