#!/usr/bin/env node

/**
 * Development Server Startup Script
 * Starts both backend and frontend in development mode
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Ouranigon Development Environment...');

// Start backend server
console.log('📦 Building and starting backend...');
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: 3001,
    PCM_DB: './ouranigon.db',
    VSS_DB: './ouranigon-vss.db'
  }
});

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  console.log('🎨 Starting frontend...');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      VITE_API_URL: 'http://localhost:3001/api'
    }
  });

  frontendProcess.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
  });

  frontendProcess.on('error', (err) => {
    console.error('Failed to start frontend:', err);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development servers...');
    backendProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down development servers...');
    backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    process.exit(0);
  });

}, 3000); // Wait 3 seconds for backend to start

backendProcess.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

backendProcess.on('error', (err) => {
  console.error('Failed to start backend:', err);
});
