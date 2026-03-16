# Ollama + Axerey Integration Plan

## Overview

This plan integrates Ollama's **thinking** capability and **tool calling** with Axerey's MCP services, allowing Ollama models to use Axerey's memory and reasoning tools directly.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ollama Model (Qwen3/DeepSeek)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Thinking Mode: Shows reasoning process               │  │
│  │  Tool Calling: Invokes Axerey MCP tools               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Ollama Service (Enhanced)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Thinking support (think: true)                     │  │
│  │  • Tool calling adapter                               │  │
│  │  • MCP tool mapper                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Axerey Tool Bridge                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Converts Ollama tool calls → MCP tool calls       │  │
│  │  • Maps tool schemas                                  │  │
│  │  • Executes MCP tools                                │  │
│  │  • Returns results to Ollama                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Axerey MCP Server                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Memory Tools (6): memorize, recall, search, etc.    │  │
│  │  Reasoning Tools (4): mind.balance, steelman, etc.  │  │
│  │  Advanced Tools (22): consolidate, reflect, etc.     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Enhanced Ollama Service with Thinking Support

**File**: `backend/src/services/ollamaService.ts`

#### 1.1 Add Thinking Support

```typescript
export interface OllamaChatRequest {
  model: string
  messages: Array<{ role: string; content: string; thinking?: string }>
  stream?: boolean
  think?: boolean | 'low' | 'medium' | 'high'  // Support thinking
  tools?: Array<{  // Support tool calling
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
    thinking?: string  // Reasoning trace
    tool_calls?: Array<{  // Tool invocations
      type: 'function'
      function: {
        name: string
        arguments: any
      }
    }>
  }
  done: boolean
}
```

#### 1.2 Update Chat Method

```typescript
async chat(
  messages: Array<{ role: string; content: string }>,
  model?: string,
  options?: {
    think?: boolean | 'low' | 'medium' | 'high'
    tools?: Array<any>
    temperature?: number
  }
): Promise<{ content: string; thinking?: string; toolCalls?: any[] }> {
  const response = await fetch(`${this.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || this.defaultModel,
      messages,
      stream: false,
      think: options?.think ?? false,
      tools: options?.tools,
      options: {
        temperature: options?.temperature ?? 0.7,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1
      }
    })
  })

  const data = await response.json()
  return {
    content: data.message?.content || '',
    thinking: data.message?.thinking,
    toolCalls: data.message?.tool_calls
  }
}
```

### Phase 2: Axerey Tool Bridge

**File**: `backend/src/services/axereyToolBridge.ts` (NEW)

#### 2.1 Tool Schema Mapper

Maps Axerey MCP tools to Ollama tool calling format:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

export class AxereyToolBridge {
  private mcpServer: Server
  private toolDefinitions: Map<string, any>

  constructor() {
    // Initialize MCP server connection
    // Load all available Axerey tools
  }

  /**
   * Convert Axerey MCP tool to Ollama tool format
   */
  convertMCPToolToOllama(mcpTool: any): any {
    return {
      type: 'function',
      function: {
        name: mcpTool.name,
        description: mcpTool.description,
        parameters: this.convertZodToJSONSchema(mcpTool.inputSchema)
      }
    }
  }

  /**
   * Get all Axerey tools as Ollama tools
   */
  async getAllOllamaTools(): Promise<Array<any>> {
    // Get tools from MCP server
    // Convert each to Ollama format
    // Return array of tool definitions
  }

  /**
   * Execute an Ollama tool call using Axerey MCP
   */
  async executeToolCall(toolCall: {
    name: string
    arguments: any
  }): Promise<string> {
    // Convert Ollama tool call to MCP format
    // Execute via MCP server
    // Return result as string
  }
}
```

#### 2.2 Tool Categories

**Memory Tools** (Priority 1):
- `memorize` - Store memories
- `recall` - Retrieve memories
- `search` - Semantic search
- `update` - Update memory
- `forget` - Delete memory
- `pin` - Pin/unpin memory

**Reasoning Tools** (Priority 1):
- `mind.balance` - Angel/demon decision making
- `argument.steelman` - Strengthen arguments
- `argument.strawman` - Analyze weaknesses
- `argument.pipeline.strawman-to-steelman` - Pipeline tool

**Advanced Tools** (Priority 2):
- `consolidate` - Cluster memories
- `reflect` - Create lessons
- `context_broker` - Get task context
- `reasoning.with_memory` - Memory-enhanced reasoning

### Phase 3: Enhanced Chat with Tool Calling

**File**: `backend/src/services/ollamaWithAxerey.ts` (NEW)

#### 3.1 Agent Loop Implementation

```typescript
export class OllamaAxereyAgent {
  private ollamaService: OllamaService
  private toolBridge: AxereyToolBridge
  private availableTools: Array<any>

  async chatWithTools(
    userMessage: string,
    model: string = 'qwen3',
    options?: { think?: boolean }
  ): Promise<{ content: string; thinking?: string; toolCalls?: any[] }> {
    // 1. Get available Axerey tools
    this.availableTools = await this.toolBridge.getAllOllamaTools()

    // 2. Initial chat with tools available
    const messages = [
      { role: 'user', content: userMessage }
    ]

    let response = await this.ollamaService.chat(messages, model, {
      think: options?.think ?? true,
      tools: this.availableTools
    })

    messages.push({
      role: 'assistant',
      content: response.content,
      thinking: response.thinking,
      tool_calls: response.toolCalls
    })

    // 3. Execute tool calls if any
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
        const result = await this.toolBridge.executeToolCall({
          name: toolCall.function.name,
          arguments: toolCall.function.arguments
        })

        messages.push({
          role: 'tool',
          tool_name: toolCall.function.name,
          content: result
        })
      }

      // 4. Get final response with tool results
      response = await this.ollamaService.chat(messages, model, {
        think: options?.think ?? true,
        tools: this.availableTools
      })
    }

    return response
  }
}
```

### Phase 4: Streaming Support with Thinking

**File**: `backend/src/services/ollamaService.ts`

#### 4.1 Streaming Chat with Thinking

```typescript
async *chatStream(
  messages: Array<{ role: string; content: string }>,
  model?: string,
  options?: {
    think?: boolean
    tools?: Array<any>
  }
): AsyncGenerator<{
  thinking?: string
  content?: string
  toolCalls?: any[]
  done: boolean
}> {
  const response = await fetch(`${this.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || this.defaultModel,
      messages,
      stream: true,
      think: options?.think ?? false,
      tools: options?.tools
    })
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let thinking = ''
  let content = ''
  let toolCalls: any[] = []
  let inThinking = false

  while (true) {
    const { done, value } = await reader!.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.trim() === '') continue
      try {
        const chunk = JSON.parse(line)
        
        if (chunk.message?.thinking) {
          if (!inThinking) {
            inThinking = true
            yield { thinking: '', done: false }
          }
          thinking += chunk.message.thinking
          yield { thinking: chunk.message.thinking, done: false }
        }
        
        if (chunk.message?.content) {
          if (inThinking) {
            inThinking = false
            yield { thinking: null, content: '', done: false }
          }
          content += chunk.message.content
          yield { content: chunk.message.content, done: false }
        }
        
        if (chunk.message?.tool_calls) {
          toolCalls.push(...chunk.message.tool_calls)
          yield { toolCalls: chunk.message.tool_calls, done: false }
        }
        
        if (chunk.done) {
          yield { done: true, thinking, content, toolCalls }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}
```

### Phase 5: API Routes Enhancement

**File**: `backend/src/routes/ollama.ts`

#### 5.1 Add Tool-Enabled Chat Endpoint

```typescript
const ChatWithToolsSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.string(),
    thinking: z.string().optional(),
    tool_calls: z.array(z.any()).optional(),
    tool_name: z.string().optional()
  })).min(1),
  model: z.string().optional(),
  think: z.union([z.boolean(), z.enum(['low', 'medium', 'high'])]).optional(),
  useAxereyTools: z.boolean().default(true)
})

router.post('/chat-with-tools', async (req, res) => {
  try {
    const validatedData = ChatWithToolsSchema.parse(req.body)
    const agent = new OllamaAxereyAgent()
    
    const response = await agent.chatWithTools(
      validatedData.messages[validatedData.messages.length - 1].content,
      validatedData.model,
      { think: validatedData.think ?? true }
    )

    res.json({
      success: true,
      data: {
        response: response.content,
        thinking: response.thinking,
        toolCalls: response.toolCalls
      }
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to chat with tools'
    })
  }
})
```

#### 5.2 Add Streaming Endpoint

```typescript
router.post('/chat-stream', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const validatedData = ChatWithToolsSchema.parse(req.body)
    const agent = new OllamaAxereyAgent()
    
    for await (const chunk of agent.chatStream(validatedData.messages, validatedData.model, {
      think: validatedData.think ?? true
    })) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`)
    }
    
    res.end()
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Streaming failed'
    })
  }
})
```

### Phase 6: Frontend Integration

**File**: `frontend/src/components/OllamaChat.tsx`

#### 6.1 Add Thinking Display

```typescript
const [thinking, setThinking] = useState<string>('')
const [showThinking, setShowThinking] = useState(true)

// In handleSendMessage, handle thinking chunks
if (response.data.thinking) {
  setThinking(response.data.thinking)
}

// Add thinking display in UI
{showThinking && thinking && (
  <Card className="mb-3">
    <CardHeader>
      <h6>🧠 Thinking Process</h6>
    </CardHeader>
    <CardBody>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
        {thinking}
      </pre>
    </CardBody>
  </Card>
)}
```

#### 6.2 Add Tool Calls Display

```typescript
const [toolCalls, setToolCalls] = useState<Array<any>>([])

// Display tool calls
{toolCalls.length > 0 && (
  <Card className="mb-3">
    <CardHeader>
      <h6>🔧 Tool Calls</h6>
    </CardHeader>
    <CardBody>
      {toolCalls.map((call, idx) => (
        <div key={idx} className="mb-2">
          <Badge color="info">{call.function.name}</Badge>
          <pre style={{ fontSize: '0.85em' }}>
            {JSON.stringify(call.function.arguments, null, 2)}
          </pre>
        </div>
      ))}
    </CardBody>
  </Card>
)}
```

## Tool Mapping Reference

### Memory Tools

| Axerey Tool | Ollama Tool Name | Description |
|------------|-----------------|-------------|
| `memorize` | `axerey_memorize` | Store new memories |
| `recall` | `axerey_recall` | Retrieve memories by query |
| `search` | `axerey_search` | Semantic search through memories |
| `update` | `axerey_update` | Modify existing memory |
| `forget` | `axerey_forget` | Delete a memory |
| `pin` | `axerey_pin` | Pin/unpin memories |

### Reasoning Tools

| Axerey Tool | Ollama Tool Name | Description |
|------------|-----------------|-------------|
| `mind.balance` | `axerey_mind_balance` | Angel/demon decision making |
| `argument.steelman` | `axerey_steelman` | Strengthen arguments |
| `argument.strawman` | `axerey_strawman` | Analyze argument weaknesses |
| `argument.pipeline.strawman-to-steelman` | `axerey_strawman_to_steelman` | Transform distorted claims |

## Example Usage

### Basic Chat with Thinking

```typescript
const response = await ollamaService.chat([
  { role: 'user', content: 'Should I invest in this project?' }
], 'qwen3', {
  think: true  // Enable thinking
})

console.log('Thinking:', response.thinking)
console.log('Answer:', response.content)
```

### Chat with Axerey Tools

```typescript
const agent = new OllamaAxereyAgent()

const response = await agent.chatWithTools(
  'Remember that I prefer TypeScript over JavaScript',
  'qwen3',
  { think: true }
)

// Model will use memorize tool automatically
// Then provide response with context
```

### Streaming with Thinking

```typescript
for await (const chunk of ollamaService.chatStream(messages, 'qwen3', {
  think: true
})) {
  if (chunk.thinking) {
    console.log('Thinking:', chunk.thinking)
  }
  if (chunk.content) {
    console.log('Content:', chunk.content)
  }
  if (chunk.toolCalls) {
    console.log('Tool calls:', chunk.toolCalls)
  }
}
```

## Implementation Checklist

### Backend
- [ ] Add thinking support to `OllamaService.chat()`
- [ ] Create `AxereyToolBridge` class
- [ ] Map all Axerey tools to Ollama format
- [ ] Implement tool execution bridge
- [ ] Create `OllamaAxereyAgent` with agent loop
- [ ] Add streaming support with thinking
- [ ] Add `/api/ollama/chat-with-tools` endpoint
- [ ] Add `/api/ollama/chat-stream` endpoint
- [ ] Add `/api/ollama/tools` endpoint (list available tools)

### Frontend
- [ ] Add thinking display component
- [ ] Add tool calls display
- [ ] Add streaming support
- [ ] Add "Enable Thinking" toggle
- [ ] Add "Use Axerey Tools" toggle
- [ ] Update API service with new endpoints

### Testing
- [ ] Test thinking mode with Qwen3
- [ ] Test tool calling with memory tools
- [ ] Test tool calling with reasoning tools
- [ ] Test streaming with thinking
- [ ] Test agent loop with multiple tool calls
- [ ] Test error handling

## Configuration

### Environment Variables

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=qwen3  # Supports thinking
OLLAMA_EMBED_MODEL=nomic-embed-text

# Axerey MCP Configuration
AXEREY_MCP_SERVER_PATH=./src/index.ts
AXEREY_ENABLE_TOOLS=true
AXEREY_THINKING_ENABLED=true
```

### Model Requirements

**Thinking Support:**
- ✅ Qwen3 (recommended)
- ✅ DeepSeek R1
- ✅ DeepSeek-v3.1
- ✅ GPT-OSS (with think levels)

**Tool Calling Support:**
- ✅ Qwen3 (recommended)
- ✅ Most modern Ollama models

## Next Steps

1. **Start with Phase 1**: Add thinking support to existing Ollama service
2. **Phase 2**: Create tool bridge for memory tools first (simpler)
3. **Phase 3**: Add reasoning tools
4. **Phase 4**: Add streaming support
5. **Phase 5**: Frontend integration
6. **Phase 6**: Testing and refinement

## References

- [Ollama Thinking Documentation](https://docs.ollama.com/capabilities/thinking)
- [Ollama Tool Calling Documentation](https://docs.ollama.com/capabilities/tool-calling)
- [Axerey MCP Tools](README.md)

