import { createServiceClient } from "@/lib/supabase/server";
import { deleteAnimationFile } from "@/lib/github";

/**
 * Deletes a user's published animations from the GitHub-hosted CSS registry,
 * then deletes their auth user (profiles/animations rows cascade via FKs in
 * supabase/schema.sql). Shared between self-service account deletion
 * (/api/account) and admin-initiated deletion (/api/admin/users/[id]).
 */
export async function deleteUserAccount(userId: string): Promise<{ error?: string }> {
  const service = createServiceClient();

  const { data: ownedAnimations } = await service
    .from("animations")
    .select("slug")
    .eq("author_id", userId);

  for (const animation of ownedAnimations ?? []) {
    try {
      await deleteAnimationFile(animation.slug);
    } catch {
      // Best-effort: an orphaned registry file isn't worth blocking account deletion over.
    }
  }

  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return {};
}
