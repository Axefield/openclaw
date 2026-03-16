# Ollama Integration Guide

## Overview

This document explains how Ollama is integrated into the Ouranigon system and how to use it through the frontend interface.

## Backend Integration

### Ollama Service (`backend/src/services/ollamaService.ts`)

The `OllamaService` class provides the core functionality for interacting with Ollama:

- **Base URL**: `http://localhost:11434` (configurable via `OLLAMA_BASE_URL`)
- **Default Model**: `gemma3:4b` (configurable via `OLLAMA_DEFAULT_MODEL`)
- **Embedding Model**: `nomic-embed-text` (configurable via `OLLAMA_EMBED_MODEL`)

### Key Methods

1. **`startupProbe()`**: Verifies Ollama is available and auto-selects models
2. **`generate()`**: Generates text from a prompt
3. **`generateEmbedding()`**: Creates embeddings for text
4. **`chat()`**: Conversational chat interface
5. **`getAvailableModels()`**: Lists all available Ollama models
6. **`isModelAvailable()`**: Checks if a specific model is installed

### API Routes (`backend/src/routes/ollama.ts`)

The backend exposes the following endpoints:

- `POST /api/ollama/generate` - Generate text
- `POST /api/ollama/embedding` - Generate embeddings
- `POST /api/ollama/chat` - Chat with models
- `GET /api/ollama/health` - Health check
- `GET /api/ollama/models` - List available models
- `GET /api/ollama/models/:modelName/available` - Check model availability

### Server Configuration

The Ollama routes are registered in `backend/src/server.ts`:

```typescript
import ollamaRouter from './routes/ollama.js'
app.use('/api/ollama', ollamaRouter)
```

## Frontend Integration

### API Service (`frontend/src/services/api.ts`)

The frontend API service includes these Ollama methods:

- `generateWithOllama()` - Generate text with options
- `generateEmbedding()` - Create embeddings
- `chatWithOllama()` - Chat interface
- `getOllamaHealth()` - Check Ollama status
- `getOllamaModels()` - Get available models
- `checkModelAvailable()` - Verify model availability

### Ollama Chat Component (`frontend/src/components/OllamaChat.tsx`)

A comprehensive UI component that provides:

1. **Health Status Display**
   - Shows Ollama connection status
   - Lists available models
   - Displays errors if any

2. **Configuration Panel**
   - Mode selection (Chat, Generate, Embedding)
   - Model selection dropdown
   - Generation options (temperature, top_p, etc.)

3. **Chat Interface**
   - Message history
   - Real-time conversation
   - Loading states
   - Error handling

4. **Three Modes**:
   - **Chat**: Conversational interface with message history
   - **Generate**: Single prompt generation with advanced options
   - **Embedding**: Generate vector embeddings for text

### Navigation

The Ollama interface is accessible via:
- Route: `/ollama`
- Navigation link in Header: "🤖 Ollama"

## Configuration

### Environment Variables

Set these in your `.env` file (or use `backend/env.example` as template):

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gemma3:4b
OLLAMA_EMBED_MODEL=nomic-embed-text
```

### Default Models

The system will auto-select models if configured ones aren't available:
- Falls back to first available model for generation
- Tries common embedding models: `nomic-embed-text`, `qwen2.5:0.5b-instruct`, `qwen3-vl:8b`, `gemma3:4b`

## Usage

### Starting Ollama

1. Ensure Ollama is installed and running:
   ```bash
   ollama serve
   ```

2. Pull required models:
   ```bash
   ollama pull gemma3:4b
   ollama pull nomic-embed-text
   ```

### Using the Frontend

1. Navigate to `/ollama` in the web interface
2. Check health status (should show "HEALTHY" if Ollama is running)
3. Select a model from the dropdown
4. Choose a mode (Chat, Generate, or Embedding)
5. Type your message/prompt and send

### Programmatic Usage

```typescript
import { apiService } from './services/api'

// Chat
const chatResponse = await apiService.chatWithOllama([
  { role: 'user', content: 'Hello!' }
], 'gemma3:4b')

// Generate
const genResponse = await apiService.generateWithOllama(
  'Write a poem about AI',
  'gemma3:4b',
  { temperature: 0.8 }
)

// Embedding
const embedResponse = await apiService.generateEmbedding('Sample text')
```

## Features

### Health Monitoring
- Automatic health checks on component load
- Manual refresh button
- Error display with helpful messages

### Model Management
- Automatic model detection
- Model availability checking
- Default model indicators
- Embedding model indicators

### Generation Options
- Temperature control (0-2)
- Top-p sampling (0-1)
- Top-k sampling
- Repeat penalty

### User Experience
- Real-time message display
- Auto-scrolling chat
- Loading indicators
- Error handling
- Clear chat functionality
- Keyboard shortcuts (Enter to send)

## Integration Points

Ollama is used throughout the system:

1. **Memory System**: Generates embeddings for memory storage
2. **Reasoning Tools**: Can be used for argument analysis
3. **Chat Interface**: Direct user interaction
4. **Text Generation**: Content creation

## Troubleshooting

### Ollama Not Connecting
- Verify Ollama is running: `ollama serve`
- Check `OLLAMA_BASE_URL` matches your Ollama instance
- Ensure firewall allows connections to port 11434

### Models Not Found
- Pull required models: `ollama pull <model-name>`
- Check available models: `ollama list`
- System will auto-select from available models

### Health Check Fails
- Check Ollama logs for errors
- Verify network connectivity
- Ensure Ollama API is accessible at configured URL

## Future Enhancements

Potential improvements:
- Streaming responses
- Model management UI (pull/delete models)
- Conversation history persistence
- Multiple conversation threads
- Model performance metrics
- Custom prompt templates

