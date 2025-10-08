import * as Babel from "@babel/standalone";
import { useEffect, useRef } from "react";

export default function ReactPreviewModal({ files, onClose }) {
  const iframeRef = useRef();

  useEffect(() => {
    const appCode = findFile(files, "App.js") || "";
    const indexCode = findFile(files, "index.js") || "";
    const htmlCode = findFile(files, "index.html") || "<div id='root'></div>";

    // --- Sanitize any JS ---
    const sanitizeJS = (code) => {
      if (!code) return "";
      return code
        .replace(/import[\s\S]*?(from\s+['"].+['"];?|;)/gm, "")
        .replace(/from\s+['"].+['"];?/gm, "")
        .replace(/export\s+default\s+/g, "window.App = ")
        .replace(/export\s+(const|function|class)\s+/g, "$1 ")
        .replace(/['"]use client['"];/g, "")
        .replace(/^\s*import\s.*$/gm, "");
    };

    let cleanedApp = sanitizeJS(appCode);
    let cleanedIndex = sanitizeJS(indexCode);

    // Fallback index.js if not present
    if (!cleanedIndex.trim()) {
      cleanedIndex = `
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
      `;
    }

    // --- Compile JSX with Babel ---
    const compiledApp = Babel.transform(cleanedApp, { presets: ["react"] }).code;
    const compiledIndex = Babel.transform(cleanedIndex, { presets: ["react"] }).code;

    // --- Create the script to run inside iframe ---
    const runtime = `
  (function() {
    const React = window.React;
    const ReactDOM = window.ReactDOM;

    // Patch React hooks globally
    const {
      useState,
      useEffect,
      useRef,
      useMemo,
      useCallback,
      useReducer,
      useContext
    } = React;
    window.useState = useState;
    window.useEffect = useEffect;
    window.useRef = useRef;
    window.useMemo = useMemo;
    window.useCallback = useCallback;
    window.useReducer = useReducer;
    window.useContext = useContext;

    try {
      ${compiledApp}
      ${compiledIndex}
    } catch (err) {
      document.body.innerHTML =
        '<pre style="color:red;white-space:pre-wrap;">' + err.stack + '</pre>';
      console.error("Preview runtime error:", err);
    }
  })();
`;


    // --- Write to the iframe ---
    const doc = iframeRef.current.contentDocument;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>React Preview</title>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <style>
            body {
              background: #111;
              color: white;
              margin: 0;
              padding: 0;
              font-family: sans-serif;
            }
          </style>
        </head>
        <body>
          ${htmlCode}
          <script>${runtime}</script>
        </body>
      </html>
    `);
    doc.close();
  }, [files]);

  // --- Helper: recursive search ---
  const findFile = (node, name) => {
    if (!node) return null;
    if (node.type === "file" && node.name === name) return node.content;
    if (node.children) {
      for (const child of node.children) {
        const result = findFile(child, name);
        if (result) return result;
      }
    }
    return null;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "#111",
          width: "90%",
          height: "90%",
          borderRadius: "8px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 15,
            background: "#c33",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          ✖ Close
        </button>

        <iframe
          ref={iframeRef}
          title="React Preview"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "#111",
          }}
        />
      </div>
    </div>
  );
}
