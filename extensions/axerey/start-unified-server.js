#!/usr/bin/env node

/**
 * Unified Ouranigon Server Startup Script
 * 
 * This script starts the unified backend server that integrates:
 * - Memory management (VSSMemoryStore)
 * - Reasoning tools (MindBalance, Steelman, Strawman)
 * - WebSocket real-time updates
 * - All MCP tools directly accessible via HTTP API
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🌌 Starting Unified Ouranigon Server...');
console.log('📦 Building TypeScript...');

// Build the TypeScript first
const buildProcess = spawn('npm', ['run', 'build'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Build failed with code', code);
    process.exit(1);
  }

  console.log('✅ Build completed successfully');
  console.log('🚀 Starting server...');

  // Start the server
  const serverProcess = spawn('node', ['dist/server.js'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PCM_DB: './ouranigon.db',
      VSS_DB: './ouranigon-vss.db'
    }
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
});

buildProcess.on('error', (err) => {
  console.error('Failed to build:', err);
  process.exit(1);
});
