import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { setupSocketHandlers } from './services/socketService.js'
import authRoutes from './routes/auth.js'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)

// Configure CORS origins
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']

// Socket.IO setup with CORS
const io = new SocketServer(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: corsOrigins,
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Altogether server is running',
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.use('/api/auth', authRoutes)

// Socket.IO connection handling
setupSocketHandlers(io)

// Basic error handling
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err)
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Altogether server running on port ${PORT}`)
  console.log(`📡 Socket.IO server ready`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
})