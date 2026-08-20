const FALLBACK_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#ca8a04",
  "#dc2626",
  "#db2777",
];

function colorForUsername(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export default function Avatar({
  username,
  avatarUrl,
  size = 32,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied host, not configurable via next/image's remotePatterns
      <img
        src={avatarUrl}
        alt={username}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 bg-neutral-800"
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: colorForUsername(username || "?"),
        fontSize: Math.max(10, Math.round(size * 0.45)),
      }}
      className="rounded-full flex items-center justify-center text-white font-medium shrink-0"
    >
      {(username || "?")[0]?.toUpperCase()}
    </div>
  );
}
