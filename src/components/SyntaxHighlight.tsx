/**
 * Minimal, dependency-free syntax highlighting for the CSS/embed code
 * blocks. Deliberately not a full parser — good enough visually, and safe
 * by construction: content is tokenized then rendered as React text nodes
 * (never dangerouslySetInnerHTML), so highlighting untrusted user CSS can't
 * introduce an XSS vector.
 */

type Token = { text: string; className: string };

function tokenize(source: string, pattern: RegExp): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ text: source.slice(lastIndex, index), className: "" });
    }
    const groups = match.groups ?? {};
    const className = Object.keys(groups).find((key) => groups[key] !== undefined);
    tokens.push({ text: match[0], className: className ? CLASS_MAP[className] : "" });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < source.length) {
    tokens.push({ text: source.slice(lastIndex), className: "" });
  }

  return tokens;
}

const CLASS_MAP: Record<string, string> = {
  comment: "text-neutral-500 italic",
  string: "text-green-400",
  atrule: "text-purple-400",
  property: "text-sky-400",
  number: "text-amber-300",
  punct: "text-neutral-600",
  tag: "text-purple-400",
  attr: "text-sky-400",
};

const CSS_PATTERN =
  /(?<comment>\/\*[\s\S]*?\*\/)|(?<string>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<atrule>@[a-zA-Z-]+)|(?<property>[a-zA-Z-]+(?=\s*:))|(?<number>-?\d*\.?\d+(?:%|[a-zA-Z]+)?)|(?<punct>[{}:;,()])/g;

const HTML_PATTERN =
  /(?<tag><\/?[a-zA-Z][a-zA-Z0-9-]*)|(?<attr>\s[a-zA-Z-]+(?==))|(?<string>"[^"]*"|'[^']*')|(?<punct>[<>=/])/g;

function Highlighted({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((token, i) =>
        token.className ? (
          <span key={i} className={token.className}>
            {token.text}
          </span>
        ) : (
          token.text
        )
      )}
    </>
  );
}

export function HighlightedCss({ css }: { css: string }) {
  return <Highlighted tokens={tokenize(css, CSS_PATTERN)} />;
}

export function HighlightedHtml({ html }: { html: string }) {
  return <Highlighted tokens={tokenize(html, HTML_PATTERN)} />;
}
