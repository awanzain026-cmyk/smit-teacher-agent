"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, FileText, ShieldCheck, UserPlus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBytes, timeAgo } from "@/lib/utils";
import type { UserRole, DocumentStatus, Paginated } from "@smit/shared";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  documentCount: number;
}

interface AdminDoc {
  id: string;
  originalName: string;
  sizeBytes: number;
  status: DocumentStatus;
  chunkCount: number | null;
  failReason: string | null;
  courseName: string | null;
  user: { id: string; name: string; email: string };
  createdAt: string;
}

const ROLE_META: Record<UserRole, { label: string; variant: "default" | "secondary" }> = {
  ADMIN: { label: "Admin", variant: "default" },
  STUDENT: { label: "Student", variant: "secondary" },
};

export function AdminView() {
  const { user: me } = useAuth();
  const { toast, success, error } = useToast();

  const [tab, setTab] = useState<"users" | "documents">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [documents, setDocuments] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api<Paginated<AdminUser>>(`/api/v1/admin/users?limit=50${search ? `&search=${encodeURIComponent(search)}` : ""}`);
      setUsers(res.items);
    } catch {
      error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, error]);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api<Paginated<AdminDoc>>(`/api/v1/admin/documents?limit=50`);
      setDocuments(res.items);
    } catch {
      error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void (tab === "users" ? loadUsers() : loadDocuments());
  }, [tab, loadUsers, loadDocuments]);

  const changeRole = async (id: string, role: UserRole) => {
    setBusyId(id);
    try {
      await api(`/api/v1/admin/users/${id}/role`, { method: "PATCH", body: { role } });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      success("Role updated");
    } catch (err) {
      error("Failed to update role", err instanceof Error ? err.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (u: AdminUser) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})? Their documents and data will be removed.`)) return;
    setBusyId(u.id);
    try {
      await api(`/api/v1/admin/users/${u.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast("success", "User deleted");
    } catch (err) {
      error("Failed to delete user", err instanceof Error ? err.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  const pending = documents.filter((d) => d.status === "PENDING" || d.status === "PROCESSING").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage students and review platform content.</p>
        </div>
      </div>

      <div className="mb-5 flex gap-1 rounded-lg border border-border bg-card p-1">
        {(
          [
            { key: "users", label: "Users" },
            { key: "documents", label: "Documents" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={tab === t.key ? "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground" : "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Students
              </CardTitle>
              <CardDescription>Promote users to admins or remove accounts.</CardDescription>
            </div>
            <div className="w-56">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                aria-label="Search users"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <EmptyState
                icon={<UserPlus className="h-5 w-5" />}
                title={search ? "No matching users" : "No users yet"}
                description={search ? "Try a different search." : "Students appear here after they register."}
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {users.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {u.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {u.name}
                        {u.id === me?.id ? <span className="ml-1.5 text-xs text-muted-foreground">(you)</span> : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email} · Joined {timeAgo(u.createdAt)} · {u.documentCount} docs
                      </p>
                    </div>
                    <Badge variant={ROLE_META[u.role].variant}>{ROLE_META[u.role].label}</Badge>
                    {u.id !== me?.id ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === u.id}
                          onClick={() => void changeRole(u.id, u.role === "ADMIN" ? "STUDENT" : "ADMIN")}
                        >
                          {u.role === "ADMIN" ? "Demote" : "Make admin"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === u.id}
                          onClick={() => void removeUser(u)}
                          aria-label={`Delete ${u.name}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </CardTitle>
            <CardDescription>
              All uploaded documents across the platform{pending ? ` · ${pending} processing` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-5 w-5" />}
                title="No documents yet"
                description="Uploaded course material will appear here."
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{d.originalName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.user.name} · {d.user.email}
                        {d.courseName ? ` · ${d.courseName}` : ""} · {formatBytes(d.sizeBytes)} ·{" "}
                        {d.chunkCount != null ? `${d.chunkCount} chunks` : ""}
                      </p>
                      {d.status === "FAILED" && d.failReason ? (
                        <p className="mt-0.5 truncate text-xs text-destructive">{d.failReason}</p>
                      ) : null}
                    </div>
                    <DocumentStatusBadge status={d.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
