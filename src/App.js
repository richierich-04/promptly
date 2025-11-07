import React, { useState } from 'react';
import { Star, Palette, Layout, Type, Users, Play, Sparkles, ChevronDown, Edit, Lightbulb, Code, ArrowRight, Box, FileText } from 'lucide-react';
import VSCodeFileExplorer from './components/VSCodeFileExplorer';
import Login from './components/Login';
import SignUp from './components/SignUp';
import UserProfile from './components/UserProfile';
import ErrorDisplay from './components/ErrorDisplay';
import DocumentationViewer from './components/DocumentationViewer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import TestingAgentViewer from './components/TestingAgentViewer';
import { CheckCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { createProject, getProject, updateProject } from './services/projectService';
import PromptView from './components/PromptView';
import { useDocumentationAgent, DocumentationModal } from './hooks/useDocumentationAgent';
import { useTestingAgent} from './hooks/useTestingAgent';
import { logOut } from './firebase/auth';



//ADD YOUR GEMINI API KEY HERE
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'your-gemini-api-key-here';

// ============================================================================
// ROBUST JSON PARSER WITH MULTIPLE FALLBACK STRATEGIES
// ============================================================================

function parseJSONWithFallbacks(content) {
  console.log('Attempting to parse:', content.substring(0, 200) + '...');
  
  // Strategy 1: Direct parse
  try {
    const parsed = JSON.parse(content);
    console.log('✅ Strategy 1 (Direct parse) succeeded');
    return parsed;
  } catch (e) {
    console.log('❌ Strategy 1 failed:', e.message);
  }
  
  // Strategy 2: Remove markdown code blocks
  try {
    let cleaned = content.trim();
    cleaned = cleaned.replace(/```json\s*/gi, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    const parsed = JSON.parse(cleaned);
    console.log('✅ Strategy 2 (Remove markdown) succeeded');
    return parsed;
  } catch (e) {
    console.log('❌ Strategy 2 failed:', e.message);
  }
  
  // Strategy 3: Extract JSON from text
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Strategy 3 (Regex extraction) succeeded');
      return parsed;
    }
  } catch (e) {
    console.log('❌ Strategy 3 failed:', e.message);
  }
  
  // Strategy 4: Find first { to last }
  try {
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = content.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(extracted);
      console.log('✅ Strategy 4 (Brace extraction) succeeded');
      return parsed;
    }
  } catch (e) {
    console.log('❌ Strategy 4 failed:', e.message);
  }
  
  // Strategy 5: Fix common JSON issues
  try {
    let fixed = content.trim();
    
    // Remove markdown
    fixed = fixed.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // Remove any text before first {
    const firstBraceIndex = fixed.indexOf('{');
    if (firstBraceIndex > 0) {
      fixed = fixed.substring(firstBraceIndex);
    }
    
    // Remove any text after last }
    const lastBraceIndex = fixed.lastIndexOf('}');
    if (lastBraceIndex !== -1 && lastBraceIndex < fixed.length - 1) {
      fixed = fixed.substring(0, lastBraceIndex + 1);
    }
    
    // Fix trailing commas
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    const parsed = JSON.parse(fixed);
    console.log('✅ Strategy 5 (Fix common issues) succeeded');
    return parsed;
  } catch (e) {
    console.log('❌ Strategy 5 failed:', e.message);
  }
  
  // Strategy 6: Try to repair JSON
  try {
    let repaired = content.trim();
    
    // Extract JSON object
    const match = repaired.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found');
    
    repaired = match[0];
    
    // Replace problematic characters
    repaired = repaired
      .replace(/[\u0000-\u001F]+/g, '') // Remove control characters
      .replace(/\\'/g, "'") // Fix escaped single quotes
      .replace(/([^\\])"/g, '$1\\"') // Escape unescaped quotes (careful with this)
      .replace(/\\\\\\/g, '\\'); // Fix triple backslashes
    
    const parsed = JSON.parse(repaired);
    console.log('✅ Strategy 6 (Repair JSON) succeeded');
    return parsed;
  } catch (e) {
    console.log('❌ Strategy 6 failed:', e.message);
  }
  
  console.error('❌ All parsing strategies failed');
  return null;
}

// ============================================================================
// FALLBACK TEMPLATE GENERATOR
// ============================================================================

function createFallbackStructure(ideation) {
  console.log('🔧 Creating fallback structure for:', ideation.projectName);
  
  const projectName = ideation.projectName.toLowerCase().replace(/\s+/g, '-');
  const colors = ideation.colorScheme;
  
  return {
    name: "project-root",
    type: "folder",
    children: [
      {
        name: "src",
        type: "folder",
        children: [
          {
            name: "App.jsx",
            type: "file",
            content: `import React, { useState } from 'react';
import './App.css';

function App() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    ${ideation.features.map(f => `"${f}"`).join(',\n    ')}
  ];

  return (
    <div className="min-h-screen" style={{ 
      backgroundColor: '${colors.background}', 
      color: '${colors.text}',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        padding: '2rem',
        background: \`linear-gradient(135deg, ${colors.primary}, ${colors.secondary})\`,
        color: 'white'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
          ${ideation.projectName}
        </h1>
        <p style={{ fontSize: '1.125rem', marginTop: '0.5rem', opacity: 0.9 }}>
          ${ideation.description}
        </p>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Features Section */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '600', 
            marginBottom: '1.5rem',
            color: '${colors.primary}'
          }}>
            Features
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                onClick={() => setActiveFeature(index)}
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  backgroundColor: activeFeature === index ? '${colors.primary}' : '${colors.background}',
                  color: activeFeature === index ? 'white' : '${colors.text}',
                  border: \`2px solid \${activeFeature === index ? '${colors.primary}' : '${colors.secondary}'}\`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: activeFeature === index ? '0 8px 16px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {index === 0 ? '🚀' : index === 1 ? '⚡' : index === 2 ? '🎨' : '✨'}
                </div>
                <div style={{ fontWeight: '500' }}>{feature}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section style={{
          padding: '2rem',
          borderRadius: '16px',
          background: \`linear-gradient(135deg, ${colors.accent}20, ${colors.secondary}20)\`,
          border: \`2px solid ${colors.accent}\`,
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600',
            color: '${colors.accent}',
            marginBottom: '1rem'
          }}>
            Ready to Get Started?
          </h3>
          <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
            This is a starter template for ${ideation.projectName}. 
            Customize it to build your vision!
          </p>
          <button style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            backgroundColor: '${colors.primary}',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Get Started
          </button>
        </section>

        {/* Tech Stack */}
        <section style={{ marginTop: '3rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '${colors.secondary}'
          }}>
            Built With
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[${ideation.techStack.frontend.map(t => `"${t}"`).join(', ')}].map((tech, i) => (
              <span
                key={i}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '${colors.primary}15',
                  color: '${colors.primary}',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: \`1px solid ${colors.primary}30\`,
        marginTop: '4rem',
        opacity: 0.7
      }}>
        <p>Built with AI • ${ideation.projectName} © 2024</p>
      </footer>
    </div>
  );
}

export default App;`
          },
          {
            name: "App.css",
            type: "file",
            content: `/* ${ideation.projectName} Styles */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: ${colors.background};
  color: ${colors.text};
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

button {
  font-family: inherit;
}

button:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

button:active {
  transform: scale(0.98);
}`
          },
          {
            name: "index.js",
            type: "file",
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
          },
          {
            name: "index.css",
            type: "file",
            content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary: ${colors.primary};
  --secondary: ${colors.secondary};
  --accent: ${colors.accent};
  --background: ${colors.background};
  --text: ${colors.text};
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: var(--background);
  color: var(--text);
}

* {
  box-sizing: border-box;
}`
          }
        ]
      },
      {
        name: "public",
        type: "folder",
        children: [
          {
            name: "index.html",
            type: "file",
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="${colors.primary}" />
    <meta name="description" content="${ideation.description}" />
    <title>${ideation.projectName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`
          }
        ]
      },
      {
        name: "package.json",
        type: "file",
        content: `{
  "name": "${projectName}",
  "version": "1.0.0",
  "description": "${ideation.description}",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`
      },
      {
        name: "README.md",
        type: "file",
        content: `# ${ideation.projectName}

${ideation.description}

## ✨ Features

${ideation.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 🚀 Tech Stack

**Frontend:** ${ideation.techStack.frontend.join(', ')}

**Backend:** ${ideation.techStack.backend.join(', ')}

${ideation.techStack.database?.length > 0 ? `**Database:** ${ideation.techStack.database.join(', ')}` : ''}

## 🎨 Color Scheme

- **Primary:** ${colors.primary}
- **Secondary:** ${colors.secondary}
- **Accent:** ${colors.accent}
- **Background:** ${colors.background}
- **Text:** ${colors.text}

## 📦 Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm start
\`\`\`

## 🎯 Target Audience

${ideation.targetAudience}

## 💡 Unique Selling Point

${ideation.uniqueSellingPoint}

---

*Generated with AI ✨*
`
      },
      {
        name: ".gitignore",
        type: "file",
        content: `# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*`
      }
    ]
  };
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function AppContent() {

  // ===== AUTH HOOK =====
  const { currentUser, isAuthenticated, authLoading, error: authError, setError: setAuthError } = useAuth();

  // ===== UI STATE HOOKS =====
  const [currentView, setCurrentView] = useState('dashboard');
  const [prompt, setPrompt] = useState('');
  const [ideation, setIdeation] = useState(null);
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIdeation, setShowIdeation] = useState(false);
  const [animateFeatures, setAnimateFeatures] = useState([]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [viewTransitionLoading, setViewTransitionLoading] = useState(false);


  // ===== DOCS HOOKS =====
  const [showDocModal, setShowDocModal] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState(null);
  const [showDocsViewer, setShowDocsViewer] = useState(false);

  const { 
    generateDocumentation, 
    addDocumentationToFiles, 
    isGenerating, 
    documentationProgress 
  } = useDocumentationAgent(); 

  // Testing Agent States
  const [showTestModal, setShowTestModal] = useState(false);
  const [showTestViewer, setShowTestViewer] = useState(false);
  const [testSuite, setTestSuite] = useState(null);
  const [codeQuality, setCodeQuality] = useState(null);

  const { 
    generateTestSuite, 
    analyzeCodebase,
    addTestsToFileStructure, 
    isGenerating: isGeneratingTests, 
    testProgress 
  } = useTestingAgent();  
  

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-b-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400">Checking session...</p>
        </div>
      </div>
    );
  }


  // ============================================================================
  // ENHANCED GENERATE IDEATION WITH ROBUST PARSING
  // ============================================================================

  const generateIdeation = async (userPrompt) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a product ideation specialist. Create a detailed, specific project plan for a WORKING web application.

User Request: "${userPrompt}"

CRITICAL: Create a plan for an application with REAL, IMPLEMENTABLE features. Be specific about what each feature does.

Return ONLY valid JSON (no markdown):

{
  "projectName": "Catchy, descriptive name (2-4 words)",
  "description": "Clear 2-sentence description of what users can DO with this app",
  "features": [
    "SPECIFIC feature 1 with exact functionality (e.g., 'Add and edit tasks with drag-and-drop reordering')",
    "SPECIFIC feature 2 (e.g., 'Filter tasks by completion status with visual indicators')",
    "SPECIFIC feature 3 (e.g., 'Save tasks to browser localStorage for persistence')",
    "SPECIFIC feature 4 (e.g., 'Display task statistics with animated counters')"
  ],
  "techStack": {
    "frontend": ["React", "Tailwind CSS" or "CSS-in-JS"],
    "backend": ["Node.js", "Express"] (can be empty array if client-side only),
    "database": ["localStorage"] or ["MongoDB"] or [],
    "other": []
  },
  "colorScheme": {
    "primary": "#6366f1" (vibrant, project-appropriate color),
    "secondary": "#8b5cf6",
    "accent": "#ec4899",
    "background": "#ffffff" or "#0f172a" (light or dark theme),
    "text": "#1f2937" or "#f1f5f9",
    "description": "Professional and modern"
  },
  "styleGuidelines": {
    "layout": "Clean with card-based design" or similar,
    "typography": "Inter or system font",
    "iconography": "Emoji or Unicode icons",
    "animation": "Smooth transitions and hover effects"
  },
  "userFlow": [
    "User opens app and sees main interface",
    "User interacts with feature 1 (be specific)",
    "User interacts with feature 2",
    "Data persists and updates in real-time"
  ],
  "targetAudience": "Specific user group (e.g., 'Students managing homework', 'Shoppers comparing prices')",
  "uniqueSellingPoint": "What makes this implementation special or better"
}

EXAMPLES:
- For "todo app": Features like "Add tasks with + button", "Mark complete with checkbox", "Delete with trash icon", "Filter all/active/done"
- For "calculator": Features like "Basic operations (+,-,*,/)", "Clear and backspace buttons", "Decimal support", "Keyboard input"
- For "weather app": Features like "Search cities by name", "Display current temperature and condition", "5-day forecast cards", "Toggle Celsius/Fahrenheit"

Be SPECIFIC. Don't say "manage tasks", say "add, edit, delete, and mark tasks complete with a clean interface".`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }
      
      const content = data.candidates[0].content.parts[0].text;
      console.log('Ideation raw response:', content);
      
      // Use robust parser
      const ideationData = parseJSONWithFallbacks(content);
      
      if (!ideationData || !ideationData.projectName || !ideationData.features || !ideationData.techStack) {
        throw new Error('Invalid ideation structure after parsing');
      }

      setLoading(false);
      return ideationData;
      
    } catch (err) {
      console.error('Error generating ideation:', err);
      setError(err.message || 'Failed to generate ideation. Please check your API key and try again.');
      setLoading(false);
      return null;
    }
  };

 // ============================================================================
// IMPROVED generateFilesFromIdeation FUNCTION
// Multi-stage generation for better, more functional code
// ============================================================================

const generateFilesFromIdeation = async () => {
  setLoading(true);
  setError('');
  
  try {
    // Create focused, concise context
    const ideationContext = `
PROJECT: ${ideation.projectName}
DESCRIPTION: ${ideation.description}
TARGET: ${ideation.targetAudience}

KEY FEATURES:
${ideation.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

TECH: ${ideation.techStack.frontend.join(', ')}
COLORS: Primary=${ideation.colorScheme.primary}, Secondary=${ideation.colorScheme.secondary}, Accent=${ideation.colorScheme.accent}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert React developer. Create a COMPLETE, WORKING, PRODUCTION-READY single-page application.

${ideationContext}

CRITICAL REQUIREMENTS:
1. Build REAL functionality - users must be able to interact and see results
2. Implement ALL ${ideation.features.length} features with actual working code
3. Use React hooks (useState, useEffect) for state management
4. Make it fully responsive and modern
5. Include proper error handling
6. Use the specified color scheme
7. Add animations and smooth transitions

TECHNICAL GUIDELINES:
- Main App.jsx should be 300-500 lines with all core logic
- Create separate components only for complex reusable UI
- Use inline styles with the color variables
- Include localStorage for data persistence where appropriate
- Add mock data or API simulation for realistic functionality
- Make buttons, forms, and interactions actually work

OUTPUT FORMAT (RETURN ONLY VALID JSON):
{
  "name": "project-root",
  "type": "folder",
  "children": [
    {
      "name": "src",
      "type": "folder",
      "children": [
        {
          "name": "App.jsx",
          "type": "file",
          "content": "// COMPLETE WORKING APP CODE HERE\\n// Must include:\\n// - Full React component with imports\\n// - State management for all features\\n// - Event handlers that actually work\\n// - Real functionality, not placeholders\\n// - Proper JSX structure\\n// - Inline styles using color scheme"
        },
        {
          "name": "App.css",
          "type": "file",
          "content": "/* Global styles and animations */"
        },
        {
          "name": "index.js",
          "type": "file",
          "content": "import React from 'react';\\nimport ReactDOM from 'react-dom/client';\\nimport './index.css';\\nimport App from './App';\\n\\nconst root = ReactDOM.createRoot(document.getElementById('root'));\\nroot.render(<React.StrictMode><App /></React.StrictMode>);"
        },
        {
          "name": "index.css",
          "type": "file",
          "content": "/* Root styles */"
        }
      ]
    },
    {
      "name": "public",
      "type": "folder",
      "children": [
        {
          "name": "index.html",
          "type": "file",
          "content": "<!DOCTYPE html>\\n<html lang=\\"en\\">\\n<head>\\n  <meta charset=\\"utf-8\\" />\\n  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />\\n  <title>${ideation.projectName}</title>\\n  <script src=\\"https://cdn.tailwindcss.com\\"></script>\\n</head>\\n<body><div id=\\"root\\"></div></body>\\n</html>"
        }
      ]
    },
    {
      "name": "package.json",
      "type": "file",
      "content": "{\\"name\\":\\"${ideation.projectName.toLowerCase().replace(/\\s+/g, '-')}\\",\\"version\\":\\"1.0.0\\",\\"dependencies\\":{\\"react\\":\\"^18.2.0\\",\\"react-dom\\":\\"^18.2.0\\",\\"react-scripts\\":\\"5.0.1\\"},\\"scripts\\":{\\"start\\":\\"react-scripts start\\",\\"build\\":\\"react-scripts build\\"}}"
    },
    {
      "name": "README.md",
      "type": "file",
      "content": "# ${ideation.projectName}\\n\\n${ideation.description}\\n\\n## Features\\n${ideation.features.map((f, i) => `${i+1}. ${f}`).join('\\n')}\\n\\n## Run\\n\`\`\`\\nnpm install\\nnpm start\\n\`\`\`"
    }
  ]
}

EXAMPLE FOR TASK MANAGER:
Create state: const [tasks, setTasks] = useState([])
Add functionality: const addTask = (text) => setTasks([...tasks, {id: Date.now(), text, done: false}])
Toggle: const toggle = (id) => setTasks(tasks.map(t => t.id === id ? {...t, done: !t.done} : t))
Render: {tasks.map(t => <div key={t.id} onClick={() => toggle(t.id)}>{t.text}</div>)}

EXAMPLE FOR WEATHER APP:
Create state: const [city, setCity] = useState(''); const [weather, setWeather] = useState(null)
Mock API: const search = () => setWeather({temp: Math.floor(Math.random()*30), condition: 'Sunny'})
Render: Display temperature, condition, icon based on weather state

BUILD THE REAL APP - Make every feature work with real state and interactions!

Return ONLY the JSON.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 16000
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content) {
      throw new Error('Invalid API response');
    }
    
    let content = data.candidates[0].content.parts[0].text;
    console.log('Generated files response:', content.substring(0, 500));
    
    let fileStructure = parseJSONWithFallbacks(content);
    
    if (!fileStructure || !fileStructure.name || !fileStructure.children?.length) {
      console.warn('Invalid structure, using enhanced fallback');
      fileStructure = createEnhancedFallbackStructure(ideation);
    }

    setLoading(false);
    return fileStructure;
    
  } catch (err) {
    console.error('Error generating files:', err);
    console.log('🔧 Creating enhanced functional website...');
    const fallbackStructure = createEnhancedFallbackStructure(ideation);
    
    setError('⚠️ AI generation had issues. Created a functional starter website for you!');
    setLoading(false);
    return fallbackStructure;
  }
};

// ============================================================================
// ENHANCED FALLBACK - Creates actual functional websites
// ============================================================================

function createEnhancedFallbackStructure(ideation) {
  console.log('🔧 Creating enhanced functional website for:', ideation.projectName);
  
  const projectName = ideation.projectName.toLowerCase().replace(/\s+/g, '-');
  const colors = ideation.colorScheme;
  
  // Determine app type and create appropriate structure
  const appType = determineAppType(ideation);
  
  return {
    name: "project-root",
    type: "folder",
    children: [
      {
        name: "src",
        type: "folder",
        children: [
          // Main App component with actual functionality
          {
            name: "App.jsx",
            type: "file",
            content: generateFunctionalApp(ideation, appType, colors)
          },
          // Components folder with real components
          {
            name: "components",
            type: "folder",
            children: generateComponents(ideation, colors, appType)
          },
          // Pages folder if multi-page
          {
            name: "pages",
            type: "folder",
            children: generatePages(ideation, colors, appType)
          },
          // Styles
          {
            name: "App.css",
            type: "file",
            content: generateAppCSS(colors)
          },
          {
            name: "index.js",
            type: "file",
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);`
          },
          {
            name: "index.css",
            type: "file",
            content: generateIndexCSS(colors)
          }
        ]
      },
      {
        name: "public",
        type: "folder",
        children: [
          {
            name: "index.html",
            type: "file",
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="${colors.primary}" />
    <meta name="description" content="${ideation.description}" />
    <title>${ideation.projectName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`
          }
        ]
      },
      {
        name: "package.json",
        type: "file",
        content: `{
  "name": "${projectName}",
  "version": "1.0.0",
  "description": "${ideation.description}",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}`
      },
      {
        name: "README.md",
        type: "file",
        content: generateREADME(ideation)
      }
    ]
  };
}

// Helper to determine app type
function determineAppType(ideation) {
  const desc = ideation.description.toLowerCase();
  const features = ideation.features.join(' ').toLowerCase();
  const combined = desc + ' ' + features;
  
  if (combined.includes('task') || combined.includes('todo') || combined.includes('manage')) {
    return 'task-manager';
  } else if (combined.includes('shop') || combined.includes('ecommerce') || combined.includes('cart')) {
    return 'ecommerce';
  } else if (combined.includes('blog') || combined.includes('post') || combined.includes('article')) {
    return 'blog';
  } else if (combined.includes('dashboard') || combined.includes('analytics')) {
    return 'dashboard';
  } else if (combined.includes('social') || combined.includes('community')) {
    return 'social';
  } else if (combined.includes('portfolio')) {
    return 'portfolio';
  }
  
  return 'general-app';
}

// ============================================================================
// FUNCTIONAL CODE GENERATORS - Add these functions to your App.js
// ============================================================================

// Generate functional App.jsx based on app type
function generateFunctionalApp(ideation, appType, colors) {
  const templates = {
    'task-manager': `import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const saved = localStorage.getItem('tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '${colors.background}', color: '${colors.text}', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ background: \`linear-gradient(135deg, ${colors.primary}, ${colors.secondary})\`, padding: '2rem', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>${ideation.projectName}</h1>
        <p style={{ fontSize: '1.125rem', marginTop: '0.5rem', opacity: 0.9 }}>${ideation.description}</p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {/* Add Task Section */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '${colors.primary}' }}>Add New Task</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="What needs to be done?"
              style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '1rem', border: \`2px solid ${colors.primary}30\`, borderRadius: '8px', outline: 'none' }}
            />
            <button
              onClick={addTask}
              style={{ padding: '0.75rem 2rem', backgroundColor: '${colors.primary}', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: filter === f ? '${colors.primary}' : 'white',
                color: filter === f ? 'white' : '${colors.text}',
                border: \`2px solid ${colors.primary}\`,
                borderRadius: '20px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {f} ({f === 'all' ? tasks.length : f === 'active' ? tasks.filter(t => !t.completed).length : tasks.filter(t => t.completed).length})
            </button>
          ))}
        </div>

        {/* Task List */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '${colors.text}80' }}>
              <p style={{ fontSize: '1.25rem' }}>No tasks yet!</p>
              <p>Add your first task above to get started.</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '${colors.primary}' }}
                />
                <span style={{ flex: 1, fontSize: '1rem', textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#999' : '${colors.text}' }}>
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-around', padding: '1.5rem', backgroundColor: '${colors.primary}20', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '${colors.primary}' }}>{tasks.length}</div>
            <div style={{ fontSize: '0.875rem', color: '${colors.text}80' }}>Total Tasks</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '${colors.accent}' }}>{tasks.filter(t => t.completed).length}</div>
            <div style={{ fontSize: '0.875rem', color: '${colors.text}80' }}>Completed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '${colors.secondary}' }}>{tasks.filter(t => !t.completed).length}</div>
            <div style={{ fontSize: '0.875rem', color: '${colors.text}80' }}>Remaining</div>
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', marginTop: '4rem', borderTop: \`1px solid ${colors.primary}30\`, color: '${colors.text}80' }}>
        <p>Built with React • ${ideation.projectName} © 2024</p>
      </footer>
    </div>
  );
}

export default App;`,

    'ecommerce': `import React, { useState } from 'react';
import './App.css';

const PRODUCTS = [
  { id: 1, name: 'Product 1', price: 29.99, category: 'Category A', image: '🎁' },
  { id: 2, name: 'Product 2', price: 49.99, category: 'Category A', image: '📦' },
  { id: 3, name: 'Product 3', price: 19.99, category: 'Category B', image: '🎨' },
  { id: 4, name: 'Product 4', price: 39.99, category: 'Category B', image: '⚡' },
  { id: 5, name: 'Product 5', price: 59.99, category: 'Category C', image: '🌟' },
  { id: 6, name: 'Product 6', price: 24.99, category: 'Category C', image: '🎯' },
];

function App() {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCart, setShowCart] = useState(false);

  const categories = ['All', ...new Set(PRODUCTS.map(p => p.category))];

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return newQty === 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const filteredProducts = selectedCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '${colors.background}', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: \`linear-gradient(135deg, ${colors.primary}, ${colors.secondary})\`, padding: '1.5rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>${ideation.projectName}</h1>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', opacity: 0.9 }}>${ideation.description}</p>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          style={{ position: 'relative', padding: '0.75rem 1.5rem', backgroundColor: 'white', color: '${colors.primary}', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
        >
          🛒 Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: selectedCategory === cat ? '${colors.primary}' : 'white',
                color: selectedCategory === cat ? 'white' : '${colors.text}',
                border: \`2px solid ${colors.primary}\`,
                borderRadius: '20px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ fontSize: '4rem', textAlign: 'center', marginBottom: '1rem' }}>{product.image}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '${colors.text}' }}>{product.name}</h3>
              <p style={{ fontSize: '0.875rem', color: '${colors.text}80', marginBottom: '1rem' }}>{product.category}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '${colors.primary}' }}>\${product.price}</span>
                <button
                  onClick={() => addToCart(product)}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '${colors.accent}', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh', backgroundColor: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', padding: '2rem', overflowY: 'auto', zIndex: 1000 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>Shopping Cart</h2>
            <button onClick={() => setShowCart(false)} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>

          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '${colors.text}80', padding: '2rem' }}>Your cart is empty</p>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>{item.image}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>{item.name}</h4>
                    <p style={{ margin: 0, color: '${colors.primary}', fontWeight: '600' }}>\${item.price}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '${colors.primary}', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '${colors.primary}', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                      <button onClick={() => removeFromCart(item.id)} style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '${colors.primary}20', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', color: '${colors.primary}' }}>
                  <span>Total:</span>
                  <span>\${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button style={{ width: '100%', marginTop: '1rem', padding: '1rem', backgroundColor: '${colors.accent}', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer' }}>
                Proceed to Checkout
              </button>
            </>
          )}
        </div>
      )}

      {showCart && <div onClick={() => setShowCart(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} />}
    </div>
  );
}

export default App;`,

    // Add more templates for other app types...
    'general-app': generateGeneralApp(ideation, colors)
  };

  return templates[appType] || templates['general-app'];
}

// Generate Components
function generateComponents(ideation, colors, appType) {
  const components = [
    {
      name: "Header.jsx",
      type: "file",
      content: `import React from 'react';

function Header({ title, subtitle }) {
  return (
    <header style={{
      background: \`linear-gradient(135deg, ${colors.primary}, ${colors.secondary})\`,
      padding: '2rem',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
        {title || '${ideation.projectName}'}
      </h1>
      <p style={{ fontSize: '1.125rem', marginTop: '0.5rem', opacity: 0.9 }}>
        {subtitle || '${ideation.description}'}
      </p>
    </header>
  );
}

export default Header;`
    },
    {
      name: "Footer.jsx",
      type: "file",
      content: `import React from 'react';

function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '2rem',
      marginTop: '4rem',
      borderTop: '1px solid ${colors.primary}30',
      color: '${colors.text}80'
    }}>
      <p>Built with React • ${ideation.projectName} © 2024</p>
    </footer>
  );
}

export default Footer;`
    }
  ];

  // Add app-specific components
  if (appType === 'task-manager') {
    components.push({
      name: "TaskItem.jsx",
      type: "file",
      content: `import React from 'react';

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div style={{
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #eee',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      transition: 'background-color 0.2s'
    }}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
      />
      <span style={{
        flex: 1,
        textDecoration: task.completed ? 'line-through' : 'none',
        color: task.completed ? '#999' : 'inherit'
      }}>
        {task.text}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Delete
      </button>
    </div>
  );
}

export default TaskItem;`
    });
  }

  return components;
}

// Generate Pages
function generatePages(ideation, colors, appType) {
  return [
    {
      name: "Home.jsx",
      type: "file",
      content: `import React from 'react';

function Home() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '${colors.primary}', marginBottom: '1rem' }}>
        Welcome to ${ideation.projectName}
      </h1>
      <p style={{ fontSize: '1.125rem', color: '${colors.text}', lineHeight: '1.6' }}>
        ${ideation.description}
      </p>
      
      <div style={{
        marginTop: '3rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        ${ideation.features.map((feature, idx) => `
        <div style={{
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid ${colors.primary}30'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            ${['🚀', '⚡', '🎨', '✨'][idx % 4]}
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '${colors.primary}' }}>
            ${feature}
          </h3>
          <p style={{ color: '${colors.text}80', fontSize: '0.875rem' }}>
            Explore this feature to see what it can do.
          </p>
        </div>
        `).join('')}
      </div>
    </div>
  );
}

export default Home;`
    }
  ];
}

// Generate CSS files
function generateAppCSS(colors) {
  return `/* ${colors.primary} App Styles */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: ${colors.background};
  color: ${colors.text};
}

button {
  font-family: inherit;
  transition: all 0.2s ease;
}

button:hover {
  transform: scale(1.02);
}

button:active {
  transform: scale(0.98);
}

input, textarea {
  font-family: inherit;
}

input:focus, textarea:focus {
  outline: none;
  border-color: ${colors.primary};
  box-shadow: 0 0 0 3px ${colors.primary}20;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: ${colors.primary};
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: ${colors.secondary};
}`;
}

function generateIndexCSS(colors) {
  return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary: ${colors.primary};
  --secondary: ${colors.secondary};
  --accent: ${colors.accent};
  --background: ${colors.background};
  --text: ${colors.text};
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: var(--background);
  color: var(--text);
}

* {
  box-sizing: border-box;
}

#root {
  min-height: 100vh;
}`;
}

function generateREADME(ideation) {
  return `# ${ideation.projectName}

${ideation.description}

## ✨ Features

${ideation.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 🚀 Tech Stack

**Frontend:** ${ideation.techStack.frontend.join(', ')}

**Backend:** ${ideation.techStack.backend.join(', ')}

${ideation.techStack.database?.length > 0 ? `**Database:** ${ideation.techStack.database.join(', ')}` : ''}

## 🎨 Color Scheme

- **Primary:** ${ideation.colorScheme.primary}
- **Secondary:** ${ideation.colorScheme.secondary}
- **Accent:** ${ideation.colorScheme.accent}
- **Background:** ${ideation.colorScheme.background}
- **Text:** ${ideation.colorScheme.text}

## 📦 Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm start
\`\`\`

The app will open at http://localhost:3000

## 🎯 Target Audience

${ideation.targetAudience}

## 💡 Unique Selling Point

${ideation.uniqueSellingPoint}

## 📝 User Flow

${ideation.userFlow.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## 🛠️ Development

This is a functional React application with:
- State management using React hooks
- Interactive UI components
- Responsive design
- Modern styling with inline styles

## 📄 License

MIT License

---

*Generated by AI Multi-Agent SDLC Platform*
`;
}

// Generate a general functional app
function generateGeneralApp(ideation, colors) {
  return `import React, { useState } from 'react';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState({});

  const features = ${JSON.stringify(ideation.features)};

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '${colors.background}', color: '${colors.text}', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: \`linear-gradient(135deg, ${colors.primary}, ${colors.secondary})\`, padding: '2rem', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>${ideation.projectName}</h1>
        <p style={{ fontSize: '1.125rem', marginTop: '0.5rem', opacity: 0.9 }}>${ideation.description}</p>
      </header>

      {/* Navigation */}
      <nav style={{ backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '0', overflowX: 'auto' }}>
          {features.map((feature, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSection(idx)}
              style={{
                padding: '1rem 2rem',
                backgroundColor: activeSection === idx ? '${colors.primary}' : 'transparent',
                color: activeSection === idx ? 'white' : '${colors.text}',
                border: 'none',
                borderBottom: activeSection === idx ? \`3px solid ${colors.accent}\` : '3px solid transparent',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {feature.split(' ').slice(0, 3).join(' ')}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '1.5rem', color: '${colors.primary}' }}>
            {features[activeSection]}
          </h2>
          
          {/* Interactive Content Area */}
          <div style={{ minHeight: '400px' }}>
            <p style={{ color: '${colors.text}80', marginBottom: '2rem', lineHeight: '1.6' }}>
              This is a functional section for "{features[activeSection]}". 
              Add your specific implementation here with forms, displays, or interactions.
            </p>

            {/* Example Interactive Elements */}
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              <input
                type="text"
                placeholder="Enter data..."
                onChange={(e) => setFormData({ ...formData, [\`field\${activeSection}\`]: e.target.value })}
                style={{ padding: '0.75rem 1rem', fontSize: '1rem', border: \`2px solid ${colors.primary}30\`, borderRadius: '8px', outline: 'none' }}
              />
              <button
                onClick={() => alert('Feature in action: ' + features[activeSection])}
                style={{ padding: '0.75rem 2rem', backgroundColor: '${colors.accent}', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
              >
                Take Action
              </button>
            </div>

            {/* Feature-specific content */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              {[1, 2, 3].map(item => (
                <div
                  key={item}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '${colors.primary}10',
                    borderRadius: '12px',
                    border: \`2px solid ${colors.primary}30\`,
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {['📊', '⚡', '🎯'][item - 1]}
                  </div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Item {item}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '${colors.text}80' }}>
                    Interactive element for this feature
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem', marginTop: '4rem', borderTop: \`1px solid ${colors.primary}30\`, color: '${colors.text}80' }}>
        <p>Built with React • ${ideation.projectName} © 2024</p>
      </footer>
    </div>
  );
}

export default App;`;
}

// Continue with other helper functions...
// (generateComponents, generatePages, etc. - would you like me to continue with these?)

const handleGenerateIdeation = async (userPrompt) => {
  if (!userPrompt.trim()) {
    alert('Please enter a prompt!');
    return;
  }

  setPrompt(userPrompt); // store the prompt

  if (GEMINI_API_KEY === 'your-gemini-api-key-here') {
    alert('Please add your Gemini API key in the REACT_APP_GEMINI_API_KEY environment variable!');
    return;
  }

  // Show loading animation
  setCurrentView("transition-to-ideation");

  const ideationData = await generateIdeation(userPrompt);

  if (!ideationData) {
    setCurrentView("prompt");
    return;
  }

  // ✅ go to ideation, NOT editor
  setIdeation(ideationData);
  setTimeout(() => {
  setCurrentView("ideation");
  setTimeout(() => setShowIdeation(true), 150); // ✅ trigger fade-in animation
  }, 900);

  const projectId = await createProject({
    userId: currentUser.uid,
    prompt: userPrompt,
    ideation: ideationData,
    status: "ideation",
    lastOpened: new Date(),
  });

  setCurrentProject({ id: projectId, ...ideationData });



};


  const handlePrototype = async () => {
    setCurrentView('loading');
    const files = await generateFilesFromIdeation();
    
    if (files) {
      setGeneratedFiles(files);

      if (currentProject?.id) {
        await updateProject(currentProject.id, {
          fileStructure: files,
          status: 'in-progress'
        });
      }
      
      // Generate documentation automatically
      try {
        setShowDocModal(true);
        const docs = await generateDocumentation(ideation, files);
        setGeneratedDocs(docs);
        
        const filesWithDocs = addDocumentationToFiles(files, docs);
        setGeneratedFiles(filesWithDocs);
        
        setShowDocModal(false);
        setCurrentView('editor');
      } catch (error) {
        console.error('Documentation generation failed:', error);
        setShowDocModal(false);
        setCurrentView('editor');
      }
    } else {
      setCurrentView('ideation');
    }
  };



  const handleRegenerateDocumentation = async () => {
    if (!generatedFiles || !ideation) {
      alert('Please generate code first!');
      return;
    }

    try {
      setShowDocModal(true);
      
      // ✅ generateDocumentation is now defined (from hook above)
      const docs = await generateDocumentation(ideation, generatedFiles);
      
      setGeneratedDocs(docs);
      
      // ✅ addDocumentationToFiles is now defined (from hook above)
      const filesWithDocs = addDocumentationToFiles(generatedFiles, docs);
      
      // ✅ setGeneratedFiles is now defined (from useState above)
      setGeneratedFiles(filesWithDocs);
      
      setShowDocModal(false);
      setShowDocsViewer(true);
      
    } catch (error) {
      console.error('Documentation regeneration failed:', error);
      setShowDocModal(false);
      alert('Failed to regenerate documentation. Please try again.');
    }
  };


  const handleStartOver = () => {
    setCurrentView('prompt');
    setPrompt('');
    setIdeation(null);
    setGeneratedFiles(null);
    setGeneratedDocs(null);
    setError('');
    setShowIdeation(false);
    setAnimateFeatures([]);
    setLoading(false);
  };

  const handleBack = () => {
    if (currentView === 'ideation') {
      // Go back from ideation to prompt
      setCurrentView('prompt');
      setIdeation(null);
      setError('');
      setShowIdeation(false);
      setAnimateFeatures([]);
    } else if (currentView === 'editor') {
      // Go back from editor to ideation
      setCurrentView('ideation');
      setGeneratedFiles(null);
      setGeneratedDocs(null);
      setError('');
    } else if (currentView === 'loading') {
      // Go back from loading to ideation
      setCurrentView('ideation');
      setError('');
    }
  };

  const handleGenerateTests = async () => {
    if (!generatedFiles) {
      alert('Please generate code first!');
      return;
    }

    try {
      setShowTestModal(true);
      
      // ✅ generateTestSuite is now defined (from hook above)
      const tests = await generateTestSuite(generatedFiles);
      
      // ✅ analyzeCodebase is now defined (from hook above)
      const quality = await analyzeCodebase(generatedFiles);
      
      if (tests.success) {
        setTestSuite(tests);
        setCodeQuality(quality);
        
        // ✅ addTestsToFileStructure is now defined (from hook above)
        const filesWithTests = addTestsToFileStructure(generatedFiles, tests);
        setGeneratedFiles(filesWithTests);
        
        setShowTestModal(false);
        setShowTestViewer(true);
      } else {
        alert('Test generation failed: ' + (tests.error || tests.message));
        setShowTestModal(false);
      }
    } catch (error) {
      console.error('Test generation failed:', error);
      alert('Failed to generate tests. Please try again.');
      setShowTestModal(false);
    }
  };

  
  const handleViewTests = () => {
    if (testSuite) {
      setShowTestViewer(true);
    }
  };

  const handleLoginSuccess = (user) => {
    console.log('Login successful:', user);
    setCurrentView('transition-to-dashboard');
    
    // Add a small delay to show the transition properly
    setTimeout(() => {
      setCurrentView('dashboard');
    }, 1500); // 1.5 seconds for smooth transition
  };

  const handleLogout = async () => {
    // First, log out from Firebase
    const { error } = await logOut();
    
    if (error) {
      setAuthError(error);
      return;
    }
    
    // Reset all state
    setCurrentView('prompt'); // This will be overridden by auth check
    setShowUserProfile(false);
    setPrompt('');
    setIdeation(null);
    setGeneratedFiles(null);
    setGeneratedDocs(null);
    setError('');
    setShowIdeation(false);
    setAnimateFeatures([]);
    setLoading(false);
    setCurrentProject(null);
    
    // The AuthContext will detect the logout and automatically show login page
    // No need to manually set view - the auth check will handle it
  };

  // Show authentication screen if user is not logged in
  if (!isAuthenticated) {
    return (
      <div>
        <ErrorDisplay error={authError} onClose={() => setAuthError(null)} />
        {isSignUp ? (
          <SignUp 
            onSwitchToLogin={() => setIsSignUp(false)}
            onSignUpSuccess={handleLoginSuccess}
          />
        ) : (
          <Login 
            onSwitchToSignUp={() => setIsSignUp(true)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    );
  }

  if (viewTransitionLoading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-b-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-400">Opening workspace...</p>
        </div>
      </div>
    );
  }
  
  // Add after authentication check, before "Transition to Dashboard":
if (currentView === 'dashboard') {
  return (
    <Dashboard 
    onNewProject={() => {
      setViewTransitionLoading(true);
      setTimeout(() => {
        setCurrentView('prompt');
        setShowIdeation(false); // Reset
        setCurrentProject(null);
        setPrompt('');
        setIdeation(null);
        setGeneratedFiles(null);
        setViewTransitionLoading(false);
      }, 600);
    }}    
      onOpenProject={async (project) => {
        setViewTransitionLoading(true);
      
        // wait a little to feel smooth
        setTimeout(() => {
          setCurrentProject(project);
      
          if (project.ideation) {
            setIdeation(project.ideation);
            setCurrentView('ideation');
            updateProject(project.id, { lastOpened: new Date() });
          } else {
            setCurrentView('prompt');
          }
      
          if (project.fileStructure) {
            setGeneratedFiles(project.fileStructure);
            setCurrentView('editor');
          }
      
          setViewTransitionLoading(false);
        }, 800);
      }}    
      onNewWorkspace={() => {
        setViewTransitionLoading(true);
        setShowIdeation(false);

        setTimeout(() => {
          setCurrentView('prompt');
          setViewTransitionLoading(false);
        }, 800); // nice fade feel
    }}  
      onLogout={handleLogout}
    />
  );
}

  // Transition to Dashboard
  if (currentView === 'transition-to-dashboard') {
    return (
      <div className="h-screen bg-gray-950 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]"></div>
        
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Taking you to your workspace
          </h2>
          <p className="text-gray-400 text-base">
            Getting everything ready...
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-bounce"></div>
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Prompt View
  if (currentView === 'prompt') {
    return (
      <PromptView
        onGenerateIdeation={handleGenerateIdeation}
        loading={loading}
        error={error}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }
  
  
  

  // Transition to Ideation
  if (currentView === 'transition-to-ideation') {
    return (
      <div className="h-screen bg-gray-950 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]"></div>
        
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Ideating Your Prompt
          </h2>
          <p className="text-gray-400 text-base mb-2">
            AI is analyzing your idea and creating a blueprint...
          </p>
          <p className="text-gray-500 text-sm">
            This may take a moment
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Ideation View
// ✅ IDEATION VIEW (Replace existing ideation return block ONLY)
if (currentView === 'ideation' && ideation) {
  return (
    <div className="min-h-screen bg-[#0b0c15] text-white relative overflow-hidden px-8 py-10">

  {/* Background Glow */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(124,58,237,0.20),transparent_65%)]"></div>
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_70%,rgba(236,72,153,0.18),transparent_65%)]"></div>

  <div className="max-w-6xl mx-auto relative z-10 space-y-10">

    {/* Header Row */}
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-purple-400/70 mb-1">
          AI Blueprint
        </p>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {ideation.projectName}
        </h1>
      </div>

      <button
        onClick={handleBack}
        className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition flex items-center gap-2"
      >
        ✏️ Edit Prompt
      </button>
    </div>

    {/* Description Card */}
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 text-gray-300 leading-relaxed shadow-[0_0_20px_rgba(122,58,237,0.25)]">
      {ideation.description}
    </div>

    {/* Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Key Features */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
        <h2 className="text-sm font-semibold text-purple-300 mb-4 flex items-center gap-2">
          ✨ Key Features
        </h2>
        <ul className="space-y-3 text-gray-300 text-sm">
          {ideation.features.map((f,i)=>(
            <li key={i} className="flex gap-2">
              <span className="text-pink-400">•</span> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Colors */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
        <h2 className="text-sm font-semibold text-purple-300 mb-4 flex items-center gap-2">
          🎨 Color Theme
        </h2>
        <div className="flex gap-4 items-center">
          {Object.entries(ideation.colorScheme)
            .filter(([k]) => !["description"].includes(k))
            .map(([k,v]) => (
              <div key={k} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border border-white/20" style={{background: v}}></div>
                <small className="text-gray-400 text-xs mt-1">{k}</small>
              </div>
          ))}
        </div>
      </div>

      {/* Tech */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
        <h2 className="text-sm font-semibold text-purple-300 mb-4">💻 Tech Stack</h2>
        <div className="text-sm space-y-2 text-gray-300">
          <p><span className="text-purple-400">Frontend:</span> {ideation.techStack.frontend.join(", ")}</p>
          <p><span className="text-purple-400">Backend:</span> {ideation.techStack.backend.join(", ")}</p>
          {ideation.techStack.database && (
            <p><span className="text-purple-400">Database:</span> {ideation.techStack.database.join(", ")}</p>
          )}
        </div>
      </div>

      {/* Audience */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
        <h2 className="text-sm font-semibold text-purple-300 mb-4">🎯 Audience & USP</h2>
        <p className="text-xs text-gray-400 mb-1">Target Users:</p>
        <p className="text-sm text-gray-300 mb-4">{ideation.targetAudience}</p>
        <p className="text-xs text-gray-400 mb-1">Unique Value:</p>
        <p className="text-sm text-gray-300">{ideation.uniqueSellingPoint}</p>
      </div>

    </div>

    {/* Action */}
    <div className="flex justify-end">
      <button
        onClick={handlePrototype}
        className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 shadow-[0_0_20px_rgba(236,72,153,0.4)]"
      >
        🚀 Prototype This App
      </button>
    </div>

  </div>
</div>

  );
}


  // Loading View
  if (currentView === 'loading') {
    return (
      <div className="h-screen bg-gray-950 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]"></div>
        
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-24 h-24 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Building Your Project
          </h2>
          <p className="text-gray-400 text-lg mb-2">
            Generating files and setting up your workspace...
          </p>
          <p className="text-gray-500 text-sm">
            This may take a few moments
          </p>

          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Editor View
  // Editor View
  if (currentView === 'editor') {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              ← Back to Ideation
            </button>
            <div className="text-white">
              <span className="text-sm text-gray-400">Project: </span>
              <span className="font-semibold">{ideation?.projectName || 'Untitled'}</span>
            </div>
          </div>
          <button
            onClick={handleStartOver}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Over
          </button>
        </div>
        <VSCodeFileExplorer 
            generatedFiles={generatedFiles}
            // ✅ Add these new props:
            ideation={ideation}
            generateDocumentation={generateDocumentation}
            addDocumentationToFiles={addDocumentationToFiles}
            setGeneratedFiles={setGeneratedFiles}
            generateTestSuite={generateTestSuite}
            analyzeCodebase={analyzeCodebase}
            addTestsToFileStructure={addTestsToFileStructure}
          />
        {/* Documentation Generation Modal */}
        <DocumentationModal 
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          progress={documentationProgress}
        />
        
        {/* Documentation Viewer */}
        {showDocsViewer && generatedDocs && (
          <DocumentationViewer
            documentation={generatedDocs}
            projectName={ideation?.projectName || 'Project'}
            onClose={() => setShowDocsViewer(false)}
          />
        )}



        {/* Testing Agent Viewer */}
        {showTestViewer && (
          <TestingAgentViewer
            testResults={testSuite}
            codeQuality={codeQuality}
            onClose={() => setShowTestViewer(false)}
            onRunTests={() => {
              console.log('Running tests...');
              // Add test execution logic here
            }}
          />
        )}
      </div>
    );
  }

  return null;
}

// Main App wrapper with Authentication Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;