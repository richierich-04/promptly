import { useEffect, useRef } from "react";

export default function Preview({ htmlCode = "", cssCode = "", jsCode = "" }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const doc = iframeRef.current.contentDocument;
    const page = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>${cssCode || ""}</style>
        </head>
        <body>
          ${htmlCode || ""}
          <script>
            try {
              ${jsCode || ""}
            } catch (e) {
              console.error(e);
              const pre = document.createElement('pre');
              pre.style.color = 'red';
              pre.textContent = 'JS Error: ' + e.message;
              document.body.appendChild(pre);
            }
          </script>
        </body>
      </html>
    `;
    doc.open();
    doc.write(page);
    doc.close();
  }, [htmlCode, cssCode, jsCode]);

  return (
    <iframe
      ref={iframeRef}
      title="Live Preview"
      style={{ width: "100%", height: 500, border: "1px solid #333", borderRadius: 8 }}
      // keep it safe, don’t allow top-level navigation/network, etc.
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
