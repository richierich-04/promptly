import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, X, Save, Terminal as TerminalIcon, Play, RefreshCw, ExternalLink, Monitor, Code, Box } from 'lucide-react';
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
  const [openTabs, setOpenTabs] = useState(['preview']);
  const [activeTab, setActiveTab] = useState('preview');
  const [fileContents, setFileContents] = useState({});
  const [showNewFileInput, setShowNewFileInput] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('file');
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [terminalOutput, setTerminalOutput] = useState([
    { type: 'info', text: '🚀 Terminal Connected with StackBlitz Preview!' },
    { type: 'info', text: 'Preview will open in StackBlitz WebContainer' },
    { type: 'info', text: 'Type "help" for available commands' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState('.');
  const [isExecuting, setIsExecuting] = useState(false);
  const [stackblitzVM, setStackblitzVM] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [devServerUrl, setDevServerUrl] = useState('');
  
  const editorRef = useRef(null);
  const terminalInputRef = useRef(null);
  const terminalOutputRef = useRef(null);
  const previewContainerRef = useRef(null);
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
          text: 'Backend is optional. StackBlitz preview will still work!'
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

  // Collect all files for StackBlitz
  const collectAllFiles = (node, path = '', files = {}) => {
    if (node.type === 'file') {
      const fullPath = path ? `${path}/${node.name}` : node.name;
      files[fullPath] = node.content || '';
    }
    
    if (node.type === 'folder' && node.children) {
      for (const child of node.children) {
        const currentPath = path ? `${path}/${node.name}` : node.name;
        collectAllFiles(child, currentPath, files);
      }
    }
    
    return files;
  };

  // Detect project type and template
  const detectProjectType = (files) => {
    const fileNames = Object.keys(files);
    const hasReact = fileNames.some(f => f.endsWith('.jsx') || f.endsWith('.tsx')) || 
                     JSON.stringify(files).includes('react');
    const hasVue = fileNames.some(f => f.endsWith('.vue'));
    const hasAngular = fileNames.some(f => f.includes('angular'));
    const hasTypeScript = fileNames.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));

    // StackBlitz valid templates: node, javascript, typescript, angular-cli, create-react-app, html, polymer, vue
    if (hasAngular) return 'angular-cli';
    if (hasVue) return 'vue';
    if (hasReact && hasTypeScript) return 'create-react-app';
    if (hasReact) return 'create-react-app';
    if (hasTypeScript) return 'typescript';
    
    return 'javascript'; // default - works for HTML/CSS/JS
  };

  // Ensure package.json exists with proper dependencies
  const ensurePackageJson = (files, template) => {
    let packageJson = {};
    
    if (files['package.json']) {
      try {
        packageJson = JSON.parse(files['package.json']);
      } catch (e) {
        console.warn('Invalid package.json, creating new one');
      }
    }

    // Set default values based on template
    const defaults = {
      name: 'stackblitz-project',
      version: '1.0.0',
      description: 'Generated project',
      main: 'index.js',
      scripts: packageJson.scripts || {},
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {}
    };

    // Add template-specific dependencies
    if (template.includes('react')) {
      defaults.dependencies.react = '^18.2.0';
      defaults.dependencies['react-dom'] = '^18.2.0';
      
      if (template.includes('vite') || Object.keys(files).some(f => f.includes('vite'))) {
        defaults.scripts.dev = 'vite';
        defaults.scripts.build = 'vite build';
        defaults.scripts.preview = 'vite preview';
        defaults.devDependencies.vite = '^5.0.0';
        defaults.devDependencies['@vitejs/plugin-react'] = '^4.2.0';
      } else {
        defaults.scripts.start = 'react-scripts start';
        defaults.scripts.build = 'react-scripts build';
      }
    }

    if (template === 'vue') {
      defaults.dependencies.vue = '^3.3.0';
      defaults.scripts.dev = 'vite';
      defaults.devDependencies.vite = '^5.0.0';
      defaults.devDependencies['@vitejs/plugin-vue'] = '^5.0.0';
    }

    files['package.json'] = JSON.stringify(defaults, null, 2);
    return files;
  };

  // Ensure index.html exists
  const ensureIndexHtml = (files, template) => {
    if (files['index.html'] || files['public/index.html']) {
      return files;
    }

    // Create index.html based on template
    let html = '';
    
    if (template.includes('react')) {
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;
    } else {
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`;
    }

    files['index.html'] = html;
    return files;
  };

  // Open project in StackBlitz
  const openInStackBlitz = async () => {
    setIsLoadingPreview(true);
    setTerminalOutput(prev => [...prev, { 
      type: 'info', 
      text: '🚀 Opening preview in StackBlitz...' 
    }]);

    try {
      // Dynamically load StackBlitz SDK
      if (!window.StackBlitzSDK) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@stackblitz/sdk@1/bundles/sdk.umd.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        
        setTerminalOutput(prev => [...prev, { 
          type: 'success', 
          text: '✅ StackBlitz SDK loaded' 
        }]);
      }

      const sdk = window.StackBlitzSDK;

      // Collect all files
      let files = collectAllFiles(fileSystem);
      
      // Detect project type
      const template = detectProjectType(files);
      setTerminalOutput(prev => [...prev, { 
        type: 'info', 
        text: `📦 Detected project type: ${template}` 
      }]);

      // Ensure necessary files exist
      files = ensurePackageJson(files, template);
      files = ensureIndexHtml(files, template);

      setTerminalOutput(prev => [...prev, { 
        type: 'info', 
        text: `📄 Prepared ${Object.keys(files).length} files` 
      }]);

      // Prepare StackBlitz project
      const project = {
        title: 'AI Generated Project',
        description: 'Generated with AI',
        template: template,
        files: files,
        settings: {
          compile: {
            trigger: 'auto',
            clearConsole: false
          }
        }
      };

      // Clear preview container
      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = '';
      }

      setTerminalOutput(prev => [...prev, { 
        type: 'info', 
        text: '⚡ Embedding StackBlitz...' 
      }]);

      // Embed StackBlitz
      const vm = await sdk.embedProject(
        previewContainerRef.current,
        project,
        {
          openFile: Object.keys(files)[0],
          view: 'preview',
          height: '100%',
          hideNavigation: false,
          hideDevTools: false,
          forceEmbedLayout: true,
          clickToLoad: false,
        }
      );

      setStackblitzVM(vm);
      setPreviewReady(true);
      setIsLoadingPreview(false);

      setTerminalOutput(prev => [...prev, { 
        type: 'success', 
        text: '✅ StackBlitz preview loaded successfully!' 
      }, {
        type: 'info',
        text: '💡 Your app is now running in a real WebContainer'
      }]);

    } catch (error) {
      console.error('StackBlitz error:', error);
      setIsLoadingPreview(false);
      setTerminalOutput(prev => [...prev, { 
        type: 'error', 
        text: `❌ StackBlitz failed: ${error.message}` 
      }, {
        type: 'info',
        text: '💡 Falling back to simple iframe preview...'
      }]);
      
      // Fallback to simple preview
      generateSimplePreview();
    }
  };

  // Generate simple iframe preview as fallback
  const generateSimplePreview = () => {
    const allFiles = collectAllFiles(fileSystem);
    const entryPoint = findEntryPoint(fileSystem);

    if (!entryPoint) {
      const previewHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px;">
          <h1 style="font-size: 48px; margin-bottom: 20px;">🚀 Project Generated!</h1>
          <p style="font-size: 20px; margin-bottom: 30px;">Your project files are ready</p>
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; backdrop-filter: blur(10px);">
            <p style="margin: 10px 0;">📁 ${Object.keys(allFiles).length} files generated</p>
            <p style="margin: 10px 0;">💡 Click "Open Preview" above to see it in StackBlitz</p>
          </div>
        </div>
      `;
      
      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = `<iframe style="width:100%;height:100%;border:0" srcdoc="${previewHtml.replace(/"/g, '&quot;')}"></iframe>`;
      }
      return;
    }

    // Generate preview based on file type
    let previewHtml = '';
    
    if (entryPoint.type === 'html') {
      let html = entryPoint.file.content || '';
      
      // Inject CSS files
      Object.keys(allFiles).forEach(filePath => {
        if (filePath.endsWith('.css')) {
          const styleTag = `<style>\n${allFiles[filePath]}\n</style>`;
          html = html.replace('</head>', `${styleTag}\n</head>`);
        }
      });
      
      // Inject JS files
      Object.keys(allFiles).forEach(filePath => {
        if (filePath.endsWith('.js') && !filePath.includes('node_modules')) {
          const scriptTag = `<script>\n${allFiles[filePath]}\n</script>`;
          html = html.replace('</body>', `${scriptTag}\n</body>`);
        }
      });
      
      previewHtml = html;
    } else if (entryPoint.type === 'react') {
      previewHtml = generateReactPreview(allFiles);
    }

    if (previewContainerRef.current) {
      previewContainerRef.current.innerHTML = `<iframe style="width:100%;height:100%;border:0" srcdoc="${previewHtml.replace(/"/g, '&quot;')}"></iframe>`;
    }
    
    setPreviewReady(true);
    setTerminalOutput(prev => [...prev, { 
      type: 'success', 
      text: '✅ Simple preview loaded' 
    }]);
  };

  // Find entry point file
  const findEntryPoint = (node, path = '') => {
    if (node.type === 'file') {
      const fileName = node.name.toLowerCase();
      const fullPath = path ? `${path}/${node.name}` : node.name;
      
      if (fileName === 'index.html') return { file: node, path: fullPath, type: 'html' };
      if (fileName === 'app.jsx' || fileName === 'app.tsx' || fileName === 'app.js') 
        return { file: node, path: fullPath, type: 'react' };
      if (fileName === 'main.jsx' || fileName === 'main.tsx') 
        return { file: node, path: fullPath, type: 'react' };
    }
    
    if (node.type === 'folder' && node.children) {
      for (const child of node.children) {
        const currentPath = path ? `${path}/${node.name}` : node.name;
        const result = findEntryPoint(child, currentPath);
        if (result) return result;
      }
    }
    
    return null;
  };

  // Generate React preview for fallback
  const generateReactPreview = (allFiles) => {
    const jsxFiles = Object.keys(allFiles)
      .filter(path => 
        (path.endsWith('.jsx') || path.endsWith('.js')) &&
        !path.includes('node_modules')
      );

    let allCode = '';
    jsxFiles.forEach(filePath => {
      const code = allFiles[filePath];
      const cleanCode = code
        .split('\n')
        .filter(line => !line.trim().startsWith('import ') && !line.trim().startsWith('export default'))
        .join('\n');
      allCode += cleanCode + '\n\n';
    });

    const cssFiles = Object.keys(allFiles).filter(path => path.endsWith('.css'));
    const styles = cssFiles.map(path => allFiles[path]).join('\n\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      margin: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    #root { min-height: 100vh; }
    ${styles}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    
    ${allCode}
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    
    try {
      if (typeof App !== 'undefined') {
        root.render(<App />);
      } else {
        const possibleComponents = ['Calculator', 'TodoApp', 'Counter', 'Main'];
        let rendered = false;
        
        for (const compName of possibleComponents) {
          if (typeof window[compName] !== 'undefined') {
            const Component = window[compName];
            root.render(<Component />);
            rendered = true;
            break;
          }
        }
        
        if (!rendered) {
          root.render(
            <div style={{padding: '40px', textAlign: 'center'}}>
              <h1>✅ React App Ready</h1>
              <p>Export your component as "App" or one of: Calculator, TodoApp, Counter</p>
            </div>
          );
        }
      }
    } catch (error) {
      root.render(
        <div style={{padding: '40px', color: 'red'}}>
          <h2>Error</h2>
          <pre>{error.toString()}</pre>
        </div>
      );
    }
  </script>
</body>
</html>`;
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
          { type: 'output', text: '  preview    - Open StackBlitz preview' },
        ]);
        break;

      case 'preview':
        await openInStackBlitz();
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
      
      setActiveTab('preview');
      setOpenTabs(['preview']);
      
      setTerminalOutput(prev => [...prev, { 
        type: 'info', 
        text: '📦 AI-generated files loaded!' 
      }, {
        type: 'success',
        text: '✅ Opening preview automatically...'
      }]);
      
      // Sync to backend (optional)
      syncAIFilesToBackend(generatedFiles).catch(err => {
        console.warn('Backend sync failed:', err);
      });

      // Auto-open StackBlitz preview
      setTimeout(() => {
        openInStackBlitz();
      }, 1000);
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
  };

  // Update file content
  const updateFileContent = (content) => {
    if (activeTab && activeTab !== 'preview') {
      setFileContents(prev => ({
        ...prev,
        [activeTab]: content
      }));
      
      // Update in StackBlitz if available
      if (stackblitzVM && previewReady) {
        try {
          stackblitzVM.applyFsDiff({
            create: {
              [activeTab]: content
            }
          });
        } catch (error) {
          console.warn('Could not update StackBlitz:', error);
        }
      }
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
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
      }
    });
    
    monaco.editor.setTheme('vscode-dark');
  };

  // Render tree
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

  const currentFileName = activeTab && activeTab !== 'preview' ? activeTab.split('/').pop() : '';
  const currentLanguage = activeTab && activeTab !== 'preview' ? getLanguageFromFileName(currentFileName) : 'plaintext';

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
          {/* Preview Tab */}
          <div
            className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer ${
              activeTab === 'preview' ? 'bg-gray-900' : 'hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('preview')}
          >
            <Box size={14} className="text-orange-400" />
            <span className="text-sm">StackBlitz Preview</span>
            {previewReady && (
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Live"></span>
            )}
          </div>

          {/* File Tabs */}
          {openTabs.filter(tab => tab !== 'preview').map(tab => (
            <div
              key={tab}
              className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer ${
                activeTab === tab ? 'bg-gray-900' : 'hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              <Code size={14} />
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

        {/* Content Area */}
        <div className="flex-1 overflow-hidden" style={{ height: showTerminal ? `calc(100% - ${terminalHeight}px)` : '100%' }}>
          {activeTab === 'preview' ? (
            // StackBlitz Preview Panel
            <div className="h-full flex flex-col bg-gray-800">
              {/* Preview Controls */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <Box size={16} className="text-orange-400" />
                  <span className="text-sm font-semibold">
                    {previewReady ? '🟢 StackBlitz WebContainer Running' : '⚪ Preview'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!previewReady && !isLoadingPreview && (
                    <button
                      onClick={openInStackBlitz}
                      className="bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded flex items-center gap-2 text-sm"
                    >
                      <Play size={14} />
                      Open Preview
                    </button>
                  )}
                  {isLoadingPreview && (
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                      Loading...
                    </div>
                  )}
                  {previewReady && (
                    <button
                      onClick={openInStackBlitz}
                      className="hover:bg-gray-700 p-1.5 rounded flex items-center gap-1"
                      title="Reload Preview"
                    >
                      <RefreshCw size={14} />
                      <span className="text-xs">Reload</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-hidden relative">
                {!previewReady && !isLoadingPreview ? (
                  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                    <Box size={64} className="text-orange-400 mb-6 animate-bounce" />
                    <h2 className="text-2xl font-bold mb-4">StackBlitz WebContainer Preview</h2>
                    <p className="text-gray-400 mb-6 text-center max-w-md">
                      Click "Open Preview" to see your project running in a full Node.js environment
                    </p>
                    <button
                      onClick={openInStackBlitz}
                      className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-all hover:scale-105"
                    >
                      <Play size={20} />
                      Open Preview
                    </button>
                    <div className="mt-8 text-sm text-gray-500">
                      <p>✨ Supports: React, Vue, Angular, Node.js, and more</p>
                      <p>⚡ Runs actual dev servers with hot reload</p>
                      <p>🔧 Full npm package support</p>
                    </div>
                  </div>
                ) : (
                  <div 
                    ref={previewContainerRef} 
                    className="w-full h-full"
                    style={{ minHeight: '100%' }}
                  />
                )}
              </div>
            </div>
          ) : activeTab ? (
            // Monaco Editor
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
                  placeholder="Type 'preview' to open StackBlitz..."
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
  );
};

export default VSCodeFileExplorer;