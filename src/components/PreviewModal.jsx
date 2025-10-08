import { RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PreviewModal = ({ htmlCode, cssCode, jsCode, onClose, onReload }) => {
  const iframeRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Write code into iframe
  const renderPreview = () => {
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument || iframeRef.current.document;
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>${cssCode || ""}</style>
      </head>
      <body>
        ${htmlCode || ""}
        <script>${jsCode || ""}<\/script>
      </body>
      </html>
    `;
    doc.open();
    doc.write(fullHTML);
    doc.close();
  };
  
  useEffect(() => {
  const iframe = iframeRef.current;
  if (!iframe) return;

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>${cssCode || ""}</style>
      </head>
      <body>
        ${htmlCode || ""}
        <script>${jsCode || ""}<\/script>
      </body>
    </html>
  `);
  doc.close();
}, [htmlCode, cssCode, jsCode]);


console.log("New HTML length:", htmlCode.length, "JS length:", jsCode.length);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        flexDirection: "column",
        zIndex: 10000,
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          background: "#1e1e1e",
          color: "white",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #333",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "16px" }}>👁 Live Preview</h3>

          {/* ✅ Reload Button */}
          <button
            onClick={() => {
              console.log("🔁 Reload clicked!");
              if (onReload) {
                console.log("📦 Rebuilding bundle...");
                onReload(); // rebuild updated code
              }
              setTimeout(() => setReloadKey((k) => k + 1), 100); // refresh iframe
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <RefreshCw size={16} />
            Reload
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#aaa",
            cursor: "pointer",
          }}
        >
          <X size={22} />
        </button>
      </div>

      {/* Preview Iframe */}
      <iframe
  key={reloadKey + jsCode.length} // 👈 force re-mount whenever JS changes
  ref={iframeRef}
  title="Preview"
  sandbox="allow-scripts allow-same-origin"
  srcDoc={`<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${cssCode || ""}</style>
    </head>
    <body>
    ${htmlCode || ""}
    <script>${jsCode || ""}<\/script>
    </body>
    </html>`}
    style={{
        flex: 1,
        width: "100%",
        border: "none",
        backgroundColor: "white",
    }}
    />

    </div>
  );
};

export default PreviewModal;
