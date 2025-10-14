import React, { useState } from 'react';
import { Star, Palette, Layout, Type, Users, Play, Sparkles, ChevronDown, Edit, Lightbulb, Code, ArrowRight, Box } from 'lucide-react';
import VSCodeFileExplorer from './components/VSCodeFileExplorer';
import Login from './components/Login';
import SignUp from './components/SignUp';
import UserProfile from './components/UserProfile';
import ErrorDisplay from './components/ErrorDisplay';
import { AuthProvider, useAuth } from './contexts/AuthContext';

//ADD YOUR GEMINI API KEY HERE
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'your-gemini-api-key-here';

// Main App Component with Firebase Authentication
function AppContent() {
  const [currentView, setCurrentView] = useState('prompt'); // 'prompt', 'ideation', 'loading', 'editor', 'transition-to-dashboard', 'transition-to-ideation'
  const [prompt, setPrompt] = useState('');
  const [ideation, setIdeation] = useState(null);
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIdeation, setShowIdeation] = useState(false);
  const [animateFeatures, setAnimateFeatures] = useState([]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Get authentication state and user info
  const { currentUser, isAuthenticated, error: authError, setError: setAuthError } = useAuth();

  // Generate ideation from AI
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
              text: `You are a product ideation specialist. Based on the following user prompt, create a detailed project ideation plan.

User Prompt: "${userPrompt}"

Return ONLY a valid JSON object (no markdown, no explanation, no code blocks) in this exact format:
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
    "frontend": ["React", "Tailwind CSS", "etc"],
    "backend": ["Node.js", "Express", "etc"],
    "database": ["MongoDB", "PostgreSQL", "etc"],
    "other": ["Any other tools/libraries"]
  },
  "colorScheme": {
    "primary": "#hex-color",
    "secondary": "#hex-color",
    "accent": "#hex-color",
    "background": "#hex-color",
    "text": "#hex-color",
    "description": "Brief description of the color scheme mood (e.g., 'Modern and professional', 'Vibrant and playful')"
  },
  "styleGuidelines": {
    "layout": "Brief description of layout approach",
    "typography": "Font recommendations and typography style",
    "iconography": "Icon style description",
    "animation": "Animation and transition approach"
  },
  "userFlow": [
    "Step 1: User action",
    "Step 2: User action",
    "Step 3: User action"
  ],
  "targetAudience": "Who is this app for?",
  "uniqueSellingPoint": "What makes this project special?"
}

Rules:
1. Be specific and actionable
2. Choose realistic tech stacks for the project type
3. Select harmonious color schemes with good contrast
4. Include 4-6 key features
5. Keep descriptions concise but informative
6. Return ONLY the JSON object, no markdown formatting`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            response_mime_type: "application/json"
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
      
      let ideationData;
      try {
        let cleanContent = content.trim();
        
        // Remove markdown code blocks
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Try to extract JSON object from the response
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
        }
        
        // Remove any leading/trailing text
        cleanContent = cleanContent.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
        
        // Parse the JSON
        ideationData = JSON.parse(cleanContent);
        
        // Validate required fields
        if (!ideationData.projectName || !ideationData.features || !ideationData.techStack) {
          throw new Error('Invalid ideation structure');
        }
        
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.log('Raw content:', content);
        throw new Error('Failed to parse AI response. The API returned an invalid format. Please try again.');
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

  // Generate file structure from ideation
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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a code generation assistant. Based on this project ideation, generate a complete project file structure with actual code content.

${ideationContext}

Original User Prompt: "${prompt}"

Return ONLY a valid JSON object (no markdown, no explanation, no code blocks) in this exact format:
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
          "content": "// actual code content here"
        }
      ]
    }
  ]
}

Rules:
1. Generate realistic, working code for each file
2. Use the EXACT colors from the color scheme provided
3. Implement the features listed in the ideation
4. Use the tech stack specified
5. Include all necessary files (HTML, CSS, JS, JSON, README, etc.)
6. Add comments in the code
7. Make the code functional and complete
8. Return ONLY the JSON object, no markdown formatting
9. Escape special characters properly (use \\n for newlines, \\" for quotes)
10. For React projects, use .jsx extension for React component files
11. Apply the color scheme and style guidelines throughout the UI`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            response_mime_type: "application/json"
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
      
      let fileStructure;
      try {
        let cleanContent = content.trim();
        
        // Remove markdown code blocks
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Try to extract JSON object from the response
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
        }
        
        // Remove any leading/trailing text
        cleanContent = cleanContent.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
        
        // Parse the JSON
        fileStructure = JSON.parse(cleanContent);
        
        // Validate structure
        if (!fileStructure.name || !fileStructure.type || !fileStructure.children) {
          throw new Error('Invalid file structure');
        }
        
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.log('Raw content:', content);
        throw new Error('Failed to parse AI response. The API returned an invalid file structure. Please try again.');
      }

      setLoading(false);
      return fileStructure;
      
    } catch (err) {
      console.error('Error generating files:', err);
      setError(err.message || 'Failed to generate files. Please try again.');
      setLoading(false);
      return null;
    }
  };

  const handleGenerateIdeation = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt!');
      return;
    }

    if (GEMINI_API_KEY === 'your-gemini-api-key-here') {
      alert('Please add your Gemini API key!');
      return;
    }

    // Show transition screen
    setCurrentView('transition-to-ideation');
    
    const ideationData = await generateIdeation(prompt);
    if (ideationData) {
      setIdeation(ideationData);
      setCurrentView('ideation');
      setShowIdeation(false);
      
      // Animate features one by one
      setTimeout(() => {
        setShowIdeation(true);
        ideationData.features.forEach((_, idx) => {
          setTimeout(() => {
            setAnimateFeatures(prev => [...prev, idx]);
          }, idx * 150);
        });
      }, 300);
    } else {
      // If error, go back to prompt
      setCurrentView('prompt');
    }
  };

  const handlePrototype = async () => {
    setCurrentView('loading');
    const files = await generateFilesFromIdeation();
    if (files) {
      setGeneratedFiles(files);
      setCurrentView('editor');
    } else {
      setCurrentView('ideation');
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
    // Reset app state
    setPrompt('');
    setIdeation(null);
    setGeneratedFiles(null);
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
        {/* Animated background - Same theme */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]"></div>
        
        {/* Floating orbs */}
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10 text-center">
          {/* Spinning loader */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
          </div>

          {/* Loading text */}
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Taking you to your workspace
          </h2>
          <p className="text-gray-400 text-base">
            Getting everything ready...
          </p>

          {/* Progress dots animation */}
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
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]"></div>
        
        <div className="max-w-[1600px] mx-auto w-full relative z-10 flex flex-col justify-center h-full">
          {/* Top Navigation Bar */}
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

          {/* Header */}
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

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-center">
            {/* Left Side - Prototype Creator (3/7) */}
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

            {/* Right Side - My Projects (4/7) */}
            <div className="lg:col-span-4 flex flex-col min-h-0 bg-gray-900/80 rounded-xl p-6 border-2 border-gray-700/40 hover:border-gray-600/60 transition-all shadow-lg" style={{ maxHeight: '500px' }}>
              <h2 className="text-xl font-bold text-white mb-1">My Projects</h2>
              <p className="text-gray-400 text-sm mb-4">Your collection of AI-generated prototypes.</p>
              
              <div className="grid grid-cols-2 gap-3 overflow-y-auto"  style={{ maxHeight: '400px' }}>
                {/* Project 1 */}
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

                {/* Project 2 */}
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

                {/* Project 3 */}
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

                {/* Project 4 */}
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

          {/* Bottom Actions */}
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

          {/* Powered by footer */}
          <p className="text-center text-xs text-gray-600 mt-4">
            Powered by Google Gemini 2.0 Flash
          </p>
        </div>

        {/* Floating orbs */}
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
    );
  }

  // Transition to Ideation
  if (currentView === 'transition-to-ideation') {
    return (
      <div className="h-screen bg-gray-950 relative overflow-hidden flex items-center justify-center">
        {/* Animated background - Same theme */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]"></div>
        
        {/* Floating orbs */}
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10 text-center">
          {/* Spinning loader */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
          </div>

          {/* Loading text */}
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Ideating Your Prompt
          </h2>
          <p className="text-gray-400 text-base mb-2">
            AI is analyzing your idea and creating a blueprint...
          </p>
          <p className="text-gray-500 text-sm">
            This may take a moment
          </p>

          {/* Progress dots animation */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Ideation View (Blueprint Style)
  if (currentView === 'ideation' && ideation) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8 relative overflow-hidden">
        {/* Animated background - Same as first page */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]"></div>
        
        {/* Floating orbs */}
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className={`max-w-4xl mx-auto relative z-10 transition-all duration-700 ${showIdeation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Header */}
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

          {/* Features Section */}
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
              Add features by <span className="text-purple-400 cursor-pointer hover:text-purple-300">customizing the blueprint</span> or <span className="text-purple-400 cursor-pointer hover:text-purple-300">prompting below</span>
            </div>
          </div>

          {/* Style Guidelines Section */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">STYLE GUIDELINES</h2>
            <div className="space-y-4 border border-purple-500/20 rounded-lg p-5 bg-gray-800/30">
              {/* Color */}
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

              {/* Layout */}
              {ideation.styleGuidelines?.layout && (
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 w-40 text-gray-400 flex-shrink-0">
                    <Layout size={18} />
                    <span>Layout</span>
                  </div>
                  <div className="text-gray-300">{ideation.styleGuidelines.layout}</div>
                </div>
              )}

              {/* Typography */}
              {ideation.styleGuidelines?.typography && (
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 w-40 text-gray-400 flex-shrink-0">
                    <Type size={18} />
                    <span>Typography</span>
                  </div>
                  <div className="text-gray-300">{ideation.styleGuidelines.typography}</div>
                </div>
              )}

              {/* Iconography */}
              {ideation.styleGuidelines?.iconography && (
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 w-40 text-gray-400 flex-shrink-0">
                    <Users size={18} />
                    <span>Iconography</span>
                  </div>
                  <div className="text-gray-300">{ideation.styleGuidelines.iconography}</div>
                </div>
              )}

              {/* Animation */}
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

          {/* Stack Section */}
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

          {/* Action Buttons */}
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
                  Generating Code...
                </>
              ) : (
                'Prototype this App'
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
        {/* Animated background - Same theme */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]"></div>
        
        {/* Floating orbs */}
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10 text-center">
          {/* Large spinning loader */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-24 h-24 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
          </div>

          {/* Loading text */}
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Building Your Project
          </h2>
          <p className="text-gray-400 text-lg mb-2">
            Generating files and setting up your workspace...
          </p>
          <p className="text-gray-500 text-sm">
            This may take a few moments
          </p>

          {/* Progress dots animation */}
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
          </div>
          <button
            onClick={handleStartOver}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Over
          </button>
        </div>
        <VSCodeFileExplorer generatedFiles={generatedFiles} />
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