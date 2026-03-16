# Axerey / Vagogon - Agent Rules for Opencode

## Architecture Overview

**Stack**: MCP Server + Backend API (Express) + Frontend (React/Vite) + Shared TypeScript

**Key Directories**:

- `src/` - MCP server core (TypeScript source)
- `backend/` - Express API server
- `frontend/` - React application
- `dist/` - Compiled JavaScript (never edit directly)

## Memory System Architecture

**Dual Storage Pattern**:

- `MemoryStore` (SQLite) - Core storage layer
- `VSSMemoryStore` (vector search) - Semantic search capabilities

**Smart-Thinking Features**:

- Memory Connections (supports, contradicts, refines, derives, exemplifies, generalizes, questions, analyzes, synthesizes, associates, extends, applies)
- Verification System - Factual claim verification with memory-first strategy
- Quality Evaluation - Heuristic-based metrics (confidence, relevance, quality, reliability)
- Reasoning Tracking - Step-by-step reasoning with state persistence
- Context Broker - Connection-based expansion, adaptive ranking

**Files to Reference**:

- `src/memory.ts` - Core SQLite storage
- `src/memory-vss.ts` - Vector search integration
- `src/services/connectionService.ts` - Memory connections
- `src/services/verificationService.ts` - Memory verification
- `src/services/qualityService.ts` - Quality evaluation
- `src/ranker.ts` - Hybrid scoring algorithm
- `src/adaptive-ranker.ts` - Outcome-based learning

**Ranking Algorithm**:

- 60% semantic similarity (VSS or cosine)
- 20% recency (exponential decay)
- 15% importance score
- 5% usage boost
- +0.3 pin boost
- +0.1 helpful boost

## TypeScript Standards

**Module Imports**: Always use `.js` extensions (ES2022 requirement)

```typescript
import { Memory } from "./memory.js"; // ✅ Correct
import { Memory } from "./memory"; // ❌ Incorrect
```

**Error Handling**: Never throw errors to MCP layer

```typescript
async function myTool(params: any) {
  try {
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Zod Validation**: All MCP tool inputs must use Zod schemas

## Security Standards

**Never Store**: Plaintext secrets, API keys, passwords, or tokens

**Environment Variables**: Only in `.env` files, never in code

**Database Queries**: Always use parameterized queries

```typescript
const stmt = db.prepare("SELECT * FROM memories WHERE id = ?");
const result = stmt.get(memoryId);
```

**Input Validation**: Validate all inputs with Zod schemas

## Development Workflow

**Build Process**:

```bash
npm run build      # Compile TypeScript to dist/
npm run dev        # Build and run
npm start          # Run compiled server
```

**Never Edit**: `dist/` directory (compiled code)

**Multi-Workspace Structure**:

- Root: MCP server with shared types
- `backend/`: Express API (own package.json, tsconfig.json)
- `frontend/`: React app (own package.json, tsconfig.json)

## Backend API Routes

**Memory Routes** (`/api/memories`):

- `GET /api/memories` - List all memories
- `GET /api/memories/:id` - Get memory by ID
- `POST /api/memories` - Create memory
- `PUT /api/memories/:id` - Update memory
- `DELETE /api/memories/:id` - Delete memory
- `GET /api/memories/connections` - Get all connections
- `GET /api/memories/:id/connections` - Get memory connections
- `POST /api/memories/connect` - Create connection
- `GET /api/memories/:id/quality` - Get quality metrics
- `POST /api/memories/:id/verify` - Verify memory

**Reasoning Routes** (`/api/reasoning`):

- `POST /api/reasoning/steps/start` - Start reasoning step
- `POST /api/reasoning/steps/complete` - Complete reasoning step
- `GETing/steps/: /api/reasonsessionId` - Get reasoning steps
- `POST /api/reasoning/state/save` - Save reasoning state
- `GET /api/reasoning/state/:sessionId` - Get reasoning state

**Route Order**: Specific routes (e.g., `/:id/quality`) must come BEFORE generic routes (e.g., `/:id`) to avoid route conflicts

## Key Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **Graceful Degradation**: System works even when optional features fail
3. **Security First**: All configurations and data handling must be secure
4. **Type Safety**: Use TypeScript strictly throughout
5. **Error Handling**: Never break the MCP protocol with unhandled errors
6. **Smart-Thinking Integration**: Use connections, verification, and quality for enhanced memory management
