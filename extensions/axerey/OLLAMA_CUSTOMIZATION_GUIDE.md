# Ollama Integration & Customization Guide

## What is Ollama?

Ollama is a tool that allows you to run large language models (LLMs) locally on your machine. Instead of relying on cloud-based AI services, Ollama lets you:

- Run AI models directly on your computer
- Generate text, chat, and create embeddings
- Keep all data processing local (privacy-focused)
- Use various open-source models like Gemma, Qwen, and others

## How Ollama is Integrated in This Project

### Architecture Overview

```
┌─────────────────┐
│   Frontend      │  React UI Component (OllamaChat.tsx)
│   (Port 5173)   │
└────────┬────────┘
         │ HTTP Requests
         ▼
┌─────────────────┐
│   Backend API   │  Express Server (Port 3122)
│   /api/ollama   │
└────────┬────────┘
         │ HTTP Requests
         ▼
┌─────────────────┐
│  Ollama Service │  ollamaService.ts
│  (Wrapper)      │
└────────┬────────┘
         │ HTTP API
         ▼
┌─────────────────┐
│   Ollama Server │  Local Ollama Instance (Port 11434)
│   (localhost)   │
└─────────────────┘
```

## Customizations Made

### 1. **OllamaService Class** (`backend/src/services/ollamaService.ts`)

A custom service wrapper that provides:

#### **Automatic Model Selection**
- **Startup Probe**: Automatically checks Ollama health on startup
- **Model Auto-Detection**: If configured models aren't available, automatically selects from available models
- **Fallback Logic**: Tries multiple embedding models in order:
  - `nomic-embed-text` (primary)
  - `qwen2.5:0.5b-instruct` (fallback)
  - `qwen3-vl:8b` (fallback)
  - `gemma3:4b` (last resort)

```typescript
// From ollamaService.ts lines 84-98
if (availableModels.length > 0) {
  if (!availableModels.includes(this.defaultModel)) {
    console.warn(`⚠️  Default model "${this.defaultModel}" not found, using "${availableModels[0]}"`)
    this.defaultModel = availableModels[0]
  }
  
  // Try to find a suitable embedding model
  const embeddingCandidates = ['nomic-embed-text', 'qwen2.5:0.5b-instruct', 'qwen3-vl:8b', 'gemma3:4b']
  if (!availableModels.includes(this.embeddingModel)) {
    const found = embeddingCandidates.find(m => availableModels.includes(m)) || availableModels[0]
    // Auto-selects best available model
  }
}
```

#### **Retry Logic with Exponential Backoff**
- Health checks retry up to 5 times
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Graceful degradation: Server continues even if Ollama is unavailable

```typescript
// From ollamaService.ts lines 54-122
async startupProbe(maxRetries: number = 5, initialDelay: number = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Health check logic
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1) // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
}
```

#### **Default Generation Options**
- Pre-configured sensible defaults for text generation:
  - Temperature: 0.7 (creativity balance)
  - Top-p: 0.9 (nucleus sampling)
  - Top-k: 40 (token diversity)
  - Repeat penalty: 1.1 (reduces repetition)

### 2. **REST API Routes** (`backend/src/routes/ollama.ts`)

Custom Express routes with:

#### **Request Validation**
- Uses Zod schemas for type-safe validation
- Validates all inputs before processing
- Returns clear error messages

#### **CORS Configuration**
- Pre-configured for development ports (5173, 5174, 3000)
- Allows credentials for authenticated requests

#### **API Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ollama/generate` | POST | Generate text from a prompt |
| `/api/ollama/embedding` | POST | Create vector embeddings |
| `/api/ollama/chat` | POST | Conversational chat interface |
| `/api/ollama/health` | GET | Check Ollama connection status |
| `/api/ollama/models` | GET | List all available models |
| `/api/ollama/models/:modelName/available` | GET | Check if specific model exists |

### 3. **Frontend Integration** (`frontend/src/components/OllamaChat.tsx`)

A comprehensive React component with:

#### **Three Operation Modes**
1. **Chat Mode**: Conversational interface with message history
2. **Generate Mode**: Single prompt generation with advanced options
3. **Embedding Mode**: Generate vector embeddings for text

#### **Real-time Health Monitoring**
- Automatic health checks on component load
- Visual status indicators (✅ HEALTHY / ❌ UNHEALTHY)
- Manual refresh button
- Error display with helpful troubleshooting messages

#### **Model Management UI**
- Dropdown showing all available models
- Indicators for default and embedding models
- Automatic model selection on load

#### **Generation Options Panel**
- Temperature slider (0-2)
- Top-p slider (0-1)
- Real-time value display
- Only shown in Generate mode

#### **User Experience Features**
- Auto-scrolling chat messages
- Loading indicators
- Keyboard shortcuts (Enter to send)
- Clear chat functionality
- Timestamp display for messages
- Color-coded message bubbles (user vs assistant)

### 4. **Memory System Integration**

Ollama is integrated into the memory system for generating embeddings:

```typescript
// From backend/src/routes/memory.ts (lines 40-41)
// Generate embedding using Ollama
const embedding = await ollamaService.generateEmbedding(validatedData.text)
```

**How it works:**
- When creating a new memory, the system uses Ollama to generate vector embeddings
- These embeddings enable semantic search through memories
- The embeddings are stored in the database for fast similarity searches

**Embedding Model Selection:**
- Primary: `nomic-embed-text` (optimized for embeddings)
- Falls back to other models if primary isn't available
- Automatically selected during startup probe

## Configuration

### Environment Variables

Set these in `backend/.env`:

```env
# Ollama Server URL (default: http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434

# Default model for text generation/chat
OLLAMA_DEFAULT_MODEL=gemma3:4b

# Embedding model for vector generation
OLLAMA_EMBED_MODEL=nomic-embed-text
```

### Default Models

The system is configured to use:
- **Generation/Chat**: `gemma3:4b` (4 billion parameter model)
- **Embeddings**: `nomic-embed-text` (specialized embedding model)

Both can be changed via environment variables or will auto-select from available models.

## Usage Examples

### Backend Service Usage

```typescript
import { ollamaService } from './services/ollamaService'

// Generate text
const result = await ollamaService.generate({
  model: 'gemma3:4b',
  prompt: 'Write a haiku about AI',
  options: {
    temperature: 0.8,
    top_p: 0.9
  }
})

// Create embedding
const embedding = await ollamaService.generateEmbedding('Sample text')

// Chat
const response = await ollamaService.chat([
  { role: 'user', content: 'Hello!' }
], 'gemma3:4b')
```

### Frontend API Usage

```typescript
import { apiService } from './services/api'

// Chat
const chatResponse = await apiService.chatWithOllama([
  { role: 'user', content: 'Hello!' }
], 'gemma3:4b')

// Generate
const genResponse = await apiService.generateWithOllama(
  'Write a poem',
  'gemma3:4b',
  { temperature: 0.8 }
)

// Embedding
const embedResponse = await apiService.generateEmbedding('Sample text')
```

## Key Customization Features

### 1. **Graceful Degradation**
- System continues to work even if Ollama is unavailable
- Clear error messages guide users to fix issues
- Health checks prevent crashes

### 2. **Automatic Model Management**
- No manual configuration needed
- Automatically finds and uses available models
- Smart fallback chain for embeddings

### 3. **Type Safety**
- Full TypeScript support
- Zod validation for all inputs
- Clear error types

### 4. **Developer Experience**
- Comprehensive error messages
- Console logging for debugging
- Health check endpoints for monitoring

### 5. **User Experience**
- Real-time status updates
- Loading indicators
- Clear error messages
- Multiple interaction modes

## Integration Points

Ollama is used in several parts of the system:

1. **Memory System**: Generates embeddings for semantic search
2. **Chat Interface**: Direct user interaction with AI models
3. **Text Generation**: Content creation and processing
4. **Reasoning Tools**: Can be used for argument analysis (future enhancement)

## Troubleshooting

### Common Issues

1. **Ollama Not Running**
   - Solution: Start Ollama with `ollama serve`
   - Check: `curl http://localhost:11434/api/tags`

2. **Models Not Found**
   - Solution: Pull models with `ollama pull <model-name>`
   - Check: `ollama list`

3. **CORS Errors**
   - Solution: Verify backend CORS configuration
   - Check: Backend logs for CORS headers

4. **Connection Timeouts**
   - Solution: Check firewall settings
   - Verify: `OLLAMA_BASE_URL` matches your Ollama instance

See `TROUBLESHOOTING_OLLAMA.md` for detailed troubleshooting steps.

## Future Enhancements

Potential improvements planned:
- Streaming responses for real-time text generation
- Model management UI (pull/delete models from frontend)
- Conversation history persistence
- Multiple conversation threads
- Model performance metrics
- Custom prompt templates
- Integration with reasoning tools for argument analysis

## Summary

The Ollama integration in this project provides:

✅ **Local AI Processing**: Run models on your machine
✅ **Automatic Configuration**: Smart model selection and fallbacks
✅ **Multiple Interfaces**: Chat, generate, and embedding modes
✅ **Memory Integration**: Automatic embedding generation
✅ **Robust Error Handling**: Graceful degradation and clear errors
✅ **Type Safety**: Full TypeScript support with validation
✅ **Developer Friendly**: Comprehensive logging and health checks

This customization makes Ollama easy to use while providing powerful features for AI-powered applications.

