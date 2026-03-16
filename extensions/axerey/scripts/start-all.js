#!/usr/bin/env node

/**
 * Start All Applications Script
 * 
 * Starts all Axerey services in the correct order:
 * 1. MCP Server (root) - Vagogon MCP server
 * 2. Backend API (backend/) - Express server with WebSocket
 * 3. Frontend (frontend/) - React/Vite dev server
 * 
 * Usage:
 *   node scripts/start-all.js [--mcp-only] [--backend-only] [--frontend-only] [--skip-build]
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const mcpOnly = args.includes('--mcp-only');
const backendOnly = args.includes('--backend-only');
const frontendOnly = args.includes('--frontend-only');
const skipBuild = args.includes('--skip-build');

const processes = [];

function startMCP() {
  console.log('🧠 Starting MCP Server (Vagogon)...');
  const mcpProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PCM_DB: path.join(process.cwd(), 'pcm.db'),
      LOG_LEVEL: 'INFO',
      VSS_ENABLED: 'true'
    }
  });

  mcpProcess.on('error', (err) => {
    console.error('❌ Failed to start MCP server:', err);
  });

  processes.push({ name: 'MCP Server', process: mcpProcess });
  return mcpProcess;
}

function startBackend() {
  console.log('📦 Starting Backend API Server...');
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(process.cwd(), 'backend'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '3001',
      PCM_DB: path.join(process.cwd(), 'pcm.db')
    }
  });

  backendProcess.on('error', (err) => {
    console.error('❌ Failed to start backend:', err);
  });

  processes.push({ name: 'Backend API', process: backendProcess });
  return backendProcess;
}

function startFrontend() {
  console.log('🎨 Starting Frontend Dev Server...');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(process.cwd(), 'frontend'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      VITE_API_URL: 'http://localhost:3001/api'
    }
  });

  frontendProcess.on('error', (err) => {
    console.error('❌ Failed to start frontend:', err);
  });

  processes.push({ name: 'Frontend', process: frontendProcess });
  return frontendProcess;
}

// Graceful shutdown handler
function shutdown() {
  console.log('\n🛑 Shutting down all services...');
  processes.forEach(({ name, process: proc }) => {
    console.log(`   Stopping ${name}...`);
    proc.kill('SIGINT');
  });
  
  setTimeout(() => {
    processes.forEach(({ name, process: proc }) => {
      if (!proc.killed) {
        console.log(`   Force killing ${name}...`);
        proc.kill('SIGTERM');
      }
    });
    process.exit(0);
  }, 5000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Main startup logic
console.log('🚀 Starting Axerey Development Environment...\n');

if (mcpOnly) {
  startMCP();
} else if (backendOnly) {
  startBackend();
} else if (frontendOnly) {
  startFrontend();
} else {
  // Start all services
  const mcp = startMCP();
  
  // Wait for MCP to initialize, then start backend
  setTimeout(() => {
    const backend = startBackend();
    
    // Wait for backend to start, then start frontend
    setTimeout(() => {
      startFrontend();
      console.log('\n✅ All services started!');
      console.log('   MCP Server: Running (check Cursor MCP connection)');
      console.log('   Backend API: http://localhost:3001');
      console.log('   Frontend: http://localhost:5173 (or check Vite output)');
      console.log('\n   Press Ctrl+C to stop all services\n');
    }, 3000);
  }, 2000);
}

