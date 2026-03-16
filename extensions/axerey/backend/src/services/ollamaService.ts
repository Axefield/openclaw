import fetch from 'node-fetch'

export interface OllamaGenerateRequest {
  model: string
  prompt: string
  stream?: boolean
  options?: {
    temperature?: number
    top_p?: number
    top_k?: number
    repeat_penalty?: number
  }
}

export interface OllamaGenerateResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

export interface OllamaEmbeddingRequest {
  model: string
  prompt: string
}

export interface OllamaEmbeddingResponse {
  embedding: number[]
}

export interface OllamaChatRequest {
  model: string
  messages: Array<{ 
    role: string
    content: string
    thinking?: string
    tool_calls?: Array<any>
    tool_name?: string
  }>
  stream?: boolean
  think?: boolean | 'low' | 'medium' | 'high'
  tools?: Array<{
    type: 'function'
    function: {
      name: string
      description: string
      parameters: any
    }
  }>
  options?: {
    temperature?: number
    top_p?: number
    top_k?: number
    repeat_penalty?: number
  }
}

export interface OllamaChatResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
    thinking?: string
    tool_calls?: Array<{
      type: 'function'
      function: {
        name: string
        arguments: string | any
      }
    }>
  }
  done: boolean
}

export interface OllamaChatResult {
  content: string
  thinking?: string
  toolCalls?: Array<{
    type: 'function'
    function: {
      name: string
      arguments: any
    }
  }>
}

export interface OllamaStreamChunk {
  thinking?: string
  content?: string
  toolCalls?: Array<any>
  done: boolean
}

export interface OllamaWebSearchRequest {
  query: string
  limit?: number
}

export interface OllamaWebSearchResult {
  title: string
  url: string
  snippet: string
  source?: string
}

export interface OllamaWebSearchResponse {
  results: OllamaWebSearchResult[]
  query: string
  total?: number
}

export class OllamaService {
  private baseUrl: string
  private defaultModel: string
  private embeddingModel: string
  private webSearchApiKey: string | null

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl
    // Use environment variables with fallbacks to smallest thinking-capable models
    // Default to qwen2.5:1.5b (smallest thinking model, ~1GB) for memory-constrained systems
    // Other small options: qwen2.5:3b (~2GB), qwen2.5:7b (~4GB)
    this.defaultModel = process.env.OLLAMA_DEFAULT_MODEL || 'qwen2.5:1.5b'
    this.embeddingModel = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'
    // Web search API key (optional - get from https://ollama.com)
    this.webSearchApiKey = process.env.OLLAMA_WEB_SEARCH_API_KEY || null
  }

  /**
   * Startup probe - verifies Ollama is available and auto-selects models
   * Uses the same pattern as the existing checkOllamaHealth() in system.ts
   */
  async startupProbe(maxRetries: number = 5, initialDelay: number = 1000): Promise<{ healthy: boolean; models: string[]; error?: string }> {
    console.log('🔍 Starting Ollama startup probe...')
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use the same health check pattern as system.ts
        // Create timeout manually for node-fetch compatibility
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${this.baseUrl}/api/tags`, {
          signal: controller.signal,
        }).catch((fetchError) => {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error(`Connection timeout: Ollama at ${this.baseUrl} did not respond within 5 seconds`)
          }
          throw new Error(`Failed to connect to Ollama at ${this.baseUrl}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`Ollama API returned ${response.status} ${response.statusText}`)
        }

        const data = await response.json() as { models?: Array<{ name: string }> }
        const availableModels = data.models?.map(m => m.name) || []
        
        // Auto-select models - always prefer thinking-capable models
        if (availableModels.length > 0) {
          // Check if current default is thinking-capable
          const currentIsThinking = this.isThinkingCapableModel(this.defaultModel)
          
          if (!availableModels.includes(this.defaultModel) || !currentIsThinking) {
            // Find best thinking-capable model from available models
            const thinkingModels = availableModels.filter(m => this.isThinkingCapableModel(m))
            
            if (thinkingModels.length > 0) {
              // Priority order: qwen3 > deepseek-r1 > deepseek-v3.1 > others
              const priority = ['qwen3', 'deepseek-r1', 'deepseek-v3.1', 'deepseek', 'qwen2.5']
              
              let selectedModel: string | null = null
              for (const preferred of priority) {
                const found = thinkingModels.find(m => m.toLowerCase().includes(preferred.toLowerCase()))
                if (found) {
                  selectedModel = found
                  break
                }
              }
              
              if (!selectedModel) {
                selectedModel = thinkingModels[0]
              }
              
              if (selectedModel !== this.defaultModel) {
                console.log(`✅ Using thinking-capable model: "${selectedModel}"`)
                this.defaultModel = selectedModel
              }
            } else {
              // Fallback to first available if no thinking models found
              if (!availableModels.includes(this.defaultModel)) {
                console.warn(`⚠️  No thinking-capable models found, using "${availableModels[0]}"`)
                this.defaultModel = availableModels[0]
              } else {
                console.warn(`⚠️  Current model "${this.defaultModel}" doesn't support thinking, but no alternatives found`)
              }
            }
          }

          // Try to find a suitable embedding model
          const embeddingCandidates = ['nomic-embed-text', 'qwen2.5:0.5b-instruct', 'qwen3-vl:8b', 'gemma3:4b']
          if (!availableModels.includes(this.embeddingModel)) {
            const found = embeddingCandidates.find(m => availableModels.includes(m)) || availableModels[0]
            if (found !== this.embeddingModel) {
              console.warn(`⚠️  Embedding model "${this.embeddingModel}" not found, using "${found}"`)
              this.embeddingModel = found
            }
          }
        }

        console.log(`✅ Ollama is healthy! Found ${availableModels.length} model(s)`)
        console.log(`   Default model: ${this.defaultModel}`)
        console.log(`   Embedding model: ${this.embeddingModel}`)
        
        return { healthy: true, models: availableModels }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1)
          console.warn(`⚠️  Ollama health check failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          console.error(`❌ Ollama startup probe failed after ${maxRetries} attempts`)
          console.warn('   The server will continue, but Ollama features may not work')
          return { healthy: false, models: [], error: errorMsg }
        }
      }
    }

    return { healthy: false, models: [], error: 'Startup probe exhausted all retries' }
  }

  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          prompt: request.prompt,
          stream: false,
          options: request.options || {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            repeat_penalty: 1.1
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as OllamaGenerateResponse
      return data
    } catch (error) {
      console.error('Ollama generate error:', error)
      throw new Error(`Failed to generate with Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: text
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama embeddings API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as OllamaEmbeddingResponse
      return data.embedding
    } catch (error) {
      console.error('Ollama embedding error:', error)
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Chat with Ollama - supports thinking and tool calling
   * Automatically selects thinking-capable model when thinking is enabled
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    model?: string,
    options?: {
      think?: boolean | 'low' | 'medium' | 'high'
      tools?: Array<any>
      temperature?: number
    }
  ): Promise<OllamaChatResult> {
    const useThinking = options?.think !== undefined && options.think !== false
    let targetModel = model || this.defaultModel
    
    // If thinking is enabled, ensure we use a thinking-capable model
    if (useThinking && !this.isThinkingCapableModel(targetModel)) {
      console.warn(`[Ollama] Thinking enabled but model "${targetModel}" doesn't support it, selecting thinking-capable model`)
      const thinkingModel = await this.getBestThinkingModel()
      if (thinkingModel) {
        targetModel = thinkingModel
        console.log(`[Ollama] Using thinking-capable model: ${targetModel}`)
      } else {
        console.warn(`[Ollama] No thinking-capable models available, continuing with ${targetModel} (thinking will be disabled)`)
      }
    }
    
    try {
      return await this._chatInternal(messages, targetModel, options, useThinking)
    } catch (error) {
      // If thinking was requested and we got a "does not support thinking" error, retry without thinking
      if (useThinking && error instanceof Error && error.message.includes('does not support thinking')) {
        console.warn(`[Ollama] Model "${targetModel}" doesn't support thinking, falling back to normal mode`)
        return await this._chatInternal(messages, targetModel, { ...options, think: false }, false)
      }
      throw error
    }
  }

  /**
   * Internal chat method that performs the actual request
   */
  private async _chatInternal(
    messages: Array<{ role: string; content: string }>,
    model: string,
    options?: {
      think?: boolean | 'low' | 'medium' | 'high'
      tools?: Array<any>
      temperature?: number
    },
    useThinking: boolean = false
  ): Promise<OllamaChatResult> {
    try {
      const requestBody: any = {
        model: model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1
        }
      }

      // Add thinking support if requested and enabled
      if (useThinking && options?.think !== undefined) {
        requestBody.think = options.think
      }

      // Add tool calling support if tools provided
      // Note: Not all Ollama models support tool calling
      if (options?.tools && options.tools.length > 0) {
        requestBody.tools = options.tools
        // Log tool count for debugging
        console.log(`[Ollama] Sending ${options.tools.length} tools to model ${model}`)
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = ''
        try {
          const errorData = await response.text()
          errorDetails = errorData
          console.error('Ollama API error response:', errorData)
          console.error('Request body sent:', JSON.stringify(requestBody, null, 2))
        } catch (e) {
          // Ignore parsing errors
        }
        throw new Error(`Ollama chat API error: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`)
      }

      const data = await response.json() as OllamaChatResponse
      
      return {
        content: data.message?.content || '',
        thinking: data.message?.thinking,
        toolCalls: data.message?.tool_calls?.map(tc => ({
          type: tc.type,
          function: {
            name: tc.function.name,
            arguments: typeof tc.function.arguments === 'string' 
              ? JSON.parse(tc.function.arguments) 
              : tc.function.arguments
          }
        }))
      }
    } catch (error) {
      console.error('Ollama chat error:', error)
      throw new Error(`Failed to chat with Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Legacy chat method for backward compatibility
   */
  async chatLegacy(messages: Array<{ role: string; content: string }>, model?: string): Promise<string> {
    const result = await this.chat(messages, model)
    return result.content
  }

  /**
   * Stream chat with thinking and tool calling support
   */
  async *chatStream(
    messages: Array<{ role: string; content: string }>,
    model?: string,
    options?: {
      think?: boolean | 'low' | 'medium' | 'high'
      tools?: Array<any>
      temperature?: number
    }
  ): AsyncGenerator<OllamaStreamChunk> {
    try {
      const requestBody: any = {
        model: model || this.defaultModel,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.7,
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1
        }
      }

      if (options?.think !== undefined) {
        requestBody.think = options.think
      }

      if (options?.tools && options.tools.length > 0) {
        requestBody.tools = options.tools
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Ollama chat stream error: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // node-fetch v2 returns a Node.js Readable stream
      // Read it as text and parse line by line
      const text = await response.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      let thinking = ''
      let content = ''
      let toolCalls: any[] = []
      let inThinking = false

      for (const line of lines) {
        if (line.trim() === '') continue
        
        try {
          const chunk = JSON.parse(line) as any

          // Handle thinking trace
          if (chunk.message?.thinking) {
            if (!inThinking) {
              inThinking = true
              thinking = ''
            }
            thinking += chunk.message.thinking
            yield { thinking: chunk.message.thinking, done: false }
          }

          // Handle content
          if (chunk.message?.content) {
            if (inThinking) {
              inThinking = false
              yield { thinking: null, done: false }
            }
            content += chunk.message.content
            yield { content: chunk.message.content, done: false }
          }

          // Handle tool calls
          if (chunk.message?.tool_calls) {
            const newToolCalls = Array.isArray(chunk.message.tool_calls)
              ? chunk.message.tool_calls
              : [chunk.message.tool_calls]
            
            toolCalls.push(...newToolCalls)
            yield { toolCalls: newToolCalls, done: false }
          }

          // Final chunk
          if (chunk.done) {
            yield { thinking, content, toolCalls, done: true }
            return
          }
        } catch (parseError) {
          // Skip invalid JSON lines
          continue
        }
      }

      // If we get here, stream ended without done flag
      yield { thinking, content, toolCalls, done: true }
    } catch (error) {
      console.error('Ollama chat stream error:', error)
      throw new Error(`Failed to stream chat: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async isModelAvailable(model: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) return false
      
      const data = await response.json() as any
      return data.models?.some((m: any) => m.name === model) || false
    } catch (error) {
      console.error('Error checking model availability:', error)
      return false
    }
  }

  /**
   * Check if a model supports thinking
   * Note: Ollama's "thinking" is a specific feature (the `think` parameter)
   * 
   * We include models that are known to support thinking, plus gemma3 variants
   * (except the confirmed non-thinking gemma3:4b). If a model doesn't actually
   * support it, Ollama will return an error which we handle gracefully with fallback.
   */
  isThinkingCapableModel(modelName: string): boolean {
    const lowerName = modelName.toLowerCase()
    
    // Explicitly exclude known non-thinking variants
    const nonThinkingPatterns = [
      'gemma3:4b',  // Confirmed: doesn't support thinking parameter
      'gemma3-4b'
    ]
    
    if (nonThinkingPatterns.some(pattern => lowerName.includes(pattern))) {
      return false
    }
    
    // Known thinking-capable models
    const confirmedThinkingPatterns = [
      'qwen3',
      'qwen2.5',
      'deepseek-r1',
      'deepseek-v3.1',
      'deepseek',
      'gpt-oss',
      'gemma3'  // Include gemma3 variants (except 4b which we excluded above)
    ]
    
    return confirmedThinkingPatterns.some(pattern => lowerName.includes(pattern.toLowerCase()))
  }

  /**
   * Get available models, optionally filtered to thinking-capable only
   */
  async getAvailableModels(thinkingOnly: boolean = true): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) return []
      
      const data = await response.json() as any
      const allModels = data.models?.map((m: any) => m.name) || []
      
      // Filter to thinking-capable models only by default
      if (thinkingOnly) {
        return allModels.filter((model: string) => this.isThinkingCapableModel(model))
      }
      
      return allModels
    } catch (error) {
      console.error('Error getting available models:', error)
      return []
    }
  }

  /**
   * Get the best thinking-capable model from available models
   * Prioritizes smaller models for memory-constrained systems
   */
  async getBestThinkingModel(): Promise<string | null> {
    const availableModels = await this.getAvailableModels(true)
    if (availableModels.length === 0) return null
    
    // Priority order: smallest first for memory efficiency
    // Prefer qwen2.5 variants (1.5b, 3b, 7b) as they're smaller and thinking-capable
    const priority = [
      'qwen2.5:1.5b',  // Smallest (~1GB)
      'qwen2.5:3b',   // Small (~2GB)
      'qwen2.5:7b',   // Medium (~4GB)
      'qwen2.5',      // Any qwen2.5 variant
      'qwen3',        // Larger variants
      'deepseek-r1',  // Large (7B+)
      'deepseek-v3.1', // Large (7B+)
      'deepseek'      // Any deepseek
    ]
    
    // First, try exact matches (with size specifiers)
    for (const preferred of priority) {
      const found = availableModels.find(m => m.toLowerCase() === preferred.toLowerCase())
      if (found) return found
    }
    
    // Then try partial matches
    for (const preferred of priority) {
      const found = availableModels.find(m => m.toLowerCase().includes(preferred.toLowerCase()))
      if (found) return found
    }
    
    // Return first available if no priority match
    return availableModels[0]
  }

  /**
   * Perform web search using Ollama's web search feature
   * Requires OLLAMA_WEB_SEARCH_API_KEY to be set
   */
  async webSearch(query: string, limit: number = 5): Promise<OllamaWebSearchResponse> {
    if (!this.webSearchApiKey) {
      throw new Error('Web search API key not configured. Set OLLAMA_WEB_SEARCH_API_KEY environment variable.')
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webSearchApiKey}`
        },
        body: JSON.stringify({
          query,
          limit
        })
      })

      if (!response.ok) {
        throw new Error(`Web search failed: ${response.statusText}`)
      }

      const data = await response.json() as OllamaWebSearchResponse
      return data
    } catch (error) {
      throw new Error(`Web search error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if web search is available (API key is configured)
   */
  isWebSearchAvailable(): boolean {
    return this.webSearchApiKey !== null && this.webSearchApiKey.length > 0
  }
}

export const ollamaService = new OllamaService()
export default ollamaService
