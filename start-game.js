const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Check if directories exist
const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

if (!fs.existsSync(backendDir) || !fs.existsSync(frontendDir)) {
  console.error('Erro: Diretórios backend ou frontend não encontrados.');
  process.exit(1);
}

// Function to start a process
function startProcess(command, args, cwd, name) {
  console.log(`Iniciando ${name}...`);
  
  const isWindows = os.platform() === 'win32';
  const proc = spawn(
    isWindows ? 'npm.cmd' : 'npm', 
    args,
    { cwd, shell: true, stdio: 'pipe' }
  );
  
  proc.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });
  
  proc.on('close', (code) => {
    console.log(`[${name}] processo encerrado com código ${code}`);
  });
  
  return proc;
}

// Start backend
const backend = startProcess(
  'npm', 
  ['run', 'dev'], 
  backendDir, 
  'Backend'
);

// Wait a moment to let backend start first
setTimeout(() => {
  // Start frontend
  const frontend = startProcess(
    'npm', 
    ['start'], 
    frontendDir, 
    'Frontend'
  );
  
  // Handle process termination
  const cleanup = () => {
    console.log('Encerrando processos...');
    backend.kill();
    frontend.kill();
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}, 5000);

console.log('Dominó Online iniciando...');
console.log('Pressione Ctrl+C para encerrar todos os processos.'); 