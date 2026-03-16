const { spawn } = require('child_process');

console.log('🚀 Starting Simple Ouranigon Server...');

// Install backend deps and start
const backendProcess = spawn('npm', ['install'], {
  cwd: './backend',
  stdio: 'inherit',
  shell: true
});

backendProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Backend dependencies installed');
    console.log('🚀 Starting backend server...');
    
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: './backend',
      stdio: 'inherit',
      shell: true
    });
    
    serverProcess.on('close', (code) => {
      console.log(`Backend exited with code ${code}`);
    });
  } else {
    console.error('❌ Failed to install backend dependencies');
  }
});
