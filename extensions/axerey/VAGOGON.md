# Vagogon - Multi-Persona Memory & Reasoning System

## 🧠 Overview

Vagogon is a sophisticated Model Context Protocol (MCP) server that provides **multi-persona memory capabilities** and **scientific-grade reasoning tools** for LLM hosts like Claude Desktop and Cursor. It combines persistent memory with probabilistic decision-making and argument analysis, giving AI systems genuine persistent memory with **adaptive learning**, **pattern recognition**, **intelligent context management**, **reasoning capabilities**, and **persona-based memory isolation**.

## 🏗️ Core Architecture

### Purpose
This server implements **multi-persona persistent memory** for AI systems, allowing them to maintain separate analytical contexts and memory stores while learning from outcomes over time. It's designed to provide genuine long-term memory capabilities with **semantic understanding**, **adaptive learning**, **intelligent context management**, and **persona-based memory isolation**.

### Technology Stack
- **TypeScript** with ES2022 modules
- **SQLite** (better-sqlite3) for local-first storage with automatic migrations
- **Vector Similarity Search** (vectorlite) for optimized vector operations
- **MCP SDK** for protocol implementation
- **OpenAI embeddings** (with fallback hash-based embeddings)
- **K-means clustering** for memory consolidation
- **Adaptive ranking algorithms** for outcome-based learning
- **Custom feature extraction** (domain-agnostic)
- **Pattern mining** for procedural rule generation

## 🧠 Memory System Features

### Memory Types
The system supports three types of memories:
- **Episodic**: Specific events/experiences
- **Semantic**: General knowledge/facts  
- **Procedural**: Rules and procedures

### Memory Properties
Each memory includes:
- **Text content** and **tags** for organization
- **Importance score** (0-1) for prioritization
- **Confidence level** (0-1) for reliability
- **Embedding vector** for semantic search
- **Usage tracking** and **decay rates**
- **Pin status** for quick access
- **Expiration dates** for temporary memories
- **Session tracking** for context
- **Belief promotion** (semantic facts)
- **Merging provenance** (tracks consolidated memories)

## 🛠️ Available Tools (32 Total)

### Core Memory Operations (6)
1. **`memorize`** - Store new memories with text, tags, importance, type, source, confidence, and custom features
2. **`recall`** - Retrieve memories by query or get recent ones (with smart ranking)
3. **`search`** - Semantic search through stored memories using embeddings
4. **`update`** - Modify existing memory text and regenerate embeddings
5. **`forget`** - Delete a memory by ID
6. **`pin`** - Pin/unpin memories for quick access

### Advanced Memory Management (4)
7. **`consolidate`** - Cluster memories using K-means → produce semantic beliefs
8. **`extract_rules`** - Pattern mine executions vs outcomes → emit IF/THEN procedural rules
9. **`summarize_day`** - Create daily summaries with activities, outcomes, key executions
10. **`decay`** - Maintain memory scores and delete/archive stale items
11. **`reflect`** - Write distilled lessons and update procedural rules

### Context & Learning (4)
12. **`context_broker`** - Returns exact memory sets for planning/execution/review tasks
13. **`grade_context`** - Provide feedback on context helpfulness for adaptive ranking
14. **`label_outcome`** - Label execution outcomes with success metrics and efficiency
15. **`why_this_context`** - Explain why specific memories were chosen for context

### Session & Organization (3)
16. **`pin_set`** - Create curated memory sets for quick access
17. **`session_start`** - Start sessions with goals and tags
18. **`session_end`** - End sessions with summaries and review

### Adaptive Learning (3)
19. **`track_context_outcome`** - Track context effectiveness for learning
20. **`get_performance_metrics`** - Get adaptive ranker performance and weights
21. **`retrain_ranker`** - Manually trigger ranker weight retraining

### Vector Search (1)
22. **`vss_status`** - Get VSS status and performance metrics

### Reasoning Tools (4) 🧠
23. **`mind.balance`** - Probabilistic decision-making with abstention-aware scoring using angel/demon advisory system
24. **`argument.steelman`** - Strengthen arguments by finding their most charitable, strongest version
25. **`argument.strawman`** - Analyze arguments to identify distortions, fallacies, and weak points
26. **`argument.pipeline.strawman-to-steelman`** - Transform distorted claims back to their strongest form through systematic analysis

### Advanced Reasoning (2) 🚀
27. **`reasoning.with_memory`** - Perform reasoning tasks with relevant memory context
28. **`decision_patterns`** - Analyze decision patterns and extract insights from stored outcomes

### Persona Management (4) 🎭
29. **`persona_list`** - List all available personas
30. **`persona_switch`** - Switch to a different persona
31. **`persona_current`** - Get current persona information
32. **`persona_config`** - Get persona-specific configuration

## 🔍 Smart Search & Ranking

### Vector Similarity Search (VSS)
Vagogon includes **optimized vector search** using the vectorlite extension:
- **Native SQLite integration** with virtual tables
- **HNSW algorithm** for fast approximate nearest neighbor search
- **Metadata filtering** - combine vector similarity with SQL filters
- **Automatic fallback** to cosine similarity if VSS unavailable
- **Performance monitoring** and status reporting

### Adaptive Hybrid Scoring Algorithm
The ranking system combines multiple factors with **automatic learning**:
- **60%** - Semantic similarity (optimized VSS or cosine similarity)
- **20%** - Recency (exponential decay with ~20.8 day half-life)
- **15%** - Importance score
- **5%** - Usage boost (capped at 0.2)
- **+0.3** - Pin boost for pinned memories
- **+0.1** - Helpful boost (user feedback)
- **Dynamic** - Outcome-based boost (learns from results)

## 🧠 Reasoning Capabilities

### Angel/Demon Advisory System
Vagogon includes a sophisticated **probabilistic decision-making system** based on the Vagogon model:
- **Angel (cosine)** = Stable, harmonizing, ethically grounded advice
- **Demon (tangent)** = Destabilizing, urgent, risky impulses  
- **Blended decision** = Weighted vector field producing calibrated probabilities
- **Abstention-aware scoring** with proper Brier and Log scoring rules

### Argument Analysis Tools
- **Steelman Technique** - Strengthen arguments by finding their most charitable version
- **Strawman Detection** - Identify distortions, fallacies, and weak points
- **Pipeline Analysis** - Transform distorted claims back to their strongest form

### Memory-Enhanced Reasoning
- **Context-aware decisions** using stored memory patterns
- **Pattern mining** from decision outcomes
- **Adaptive learning** that improves reasoning over time
- **Decision outcome tracking** with confidence scoring

## 📚 Context Resources

### Available Resources
- **`memory:today`** - All memories from today (pinned first)
- **`memory:tag/{tag}`** - Memories under a specific tag

These resources can be pulled directly into the AI's context, making memories immediately available without tool calls.

## 🔌 Embedding System

### Pluggable Providers
- **Primary**: OpenAI text-embedding-3-small (1536 dimensions)
- **Fallback**: Hash-based embeddings (256 dimensions) for offline use
- **Extensible**: Easy to add local models or other providers

### Smart Fallback
If no OpenAI API key is provided, the system uses a simple hash-based embedding that still enables basic semantic search.

## 🗄️ Storage Architecture

### SQLite Database
- **Local-first** storage with automatic indexing
- **JSON storage** for complex fields (tags, embeddings, triggers)
- **Optimized indexes** on creation time, tags, and session ID
- **Automatic schema management**

## 🧮 Advanced Features

### Adaptive Learning System
- **Outcome-based ranking** - Memories that lead to wins get boosted
- **Multi-armed bandit** - Learns optimal k values per task type
- **Weight adjustment** - Automatically adjusts ranking weights based on performance
- **Context tracking** - Tracks which memories were helpful for each execution

### Memory Consolidation
- **K-means clustering** to group similar memories
- **Automatic summarization** of related memories
- **Belief promotion** for consolidated knowledge
- **Provenance tracking** for merged memories

### Pattern Mining & Rules
- **Feature-based pattern detection** from execution records
- **IF/THEN rule generation** with confidence scores
- **Support threshold filtering** (minimum occurrences)
- **Win-rate analysis** for rule validation

### Domain Feature Extraction
- **Custom Features**: Any domain-specific features and indicators
- **Pattern Analysis**: Trend analysis, pattern detection, confluence scoring
- **Performance Metrics**: Success rates, efficiency calculations, outcome tracking
- **Context Analysis**: Domain-specific context and regime detection
- **Setup Detection**: Confluence scoring, setup identification
- **Custom Indicators**: User-defined metrics and measurements

### Memory Decay & Maintenance
- **Exponential decay** based on age and usage
- **Automatic archiving** of low-importance memories
- **Configurable decay parameters**
- **Garbage collection** for expired memories

### Reflection System
- **Lesson extraction** from experiences
- **Procedural rule creation** and updates
- **Symbol-based organization** of knowledge

### Session Management
- **Goal-oriented sessions** with symbol tracking
- **Clean session boundaries** for organized memory
- **Session summaries** for performance review

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Set Environment Variables (Optional)
For OpenAI embeddings (recommended):
```bash
# Windows PowerShell
$env:OPENAI_API_KEY="your-openai-api-key-here"

# Or create a .env file
OPENAI_API_KEY=your-openai-api-key-here
```

### 4. Set Up Vector Similarity Search (Optional but Recommended)
For optimal performance with large memory datasets, install the vectorlite extension:

```bash
# Check VSS status and get installation instructions
npm run setup-vss -- --install-instructions

# Test VSS functionality
npm run test-vss
```

### 5. Test the Server
```bash
npm start
```

## Configuration

### Claude Desktop
Add to your `settings.json`:

```json
{
  "mcpServers": {
    "vagogon": {
      "command": "node",
      "args": ["C:/Users/p5_pa/vagogon/dist/index.js"],
      "env": { "PCM_DB": "C:/Users/p5_pa/vagogon/pcm.db" }
    }
  }
}
```

### Cursor
Add to your Cursor settings:

```json
{
  "mcpServers": {
    "vagogon": {
      "command": "node",
      "args": ["C:/Users/p5_pa/vagogon/dist/index.js"]
    }
  }
}
```

## 🎯 Key Strengths

1. **Domain-Agnostic**: Built to work with any domain or use case
2. **Adaptive Learning**: Automatically learns from outcomes and improves
3. **Local-First**: No external dependencies required for core functionality
4. **Semantic Search**: Advanced vector-based memory retrieval with context awareness
5. **Smart Ranking**: Multi-factor scoring with outcome-based learning
6. **Pattern Recognition**: Automatically discovers successful patterns and rules
7. **Performance Tracking**: Comprehensive metrics for continuous improvement
8. **Production-Ready**: Full error handling, type safety, and automatic migrations
9. **Memory Management**: Automatic decay, consolidation, and maintenance
10. **Context Integration**: Direct memory access via MCP resources

## 🚀 What Makes This Special

### **For Any Domain**
- **Custom Features**: Flexible feature extraction for any domain
- **Pattern Detection**: Automatic pattern recognition and rule generation
- **Outcome Learning**: System learns which memories lead to successful outcomes
- **Rule Mining**: Discovers IF/THEN patterns from your execution history
- **Performance Analytics**: Success scores, efficiency, and comprehensive tracking

### **For AI Systems**
- **Adaptive Ranking**: Automatically optimizes memory selection based on outcomes
- **Context Broker**: Provides exactly the right memories for each task
- **Semantic Understanding**: Advanced vector-based memory retrieval
- **Continuous Learning**: Improves over time without manual intervention
- **Multi-Modal Memory**: Episodic, semantic, and procedural memory types

### **For Developers**
- **Extensible Architecture**: Easy to add new features and domain-specific logic
- **Type Safety**: Full TypeScript implementation with comprehensive types
- **Database Migrations**: Automatic schema updates with backward compatibility
- **MCP Integration**: Seamless integration with Claude Desktop and Cursor
- **Local-First**: No cloud dependencies, complete data ownership

## 🏛️ Architecture

- **Storage**: SQLite with automatic indexing and JSON field support
- **Embeddings**: Pluggable providers (OpenAI, fallback hash-based)
- **Ranking**: Hybrid scoring algorithm combining similarity, recency, importance, and usage
- **Transport**: MCP stdio transport for easy integration
- **Memory Types**: Episodic, semantic, and procedural memory support
- **Advanced Features**: K-means clustering, memory decay, reflection system

## 🚀 Development

### Build Commands
```bash
npm run build    # TypeScript compilation
npm run start    # Run compiled server
npm run dev      # Build and run
```

### Adding New Embedding Providers
Extend the `EmbeddingProvider.init()` function in `src/providers/embeddings.ts`:

```typescript
// Example: Add local model support
if (process.env.LOCAL_MODEL_PATH) {
  // Initialize local embedding model
  return new LocalEmbeddingProvider(process.env.LOCAL_MODEL_PATH);
}
```

## 📁 Project Structure

```
src/
├── index.ts              # Main MCP server with all 32 tools and handlers
├── memory.ts             # SQLite storage layer with automatic migrations
├── memory-vss.ts         # Vector similarity search integration
├── ranker.ts             # Hybrid scoring algorithm for memory ranking
├── ranker-vss.ts         # Vector-based ranking system
├── adaptive-ranker.ts    # Adaptive learning system with outcome tracking
├── reasoning/            # Reasoning tools from Ahrimagon
│   ├── mind-balance.ts   # Angel/demon advisory system
│   └── argumentation.ts  # Steelman, strawman, and pipeline tools
├── config/               # Configuration system from Ahrimagon
│   ├── encryption.ts     # Military-grade encryption
│   ├── secure-manager.ts # Secure configuration management
│   ├── validator.ts      # JSON Schema validation
│   └── ...
├── core/                 # Core MCP command framework
│   └── mcp-command.ts    # Base command classes
├── providers/
│   └── embeddings.ts     # Pluggable embedding provider interface
└── types/
    ├── kmeans-js.d.ts    # Type definitions for clustering library
    └── mcp.ts            # MCP protocol types
```

## License

MIT License - see LICENSE file for details.

---

**Vagogon** - Giving AI systems genuine persistent memory with adaptive learning and intelligent reasoning capabilities.
