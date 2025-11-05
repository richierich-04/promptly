// COMPLETE VSCodeFileExplorer.jsx with Live Preview Integration
// Copy this entire file to replace your current src/components/VSCodeFileExplorer.jsx

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, X, Save, Terminal as TerminalIcon, RefreshCw, AlertCircle, Code, Eye, Columns } from 'lucide-react';
import Editor, { loader } from '@monaco-editor/react';
import LivePreview from './LivePreview';

const BACKEND_URL = 'http://localhost:5001';

const VSCodeFileExplorer = ({ generatedFiles }) => {
  // All state declarations
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
    { type: 'info', text: '🚀 Terminal Ready!' },
    { type: 'info', text: 'Real-time error detection enabled ✨' },
    { type: 'info', text: 'Type "help" for available commands' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState('.');
  const [isExecuting, setIsExecuting] = useState(false);
  const [fileErrors, setFileErrors] = useState({});
  const [currentErrors, setCurrentErrors] = useState([]);
  const [currentView, setCurrentView] = useState('editor'); // 'editor', 'preview', 'split'
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const terminalInputRef = useRef(null);
  const terminalOutputRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sessionId = useRef(Date.now().toString());
  const validationTimeoutRef = useRef(null);

  // Configure Monaco loader
  useEffect(() => {
    loader.config({
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
      }
    });    
  }, []);

  // Check backend connection
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        
        if (response.ok) {
          setTerminalOutput(prev => [...prev, { 
            type: 'success', 
            text: `✅ Backend connected at ${BACKEND_URL}` 
          }]);
          
          if (!generatedFiles) {
            await refreshFileSystem();
          }
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        setTerminalOutput(prev => [...prev, { 
          type: 'error', 
          text: `❌ Cannot connect to backend at ${BACKEND_URL}` 
        }, {
          type: 'info',
          text: 'Start the backend server to enable full functionality'
        }]);
      }
    };
    
    setTimeout(checkBackend, 1000);
  }, [generatedFiles]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Get language from file extension
  const getLanguageFromFileName = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'json': 'json', 'html': 'html', 'css': 'css', 'scss': 'scss', 'py': 'python',
      'java': 'java', 'cpp': 'cpp', 'c': 'c', 'md': 'markdown', 'xml': 'xml',
      'yaml': 'yaml', 'yml': 'yaml', 'sh': 'shell', 'sql': 'sql', 'php': 'php',
      'go': 'go', 'rs': 'rust', 'rb': 'ruby', 'swift': 'swift', 'kt': 'kotlin',
    };
    return languageMap[ext] || 'plaintext';
  };

  // Validate JavaScript/TypeScript code
  const validateCode = (code, language, filePath) => {
    if (!monacoRef.current || !editorRef.current) return;

    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers = [];
    const errors = [];

    if (!['javascript', 'typescript'].includes(language)) {
      monaco.editor.setModelMarkers(model, 'syntax', []);
      setCurrentErrors([]);
      setFileErrors(prev => ({ ...prev, [filePath]: [] }));
      return;
    }

    try {
      const lines = code.split('\n');
      
      let openBraces = 0;
      let openParens = 0;
      let openBrackets = 0;
      let inString = false;
      let inMultilineComment = false;
      let stringChar = null;
      
      lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        
        if (trimmed.includes('/*')) inMultilineComment = true;
        if (trimmed.includes('*/')) inMultilineComment = false;
        
        if (inMultilineComment || trimmed.startsWith('//') || !trimmed) return;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const prevChar = i > 0 ? line[i - 1] : '';
          const nextChar = i < line.length - 1 ? line[i + 1] : '';
          
          if (char === '/' && nextChar === '/' && !inString) break;
          
          if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
              stringChar = null;
            }
          }
          
          if (!inString) {
            if (char === '{') openBraces++;
            if (char === '}') {
              openBraces--;
              if (openBraces < 0) {
                markers.push({
                  severity: monaco.MarkerSeverity.Error,
                  startLineNumber: lineIndex + 1,
                  startColumn: i + 1,
                  endLineNumber: lineIndex + 1,
                  endColumn: i + 2,
                  message: 'Unexpected closing brace }',
                });
                errors.push(`Line ${lineIndex + 1}: Unexpected closing brace }`);
                openBraces = 0;
              }
            }
            
            if (char === '(') openParens++;
            if (char === ')') {
              openParens--;
              if (openParens < 0) {
                markers.push({
                  severity: monaco.MarkerSeverity.Error,
                  startLineNumber: lineIndex + 1,
                  startColumn: i + 1,
                  endLineNumber: lineIndex + 1,
                  endColumn: i + 2,
                  message: 'Unexpected closing parenthesis )',
                });
                errors.push(`Line ${lineIndex + 1}: Unexpected closing parenthesis )`);
                openParens = 0;
              }
            }
            
            if (char === '[') openBrackets++;
            if (char === ']') {
              openBrackets--;
              if (openBrackets < 0) {
                markers.push({
                  severity: monaco.MarkerSeverity.Error,
                  startLineNumber: lineIndex + 1,
                  startColumn: i + 1,
                  endLineNumber: lineIndex + 1,
                  endColumn: i + 2,
                  message: 'Unexpected closing bracket ]',
                });
                errors.push(`Line ${lineIndex + 1}: Unexpected closing bracket ]`);
                openBrackets = 0;
              }
            }
          }
        }
        
        if (!inString && trimmed.includes('console.log')) {
          const consoleIndex = line.indexOf('console.log');
          markers.push({
            severity: monaco.MarkerSeverity.Info,
            startLineNumber: lineIndex + 1,
            startColumn: consoleIndex + 1,
            endLineNumber: lineIndex + 1,
            endColumn: consoleIndex + 12,
            message: 'console.log statement',
          });
        }
      });
      
      if (openBraces > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: lines.length,
          startColumn: 1,
          endLineNumber: lines.length,
          endColumn: lines[lines.length - 1].length + 1,
          message: `Missing ${openBraces} closing brace${openBraces > 1 ? 's' : ''} }`,
        });
        errors.push(`Missing ${openBraces} closing brace${openBraces > 1 ? 's' : ''} }`);
      }
      
      if (openParens > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: lines.length,
          startColumn: 1,
          endLineNumber: lines.length,
          endColumn: lines[lines.length - 1].length + 1,
          message: `Missing ${openParens} closing parenthesis${openParens > 1 ? 'es' : ''} )`,
        });
        errors.push(`Missing ${openParens} closing parenthesis${openParens > 1 ? 'es' : ''} )`);
      }
      
      if (openBrackets > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: lines.length,
          startColumn: 1,
          endLineNumber: lines.length,
          endColumn: lines[lines.length - 1].length + 1,
          message: `Missing ${openBrackets} closing bracket${openBrackets > 1 ? 's' : ''} ]`,
        });
        errors.push(`Missing ${openBrackets} closing bracket${openBrackets > 1 ? 's' : ''} ]`);
      }
      
      if (inString) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: lines.length,
          startColumn: 1,
          endLineNumber: lines.length,
          endColumn: lines[lines.length - 1].length + 1,
          message: 'Unterminated string literal',
        });
        errors.push('Unterminated string literal');
      }
      
    } catch (err) {
      console.error('Validation error:', err);
    }

    monaco.editor.setModelMarkers(model, 'syntax', markers);
    setCurrentErrors(errors);
    setFileErrors(prev => ({ ...prev, [filePath]: errors }));
    
    if (errors.length > 0 && filePath === activeTab) {
      setTerminalOutput(prev => {
        const filtered = prev.filter(item => !item.text.startsWith('❌ Error in') && !item.text.startsWith('✅ No syntax errors'));
        return [...filtered, { 
          type: 'error', 
          text: `❌ Error in ${filePath.split('/').pop()}: Found ${errors.length} error${errors.length > 1 ? 's' : ''}` 
        }];
      });
    } else if (errors.length === 0 && filePath === activeTab) {
      setTerminalOutput(prev => {
        const filtered = prev.filter(item => !item.text.startsWith('❌ Error in') && !item.text.startsWith('✅ No syntax errors'));
        return [...filtered, { 
          type: 'success', 
          text: `✅ No syntax errors in ${filePath.split('/').pop()}` 
        }];
      });
    }
  };

  // Handle editor content change
  const handleEditorChange = (value) => {
    if (activeTab) {
      setFileContents(prev => ({
        ...prev,
        [activeTab]: value
      }));
      
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      validationTimeoutRef.current = setTimeout(() => {
        const fileName = activeTab.split('/').pop();
        const language = getLanguageFromFileName(fileName);
        validateCode(value, language, activeTab);
        
        // Update file system with new content
        const updateFileContent = (node, path = '') => {
          const currentPath = path ? `${path}/${node.name}` : node.name;
          
          if (currentPath === activeTab && node.type === 'file') {
            return { ...node, content: value };
          }
          
          if (node.type === 'folder' && node.children) {
            return {
              ...node,
              children: node.children.map(child => updateFileContent(child, currentPath))
            };
          }
          
          return node;
        };
        
        setFileSystem(prevFS => updateFileContent(prevFS));
      }, 500);
    }
  };

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);
    
    monaco.editor.defineTheme('vscode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorError.foreground': '#F48771',
        'editorWarning.foreground': '#CCA700',
        'editorInfo.foreground': '#75BEFF',
      }
    });
    
    monaco.editor.setTheme('vscode-dark');
    
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });
    
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
    });
    
    if (activeTab) {
      const content = fileContents[activeTab] || '';
      const fileName = activeTab.split('/').pop();
      const language = getLanguageFromFileName(fileName);
      setTimeout(() => validateCode(content, language, activeTab), 100);
    }
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
        data.output.split('\n').forEach(line => {
          if (line.trim()) {
            setTerminalOutput(prev => [...prev, { 
              type: data.success ? 'output' : 'error', 
              text: line 
            }]);
          }
        });
      }

      if (command.includes('touch') || command.includes('mkdir') || command.includes('rm')) {
        setTimeout(() => refreshFileSystem(), 500);
      }
    } catch (error) {
      setTerminalOutput(prev => [...prev, { 
        type: 'error', 
        text: `Connection error: ${error.message}` 
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
      if (!data.success || !data.files) return [];

      const children = await Promise.all(
        data.files.map(async (file) => {
          const fullPath = dirPath === '.' ? file.name : `${dirPath}/${file.name}`;
          
          if (file.isDirectory) {
            const subChildren = await buildFileTree(fullPath);
            return {
              name: file.name,
              type: 'folder',
              children: subChildren
            };
          } else {
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
      return [];
    }
  };

  // Refresh file system
  const refreshFileSystem = async () => {
    try {
      const children = await buildFileTree('.');
      
      if (children && children.length > 0) {
        setFileSystem(prevFS => {
          if (prevFS.type === 'folder') {
            return {
              ...prevFS,
              children: children
            };
          }
          return {
            name: prevFS.name || 'project-root',
            type: 'folder',
            children: children
          };
        });
      }
    } catch (error) {
      console.error('Error refreshing file system:', error);
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

    switch (command.toLowerCase()) {
      case 'help':
        setTerminalOutput(prev => [...prev, 
          { type: 'output', text: '📚 Available Commands:' },
          { type: 'output', text: '  help       - Show this help' },
          { type: 'output', text: '  clear      - Clear terminal' },
          { type: 'output', text: '  refresh    - Refresh file explorer' },
          { type: 'output', text: '  errors     - Show all syntax errors' },
          { type: 'output', text: '  cd         - Change directory' },
          { type: 'output', text: '  ls         - List files' },
          { type: 'output', text: '  pwd        - Print working directory' },
        ]);
        break;

      case 'errors':
        const totalErrors = Object.values(fileErrors).flat().length;
        if (totalErrors === 0) {
          setTerminalOutput(prev => [...prev, { 
            type: 'success', 
            text: '✅ No errors found in any files!' 
          }]);
        } else {
          setTerminalOutput(prev => [...prev, { 
            type: 'error', 
            text: `❌ Found ${totalErrors} total error${totalErrors > 1 ? 's' : ''}:` 
          }]);
          Object.entries(fileErrors).forEach(([file, errs]) => {
            if (errs.length > 0) {
              setTerminalOutput(prev => [...prev, { 
                type: 'error', 
                text: `  ${file}: ${errs.length} error${errs.length > 1 ? 's' : ''}` 
              }]);
              errs.forEach(err => {
                setTerminalOutput(prev => [...prev, { 
                  type: 'output', 
                  text: `    - ${err}` 
                }]);
              });
            }
          });
        }
        break;

      case 'refresh':
        await refreshFileSystem();
        setTerminalOutput(prev => [...prev, { 
          type: 'success', 
          text: '✅ File system refreshed' 
        }]);
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
        }
        break;

      default:
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

  // Sync AI files to backend
  const syncAIFilesToBackend = async (node, parentPath = '') => {
    try {
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      if (node.type === 'folder') {
        await fetch(`${BACKEND_URL}/api/createDir`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dirPath: currentPath })
        });
        
        if (node.children) {
          for (const child of node.children) {
            await syncAIFilesToBackend(child, currentPath);
          }
        }
      } else if (node.type === 'file') {
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

  // Load AI-generated files
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
        text: '📦 AI-generated files loaded!' 
      }, {
        type: 'success',
        text: '✅ Ready to edit your files'
      }]);
      
      syncAIFilesToBackend(generatedFiles).catch(err => {
        console.warn('Backend sync failed:', err);
      });
    }
  }, [generatedFiles]);

  // Toggle folder
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

  // Add new item
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

  // Open file
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
    
    setFileErrors(prev => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  // Render tree
  const renderTree = (node, path = '') => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders.has(currentPath);
    const isSelected = selectedFile === currentPath;
    const hasErrors = fileErrors[currentPath] && fileErrors[currentPath].length > 0;

    if (node.type === 'folder') {
      return (
        <div key={currentPath}>
          <div
            className={`vscode-folder-hover group flex items-center gap-2 px-2 py-1 cursor-pointer rounded-md border border-transparent transition-all duration-200 ${
              isSelected
                ? 'bg-purple-600/20 border-purple-500/40'
                : 'hover:bg-white/5 hover:border-white/10'
            }`}
            onClick={() => toggleFolder(currentPath)}
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-purple-400" />
            ) : (
              <ChevronRight size={16} className="text-purple-400" />
            )}
    
            {isExpanded ? (
              <FolderOpen size={16} className="text-blue-400" />
            ) : (
              <Folder size={16} className="text-blue-400" />
            )}
    
            <span className="text-sm">{node.name}</span>
    
            <button
              className="ml-auto opacity-0 group-hover:opacity-100 hover:text-green-400"
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
              {node.children.map((child) => renderTree(child, currentPath))}
            </div>
          )}
        </div>
      );
    }
    

    return (
      <div
        key={currentPath}
        className={`vscode-file-hover flex items-center gap-1 px-2 py-1 ml-6 cursor-pointer hover:bg-white/5 ${
          isSelected ? 'bg-gray-700' : ''
        }`}
        onClick={() => openFile(currentPath, node)}
      >
        <File size={16} className={hasErrors ? "text-red-400" : "text-gray-400"} />
        <span className="text-sm">{node.name}</span>
        {hasErrors && <AlertCircle size={12} className="text-red-400 ml-auto" />}
      </div>
    );
  };

  const currentFileName = activeTab ? activeTab.split('/').pop() : '';
  const currentLanguage = activeTab ? getLanguageFromFileName(currentFileName) : 'plaintext';

  return (
    <div className="flex h-screen text-white relative bg-[#080b18] overflow-hidden">
      {/* Ambient glow lights */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[400px] h-[400px] bg-purple-500/20 blur-[180px]" />
        <div className="absolute bottom-[0%] left-[10%] w-[350px] h-[350px] bg-blue-500/20 blur-[160px]" />
      </div>
  
      {/* MAIN WRAPPER (Everything else sits inside this) */}
      <div className="relative z-10 flex w-full">
        {/* Sidebar */}
        <div className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 overflow-y-auto shadow-[inset_0_0_20px_rgba(255,255,255,0.06)]">
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
            {fileSystem ? renderTree(fileSystem) : (
              <div className="text-sm text-gray-400 p-2">No files loaded</div>
            )}
          </div>
        </div>
  
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex bg-white/5 backdrop-blur-xl border-b border-white/10 overflow-x-auto">
            {openTabs.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No files open</div>
            ) : (
              openTabs.map((tab) => {
                const tabErrors = fileErrors[tab] || [];
                const hasTabErrors = tabErrors.length > 0;
  
                return (
                  <div
                    key={tab}
                    className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer ${
                      activeTab === tab
                        ? 'bg-purple-600/30 border-b-2 border-purple-400 text-white'
                        : 'hover:bg-white/10 text-gray-300'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    <File size={14} className={hasTabErrors ? 'text-red-400' : ''} />
                    <span className="text-sm">{tab.split('/').pop()}</span>
                    {hasTabErrors && <AlertCircle size={12} className="text-red-400" />}
                    <button
                      onClick={(e) => closeTab(tab, e)}
                      className="hover:bg-gray-600 rounded p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
  
          {/* View Toggle Buttons */}
<div className="flex items-center justify-between bg-gray-800 border-b border-gray-700 px-4 py-2">
  {/* Left: Editor View Toggles */}
  <div className="flex gap-2">
    <button
      onClick={() => setCurrentView('editor')}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
        currentView === 'editor'
          ? 'bg-gradient-to-r from-purple-500/40 to-cyan-500/40 text-white border border-white/20 shadow-lg shadow-purple-500/20'
          : 'bg-white/5 text-gray-300 hover:bg-white/10'
      }`}
    >
      <Code size={16} />
      <span className="text-sm">Code</span>
    </button>

    <button
      onClick={() => setCurrentView('preview')}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
        currentView === 'preview'
          ? 'bg-gradient-to-r from-purple-500/40 to-cyan-500/40 text-white border border-white/20 shadow-lg shadow-purple-500/20'
          : 'bg-white/5 text-gray-300 hover:bg-white/10'
      }`}
    >
      <Eye size={16} />
      <span className="text-sm">Preview</span>
    </button>

    <button
      onClick={() => setCurrentView('split')}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
        currentView === 'split'
          ? 'bg-gradient-to-r from-purple-500/40 to-cyan-500/40 text-white border border-white/20 shadow-lg shadow-purple-500/20'
          : 'bg-white/5 text-gray-300 hover:bg-white/10'
      }`}
    >
      <Columns size={16} />
      <span className="text-sm">Split</span>
    </button>
  </div>
</div>

{/* Content Area */}
<div
  className="flex-1 overflow-hidden"
  style={{ height: showTerminal ? `calc(100% - ${terminalHeight}px)` : '100%' }}
>
  {currentView === 'editor' && (
    activeTab ? (
      <div className="h-full flex flex-col">
        {currentErrors.length > 0 && (
          <div className="bg-red-900 bg-opacity-20 border-b border-red-700 px-4 py-2">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>
                {currentErrors.length} error
                {currentErrors.length > 1 ? 's' : ''} found
              </span>
            </div>
          </div>
        )}
        <Editor
          height="100%"
          language={currentLanguage}
          value={fileContents[activeTab] || ''}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vscode-dark"
          loading={
            <div className="flex items-center justify-center h-full">
              Loading editor...
            </div>
          }
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
          }}
        />
      </div>
    ) : (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <File size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select a file to start editing</p>
        </div>
      </div>
    )
  )}

  {currentView === 'preview' && (
    <LivePreview fileSystem={fileSystem} activeFile={activeTab} />
  )}

  {currentView === 'split' && (
    <div className="flex h-full">
      <div className="flex-1 border-r border-gray-700">
        {activeTab ? (
          <div className="h-full flex flex-col">
            {currentErrors.length > 0 && (
              <div className="bg-red-900 bg-opacity-20 border-b border-red-700 px-4 py-2">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  <span>
                    {currentErrors.length} error
                    {currentErrors.length > 1 ? 's' : ''} found
                  </span>
                </div>
              </div>
            )}
            <Editor
              height="100%"
              language={currentLanguage}
              value={fileContents[activeTab] || ''}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vscode-dark"
              loading={
                <div className="flex items-center justify-center h-full">
                  Loading editor...
                </div>
              }
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a file to edit</p>
          </div>
        )}
      </div>
      <div className="flex-1">
        <LivePreview fileSystem={fileSystem} activeFile={activeTab} />
      </div>
    </div>
  )}
</div>

{/* Terminal Section */}
{showTerminal && (
  <>
    <div
      className="h-1 bg-gray-700 cursor-row-resize hover:bg-blue-500 transition-colors"
      onMouseDown={handleMouseDown}
    />
    <div
      className="bg-[#0A0E2A]/90 backdrop-blur-xl border-t border-white/10 flex flex-col shadow-[0_0_25px_rgba(99,102,241,0.2)]"
      style={{ height: `${terminalHeight}px` }}
    >
      <div className="flex items-center justify-between px-3 py-1 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} />
          <span className="text-xs font-semibold">Terminal</span>
          <span className="text-xs text-gray-400">{currentDirectory}</span>
          {Object.values(fileErrors).flat().length > 0 && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={12} />
              {Object.values(fileErrors).flat().length} errors
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshFileSystem}
            className="hover:bg-gray-700 p-1 rounded flex items-center gap-1"
            title="Refresh Files"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowTerminal(false)}
            className="hover:bg-gray-700 p-1 rounded"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        ref={terminalOutputRef}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-sm text-left"
      >
        {terminalOutput.map((line, idx) => (
          <div
            key={idx}
            className={`text-left whitespace-pre-wrap break-words ${
              line.type === 'error'
                ? 'text-red-400'
                : line.type === 'command'
                ? 'text-green-400'
                : line.type === 'info'
                ? 'text-blue-400'
                : line.type === 'success'
                ? 'text-green-300'
                : 'text-gray-300'
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
          placeholder="Type 'help' for commands or 'errors' to see all errors..."
          disabled={isExecuting}
          autoFocus
        />
      </div>
    </div>
  </>
)}

{/* Floating Terminal Toggle */}
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
</div>
  );  
};

export default VSCodeFileExplorer;
