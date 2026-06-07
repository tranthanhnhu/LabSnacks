"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";

type RoleRow = { id: string; name: string; slug: string };
type UserRow = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  role: RoleRow;
};

export default function UsersPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const allowed = user?.role.slug === "ADMIN";

  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<UserRow[]>("/api/users", { token }),
    enabled: !!token && allowed,
  });

  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiFetch<RoleRow[]>("/api/roles", { token }),
    enabled: !!token && allowed,
  });

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("changeme123");
  const [roleId, setRoleId] = useState("");

  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createUser = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/users", {
        method: "POST",
        token,
        body: JSON.stringify({ email, name, password, roleId }),
      });
    },
    onSuccess: () => {
      toast.success("User created.");
      qc.invalidateQueries({ queryKey: ["users"] });
      setEmail("");
      setName("");
    },
    onError: (e) => toast.fromError(e, "Could not create user."),
  });

  const updateUser = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      const body: Record<string, string> = {};
      if (editName !== editUser.name) body.name = editName;
      if (editEmail !== editUser.email) body.email = editEmail;
      if (editRoleId !== editUser.role.id) body.roleId = editRoleId;
      if (editPassword.trim()) body.password = editPassword;
      await apiFetch(`/api/users/${editUser.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      toast.success("User updated.");
      setEditUser(null);
      setEditPassword("");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.fromError(e, "Could not update user."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/users/${id}`, { method: "DELETE", token });
    },
    onSuccess: () => {
      toast.success("User deleted.");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.fromError(e, "Could not delete user."),
  });

  function openEdit(u: UserRow) {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRoleId(u.role.id);
    setEditPassword("");
  }

  if (!allowed) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-error-container/20 p-8 text-center font-headline">
        Only Admins can manage users.
      </div>
    );
  }

  if (users.isLoading) return <p className="text-on-surface-variant">Loading…</p>;
  if (users.error)
    return <p className="text-error">{users.error instanceof ApiError ? users.error.message : "Error"}</p>;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-headline text-5xl font-extrabold text-primary">User Management</h1>
        <p className="text-on-surface-variant">Create accounts and assign roles for your lab team.</p>
      </header>

      <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
        <h2 className="font-headline text-lg font-bold">Add user</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            className="rounded-2xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-2xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="password"
            className="rounded-2xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select
            className="rounded-2xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            <option value="">— role —</option>
            {roles.data?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={!email || !name || !roleId || createUser.isPending}
          onClick={() => createUser.mutate()}
          className="mt-4 rounded-full bg-primary px-8 py-3 font-headline font-bold text-on-primary disabled:opacity-50"
        >
          Create account
        </button>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-lg)] bg-surface-container-lowest sticker-shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-highest font-headline">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u.id} className="border-t border-outline-variant/10">
                <td className="px-4 py-3 font-headline font-bold">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-tertiary-container px-3 py-1 text-xs font-bold text-on-tertiary-container">
                    {u.role.slug}
                  </span>
                </td>
                <td className="space-x-2 px-4 py-3 text-right">
                  <button
                    type="button"
                    className="text-xs font-bold text-primary"
                    onClick={() => openEdit(u)}
                  >
                    Edit
                  </button>
                  {u.id !== user?.id && (
                    <button
                      type="button"
                      className="text-xs font-bold text-error"
                      onClick={() => setDeleteId(u.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {editUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setEditUser(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-[var(--radius-lg)] bg-surface-container-lowest p-6 shadow-xl ring-1 ring-outline-variant/15">
            <h2 className="font-headline text-xl font-bold">Edit user</h2>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
              />
              <input
                className="w-full rounded-xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Email"
              />
              <select
                className="w-full rounded-xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
                value={editRoleId}
                onChange={(e) => setEditRoleId(e.target.value)}
              >
                {roles.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <input
                type="password"
                className="w-full rounded-xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="New password (leave blank to keep)"
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="rounded-full px-5 py-2 text-sm font-bold text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateUser.isPending}
                onClick={() => updateUser.mutate()}
                className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete user?"
        message="This account will be permanently removed."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
