// Baseline safety check for Phase 1. Full moderation queue + richer rules land in Phase 3.
const BLOCKED_PATTERNS = [
  /<\s*script/i,
  /javascript\s*:/i,
  /expression\s*\(/i, // old IE CSS expression() JS execution
  /-moz-binding/i,
];

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
