#!/usr/bin/env node

/**
 * Stop All Applications Script
 * 
 * Stops all running Axerey services by finding and killing processes:
 * - MCP Server (node dist/index.js)
 * - Backend API (node dist/server.js or nodemon in backend/)
 * - Frontend (vite in frontend/)
 * 
 * Usage:
 *   node scripts/stop-all.js [--mcp-only] [--backend-only] [--frontend-only]
 */

const { exec } = require('child_process');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);
const mcpOnly = args.includes('--mcp-only');
const backendOnly = args.includes('--backend-only');
const frontendOnly = args.includes('--frontend-only');

const isWindows = os.platform() === 'win32';

function killProcessesByPort(port, serviceName) {
  return new Promise((resolve) => {
    if (isWindows) {
      // Windows: Find process using port and kill it
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.trim().split('\n');
          const pids = new Set();
          lines.forEach(line => {
            const match = line.match(/\s+(\d+)\s*$/);
            if (match) {
              pids.add(match[1]);
            }
          });
          
          if (pids.size > 0) {
            console.log(`🛑 Stopping ${serviceName} (port ${port})...`);
            pids.forEach(pid => {
              exec(`taskkill /F /PID ${pid}`, (err) => {
                if (err && !err.message.includes('not found')) {
                  console.error(`   Warning: Could not kill PID ${pid}`);
                }
              });
            });
            setTimeout(resolve, 500);
          } else {
            console.log(`   ${serviceName} not running on port ${port}`);
            resolve();
          }
        } else {
          console.log(`   ${serviceName} not running on port ${port}`);
          resolve();
        }
      });
    } else {
      // Unix/Linux/macOS: Find and kill process using port
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (stdout && stdout.trim()) {
          const pids = stdout.trim().split('\n');
          console.log(`🛑 Stopping ${serviceName} (port ${port})...`);
          pids.forEach(pid => {
            exec(`kill -9 ${pid}`, (err) => {
              if (err && !err.message.includes('No such process')) {
                console.error(`   Warning: Could not kill PID ${pid}`);
              }
            });
          });
          setTimeout(resolve, 500);
        } else {
          console.log(`   ${serviceName} not running on port ${port}`);
          resolve();
        }
      });
    }
  });
}

function killProcessesByName(pattern, serviceName) {
  return new Promise((resolve) => {
    if (isWindows) {
      // Windows: Find processes by name pattern
      exec(`tasklist /FI "IMAGENAME eq node.exe" /FO CSV`, (error, stdout) => {
        if (stdout && stdout.includes('node.exe')) {
          // More specific: check command line
          exec(`wmic process where "name='node.exe'" get commandline,processid /format:csv`, (err, output) => {
            if (output) {
              const lines = output.split('\n');
              const pids = [];
              lines.forEach(line => {
                if (line.includes(pattern)) {
                  const match = line.match(/,(\d+),/);
                  if (match) {
                    pids.push(match[1]);
                  }
                }
              });
              
              if (pids.length > 0) {
                console.log(`🛑 Stopping ${serviceName}...`);
                pids.forEach(pid => {
                  exec(`taskkill /F /PID ${pid}`, (killErr) => {
                    if (killErr && !killErr.message.includes('not found')) {
                      console.error(`   Warning: Could not kill PID ${pid}`);
                    }
                  });
                });
                setTimeout(resolve, 500);
              } else {
                console.log(`   ${serviceName} not running`);
                resolve();
              }
            } else {
              console.log(`   ${serviceName} not running`);
              resolve();
            }
          });
        } else {
          console.log(`   ${serviceName} not running`);
          resolve();
        }
      });
    } else {
      // Unix/Linux/macOS: Use pgrep and pkill
      exec(`pgrep -f "${pattern}"`, (error, stdout) => {
        if (stdout && stdout.trim()) {
          const pids = stdout.trim().split('\n');
          console.log(`🛑 Stopping ${serviceName}...`);
          pids.forEach(pid => {
            exec(`kill -9 ${pid}`, (err) => {
              if (err && !err.message.includes('No such process')) {
                console.error(`   Warning: Could not kill PID ${pid}`);
              }
            });
          });
          setTimeout(resolve, 500);
        } else {
          console.log(`   ${serviceName} not running`);
          resolve();
        }
      });
    }
  });
}

async function stopMCP() {
  const projectRoot = process.cwd();
  const mcpPattern = path.join(projectRoot, 'dist', 'index.js').replace(/\\/g, '\\\\');
  await killProcessesByName(mcpPattern, 'MCP Server');
}

async function stopBackend() {
  // Try to kill by port first (more reliable)
  await killProcessesByPort(3001, 'Backend API');
  
  // Also try to kill nodemon/ts-node processes in backend directory
  const backendPattern = path.join(process.cwd(), 'backend');
  await killProcessesByName(backendPattern.replace(/\\/g, '\\\\'), 'Backend (nodemon)');
}

async function stopFrontend() {
  // Vite typically runs on 5173, but can be different
  // Try common Vite ports
  const ports = [5173, 5174, 5175, 3000];
  for (const port of ports) {
    await killProcessesByPort(port, `Frontend (port ${port})`);
  }
  
  // Also try to kill vite processes
  await killProcessesByName('vite', 'Frontend (Vite)');
}

async function main() {
  console.log('🛑 Stopping Axerey Services...\n');

  if (mcpOnly) {
    await stopMCP();
  } else if (backendOnly) {
    await stopBackend();
  } else if (frontendOnly) {
    await stopFrontend();
  } else {
    // Stop all services
    await stopFrontend();
    await stopBackend();
    await stopMCP();
  }

  console.log('\n✅ All requested services stopped.');
  console.log('   Note: Some processes may take a moment to fully terminate.\n');
}

main().catch(err => {
  console.error('❌ Error stopping services:', err);
  process.exit(1);
});

