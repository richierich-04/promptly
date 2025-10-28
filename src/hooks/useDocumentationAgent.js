// Documentation Agent - Automatically generates and maintains project documentation
import { useState, useCallback } from 'react';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'your-gemini-api-key-here';

export const useDocumentationAgent = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentationProgress, setDocumentationProgress] = useState(null);

  // Analyze file structure and content
  const analyzeProject = useCallback((fileStructure) => {
    const analysis = {
      files: [],
      components: [],
      utilities: [],
      routes: [],
      dependencies: new Set(),
      technologies: new Set()
    };

    const traverse = (node, path = '') => {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      
      if (node.type === 'file') {
        const fileInfo = {
          name: node.name,
          path: currentPath,
          content: node.content || '',
          extension: node.name.split('.').pop(),
          size: (node.content || '').length
        };

        analysis.files.push(fileInfo);

        // Detect file types
        if (fileInfo.extension === 'jsx' || fileInfo.extension === 'js') {
          // Check if it's a React component
          if (fileInfo.content.includes('function') || fileInfo.content.includes('const') && fileInfo.content.includes('return')) {
            analysis.components.push(fileInfo);
          }
          // Check for utility functions
          if (fileInfo.content.includes('export') && !fileInfo.content.includes('default')) {
            analysis.utilities.push(fileInfo);
          }
        }

        // Detect dependencies from import statements
        const importRegex = /import .* from ['"](.*)['"];?/g;
        let match;
        while ((match = importRegex.exec(fileInfo.content)) !== null) {
          const dep = match[1];
          if (!dep.startsWith('.') && !dep.startsWith('/')) {
            analysis.dependencies.add(dep);
          }
        }

        // Detect technologies
        if (fileInfo.content.includes('React')) analysis.technologies.add('React');
        if (fileInfo.content.includes('useState') || fileInfo.content.includes('useEffect')) {
          analysis.technologies.add('React Hooks');
        }
        if (fileInfo.content.includes('express')) analysis.technologies.add('Express.js');
        if (fileInfo.content.includes('fetch') || fileInfo.content.includes('axios')) {
          analysis.technologies.add('API Integration');
        }
      }

      if (node.type === 'folder' && node.children) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    };

    traverse(fileStructure);

    return {
      ...analysis,
      dependencies: Array.from(analysis.dependencies),
      technologies: Array.from(analysis.technologies)
    };
  }, []);

  // Generate documentation using AI
  const generateDocumentation = useCallback(async (projectIdeation, fileStructure) => {
    setIsGenerating(true);
    setDocumentationProgress({ stage: 'analyzing', progress: 10 });

    try {
      // Analyze the project
      const projectAnalysis = analyzeProject(fileStructure);
      
      setDocumentationProgress({ stage: 'generating-readme', progress: 30 });

      // Generate README.md
      const readmeContent = await generateREADME(projectIdeation, projectAnalysis);
      
      setDocumentationProgress({ stage: 'generating-api-docs', progress: 50 });

      // Generate API documentation if backend exists
      const apiDocs = await generateAPIDocs(projectAnalysis);
      
      setDocumentationProgress({ stage: 'generating-component-docs', progress: 70 });

      // Generate component documentation
      const componentDocs = await generateComponentDocs(projectAnalysis);
      
      setDocumentationProgress({ stage: 'generating-setup-guide', progress: 85 });

      // Generate setup and deployment guide
      const setupGuide = await generateSetupGuide(projectIdeation, projectAnalysis);

      setDocumentationProgress({ stage: 'complete', progress: 100 });

      const documentation = {
        readme: readmeContent,
        apiDocs: apiDocs,
        componentDocs: componentDocs,
        setupGuide: setupGuide,
        changelog: generateChangelog(projectIdeation)
      };

      setIsGenerating(false);
      return documentation;

    } catch (error) {
      console.error('Documentation generation error:', error);
      setIsGenerating(false);
      setDocumentationProgress(null);
      throw error;
    }
  }, [analyzeProject]);

  // Generate README.md
  const generateREADME = async (ideation, analysis) => {
    try {
      const prompt = `Generate a professional README.md for this project:

Project Name: ${ideation.projectName}
Description: ${ideation.description}
Features: ${ideation.features.join(', ')}
Tech Stack: ${JSON.stringify(ideation.techStack)}
Technologies Used: ${analysis.technologies.join(', ')}
Dependencies: ${analysis.dependencies.join(', ')}

Create a comprehensive README with these sections:
1. Project Title and Description with badges
2. Features list
3. Tech Stack
4. Installation instructions
5. Usage examples
6. Project structure overview
7. Configuration details
8. Contributing guidelines
9. License information

Return ONLY the markdown content, no code blocks or extra formatting.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
      console.error('README generation error:', error);
      return generateFallbackREADME(ideation, analysis);
    }
  };

  // Generate API Documentation
  const generateAPIDocs = async (analysis) => {
    const backendFiles = analysis.files.filter(f => 
      f.path.includes('server') || f.path.includes('api') || f.path.includes('backend')
    );

    if (backendFiles.length === 0) return null;

    try {
      const fileContents = backendFiles.map(f => ({
        path: f.path,
        content: f.content
      }));

      const prompt = `Analyze these backend files and generate API documentation:

${JSON.stringify(fileContents, null, 2)}

Create comprehensive API documentation with:
1. Base URL and authentication
2. All available endpoints with:
   - HTTP method
   - Path
   - Description
   - Request parameters/body
   - Response format
   - Example requests and responses
3. Error codes and handling

Return ONLY markdown formatted documentation.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
      console.error('API docs generation error:', error);
      return '# API Documentation\n\nAPI documentation generation failed. Please review the backend code manually.';
    }
  };

  // Generate Component Documentation
  const generateComponentDocs = async (analysis) => {
    if (analysis.components.length === 0) return null;

    try {
      const componentInfo = analysis.components.map(c => ({
        name: c.name,
        path: c.path,
        content: c.content.substring(0, 1000) // Limit content length
      }));

      const prompt = `Generate documentation for these React components:

${JSON.stringify(componentInfo, null, 2)}

For each component, document:
1. Component name and purpose
2. Props (name, type, required, description)
3. State management used
4. Key functions/methods
5. Usage example

Return ONLY markdown formatted documentation.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
      console.error('Component docs generation error:', error);
      return '# Component Documentation\n\nComponent documentation generation failed. Please review components manually.';
    }
  };

  // Generate Setup Guide
  const generateSetupGuide = async (ideation, analysis) => {
    try {
      const prompt = `Create a detailed setup and deployment guide for:

Project: ${ideation.projectName}
Tech Stack: ${JSON.stringify(ideation.techStack)}
Dependencies: ${analysis.dependencies.join(', ')}

Include:
1. Prerequisites (Node.js version, tools, etc.)
2. Step-by-step installation
3. Environment variables setup
4. Development server instructions
5. Build for production
6. Deployment options (Vercel, Netlify, etc.)
7. Troubleshooting common issues

Return ONLY markdown formatted guide.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
      console.error('Setup guide generation error:', error);
      return generateFallbackSetupGuide(ideation, analysis);
    }
  };

  // Generate Changelog
  const generateChangelog = (ideation) => {
    const date = new Date().toISOString().split('T')[0];
    
    return `# Changelog

## [1.0.0] - ${date}

### Added
${ideation.features.map(f => `- ${f}`).join('\n')}

### Tech Stack
- Frontend: ${ideation.techStack.frontend.join(', ')}
- Backend: ${ideation.techStack.backend.join(', ')}
${ideation.techStack.database ? `- Database: ${ideation.techStack.database.join(', ')}` : ''}

### Initial Release
This is the initial release of ${ideation.projectName}.
`;
  };

  // Fallback README generator
  const generateFallbackREADME = (ideation, analysis) => {
    return `# ${ideation.projectName}

${ideation.description}

## Features

${ideation.features.map(f => `- ${f}`).join('\n')}

## Tech Stack

**Frontend:**
${ideation.techStack.frontend.map(t => `- ${t}`).join('\n')}

**Backend:**
${ideation.techStack.backend.map(t => `- ${t}`).join('\n')}

${ideation.techStack.database ? `**Database:**\n${ideation.techStack.database.map(t => `- ${t}`).join('\n')}` : ''}

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/${ideation.projectName.toLowerCase().replace(/\s+/g, '-')}.git

# Navigate to project directory
cd ${ideation.projectName.toLowerCase().replace(/\s+/g, '-')}

# Install dependencies
npm install

# Start development server
npm start
\`\`\`

## Usage

1. Configure your environment variables
2. Run the development server
3. Open http://localhost:3000 in your browser

## Project Structure

\`\`\`
${generateProjectStructure(analysis)}
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

---

Generated by AI Documentation Agent
`;
  };

  // Fallback setup guide
  const generateFallbackSetupGuide = (ideation, analysis) => {
    return `# Setup & Deployment Guide

## Prerequisites

- Node.js 16+ and npm
- Git
${ideation.techStack.database ? '- Database setup (PostgreSQL/MongoDB/etc.)' : ''}

## Installation Steps

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd ${ideation.projectName.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Environment Configuration

Create a \`.env\` file in the root directory:

\`\`\`env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GEMINI_API_KEY=your-api-key-here
${ideation.techStack.database ? 'DATABASE_URL=your-database-url' : ''}
\`\`\`

### 4. Start Development Server

\`\`\`bash
npm start
\`\`\`

The application will open at http://localhost:3000

## Production Build

\`\`\`bash
npm run build
\`\`\`

## Deployment

### Vercel
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Netlify
\`\`\`bash
npm install -g netlify-cli
netlify deploy
\`\`\`

## Troubleshooting

- **Port already in use:** Change the port in package.json
- **API connection issues:** Verify REACT_APP_API_URL in .env
- **Build errors:** Clear cache with \`npm cache clean --force\`
`;
  };

  // Generate project structure
  const generateProjectStructure = (analysis) => {
    const structure = [];
    const folderMap = new Map();

    analysis.files.forEach(file => {
      const parts = file.path.split('/');
      parts.reduce((acc, part, idx) => {
        const path = [...acc, part].join('/');
        if (!folderMap.has(path)) {
          folderMap.set(path, {
            level: idx,
            name: part,
            isFile: idx === parts.length - 1
          });
        }
        return [...acc, part];
      }, []);
    });

    Array.from(folderMap.values())
      .sort((a, b) => a.level - b.level)
      .forEach(item => {
        const indent = '  '.repeat(item.level);
        const icon = item.isFile ? '📄' : '📁';
        structure.push(`${indent}${icon} ${item.name}`);
      });

    return structure.join('\n');
  };

  // Add documentation files to file structure
  const addDocumentationToFiles = useCallback((fileStructure, documentation) => {
    const newFileStructure = JSON.parse(JSON.stringify(fileStructure));

    // Find or create docs folder
    let docsFolder = newFileStructure.children?.find(c => c.name === 'docs' && c.type === 'folder');
    
    if (!docsFolder) {
      docsFolder = {
        name: 'docs',
        type: 'folder',
        children: []
      };
      if (!newFileStructure.children) newFileStructure.children = [];
      newFileStructure.children.push(docsFolder);
    }

    // Add README.md to root
    const readmeExists = newFileStructure.children?.some(c => c.name === 'README.md');
    if (!readmeExists) {
      newFileStructure.children.push({
        name: 'README.md',
        type: 'file',
        content: documentation.readme
      });
    }

    // Add documentation files to docs folder
    const docFiles = [
      { name: 'API.md', content: documentation.apiDocs },
      { name: 'COMPONENTS.md', content: documentation.componentDocs },
      { name: 'SETUP.md', content: documentation.setupGuide },
      { name: 'CHANGELOG.md', content: documentation.changelog }
    ];

    docFiles.forEach(doc => {
      if (doc.content) {
        const exists = docsFolder.children.some(c => c.name === doc.name);
        if (!exists) {
          docsFolder.children.push({
            name: doc.name,
            type: 'file',
            content: doc.content
          });
        }
      }
    });

    return newFileStructure;
  }, []);

  return {
    generateDocumentation,
    addDocumentationToFiles,
    isGenerating,
    documentationProgress
  };
};

export default useDocumentationAgent;

// Documentation Generation Modal Component
export const DocumentationModal = ({ isOpen, onClose, progress }) => {
  if (!isOpen) return null;

  const getProgressColor = () => {
    if (progress >= 85) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-purple-500';
  };

  const getStageText = () => {
    if (!progress) return 'Initializing...';
    switch (progress.stage) {
      case 'analyzing': return 'Analyzing project structure...';
      case 'generating-readme': return 'Generating README.md...';
      case 'generating-api-docs': return 'Generating API documentation...';
      case 'generating-component-docs': return 'Generating component docs...';
      case 'generating-setup-guide': return 'Creating setup guide...';
      case 'complete': return 'Documentation complete!';
      default: return 'Processing...';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border-2 border-purple-500/30 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Generating Documentation</h2>
          <p className="text-gray-400">{getStageText()}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()} transition-all duration-500 ease-out`}
              style={{ width: `${progress?.progress || 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>Progress</span>
            <span>{progress?.progress || 0}%</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-700/50 rounded-lg p-4 text-sm text-gray-300">
          <p className="mb-2">📝 Creating comprehensive documentation...</p>
          <ul className="space-y-1 text-xs">
            <li className={progress?.progress >= 10 ? 'text-green-400' : 'text-gray-500'}>
              ✓ Project analysis
            </li>
            <li className={progress?.progress >= 30 ? 'text-green-400' : 'text-gray-500'}>
              ✓ README generation
            </li>
            <li className={progress?.progress >= 50 ? 'text-green-400' : 'text-gray-500'}>
              ✓ API documentation
            </li>
            <li className={progress?.progress >= 70 ? 'text-green-400' : 'text-gray-500'}>
              ✓ Component docs
            </li>
            <li className={progress?.progress >= 85 ? 'text-green-400' : 'text-gray-500'}>
              ✓ Setup guide
            </li>
          </ul>
        </div>

        {progress?.stage === 'complete' && (
          <button
            onClick={onClose}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            View Documentation
          </button>
        )}
      </div>
    </div>
  );
};