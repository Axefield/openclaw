import express from 'express'
import { z } from 'zod'
import { authService } from '../services/authService'
import { authenticateApiKey, requireAdmin } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['api', 'mcp']),
  scopes: z.array(z.string()).optional().default(['*']),
  expiresAt: z.number().optional() // Unix timestamp in milliseconds
})

// Get all API keys for current user
router.get('/', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const apiKeys = await authService.getUserApiKeys(req.user.id)
    
    // Remove key hashes from response for security
    const safeApiKeys = apiKeys.map(({ keyHash, ...key }) => ({
      ...key,
      keyHash: undefined // Explicitly remove
    }))
    
    res.json({
      success: true,
      data: safeApiKeys
    })
  } catch (error) {
    console.error('Get API keys error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get API keys'
    })
  }
})

// Create new API key
router.post('/', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const validatedData = CreateApiKeySchema.parse(req.body)
    
    const { apiKey, plainKey } = await authService.createApiKeyForUser(
      req.user.id,
      validatedData.name,
      validatedData.type,
      validatedData.scopes,
      validatedData.expiresAt
    )

    // Return the plain key only once (for security, it won't be shown again)
    const { keyHash, ...safeApiKey } = apiKey
    
    res.status(201).json({
      success: true,
      data: {
        ...safeApiKey,
        key: plainKey, // Only returned on creation
        warning: 'Save this key now. It will not be shown again.'
      }
    })
  } catch (error) {
    console.error('Create API key error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create API key'
    })
  }
})

// Revoke API key
router.post('/:id/revoke', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    
    // Users can only revoke their own keys unless they're admin
    const success = await authService.revokeApiKey(id, req.user.id)
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'API key not found or access denied'
      })
    }

    res.json({
      success: true,
      message: 'API key revoked successfully'
    })
  } catch (error) {
    console.error('Revoke API key error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke API key'
    })
  }
})

// Delete API key
router.delete('/:id', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    
    // Users can only delete their own keys unless they're admin
    const success = await authService.deleteApiKey(id, req.user.id)
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'API key not found or access denied'
      })
    }

    res.json({
      success: true,
      message: 'API key deleted successfully'
    })
  } catch (error) {
    console.error('Delete API key error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete API key'
    })
  }
})

export default router

