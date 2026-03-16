import express from 'express'
import { z } from 'zod'
import { syncService, SyncUserData } from '../services/syncService'
import { authenticateSync } from '../middleware/syncAuth'
import { getDatabase } from '../services/database'

const router = express.Router()
const db = getDatabase()

// Validation schemas
const SyncUserSchema = z.object({
  externalId: z.string().min(1),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
})

const SyncUsersSchema = z.array(SyncUserSchema)

// Sync single user
router.post('/user', authenticateSync, async (req, res) => {
  try {
    const validatedData = SyncUserSchema.parse(req.body)
    const source = req.syncContext?.source || 'parent-domain'

    // Type assertion to SyncUserData (Zod validation ensures externalId is present)
    const syncData: SyncUserData = {
      externalId: validatedData.externalId,
      username: validatedData.username,
      email: validatedData.email,
      role: validatedData.role,
      isActive: validatedData.isActive,
      metadata: validatedData.metadata
    }

    const result = await syncService.syncUser(syncData, source)

    const { passwordHash, ...safeUser } = result.user

    res.json({
      success: true,
      data: {
        user: safeUser,
        created: result.created,
        message: result.created ? 'User created' : 'User updated'
      }
    })
  } catch (error) {
    console.error('Sync user error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync user'
    })
  }
})

// Sync multiple users
router.post('/users', authenticateSync, async (req, res) => {
  try {
    const validatedData = SyncUsersSchema.parse(req.body)
    const source = req.syncContext?.source || 'parent-domain'

    // Convert to SyncUserData[] (Zod validation ensures externalId is present for all)
    const syncData: SyncUserData[] = validatedData.map(user => ({
      externalId: user.externalId,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      metadata: user.metadata
    }))

    const result = await syncService.syncUsers(syncData, source)

    res.json({
      success: true,
      data: {
        created: result.created,
        updated: result.updated,
        total: validatedData.length,
        errors: result.errors
      }
    })
  } catch (error) {
    console.error('Sync users error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync users'
    })
  }
})

// Get user by external ID
router.get('/user/:externalId', authenticateSync, async (req, res) => {
  try {
    const { externalId } = req.params
    const source = req.syncContext?.source || 'parent-domain'

    const user = syncService.getUserByExternalId(externalId, source)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    const { passwordHash, ...safeUser } = user

    res.json({
      success: true,
      data: safeUser
    })
  } catch (error) {
    console.error('Get synced user error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user'
    })
  }
})

// Deactivate user by external ID
router.post('/user/:externalId/deactivate', authenticateSync, async (req, res) => {
  try {
    const { externalId } = req.params
    const source = req.syncContext?.source || 'parent-domain'

    const success = await syncService.deactivateUserByExternalId(externalId, source)

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    res.json({
      success: true,
      message: 'User deactivated successfully'
    })
  } catch (error) {
    console.error('Deactivate user error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate user'
    })
  }
})

// Health check for sync endpoint
router.get('/health', authenticateSync, async (req, res) => {
  res.json({
    success: true,
    message: 'Sync endpoint is healthy',
    timestamp: new Date().toISOString()
  })
})

export default router

