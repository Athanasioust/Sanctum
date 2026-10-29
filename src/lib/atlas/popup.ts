import { renderMarkdown } from "@/lib/markdown";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A marker's popup as safe HTML. Text is escaped and the body goes through the
 * same Markdown renderer as notes, so marker content can never inject markup.
 * Actions carry `data-href` / `data-portal`, which the map component (or the
 * exported page's script) handles.
 */
export function atlasPopupHtml(opts: {
  title: string;
  description: string;
  /** A linked record the DM can open. */
  link?: { label: string; href: string } | null;
  /** A linked record shown as plain text (the export, where nothing can open it). */
  linkText?: string | null;
  portal?: { id: number; label: string } | null;
  extraHtml?: string;
}): string {
  const parts = [`<div class="atlas-popup-title">${esc(opts.title || "—")}</div>`];
  if (opts.description.trim()) {
    parts.push(`<div class="atlas-popup-body">${renderMarkdown(opts.description)}</div>`);
  }
  if (opts.linkText) parts.push(`<div class="atlas-popup-link">${esc(opts.linkText)}</div>`);
  const actions: string[] = [];
  if (opts.link) actions.push(`<a href="${esc(opts.link.href)}" data-href="${esc(opts.link.href)}">${esc(opts.link.label)}</a>`);
  if (opts.portal) actions.push(`<a href="#" data-portal="${opts.portal.id}">${esc(opts.portal.label)} →</a>`);
  if (actions.length) parts.push(`<div class="atlas-popup-actions">${actions.join("")}</div>`);
  if (opts.extraHtml) parts.push(opts.extraHtml);
  return parts.join("");
}
