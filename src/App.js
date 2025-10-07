import React, { useState } from 'react';
import VSCodeFileExplorer from './components/VSCodeFileExplorer';
import './App.css';

//ADD YOUR GEMINI API KEY HERE¸
const GEMINI_API_KEY = 'AIzaSyCb3t3UzDq9qnP6uZrWqldwV3-kfcdqK9E';

function App() {
  const [showEditor, setShowEditor] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to call Gemini API and generate file structure
  const generateFilesFromAI = async (userPrompt) => {
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
              text: `You are a code generation assistant. Based on the following prompt, generate a complete project file structure with actual code content.

Prompt: "${userPrompt}"

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
          "name": "App.js",
          "type": "file",
          "content": "// actual code content here"
        }
      ]
    }
  ]
}

Rules:
1. Generate realistic, working code for each file
2. Include all necessary files (HTML, CSS, JS, JSON, README, etc.)
3. Use proper folder structure
4. Add comments in the code
5. Make the code functional and complete
6. Return ONLY the JSON object, no markdown formatting, no \`\`\`json blocks
7. Escape special characters properly in the content field (use \\n for newlines, \\" for quotes)`
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
      
      // Parse the JSON response
      let fileStructure;
      try {
        // Remove markdown code blocks if present
        let cleanContent = content.trim();
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        cleanContent = cleanContent.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
        
        fileStructure = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.log('Raw content:', content);
        throw new Error('Failed to parse AI response. The AI may have returned invalid JSON. Please try again with a simpler prompt.');
      }

      setLoading(false);
      return fileStructure;
      
    } catch (err) {
      console.error('Error generating files:', err);
      setError(err.message || 'Failed to generate files. Please check your API key and try again.');
      setLoading(false);
      return null;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt!');
      return;
    }

    if (GEMINI_API_KEY === 'your-gemini-api-key-here') {
      alert('Please add your Gemini API key in the code!');
      return;
    }

    const files = await generateFilesFromAI(prompt);
    if (files) {
      setGeneratedFiles(files);
      setShowEditor(true);
    }
  };

  const handleBack = () => {
    setShowEditor(false);
    setGeneratedFiles(null);
    setPrompt('');
    setError('');
  };

  return (
    <div className="App">
      {!showEditor ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h1 style={{ color: '#333', marginBottom: '10px' }}>AI Code Generator</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              Describe your project and let Gemini generate the code structure
            </p>
            
            {error && (
              <div style={{
                background: '#fee',
                border: '1px solid #fcc',
                color: '#c33',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Create a simple React calculator app with basic operations..."
              style={{ 
                padding: '15px', 
                width: '100%', 
                minHeight: '120px',
                marginBottom: '20px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              disabled={loading}
            />
            
            <button 
              onClick={handleGenerate}
              disabled={loading}
              style={{ 
                padding: '15px 30px',
                width: '100%',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {loading ? 'Generating with Gemini...' : 'Generate Code'}
            </button>
            
            <p style={{ 
              marginTop: '20px', 
              fontSize: '12px', 
              color: '#999',
              textAlign: 'center'
            }}>
              Powered by Google Gemini 2.0 Flash
            </p>
          </div>
        </div>
      ) : (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            background: '#1e1e1e', 
            padding: '10px 20px', 
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <button
              onClick={handleBack}
              style={{
                padding: '8px 16px',
                background: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
            <span style={{ color: '#888', fontSize: '14px' }}>
              Generated from: <span style={{ color: '#fff' }}>"{prompt}"</span>
            </span>
          </div>
          <VSCodeFileExplorer generatedFiles={generatedFiles} />
        </div>
      )}
    </div>
  );
}

export default App;