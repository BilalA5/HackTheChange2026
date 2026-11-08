import { useMemo } from "react";
import { Marked } from "marked";
import { cn } from "@/lib/cn";

/*
 * Markdown to HTML with raw HTML disabled: every html token (block and inline) renders as "".
 * Links are limited to http(s) and mailto and open in a new tab. Output is safe to inject.
 */

const SAFE_HREF = /^(https?:|mailto:|#|\/)/i;

function escapeAttr(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html: () => "",
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      if (!SAFE_HREF.test(href)) return text;
      const t = title ? ` title="${escapeAttr(title)}"` : "";
      return `<a href="${escapeAttr(href)}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

/** Renders trusted-or-not Markdown to HTML without raw HTML. */
export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false }) as string;
}

export interface MarkdownProps {
  source: string;
  /** "paper" for ink text on white, "night" for light text on dark. */
  tone?: "paper" | "night";
  className?: string;
}

/** Prose block styled for paper or dark contexts. */
export function Markdown({ source, tone = "night", className }: MarkdownProps) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  return (
    <div
      className={cn(
        "pw-prose text-[15px] leading-relaxed",
        tone === "paper" ? "text-ink [&_a]:text-accent [&_code]:bg-black/5 [&_pre]:bg-black/5" : "text-fg [&_a]:text-accent-hover [&_code]:bg-white/10 [&_pre]:bg-white/8",
        "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:font-serif [&_h1]:text-[24px] [&_h1]:font-medium",
        "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-[20px] [&_h2]:font-medium",
        "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-[16px] [&_h3]:font-semibold",
        "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
        "[&_code]:rounded-md [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]",
        "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-current/25 [&_blockquote]:pl-3 [&_blockquote]:opacity-80",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
