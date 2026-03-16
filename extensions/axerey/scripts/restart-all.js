#!/usr/bin/env node

/**
 * Restart All Applications Script
 * 
 * Stops all running Axerey services, then starts them again.
 * Useful for applying configuration changes or recovering from errors.
 * 
 * Usage:
 *   node scripts/restart-all.js [--mcp-only] [--backend-only] [--frontend-only] [--skip-build]
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const mcpOnly = args.includes('--mcp-only');
const backendOnly = args.includes('--backend-only');
const frontendOnly = args.includes('--frontend-only');
const skipBuild = args.includes('--skip-build');

console.log('🔄 Restarting Axerey Services...\n');

// First, stop all services
console.log('Step 1: Stopping existing services...\n');
const stopProcess = spawn('node', ['scripts/stop-all.js', ...args.filter(arg => !arg.includes('skip-build'))], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
});

stopProcess.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log('⚠️  Some services may not have been running (this is OK)\n');
  }
  
  // Wait a moment for processes to fully terminate
  console.log('Step 2: Waiting for processes to terminate...\n');
  setTimeout(() => {
    console.log('Step 3: Starting services...\n');
    
    // Now start services
    const startProcess = spawn('node', ['scripts/start-all.js', ...args], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    });

    startProcess.on('close', (startCode) => {
      if (startCode === 0 || startCode === null) {
        console.log('\n✅ Restart complete!');
      } else {
        console.log('\n⚠️  Restart completed with warnings. Check output above.');
      }
    });

    startProcess.on('error', (err) => {
      console.error('❌ Failed to start services:', err);
      process.exit(1);
    });
  }, 2000); // Wait 2 seconds for cleanup
});

stopProcess.on('error', (err) => {
  console.error('❌ Failed to stop services:', err);
  // Continue anyway - maybe nothing was running
  console.log('Continuing with restart...\n');
  
  setTimeout(() => {
    const startProcess = spawn('node', ['scripts/start-all.js', ...args], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    });

    startProcess.on('error', (startErr) => {
      console.error('❌ Failed to start services:', startErr);
      process.exit(1);
    });
  }, 1000);
});

