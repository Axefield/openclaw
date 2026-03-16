import express from 'express'
import cors from 'cors'
import { createServer as createHttpServer } from 'http'
import { createServer as createHttpsServer } from 'https'
import { readFileSync } from 'fs'
import { Server as SocketServer } from 'socket.io'
import Database from 'better-sqlite3'
import path from 'path'
import ollamaRouter from './routes/ollama.js'
import personaRouter from './routes/persona.js'
import usersRouter from './routes/users'
import apiKeysRouter from './routes/apiKeys'
import syncRouter from './routes/sync'
// Memory router requires req.ouranigon (vssStore, embeddingProvider, io). When running
// backend standalone, that is not set; use the inline memory routes below instead.
// import memoryRouter from './routes/memory.js'

const app = express()

// HTTPS Configuration
const USE_HTTPS = process.env.USE_HTTPS === 'true' || process.env.NODE_ENV === 'production'
let server: ReturnType<typeof createHttpServer> | ReturnType<typeof createHttpsServer>

if (USE_HTTPS) {
  const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../certs/cert.pem')
  const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../certs/key.pem')
  
  try {
    const options = {
      cert: readFileSync(certPath),
      key: readFileSync(keyPath)
    }
    server = createHttpsServer(options, app)
    console.log('🔒 HTTPS enabled')
  } catch (error) {
    console.warn('⚠️  HTTPS certificate not found, falling back to HTTP')
    console.warn(`   Expected cert at: ${certPath}`)
    console.warn(`   Expected key at: ${keyPath}`)
    console.warn('   Set USE_HTTPS=false to disable this warning, or provide certificates')
    server = createHttpServer(app)
  }
} else {
  server = createHttpServer(app)
}

// Determine protocol for CORS origins
const protocol = USE_HTTPS ? 'https' : 'http'
const frontendOrigins = [
  `${protocol}://localhost:5173`,
  `${protocol}://localhost:5174`,
  `${protocol}://localhost:3000`
]

const io = new SocketServer(server, {
  cors: {
    origin: frontendOrigins,
    methods: ["GET", "POST"]
  }
})

// CORS configuration
const corsOptions = {
  origin: frontendOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  preflightContinue: false,
  optionsSuccessStatus: 204
}

app.use(cors(corsOptions))
app.use(express.json())

// Ollama routes
app.use('/api/ollama', ollamaRouter)

// Persona routes
app.use('/api/personas', personaRouter)

// User and API key routes
app.use('/api/users', usersRouter)
app.use('/api/api-keys', apiKeysRouter)

// User sync routes (for parent domain integration)
app.use('/api/sync', syncRouter)

// Memory routes (Smart-Thinking features) – inline handlers below use pcm.db and io.
// To use the VSS-backed memory router instead, attach req.ouranigon in middleware and uncomment:
// app.use('/api/memories', memoryRouter)

// Connect to the real memory database
const dbPath = path.join(__dirname, '../../pcm.db')
const db = new Database(dbPath)

// Memory data structure to match the database
interface Memory {
  id: string;
  text: string;
  tags: string[];
  importance: number;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null;
  sessionId: string | null;
  embedding: number[];
  usage: number;
  type: 'episodic' | 'semantic' | 'procedural';
  source: 'plan' | 'signal' | 'execution' | 'account';
  confidence: number;
  lastUsed: number;
  decay: number;
  belief: boolean;
  mergedFrom: string[];
  outcome: 'success' | 'failure' | 'neutral' | null;
  score: number | null;
  efficiency: number | null;
  notes: string | null;
  features: { [key: string]: any };
  helpful: boolean | null;
  servedContextId: string | null;
}

// Helper to map database rows to memory objects
function mapRowToMemory(r: any): Memory {
  return {
    id: r.id,
    text: r.text,
    tags: JSON.parse(r.tags),
    importance: r.importance,
    pinned: !!r.pinned,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    expiresAt: r.expires_at ?? null,
    sessionId: r.session_id ?? null,
    embedding: JSON.parse(r.embedding),
    usage: r.usage,
    type: r.type,
    source: r.source,
    confidence: r.confidence,
    lastUsed: r.last_used,
    decay: r.decay,
    belief: !!r.belief,
    mergedFrom: JSON.parse(r.merged_from || '[]'),
    outcome: r.outcome ?? null,
    score: r.score ?? null,
    efficiency: r.efficiency ?? null,
    notes: r.notes ?? null,
    features: JSON.parse(r.features || '{}'),
    helpful: r.helpful === 1 ? true : r.helpful === 0 ? false : null,
    servedContextId: r.served_context_id ?? null
  };
}

// Get memories from database
function getMemories(): Memory[] {
  const rows = db.prepare('SELECT * FROM memories').all();
  return rows.map(mapRowToMemory);
}

// Memory routes
app.get('/api/memories', (req, res) => {
  try {
    const memories = getMemories()
    res.json({
      success: true,
      data: memories
    })
  } catch (error) {
    console.error('Error fetching memories:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memories'
    })
  }
})

app.get('/api/memories/:id', (req, res) => {
  try {
    const { id } = req.params
    const memory = getMemories().find(m => m.id === id)
    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      })
    }
    res.json({
      success: true,
      data: memory
    })
  } catch (error) {
    console.error('Error fetching memory:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memory'
    })
  }
})

app.post('/api/memories', (req, res) => {
  try {
    const { text, tags = [], importance = 0.5, type = 'episodic', source = 'plan', confidence = 1.0 } = req.body
    
    const now = Date.now()
    const id = Date.now().toString()
    
    const memory = {
      id,
      text,
      tags,
      importance,
      type,
      source,
      confidence,
      createdAt: now,
      updatedAt: now,
      pinned: false,
      usage: 0,
      embedding: [],
      lastUsed: now,
      decay: 0.01,
      belief: false,
      mergedFrom: [],
      expiresAt: null,
      sessionId: null,
      outcome: null,
      score: null,
      efficiency: null,
      notes: null,
      features: {},
      helpful: null,
      servedContextId: null
    }
    
    db.prepare(`
      INSERT INTO memories (id, text, tags, importance, pinned, created_at, updated_at, expires_at, session_id, embedding, usage, type, source, confidence, last_used, decay, belief, merged_from, outcome, score, efficiency, notes, features, helpful, served_context_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, text, JSON.stringify(tags), importance, 0, now, now, null, null, JSON.stringify([]), 0,
      type, source, confidence, now, 0.01, 0, JSON.stringify([]), null, null, null, null, JSON.stringify({}), null, null
    )
    
    io.emit('memory_created', memory)
    
    res.json({
      success: true,
      data: memory
    })
  } catch (error) {
    console.error('Error creating memory:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create memory'
    })
  }
})

app.post('/api/memories/search', (req, res) => {
  try {
    const { query } = req.body
    const memories = getMemories()
    const results = memories.filter(m => m.text.toLowerCase().includes(query.toLowerCase()))
    
    res.json({
      success: true,
      data: {
        query,
        results,
        count: results.length
      }
    })
  } catch (error) {
    console.error('Error searching memories:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search memories'
    })
  }
})

app.put('/api/memories/:id', (req, res) => {
  try {
    const { id } = req.params
    const { text } = req.body
    
    const now = Date.now()
    
    const result = db.prepare('SELECT * FROM memories WHERE id = ?').get(id)
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      })
    }
    
    db.prepare('UPDATE memories SET text = ?, updated_at = ? WHERE id = ?').run(text, now, id)
    
    const updated = getMemories().find(m => m.id === id)
    io.emit('memory_updated', updated)
    
    res.json({
      success: true,
      data: updated
    })
  } catch (error) {
    console.error('Error updating memory:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update memory'
    })
  }
})

app.delete('/api/memories/:id', (req, res) => {
  try {
    const { id } = req.params
    
    const result = db.prepare('DELETE FROM memories WHERE id = ?').run(id)
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      })
    }
    
    io.emit('memory_deleted', { id })
    
    res.json({
      success: true,
      message: 'Memory deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting memory:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete memory'
    })
  }
})

app.patch('/api/memories/:id/pin', (req, res) => {
  try {
    const { id } = req.params
    const { pinned = true } = req.body
    
    db.prepare('UPDATE memories SET pinned = ?, updated_at = ? WHERE id = ?').run(pinned ? 1 : 0, Date.now(), id)
    
    const memory = getMemories().find(m => m.id === id)
    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      })
    }
    
    io.emit('memory_pinned', { id, pinned })
    
    res.json({
      success: true,
      data: memory
    })
  } catch (error) {
    console.error('Error pinning memory:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to pin memory'
    })
  }
})

// Reasoning routes
app.post('/api/reasoning/angel-demon-balance', (req, res) => {
  const { topic, theta = 45, phi = 30 } = req.body
  
  const result = {
    topic,
    theta,
    phi,
    angelSignal: Math.random(),
    demonSignal: Math.random(),
    decision: Math.random() > 0.5 ? 'POSITIVE' : 'NEGATIVE',
    confidence: Math.random(),
    rationale: `Analysis for ${topic}`
  }
  
  io.emit('angel_demon_balance', result)
  
  res.json({
    success: true,
    data: result
  })
})

app.post('/api/reasoning/steelman', (req, res) => {
  const { opponentClaim } = req.body
  
  const result = {
    originalClaim: opponentClaim,
    improvedClaim: `Improved version: ${opponentClaim}`,
    premises: [],
    confidence: 0.8
  }
  
  io.emit('steelman_analysis', result)
  
  res.json({
    success: true,
    data: result
  })
})

app.post('/api/reasoning/strawman', (req, res) => {
  const { opponentClaim } = req.body
  
  const result = {
    originalClaim: opponentClaim,
    distortedClaim: `Distorted: ${opponentClaim}`,
    identifiedDistortions: ['exaggeration'],
    confidence: 0.7
  }
  
  io.emit('strawman_analysis', result)
  
  res.json({
    success: true,
    data: result
  })
})

// Error handling middleware (must be after all routes)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// Health check – shape matches frontend SystemHealth (mcp + ouranigon)
app.get('/api/health', (req, res) => {
  try {
    const memories = getMemories()
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      memories: memories.length,
      mcp: {
        connected: false,
        pid: undefined
      },
      ouranigon: {
        memoryStore: true,
        vssStore: false,
        embeddingProvider: false,
        mindBalanceTool: false,
        steelmanTool: false,
        strawmanTool: false
      }
    })
  } catch (error) {
    console.error('Error checking health:', error)
    res.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to connect to memory database',
      mcp: { connected: false },
      ouranigon: {
        memoryStore: false,
        vssStore: false,
        embeddingProvider: false,
        mindBalanceTool: false,
        steelmanTool: false,
        strawmanTool: false
      }
    })
  }
})

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = 3122

server.listen(PORT, '0.0.0.0', () => {
  const memoryCount = getMemories().length
  const protocol = USE_HTTPS ? 'https' : 'http'
  console.log(`🌌 Ouranigon API server running on port ${PORT}`)
  console.log(`🔗 API available at: ${protocol}://localhost:${PORT}/api`)
  console.log(`📡 WebSocket server ready (${USE_HTTPS ? 'WSS' : 'WS'})`)
  console.log(`🧠 Memory system with ${memoryCount} memories`)
  console.log(`🌐 CORS enabled for: ${frontendOrigins.join(', ')}`)
  if (USE_HTTPS) {
    console.log(`🔒 HTTPS/TLS enabled`)
  }
})

// Handle server errors
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other server or use a different port.`)
  } else {
    console.error('❌ Server error:', err)
  }
  process.exit(1)
})