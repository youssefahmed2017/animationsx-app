"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import DeleteCommentButton from "@/components/DeleteCommentButton";
import CommentReactions, { type ReactionCounts } from "@/components/CommentReactions";
import ReplyForm from "@/components/ReplyForm";
import type { CommentNode } from "@/lib/commentTree";

type CommentData = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  parent_id: string | null;
  profiles: { username: string; avatar_url: string | null } | { username: string; avatar_url: string | null }[] | null;
  reactions: ReactionCounts;
};

export default function CommentThread({
  slug,
  comments,
  currentUserId,
  signedIn,
  depth = 0,
}: {
  slug: string;
  comments: CommentNode<CommentData>[];
  currentUserId?: string;
  signedIn: boolean;
  depth?: number;
}) {
  return (
    <ul className={depth === 0 ? "space-y-4" : "mt-3 space-y-3 border-l border-neutral-800 pl-4"}>
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          slug={slug}
          comment={c}
          currentUserId={currentUserId}
          signedIn={signedIn}
          depth={depth}
        />
      ))}
    </ul>
  );
}

function CommentItem({
  slug,
  comment,
  currentUserId,
  signedIn,
  depth,
}: {
  slug: string;
  comment: CommentNode<CommentData>;
  currentUserId?: string;
  signedIn: boolean;
  depth: number;
}) {
  const [replying, setReplying] = useState(false);
  const author = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;

  return (
    <li className="flex gap-3">
      <Avatar username={author?.username ?? "?"} avatarUrl={author?.avatar_url} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {author?.username && (
            <Link href={`/u/${author.username}`} className="text-sm font-medium hover:underline">
              {author.username}
            </Link>
          )}
          <span className="text-xs text-neutral-500">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
          {currentUserId === comment.author_id && <DeleteCommentButton id={comment.id} />}
        </div>
        <p className="text-sm text-neutral-300 mt-0.5 whitespace-pre-wrap break-words">
          {comment.body}
        </p>

        <div className="flex items-center gap-3">
          <CommentReactions
            commentId={comment.id}
            initialReactions={comment.reactions}
            signedIn={signedIn}
          />
          {depth < 4 && (
            <button
              type="button"
              onClick={() => (signedIn ? setReplying((r) => !r) : undefined)}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              {signedIn ? (replying ? "Cancel" : "Reply") : (
                <Link href={`/login?next=/anim/${slug}`} className="hover:underline">
                  Reply
                </Link>
              )}
            </button>
          )}
        </div>

        {replying && (
          <ReplyForm slug={slug} parentId={comment.id} onDone={() => setReplying(false)} />
        )}

        {comment.children.length > 0 && (
          <CommentThread
            slug={slug}
            comments={comment.children}
            currentUserId={currentUserId}
            signedIn={signedIn}
            depth={depth + 1}
          />
        )}
      </div>
    </li>
  );
}
