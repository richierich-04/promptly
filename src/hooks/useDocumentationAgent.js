// src/hooks/useDocumentationAgent.js - COMPLETE FINAL VERSION
import { useState } from 'react';

export const useDocumentationAgent = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentationProgress, setDocumentationProgress] = useState(0);

  // Enhanced documentation generator that analyzes actual code
  const generateDocumentation = async (ideation, fileStructure) => {
    setIsGenerating(true);
    setDocumentationProgress(0);

    try {
      // Progress: Analyzing project structure
      setDocumentationProgress(10);
      await delay(300);

      const projectName = ideation?.projectName || 'Project';
      const description = ideation?.description || '';
      
      // Extract actual components, utilities, and hooks from file structure
      const components = extractComponents(fileStructure);
      const utilities = extractUtilities(fileStructure);
      const hooks = extractHooks(fileStructure);
      
      setDocumentationProgress(30);
      await delay(400);

      // Generate README based on actual project
      const readme = generateReadme(ideation, components, utilities, hooks);
      setDocumentationProgress(50);
      await delay(300);

      // Generate API documentation
      const apiDocs = generateApiDocs(fileStructure, components);
      setDocumentationProgress(65);
      await delay(300);

      // Generate component documentation
      const componentDocs = generateComponentDocs(components, fileStructure);
      setDocumentationProgress(80);
      await delay(300);

      // Generate setup guide
      const setupGuide = generateSetupGuide(ideation, components, utilities);
      setDocumentationProgress(95);
      await delay(200);

      // Generate changelog
      const changelog = generateChangelog(ideation);
      setDocumentationProgress(100);

      const documentation = {
        readme,
        apiDocs,
        componentDocs,
        setupGuide,
        changelog
      };

      return documentation;
    } catch (error) {
      console.error('Documentation generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
      setTimeout(() => setDocumentationProgress(0), 500);
    }
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const generateReadme = (ideation, components, utilities, hooks) => {
    const componentList = components.length > 0 
      ? `\n## 📦 Components\n\n${components.map(c => `- **${c.name}** - ${c.description}`).join('\n')}`
      : '';

    const utilityList = utilities.length > 0
      ? `\n## 🔧 Utilities\n\n${utilities.map(u => `- **${u.name}** - Helper functions for ${u.purpose}`).join('\n')}`
      : '';

    const hooksList = hooks.length > 0
      ? `\n## 🎣 Custom Hooks\n\n${hooks.map(h => `- **${h.name}** - ${h.description}`).join('\n')}`
      : '';

    return `# ${ideation.projectName}

${ideation.description}

## ✨ Features

${ideation.features.map((f, i) => `${i + 1}. **${f}**`).join('\n')}

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
\`\`\`

Visit http://localhost:3000 to see your app in action!

## 📋 Requirements

- Node.js 14 or higher
- npm or yarn package manager
- Modern web browser

## 🛠️ Tech Stack

**Frontend:** ${ideation.techStack.frontend.join(', ')}${ideation.techStack.backend?.length > 0 ? `\n**Backend:** ${ideation.techStack.backend.join(', ')}` : ''}${ideation.techStack.database?.length > 0 ? `\n**Database:** ${ideation.techStack.database.join(', ')}` : ''}

## 🎨 Design System

- **Primary Color:** \`${ideation.colorScheme.primary}\`
- **Secondary Color:** \`${ideation.colorScheme.secondary}\`
- **Accent Color:** \`${ideation.colorScheme.accent}\`
- **Background:** \`${ideation.colorScheme.background}\`
- **Text:** \`${ideation.colorScheme.text}\`

**Design Philosophy:** ${ideation.colorScheme.description}
${componentList}${utilityList}${hooksList}

## 🎯 Target Audience

${ideation.targetAudience}

## 💡 Unique Selling Point

${ideation.uniqueSellingPoint}

## 📝 User Flow

${ideation.userFlow.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

*Generated with AI Multi-Agent SDLC Platform ✨*`;
  };

  const generateApiDocs = (fileStructure) => {
    return `# API Documentation

## Overview

This document describes all available API endpoints and functions.

## Core Functions

### useState

State management hook for React components.

\`\`\`javascript
const [state, setState] = useState(initialValue);
\`\`\`

### useEffect

Side effects management.

\`\`\`javascript
useEffect(() => {
  // Effect logic
}, [dependencies]);
\`\`\`

## Available Endpoints

### GET /api/health

Check backend health status.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

### POST /api/execute

Execute terminal commands.

**Request:**
\`\`\`json
{
  "command": "npm start",
  "cwd": ".",
  "sessionId": "session-id"
}
\`\`\`

### POST /api/generateDocs

Generate documentation from code.

**Request:**
\`\`\`json
{
  "fileSystem": { /* file structure */ }
}
\`\`\`

---

For more information, check the README.`;
  };

  const generateComponentDocs = (components, fileStructure) => {
    if (components.length === 0) {
      return '# Component Documentation\n\nNo components found in this project.';
    }
    
    return `# Component Documentation

## Overview

This project contains ${components.length} React component${components.length > 1 ? 's' : ''}.

${components.map(comp => {
  const hasProps = comp.content?.includes('props.');
  const hasState = comp.content?.includes('useState');
  const hasEffects = comp.content?.includes('useEffect');
  const hasContext = comp.content?.includes('useContext');

  return `
### ${comp.name}

**Location:** \`${comp.path}\`

**Purpose:** ${comp.description}

**Features:**
${hasState ? '- Uses React state management' : ''}
${hasEffects ? '- Implements side effects with useEffect' : ''}
${hasContext ? '- Consumes React Context' : ''}
${hasProps ? '- Accepts props for configuration' : ''}

**Props:**
\`\`\`typescript
interface ${comp.name}Props {
  ${hasProps ? '// Props are used in this component' : '// No explicit props defined'}
  // Add TypeScript interface based on actual usage
}
\`\`\`

**Usage Example:**
\`\`\`jsx
import ${comp.name} from '${comp.path.replace(/\.(jsx|js)$/, '')}';

function App() {
  return (
    <${comp.name} />
  );
}
\`\`\`

**State Management:**
${hasState ? `This component uses local state with the useState hook.` : 'This component does not use local state.'}

**Side Effects:**
${hasEffects ? `This component handles side effects such as data fetching, subscriptions, or DOM manipulation.` : 'This component is purely functional without side effects.'}

---
`;
}).join('\n')}

## Best Practices

1. **Component Composition:** Break down complex components into smaller, reusable pieces
2. **PropTypes/TypeScript:** Add type checking for better development experience
3. **Memoization:** Use React.memo for expensive components
4. **Hooks:** Follow the Rules of Hooks
5. **Accessibility:** Include ARIA labels and semantic HTML

## Testing

Each component should have corresponding test files:
\`\`\`
${components.map(c => `${c.path.replace(/\.(jsx|js)$/, '.test.js')}`).join('\n')}
\`\`\``;
  };

  const generateSetupGuide = (ideation, components, utilities) => {
    const hasComponents = components.length > 0;
    const hasUtilities = utilities.length > 0;
    const hasBackend = ideation.techStack.backend?.length > 0;
    const hasDatabase = ideation.techStack.database?.length > 0;

    return `# Setup Guide - ${ideation.projectName}

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** version 14.0 or higher ([Download](https://nodejs.org/))
- **npm** version 6.0 or higher (comes with Node.js)
- **Git** for version control ([Download](https://git-scm.com/))
- A modern code editor (VS Code recommended)
- A modern web browser (Chrome, Firefox, or Edge)

## 🚀 Installation

### Step 1: Clone or Download the Project

\`\`\`bash
# If using Git
git clone <repository-url>
cd ${ideation.projectName.toLowerCase().replace(/\s+/g, '-')}

# Or simply extract the downloaded ZIP file
\`\`\`

### Step 2: Install Dependencies

\`\`\`bash
# Install all required packages
npm install

# This will install:
${ideation.techStack.frontend.map(tech => `# - ${tech}`).join('\n')}
# - All development dependencies
# - Testing libraries
\`\`\`

### Step 3: Environment Configuration

Create a \`.env\` file in the project root:

\`\`\`env
# API Configuration
REACT_APP_API_URL=http://localhost:3000
${ideation.techStack.backend.includes('Node.js') ? 'REACT_APP_BACKEND_URL=http://localhost:5001' : ''}

# API Keys (replace with your own)
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
${hasDatabase && ideation.techStack.database.includes('Firebase') ? 'REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here\nREACT_APP_FIREBASE_PROJECT_ID=your_project_id' : ''}

# Environment
NODE_ENV=development
\`\`\`

**⚠️ Important:** Never commit your \`.env\` file to version control!

### Step 4: Start Development Server

\`\`\`bash
# Start the frontend development server
npm start

# The app will automatically open at http://localhost:3000
# Hot reload is enabled - changes will reflect immediately
\`\`\`
${hasBackend ? `
### Step 5: Start Backend Server (Optional)

If this project includes a backend:

\`\`\`bash
# In a new terminal window
cd backend
npm install
npm start

# Backend will run on http://localhost:5001
\`\`\`
` : ''}

## 🏗️ Project Structure

\`\`\`
${ideation.projectName}/
├── src/
│   ├── components/      # React components (${components.length} files)
${hasUtilities ? '│   ├── utils/          # Utility functions\n' : ''}│   ├── App.js          # Main application component
│   ├── index.js        # Application entry point
│   └── index.css       # Global styles
├── public/
│   └── index.html      # HTML template
├── package.json        # Project dependencies
├── .env                # Environment variables
└── README.md           # Project documentation
\`\`\`

## 🔧 Available Scripts

### Development

\`\`\`bash
# Start development server with hot reload
npm start
\`\`\`

### Production Build

\`\`\`bash
# Create optimized production build
npm run build

# Output will be in the /build directory
# Deploy this folder to your hosting service
\`\`\`

### Testing

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
\`\`\`

### Code Quality

\`\`\`bash
# Lint code for errors
npm run lint

# Format code with Prettier
npm run format
\`\`\`

## 🌐 Deployment

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

### Option 2: Netlify

\`\`\`bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=build
\`\`\`

### Option 3: Traditional Hosting

\`\`\`bash
# Build the project
npm run build

# Upload the /build folder to your hosting service
# (via FTP, SSH, or hosting control panel)
\`\`\`

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already taken:

\`\`\`bash
# Windows
set PORT=3001 && npm start

# Mac/Linux
PORT=3001 npm start
\`\`\`

### Module Not Found Errors

\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Build Errors

\`\`\`bash
# Clear build cache
rm -rf build
npm run build
\`\`\`

### Browser Not Opening

Manually navigate to http://localhost:3000

## 🔐 Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Keep dependencies updated** - Run \`npm audit fix\`
3. **Use HTTPS in production** - Enable SSL certificates
4. **Validate user input** - Sanitize all form submissions
5. **Implement authentication** - Protect sensitive routes

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Create React App Documentation](https://create-react-app.dev)
- [Modern JavaScript Guide](https://javascript.info)
${ideation.techStack.frontend.includes('Tailwind CSS') ? '- [Tailwind CSS Documentation](https://tailwindcss.com/docs)\n' : ''}
## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Contact the development team

---

**Happy Coding! 🚀**`;
  };

  const generateChangelog = (ideation) => {
    return `# Changelog

## Version 1.0.0 - Initial Release

### Features
${ideation.features.map(f => `- ${f}`).join('\n')}

### Tech Stack
- Frontend: ${ideation.techStack.frontend.join(', ')}
- Backend: ${ideation.techStack.backend.join(', ')}

### Initial Setup
- Project structure created
- Dependencies configured
- Development environment ready

### Known Issues
None at this time

---

For updates and future releases, check this changelog.`;
  };

  const extractComponents = (fileStructure) => {
    const components = [];
    
    const traverse = (node, path = '') => {
      if (!node) return;
      
      const currentPath = path ? `${path}/${node.name}` : node.name;
      
      if (node.type === 'file' && (node.name.endsWith('.jsx') || node.name.endsWith('.js'))) {
        // Check if it's a React component
        const content = node.content || '';
        const isComponent = content.includes('function ') || content.includes('const ') || content.includes('class ');
        const isReactComponent = content.includes('React') || content.includes('return (') || content.includes('jsx');
        
        if (isComponent && isReactComponent && !node.name.includes('.test.')) {
          const componentName = node.name.replace(/\.(jsx|js)$/, '');
          
          // Analyze component features
          const description = analyzeComponentPurpose(componentName, content);
          
          components.push({
            name: componentName,
            path: currentPath,
            content: content,
            description: description,
            hasState: content.includes('useState'),
            hasEffects: content.includes('useEffect'),
            hasContext: content.includes('useContext'),
            hasProps: content.includes('props.') || content.includes('{ ') && content.includes('} ='),
          });
        }
      }
      
      if (node.type === 'folder' && node.children) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    };
    
    traverse(fileStructure);
    return components;
  };

  const extractUtilities = (fileStructure) => {
    const utilities = [];
    
    const traverse = (node, path = '') => {
      if (!node) return;
      
      const currentPath = path ? `${path}/${node.name}` : node.name;
      
      if (node.type === 'file' && 
          node.name.endsWith('.js') && 
          !node.name.endsWith('.jsx') &&
          !node.name.endsWith('.test.js') &&
          (path.includes('utils') || path.includes('helpers') || path.includes('lib'))) {
        
        const utilName = node.name.replace('.js', '');
        utilities.push({
          name: utilName,
          path: currentPath,
          purpose: guessPurpose(utilName)
        });
      }
      
      if (node.type === 'folder' && node.children) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    };
    
    traverse(fileStructure);
    return utilities;
  };

  const extractHooks = (fileStructure) => {
    const hooks = [];
    
    const traverse = (node, path = '') => {
      if (!node) return;
      
      const currentPath = path ? `${path}/${node.name}` : node.name;
      
      if (node.type === 'file' && 
          node.name.startsWith('use') && 
          (node.name.endsWith('.js') || node.name.endsWith('.jsx')) &&
          !node.name.endsWith('.test.js')) {
        
        const hookName = node.name.replace(/\.(js|jsx)$/, '');
        const content = node.content || '';
        
        hooks.push({
          name: hookName,
          path: currentPath,
          description: analyzeHookPurpose(hookName, content)
        });
      }
      
      if (node.type === 'folder' && node.children) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    };
    
    traverse(fileStructure);
    return hooks;
  };

  const analyzeComponentPurpose = (name, content) => {
    // Try to infer component purpose from name and content
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('button')) return 'Interactive button component';
    if (nameLower.includes('modal')) return 'Modal dialog component';
    if (nameLower.includes('card')) return 'Card display component';
    if (nameLower.includes('form')) return 'Form input component';
    if (nameLower.includes('list')) return 'List display component';
    if (nameLower.includes('nav')) return 'Navigation component';
    if (nameLower.includes('header')) return 'Page header component';
    if (nameLower.includes('footer')) return 'Page footer component';
    if (nameLower.includes('sidebar')) return 'Sidebar navigation component';
    if (nameLower.includes('dashboard')) return 'Dashboard view component';
    if (nameLower.includes('login')) return 'User authentication component';
    if (nameLower.includes('profile')) return 'User profile component';
    
    // Check content for common patterns
    if (content.includes('useState')) return 'Stateful interactive component';
    if (content.includes('useEffect')) return 'Component with side effects';
    if (content.includes('map(')) return 'List rendering component';
    if (content.includes('onClick')) return 'Interactive UI component';
    
    return `${name} component`;
  };

  const analyzeHookPurpose = (name, content) => {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('fetch')) return 'Custom hook for data fetching';
    if (nameLower.includes('auth')) return 'Authentication state management hook';
    if (nameLower.includes('form')) return 'Form state management hook';
    if (nameLower.includes('local')) return 'LocalStorage persistence hook';
    if (nameLower.includes('window')) return 'Window event management hook';
    if (nameLower.includes('debounce')) return 'Debounced value hook';
    if (nameLower.includes('theme')) return 'Theme management hook';
    
    if (content.includes('useState') && content.includes('useEffect')) {
      return 'Stateful hook with side effects';
    }
    
    return `Custom React hook`;
  };

  const guessPurpose = (utilName) => {
    const nameLower = utilName.toLowerCase();
    
    if (nameLower.includes('format')) return 'formatting';
    if (nameLower.includes('validate')) return 'validation';
    if (nameLower.includes('parse')) return 'parsing';
    if (nameLower.includes('api')) return 'API communication';
    if (nameLower.includes('storage')) return 'data storage';
    if (nameLower.includes('auth')) return 'authentication';
    
    return 'utility operations';
  };

  const addDocumentationToFiles = (fileStructure, documentation) => {
    // Add docs as separate files
    const updated = JSON.parse(JSON.stringify(fileStructure));
    
    if (!updated.children) updated.children = [];
    
    const docsFolder = updated.children.find(c => c.name === 'docs');
    if (docsFolder) {
      // Update existing docs folder
      docsFolder.children = [
        { name: 'README.md', type: 'file', content: documentation.readme },
        { name: 'API.md', type: 'file', content: documentation.apiDocs },
        { name: 'COMPONENTS.md', type: 'file', content: documentation.componentDocs },
        { name: 'SETUP.md', type: 'file', content: documentation.setupGuide },
        { name: 'CHANGELOG.md', type: 'file', content: documentation.changelog }
      ];
    } else {
      // Create new docs folder
      updated.children.push({
        name: 'docs',
        type: 'folder',
        children: [
          { name: 'README.md', type: 'file', content: documentation.readme },
          { name: 'API.md', type: 'file', content: documentation.apiDocs },
          { name: 'COMPONENTS.md', type: 'file', content: documentation.componentDocs },
          { name: 'SETUP.md', type: 'file', content: documentation.setupGuide },
          { name: 'CHANGELOG.md', type: 'file', content: documentation.changelog }
        ]
      });
    }
    
    return updated;
  };

  return {
    generateDocumentation,
    addDocumentationToFiles,
    isGenerating,
    documentationProgress
  };
};

// Enhanced Progress Modal Component
export const DocumentationModal = ({ isOpen, onClose, progress }) => {
  if (!isOpen) return null;

  const getProgressColor = () => {
    if (progress < 30) return 'from-blue-500 to-cyan-500';
    if (progress < 60) return 'from-purple-500 to-pink-500';
    if (progress < 90) return 'from-orange-500 to-yellow-500';
    return 'from-green-500 to-emerald-500';
  };

  const getProgressMessage = () => {
    if (progress < 20) return '🔍 Analyzing project structure...';
    if (progress < 40) return '📝 Extracting components and utilities...';
    if (progress < 60) return '✍️ Writing README documentation...';
    if (progress < 75) return '📋 Generating API documentation...';
    if (progress < 90) return '🔧 Creating setup guide...';
    if (progress < 100) return '🎨 Finalizing documentation...';
    return '✨ Documentation complete!';
  };

  const getProgressIcon = () => {
    if (progress < 30) return '🔍';
    if (progress < 60) return '📝';
    if (progress < 90) return '⚡';
    return '✅';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-lg w-full mx-4 border border-gray-700 shadow-2xl relative overflow-hidden">
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 animate-pulse" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4 animate-bounce">
              {getProgressIcon()}
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              {progress === 100 ? '🎉 Documentation Ready!' : 'Generating Documentation'}
            </h2>
            <p className="text-gray-400">
              {progress === 100 
                ? 'Your comprehensive documentation has been created'
                : 'AI is analyzing your code and creating detailed docs...'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">{getProgressMessage()}</span>
              <span className={`font-bold bg-gradient-to-r ${getProgressColor()} bg-clip-text text-transparent`}>
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden shadow-inner backdrop-blur-sm">
              <div 
                className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out relative`}
                style={{ width: `${progress}%` }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                     style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700/50 backdrop-blur-sm">
            <div className="space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${progress >= 20 ? 'text-green-400' : 'text-gray-500'}`}>
                <span>{progress >= 20 ? '✓' : '○'}</span>
                <span>Project Analysis</span>
              </div>
              <div className={`flex items-center gap-2 ${progress >= 50 ? 'text-green-400' : 'text-gray-500'}`}>
                <span>{progress >= 50 ? '✓' : '○'}</span>
                <span>README Generation</span>
              </div>
              <div className={`flex items-center gap-2 ${progress >= 75 ? 'text-green-400' : 'text-gray-500'}`}>
                <span>{progress >= 75 ? '✓' : '○'}</span>
                <span>API Documentation</span>
              </div>
              <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-green-400' : 'text-gray-500'}`}>
                <span>{progress >= 100 ? '✓' : '○'}</span>
                <span>Setup Guide</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            disabled={progress < 100}
            className={`w-full px-6 py-3 rounded-xl font-semibold transition-all transform ${
              progress < 100
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105 shadow-lg shadow-green-500/50'
            }`}
          >
            {progress < 100 ? 'Generating...' : 'View Documentation'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};