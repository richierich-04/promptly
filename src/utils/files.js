// src/utils/files.js
export function flattenTree(node) {
  const out = [];
  function walk(n, path = "") {
    const currentPath = path ? `${path}/${n.name}` : n.name;
    if (n.type === "file") {
      out.push({ path: currentPath, name: n.name, content: n.content || "" });
    } else if (n.type === "folder" && Array.isArray(n.children)) {
      n.children.forEach((c) => walk(c, currentPath));
    }
  }
  if (node) walk(node);
  return out;
}
export function bundleForPreview(root) {
  if (!root) return { html: "", css: "", js: "" };
  const files = flattenTree(root);

  const htmlFile =
    files.find((f) => f.name.toLowerCase() === "index.html") ||
    files.find((f) => f.name.toLowerCase().endsWith(".html"));
  const cssFiles = files.filter((f) => f.name.toLowerCase().endsWith(".css"));
  const jsFiles = files.filter((f) => f.name.toLowerCase().endsWith(".js"));

  const html = htmlFile?.content || "<h1>No HTML found</h1>";
  const css = cssFiles.map((f) => f.content || "").join("\n\n");
  const js = jsFiles.map((f) => f.content || "").join("\n\n");

  console.log("🧩 Bundling for preview:", {
    htmlFile: htmlFile?.name,
    cssFiles: cssFiles.map((f) => f.name),
    jsFiles: jsFiles.map((f) => f.name),
  });

  // 🧹 Remove ALL script tags (both inline and src-based)
  let finalHTML = html
    .replace(/<script[^>]*src=["'][^"']+["'][^>]*><\/script>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, ""); // remove inline <script>...</script>

  // 🧩 Inject CSS inline if not already present
  if (css && !/<style[\s\S]*>/.test(finalHTML)) {
    finalHTML = finalHTML.replace(/<\/head>/i, `<style>${css}</style>\n</head>`);
  }

  // 🧩 Inject our bundled JS
  if (js) {
    finalHTML = finalHTML.replace(
      /<\/body>/i,
      `<script>\n${js}\n<\/script>\n</body>`
    );
  }

  return { html: finalHTML, css, js };
}

