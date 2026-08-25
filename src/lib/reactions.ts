export const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "🎉", "👀"] as const;
export type ReactionEmoji = (typeof ALLOWED_REACTIONS)[number];
