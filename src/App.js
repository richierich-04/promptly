import React, { useState } from 'react';
import { Lightbulb, Palette, Code, ArrowRight, Sparkles, CheckCircle, Box } from 'lucide-react';
import VSCodeFileExplorer from './components/VSCodeFileExplorer';

//ADD YOUR GEMINI API KEY HERE
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'your-gemini-api-key-here';

function App() {
  const [currentView, setCurrentView] = useState('prompt'); // 'prompt', 'ideation', 'editor'
  const [prompt, setPrompt] = useState('');
  const [ideation, setIdeation] = useState(null);
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
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
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        cleanContent = cleanContent.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
        
        ideationData = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.log('Raw content:', content);
        throw new Error('Failed to parse AI response. Please try again.');
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
      // Create comprehensive prompt from ideation
      const detailedPrompt = `
PROJECT SPECIFICATION:
=====================

Project Name: ${ideation.projectName}

Description: ${ideation.description}

TARGET AUDIENCE: ${ideation.targetAudience}

UNIQUE SELLING POINT: ${ideation.uniqueSellingPoint}

KEY FEATURES TO IMPLEMENT:
${ideation.features.map((feature, idx) => `${idx + 1}. ${feature}`).join('\n')}

TECH STACK REQUIREMENTS:
- Frontend: ${ideation.techStack.frontend.join(', ')}
- Backend: ${ideation.techStack.backend.join(', ')}
- Database: ${ideation.techStack.database.join(', ')}
- Other Tools: ${ideation.techStack.other.join(', ')}

COLOR SCHEME (MUST USE EXACTLY):
- Primary Color: ${ideation.colorScheme.primary}
- Secondary Color: ${ideation.colorScheme.secondary}
- Accent Color: ${ideation.colorScheme.accent}
- Background Color: ${ideation.colorScheme.background}
- Text Color: ${ideation.colorScheme.text}
- Theme: ${ideation.colorScheme.description}

USER FLOW TO IMPLEMENT:
${ideation.userFlow.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

ORIGINAL USER REQUEST: "${prompt}"

IMPORTANT: Generate a fully functional, production-ready application that implements ALL the features listed above, uses the EXACT color scheme provided, and follows the user flow precisely.
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert full-stack developer. Based on the detailed project specification below, generate a complete, production-ready project with actual working code.

${detailedPrompt}

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
1. Implement EVERY feature listed in the specification
2. Use the EXACT color scheme provided (all hex colors must match)
3. Follow the user flow step-by-step in your implementation
4. Use the specified tech stack technologies
5. Generate realistic, production-quality code with proper error handling
6. Include all necessary files: components, styles, configuration, README
7. Add detailed comments explaining key functionality
8. For React projects, use .jsx extension for component files
9. Make the UI beautiful, responsive, and user-friendly
10. Implement the unique selling point prominently
11. Consider the target audience in your design choices
12. Escape special characters properly (use \\n for newlines, \\" for quotes)
13. Return ONLY the JSON object, no markdown formatting, no code blocks

Generate a complete, working application now.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
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
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        cleanContent = cleanContent.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
        
        fileStructure = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.log('Raw content:', content);
        throw new Error('Failed to parse AI response. Please try again.');
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

    const ideationData = await generateIdeation(prompt);
    if (ideationData) {
      setIdeation(ideationData);
      setCurrentView('ideation');
    }
  };

  const handlePrototype = async () => {
    const files = await generateFilesFromIdeation();
    if (files) {
      setGeneratedFiles(files);
      setCurrentView('editor');
    }
  };

  const handleBack = () => {
    if (currentView === 'ideation') {
      setCurrentView('prompt');
      setIdeation(null);
      setError('');
    } else if (currentView === 'editor') {
      setCurrentView('ideation');
      setGeneratedFiles(null);
      setError('');
    }
  };

  const handleStartOver = () => {
    setCurrentView('prompt');
    setPrompt('');
    setIdeation(null);
    setGeneratedFiles(null);
    setError('');
  };

  // Prompt View
  if (currentView === 'prompt') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="text-purple-600 mr-3" size={40} />
            <h1 className="text-3xl font-bold text-gray-800">AI Project Ideation</h1>
          </div>
          
          <p className="text-gray-600 text-center mb-8">
            Describe your project idea and let AI create a detailed plan before generating code
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Create a task management app with drag-and-drop functionality, user authentication, and dark mode support..."
            className="w-full min-h-[150px] p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-vertical text-gray-700 mb-6"
            disabled={loading}
          />
          
          <button 
            onClick={handleGenerateIdeation}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Generating Ideation...
              </>
            ) : (
              <>
                <Lightbulb size={20} />
                Generate Project Ideation
              </>
            )}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Powered by Google Gemini 2.0 Flash
          </p>
        </div>
      </div>
    );
  }

  // Ideation View
  if (currentView === 'ideation' && ideation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  ← Back
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{ideation.projectName}</h1>
                  <p className="text-gray-600 mt-1">{ideation.description}</p>
                </div>
              </div>
              <Sparkles className="text-purple-600" size={40} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Features Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="text-green-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Key Features</h2>
              </div>
              <div className="space-y-3">
                {ideation.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Audience & USP */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Target Audience</h2>
                <p className="text-gray-700">{ideation.targetAudience}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-xl font-bold mb-3">Unique Selling Point</h2>
                <p>{ideation.uniqueSellingPoint}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Tech Stack */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Tech Stack</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(ideation.techStack).map(([category, technologies]) => (
                  technologies.length > 0 && (
                    <div key={category}>
                      <h3 className="font-semibold text-gray-700 capitalize mb-2">{category}</h3>
                      <div className="flex flex-wrap gap-2">
                        {technologies.map((tech, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Color Scheme */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="text-pink-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Color Scheme</h2>
              </div>
              <p className="text-gray-600 mb-4 italic">{ideation.colorScheme.description}</p>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(ideation.colorScheme).map(([name, color]) => {
                  if (name === 'description') return null;
                  return (
                    <div key={name} className="text-center">
                      <div 
                        className="w-full h-20 rounded-lg shadow-md mb-2 border-2 border-gray-200"
                        style={{ backgroundColor: color }}
                      ></div>
                      <p className="text-xs font-semibold text-gray-700 capitalize">{name}</p>
                      <p className="text-xs text-gray-500">{color}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User Flow */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowRight className="text-indigo-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">User Flow</h2>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              {ideation.userFlow.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex-shrink-0 bg-indigo-50 rounded-lg p-4 min-w-[200px]">
                    <div className="text-indigo-600 font-bold mb-2">Step {idx + 1}</div>
                    <p className="text-gray-700 text-sm">{step}</p>
                  </div>
                  {idx < ideation.userFlow.length - 1 && (
                    <ArrowRight className="text-indigo-400 flex-shrink-0" size={24} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleStartOver}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={handlePrototype}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generating Code...
                </>
              ) : (
                <>
                  <Box size={20} />
                  Prototype This App
                </>
              )}
            </button>
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

export default App;