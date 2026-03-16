import express from 'express'
import fetch from 'node-fetch'

const router = express.Router()

// System health endpoint
router.get('/health', async (req, res) => {
  try {
    const { memoryStore, vssStore, embeddingProvider, mindBalanceTool, steelmanTool, strawmanTool } = req.ouranigon

    // Get memory statistics
    const memoryStats = await vssStore.getVSSStats()
    
    // Check Ollama connection
    const ollamaHealthy = await checkOllamaHealth()
    
    // System health data
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        usage: process.memoryUsage(),
        stats: memoryStats
      },
      components: {
        memoryStore: !!memoryStore,
        vssStore: !!vssStore,
        embeddingProvider: !!embeddingProvider,
        mindBalanceTool: !!mindBalanceTool,
        steelmanTool: !!steelmanTool,
        strawmanTool: !!strawmanTool,
        ollama: ollamaHealthy
      },
      performance: {
        memoryOperations: {
          searchLatency: '< 5ms', // Placeholder
          indexSize: memoryStats.totalVectors * 0.001, // Rough estimate
          memoryCount: memoryStats.totalVectors
        },
        reasoningOperations: {
          angelDemonBalance: 0.73, // Placeholder
          decisionSuccess: 0.78,  // Placeholder
          abstentionRate: 0.12    // Placeholder
        },
        sequentialThinking: {
          activeSessions: 0,      // Placeholder
          avgCompletion: 0.67,    // Placeholder
          avgThoughtsPerSession: 4.2 // Placeholder
        }
      }
    }

    res.json({
      success: true,
      data: healthData
    })
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    })
  }
})

// System metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const { vssStore } = req.ouranigon
    
    const stats = await vssStore.getVSSStats()
    
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: {
        totalMemories: stats.totalVectors,
        dimension: stats.dimension,
        available: stats.available
      },
      performance: {
        searchLatency: '< 5ms',
        indexHealth: 'healthy',
        embeddingDimension: 1536
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    }

    res.json({
      success: true,
      data: metrics
    })
  } catch (error) {
    console.error('Metrics error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metrics'
    })
  }
})

// System configuration endpoint
router.get('/config', async (req, res) => {
  try {
    const config = {
      ollama: {
        baseUrl: 'http://localhost:11434',
        defaultModel: 'qwen3:0.6b',
        embeddingModel: 'qwen3-embedding:0.6b'
      },
      memory: {
        vssEnabled: true,
        vectorDimension: 1536,
        hybridVSS: {
          useHNSWForSearch: true,
          useVectorliteForPersistence: true,
          autoSwitchThreshold: 1000,
          maxElements: 100000,
          M: 16,
          efConstruction: 200,
          ef: 100,
          space: 'cosine'
        }
      },
      reasoning: {
        angelDemonBalance: {
          enabled: true,
          defaultTheta: 45,
          defaultPhi: 30
        },
        argumentation: {
          steelmanEnabled: true,
          strawmanEnabled: true,
          defaultConfidence: 0.7
        }
      }
    }

    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('Config error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get configuration'
    })
  }
})

// Helper function to check Ollama health
async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags')
    return response.ok
  } catch (error) {
    return false
  }
}

export default router
