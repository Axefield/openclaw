/**
 * Ollama Axerey Agent
 * 
 * Manages the agent loop for Ollama with Axerey tool calling
 * Handles tool execution and response generation
 */

import { ollamaService, type OllamaChatResult } from './ollamaService.js'
import { axereyToolBridge } from './axereyToolBridge.js'

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  thinking?: string
  tool_calls?: Array<any>
  tool_name?: string
}

export interface AgentResponse {
  content: string
  thinking?: string
  toolCalls?: Array<any>
  toolResults?: Array<{
    toolName: string
    result: string
  }>
}

export class OllamaAxereyAgent {
  private ollamaService = ollamaService
  private toolBridge = axereyToolBridge
  private maxToolIterations = 5 // Prevent infinite loops

  /**
   * Chat with Ollama using Axerey tools
   */
  async chatWithTools(
    userMessage: string,
    model: string = 'qwen3',
    options?: {
      think?: boolean | 'low' | 'medium' | 'high'
      temperature?: number
      useMemoryTools?: boolean
      useReasoningTools?: boolean
    }
  ): Promise<AgentResponse> {
    // Get available tools based on options
    let availableTools: Array<any> = []
    
    if (options?.useMemoryTools !== false) {
      availableTools.push(...this.toolBridge.getMemoryTools())
    }
    
    if (options?.useReasoningTools !== false) {
      availableTools.push(...this.toolBridge.getReasoningTools())
    }

    // If no tools requested, use all tools
    if (availableTools.length === 0) {
      availableTools = this.toolBridge.getAllOllamaTools()
    }

    const messages: AgentMessage[] = [
      { role: 'user', content: userMessage }
    ]

    let iteration = 0
    const toolResults: Array<{ toolName: string; result: string }> = []

    while (iteration < this.maxToolIterations) {
      // Get response from Ollama
      const response = await this.ollamaService.chat(
        messages.map(m => ({ role: m.role, content: m.content })),
        model,
        {
          think: options?.think ?? true,
          tools: availableTools,
          temperature: options?.temperature
        }
      )

      // Add assistant response to messages
      messages.push({
        role: 'assistant',
        content: response.content,
        thinking: response.thinking,
        tool_calls: response.toolCalls
      })

      // If no tool calls, we're done
      if (!response.toolCalls || response.toolCalls.length === 0) {
        return {
          content: response.content,
          thinking: response.thinking,
          toolCalls: response.toolCalls,
          toolResults: toolResults.length > 0 ? toolResults : undefined
        }
      }

      // Execute tool calls
      for (const toolCall of response.toolCalls) {
        const toolName = toolCall.function.name
        const toolArgs = toolCall.function.arguments

        // Validate arguments
        const validation = this.toolBridge.validateToolArguments(toolName, toolArgs)
        if (!validation.valid) {
          const errorResult = `Error: ${validation.error}`
          toolResults.push({ toolName, result: errorResult })
          messages.push({
            role: 'tool',
            tool_name: toolName,
            content: errorResult
          })
          continue
        }

        // Execute tool
        try {
          const result = await this.toolBridge.executeToolCall({
            name: toolName,
            arguments: toolArgs
          })
          
          toolResults.push({ toolName, result })
          messages.push({
            role: 'tool',
            tool_name: toolName,
            content: result
          })
        } catch (error) {
          const errorResult = `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
          toolResults.push({ toolName, result: errorResult })
          messages.push({
            role: 'tool',
            tool_name: toolName,
            content: errorResult
          })
        }
      }

      iteration++
    }

    // If we hit max iterations, return the last response
    const lastMessage = messages[messages.length - 1]
    return {
      content: lastMessage.content || 'Reached maximum tool iterations',
      thinking: lastMessage.thinking,
      toolResults: toolResults.length > 0 ? toolResults : undefined
    }
  }

  /**
   * Stream chat with tools
   */
  async *chatStreamWithTools(
    userMessage: string,
    model: string = 'qwen3',
    options?: {
      think?: boolean | 'low' | 'medium' | 'high'
      temperature?: number
      useMemoryTools?: boolean
      useReasoningTools?: boolean
    }
  ): AsyncGenerator<{
    thinking?: string
    content?: string
    toolCalls?: Array<any>
    toolResults?: Array<{ toolName: string; result: string }>
    done: boolean
  }> {
    // Get available tools
    let availableTools: Array<any> = []
    
    if (options?.useMemoryTools !== false) {
      availableTools.push(...this.toolBridge.getMemoryTools())
    }
    
    if (options?.useReasoningTools !== false) {
      availableTools.push(...this.toolBridge.getReasoningTools())
    }

    if (availableTools.length === 0) {
      availableTools = this.toolBridge.getAllOllamaTools()
    }

    const messages: AgentMessage[] = [
      { role: 'user', content: userMessage }
    ]

    let iteration = 0
    const toolResults: Array<{ toolName: string; result: string }> = []

    while (iteration < this.maxToolIterations) {
      let thinking = ''
      let content = ''
      let toolCalls: Array<any> = []

      // Stream response from Ollama
      for await (const chunk of this.ollamaService.chatStream(
        messages.map(m => ({ role: m.role, content: m.content })),
        model,
        {
          think: options?.think ?? true,
          tools: availableTools,
          temperature: options?.temperature
        }
      )) {
        if (chunk.thinking) {
          thinking += chunk.thinking
          yield { thinking: chunk.thinking, done: false }
        }
        
        if (chunk.content) {
          content += chunk.content
          yield { content: chunk.content, done: false }
        }
        
        if (chunk.toolCalls) {
          toolCalls.push(...chunk.toolCalls)
          yield { toolCalls: chunk.toolCalls, done: false }
        }

        if (chunk.done) {
          break
        }
      }

      // Add assistant response to messages
      messages.push({
        role: 'assistant',
        content,
        thinking,
        tool_calls: toolCalls
      })

      // If no tool calls, we're done
      if (toolCalls.length === 0) {
        yield { 
          thinking, 
          content, 
          toolCalls, 
          toolResults: toolResults.length > 0 ? toolResults : undefined,
          done: true 
        }
        return
      }

      // Execute tool calls
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name
        const toolArgs = toolCall.function.arguments

        // Validate and execute
        const validation = this.toolBridge.validateToolArguments(toolName, toolArgs)
        if (!validation.valid) {
          const errorResult = `Error: ${validation.error}`
          toolResults.push({ toolName, result: errorResult })
          messages.push({
            role: 'tool',
            tool_name: toolName,
            content: errorResult
          })
          continue
        }

        try {
          const result = await this.toolBridge.executeToolCall({
            name: toolName,
            arguments: toolArgs
          })
          
          toolResults.push({ toolName, result })
          messages.push({
            role: 'tool',
            tool_name: toolName,
            content: result
          })
        } catch (error) {
          const errorResult = `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
          toolResults.push({ toolName, result: errorResult })
          messages.push({
            role: 'tool',
            tool_name: toolName,
            content: errorResult
          })
        }
      }

      iteration++
    }

    // Final yield
    yield { 
      toolResults: toolResults.length > 0 ? toolResults : undefined,
      done: true 
    }
  }
}

export const ollamaAxereyAgent = new OllamaAxereyAgent()
export default ollamaAxereyAgent

