import express from 'express'
import { z } from 'zod'

const router = express.Router()

// Validation schemas
const AngelDemonBalanceSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  cosine: z.number().min(-1).max(1).optional().default(0.5),
  tangent: z.number().min(-1).max(1).optional().default(0.3),
  theta: z.number().min(0).max(360).optional().default(45),
  phi: z.number().min(0).max(360).optional().default(30),
  mode: z.enum(['angel', 'demon', 'blend', 'probabilistic']).optional().default('blend'),
  tanClamp: z.number().min(0).max(10).optional().default(5),
  normalize: z.boolean().optional().default(true),
  scoring: z.object({
    rules: z.array(z.enum(['brier', 'log'])).optional().default(['brier', 'log']),
    abstainThreshold: z.number().min(0).max(1).optional().default(0.3),
    abstentionScore: z.number().nullable().optional().default(null)
  }).optional()
})

const SteelmanSchema = z.object({
  opponentClaim: z.string().min(1, 'Claim is required'),
  charitableAssumptions: z.array(z.string()).optional().default([]),
  strongestPremises: z.array(z.string()).optional().default([]),
  anticipatedObjections: z.array(z.string()).optional().default([]),
  context: z.string().optional().default(''),
  requestImprovedFormulation: z.boolean().optional().default(true)
})

const StrawmanSchema = z.object({
  opponentClaim: z.string().min(1, 'Claim is required'),
  context: z.string().optional().default('')
})

const ArgumentAnalysisSchema = z.object({
  claim: z.string().min(1, 'Claim is required'),
  context: z.string().optional(),
  premises: z.array(z.object({
    content: z.string(),
    evidence: z.array(z.string()).optional(),
    strength: z.number().min(0).max(1).optional()
  })).optional(),
  objections: z.array(z.object({
    content: z.string(),
    evidence: z.array(z.string()).optional(),
    strength: z.number().min(0).max(1).optional()
  })).optional()
})

// Angel/Demon Balance calculation
router.post('/angel-demon-balance', async (req, res) => {
  try {
    const validatedData = AngelDemonBalanceSchema.parse(req.body)
    const { mindBalanceTool } = req.ouranigon

    const result = await mindBalanceTool.execute({
      topic: validatedData.topic,
      cosine: validatedData.cosine,
      tangent: validatedData.tangent,
      theta: validatedData.theta,
      phi: validatedData.phi,
      mode: validatedData.mode,
      tanClamp: validatedData.tanClamp,
      normalize: validatedData.normalize,
      scoring: validatedData.scoring
    })

    // Emit real-time update
    req.ouranigon.io.emit('angel_demon_balance', result)

    res.json({
      success: true,
      data: {
        theta: validatedData.theta,
        phi: validatedData.phi,
        angelSignal: result.angelSignal,
        demonSignal: result.demonSignal,
        mode: result.mode,
        pPositive: result.pPositive,
        pNegative: result.pNegative,
        decision: result.decision,
        confidence: result.confidence,
        rationale: result.rationale
      }
    })
  } catch (error) {
    console.error('Angel/Demon balance error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate angel/demon balance'
    })
  }
})

// Steelman argument analysis
router.post('/steelman', async (req, res) => {
  try {
    const validatedData = SteelmanSchema.parse(req.body)
    const { steelmanTool } = req.ouranigon

    const result = await steelmanTool.execute({
      opponentClaim: validatedData.opponentClaim,
      charitableAssumptions: validatedData.charitableAssumptions,
      strongestPremises: validatedData.strongestPremises?.map(text => ({ text })),
      anticipatedObjections: validatedData.anticipatedObjections?.map(text => ({ text })),
      context: validatedData.context,
      requestImprovedFormulation: validatedData.requestImprovedFormulation
    })

    // Store the analysis in memory
    const { vssStore } = req.ouranigon
    const memory = await vssStore.create({
      text: `Steelman Analysis: ${validatedData.opponentClaim} - Improved: ${result.improvedClaim}`,
      tags: ['argument', 'steelman', 'reasoning'],
      importance: 0.7,
      type: 'episodic',
      source: 'plan',
      confidence: result.confidence || 0.5,
      embedding: await req.ouranigon.embeddingProvider.embed(`Steelman Analysis: ${validatedData.opponentClaim}`),
      lastUsed: Date.now(),
      decay: 0.01,
      belief: false,
      mergedFrom: [],
      expiresAt: null,
      sessionId: null,
      features: {
        argumentType: 'steelman',
        originalClaim: validatedData.opponentClaim,
        improvedClaim: result.improvedClaim,
        confidence: result.confidence,
        premisesCount: result.premises?.length || 0
      }
    })

    // Emit real-time update
    req.ouranigon.io.emit('steelman_analysis', { result, memoryId: memory.id })

    res.json({
      success: true,
      data: {
        originalClaim: validatedData.opponentClaim,
        improvedClaim: result.improvedClaim,
        premises: result.premises,
        addressedObjections: result.addressedObjections,
        residualRisks: result.residualRisks,
        confidence: result.confidence,
        notes: result.notes,
        memoryId: memory.id
      }
    })
  } catch (error) {
    console.error('Steelman analysis error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform steelman analysis'
    })
  }
})

// Strawman argument analysis
router.post('/strawman', async (req, res) => {
  try {
    const validatedData = StrawmanSchema.parse(req.body)
    const { strawmanTool } = req.ouranigon

    const result = await strawmanTool.execute({
      originalClaim: validatedData.opponentClaim,
      context: validatedData.context
    })

    // Store the analysis in memory
    const { vssStore } = req.ouranigon
    const memory = await vssStore.create({
      text: `Strawman Analysis: ${validatedData.opponentClaim} - Distortions: ${result.identifiedDistortions?.length || 0}`,
      tags: ['argument', 'strawman', 'reasoning'],
      importance: 0.6,
      type: 'episodic',
      source: 'plan',
      confidence: result.confidence || 0.5,
      embedding: await req.ouranigon.embeddingProvider.embed(`Strawman Analysis: ${validatedData.opponentClaim}`),
      lastUsed: Date.now(),
      decay: 0.01,
      belief: false,
      mergedFrom: [],
      expiresAt: null,
      sessionId: null,
      features: {
        argumentType: 'strawman',
        originalClaim: validatedData.opponentClaim,
        distortions: result.identifiedDistortions,
        confidence: result.confidence,
        fallaciesCount: result.identifiedFallacies?.length || 0
      }
    })

    // Emit real-time update
    req.ouranigon.io.emit('strawman_analysis', { result, memoryId: memory.id })

    res.json({
      success: true,
      data: {
        originalClaim: validatedData.opponentClaim,
        distortedClaim: result.distortedClaim,
        identifiedDistortions: result.identifiedDistortions,
        identifiedFallacies: result.identifiedFallacies,
        weakPremises: result.weakPremises,
        confidence: result.confidence,
        easyRefutation: result.easyRefutation,
        improvementHint: result.improvementHint,
        memoryId: memory.id
      }
    })
  } catch (error) {
    console.error('Strawman analysis error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform strawman analysis'
    })
  }
})

// General argument analysis
router.post('/argument-analysis', async (req, res) => {
  try {
    const validatedData = ArgumentAnalysisSchema.parse(req.body)
    
    // This would integrate with our existing argumentation tools
    // For now, we'll create a basic analysis structure
    
    const analysis = {
      claim: validatedData.claim,
      premises: validatedData.premises || [],
      objections: validatedData.objections || [],
      overallStrength: 0.5, // Placeholder
      confidence: 0.7,      // Placeholder
      riskLevel: 0.3,       // Placeholder
      uncertainty: 0.4,      // Placeholder
      recommendation: 'UNCERTAIN', // Placeholder
      explanation: 'Analysis completed'
    }

    // Store in memory
    const { vssStore } = req.ouranigon
    const memory = await vssStore.create({
      text: `Argument Analysis: ${validatedData.claim}`,
      tags: ['argument', 'analysis', 'reasoning'],
      importance: 0.6,
      type: 'episodic',
      source: 'plan',
      confidence: analysis.confidence,
      embedding: await req.ouranigon.embeddingProvider.embed(`Argument Analysis: ${validatedData.claim}`),
      lastUsed: Date.now(),
      decay: 0.01,
      belief: false,
      mergedFrom: [],
      expiresAt: null,
      sessionId: null,
      features: {
        argumentType: 'general',
        claim: validatedData.claim,
        premisesCount: analysis.premises.length,
        objectionsCount: analysis.objections.length,
        overallStrength: analysis.overallStrength
      }
    })

    res.json({
      success: true,
      data: {
        ...analysis,
        memoryId: memory.id
      }
    })
  } catch (error) {
    console.error('Argument analysis error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform argument analysis'
    })
  }
})

// Get reasoning history
router.get('/history', async (req, res) => {
  try {
    const { vssStore } = req.ouranigon
    
    // Search for reasoning-related memories using getByTag
    const reasoningMemories = await vssStore.getByTag('reasoning', 50)

    res.json({
      success: true,
      data: reasoningMemories
    })
  } catch (error) {
    console.error('Reasoning history error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get reasoning history'
    })
  }
})

// Smart-Thinking improvements - Reasoning step tracking
router.post('/steps/start', async (req, res) => {
  try {
    const { ReasoningService } = await import('../services/reasoningService.js')
    const { sessionId, stepId, kind, label, description, parents } = req.body
    const service = new ReasoningService()
    const result = await service.startStep(sessionId, stepId, kind, label, description, parents)
    res.json({ success: true, data: { stepId: result } })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start reasoning step'
    })
  }
})

router.post('/steps/complete', async (req, res) => {
  try {
    const { ReasoningService } = await import('../services/reasoningService.js')
    const { stepId, sessionId, details } = req.body
    const service = new ReasoningService()
    await service.completeStep(stepId, sessionId, details)
    res.json({ success: true, message: 'Step completed' })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete reasoning step'
    })
  }
})

router.post('/steps/fail', async (req, res) => {
  try {
    const { ReasoningService } = await import('../services/reasoningService.js')
    const { stepId, sessionId, error: errorMsg } = req.body
    const service = new ReasoningService()
    await service.failStep(stepId, sessionId, errorMsg)
    res.json({ success: true, message: 'Step marked as failed' })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fail reasoning step'
    })
  }
})

router.get('/steps/:sessionId', async (req, res) => {
  try {
    const { ReasoningService } = await import('../services/reasoningService.js')
    const { sessionId } = req.params
    const service = new ReasoningService()
    const steps = await service.getSteps(sessionId)
    res.json({ success: true, data: steps })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get reasoning steps'
    })
  }
})

// Reasoning state management
router.post('/state/save', async (req, res) => {
  try {
    const { ReasoningService } = await import('../services/reasoningService.js')
    const { sessionId, stateData, includeConnections } = req.body
    const service = new ReasoningService()
    const stateId = await service.saveState(sessionId, stateData, includeConnections)
    res.json({ success: true, data: { stateId, sessionId } })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save reasoning state'
    })
  }
})

router.get('/state/:sessionId', async (req, res) => {
  try {
    const { ReasoningService } = await import('../services/reasoningService.js')
    const { sessionId } = req.params
    const service = new ReasoningService()
    const state = await service.loadState(sessionId)
    if (!state) {
      return res.status(404).json({ success: false, error: 'State not found' })
    }
    res.json({ success: true, data: state })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load reasoning state'
    })
  }
})

router.post('/state/load', async (req, res) => {
  try {
    const { ReasoningService } = await import('../services/reasoningService.js')
    const { sessionId } = req.body
    const service = new ReasoningService()
    const state = await service.loadState(sessionId)
    if (!state) {
      return res.status(404).json({ success: false, error: 'State not found' })
    }
    res.json({ success: true, data: state })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load reasoning state'
    })
  }
})

// Next steps suggestions
router.get('/next-steps/:sessionId', async (req, res) => {
  try {
    const { ReasoningService } = await import('../services/reasoningService.js')
    const { sessionId } = req.params
    const { limit, context } = req.query
    const service = new ReasoningService()
    const suggestions = await service.suggestNextSteps(
      sessionId,
      limit ? parseInt(limit as string) : 3,
      context as string | undefined
    )
    res.json({ success: true, data: { suggestions } })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get next steps'
    })
  }
})

// Reasoning trace
router.get('/trace/:sessionId', async (req, res) => {
  try {
    const { ReasoningService } = await import('../services/reasoningService.js')
    const { sessionId } = req.params
    const service = new ReasoningService()
    const trace = await service.getTrace(sessionId)
    res.json({ success: true, data: trace })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get reasoning trace'
    })
  }
})

export default router
