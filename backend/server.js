// ================================================================
// 🧠 AI-Powered VSCode Backend (with Docs + Test Generation)
// ================================================================

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5001;


// Gemini AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// ================================================================
// 💻 Helper functions
// ================================================================

// Recursively get all code files
const getAllFiles = async (dirPath) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await getAllFiles(fullPath);
      files.push(...nested);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
};

// Combine code files into single string
const serializeWorkspace = async () => {
  const allFiles = await getAllFiles(WORKSPACE_DIR);
  let combined = '';

  for (const file of allFiles) {
    if (file.match(/\.(js|jsx|java|py|ts|tsx|html|css)$/)) {
      const content = await fs.readFile(file, 'utf-8');
      combined += `\n\n// ===== ${path.relative(WORKSPACE_DIR, file)} =====\n${content}`;
    }
  }

  return combined;
};

// Generate text using Gemini API
const generateText = async (prompt) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ================================================================
// ⚙️ Terminal Execution Routes (Original Logic)
// ================================================================

// Execute command endpoint
app.post('/api/execute', async (req, res) => {
  const { command, cwd = '.', sessionId } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  console.log(`📝 Executing: ${command}`);

  const shell = os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash';
  const shellArgs = os.platform() === 'win32' ? ['/c', command] : ['-c', command];

  let responseSent = false;
  let timeoutHandle = null;

  try {
    const workingDir = path.resolve(WORKSPACE_DIR, cwd);
    try {
      await fs.access(workingDir);
    } catch {
      return res.status(400).json({ success: false, error: `Directory does not exist: ${workingDir}` });
    }

    const childProcess = spawn(shell, shellArgs, {
      cwd: workingDir,
      env: { ...process.env, FORCE_COLOR: '1' },
      timeout: 30000
    });

    let output = '';
    let errorOutput = '';

    childProcess.stdout.on('data', (data) => (output += data.toString()));
    childProcess.stderr.on('data', (data) => (errorOutput += data.toString()));

    childProcess.on('close', (code) => {
      if (responseSent) return;
      responseSent = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);

      const finalOutput = output || errorOutput || '(command completed successfully)';
      console.log(`✅ Command finished with code: ${code}`);

      res.json({ success: code === 0, output: finalOutput, exitCode: code });
    });

    childProcess.on('error', (err) => {
      if (responseSent) return;
      responseSent = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
      console.error(`❌ Process error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message, output: '' });
    });

    if (sessionId) {
      activeProcesses.set(sessionId, childProcess);
    }

    timeoutHandle = setTimeout(() => {
      if (responseSent) return;
      responseSent = true;
      console.warn('⏱️  Command timeout');
      if (!childProcess.killed) childProcess.kill('SIGTERM');
      res.json({
        success: false,
        output: (output || errorOutput) + '\n⏱️  [Process timeout - killed after 30s]',
        exitCode: -1
      });
    }, 31000);
  } catch (err) {
    if (responseSent) return;
    responseSent = true;
    console.error(`❌ Execution error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message, output: '' });
  }
});

// ================================================================
// 🧠 AI-Powered Documentation Generation
// ================================================================

// ================================================================
// 🧪 AI-Powered Test Generation + Code Quality
// ================================================================

// ================================================================
// 📁 File Management Routes
// ================================================================

app.post('/api/readFile', async (req, res) => {
  const { filePath } = req.body;
  try {
    const fullPath = path.resolve(WORKSPACE_DIR, filePath);
    if (!fullPath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Access denied' });
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/writeFile', async (req, res) => {
  const { filePath, content } = req.body;
  try {
    const fullPath = path.resolve(WORKSPACE_DIR, filePath);
    if (!fullPath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Access denied' });
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/listDir', async (req, res) => {
  const { dirPath = '.' } = req.body;
  try {
    const fullPath = path.resolve(WORKSPACE_DIR, dirPath);
    if (!fullPath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Access denied' });
    const files = await fs.readdir(fullPath, { withFileTypes: true });
    const fileList = files.map(file => ({ name: file.name, isDirectory: file.isDirectory() }));
    res.json({ success: true, files: fileList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/createDir', async (req, res) => {
  const { dirPath } = req.body;
  try {
    const fullPath = path.resolve(WORKSPACE_DIR, dirPath);
    if (!fullPath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Access denied' });
    await fs.mkdir(fullPath, { recursive: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/delete', async (req, res) => {
  const { filePath } = req.body;
  try {
    const fullPath = path.resolve(WORKSPACE_DIR, filePath);
    if (!fullPath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Access denied' });
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

// ================================================================
// 🩺 Health Check & Utility
// ================================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/workspace', (req, res) => {
  res.json({ path: WORKSPACE_DIR });
});

// ================================================================
// 🔒 Global Error & Shutdown Handlers
// ================================================================
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
});

process.on('uncaughtException', (err) => console.error('💥 Uncaught Exception:', err));
process.on('unhandledRejection', (reason, promise) => console.error('💥 Unhandled Rejection:', promise, reason));

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  activeProcesses.forEach((proc, id) => {
    if (!proc.killed) proc.kill('SIGTERM');
  });
  process.exit(0);
});

app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 AI-Powered Backend Server Started!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`📁 Workspace: ${WORKSPACE_DIR}`);
  console.log(`🧠 Gemini Model: gemini-2.5-flash`);
  console.log(`🖥️ Platform: ${os.platform()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Ready to accept AI + Terminal commands!');
  console.log('');
});
