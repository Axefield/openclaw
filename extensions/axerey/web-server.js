// Ouranigon Web Server - Runs alongside the existing MCP server
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import pino from 'pino'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { ollamaService } from './backend/src/services/ollamaService.js'

const logger = pino({ level: 'info' })
const app = express()
const server = createServer(app)
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve static files from frontend
app.use(express.static('frontend/dist'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ouranigon: {
      mcpServer: 'running',
      webServer: 'running',
      ollama: 'connected'
    }
  })
})

// Ollama integration endpoints
app.post('/api/ollama/generate', async (req, res) => {
  try {
    const { prompt, model } = req.body
    const result = await ollamaService.generate({
      model: model || 'qwen3:0.6b',
      prompt,
      stream: false
    })

    res.json({
      success: true,
      data: {
        response: result.response,
        model: result.model,
        duration: result.total_duration
      }
    })
  } catch (error) {
    logger.error('Generate error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate text'
    })
  }
})

app.post('/api/ollama/embedding', async (req, res) => {
  try {
    const { text } = req.body
    const embedding = await ollamaService.generateEmbedding(text)

    res.json({
      success: true,
      data: {
        embedding,
        dimension: embedding.length
      }
    })
  } catch (error) {
    logger.error('Embedding error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate embedding'
    })
  }
})

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
  
  socket.on('join-room', (room) => {
    socket.join(room)
    logger.info(`Client ${socket.id} joined room: ${room}`)
  })
})

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'frontend/dist' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  logger.info(`Ouranigon Web Server running on port ${PORT}`)
  logger.info(`Frontend served from: http://localhost:${PORT}`)
  logger.info(`API available at: http://localhost:${PORT}/api`)
  logger.info(`WebSocket server ready for connections`)
})

export default app
