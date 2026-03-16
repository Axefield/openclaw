# Development Workflow and Tooling

## Build System

**Build Command**: `npm run build`
- Compiles TypeScript to JavaScript in `dist/`
- Generates `.js`, `.d.ts`, and `.js.map` files
- Uses `tsc -p .` from `tsconfig.json`

**Development Mode**: `npm run dev`
- Builds and runs in one command
- Equivalent to `tsc -p . && node dist/index.js`
- Use for development and testing

**Clean Build**: Delete `dist/` first if issues arise
```bash
rm -rf dist/
npm run build
```

**Output Structure**:
```
dist/
├── index.js              # Main server
├── memory.js             # Memory system
├── config/               # Configuration modules
├── core/                 # MCP framework
├── providers/            # Embedding providers
└── reasoning/            # Reasoning tools
```

## Development Workflow

**Code Location**: Write in `src/` (TypeScript)
- All source code in `src/` directory
- Use TypeScript with strict mode
- Follow ES2022 module patterns

**Build Process**: Compile to `dist/` (JavaScript)
- TypeScript → JavaScript compilation
- Preserve module structure
- Generate type definitions

**Execution**: Run from `dist/` (Node.js)
- Always run compiled JavaScript
- Use `node dist/index.js` for production
- Never run TypeScript directly

**Version Control**: Never commit `dist/` files
- Add `dist/` to `.gitignore`
- Build on deployment
- Keep source and compiled separate

## Multi-Workspace Structure

**Root Directory**: Main MCP server
- Shared types and utilities
- MCP protocol implementation
- Core memory and reasoning systems
- `package.json` with main dependencies

**Frontend** (`frontend/`): React application
- Separate `package.json` and `tsconfig.json`
- React 18+ with TypeScript
- Vite build system
- Zustand for state management
- React Query for server state

**Backend** (`backend/`): Express API server
- Separate `package.json` and `tsconfig.json`
- Express.js with TypeScript
- WebSocket for real-time updates
- Ollama integration for local AI
- Own build and run commands

**Each Workspace**:
- Independent `package.json`
- Own `tsconfig.json` configuration
- Separate dependency management
- Individual build processes

## Database Setup

**Automatic Initialization**: First run creates `pcm.db`
- Database created automatically on startup
- Schema migrations run automatically
- No manual setup required

**VSS Setup**: `npm run setup-vss`
- Installs vector similarity search
- Configures HNSW parameters
- Tests VSS functionality

**VSS Testing**: `npm run test-vss`
- Verifies VSS installation
- Tests vector operations
- Reports performance metrics

**Migration System**: Automatic on startup
- See `src/memory.ts` for migration logic
- Version-based schema updates
- Backward compatibility maintained

## MCP Configuration

**Configuration File**: `claude_desktop_config.json` in workspace root
```json
{
  "mcpServers": {
    "vagogon": {
      "command": "node",
      "args": ["C:/Users/p5_pa/axerey/dist/index.js"],
      "env": {
        "PCM_DB": "C:/Users/p5_pa/axerey/pcm.db",
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

**Path Requirements**: Use absolute paths
- Path to `dist/index.js` (compiled server)
- Path to `pcm.db` (database file)
- Platform-specific path separators

**Environment Variables**: Set in `env` object
- `PCM_DB`: Database file path
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `NODE_ENV`: Environment setting

## Scripts Organization

**Location**: `scripts/` directory
- Performance tests and benchmarks
- Comparison utilities
- Development tools
- Testing helpers

**Purpose**: Utilities and testing
- Vector search performance tests
- Algorithm comparisons
- Large dataset testing
- Embedding provider testing

**Import Pattern**: Import from `dist/` compiled code
```typescript
import { MemoryStore } from '../dist/memory.js';
import { VSSMemoryStore } from '../dist/memory-vss.js';
```

**Naming Convention**: Descriptive names
- `vss-performance-test.js`
- `vector-search-comparison.js`
- `large-dataset-test.js`
- `embedding-comparison.js`

## Environment Management

**Template File**: `env.template`
- Documents all environment variables
- Shows required vs optional variables
- Provides example values
- Version controlled for team reference

**Runtime File**: `.env` (gitignored)
- Local environment configuration
- Contains actual secrets and paths
- Not committed to version control
- Loaded automatically by `dotenv`

**Loading**: Automatic via `dotenv` package
```typescript
import dotenv from 'dotenv';
dotenv.config();
```

**Key Variables**:
- `PCM_DB`: Database file path
- `OPENAI_API_KEY`: OpenAI API key for embeddings
- `NODE_ENV`: Environment (development/production)

## Development Commands

**Main Commands**:
```bash
npm run build      # Compile TypeScript
npm run dev        # Build and run
npm start          # Run compiled server
npm run setup-vss  # Setup vector search
npm run test-vss   # Test VSS functionality
```

**Frontend Commands** (in `frontend/`):
```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

**Backend Commands** (in `backend/`):
```bash
npm run dev        # Start with nodemon
npm run build      # Compile TypeScript
npm start          # Run compiled server
```

## Key Principles

1. **Separation**: Keep source (`src/`) and compiled (`dist/`) separate
2. **Independence**: Each workspace has own build system
3. **Automation**: Use scripts for common operations
4. **Documentation**: Template files document configuration
5. **Security**: Never commit secrets or compiled code
6. **Consistency**: Use same patterns across workspaces
