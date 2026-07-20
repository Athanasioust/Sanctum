/**
 * Minimal safe markdown-to-HTML renderer.
 * Supports: headings, bold, italic, inline code, code blocks, blockquotes,
 * unordered/ordered lists, horizontal rules, and paragraph breaks.
 * HTML is escaped first so no XSS is possible via the content.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderMarkdown(raw: string): string {
  // Fenced code blocks — preserve before escaping other content
  const codeBlocks: string[] = [];
  let text = raw.replace(/```[\s\S]*?```/g, (match) => {
    const lang = match.match(/^```(\w*)/)?.[1] ?? "";
    const body = match.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
    codeBlocks.push(
      `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(body)}</code></pre>`,
    );
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  // Escape HTML in remaining text
  text = escapeHtml(text);

  // Restore placeholders (they contain raw HTML now, escape happened already)
  text = text.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[Number(i)]);

  // Headings
  text = text.replace(/^###### (.+)$/gm, "<h6>$1</h6>");
  text = text.replace(/^##### (.+)$/gm, "<h5>$1</h5>");
  text = text.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  text = text.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  text = text.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  text = text.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Horizontal rule
  text = text.replace(/^(---|\*\*\*|___)\s*$/gm, "<hr />");

  // Blockquotes
  text = text.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered lists
  text = text.replace(/((?:^[-*+] .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^[-*+] /, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  text = text.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Bold + italic (combined **_text_**)
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/_(.+?)_/g, "<em>$1</em>");
  // Inline code
  text = text.replace(/`(.+?)`/g, "<code>$1</code>");

  // Paragraphs — split on blank lines, skip block elements
  const blockTags = /^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/;
  text = text
    .split(/\n{2,}/)
    .map((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return "";
      if (blockTags.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return text;
}
