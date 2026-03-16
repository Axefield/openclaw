# Vagogon Architecture Patterns

## MCP Command Pattern

When creating new MCP tools, follow this pattern:

**Base Class**: Extend `MCPCommand` from `src/core/mcp-command.ts`

**Required Implementation**:
```typescript
export class MyNewTool extends MCPCommand {
  name = 'my_new_tool';
  description = 'Description of what this tool does';
  inputSchema = z.object({
    // Define Zod schema for inputs
  });
  
  async execute(params: any) {
    try {
      // Tool implementation
      return { result: 'success' };
    } catch (error) {
      // Never throw - return error in response
      return { error: error.message };
    }
  }
}
```

**Registration**: Add to tools array in `src/index.ts`

**Error Handling**: Always use try-catch, never throw errors to MCP layer

## Memory System Architecture

**Dual Storage Pattern**:
- `MemoryStore` (SQLite) - Core storage layer
- `VSSMemoryStore` (vector search) - Semantic search capabilities

**Fallback Strategy**: Graceful degradation when VSS unavailable
- Check VSS status before using vector search
- Fall back to cosine similarity if VSS fails
- Never break functionality due to VSS issues

**Files to Reference**:
- `src/memory.ts` - Core SQLite storage
- `src/memory-vss.ts` - Vector search integration
- `src/ranker.ts` - Hybrid scoring algorithm
- `src/adaptive-ranker.ts` - Outcome-based learning
- `src/services/connectionService.ts` - Memory connections (graph relationships)
- `src/services/verificationService.ts` - Memory verification
- `src/services/qualityService.ts` - Quality evaluation

**Ranking Algorithm**:
- 60% semantic similarity (VSS or cosine)
- 20% recency (exponential decay)
- 15% importance score
- 5% usage boost
- +0.3 pin boost
- +0.1 helpful boost
- Dynamic outcome-based boost
- Connection strength boost (Smart-Thinking)

## Smart-Thinking Architecture

**Memory Connections**:
- Graph-based relationships between memories
- Connection types: supports, contradicts, refines, derives, exemplifies, generalizes, questions, analyzes, synthesizes, associates, extends, applies
- Auto-inference on memory creation
- Connection strength (0-1) for relevance weighting

**Verification System**:
- Factual claim verification
- Calculation verification
- Memory-first verification strategy
- Truth-adaptation scoring
- Background verification for new memories

**Quality Evaluation**:
- Heuristic-based quality assessment
- Metrics: confidence, relevance, quality, reliability
- Automatic quality calculation
- Quality-aware context selection

**Reasoning Tracking**:
- Step-by-step reasoning tracking
- Session state persistence
- Reasoning trace generation
- Next step suggestions

**Context Broker Enhancements**:
- Connection-based context expansion
- Trading pattern integration
- Adaptive ranking with outcome feedback
- Quality-aware memory selection

## Configuration Management

**Singleton Pattern**: Use `VagogonSecureConfigManager.getInstance()`

**Security Features**:
- Encryption (AES-256-GCM, ChaCha20-Poly1305)
- Signature verification
- Audit logging
- Environment-specific overrides

**Schema Validation**: `src/config/vagogon-schema.ts` defines all validation rules

**Security**: Never hardcode secrets, use environment variables

**Files to Reference**:
- `src/config/secure-manager.ts` - Main config manager
- `src/config/validator.ts` - Validation logic
- `src/config/vagogon-schema.ts` - Schema definitions

## Module Organization

```
src/
├── core/           # MCP framework (mcp-command.ts)
├── providers/      # Embeddings, VSS, HNSW
├── config/         # Secure managers, validators, schemas
├── reasoning/      # Mind-balance, argumentation tools
├── services/       # Smart-Thinking services
│   ├── connectionService.ts    # Memory connections
│   ├── verificationService.ts  # Memory verification
│   └── qualityService.ts       # Quality evaluation
├── memory.ts       # Core storage layer
├── memory-vss.ts   # Vector search integration
├── ranker.ts       # Scoring algorithms
└── index.ts        # MCP server entry point
```

**Core Module**: Contains base classes and framework
**Providers Module**: Pluggable services (embeddings, vector search)
**Config Module**: Security, validation, schema management
**Reasoning Module**: AI reasoning tools and decision-making
**Services Module**: Smart-Thinking services (connections, verification, quality)

## Frontend/Backend Split

**Root Directory**: MCP server (TypeScript, Node.js)
- Main server implementation
- Shared types and utilities
- MCP protocol handling

**Frontend** (`frontend/`): React 18+ application
- TypeScript, Vite build system
- Zustand for state management
- React Query for server state
- Component-based architecture

**Backend** (`backend/`): Express API server
- Express.js with TypeScript
- WebSocket for real-time updates
- Ollama integration for local AI
- Separate package.json and build
- Routes: `/api/memories`, `/api/reasoning`, `/api/mcp`
- Services: ConnectionService, VerificationService, QualityService

## Key Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **Graceful Degradation**: System works even when optional features fail
3. **Security First**: All configurations and data handling must be secure
4. **Type Safety**: Use TypeScript strictly throughout
5. **Error Handling**: Never break the MCP protocol with unhandled errors
