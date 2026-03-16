# 🧠 Axerey System Mind Map

```
                                    AXEREY
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
              CORE SYSTEM      FRONTEND/BACKEND    INTEGRATIONS
                    │                 │                 │
    ┌───────────────┼───────────────┐│                 │
    │               │               ││                 │
    ▼               ▼               ▼▼                 ▼
```

## 🏗️ CORE SYSTEM

### 📦 MCP Server (`src/index.ts`)
```
MCP Server
├── Protocol Handler
│   ├── Tool Registration (44 tools)
│   ├── Resource Handlers
│   └── Prompt Templates
├── Memory Tools (32)
│   ├── Core Operations (6)
│   │   ├── memorize
│   │   ├── recall
│   │   ├── search
│   │   ├── update
│   │   ├── forget
│   │   └── pin
│   ├── Advanced Management (4)
│   │   ├── consolidate
│   │   ├── extract_rules
│   │   ├── summarize_day
│   │   └── decay
│   ├── Context & Learning (4)
│   │   ├── context_broker
│   │   ├── grade_context
│   │   ├── label_outcome
│   │   └── why_this_context
│   ├── Session Management (3)
│   │   ├── session_start
│   │   ├── session_end
│   │   └── pin_set
│   ├── Adaptive Learning (3)
│   │   ├── track_context_outcome
│   │   ├── get_performance_metrics
│   │   └── retrain_ranker
│   └── Vector Search (1)
│       └── vss_status
└── Reasoning Tools (4)
    ├── mind.balance
    ├── argument.steelman
    ├── argument.strawman
    └── reasoning.with_memory
```

### 🧠 Memory System
```
Memory System
├── Storage Layer
│   ├── MemoryStore (SQLite)
│   │   ├── Database: pcm.db
│   │   ├── Schema Management
│   │   ├── Auto Migrations
│   │   └── Indexes (created_at, tags, session_id)
│   └── Memory Types
│       ├── Episodic (events/experiences)
│       ├── Semantic (knowledge/facts)
│       └── Procedural (rules/procedures)
│
├── Vector Search Layer
│   ├── VSSMemoryStore
│   │   ├── Vector Similarity Search (vectorlite)
│   │   ├── HNSW Algorithm
│   │   ├── Hybrid VSS (HNSW + Vectorlite)
│   │   └── Fallback to Cosine Similarity
│   └── Embedding Providers
│       ├── Hash-based (default, 1536 dim)
│       ├── Transformers.js (384 dim)
│       │   └── Models: MiniLM, mpnet, multilingual
│       ├── Llama.cpp (4096 dim)
│       └── Ollama (via API)
│           ├── nomic-embed-text
│           ├── qwen2.5:0.5b-instruct
│           └── qwen3-vl:8b (fallback)
│
├── Ranking System
│   ├── Hybrid Ranker
│   │   ├── 60% Semantic Similarity
│   │   ├── 20% Recency (exponential decay)
│   │   ├── 15% Importance Score
│   │   ├── 5% Usage Boost
│   │   ├── +0.3 Pin Boost
│   │   └── +0.1 Helpful Boost
│   ├── Adaptive Ranker
│   │   ├── Outcome-based Learning
│   │   ├── Multi-armed Bandit (optimal k)
│   │   ├── Weight Adjustment
│   │   └── Context Tracking
│   └── VSS Ranker
│       └── Vector-based Scoring
│
└── Memory Properties
    ├── Core Fields
    │   ├── id, text, tags
    │   ├── importance (0-1)
    │   ├── confidence (0-1)
    │   ├── embedding (vector)
    │   └── type (episodic/semantic/procedural)
    ├── Metadata
    │   ├── createdAt, updatedAt
    │   ├── expiresAt
    │   ├── sessionId
    │   ├── pinned, usage
    │   └── lastUsed
    ├── Learning Fields
    │   ├── outcome (success/failure/neutral)
    │   ├── score, efficiency
    │   ├── helpful (user feedback)
    │   └── servedContextId
    └── Advanced Fields
        ├── source (plan/signal/execution/account)
        ├── decay rate
        ├── belief (promoted semantic)
        ├── mergedFrom (provenance)
        └── features (custom domain data)
```

### 🧮 Reasoning System
```
Reasoning System
├── Mind Balance (Angel/Demon Advisory)
│   ├── Probabilistic Decision-Making
│   ├── Abstention-aware Scoring
│   ├── Modes: angel, demon, blend, probabilistic
│   └── Parameters: theta, phi, cosine, tangent
│
├── Argumentation Tools
│   ├── Steelman
│   │   ├── Strengthen arguments
│   │   ├── Charitable assumptions
│   │   └── Strongest premises
│   ├── Strawman
│   │   ├── Identify distortions
│   │   ├── Detect fallacies
│   │   └── Weak point analysis
│   └── Pipeline (Strawman → Steelman)
│       └── Transform distorted claims
│
└── Memory-Enhanced Reasoning
    ├── Context-aware decisions
    ├── Pattern mining
    └── Decision outcome tracking
```

### ⚙️ Configuration System
```
Configuration System
├── Secure Manager
│   ├── Encryption (AES-256-GCM, ChaCha20-Poly1305)
│   ├── Signature Verification
│   ├── Audit Logging
│   └── Environment Overrides
│
├── Schema Validation
│   ├── JSON Schema
│   ├── Type Definitions
│   └── Validators
│
└── Config Types
    ├── Scientific Manager
    ├── Secure Manager
    └── Vagogon Schema
```

## 🎨 FRONTEND/BACKEND

### 🖥️ Frontend (`frontend/`)
```
Frontend (React 18+)
├── Technology Stack
│   ├── React 18+ with TypeScript
│   ├── Vite Build System
│   ├── Zustand (State Management)
│   └── React Query (Server State)
│
├── Components
│   ├── Memory Components
│   ├── Reasoning Components
│   └── System Components
│
├── Services
│   └── API Service
│       ├── Memory Operations
│       ├── Ollama Integration
│       └── Reasoning Tools
│
└── Pages
    └── Main Dashboard
```

### 🔧 Backend (`backend/`)
```
Backend (Express + TypeScript)
├── API Routes
│   ├── /api/memories
│   │   ├── GET (list)
│   │   ├── POST (create)
│   │   ├── PUT (update)
│   │   ├── DELETE
│   │   └── POST /search
│   │
│   ├── /api/ollama
│   │   ├── POST /generate
│   │   ├── POST /embedding
│   │   ├── POST /chat
│   │   ├── GET /models
│   │   ├── GET /health
│   │   └── GET /models/:name/available
│   │
│   ├── /api/reasoning
│   │   ├── POST /angel-demon-balance
│   │   ├── POST /steelman
│   │   └── POST /strawman
│   │
│   └── /api/system
│       ├── GET /health
│       ├── GET /metrics
│       └── GET /config
│
├── Services
│   └── OllamaService
│       ├── Health Check
│       ├── Startup Probe
│       ├── Model Management
│       └── Auto Model Selection
│
└── WebSocket (Socket.IO)
    └── Real-time Updates
```

## 🔌 INTEGRATIONS

### 🤖 Ollama Integration
```
Ollama Integration
├── Service Layer
│   ├── Base URL: http://localhost:11434
│   ├── Default Model: gemma3:4b
│   ├── Embedding Model: nomic-embed-text
│   └── Environment Variables
│       ├── OLLAMA_DEFAULT_MODEL
│       └── OLLAMA_EMBED_MODEL
│
├── Health Monitoring
│   ├── Startup Probe (retry with backoff)
│   ├── Health Check Endpoint
│   ├── Model Availability Check
│   └── Auto Model Selection
│
├── API Endpoints
│   ├── /api/generate (text generation)
│   ├── /api/embeddings (vector generation)
│   ├── /api/chat (conversation)
│   └── /api/tags (model list)
│
└── Models
    ├── Installed
    │   ├── gemma3:4b
    │   └── qwen3-vl:8b
    └── Recommended
        ├── nomic-embed-text
        └── qwen2.5:0.5b-instruct
```

### 🔗 MCP Integration
```
MCP Integration
├── Protocol
│   ├── stdio Transport
│   ├── Tool Registration
│   ├── Resource Handlers
│   └── Prompt Templates
│
├── Clients
│   ├── Claude Desktop
│   └── Cursor IDE
│
└── Configuration
    ├── claude_desktop_config.json
    └── .cursor/mcp.json
```

## 📊 DATA FLOW

```
┌─────────────┐
│   User      │
│  Request    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  MCP Server     │
│  (src/index.ts) │
└──────┬──────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Memory Store │  │ Embedding    │
│  (SQLite)    │  │ Provider     │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │                 ▼
       │          ┌──────────────┐
       │          │ Vector       │
       │          │ Embedding    │
       │          └──────┬───────┘
       │                 │
       ▼                 ▼
┌─────────────────────────────┐
│   VSS Memory Store          │
│   (Vector Similarity)      │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   Ranker                    │
│   (Hybrid Scoring)         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   Results                   │
│   (Ranked Memories)        │
└─────────────────────────────┘
```

## 🔄 WORKFLOW INTEGRATION

```
Planning Phase
├── context_broker → Get relevant memories
├── extract_rules → Check procedural rules
└── memorize → Store plan with features

Execution Phase
├── memorize (source: "execution") → Log activities
├── grade_context → Rate memory helpfulness
└── update features → Real-time analysis

Review Phase
├── label_outcome → Record execution results
├── track_context_outcome → Learn from context
├── reflect → Create procedural rules
└── summarize_day → Performance review

Continuous Learning
├── consolidate → Create semantic beliefs
├── extract_rules → Discover patterns
├── retrain_ranker → Optimize selection
└── get_performance_metrics → Track improvement
```

## 🗂️ FILE STRUCTURE

```
axerey/
├── src/                          # MCP Server Core
│   ├── index.ts                  # Main entry point
│   ├── memory.ts                 # SQLite storage
│   ├── memory-vss.ts            # Vector search
│   ├── ranker.ts                # Hybrid ranking
│   ├── adaptive-ranker.ts       # Learning system
│   ├── core/
│   │   └── mcp-command.ts       # MCP framework
│   ├── providers/
│   │   ├── embeddings.ts        # Embedding providers
│   │   ├── transformers-embeddings.ts
│   │   ├── llama-cpp-embeddings.ts
│   │   └── hnsw-search.ts
│   ├── reasoning/
│   │   ├── mind-balance.ts
│   │   └── argumentation.ts
│   └── config/
│       ├── secure-manager.ts
│       └── validator.ts
│
├── backend/                      # Express API
│   └── src/
│       ├── server.ts
│       ├── routes/
│       │   ├── memory.ts
│       │   ├── ollama.ts
│       │   ├── reasoning.ts
│       │   └── system.ts
│       └── services/
│           └── ollamaService.ts
│
├── frontend/                     # React App
│   └── src/
│       ├── components/
│       ├── services/
│       │   └── api.ts
│       └── stores/
│
└── Configuration Files
    ├── .cursor/mcp.json
    ├── claude_desktop_config.json
    ├── env.template
    └── download-ollama-models.ps1
```

## 🎯 KEY FEATURES

### 🧠 Memory Capabilities
- ✅ Multi-persona memory isolation
- ✅ Semantic search with vector embeddings
- ✅ Adaptive learning from outcomes
- ✅ Pattern recognition and rule mining
- ✅ Context-aware memory retrieval
- ✅ Automatic memory consolidation
- ✅ Memory decay and maintenance

### 🧮 Reasoning Capabilities
- ✅ Probabilistic decision-making (Angel/Demon)
- ✅ Argument analysis (Steelman/Strawman)
- ✅ Memory-enhanced reasoning
- ✅ Decision pattern analysis
- ✅ Abstention-aware scoring

### 🔌 Integration Capabilities
- ✅ MCP protocol support
- ✅ Ollama local AI integration
- ✅ Multiple embedding providers
- ✅ Vector similarity search
- ✅ WebSocket real-time updates

### ⚙️ System Features
- ✅ Local-first architecture
- ✅ Automatic schema migrations
- ✅ Secure configuration management
- ✅ Health monitoring and probes
- ✅ Graceful degradation
- ✅ Type-safe TypeScript

## 📈 PERFORMANCE OPTIMIZATION

```
Performance Layers
├── Vector Search
│   ├── VSS (vectorlite) - Native SQLite
│   ├── HNSW Algorithm - Fast ANN
│   └── Fallback - Cosine Similarity
│
├── Ranking
│   ├── Hybrid Scoring - Multi-factor
│   ├── Adaptive Learning - Outcome-based
│   └── Caching - Frequent queries
│
├── Embeddings
│   ├── Provider Selection - Best available
│   ├── Batch Processing - Multiple texts
│   └── Dimension Optimization - Right size
│
└── Database
    ├── Indexes - Fast queries
    ├── JSON Storage - Complex fields
    └── Vacuum - Periodic cleanup
```

## 🔐 SECURITY & CONFIGURATION

```
Security Layer
├── Encryption
│   ├── AES-256-GCM
│   └── ChaCha20-Poly1305
│
├── Configuration
│   ├── Environment Variables
│   ├── Schema Validation
│   └── Secure Storage
│
└── Access Control
    └── Persona Isolation
```

---

## 🚀 QUICK REFERENCE

### Core Components
- **Memory Store**: SQLite database with vector search
- **Embedding Providers**: Hash, Transformers.js, Llama.cpp, Ollama
- **Ranking System**: Hybrid + Adaptive learning
- **Reasoning Tools**: Mind balance, Argument analysis
- **MCP Server**: 44 tools for memory and reasoning
- **Frontend**: React app with real-time updates
- **Backend**: Express API with Ollama integration

### Key Technologies
- TypeScript, Node.js, SQLite
- React, Vite, Zustand
- Express, Socket.IO
- Ollama, Transformers.js
- Vector Similarity Search (VSS)
- MCP Protocol

### Data Flow
User → MCP Server → Memory Store → Embedding → VSS → Ranker → Results

---

*Last Updated: Based on current codebase structure*
*System: Axerey (Multi-Persona Memory & Reasoning System)*

