import express from 'express'
import { z } from 'zod'
import { 
  loadConfig, 
  saveConfig, 
  getConfig, 
  reloadConfig,
  getCurrentPersonaId,
  setCurrentPersonaId
} from '../services/configManager.js'

const router = express.Router()

// Validation schemas
const CreatePersonaSchema = z.object({
  id: z.string().min(1, 'Persona ID is required'),
  name: z.string().min(1, 'Persona name is required'),
  description: z.string().optional(),
  memoryIsolation: z.boolean().optional().default(true),
  reasoningStyle: z.enum(['balanced', 'analytical', 'divergent', 'creative', 'strategic']).optional().default('balanced'),
  preferences: z.record(z.string(), z.any()).optional()
})

const UpdatePersonaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  memoryIsolation: z.boolean().optional(),
  reasoningStyle: z.enum(['balanced', 'analytical', 'divergent', 'creative', 'strategic']).optional(),
  preferences: z.record(z.string(), z.any()).optional()
})

const SwitchPersonaSchema = z.object({
  personaId: z.string().min(1, 'Persona ID is required')
})

// Get all personas
router.get('/', async (req, res) => {
  try {
    const config = await getConfig()
    const personas = config.personas || {}
    const currentPersonaId = getCurrentPersonaId()
    
    // Convert to array format
    const personaList = Object.entries(personas).map(([id, persona]: [string, any]) => ({
      id,
      ...persona,
      isActive: id === currentPersonaId
    }))

    res.json({
      success: true,
      data: personaList
    })
  } catch (error) {
    console.error('Get personas error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get personas'
    })
  }
})

// Get current active persona
router.get('/current', async (req, res) => {
  try {
    const config = await getConfig()
    const personas = config.personas || {}
    const currentPersonaId = getCurrentPersonaId()
    const currentPersona = personas[currentPersonaId] || personas['default'] || null

    if (!currentPersona) {
      return res.status(404).json({
        success: false,
        error: 'No persona found'
      })
    }

    res.json({
      success: true,
      data: {
        id: currentPersonaId,
        ...currentPersona,
        isActive: true
      }
    })
  } catch (error) {
    console.error('Get current persona error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current persona'
    })
  }
})

// Get persona by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const config = await getConfig()
    const personas = config.personas || {}
    const persona = personas[id]
    const currentPersonaId = getCurrentPersonaId()

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      })
    }

    res.json({
      success: true,
      data: {
        id,
        ...persona,
        isActive: id === currentPersonaId
      }
    })
  } catch (error) {
    console.error('Get persona error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get persona'
    })
  }
})

// Create new persona
router.post('/', async (req, res) => {
  try {
    const validatedData = CreatePersonaSchema.parse(req.body)
    const config = await getConfig()

    // Check if persona already exists
    if (config.personas && config.personas[validatedData.id]) {
      return res.status(409).json({
        success: false,
        error: 'Persona with this ID already exists'
      })
    }

    // Initialize personas object if it doesn't exist
    if (!config.personas) {
      config.personas = {}
    }

    // Create persona
    config.personas[validatedData.id] = {
      name: validatedData.name,
      description: validatedData.description || '',
      memoryIsolation: validatedData.memoryIsolation,
      reasoningStyle: validatedData.reasoningStyle,
      preferences: validatedData.preferences || {}
    }

    await saveConfig(config) // Hot-reload: config cache updated immediately, no restart needed!

    // Emit real-time update if socket.io is available
    if (req.ouranigon?.io) {
      req.ouranigon.io.emit('persona_created', {
        id: validatedData.id,
        ...config.personas[validatedData.id]
      })
    }

    res.json({
      success: true,
      data: {
        id: validatedData.id,
        ...config.personas[validatedData.id]
      }
    })
  } catch (error) {
    console.error('Create persona error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create persona'
    })
  }
})

// Update persona
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = UpdatePersonaSchema.parse(req.body)
    const config = await getConfig()

    // Check if persona exists
    if (!config.personas || !config.personas[id]) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      })
    }

    // Update persona (merge with existing)
    config.personas[id] = {
      ...config.personas[id],
      ...validatedData
    }

    await saveConfig(config) // Hot-reload: config cache updated immediately, no restart needed!

    // Emit real-time update
    if (req.ouranigon?.io) {
      req.ouranigon.io.emit('persona_updated', {
        id,
        ...config.personas[id]
      })
    }

    const currentPersonaId = getCurrentPersonaId()
    
    res.json({
      success: true,
      data: {
        id,
        ...config.personas[id],
        isActive: id === currentPersonaId
      }
    })
  } catch (error) {
    console.error('Update persona error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update persona'
    })
  }
})

// Delete persona
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const config = await getConfig()
    const currentPersonaId = getCurrentPersonaId()

    // Check if persona exists
    if (!config.personas || !config.personas[id]) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      })
    }

    // Don't allow deleting the default persona
    if (id === 'default') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the default persona'
      })
    }

    // Don't allow deleting the current active persona
    if (id === currentPersonaId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the currently active persona. Please switch to another persona first.'
      })
    }

    // Delete persona
    delete config.personas[id]
    await saveConfig(config) // Hot-reload: config cache updated immediately, no restart needed!

    // Emit real-time update
    if (req.ouranigon?.io) {
      req.ouranigon.io.emit('persona_deleted', { id })
    }

    res.json({
      success: true,
      message: 'Persona deleted successfully'
    })
  } catch (error) {
    console.error('Delete persona error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete persona'
    })
  }
})

// Switch to a different persona
router.post('/switch', async (req, res) => {
  try {
    const validatedData = SwitchPersonaSchema.parse(req.body)
    const { personaId } = validatedData
    const config = await getConfig()

    // Check if persona exists
    if (!config.personas || !config.personas[personaId]) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      })
    }

    const previousPersonaId = getCurrentPersonaId()
    setCurrentPersonaId(personaId) // Hot-reload: immediate effect, no restart needed!

    // Emit real-time update
    if (req.ouranigon?.io) {
      req.ouranigon.io.emit('persona_switched', {
        previousPersonaId,
        currentPersonaId: personaId,
        persona: config.personas[personaId]
      })
    }

    res.json({
      success: true,
      data: {
        previousPersonaId,
        currentPersonaId: personaId,
        persona: {
          id: personaId,
          ...config.personas[personaId],
          isActive: true
        }
      }
    })
  } catch (error) {
    console.error('Switch persona error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to switch persona'
    })
  }
})

// Get persona configuration (full config including memory, reasoning, etc.)
router.get('/:id/config', async (req, res) => {
  try {
    const { id } = req.params
    const config = await getConfig()
    const personas = config.personas || {}
    const persona = personas[id]
    const currentPersonaId = getCurrentPersonaId()

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      })
    }

    // Return persona-specific config along with system config
    res.json({
      success: true,
      data: {
        persona: {
          id,
          ...persona,
          isActive: id === currentPersonaId
        },
        system: {
          memory: config.memory || {},
          reasoning: config.reasoning || {},
          performance: config.performance || {}
        }
      }
    })
  } catch (error) {
    console.error('Get persona config error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get persona configuration'
    })
  }
})

// Reload configuration from file (useful if file was modified externally)
router.post('/reload', async (req, res) => {
  try {
    const config = await reloadConfig()
    const currentPersonaId = getCurrentPersonaId()
    
    res.json({
      success: true,
      message: 'Configuration reloaded successfully',
      data: {
        personas: Object.keys(config.personas || {}).length,
        currentPersonaId,
        lastModified: config.metadata?.lastModified
      }
    })
  } catch (error) {
    console.error('Reload config error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reload configuration'
    })
  }
})

export default router

