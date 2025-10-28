// Complete Documentation Viewer Component
import React, { useState } from 'react';
import { FileText, Download, Search, BookOpen, Code, GitBranch, Settings } from 'lucide-react';

const DocumentationViewer = ({ documentation, onClose, projectName }) => {
  const [activeDoc, setActiveDoc] = useState('readme');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  if (!documentation) return null;

  // Search within documentation
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    Object.entries(documentation).forEach(([docType, content]) => {
      if (content && typeof content === 'string') {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              type: docType,
              line: idx + 1,
              content: line.trim(),
              preview: lines.slice(Math.max(0, idx - 1), Math.min(lines.length, idx + 2)).join('\n')
            });
          }
        });
      }
    });
    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  };

  // Export documentation as markdown files
  const handleExport = () => {
    const files = [
      { name: 'README.md', content: documentation.readme },
      { name: 'API.md', content: documentation.apiDocs },
      { name: 'COMPONENTS.md', content: documentation.componentDocs },
      { name: 'SETUP.md', content: documentation.setupGuide },
      { name: 'CHANGELOG.md', content: documentation.changelog }
    ].filter(f => f.content);

    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // Simple markdown renderer (you can replace with react-markdown)
  const renderMarkdown = (content) => {
    if (!content) return <p className="text-gray-400">No content available</p>;

    return (
      <div className="markdown-content text-gray-300 leading-relaxed">
        {content.split('\n').map((line, idx) => {
          // Headers
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-3xl font-bold mb-4 mt-6 text-white">{line.slice(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-2xl font-bold mb-3 mt-5 text-white">{line.slice(3)}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-xl font-semibold mb-2 mt-4 text-gray-200">{line.slice(4)}</h3>;
          }
          if (line.startsWith('#### ')) {
            return <h4 key={idx} className="text-lg font-semibold mb-2 mt-3 text-gray-200">{line.slice(5)}</h4>;
          }

          // Code blocks
          if (line.startsWith('```')) {
            return <div key={idx} className="bg-gray-900 p-4 rounded-lg my-3 border border-gray-700 font-mono text-sm overflow-x-auto"></div>;
          }

          // Lists
          if (line.match(/^[\-\*]\s/)) {
            return (
              <li key={idx} className="ml-6 mb-1 list-disc">
                {line.slice(2)}
              </li>
            );
          }
          if (line.match(/^\d+\.\s/)) {
            return (
              <li key={idx} className="ml-6 mb-1 list-decimal">
                {line.replace(/^\d+\.\s/, '')}
              </li>
            );
          }

          // Inline code
          const withInlineCode = line.replace(/`([^`]+)`/g, 
            '<code class="bg-gray-700 px-2 py-0.5 rounded text-purple-400 text-sm font-mono">$1</code>'
          );

          // Bold
          const withBold = withInlineCode.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

          // Links
          const withLinks = withBold.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
            '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>'
          );

          // Empty lines
          if (!line.trim()) {
            return <div key={idx} className="h-4"></div>;
          }

          // Regular paragraphs
          return (
            <p 
              key={idx} 
              className="mb-3" 
              dangerouslySetInnerHTML={{ __html: withLinks }}
            />
          );
        })}
      </div>
    );
  };

  const docCategories = [
    { id: 'readme', label: 'README', icon: BookOpen, available: !!documentation.readme },
    { id: 'api', label: 'API Docs', icon: Code, available: !!documentation.apiDocs },
    { id: 'components', label: 'Components', icon: GitBranch, available: !!documentation.componentDocs },
    { id: 'setup', label: 'Setup Guide', icon: Settings, available: !!documentation.setupGuide },
    { id: 'changelog', label: 'Changelog', icon: FileText, available: !!documentation.changelog }
  ];

  const currentDoc = {
    readme: documentation.readme,
    api: documentation.apiDocs,
    components: documentation.componentDocs,
    setup: documentation.setupGuide,
    changelog: documentation.changelog
  }[activeDoc];

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold text-white">{projectName} - Documentation</h1>
              <p className="text-sm text-gray-400">Auto-generated project documentation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto z-10">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveDoc(result.type);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="p-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                    >
                      <div className="text-xs text-purple-400 mb-1">
                        {result.type.toUpperCase()} - Line {result.line}
                      </div>
                      <div className="text-sm text-white font-mono truncate">
                        {result.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Documentation</h3>
            <div className="space-y-1">
              {docCategories.map(category => {
                const Icon = category.icon;
                return category.available ? (
                  <button
                    key={category.id}
                    onClick={() => setActiveDoc(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeDoc === category.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                ) : null;
              })}
            </div>
          </div>

          {/* Documentation Stats */}
          <div className="p-4 border-t border-gray-700">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Total Docs:</span>
                <span className="font-semibold">
                  {docCategories.filter(c => c.available).length}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Words:</span>
                <span className="font-semibold">
                  {Object.values(documentation).filter(Boolean).join(' ').split(/\s+/).length}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Lines:</span>
                <span className="font-semibold">
                  {Object.values(documentation).filter(Boolean).join('\n').split('\n').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {renderMarkdown(currentDoc)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationViewer;