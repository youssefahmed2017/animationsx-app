import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isAdminPanelEnabled, verifyAdminSessionCookie } from "@/lib/adminAuth";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default async function AdminLoginPage() {
  if (!isAdminPanelEnabled()) notFound();

  const cookieStore = await cookies();
  const alreadySignedIn = verifyAdminSessionCookie(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (alreadySignedIn) redirect("/admin/dashboard");

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="text-xl font-semibold mb-1">Admin panel</h1>
      <p className="text-sm text-neutral-500 mb-6">Local development only.</p>
      <AdminLoginForm />
    </div>
  );
}
