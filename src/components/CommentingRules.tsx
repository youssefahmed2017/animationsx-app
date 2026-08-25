const RULES = [
  {
    title: "Respect people's work",
    body: "Even if an animation looks rough, it's someone's real work. “This is bad” isn't feedback — say what's not landing and why.",
  },
  {
    title: "No drive-by one-liners",
    body: "“Too simple” or “needs work” with nothing else doesn't help anyone improve. If you can, suggest a fix.",
  },
  {
    title: "Critique the work, not the person",
    body: "Talk about the CSS, not the person who wrote it. Keep it about the animation.",
  },
  {
    title: "Assume good intent",
    body: "Plenty of people here are still learning. Today's “too simple” might be someone's first published animation.",
  },
];

export default function CommentingRules() {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Commenting rules
      </h2>
      <ul className="mt-3 space-y-3">
        {RULES.map((rule) => (
          <li key={rule.title}>
            <p className="text-sm font-medium text-neutral-200">{rule.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{rule.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
