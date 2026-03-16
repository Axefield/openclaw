import express from 'express'
import { z } from 'zod'
import { authService } from '../services/authService'
import { getDatabase } from '../services/database'
import { authenticateApiKey, requireAdmin } from '../middleware/auth'

const router = express.Router()
const db = getDatabase()

// Validation schemas
const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).optional().default('user')
})

const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional()
})

// Get all users (admin only)
router.get('/', authenticateApiKey, requireAdmin, async (req, res) => {
  try {
    const users = db.getAllUsers()
    // Remove password hashes from response
    const safeUsers = users.map(({ passwordHash, ...user }) => user)
    
    res.json({
      success: true,
      data: safeUsers
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get users'
    })
  }
})

// Get current user
router.get('/me', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const user = db.getUserById(req.user.id)
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
    console.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user'
    })
  }
})

// Get user by ID (admin only)
router.get('/:id', authenticateApiKey, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const user = db.getUserById(id)
    
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
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user'
    })
  }
})

// Create user (admin only)
router.post('/', authenticateApiKey, requireAdmin, async (req, res) => {
  try {
    const validatedData = CreateUserSchema.parse(req.body)
    
    const user = await authService.createUser(
      validatedData.username,
      validatedData.email,
      validatedData.password,
      validatedData.role
    )

    const { passwordHash, ...safeUser } = user
    
    res.status(201).json({
      success: true,
      data: safeUser
    })
  } catch (error) {
    console.error('Create user error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    })
  }
})

// Update user (admin can update any, users can only update themselves)
router.put('/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    // Users can only update themselves unless they're admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own account'
      })
    }

    const validatedData = UpdateUserSchema.parse(req.body)
    const updates: any = {}

    if (validatedData.username) updates.username = validatedData.username
    if (validatedData.email) updates.email = validatedData.email
    if (validatedData.role && req.user.role === 'admin') {
      updates.role = validatedData.role
    }
    if (validatedData.isActive !== undefined && req.user.role === 'admin') {
      updates.isActive = validatedData.isActive
    }
    if (validatedData.password) {
      updates.passwordHash = await authService.hashPassword(validatedData.password)
    }

    const updatedUser = db.updateUser(id, updates)
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    const { passwordHash, ...safeUser } = updatedUser
    
    res.json({
      success: true,
      data: safeUser
    })
  } catch (error) {
    console.error('Update user error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user'
    })
  }
})

export default router

