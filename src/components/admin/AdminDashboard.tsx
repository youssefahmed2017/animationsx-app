"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  banned: boolean;
  created_at: string;
};

type AdminAnimation = {
  id: string;
  slug: string;
  title: string;
  category: string;
  author_id: string;
  view_count: number;
  fork_count: number;
  like_count: number;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
};

function authorUsername(a: AdminAnimation): string {
  if (!a.profiles) return "—";
  return Array.isArray(a.profiles) ? a.profiles[0]?.username ?? "—" : a.profiles.username;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "animations">("users");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [animations, setAnimations] = useState<AdminAnimation[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    if (res.ok) setUsers(json.users);
  }

  async function loadAnimations() {
    const res = await fetch("/api/admin/animations");
    const json = await res.json();
    if (res.ok) setAnimations(json.animations);
  }

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((json) => {
        if (json.users) setUsers(json.users);
      });
    fetch("/api/admin/animations")
      .then((res) => res.json())
      .then((json) => {
        if (json.animations) setAnimations(json.animations);
      });
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  async function toggleBan(user: AdminUser) {
    setBusyId(user.id);
    setErrorMessage("");
    const res = await fetch(`/api/admin/users/${user.id}/ban`, {
      method: user.banned ? "DELETE" : "POST",
    });
    setBusyId(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErrorMessage(json.error ?? "Something went wrong.");
      return;
    }
    loadUsers();
  }

  async function deleteUser(user: AdminUser) {
    if (!confirm(`Permanently delete ${user.username} and everything they've published?`)) return;
    setBusyId(user.id);
    setErrorMessage("");
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErrorMessage(json.error ?? "Something went wrong.");
      return;
    }
    loadUsers();
    loadAnimations();
  }

  async function deleteAnimation(animation: AdminAnimation) {
    if (!confirm(`Permanently delete "${animation.title}"?`)) return;
    setBusyId(animation.id);
    setErrorMessage("");
    const res = await fetch(`/api/admin/animations/${animation.slug}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErrorMessage(json.error ?? "Something went wrong.");
      return;
    }
    loadAnimations();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin panel</h1>
        <button
          onClick={handleLogout}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:border-neutral-500"
        >
          Log out
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("users")}
          className={`rounded-md px-3 py-1.5 text-sm border ${
            tab === "users"
              ? "border-neutral-400 bg-neutral-800"
              : "border-neutral-800 text-neutral-400 hover:border-neutral-600"
          }`}
        >
          Users {users ? `(${users.length})` : ""}
        </button>
        <button
          onClick={() => setTab("animations")}
          className={`rounded-md px-3 py-1.5 text-sm border ${
            tab === "animations"
              ? "border-neutral-400 bg-neutral-800"
              : "border-neutral-800 text-neutral-400 hover:border-neutral-600"
          }`}
        >
          Animations {animations ? `(${animations.length})` : ""}
        </button>
      </div>

      {errorMessage && <p className="text-sm text-red-400 mb-4">{errorMessage}</p>}

      {tab === "users" && (
        <div className="overflow-x-auto rounded-md border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-400 text-left">
              <tr>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users === null && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-neutral-500">
                    Loading…
                  </td>
                </tr>
              )}
              {users?.map((u) => (
                <tr key={u.id} className="border-t border-neutral-800">
                  <td className="px-3 py-2">{u.username}</td>
                  <td className="px-3 py-2 text-neutral-400">{u.email ?? "—"}</td>
                  <td className="px-3 py-2">
                    {u.banned ? (
                      <span className="text-red-400">Banned</span>
                    ) : (
                      <span className="text-neutral-500">Active</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-neutral-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => toggleBan(u)}
                      disabled={busyId === u.id}
                      className="rounded-md border border-neutral-700 px-2 py-1 text-xs hover:border-neutral-500 disabled:opacity-50 mr-2"
                    >
                      {u.banned ? "Unban" : "Ban"}
                    </button>
                    <button
                      onClick={() => deleteUser(u)}
                      disabled={busyId === u.id}
                      className="rounded-md border border-red-900 text-red-400 px-2 py-1 text-xs hover:border-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "animations" && (
        <div className="overflow-x-auto rounded-md border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-400 text-left">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Author</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Views</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {animations === null && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-neutral-500">
                    Loading…
                  </td>
                </tr>
              )}
              {animations?.map((a) => (
                <tr key={a.id} className="border-t border-neutral-800">
                  <td className="px-3 py-2">
                    <a href={`/anim/${a.slug}`} target="_blank" className="hover:underline">
                      {a.title}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-neutral-400">{authorUsername(a)}</td>
                  <td className="px-3 py-2 text-neutral-400">{a.category}</td>
                  <td className="px-3 py-2 text-neutral-500">{a.view_count}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => deleteAnimation(a)}
                      disabled={busyId === a.id}
                      className="rounded-md border border-red-900 text-red-400 px-2 py-1 text-xs hover:border-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
