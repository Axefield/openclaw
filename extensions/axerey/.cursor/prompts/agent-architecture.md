# Axerey Agent Architecture

Complete guide to how agents are configured and operate in the Axerey system.

## Agent Types & Layers

### 1. Cursor Agent CLI (`cursor agent`)
**Configuration**: `.cursor/cli.json`

- **Purpose**: Project-scoped Cursor Agent CLI configuration
- **Capabilities**: 
  - Runs tasks defined in `cli.json` (start-all, stop-all, restart-all, build-all)
  - Has permissions for npm, node, git, sqlite3, powershell
  - Workspace-specific environment variables
  - Multi-workspace support (root, backend, frontend)

**Usage**:
```bash
cursor agent run start-all
cursor agent run stop-all
cursor agent run restart-all
cursor agent run build-all
```

**Tasks Available**:
- `start-all`, `start-mcp`, `start-backend`, `start-frontend`
- `stop-all`, `stop-mcp`, `stop-backend`, `stop-frontend`
- `restart-all`, `restart-mcp`, `restart-backend`, `restart-frontend`
- `build-all`

### 2. Ollama Axerey Agent (`OllamaAxereyAgent`)
**Location**: `backend/src/services/ollamaAxereyAgent.ts`

- **Purpose**: Agent loop that enables Ollama models to use Axerey tools
- **Architecture**: 
  - Wraps Ollama chat with tool calling
  - Executes Axerey tools via `AxereyToolBridge`
  - Supports streaming and non-streaming modes
  - Max 5 tool iterations to prevent infinite loops

**Features**:
- Automatic tool selection (memory tools, reasoning tools, or both)
- Tool validation before execution
- Error handling for tool failures
- Tool results fed back into conversation
- Streaming support with real-time thinking/content/tool calls

**API Endpoints**:
- `POST /api/ollama/chat-with-tools` - Chat with Axerey tools enabled
- `POST /api/ollama/chat-stream` - Stream chat with tools (SSE)
- `GET /api/ollama/tools` - List all available Axerey tools

**Usage Example**:
```typescript
const agent = new OllamaAxereyAgent()

const response = await agent.chatWithTools(
  'Remember that I prefer TypeScript over JavaScript',
  'qwen3',
  {
    think: true,
    useMemoryTools: true,
    useReasoningTools: true
  }
)
```

### 3. Axerey Tool Bridge (`AxereyToolBridge`)
**Location**: `backend/src/services/axereyToolBridge.ts`

- **Purpose**: Converts Axerey MCP tools to Ollama tool calling format
- **Functionality**:
  - Maps Axerey tool schemas (Zod) to JSON Schema for Ollama
  - Validates tool arguments before execution
  - Maps tool names between Axerey and MCP formats
  - Executes tools via MCP server (TODO: full implementation)

**Tool Categories**:

**Memory Tools** (6):
- `axerey_memorize` → `memorize`
- `axerey_recall` → `recall`
- `axerey_search` → `search`
- `axerey_update` → `update`
- `axerey_forget` → `forget`
- `axerey_pin` → `pin`

**Reasoning Tools** (4):
- `axerey_mind_balance` → `mind.balance`
- `axerey_steelman` → `argument.steelman`
- `axerey_strawman` → `argument.strawman`
- `axerey_strawman_to_steelman` → `argument.pipeline.strawman-to-steelman`

### 4. MCP Server Agent (Vagogon)
**Location**: `src/index.ts`

- **Purpose**: Provides 32+ MCP tools for memory and reasoning
- **Protocol**: Model Context Protocol (stdio transport)
- **Clients**: Claude Desktop, Cursor IDE
- **Configuration**: `.cursor/mcp.json`

**Tool Categories**:
- Core Memory Operations (6)
- Advanced Memory Management (4)
- Context & Learning (4)
- Session & Organization (3)
- Adaptive Learning (3)
- Vector Search (1)
- Reasoning Tools (4)
- Persona Management (4)

## Agent Workflow

### Ollama Agent Loop
```
User Message
    ↓
Ollama Chat (with tools)
    ↓
Tool Calls Generated?
    ├─ Yes → Execute Tools → Feed Results Back → Repeat
    └─ No → Return Final Response
```

### Tool Execution Flow
```
1. Agent receives user message
2. Ollama generates response with tool calls
3. Tool Bridge validates arguments
4. Tool Bridge executes via MCP server
5. Tool results added to conversation
6. Agent continues until no more tool calls
7. Final response returned
```

## Configuration

### Environment Variables
```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=qwen3
OLLAMA_EMBED_MODEL=nomic-embed-text

# Axerey MCP
PCM_DB=./pcm.db
NODE_ENV=development
LOG_LEVEL=INFO
VSS_ENABLED=true
```

### Agent Options
```typescript
{
  think?: boolean | 'low' | 'medium' | 'high'
  temperature?: number
  useMemoryTools?: boolean
  useReasoningTools?: boolean
}
```

## Integration Points

### 1. Cursor Agent CLI ↔ Scripts
- CLI tasks call Node.js scripts in `scripts/`
- Scripts manage service lifecycle (start/stop/restart)
- Environment variables from `cli.json` passed to scripts

### 2. Ollama Agent ↔ Tool Bridge
- Agent requests tools from Tool Bridge
- Tool Bridge provides Ollama-formatted tool definitions
- Agent executes tools via Tool Bridge

### 3. Tool Bridge ↔ MCP Server
- Tool Bridge maps Axerey tool names to MCP tool names
- Tool Bridge validates arguments using Zod schemas
- Tool Bridge executes tools via MCP protocol (TODO: full implementation)

### 4. MCP Server ↔ Memory System
- MCP tools directly access MemoryStore and VSSMemoryStore
- Tools use Adaptive Ranker for memory retrieval
- Tools store outcomes for learning

## Current Status

### ✅ Completed
- Ollama service with thinking support
- Tool Bridge with tool definitions
- Agent loop with tool execution
- Streaming support
- API endpoints for agent interaction
- Cursor Agent CLI configuration

### ⏳ Pending
- Full MCP server integration in Tool Bridge
- Frontend UI for agent interaction
- Tool execution via actual MCP protocol
- Error handling for MCP connection failures

## Best Practices

### Using Cursor Agent CLI
1. Use defined tasks instead of raw commands
2. Check `.cursor/cli.json` for available tasks
3. Use workspace-specific tasks when appropriate
4. Verify environment variables are set correctly

### Using Ollama Agent
1. Enable thinking mode for complex tasks (`think: true`)
2. Select appropriate tool categories (memory vs reasoning)
3. Monitor tool iteration count (max 5)
4. Handle tool execution errors gracefully

### Tool Development
1. Define Zod schemas for all tool inputs
2. Map tool names consistently (Axerey → MCP)
3. Validate arguments before execution
4. Return structured results as JSON strings

## Related Files

- `.cursor/cli.json` - Cursor Agent CLI configuration
- `backend/src/services/ollamaAxereyAgent.ts` - Agent implementation
- `backend/src/services/axereyToolBridge.ts` - Tool bridge
- `backend/src/routes/ollama.ts` - API endpoints
- `scripts/start-all.js`, `stop-all.js`, `restart-all.js` - Service management
- `.cursor/mcp.json` - MCP server configuration

## Future Enhancements (from todo.md)

### Phase 1: Core Integration
- [ ] Connect Tool Bridge to actual MCP server
- [ ] Implement MCP protocol communication
- [ ] Add error handling for MCP failures

### Phase 2: Advanced Features
- [ ] Multi-agent coordination
- [ ] Agent-specific memory contexts
- [ ] Agent performance tracking

### Phase 3: Self-Improvement
- [ ] Agent learning from tool usage
- [ ] Automatic tool selection optimization
- [ ] Context-aware tool recommendations

