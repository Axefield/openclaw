import express from 'express'
import { z } from 'zod'

const router = express.Router()

// Validation schemas
const CreateMemorySchema = z.object({
  text: z.string().min(1, 'Text is required'),
  tags: z.array(z.string()).optional().default([]),
  importance: z.number().min(0).max(1).optional().default(0.5),
  type: z.enum(['episodic', 'semantic', 'procedural']).optional().default('episodic'),
  source: z.enum(['plan', 'signal', 'execution', 'account']).optional().default('plan'),
  confidence: z.number().min(0).max(1).optional().default(0.8),
  belief: z.boolean().optional().default(true),
  features: z.record(z.string(), z.any()).optional()
})

const UpdateMemorySchema = z.object({
  text: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  importance: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  belief: z.boolean().optional(),
  features: z.record(z.string(), z.any()).optional()
})

const SearchMemorySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(100).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.7)
})

// Create new memory
router.post('/', async (req, res) => {
  try {
    const validatedData = CreateMemorySchema.parse(req.body)
    const { vssStore, embeddingProvider } = req.ouranigon

    // Generate embedding using the default embedding provider (hash-based by default)
    const embedding = await embeddingProvider.embed(validatedData.text)

    // Create memory in VSS store
    const memory = await vssStore.create({
      text: validatedData.text,
      tags: validatedData.tags,
      importance: validatedData.importance,
      type: validatedData.type,
      source: validatedData.source,
      confidence: validatedData.confidence,
      embedding,
      lastUsed: Date.now(),
      decay: 0.01,
      belief: validatedData.belief,
      mergedFrom: [],
      expiresAt: null,
      sessionId: null,
      features: validatedData.features || {}
    })

    // Emit real-time update
    req.ouranigon.io.emit('memory_created', memory)

    res.json({
      success: true,
      data: memory
    })
  } catch (error) {
    console.error('Create memory error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create memory'
    })
  }
})

// Get all memories
router.get('/', async (req, res) => {
  try {
    const { vssStore } = req.ouranigon
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const memories = await vssStore.list({})

    res.json({
      success: true,
      data: memories
    })
  } catch (error) {
    console.error('Get memories error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get memories'
    })
  }
})

// IMPORTANT: Specific routes (/:id/quality, /:id/connections, etc.) must come BEFORE the generic /:id route
// Otherwise Express will match /:id first and treat "quality" as part of the id parameter

// Test route to verify routing works
router.get('/test-quality-route', async (req, res) => {
  res.json({ success: true, message: 'Quality route test - routing is working' })
})

// Get all connections (for graph view) - must be before /:id routes
router.get('/connections', async (req, res) => {
  try {
    const { BackendConnectionService } = await import('../services/connectionService.js')
    const service = new BackendConnectionService()
    const limit = parseInt(req.query.limit as string) || 2000
    const offset = parseInt(req.query.offset as string) || 0
    
    const connections = service.getAllConnections(limit, offset)
    res.json({ success: true, data: connections })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get all connections'
    })
  }
})

// Memory-specific routes (must come before generic /:id)
router.get('/:id/connections', async (req, res) => {
  try {
    const { BackendConnectionService } = await import('../services/connectionService.js')
    const { id } = req.params
    const service = new BackendConnectionService()
    const connections = service.getConnections(id)
    res.json({ success: true, data: connections })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get connections'
    })
  }
})

router.get('/:id/verification', async (req, res) => {
  try {
    const { VerificationService } = await import('../services/verificationService.js')
    const { id } = req.params
    const service = new VerificationService()
    const verification = await service.getVerification(id)
    if (!verification) {
      return res.status(404).json({ success: false, error: 'Verification not found' })
    }
    res.json({ success: true, data: verification })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get verification'
    })
  }
})

router.get('/:id/quality', async (req, res) => {
  try {
    console.log(`[Quality Route] Getting quality for memory: ${req.params.id}`)
    const { QualityService } = await import('../services/qualityService.js')
    const { id } = req.params
    const service = new QualityService()
    const quality = await service.getMemoryQuality(id)
    console.log(`[Quality Route] Quality result:`, quality)
    if (!quality) {
      console.log(`[Quality Route] Quality is null, returning 404`)
      return res.status(404).json({ success: false, error: 'Quality metrics not found' })
    }
    res.json({ success: true, data: quality })
  } catch (error) {
    console.error('[Quality Route] Error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quality metrics'
    })
  }
})

router.post('/:id/verify', async (req, res) => {
  try {
    const { VerificationService } = await import('../services/verificationService.js')
    const { id } = req.params
    const options = req.body
    const service = new VerificationService()
    const result = await service.verifyMemory(id, options)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify memory'
    })
  }
})

router.post('/:id/evaluate-quality', async (req, res) => {
  try {
    const { QualityService } = await import('../services/qualityService.js')
    const { id } = req.params
    const { context } = req.body
    const service = new QualityService()
    const metrics = await service.evaluateMemoryQuality(id, context)
    res.json({ success: true, data: metrics })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate quality'
    })
  }
})

// Get memory by ID (must be LAST to avoid catching specific routes)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { vssStore } = req.ouranigon

    const memory = await vssStore.get(id)
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
    console.error('Get memory error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get memory'
    })
  }
})

// Update memory
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = UpdateMemorySchema.parse(req.body)
    const { vssStore } = req.ouranigon

    // If text is being updated, regenerate embedding
    if (validatedData.text) {
      const { embeddingProvider } = req.ouranigon
      const embedding = await embeddingProvider.embed(validatedData.text)
      const updatedMemory = await vssStore.update(id, { text: validatedData.text, embedding })
      
      if (!updatedMemory) {
        return res.status(404).json({
          success: false,
          error: 'Memory not found'
        })
      }

      // Emit real-time update
      req.ouranigon.io.emit('memory_updated', updatedMemory)

      res.json({
        success: true,
        data: updatedMemory
      })
    } else {
      // For non-text updates, we need to handle them differently
      // Since VSSMemoryStore.update only handles text+embedding
      res.status(400).json({
        success: false,
        error: 'Only text updates are supported via this endpoint'
      })
    }

  } catch (error) {
    console.error('Update memory error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update memory'
    })
  }
})

// Delete memory
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { vssStore } = req.ouranigon

    // Check if memory exists first
    const existingMemory = await vssStore.get(id)
    if (!existingMemory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      })
    }

    // Delete the memory
    await vssStore.delete(id)

    // Emit real-time update
    req.ouranigon.io.emit('memory_deleted', { id })

    res.json({
      success: true,
      message: 'Memory deleted successfully'
    })
  } catch (error) {
    console.error('Delete memory error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete memory'
    })
  }
})

// Search memories
router.post('/search', async (req, res) => {
  try {
    const validatedData = SearchMemorySchema.parse(req.body)
    const { vssStore, embeddingProvider } = req.ouranigon

    // Generate embedding for search query using the default embedding provider
    const queryEmbedding = await embeddingProvider.embed(validatedData.query)

    // Search using VSS
    const results = await vssStore.vectorSearch(queryEmbedding, {
      limit: validatedData.limit
    })

    res.json({
      success: true,
      data: {
        query: validatedData.query,
        results,
        count: results.length
      }
    })
  } catch (error) {
    console.error('Search memories error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search memories'
    })
  }
})

// Consolidate memories (placeholder - consolidate method not available)
router.post('/consolidate', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Consolidation not implemented in current VSSMemoryStore'
    })
  } catch (error) {
    console.error('Consolidate memories error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to consolidate memories'
    })
  }
})

// Get memory statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { vssStore } = req.ouranigon

    const stats = await vssStore.getVSSStats()

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Memory stats error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get memory statistics'
    })
  }
})

// Smart-Thinking improvements - Memory connections
router.post('/connect', async (req, res) => {
  try {
    const { BackendConnectionService } = await import('../services/connectionService.js')
    const { sourceId, targetId, connectionType, strength, description, inferred, inferenceConfidence } = req.body
    const service = new BackendConnectionService()
    const connection = await service.createConnection(
      sourceId,
      targetId,
      connectionType,
      { strength, description, inferred, inferenceConfidence }
    )
    res.json({ success: true, data: connection })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create connection'
    })
  }
})

router.delete('/connections/:id', async (req, res) => {
  try {
    const { BackendConnectionService } = await import('../services/connectionService.js')
    const { id } = req.params
    const service = new BackendConnectionService()
    const deleted = service.deleteConnection(id)
    res.json({ success: deleted, message: deleted ? 'Connection deleted' : 'Connection not found' })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete connection'
    })
  }
})

export default router
