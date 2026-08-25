// Hard rejects only — these are actually unsafe (script injection,
// non-image URL schemes), so publishing is blocked outright. No soft
// "flag for review" tier: this project has no one available to staff a
// moderation queue, so anything not worth blocking automatically isn't
// worth flagging either.
const BLOCKED_PATTERNS = [
  /<\s*script/i,
  /javascript\s*:/i,
  /expression\s*\(/i, // old IE CSS expression() JS execution
  /-moz-binding/i,
  /@import\b/i, // could pull in an entire external stylesheet
];

// Matches the scheme of a url(...) call, e.g. "url(vbscript:...)" -> "vbscript:".
const URL_SCHEME_PATTERN = /url\(\s*['"]?\s*([a-z][a-z0-9+.-]*):/gi;
const ALLOWED_URL_SCHEMES = new Set(["http", "https", "data"]);

export const MAX_CSS_LENGTH = 50_000;

export function validateCss(css: string): { valid: boolean; reason?: string } {
  if (!css.trim()) return { valid: false, reason: "CSS content is empty." };
  if (css.length > MAX_CSS_LENGTH) {
    return { valid: false, reason: "CSS content is too large (max 50KB)." };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(css)) {
      return { valid: false, reason: `CSS contains a disallowed pattern: ${pattern}.` };
    }
  }

  for (const match of css.matchAll(URL_SCHEME_PATTERN)) {
    const scheme = match[1].toLowerCase();
    if (!ALLOWED_URL_SCHEMES.has(scheme)) {
      return { valid: false, reason: `CSS contains a disallowed url() scheme: ${scheme}:` };
    }
  }

  return { valid: true };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
