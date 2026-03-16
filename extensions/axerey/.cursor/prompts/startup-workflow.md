# Axerey Startup Workflow

Complete guide for starting all Axerey services using Cursor Agent CLI or manual commands.

## Quick Start

### Start All Services (Recommended)
```bash
# Using the startup script
node scripts/start-all.js
# Or: npm run start:all

# Or via Cursor Agent CLI task
cursor agent run start-all
```

This starts:
1. **MCP Server** (root) - Vagogon MCP server for Cursor/Claude Desktop
2. **Backend API** (backend/) - Express server on port 3001 with WebSocket
3. **Frontend** (frontend/) - React/Vite dev server (typically port 5173)

### Stop All Services
```bash
# Stop all running services
node scripts/stop-all.js
# Or: npm run stop:all

# Or via Cursor Agent CLI
cursor agent run stop-all
```

### Restart All Services
```bash
# Restart all services (stop then start)
node scripts/restart-all.js
# Or: npm run restart:all

# Or via Cursor Agent CLI
cursor agent run restart-all
```

### Start Individual Services

```bash
# MCP Server only
node scripts/start-all.js --mcp-only
# Or: npm run start:mcp

# Backend API only
node scripts/start-all.js --backend-only
# Or: npm run start:backend

# Frontend only
node scripts/start-all.js --frontend-only
# Or: npm run start:frontend
```

### Stop Individual Services

```bash
# Stop MCP Server only
node scripts/stop-all.js --mcp-only
# Or: npm run stop:mcp

# Stop Backend API only
node scripts/stop-all.js --backend-only
# Or: npm run stop:backend

# Stop Frontend only
node scripts/stop-all.js --frontend-only
# Or: npm run stop:frontend
```

### Restart Individual Services

```bash
# Restart MCP Server only
node scripts/restart-all.js --mcp-only
# Or: npm run restart:mcp

# Restart Backend API only
node scripts/restart-all.js --backend-only
# Or: npm run restart:backend

# Restart Frontend only
node scripts/restart-all.js --frontend-only
# Or: npm run restart:frontend
```

## Service Details

### MCP Server (Root)
- **Purpose**: Vagogon MCP server for memory/reasoning tools
- **Port**: stdio (MCP protocol)
- **Config**: `.cursor/mcp.json`
- **Database**: `pcm.db` (SQLite)
- **Start**: `npm run dev` or `npm start`
- **Build**: `npm run build`

### Backend API (backend/)
- **Purpose**: Express REST API + WebSocket for frontend
- **Port**: 3001 (default)
- **Routes**: `/api/personas`, `/api/memories`, `/api/reasoning`, etc.
- **Start**: `cd backend && npm run dev`
- **Build**: `cd backend && npm run build && npm start`

### Frontend (frontend/)
- **Purpose**: React 18 + Vite dev server
- **Port**: 5173 (Vite default)
- **API Proxy**: Configured to `http://localhost:3001/api`
- **Start**: `cd frontend && npm run dev`
- **Build**: `cd frontend && npm run build`

## Environment Variables

### Root (MCP Server)
```env
PCM_DB=./pcm.db
NODE_ENV=development
LOG_LEVEL=INFO
VSS_ENABLED=true
VECTOR_DIMENSION=1536
EMBEDDING_MODE=advanced-hash
OPENAI_API_KEY=your-key-here (optional)
```

### Backend
```env
NODE_ENV=development
PORT=3001
PCM_DB=../pcm.db
```

### Frontend
```env
VITE_API_URL=http://localhost:3001/api
```

## Using Cursor Agent CLI

The `.cursor/cli.json` defines tasks you can run:

```bash
# Start all services
cursor agent run start-all

# Start individual services
cursor agent run start-mcp
cursor agent run start-backend
cursor agent run start-frontend

# Build all projects
cursor agent run build-all
```

## Verification

After starting services, verify they're running:

1. **MCP Server**: Check Cursor MCP connection status (should show "axerey" server connected)
2. **Backend API**: `curl http://localhost:3001/api/health` or visit in browser
3. **Frontend**: Open `http://localhost:5173` (or check Vite output for actual port)

## Troubleshooting

### Port Conflicts
- Backend (3001): Change `PORT` env var or update `backend/src/server.ts`
- Frontend (5173): Vite auto-selects next available port

### Database Locked
- Ensure only one process accesses `pcm.db` at a time
- Stop all services before restarting

### Build Errors
- Run `npm install` in each workspace (root, backend, frontend)
- Check TypeScript compilation: `npm run build` in each workspace

### MCP Connection Issues
- Verify `.cursor/mcp.json` paths are correct
- Ensure MCP server is running: `npm run dev` in root
- Restart Cursor after MCP config changes

## Graceful Shutdown

### Using the Stop Script (Recommended)
```bash
# Stop all services
npm run stop:all

# Or stop individually
npm run stop:mcp
npm run stop:backend
npm run stop:frontend
```

### Manual Shutdown
Press `Ctrl+C` in the terminal running `start-all.js` to stop all services gracefully.

Or stop individually:
- MCP: `Ctrl+C` in root terminal
- Backend: `Ctrl+C` in backend terminal  
- Frontend: `Ctrl+C` in frontend terminal

### When to Use Restart
Use `restart:all` when:
- Configuration changes require service reload
- Services are unresponsive or in error state
- After dependency updates
- To apply environment variable changes

## Development Workflow

1. **First Time Setup**:
   ```bash
   npm install              # Root dependencies
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Daily Development**:
   ```bash
   node scripts/start-all.js
   ```

3. **After Code Changes**:
   - TypeScript auto-recompiles in dev mode
   - Frontend hot-reloads via Vite
   - Backend restarts via nodemon (if configured)

4. **Before Committing**:
   ```bash
   npm run build           # Root
   cd backend && npm run build
   cd ../frontend && npm run build
   ```

## Related Files

- `.cursor/cli.json` - Agent CLI configuration with tasks
- `scripts/start-all.js` - Unified startup script
- `start-dev.js` - Alternative dev startup (backend + frontend only)
- `start-unified-server.js` - Backend-only startup
- `package.json` - Root scripts and dependencies

