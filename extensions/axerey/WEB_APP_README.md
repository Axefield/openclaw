# Ouranigon Web Application

A modern web interface for the Ouranigon AI reasoning system, featuring a kanban-style interface for managing ideas, thinking sessions, decisions, and memories.

## 🚀 Quick Start

### Prerequisites
- Node.js v20.18.3+
- Ollama installed and running
- Qwen3 models: `ollama pull qwen3:0.6b` and `ollama pull qwen3-embedding:0.6b`

### Installation & Running

1. **Start Ollama**:
   ```bash
   ollama serve
   ```

2. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api/health

## 🎯 Features

- **Kanban Interface**: Ideas → Think → Decide → Notes → Done
- **Memory Management**: VSS with HNSW + VectorLite
- **Reasoning Tools**: Angel/Demon balance, Steelman/Strawman argumentation
- **Local AI**: Ollama integration with Qwen3 models
- **Real-time Updates**: WebSocket-based live updates

## 🏗️ Architecture

- **Frontend**: React 18+ with TypeScript, Vite, Reactstrap
- **Backend**: Node.js with Express, WebSocket, Ollama integration
- **AI**: Ollama with qwen3:0.6b and qwen3-embedding:0.6b
- **Storage**: SQLite with Vector Similarity Search

## 📁 Structure

```
├── frontend/          # React application
├── backend/           # Express API server
└── src/              # Original Ouranigon MCP systems
```

The web application integrates with your existing Ouranigon MCP server while providing a modern web interface.
