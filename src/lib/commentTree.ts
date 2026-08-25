export type CommentNode<T extends { id: string; parent_id: string | null }> = T & {
  children: CommentNode<T>[];
};

export function buildCommentTree<T extends { id: string; parent_id: string | null }>(
  flat: T[]
): CommentNode<T>[] {
  const byId = new Map<string, CommentNode<T>>();
  for (const c of flat) byId.set(c.id, { ...c, children: [] });

  const roots: CommentNode<T>[] = [];
  for (const c of flat) {
    const node = byId.get(c.id)!;
    const parent = c.parent_id ? byId.get(c.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
