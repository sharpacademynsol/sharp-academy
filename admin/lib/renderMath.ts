import katex from "katex";
import "katex/dist/katex.min.css";

export const formatMarkdownPreview = (text?: string): string => {
  if (!text) return "";
  let s = text;

  // 1. Render display math $$...$$
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="my-1.5 overflow-x-auto py-1 text-center font-serif" dir="ltr">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<code class="bg-red-50 text-red-600 px-1 py-0.5 rounded text-xs" dir="ltr">${math}</code>`;
    }
  });

  // 2. Render inline math $...$
  s = s.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return `<span class="inline-block font-serif mx-0.5" dir="ltr">${katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })}</span>`;
    } catch {
      return `<code class="bg-red-50 text-red-600 px-1 py-0.5 rounded text-xs" dir="ltr">${math}</code>`;
    }
  });

  // 3. Render raw LaTeX without $ if commands like \frac or \sqrt are detected
  if (/^\s*\\[a-zA-Z]/.test(s) && !s.includes("<span class=\"katex\">")) {
    try {
      s = `<span class="inline-block font-serif mx-0.5" dir="ltr">${katex.renderToString(s.trim(), { displayMode: false, throwOnError: false })}</span>`;
    } catch {}
  }

  // 4. Standard markdown formatting and embedded images
  return s
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
    .replace(/~~(.*?)~~/g, "<del>$1</del>")
    .replace(/`([^`]+)`/g, "<code class='bg-slate-100 text-blue-700 px-1 py-0.5 rounded font-mono text-xs'>$1</code>")
    .replace(/!\[(.*?)\]\((.*?)\)/g, "<img src='$2' alt='$1' class='max-h-48 max-w-full rounded-lg border border-slate-200 inline-block my-1 object-contain bg-white p-1' />")
    .replace(/\n/g, "<br/>");
};
