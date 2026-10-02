import type { ReactNode } from "react";

// Renders the small markdown subset the studio editor supports.
//
// Everything becomes React elements: there is no dangerouslySetInnerHTML, so
// stored article text can never inject markup or script.

const INLINE_SOURCE = "(\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|\\[[^\\]]+\\]\\([^)\\s]+\\))";

/** Only http(s) and site-relative links survive; javascript: and data: do not. */
function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = new RegExp(INLINE_SOURCE, "g");
  let lastIndex = 0;
  let match = pattern.exec(text);

  while (match !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-bold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token);
      const href = link?.[2] ? safeHref(link[2]) : null;
      if (link && href) {
        nodes.push(
          <a
            key={key}
            href={href}
            className="text-primary underline decoration-2 underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {link[1]}
          </a>,
        );
      } else {
        nodes.push(link?.[1] ?? token);
      }
    }

    lastIndex = match.index + token.length;
    match = pattern.exec(text);
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  return nodes;
}

function renderBlock(block: string, index: number): ReactNode {
  const lines = block.split("\n");
  const first = lines[0] ?? "";
  const key = `b-${index}`;

  if (first.startsWith("### ")) {
    return (
      <h3 key={key} className="mt-4 font-display text-2xl leading-tight sm:text-3xl">
        {renderInline(first.slice(4), key)}
      </h3>
    );
  }

  if (first.startsWith("## ")) {
    return (
      <h2 key={key} className="mt-6 font-display text-3xl leading-tight sm:text-4xl">
        {renderInline(first.slice(3), key)}
      </h2>
    );
  }

  if (first.startsWith("> ")) {
    const quoted = lines.map((line) => line.replace(/^>\s?/, "")).join(" ");
    return (
      <blockquote
        key={key}
        className="my-2 border-s-4 border-primary ps-5 font-display text-2xl italic leading-snug sm:text-3xl"
      >
        {renderInline(quoted, key)}
      </blockquote>
    );
  }

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return (
      <ul key={key} className="grid list-disc gap-2 ps-6">
        {lines.map((line, lineIndex) => (
          <li key={`${key}-${lineIndex}`} className="leading-relaxed">
            {renderInline(line.replace(/^[-*]\s+/, ""), `${key}-${lineIndex}`)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key} className="text-base leading-relaxed sm:text-lg sm:leading-relaxed">
      {renderInline(lines.join(" "), key)}
    </p>
  );
}

export function Markdown({ source }: { source: string }) {
  const blocks = source
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .filter((block) => block.trim() !== "");

  return (
    <div className="grid gap-5">{blocks.map((block, index) => renderBlock(block, index))}</div>
  );
}
