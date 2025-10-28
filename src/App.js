import React, { useState } from 'react';
import { Star, Palette, Layout, Type, Users, Play, Sparkles, ChevronDown, Edit, Lightbulb, Code, ArrowRight, Box, FileText } from 'lucide-react';
import VSCodeFileExplorer from './components/VSCodeFileExplorer';
import Login from './components/Login';
import SignUp from './components/SignUp';
import UserProfile from './components/UserProfile';
import ErrorDisplay from './components/ErrorDisplay';
import DocumentationViewer from './components/DocumentationViewer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useDocumentationAgent, DocumentationModal } from './hooks/useDocumentationAgent';

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
  const [currentView, setCurrentView] = useState('prompt');
  const [prompt, setPrompt] = useState('');
  const [ideation, setIdeation] = useState(null);
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIdeation, setShowIdeation] = useState(false);
  const [animateFeatures, setAnimateFeatures] = useState([]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Documentation Agent States
  const [showDocModal, setShowDocModal] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState(null);
  const [showDocsViewer, setShowDocsViewer] = useState(false);

  const { currentUser, isAuthenticated, error: authError, setError: setAuthError } = useAuth();

  const { 
    generateDocumentation, 
    addDocumentationToFiles, 
    isGenerating, 
    documentationProgress 
  } = useDocumentationAgent();

  // ============================================================================
  // ENHANCED GENERATE IDEATION WITH ROBUST PARSING
  // ============================================================================

  const generateIdeation = async (userPrompt) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a product ideation specialist. Based on the following user prompt, create a detailed project ideation plan.

User Prompt: "${userPrompt}"

CRITICAL: Return ONLY valid JSON (no markdown, no explanations, no code blocks).

EXACT FORMAT:
{
  "projectName": "A catchy name for the project",
  "description": "2-3 sentence description of what the project does",
  "features": [
    "Feature 1 with brief description",
    "Feature 2 with brief description",
    "Feature 3 with brief description",
    "Feature 4 with brief description"
  ],
  "techStack": {
    "frontend": ["React", "Tailwind CSS"],
    "backend": ["Node.js", "Express"],
    "database": ["MongoDB"],
    "other": []
  },
  "colorScheme": {
    "primary": "#6366f1",
    "secondary": "#8b5cf6",
    "accent": "#ec4899",
    "background": "#ffffff",
    "text": "#1f2937",
    "description": "Modern and professional"
  },
  "styleGuidelines": {
    "layout": "Clean and minimal",
    "typography": "Inter font family",
    "iconography": "Line icons",
    "animation": "Subtle transitions"
  },
  "userFlow": ["Step 1", "Step 2", "Step 3"],
  "targetAudience": "Who is this app for",
  "uniqueSellingPoint": "What makes this project special"
}

Rules:
1. Return ONLY the JSON object
2. No markdown formatting
3. No explanations
4. Valid JSON syntax`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
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
  // ENHANCED GENERATE FILES WITH ROBUST PARSING AND FALLBACK
  // ============================================================================

  const generateFilesFromIdeation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const ideationContext = `
Project: ${ideation.projectName}
Description: ${ideation.description}
Features: ${ideation.features.join(', ')}
Tech Stack: Frontend - ${ideation.techStack.frontend.join(', ')}, Backend - ${ideation.techStack.backend.join(', ')}
Color Scheme: Primary ${ideation.colorScheme.primary}, Secondary ${ideation.colorScheme.secondary}, Accent ${ideation.colorScheme.accent}
Style Guidelines: ${JSON.stringify(ideation.styleGuidelines)}
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a code generation assistant. Generate a complete project file structure.

${ideationContext}

Original User Prompt: "${prompt}"

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no explanations, no code blocks
2. Start directly with { and end with }
3. Use proper JSON escaping: \\n for newlines, \\" for quotes
4. Test your JSON structure before returning

REQUIRED JSON FORMAT:
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
          "content": "import React from 'react';\\n\\nfunction App() {\\n  return <div>Hello World</div>;\\n}\\n\\nexport default App;"
        }
      ]
    }
  ]
}

Rules:
1. Use \\n for newlines in code content
2. Use \\" for quotes inside strings
3. Include working, functional code
4. Apply the exact colors from the scheme
5. Implement at least 2-3 main features
6. Include package.json and README.md
7. Return ONLY the JSON - no extra text`
            }]
          }],
          generationConfig: {
            temperature: 0.3, // Lower for more consistent JSON
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 8192
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
      
      let content = data.candidates[0].content.parts[0].text;
      console.log('Files raw response:', content.substring(0, 500));
      
      // Use robust parser
      let fileStructure = parseJSONWithFallbacks(content);
      
      // Validate the structure
      if (!fileStructure || !fileStructure.name || !fileStructure.type) {
        console.error('Invalid structure after parsing:', fileStructure);
        throw new Error('Parsed structure is invalid');
      }
      
      // Ensure children array exists
      if (!fileStructure.children || !Array.isArray(fileStructure.children)) {
        fileStructure.children = [];
      }
      
      // If empty or invalid, use fallback
      if (fileStructure.children.length === 0) {
        console.warn('Empty file structure, using fallback');
        fileStructure = createFallbackStructure(ideation);
      }

      setLoading(false);
      return fileStructure;
      
    } catch (err) {
      console.error('Error generating files:', err);
      console.error('Full error:', err.stack);
      
      // ALWAYS return fallback structure instead of failing
      console.log('🔧 Creating fallback structure...');
      const fallbackStructure = createFallbackStructure(ideation);
      
      setError('⚠️ AI had some issues. We created a working starter template for you to customize!');
      setLoading(false);
      return fallbackStructure;
    }
  };

  const handleGenerateIdeation = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt!');
      return;
    }

    if (GEMINI_API_KEY === 'your-gemini-api-key-here') {
      alert('Please add your Gemini API key in the REACT_APP_GEMINI_API_KEY environment variable!');
      return;
    }

    setCurrentView('transition-to-ideation');
    
    const ideationData = await generateIdeation(prompt);
    if (ideationData) {
      setIdeation(ideationData);
      setCurrentView('ideation');
      setShowIdeation(false);
      
      setTimeout(() => {
        setShowIdeation(true);
        ideationData.features.forEach((_, idx) => {
          setTimeout(() => {
            setAnimateFeatures(prev => [...prev, idx]);
          }, idx * 150);
        });
      }, 300);
    } else {
      setCurrentView('prompt');
    }
  };

  const handlePrototype = async () => {
    setCurrentView('loading');
    const files = await generateFilesFromIdeation();
    
    if (files) {
      setGeneratedFiles(files);
      
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
      const docs = await generateDocumentation(ideation, generatedFiles);
      setGeneratedDocs(docs);
      
      const filesWithDocs = addDocumentationToFiles(generatedFiles, docs);
      setGeneratedFiles(filesWithDocs);
      
      setShowDocModal(false);
    } catch (error) {
      console.error('Documentation regeneration failed:', error);
      setShowDocModal(false);
      alert('Failed to regenerate documentation. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentView === 'ideation') {
      setCurrentView('prompt');
      setIdeation(null);
      setError('');
      setShowIdeation(false);
      setAnimateFeatures([]);
    } else if (currentView === 'editor') {
      setCurrentView('ideation');
      setGeneratedFiles(null);
      setGeneratedDocs(null);
      setError('');
    } else if (currentView === 'loading') {
      setCurrentView('ideation');
      setError('');
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

  const handleLoginSuccess = (user) => {
    console.log('Login successful:', user);
    setCurrentView('prompt');
  };

  const handleLogout = () => {
    setCurrentView('prompt');
    setShowUserProfile(false);
    setPrompt('');
    setIdeation(null);
    setGeneratedFiles(null);
    setGeneratedDocs(null);
    setError('');
    setShowIdeation(false);
    setAnimateFeatures([]);
    setLoading(false);
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
      <div className="h-screen bg-gray-950 p-6 pr-12 relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]"></div>
        
        <div className="max-w-[1600px] mx-auto w-full relative z-10 flex flex-col justify-center h-full">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-300 text-sm">
                Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </span>
              <button
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                {currentUser?.displayName 
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : currentUser?.email?.charAt(0).toUpperCase() || 'U'
                }
              </button>
              {showUserProfile && (
                <div className="absolute top-16 right-0 w-80">
                  <UserProfile onLogout={handleLogout} />
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Hello, {currentUser?.displayName || 'User'}, Welcome Back
            </h1>
            <p className="text-gray-400 text-base">
              Let's build the future, one component at a time. What are we creating today?
            </p>
          </div>

          {(error || authError) && (
            <div className="bg-red-950/50 border-2 border-red-500 text-red-300 px-4 py-2 rounded-lg mb-6 max-w-2xl mx-auto shadow-lg shadow-red-500/20">
              {error || authError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-center">
            <div className="lg:col-span-3 flex flex-col justify-center max-w-lg mx-auto w-full">
              <div className="bg-gray-900/80 rounded-xl p-6 border-2 border-gray-700/40 hover:border-gray-600/60 transition-all shadow-lg">
                <h2 className="text-lg font-semibold text-white mb-1">Prototype an app with AI</h2>
                <p className="text-gray-400 text-xs mb-4">Describe your app idea, and let our AI bring it to life.</p>
                
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="An app that helps me plan my day..."
                  className="w-full h-24 p-2 border-2 border-purple-500/40 bg-gray-800/50 rounded-lg focus:border-purple-400 focus:outline-none focus:shadow-lg focus:shadow-purple-500/20 resize-none text-gray-100 placeholder-gray-600 mb-4 transition-all duration-300"
                  disabled={loading}
                />

                <button 
                  onClick={handleGenerateIdeation}
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-900 py-2.5 px-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 border-2 border-cyan-400 mb-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 border-t-transparent"></div>
                      Generating Proposal...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Proposal
                    </>
                  )}
                </button>

                <div className="text-center my-3">
                  <span className="text-gray-500 text-xs uppercase font-semibold">or</span>
                </div>

                <button 
                  className="w-full bg-transparent hover:bg-gray-800/50 text-gray-300 hover:text-white py-2.5 px-4 rounded-lg font-semibold transition-all border-2 border-gray-700 hover:border-pink-500/50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-pink-500/20"
                >
                  <Lightbulb size={16} />
                  Sample Prompts
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col min-h-0 bg-gray-900/80 rounded-xl p-6 border-2 border-gray-700/40 hover:border-gray-600/60 transition-all shadow-lg" style={{ maxHeight: '500px' }}>
              <h2 className="text-xl font-bold text-white mb-1">My Projects</h2>
              <p className="text-gray-400 text-sm mb-4">Your collection of AI-generated prototypes.</p>
              
              <div className="grid grid-cols-2 gap-3 overflow-y-auto" style={{ maxHeight: '400px' }}>
                <div className="bg-gray-900/80 rounded-lg p-4 border-2 border-purple-500/40 hover:border-purple-400/70 transition-all cursor-pointer group shadow-lg shadow-purple-500/10 hover:shadow-purple-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
                        Daily Planner AI
                      </h3>
                      <button className="text-gray-500 hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-500 mb-2">PROJ-001</div>
                  </div>
                  <div className="text-xs text-gray-400">Last accessed: 2 days ago</div>
                </div>

                <div className="bg-gray-900/80 rounded-lg p-4 border-2 border-pink-500/40 hover:border-pink-400/70 transition-all cursor-pointer group shadow-lg shadow-pink-500/10 hover:shadow-pink-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-white group-hover:text-pink-300 transition-colors">
                        Fitness Tracker
                      </h3>
                      <button className="text-gray-500 hover:text-pink-400 opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-500 mb-2">PROJ-007</div>
                  </div>
                  <div className="text-xs text-gray-400">Last accessed: 5 days ago</div>
                </div>

                <div className="bg-gray-900/80 rounded-lg p-4 border-2 border-cyan-500/40 hover:border-cyan-400/70 transition-all cursor-pointer group shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        Recipe Recommender
                      </h3>
                      <button className="text-gray-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-500 mb-2">PROJ-003</div>
                  </div>
                  <div className="text-xs text-gray-400">Last accessed: 1 week ago</div>
                </div>

                <div className="bg-gray-900/80 rounded-lg p-4 border-2 border-green-500/40 hover:border-green-400/70 transition-all cursor-pointer group shadow-lg shadow-green-500/10 hover:shadow-green-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-white group-hover:text-green-300 transition-colors">
                        Portfolio Website V2
                      </h3>
                      <button className="text-gray-500 hover:text-green-400 opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-500 mb-2">PROJ-012</div>
                  </div>
                  <div className="text-xs text-gray-400">Last accessed: 2 weeks ago</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-12">
            <button className="flex items-center gap-2 px-5 py-2 bg-transparent hover:bg-gray-900/50 text-cyan-400 rounded-lg font-medium transition-all border-2 border-gray-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20">
              <ArrowRight size={16} />
              Import Repo
            </button>
            <button className="flex items-center gap-2 px-5 py-2 bg-transparent hover:bg-gray-900/50 text-gray-300 hover:text-white rounded-lg font-medium transition-all border-2 border-gray-800 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20">
              <Box size={16} />
              New Workspace
            </button>
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            Powered by Google Gemini 1.5 Flash
          </p>
        </div>

        <div className="absolute bottom-12 right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
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
  if (currentView === 'ideation' && ideation) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]"></div>
        
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className={`max-w-4xl mx-auto relative z-10 transition-all duration-700 ${showIdeation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-sm text-gray-400 mb-2">App Blueprint</div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {ideation.projectName}
              </h1>
            </div>
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors border border-purple-500/30 rounded-lg hover:border-purple-500/50"
            >
              <Edit size={18} />
              <span>Customize</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">FEATURES</h2>
            <div className="space-y-3">
              {ideation.features.map((feature, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 text-gray-300 transition-all duration-500 ${
                    animateFeatures.includes(idx) 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <Star size={18} className="mt-0.5 flex-shrink-0 text-purple-400" />
                  <div>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Add features by <span className="text-purple-400 cursor-pointer hover:text-purple-300">customizing the blueprint</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">STYLE GUIDELINES</h2>
            <div className="space-y-4 border border-purple-500/20 rounded-lg p-5 bg-gray-800/30">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-40 text-gray-400">
                  <Palette size={18} />
                  <span>Color</span>
                </div>
                <div className="flex gap-2">
                  {Object.entries(ideation.colorScheme).map(([name, color]) => {
                    if (name === 'description') return null;
                    return (
                      <div
                        key={name}
                        className="w-8 h-8 rounded-full border-2 border-purple-500/40 hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: color }}
                        title={`${name}: ${color}`}
                      />
                    );
                  })}
                </div>
              </div>

              {ideation.styleGuidelines?.layout && (
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 w-40 text-gray-400 flex-shrink-0">
                    <Layout size={18} />
                    <span>Layout</span>
                  </div>
                  <div className="text-gray-300">{ideation.styleGuidelines.layout}</div>
                </div>
              )}

              {ideation.styleGuidelines?.typography && (
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 w-40 text-gray-400 flex-shrink-0">
                    <Type size={18} />
                    <span>Typography</span>
                  </div>
                  <div className="text-gray-300">{ideation.styleGuidelines.typography}</div>
                </div>
              )}

              {ideation.styleGuidelines?.iconography && (
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 w-40 text-gray-400 flex-shrink-0">
                    <Users size={18} />
                    <span>Iconography</span>
                  </div>
                  <div className="text-gray-300">{ideation.styleGuidelines.iconography}</div>
                </div>
              )}

              {ideation.styleGuidelines?.animation && (
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 w-40 text-gray-400 flex-shrink-0">
                    <Play size={18} />
                    <span>Animation</span>
                  </div>
                  <div className="text-gray-300">{ideation.styleGuidelines.animation}</div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">STACK</h2>
            <div className="space-y-3">
              {ideation.techStack.frontend && ideation.techStack.frontend.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all">
                  <div className="flex items-center gap-3">
                    <Code size={18} className="text-purple-400" />
                    <span className="text-gray-300">Frontend</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300">{ideation.techStack.frontend.join(', ')}</span>
                    <ChevronDown size={18} className="text-gray-500" />
                  </div>
                </div>
              )}
              
              {ideation.techStack.backend && ideation.techStack.backend.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all">
                  <div className="flex items-center gap-3">
                    <Sparkles size={18} className="text-pink-400" />
                    <span className="text-gray-300">Backend</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300">{ideation.techStack.backend.join(', ')}</span>
                    <ChevronDown size={18} className="text-gray-500" />
                  </div>
                </div>
              )}

              {ideation.techStack.database && ideation.techStack.database.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all">
                  <div className="flex items-center gap-3">
                    <Layout size={18} className="text-blue-400" />
                    <span className="text-gray-300">Database</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300">{ideation.techStack.database.join(', ')}</span>
                    <ChevronDown size={18} className="text-gray-500" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              onClick={handleStartOver}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors border border-gray-600"
            >
              Start Over
            </button>
            <button
              onClick={handlePrototype}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-purple-400/30 hover:shadow-lg hover:shadow-purple-500/50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generating Code & Docs...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Prototype with Docs
                </>
              )}
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
            
            {/* View Documentation Button */}
            {generatedDocs && (
              <button
                onClick={() => setShowDocsViewer(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FileText size={16} />
                View Docs
              </button>
            )}
            
            {/* Regenerate Documentation Button */}
            <button
              onClick={handleRegenerateDocumentation}
              disabled={isGenerating}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Regenerate Documentation"
            >
              <FileText size={16} />
              {isGenerating ? 'Generating...' : 'Update Docs'}
            </button>
          </div>
          <button
            onClick={handleStartOver}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Over
          </button>
        </div>
        <VSCodeFileExplorer generatedFiles={generatedFiles} />
        
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