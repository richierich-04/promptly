import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, X, Save } from 'lucide-react';
import Editor, { loader } from '@monaco-editor/react';

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
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Configure Monaco loader
  useEffect(() => {
    loader.config({ 
      paths: { 
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' 
      } 
    });
  }, []);

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

  // Update file system when generatedFiles prop changes
  useEffect(() => {
    if (generatedFiles) {
      setFileSystem(generatedFiles);
      // Auto-expand all folders
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
    
    // Define custom VS Code Dark+ theme
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
        <div className="flex-1 overflow-hidden">
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
      </div>
    </div>
  );
};

export default VSCodeFileExplorer;