# Vagogon - Multi-Persona Memory & Reasoning System

A sophisticated Model Context Protocol (MCP) server that provides **multi-persona memory capabilities** and **scientific-grade reasoning tools** for LLM hosts like Claude Desktop and Cursor. Vagogon combines persistent memory with probabilistic decision-making and argument analysis, giving AI systems genuine persistent memory with **adaptive learning**, **pattern recognition**, **intelligent context management**, **reasoning capabilities**, and **persona-based memory isolation**.

## 📋 Table of Contents

- [🏗️ Core Architecture](#️-core-architecture)
- [🧠 Memory System Features](#-memory-system-features)
- [🛠️ Available Tools (44 Total)](#️-available-tools-44-total)
- [🔍 Smart Search & Ranking](#-smart-search--ranking)
- [🧠 Reasoning Capabilities](#-reasoning-capabilities)
- [📚 Context Resources](#-context-resources)
- [🔌 Embedding System](#-embedding-system)
- [🗄️ Storage Architecture](#️-storage-architecture)
- [🧮 Advanced Features](#-advanced-features)
- [🚀 Quick Start](#-quick-start)
- [🔧 MCP Configuration](#-mcp-configuration)
- [🚀 Usage Examples](#-usage-examples)
- [📁 Project Structure](#-project-structure)
- [🎯 Workflow Integration](#-workflow-integration)
- [🛠️ Development Setup](#️-development-setup)
- [🔧 Troubleshooting](#-troubleshooting)
- [📖 Quick Reference](#-quick-reference)

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

### Search Capabilities
- **Vector similarity search** with VSS optimization
- **Semantic search** using vector embeddings
- **Tag-based filtering** with vector search
- **Session-based filtering** with vector search
- **Time-based filtering** (today's memories)
- **Hybrid filtering** - combine vector similarity with metadata filters

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

### Prerequisites

Before setting up Vagogon, ensure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Claude Desktop** or **Cursor** - For MCP integration
- **OpenAI API Key** (optional) - For enhanced embeddings

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/vagogon.git
cd vagogon

# Install dependencies
npm install
```

### 2. Build the Project

```bash
# Compile TypeScript to JavaScript
npm run build
```

### 3. Environment Configuration

#### Option A: Using .env file (Recommended)

```bash
# Copy the environment template
cp env.template .env

# Edit .env with your credentials
# Windows (PowerShell)
notepad .env

# macOS/Linux
nano .env
```

Update the `.env` file with your actual credentials:

```env
# Database Configuration
PCM_DB=./pcm.db

# OpenAI Configuration (Optional - for embeddings)
OPENAI_API_KEY=your-openai-api-key-here

# Node Environment
NODE_ENV=production
```

#### Option B: Using Environment Variables

```bash
# Windows PowerShell
$env:OPENAI_API_KEY="your-openai-api-key-here"

# macOS/Linux
export OPENAI_API_KEY="your-openai-api-key-here"
```

### 4. Set Up Vector Similarity Search (Optional but Recommended)

For optimal performance with large memory datasets:

```bash
# Check VSS status and get installation instructions
npm run setup-vss -- --install-instructions

# Test VSS functionality
npm run test-vss
```

### 5. Verify Installation

```bash
# Run the verification script
node verify-config.js

# Test the MCP server
node test-server.js
```

### 6. Test the Server

```bash
# Start the MCP server
npm start
```

The server should start and display:
```
🧠 Vagogon MCP Server started
📊 Memory system initialized
🔧 32 tools loaded (28 memory + 4 persona)
🚀 Ready for connections
```

## 🔧 MCP Configuration

### Claude Desktop Setup

1. **Find your Claude Desktop config file:**
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`

2. **Add Vagogon to your configuration:**

```json
{
  "mcpServers": {
    "vagogon": {
      "command": "node",
      "args": ["C:/path/to/your/vagogon/dist/index.js"],
      "env": { 
        "PCM_DB": "C:/path/to/your/vagogon/pcm.db",
        "OPENAI_API_KEY": "your-openai-api-key-here"
      }
    }
  }
}
```

**Important**: Replace `C:/path/to/your/` with your actual project path!

### Cursor Setup

1. **Open Cursor Settings** (Ctrl/Cmd + ,)
2. **Go to Features → Model Context Protocol**
3. **Add a new MCP server** with these settings:

```json
{
  "mcpServers": {
    "vagogon": {
      "command": "node",
      "args": ["C:/path/to/your/vagogon/dist/index.js"],
      "env": {
        "PCM_DB": "C:/path/to/your/vagogon/pcm.db",
        "OPENAI_API_KEY": "your-openai-api-key-here"
      }
    }
  }
}
```

### Platform-Specific Paths

#### Windows
```json
{
  "command": "C:\\Program Files\\nodejs\\node.exe",
  "args": ["C:\\Users\\YourUsername\\vagogon\\dist\\index.js"],
  "env": {
    "PCM_DB": "C:\\Users\\YourUsername\\vagogon\\pcm.db"
  }
}
```

#### macOS
```json
{
  "command": "/usr/local/bin/node",
  "args": ["/Users/YourUsername/vagogon/dist/index.js"],
  "env": {
    "PCM_DB": "/Users/YourUsername/vagogon/pcm.db"
  }
}
```

#### Linux
```json
{
  "command": "/usr/bin/node",
  "args": ["/home/YourUsername/vagogon/dist/index.js"],
  "env": {
    "PCM_DB": "/home/YourUsername/vagogon/pcm.db"
  }
}
```

### Quick Configuration Helper

Use the provided configuration files as templates:

```bash
# Copy the appropriate config file
cp claude_desktop_config.json ~/.config/claude/claude_desktop_config.json  # Linux
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json  # macOS
cp claude_desktop_config.json %APPDATA%\Claude\claude_desktop_config.json  # Windows

# Update paths in the copied file
# Edit the file and replace the paths with your actual project location
```

### Environment Variables

You can also set environment variables globally instead of in the MCP config:

```bash
# Windows (PowerShell)
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-key", "User")

# macOS/Linux
echo 'export OPENAI_API_KEY="your-key"' >> ~/.bashrc
source ~/.bashrc
```

### Verification

After configuration, verify everything works:

```bash
# Test the configuration
node verify-config.js

# Test the MCP server
node test-server.js

# Check if all tools are available
npm start
```

### Troubleshooting Configuration

#### Common Issues:

1. **"Command not found" errors:**
   - Ensure Node.js is installed and in your PATH
   - Use full paths to node.exe on Windows

2. **"File not found" errors:**
   - Verify the path to `dist/index.js` is correct
   - Ensure you've run `npm run build` first

3. **"Permission denied" errors:**
   - Check file permissions on the project directory
   - Ensure the database file is writable

4. **"MCP connection failed":**
   - Restart Claude Desktop/Cursor after configuration changes
   - Check the MCP server logs for errors

#### Debug Mode:

Enable debug logging to troubleshoot issues:

```bash
# Set debug environment variable
export DEBUG="mcp:*"  # macOS/Linux
$env:DEBUG="mcp:*"    # Windows PowerShell

# Start the server
npm start
```

## 🚀 Usage Examples

### 1. Store Memories with Features

```typescript
// Store a project plan with features
memorize({
  text: "Project Alpha: React frontend with TypeScript, using Redux for state management",
  tags: ["project", "alpha", "react", "typescript", "redux"],
  importance: 0.9,
  type: "episodic",
  source: "plan",
  confidence: 0.8,
  features: {
    technology: "react",
    language: "typescript",
    stateManagement: "redux",
    priority: "high"
  }
})
```

### 2. Get Context for Tasks

```typescript
// Get context for project planning
context_broker({
  task: "planning",
  tags: ["project", "alpha"],
  k: 5
})
// Returns: latest plan + last 3 executions + active beliefs + relevant rules + important memories
```

### 3. Track Execution Outcomes

```typescript
// Label an execution outcome
label_outcome({
  execId: "exec-123",
  outcome: "success",
  score: 8.5,
  efficiency: 0.85,
  notes: "Completed ahead of schedule"
})

// Track context effectiveness
track_context_outcome({
  contextId: "ctx-456",
  outcome: "success",
  helpful: true
})
```

### 4. Extract Rules

```typescript
// Mine patterns from executions
extract_rules({
  tag: "project",
  minSupport: 3
})
// Returns: IF technology=react & language=typescript THEN SUCCESS (confidence: 75%)
```

### 5. Daily Summary

```typescript
// Get comprehensive daily summary
summarize_day({
  date: "2024-01-15",
  tags: ["project", "development"]
})
// Returns: executions, total score, success rate, key executions, rule breaches, new beliefs
```

### 6. Session Management

```typescript
// Start a work session
session_start({
  goal: "Complete React component implementation",
  tags: ["project", "alpha", "react"]
})

// End session with summary
session_end({
  sessionId: "session-789",
  summary: "3 components completed, 2 bugs fixed, +8.5 score total"
})
```

### 7. Adaptive Learning

```typescript
// Check VSS status and performance
vss_status()
// Returns: VSS availability, vector count, performance metrics, recommendations

// Get performance metrics
get_performance_metrics()
// Returns: success rate, context helpfulness, optimal k values per task

// Retrain ranker based on outcomes
retrain_ranker()
// Adjusts ranking weights based on recent performance
```

### 8. Memory Organization

```typescript
// Create curated memory sets
pin_set({
  name: "React Best Practices",
  ids: ["mem-1", "mem-2", "mem-3"]
})

// Consolidate similar memories
consolidate({
  tag: "react",
  windowDays: 7
})
// Creates semantic beliefs from clustered memories
```

### 9. Reasoning with Memory

```typescript
// Make a decision with memory context
mind.balance({
  topic: "Should we implement this feature?",
  theta: Math.PI / 4,  // 45° - ethical consideration
  phi: Math.PI / 6,    // 30° - urgency factor  
  cosine: 0.7,         // angel weight (ethical)
  tangent: 0.4,        // demon weight (urgent)
  mode: "probabilistic"
})
// Automatically stores decision outcome in memory

// Analyze arguments with memory context
reasoning.with_memory({
  task: "argument-analysis",
  query: "What are the strongest arguments for this proposal?",
  reasoningType: "steelman",
  memoryLimit: 5
})
// Uses relevant memories to enhance argument analysis

// Analyze decision patterns
decision_patterns({
  timeWindow: 30,
  patternType: "success",
  minOccurrences: 3
})
// Extracts insights from stored decision outcomes
```

### 10. Argument Analysis

```typescript
// Strengthen an argument (Steelman)
argument.steelman({
  opponentClaim: "AI will replace all human creativity",
  charitableAssumptions: ["We value human flourishing", "AI should augment human capabilities"],
  strongestPremises: [{
    text: "AI can enhance human creativity through collaboration",
    support: "Research shows AI-human collaboration produces novel outputs"
  }]
})

// Analyze argument weaknesses (Strawman)
argument.strawman({
  originalClaim: "We should regulate AI for safety",
  distortions: ["exaggeration", "false_dichotomy"],
  requestRefutation: true
})

// Transform distorted claim back to strongest form
argument.pipeline.strawman-to-steelman({
  originalClaim: "AI regulation is necessary for safety",
  distortions: ["exaggeration", "context_stripping"]
})
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
├── reasoning/            # Reasoning tools
│   ├── mind-balance.ts   # Angel/demon advisory system
│   └── argumentation.ts  # Steelman, strawman, and pipeline tools
├── config/               # Configuration system
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

## 🎯 Workflow Integration

### Planning Phase
1. **Get Context**: Use `context_broker` to retrieve relevant memories
2. **Review Rules**: Check procedural rules from `extract_rules`
3. **Store Plan**: Use `memorize` to record your plan with features

### Execution Phase
1. **Track Execution**: Use `memorize` with `source: "execution"` to log activities
2. **Monitor Context**: Use `grade_context` to rate memory helpfulness
3. **Update Features**: Use custom features for real-time analysis

### Review Phase
1. **Label Outcome**: Use `label_outcome` to record execution results
2. **Track Context**: Use `track_context_outcome` for learning
3. **Extract Lessons**: Use `reflect` to create procedural rules
4. **Daily Summary**: Use `summarize_day` for performance review

### Continuous Learning
1. **Consolidate Memories**: Use `consolidate` to create semantic beliefs
2. **Mine Patterns**: Use `extract_rules` to discover successful patterns
3. **Retrain System**: Use `retrain_ranker` to optimize memory selection
4. **Monitor Performance**: Use `get_performance_metrics` to track improvement

## 🎯 Key Strengths

1. **Multi-Persona Memory**: Separate analytical contexts and memory stores for different personas
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

### **For Multi-Persona AI Systems**
- **Persona Isolation**: Separate memory contexts for different analytical personas
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

## 🔧 API Reference

### Tools

- **memorize**: Store new memories with text, tags, importance, and optional expiration
- **recall**: Retrieve memories by query or get recent ones
- **search**: Semantic search through stored memories
- **update**: Modify existing memory text
- **forget**: Delete a memory by ID
- **pin**: Pin/unpin memories for quick access
- **decay**: Maintain memory scores and delete/archive stale items
- **reflect**: Write distilled lessons and update procedural rules

### Resources

- **memory:today**: All memories from today (pinned first)
- **memory:tag/{tag}**: Memories under a specific tag

### Prompts

- **summarize-selected**: Compress multiple memories into bullet points

## 🏛️ Architecture

- **Storage**: SQLite with automatic indexing and JSON field support
- **Embeddings**: Pluggable providers (OpenAI, fallback hash-based)
- **Ranking**: Hybrid scoring algorithm combining similarity, recency, importance, and usage
- **Transport**: MCP stdio transport for easy integration
- **Memory Types**: Episodic, semantic, and procedural memory support
- **Advanced Features**: K-means clustering, memory decay, reflection system

## 🛠️ Development Setup

### Prerequisites for Development

- **Node.js** v18+ with npm
- **TypeScript** (installed as dev dependency)
- **Git** for version control
- **Code Editor** (VS Code, Cursor, etc.)

### Development Workflow

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/vagogon.git
cd vagogon
npm install

# 2. Development mode (auto-rebuild on changes)
npm run dev

# 3. Build for production
npm run build

# 4. Test the build
npm start
```

### Available Scripts

```bash
# Development
npm run dev          # Build and run in development mode
npm run build        # Compile TypeScript to JavaScript
npm start            # Run the compiled server
npm run lint         # Run ESLint on source files
npm run format       # Format code with Prettier

# Testing
npm test             # Run basic tests
npm run test:server  # Test MCP server functionality
node test-server.js  # Test server with MCP protocol
node verify-config.js # Verify configuration

# Vector Search (Optional)
npm run setup-vss    # Setup Vector Similarity Search
npm run test-vss     # Test VSS functionality
```

### Project Structure

```
src/
├── index.ts                    # Main MCP server entry point
├── memory.ts                   # Core memory storage system
├── memory-vss.ts              # Vector similarity search
├── adaptive-ranker.ts         # Adaptive learning algorithms
├── ranker.ts                  # Memory ranking system
├── ranker-vss.ts              # Vector-based ranking
├── config/                    # Configuration management
│   ├── encryption.ts          # Security utilities
│   ├── manager.ts             # Config manager
│   ├── validator.ts           # Schema validation
│   └── types.ts               # Type definitions
├── core/                      # MCP framework
│   └── mcp-command.ts         # Base command classes
│   └── ...                    # Trading-related modules
├── reasoning/                 # AI reasoning tools
│   ├── mind-balance.ts        # Decision-making system
│   └── argumentation.ts       # Argument analysis
├── providers/                 # Pluggable providers
│   └── embeddings.ts          # Embedding providers
└── types/                     # TypeScript definitions
    ├── mcp.ts                 # MCP protocol types
    └── kmeans-js.d.ts         # Clustering library types
```

### Adding New Features

#### 1. Adding New MCP Tools

Create a new tool in `src/tools/`:

```typescript
// src/tools/my-new-tool.ts
import { MCPCommand } from '../core/mcp-command.js';

export class MyNewTool extends MCPCommand {
  name = 'my_new_tool';
  description = 'Description of what this tool does';
  
  async execute(params: any) {
    // Tool implementation
    return { result: 'success' };
  }
}
```

Register in `src/index.ts`:

```typescript
import { MyNewTool } from './tools/my-new-tool.js';

// Add to tools array
const tools = [
  // ... existing tools
  new MyNewTool()
];
```

#### 2. Adding New Embedding Providers

Extend `src/providers/embeddings.ts`:

```typescript
// Example: Add local model support
if (process.env.LOCAL_MODEL_PATH) {
  return new LocalEmbeddingProvider(process.env.LOCAL_MODEL_PATH);
}

class LocalEmbeddingProvider implements EmbeddingProvider {
  constructor(private modelPath: string) {}
  
  async embed(text: string): Promise<number[]> {
    // Load local model and generate embeddings
    return this.generateEmbedding(text);
  }
}
```

#### 3. Adding New Memory Types

Extend the memory schema in `src/memory.ts`:

```typescript
// Add new memory type
type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'my_new_type';

// Update database schema
const createMemoriesTable = `
  CREATE TABLE IF NOT EXISTS memories (
    -- ... existing columns
    custom_field TEXT,  -- Add new fields
    -- ... rest of schema
  )
`;
```

### Database Development

#### Schema Migrations

The system uses automatic migrations. To add a new migration:

1. **Modify the schema** in `src/memory.ts`
2. **Add migration logic** in the `initializeDatabase()` function
3. **Test the migration** with existing data

```typescript
// Example migration
if (currentVersion < 2) {
  await db.exec(`
    ALTER TABLE memories 
    ADD COLUMN custom_field TEXT DEFAULT NULL
  `);
  await db.exec(`UPDATE schema_version SET version = 2`);
}
```

#### Database Debugging

```bash
# Install SQLite CLI tools
# Windows: Download from sqlite.org
# macOS: brew install sqlite
# Linux: sudo apt install sqlite3

# Open the database
sqlite3 pcm.db

# Useful SQL commands
.schema memories          # Show table schema
SELECT * FROM memories LIMIT 5;  # View sample data
.tables                   # List all tables
.quit                     # Exit
```

### Testing

#### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
node test-server.js

# Test with debug output
DEBUG=mcp:* npm test
```

#### Integration Tests

```bash
# Test MCP server communication
node test-server.js

# Test persona integration
node test-persona.js

# Verify configuration
node verify-config.js
```

### Debugging

#### Enable Debug Logging

```bash
# Set debug environment variable
export DEBUG="mcp:*"  # macOS/Linux
$env:DEBUG="mcp:*"    # Windows PowerShell

# Start server with debug output
npm start
```

#### Common Debug Scenarios

1. **MCP Connection Issues:**
   ```bash
   # Check if server starts
   npm start
   
   # Test MCP protocol
   node test-server.js
   ```

2. **Database Issues:**
   ```bash
   # Check database file
   ls -la Vagogon.db
   
   # Open database
   sqlite3 Vagogon.db
   ```

3. **Memory System Issues:**
   ```bash
   # Test memory operations
   node -e "
   import('./dist/memory.js').then(m => {
     console.log('Memory system loaded');
   });
   "
   ```

### Performance Optimization

#### Vector Search Optimization

```bash
# Setup Vector Similarity Search for better performance
npm run setup-vss

# Check VSS status
npm run test-vss
```

#### Memory Management

```bash
# Clean up old memories
node -e "
import('./dist/memory.js').then(async m => {
  const memory = new m.Memory();
  await memory.decay({ minImportance: 0.1 });
  console.log('Memory cleanup completed');
});
"
```

### Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-new-feature`
3. **Make your changes** and test thoroughly
4. **Run linting**: `npm run lint`
5. **Format code**: `npm run format`
6. **Commit changes**: `git commit -m "Add my new feature"`
7. **Push to branch**: `git push origin feature/my-new-feature`
8. **Create a Pull Request**

### Code Style

- **TypeScript**: Use strict mode and proper typing
- **ESLint**: Follow the configured rules
- **Prettier**: Use for consistent formatting
- **Comments**: Document complex logic and public APIs
- **Error Handling**: Always handle errors gracefully
- **Testing**: Write tests for new features

### Database Schema

The SQLite database uses the following schema:

```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  tags TEXT NOT NULL,           -- JSON array
  importance REAL NOT NULL,
  pinned INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER,
  session_id TEXT,
  embedding TEXT NOT NULL,      -- JSON array
  usage INTEGER NOT NULL,
  type TEXT NOT NULL,           -- episodic, semantic, procedural
  source TEXT NOT NULL,         -- plan, signal, execution, account
  confidence REAL NOT NULL,
  last_used INTEGER NOT NULL,
  decay REAL NOT NULL,
  belief INTEGER NOT NULL       -- promoted semantic fact
);
```

### Memory Consolidation Algorithm

The system uses K-means clustering to consolidate similar memories:

1. **Extract embeddings** from memories within a time window
2. **Cluster similar memories** using K-means (default: 5 clusters)
3. **Create semantic beliefs** from cluster summaries
4. **Update provenance** to track merged memories
5. **Promote to beliefs** with higher confidence scores

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Installation Issues

**Problem**: `npm install` fails with permission errors
```bash
# Solution: Use a different approach
npm install --no-optional
# Or on Windows, run PowerShell as Administrator
```

**Problem**: Node.js version compatibility
```bash
# Check your Node.js version
node --version

# Should be v18 or higher. If not, update Node.js:
# Windows: Download from nodejs.org
# macOS: brew install node
# Linux: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

#### 2. Build Issues

**Problem**: TypeScript compilation errors
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

**Problem**: Module resolution errors
```bash
# Check tsconfig.json is correct
cat tsconfig.json

# Ensure all imports use .js extensions in compiled code
# Example: import { Memory } from './memory.js';
```

#### 3. MCP Connection Issues

**Problem**: Claude Desktop/Cursor can't connect to Vagogon

**Check 1**: Verify server starts correctly
```bash
npm start
# Should show: "🧠 Vagogon MCP Server started"
```

**Check 2**: Test MCP protocol
```bash
node test-server.js
# Should show: "🎉 SUCCESS: Vagogon MCP Server is working correctly!"
```

**Check 3**: Verify configuration paths
```bash
node verify-config.js
# Should show all green checkmarks
```

**Check 4**: Common path issues
- **Windows**: Use double backslashes `\\` or forward slashes `/`
- **macOS/Linux**: Ensure paths don't have spaces or special characters
- **All platforms**: Use absolute paths, not relative paths

**Check 5**: Restart your MCP client
- Close and reopen Claude Desktop/Cursor
- Check the MCP server logs in the client

#### 4. Database Issues

**Problem**: SQLite database errors
```bash
# Check database file permissions
ls -la pcm.db

# Fix permissions (Linux/macOS)
chmod 664 pcm.db

# Check if database is corrupted
sqlite3 pcm.db "PRAGMA integrity_check;"
```

**Problem**: Database locked errors
```bash
# Kill any processes using the database
# Windows
taskkill /f /im node.exe

# macOS/Linux
pkill -f "node.*index.js"
```

#### 5. Memory System Issues

**Problem**: Memories not being stored/retrieved
```bash
# Test memory system directly
node -e "
import('./dist/memory.js').then(async m => {
  const memory = new m.Memory();
  await memory.memorize({
    text: 'Test memory',
    tags: ['test'],
    importance: 0.5,
    type: 'episodic',
    source: 'test',
    confidence: 1.0
  });
  console.log('Memory stored successfully');
});
"
```

**Problem**: Vector search not working
```bash
# Check if VSS is enabled
npm run test-vss

# If VSS is not available, the system falls back to cosine similarity
# This is normal and expected behavior
```

#### 6. Persona Management Issues

**Problem**: Persona tools not working
```bash
# Test persona system
node test-persona.js

# Check persona configuration
echo $PERSONA_CONFIG
```

**Problem**: Persona switching errors
- Verify persona configuration files
- Check if persona IDs are valid
- Ensure persona permissions are correct

#### 7. Performance Issues

**Problem**: Slow memory operations
```bash
# Enable VSS for better performance
npm run setup-vss

# Clean up old memories
node -e "
import('./dist/memory.js').then(async m => {
  const memory = new m.Memory();
  await memory.decay({ minImportance: 0.1 });
  console.log('Memory cleanup completed');
});
"
```

**Problem**: High memory usage
```bash
# Check database size
ls -lh pcm.db

# Optimize database
sqlite3 pcm.db "VACUUM;"
```

### Debug Mode

Enable comprehensive logging to diagnose issues:

```bash
# Set debug environment variable
export DEBUG="mcp:*"  # macOS/Linux
$env:DEBUG="mcp:*"    # Windows PowerShell

# Start server with debug output
npm start
```

### Log Analysis

**Common log patterns and their meanings:**

```
✅ "Memory system initialized" - Database connected successfully
✅ "32 tools loaded" - All MCP tools registered
❌ "Database connection failed" - Check file permissions
❌ "MCP protocol error" - Check client configuration
⚠️  "VSS not available" - Normal fallback to cosine similarity
```

### Getting Help

1. **Check the logs** - Look for error messages in the console output
2. **Run verification** - Use `node verify-config.js` to check setup
3. **Test components** - Use individual test scripts to isolate issues
4. **Check documentation** - Review this README for specific solutions
5. **Create an issue** - If problems persist, create a GitHub issue with:
   - Your operating system
   - Node.js version
   - Error messages
   - Steps to reproduce

### Recovery Procedures

#### Complete Reset
```bash
# Stop all processes
pkill -f "node.*index.js"  # macOS/Linux
taskkill /f /im node.exe   # Windows

# Clean everything
rm -rf dist/ node_modules/ pcm.db
npm install
npm run build

# Test fresh installation
node verify-config.js
node test-server.js
```

#### Database Recovery
```bash
# Backup current database
cp pcm.db pcm.db.backup

# Create new database
rm pcm.db
npm start  # This will create a fresh database
```

#### Configuration Reset
```bash
# Reset MCP configuration
cp claude_desktop_config.json ~/.config/claude/claude_desktop_config.json  # Linux
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json  # macOS
cp claude_desktop_config.json %APPDATA%\Claude\claude_desktop_config.json  # Windows

# Update paths in the copied file
```

## 📖 Quick Reference

### Essential Commands

```bash
# Setup
git clone <repository-url>
cd vagogon
npm install
npm run build

# Configuration
cp env.template .env
# Edit .env with your credentials

# Testing
node verify-config.js
node test-server.js
npm start

# Development
npm run dev          # Build and run
npm run build        # Compile TypeScript
npm run lint         # Check code style
npm run format       # Format code
```

### Key Environment Variables

```env
# Required
PCM_DB=./pcm.db

# Optional but recommended
OPENAI_API_KEY=your-openai-api-key-here
```

### MCP Configuration Templates

#### Claude Desktop
```json
{
  "mcpServers": {
    "vagogon": {
      "command": "node",
      "args": ["/path/to/vagogon/dist/index.js"],
      "env": {
        "PCM_DB": "/path/to/vagogon/pcm.db",
        "OPENAI_API_KEY": "your-key"
      }
    }
  }
}
```

#### Cursor
```json
{
  "mcpServers": {
    "vagogon": {
      "command": "node",
      "args": ["/path/to/vagogon/dist/index.js"],
      "env": {
        "PCM_DB": "/path/to/vagogon/pcm.db"
      }
    }
  }
}
```

### Core Memory Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `memorize` | Store new memories | `text`, `tags`, `importance`, `type` |
| `recall` | Retrieve memories | `query`, `limit`, `tags` |
| `search` | Semantic search | `query`, `limit`, `tags` |
| `update` | Modify memory | `id`, `text` |
| `forget` | Delete memory | `id` |
| `pin` | Pin/unpin memory | `id`, `pinned` |

### Advanced Memory Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `consolidate` | Cluster memories | `tag`, `windowDays` |
| `extract_rules` | Mine patterns | `tag`, `minSupport` |
| `summarize_day` | Daily summary | `date`, `tags` |
| `decay` | Cleanup memories | `minImportance` |
| `reflect` | Create lessons | `topic`, `outcome` |

### Context & Learning Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `context_broker` | Get task context | `task`, `tags`, `k` |
| `grade_context` | Rate helpfulness | `helpful`, `ids` |
| `label_outcome` | Track results | `execId`, `outcome`, `score` |
| `track_context_outcome` | Learn from context | `contextId`, `outcome` |

### Reasoning Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `mind.balance` | Decision making | `topic`, `theta`, `phi`, `cosine`, `tangent` |
| `argument.steelman` | Strengthen arguments | `opponentClaim` |
| `argument.strawman` | Analyze weaknesses | `originalClaim` |
| `reasoning.with_memory` | Memory-enhanced reasoning | `task`, `query` |

### Persona Management Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `persona_list` | List all personas | - |
| `persona_switch` | Switch persona | `personaId` |
| `persona_current` | Get current persona | - |
| `persona_config` | Get persona config | `personaId` |

### Common Workflows

#### 1. Store and Retrieve Information
```typescript
// Store a memory
memorize({
  text: "Important project deadline: January 15th",
  tags: ["project", "deadline"],
  importance: 0.9,
  type: "episodic"
})

// Retrieve later
recall({ query: "project deadline", limit: 5 })
```

#### 2. Get Context for Tasks
```typescript
// Get relevant context
context_broker({
  task: "planning",
  tags: ["project"],
  k: 5
})
```

#### 3. Track Execution Outcomes
```typescript
// Label an outcome
label_outcome({
  execId: "exec-123",
  outcome: "success",
  score: 8.5,
  efficiency: 0.85
})
```

#### 4. Make Decisions with Memory
```typescript
// Use reasoning with memory context
reasoning.with_memory({
  task: "decision-making",
  query: "Should we implement this feature?",
  reasoningType: "mind-balance",
  memoryLimit: 5
})
```

### File Locations

| File | Purpose | Location |
|------|---------|----------|
| Main server | MCP server entry point | `dist/index.js` |
| Database | SQLite database | `pcm.db` |
| Environment | Configuration template | `env.template` |
| Claude config | Claude Desktop config | `claude_desktop_config.json` |
| Cursor config | Cursor MCP config | `.cursor/mcp.json` |
| Test scripts | Verification tools | `test-server.js`, `verify-config.js` |

### Platform-Specific Paths

#### Windows
- Node.js: `C:\Program Files\nodejs\node.exe`
- Config: `%APPDATA%\Claude\claude_desktop_config.json`
- Paths: Use `\\` or `/` for separators

#### macOS
- Node.js: `/usr/local/bin/node`
- Config: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Paths: Use `/` for separators

#### Linux
- Node.js: `/usr/bin/node`
- Config: `~/.config/claude/claude_desktop_config.json`
- Paths: Use `/` for separators

### Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Server won't start | `npm run build` then `npm start` |
| MCP connection failed | Check paths in config, restart client |
| Database errors | Check file permissions |
| Memory not working | Test with `node test-server.js` |
| Persona tools failing | Check persona configuration |

### Performance Tips

1. **Enable VSS** for better search performance: `npm run setup-vss`
2. **Clean old memories** regularly: Use `decay` tool
3. **Use absolute paths** in MCP configuration
4. **Monitor database size** and optimize with `VACUUM`
5. **Pin important memories** for quick access

## License

MIT License - see LICENSE file for details.
