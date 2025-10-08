const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Store active processes
const activeProcesses = new Map();

// Create a workspace directory
const WORKSPACE_DIR = path.join(__dirname, 'workspace');

// Initialize workspace
const initWorkspace = async () => {
  try {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });
    console.log('✅ Workspace initialized at:', WORKSPACE_DIR);
  } catch (error) {
    console.error('❌ Error initializing workspace:', error);
  }
};

initWorkspace();

// Execute command endpoint with STABLE error handling
app.post('/api/execute', async (req, res) => {
  const { command, cwd = '.', sessionId } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  console.log(`📝 Executing: ${command}`);

  // Determine shell based on OS
  const shell = os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash';
  const shellArgs = os.platform() === 'win32' ? ['/c', command] : ['-c', command];

  let responseSent = false;
  let timeoutHandle = null;

  try {
    // Resolve working directory
    const workingDir = path.resolve(WORKSPACE_DIR, cwd);
    
    // Check if directory exists
    try {
      await fs.access(workingDir);
    } catch {
      return res.status(400).json({ 
        success: false,
        error: `Directory does not exist: ${workingDir}` 
      });
    }

    const childProcess = spawn(shell, shellArgs, {
      cwd: workingDir,
      env: { ...process.env, FORCE_COLOR: '1' },
      timeout: 30000 // Built-in timeout
    });

    let output = '';
    let errorOutput = '';

    // Collect stdout
    childProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Collect stderr
    childProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Handle process completion
    childProcess.on('close', (code) => {
      if (responseSent) return;
      responseSent = true;
      
      if (timeoutHandle) clearTimeout(timeoutHandle);

      const finalOutput = output || errorOutput || '(command completed successfully)';
      
      console.log(`✅ Command finished with code: ${code}`);
      
      res.json({
        success: code === 0,
        output: finalOutput,
        exitCode: code
      });
    });

    // Handle process errors
    childProcess.on('error', (err) => {
      if (responseSent) return;
      responseSent = true;
      
      if (timeoutHandle) clearTimeout(timeoutHandle);
      
      console.error(`❌ Process error: ${err.message}`);
      
      res.status(500).json({
        success: false,
        error: err.message,
        output: ''
      });
    });

    // Store process if it's a long-running command
    if (sessionId) {
      activeProcesses.set(sessionId, childProcess);
    }

    // Backup timeout (in case built-in doesn't work)
    timeoutHandle = setTimeout(() => {
      if (responseSent) return;
      responseSent = true;

      console.warn('⏱️  Command timeout');

      if (!childProcess.killed) {
        childProcess.kill('SIGTERM');
        
        // Force kill if still running after 2 seconds
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill('SIGKILL');
          }
        }, 2000);
      }

      res.json({
        success: false,
        output: (output || errorOutput) + '\n⏱️  [Process timeout - killed after 30s]',
        exitCode: -1
      });
    }, 31000); // Slightly longer than spawn timeout

  } catch (err) {
    if (responseSent) return;
    responseSent = true;
    
    console.error(`❌ Execution error: ${err.message}`);
    
    res.status(500).json({
      success: false,
      error: err.message,
      output: ''
    });
  }
});

// Read file endpoint
app.post('/api/readFile', async (req, res) => {
  const { filePath } = req.body;
  
  try {
    const fullPath = path.resolve(WORKSPACE_DIR, filePath);
    
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Write file endpoint
app.post('/api/writeFile', async (req, res) => {
  const { filePath, content } = req.body;
  
  try {
    const fullPath = path.resolve(WORKSPACE_DIR, filePath);
    
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List directory endpoint
app.post('/api/listDir', async (req, res) => {
  const { dirPath = '.' } = req.body;
  
  try {
    const fullPath = path.resolve(WORKSPACE_DIR, dirPath);
    
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const files = await fs.readdir(fullPath, { withFileTypes: true });
    const fileList = files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory()
    }));
    
    res.json({ success: true, files: fileList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create directory endpoint
app.post('/api/createDir', async (req, res) => {
  const { dirPath } = req.body;
  
  try {
    const fullPath = path.resolve(WORKSPACE_DIR, dirPath);
    
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await fs.mkdir(fullPath, { recursive: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete file/directory endpoint
app.post('/api/delete', async (req, res) => {
  const { filePath } = req.body;
  
  try {
    const fullPath = path.resolve(WORKSPACE_DIR, filePath);
    
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.unlink(fullPath);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Kill process endpoint
app.post('/api/kill', (req, res) => {
  const { sessionId } = req.body;
  
  const childProcess = activeProcesses.get(sessionId);
  if (childProcess && !childProcess.killed) {
    childProcess.kill('SIGTERM');
    activeProcesses.delete(sessionId);
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Process not found' });
  }
});

// Get workspace path
app.get('/api/workspace', (req, res) => {
  res.json({ path: WORKSPACE_DIR });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: err.message 
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  
  // Kill all active processes
  activeProcesses.forEach((proc, sessionId) => {
    if (!proc.killed) {
      console.log(`Killing process ${sessionId}`);
      proc.kill('SIGTERM');
    }
  });
  
  process.exit(0);
});

app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Terminal Backend Server Started!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`📁 Workspace: ${WORKSPACE_DIR}`);
  console.log(`🖥️  Platform: ${os.platform()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Ready to accept commands!');
  console.log('');
});