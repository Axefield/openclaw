// Simple web server to run alongside the existing Ouranigon MCP server
import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)
const io = new SocketServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

// Serve static files from frontend dist (when built)
app.use(express.static(path.join(__dirname, 'frontend/dist')))

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ouranigon: {
      mcpServer: 'running',
      webServer: 'running',
      theme: 'celestial'
    }
  })
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
  
  socket.on('join-room', (room) => {
    socket.join(room)
    console.log(`Client ${socket.id} joined room: ${room}`)
  })
})

// Serve React app for all other routes
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'))
})

const PORT = 3001

server.listen(PORT, () => {
  console.log(`🌌 Ouranigon Web Server running on port ${PORT}`)
  console.log(`🎨 Celestial theme active`)
  console.log(`📡 WebSocket server ready`)
  console.log(`🔗 Access at: http://localhost:${PORT}`)
})
