"use client";

const STAGE_MARKUP = `
  <div class="animate-target box"></div>
  <button class="animate-target button">Button</button>
  <p class="animate-target text">Animated text</p>
  <div class="animate-target spinner"></div>
`;

function buildDoc(css: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; height: 100%; display: flex; align-items: center; justify-content: center; background: #0a0a0a; font-family: system-ui, sans-serif; color: #e5e5e5; }
      .stage { display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; justify-content: center; padding: 2rem; }
      .box { width: 64px; height: 64px; background: #e5e5e5; border-radius: 8px; }
      .button { padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #525252; background: #171717; color: #e5e5e5; font: inherit; }
      .spinner { width: 32px; height: 32px; border-radius: 50%; border: 3px solid #525252; border-top-color: #e5e5e5; }
      ${css}
    </style>
  </head>
  <body>
    <div class="stage">${STAGE_MARKUP}</div>
  </body>
</html>`;
}

export default function AnimationPreview({ css }: { css: string }) {
  return (
    <iframe
      title="Animation preview"
      className="w-full h-72 rounded-lg border border-neutral-800 bg-neutral-950"
      sandbox=""
      srcDoc={buildDoc(css)}
    />
  );
}
