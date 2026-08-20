import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountForm from "@/components/AccountForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AccountForm
      initialUsername={profile?.username ?? ""}
      initialEmail={user.email ?? ""}
      initialAvatarUrl={profile?.avatar_url ?? ""}
      initialBio={profile?.bio ?? ""}
    />
  );
}
