// detect.js — helper to detect if Gemini generated a React or vanilla project

export function detectProjectType(tree) {
  if (!tree) return "vanilla";

  // If Gemini explicitly added a field, trust it.
  if (tree.projectType && typeof tree.projectType === "string") {
    return tree.projectType.toLowerCase();
  }

  // Otherwise, scan through files
  let isReact = false;
  const stack = [tree];

  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;

    if (node.type === "file") {
      const name = (node.name || "").toLowerCase();
      const content = node.content || "";

      if (
        name.endsWith(".jsx") ||
        name.endsWith(".tsx") ||
        /import\s+React\s+from\s+['"]react['"]/.test(content) ||
        /from\s+['"]react-dom['"]/.test(content)
      ) {
        isReact = true;
        break;
      }
    } else if (node.type === "folder" && Array.isArray(node.children)) {
      stack.push(...node.children);
    }
  }

  return isReact ? "react" : "vanilla";
}
