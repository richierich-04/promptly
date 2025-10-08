import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, X, Save, Terminal as TerminalIcon } from 'lucide-react';
import Editor, { loader } from '@monaco-editor/react';

const BACKEND_URL = 'http://localhost:5001';

const VSCodeFileExplorer = ({ generatedFiles }) => {
  const [fileSystem, setFileSystem] = useState(generatedFiles || {
    name: 'project-root',
    type: 'folder',
    children: [
      {
        name: 'src',
        type: 'folder',
        children: [
          { name: 'index.js', type: 'file', content: '// Your code here\nconst greeting = "Hello World";\nconsole.log(greeting);' }
        ]
      },
      { name: 'README.md', type: 'file', content: '# Project README\n\nThis is a **sample** project.' }
    ]
  });

  const [expandedFolders, setExpandedFolders] = useState(new Set(['project-root', 'src']));
  const [selectedFile, setSelectedFile] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [showNewFileInput, setShowNewFileInput] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('file');
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [terminalOutput, setTerminalOutput] = useState([
    { type: 'info', text: '🚀 Real Terminal Connected!' },
    { type: 'info', text: 'You can now run actual commands like: npm install, npm run dev, touch file.txt, etc.' },
    { type: 'info', text: 'Type "help" for simulated commands or use real shell commands.' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState('.');
  const [isExecuting, setIsExecuting] = useState(false);
  const editorRef = useRef(null);
  const terminalInputRef = useRef(null);
  const terminalOutputRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sessionId = useRef(Date.now().toString());

  // Configure Monaco loader
  useEffect(() => {
    loader.config({ 
      paths: { 
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' 
      } 
    });
  }, []);

  // Check backend connection and load initial file system
  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log('Attempting to connect to backend at:', BACKEND_URL);
        const response = await fetch(`${BACKEND_URL}/api/health`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Backend health check:', data);
          
          setTerminalOutput(prev => [...prev, { 
            type: 'success', 
            text: `✅ Backend connected at ${BACKEND_URL}` 
          }]);
          
          // Only load workspace if no AI-generated files
          if (!generatedFiles) {
            setTerminalOutput(prev => [...prev, { 
              type: 'info', 
              text: '🔄 Loading workspace files from disk...' 
            }]);
            
            await refreshFileSystem();
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        setTerminalOutput(prev => [...prev, { 
          type: 'error', 
          text: `❌ Cannot connect to backend at ${BACKEND_URL}` 
        }, {
          type: 'error',
          text: `Error: ${error.message}`
        }, {
          type: 'info',
          text: 'Make sure backend is running: cd backend && npm start'
        }]);
      }
    };
    
    // Retry connection after a short delay
    setTimeout(checkBackend, 1000);
  }, [generatedFiles]);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Get language from file extension
  const getLanguageFromFileName = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'md': 'markdown',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sh': 'shell',
      'sql': 'sql',
      'php': 'php',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'r': 'r',
    };
    return languageMap[ext] || 'plaintext';
  };

  // Execute real command via backend
  const executeRealCommand = async (command) => {
    setIsExecuting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          cwd: currentDirectory,
          sessionId: sessionId.current
        })
      });

      const data = await response.json();
      
      if (data.output) {
        // Split output by lines and add each line
        data.output.split('\n').forEach(line => {
          if (line.trim()) {
            setTerminalOutput(prev => [...prev, { 
              type: data.success ? 'output' : 'error', 
              text: line 
            }]);
          }
        });
      }

      if (!data.success && data.error) {
        setTerminalOutput(prev => [...prev, { 
          type: 'error', 
          text: `Error: ${data.error}` 
        }]);
      }

      // Refresh file system after commands that might modify files
      if (command.includes('touch') || command.includes('mkdir') || 
          command.includes('rm') || command.includes('npm') || 
          command.includes('git') || command.includes('>') ||
          command.includes('mv') || command.includes('cp')) {
        setTimeout(() => refreshFileSystem(), 500);
      }
    } catch (error) {
      setTerminalOutput(prev => [...prev, { 
        type: 'error', 
        text: `Connection error: ${error.message}. Make sure backend is running!` 
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Build file tree from backend
  const buildFileTree = async (dirPath = '.') => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/listDir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dirPath })
      });

      const data = await response.json();
      if (!data.success || !data.files) return null;

      const children = await Promise.all(
        data.files.map(async (file) => {
          const fullPath = dirPath === '.' ? file.name : `${dirPath}/${file.name}`;
          
          if (file.isDirectory) {
            const subChildren = await buildFileTree(fullPath);
            return {
              name: file.name,
              type: 'folder',
              children: subChildren || []
            };
          } else {
            // Try to read file content
            let content = '';
            try {
              const fileResponse = await fetch(`${BACKEND_URL}/api/readFile`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filePath: fullPath })
              });
              const fileData = await fileResponse.json();
              if (fileData.success) {
                content = fileData.content;
              }
            } catch (err) {
              console.log('Could not read file:', fullPath);
            }
            
            return {
              name: file.name,
              type: 'file',
              content: content
            };
          }
        })
      );

      return children;
    } catch (error) {
      console.error('Error building file tree:', error);
      return null;
    }
  };

  // Refresh file system from backend
  const refreshFileSystem = async () => {
    try {
      setTerminalOutput(prev => [...prev, { 
        type: 'info', 
        text: '🔄 Refreshing file explorer...' 
      }]);

      const children = await buildFileTree('.');
      
      if (children) {
        const newFileSystem = {
          name: 'workspace',
          type: 'folder',
          children: children
        };
        
        setFileSystem(newFileSystem);
        setExpandedFolders(new Set(['workspace']));
        
        setTerminalOutput(prev => [...prev, { 
          type: 'success', 
          text: '✅ File explorer refreshed!' 
        }]);
      }
    } catch (error) {
      console.error('Error refreshing file system:', error);
      setTerminalOutput(prev => [...prev, { 
        type: 'error', 
        text: `❌ Failed to refresh: ${error.message}` 
      }]);
    }
  };

  // Execute terminal command
  const executeCommand = async (cmd) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    setTerminalOutput(prev => [...prev, { type: 'command', text: `$ ${trimmedCmd}` }]);
    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    const [command, ...args] = trimmedCmd.split(' ');

    // Handle built-in commands
    switch (command.toLowerCase()) {
      case 'help':
        setTerminalOutput(prev => [...prev, 
          { type: 'output', text: '📚 Available Commands:' },
          { type: 'output', text: '' },
          { type: 'output', text: '🔧 Built-in Commands:' },
          { type: 'output', text: '  help     - Show this help message' },
          { type: 'output', text: '  clear    - Clear terminal' },
          { type: 'output', text: '  cls      - Clear terminal (Windows)' },
          { type: 'output', text: '  refresh  - Refresh file explorer from disk' },
          { type: 'output', text: '' },
          { type: 'output', text: '💻 Real Shell Commands (examples):' },
          { type: 'output', text: '  ls / dir           - List files' },
          { type: 'output', text: '  pwd                - Current directory' },
          { type: 'output', text: '  cd <dir>           - Change directory' },
          { type: 'output', text: '  touch <file>       - Create file' },
          { type: 'output', text: '  mkdir <dir>        - Create directory' },
          { type: 'output', text: '  cat <file>         - View file' },
          { type: 'output', text: '  echo <text>        - Print text' },
          { type: 'output', text: '  npm init           - Initialize npm' },
          { type: 'output', text: '  npm install        - Install packages' },
          { type: 'output', text: '  npm run dev        - Run dev server' },
          { type: 'output', text: '  git init           - Initialize git' },
          { type: 'output', text: '  python <file>      - Run Python' },
          { type: 'output', text: '  node <file>        - Run Node.js' },
        ]);
        break;

      case 'refresh':
        await refreshFileSystem();
        break;

      case 'clear':
      case 'cls':
        setTerminalOutput([]);
        break;

      case 'cd':
        if (args[0]) {
          const newDir = args[0] === '..' 
            ? (currentDirectory.split('/').slice(0, -1).join('/') || '.')
            : args[0].startsWith('/') ? args[0] : `${currentDirectory}/${args[0]}`;
          setCurrentDirectory(newDir);
          setTerminalOutput(prev => [...prev, { 
            type: 'success', 
            text: `Changed directory to: ${newDir}` 
          }]);
        } else {
          setCurrentDirectory('.');
          setTerminalOutput(prev => [...prev, { 
            type: 'success', 
            text: 'Changed to workspace root' 
          }]);
        }
        break;

      default:
        // Execute real command via backend
        await executeRealCommand(trimmedCmd);
    }
  };

  // Handle terminal input
  const handleTerminalKeyDown = (e) => {
    if (e.key === 'Enter' && !isExecuting) {
      executeCommand(terminalInput);
      setTerminalInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setTerminalOutput(prev => [...prev, { type: 'info', text: '^C' }]);
      setTerminalInput('');
    }
  };

  // Handle terminal resize
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight >= 100 && newHeight <= 600) {
          setTerminalHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Sync AI-generated files to backend workspace
  const syncAIFilesToBackend = async (node, parentPath = '') => {
    try {
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      if (node.type === 'folder') {
        // Create directory
        await fetch(`${BACKEND_URL}/api/createDir`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dirPath: currentPath })
        });
        
        // Recursively sync children
        if (node.children) {
          for (const child of node.children) {
            await syncAIFilesToBackend(child, currentPath);
          }
        }
      } else if (node.type === 'file') {
        // Write file
        await fetch(`${BACKEND_URL}/api/writeFile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            filePath: currentPath,
            content: node.content || ''
          })
        });
      }
    } catch (error) {
      console.error('Error syncing file:', node.name, error);
    }
  };

  // Update file system when generatedFiles prop changes
  useEffect(() => {
    if (generatedFiles) {
      console.log('Loading AI-generated files...');
      setFileSystem(generatedFiles);
      const expandAll = (node, path = '') => {
        const currentPath = path ? `${path}/${node.name}` : node.name;
        const paths = [currentPath];
        if (node.type === 'folder' && node.children) {
          node.children.forEach(child => {
            paths.push(...expandAll(child, currentPath));
          });
        }
        return paths;
      };
      setExpandedFolders(new Set(expandAll(generatedFiles)));
      
      setTerminalOutput(prev => [...prev, { 
        type: 'info', 
        text: '📦 Syncing AI-generated files to workspace...' 
      }]);
      
      // Sync AI files to backend
      syncAIFilesToBackend(generatedFiles).then(() => {
        setTerminalOutput(prev => [...prev, { 
          type: 'success', 
          text: '✅ AI project synced to workspace! You can now use terminal commands.' 
        }]);
      }).catch(err => {
        setTerminalOutput(prev => [...prev, { 
          type: 'error', 
          text: `❌ Failed to sync: ${err.message}` 
        }]);
      });
    }
  }, [generatedFiles]);

  // Toggle folder expansion
  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Add new file or folder
  const addNewItem = (parentPath) => {
    if (!newItemName.trim()) return;

    const pathParts = parentPath.split('/').filter(Boolean);
    const newFS = JSON.parse(JSON.stringify(fileSystem));
    
    let parent = newFS;
    for (const part of pathParts) {
      parent = parent.children.find(c => c.name === part);
    }

    if (!parent.children) parent.children = [];
    
    const newItem = {
      name: newItemName,
      type: newItemType,
      ...(newItemType === 'folder' ? { children: [] } : { content: '' })
    };

    parent.children.push(newItem);
    setFileSystem(newFS);
    setShowNewFileInput(null);
    setNewItemName('');
    
    if (newItemType === 'folder') {
      setExpandedFolders(prev => new Set([...prev, `${parentPath}/${newItemName}`]));
    }
  };

  // Open file in editor
  const openFile = (path, node) => {
    if (node.type !== 'file') return;
    
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path]);
    }
    setActiveTab(path);
    setSelectedFile(path);
    
    if (!fileContents[path]) {
      setFileContents(prev => ({
        ...prev,
        [path]: node.content || ''
      }));
    }
  };

  // Close tab
  const closeTab = (path, e) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== path);
    setOpenTabs(newTabs);
    
    if (activeTab === path) {
      setActiveTab(newTabs[newTabs.length - 1] || null);
    }
  };

  // Update file content
  const updateFileContent = (content) => {
    if (activeTab) {
      setFileContents(prev => ({
        ...prev,
        [activeTab]: content
      }));
    }
  };

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);
    
    monaco.editor.defineTheme('vscode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF' },
        { token: 'operator', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2A2A2A',
        'editorCursor.foreground': '#AEAFAD',
        'editor.selectionBackground': '#264F78',
      }
    });
    
    monaco.editor.setTheme('vscode-dark');
  };

  // Render tree recursively
  const renderTree = (node, path = '') => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders.has(currentPath);
    const isSelected = selectedFile === currentPath;

    if (node.type === 'folder') {
      return (
        <div key={currentPath}>
          <div
            className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700 group ${
              isSelected ? 'bg-gray-700' : ''
            }`}
            onClick={() => toggleFolder(currentPath)}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {isExpanded ? <FolderOpen size={16} className="text-blue-400" /> : <Folder size={16} className="text-blue-400" />}
            <span className="text-sm">{node.name}</span>
            <button
              className="ml-auto opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setShowNewFileInput(currentPath);
                setNewItemType('file');
              }}
            >
              <Plus size={14} />
            </button>
          </div>
          
          {showNewFileInput === currentPath && (
            <div className="flex items-center gap-2 px-2 py-1 ml-6">
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value)}
                className="bg-gray-700 text-white text-xs px-1 py-1 rounded"
              >
                <option value="file">File</option>
                <option value="folder">Folder</option>
              </select>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addNewItem(currentPath);
                  if (e.key === 'Escape') setShowNewFileInput(null);
                }}
                placeholder="Name..."
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded flex-1"
                autoFocus
              />
              <button onClick={() => addNewItem(currentPath)} className="text-green-400">
                <Save size={14} />
              </button>
              <button onClick={() => setShowNewFileInput(null)} className="text-red-400">
                <X size={14} />
              </button>
            </div>
          )}
          
          {isExpanded && node.children && (
            <div className="ml-4">
              {node.children.map(child => renderTree(child, currentPath))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={currentPath}
        className={`flex items-center gap-1 px-2 py-1 ml-6 cursor-pointer hover:bg-gray-700 ${
          isSelected ? 'bg-gray-700' : ''
        }`}
        onClick={() => openFile(currentPath, node)}
      >
        <File size={16} className="text-gray-400" />
        <span className="text-sm">{node.name}</span>
      </div>
    );
  };

  const currentFileName = activeTab ? activeTab.split('/').pop() : '';
  const currentLanguage = activeTab ? getLanguageFromFileName(currentFileName) : 'plaintext';

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar - File Explorer */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
        <div className="p-2 border-b border-gray-700 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-gray-400">Explorer</span>
          <button
            onClick={() => {
              setShowNewFileInput('project-root');
              setNewItemType('file');
            }}
            className="hover:bg-gray-700 p-1 rounded"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="py-2">
          {renderTree(fileSystem)}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        {openTabs.length > 0 && (
          <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
            {openTabs.map(tab => (
              <div
                key={tab}
                className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer ${
                  activeTab === tab ? 'bg-gray-900' : 'hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                <File size={14} />
                <span className="text-sm">{tab.split('/').pop()}</span>
                <button
                  onClick={(e) => closeTab(tab, e)}
                  className="hover:bg-gray-600 rounded p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden" style={{ height: showTerminal ? `calc(100% - ${terminalHeight}px)` : '100%' }}>
          {activeTab ? (
            <Editor
              height="100%"
              language={currentLanguage}
              value={fileContents[activeTab] || ''}
              onChange={updateFileContent}
              onMount={handleEditorDidMount}
              theme="vscode-dark"
              loading={<div className="flex items-center justify-center h-full">Loading editor...</div>}
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
                folding: true,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                bracketPairColorization: {
                  enabled: true
                },
                guides: {
                  bracketPairs: true,
                  indentation: true
                },
                suggest: {
                  snippetsPreventQuickSuggestions: false
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <File size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a file to start editing</p>
              </div>
            </div>
          )}
        </div>

        {/* Terminal */}
        {showTerminal && (
          <>
            <div
              className="h-1 bg-gray-700 cursor-row-resize hover:bg-blue-500 transition-colors"
              onMouseDown={handleMouseDown}
            />
            <div className="bg-gray-900 border-t border-gray-700 flex flex-col" style={{ height: `${terminalHeight}px` }}>
              <div className="flex items-center justify-between px-3 py-1 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <TerminalIcon size={14} />
                  <span className="text-xs font-semibold">Terminal</span>
                  <span className="text-xs text-gray-400">{currentDirectory}</span>
                </div>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="hover:bg-gray-700 p-1 rounded"
                >
                  <X size={14} />
                </button>
              </div>
              <div
                ref={terminalOutputRef}
                className="flex-1 overflow-y-auto px-3 py-2 font-mono text-sm text-left"
              >
                {terminalOutput.map((line, idx) => (
                  <div
                    key={idx}
                    className={`text-left whitespace-pre-wrap break-words ${
                      line.type === 'error' ? 'text-red-400' :
                      line.type === 'command' ? 'text-green-400' :
                      line.type === 'info' ? 'text-blue-400' :
                      line.type === 'success' ? 'text-green-300' :
                      'text-gray-300'
                    }`}
                  >
                    {line.text}
                  </div>
                ))}
                {isExecuting && (
                  <div className="text-yellow-400 text-left">Executing...</div>
                )}
              </div>
              <div className="flex items-center px-3 py-2 bg-gray-800 border-t border-gray-700">
                <span className="text-green-400 mr-2">$</span>
                <input
                  ref={terminalInputRef}
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  className="flex-1 bg-transparent outline-none text-sm font-mono"
                  placeholder="Type a command..."
                  disabled={isExecuting}
                  autoFocus
                />
              </div>
            </div>
          </>
        )}

        {/* Terminal Toggle Button */}
        {!showTerminal && (
          <button
            onClick={() => setShowTerminal(true)}
            className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
            title="Open Terminal"
          >
            <TerminalIcon size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default VSCodeFileExplorer;