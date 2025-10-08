import { useState } from "react";
import "./App.css";
import PreviewModal from "./components/PreviewModal";
import ReactPreviewModal from "./components/ReactPreviewModal";
import VSCodeFileExplorer from "./components/VSCodeFileExplorer";
import { detectProjectType } from "./utils/detect"; // new helper to identify React vs Vanilla
import { bundleForPreview } from "./utils/files";

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

function App() {
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showReactPreview, setShowReactPreview] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [bundle, setBundle] = useState({ html: "", css: "", js: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Gemini API Call ---
  const generateFilesFromAI = async (userPrompt) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a code generation assistant. Based on the user's prompt, generate a COMPLETE, WORKING project in ONE of two formats:

1) VANILLA (HTML/CSS/JS only; no React)
2) REACT (Create-React-App/Vite style: index.html + index.js + App.js, using React + JSX)

Choose the simplest format that fits the prompt.  
Return ONLY a valid JSON object (no markdown). Use this structure:

{
  "projectType": "vanilla" | "react",
  "name": "project-root",
  "type": "folder",
  "children": [
    // file/folder structure
  ]
}

Rules:
- Escape newlines and quotes properly.
- For VANILLA: include index.html, style.css, script.js linked properly.
- For REACT: include index.html (<div id="root"></div>), index.js (ReactDOM.createRoot), App.js (functional React component).
- No explanations. No code fences.
Prompt: "${userPrompt}"`
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setGeneratedFiles(parsed);
      setBundle(bundleForPreview(parsed));
      setShowEditor(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return alert("Please enter a prompt!");
    if (!GEMINI_API_KEY)
      return alert("Add your Gemini API key in the .env file!");
    await generateFilesFromAI(prompt);
  };

  const handleBack = () => {
    setShowEditor(false);
    setShowPreview(false);
    setShowReactPreview(false);
    setPrompt("");
    setGeneratedFiles(null);
    setBundle({ html: "", css: "", js: "" });
  };
   // 🧠 Handles code edits from the VSCodeFileExplorer
const handleFileChange = (filePath, newContent) => {
  const updateNode = (node, pathParts) => {
    if (!node) return;
    if (pathParts.length === 0) return;
    const [part, ...rest] = pathParts;

    if (node.children) {
      node.children.forEach((child) => {
        if (child.name === part) {
          if (rest.length === 0 && child.type === "file") {
            child.content = newContent;
          } else {
            updateNode(child, rest);
          }
        }
      });
    }
  };

  const newTree = JSON.parse(JSON.stringify(generatedFiles));
  updateNode(newTree, filePath.split("/"));
  setGeneratedFiles(newTree);

  // 🧠 Automatically rebuild the preview bundle whenever a file changes
  const updatedBundle = bundleForPreview(newTree);
  setBundle(updatedBundle);
};


  // clone the file tree and apply the change
  

  const handlePreview = () => {
    const type = detectProjectType(generatedFiles);
    if (type === "react") {
      setShowReactPreview(true);
    } else {
      setBundle(bundleForPreview(generatedFiles));
      setShowPreview(true);
    }
  };
  // 🔄 Rebuild bundle from latest edits
  const rebuildBundle = () => {
    if (generatedFiles) {
      const updated = bundleForPreview(generatedFiles);
      setBundle(updated);
    }
  };


  return (
    <div className="App">
      {!showEditor ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "40px",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              maxWidth: "600px",
              width: "100%",
            }}
          >
            <h1 style={{ color: "#333", marginBottom: "10px" }}>AI Code Generator</h1>
            <p style={{ color: "#666", marginBottom: "30px" }}>
              Describe your project — Gemini will generate HTML, JS, or React code ⚡
            </p>

            {error && (
              <div
                style={{
                  background: "#fee",
                  border: "1px solid #fcc",
                  color: "#c33",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                }}
              >
                {error}
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Build a React todo app with add/remove tasks"
              style={{
                padding: "15px",
                width: "100%",
                minHeight: "120px",
                marginBottom: "20px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "16px",
                resize: "vertical",
              }}
              disabled={loading}
            />

            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: "15px 30px",
                width: "100%",
                background: loading
                  ? "#ccc"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Generating..." : "Generate Code"}
            </button>

            <p
              style={{
                marginTop: "20px",
                fontSize: "12px",
                color: "#999",
                textAlign: "center",
              }}
            >
              Powered by Google Gemini 2.0 Flash
            </p>
          </div>
        </div>
      ) : (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <div
            style={{
              background: "#1e1e1e",
              padding: "10px 20px",
              borderBottom: "1px solid #333",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <button
                onClick={handleBack}
                style={{
                  padding: "8px 16px",
                  background: "#333",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <span style={{ color: "#aaa" }}>Prompt: “{prompt}”</span>
            </div>

            <button
              onClick={handlePreview}
              style={{
                padding: "8px 16px",
                background: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              👁 Preview
            </button>
          </div>

          <div style={{ flex: 1, background: "#111", overflow: "auto" }}>
                <VSCodeFileExplorer
                  generatedFiles={generatedFiles}
                  onFileChange={handleFileChange}
                />
          </div>
        </div>
      )}

      {/* ---------------- PREVIEW MODALS ---------------- */}
        {showPreview && (
    <PreviewModal
      htmlCode={bundle.html}
      cssCode={bundle.css}
      jsCode={bundle.js}
      onClose={() => setShowPreview(false)}
      onReload={() => {
        console.log("📦 Rebuilding bundle from latest edits...");
        const updated = bundleForPreview(generatedFiles);
        setBundle(updated);
      }}
    />
  )}


      {showReactPreview && (
        <ReactPreviewModal
          files={generatedFiles}
          onClose={() => setShowReactPreview(false)}
        />
      )}
    </div>
  );
}

export default App;
