import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isAdminPanelEnabled, verifyAdminSessionCookie } from "@/lib/adminAuth";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminDashboardPage() {
  if (!isAdminPanelEnabled()) notFound();

  const cookieStore = await cookies();
  const signedIn = verifyAdminSessionCookie(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!signedIn) redirect("/admin");

  return <AdminDashboard />;
}
