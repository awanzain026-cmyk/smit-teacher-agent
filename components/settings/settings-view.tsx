"use client";

import { useCallback, useEffect, useState } from "react";
import {
  User as UserIcon,
  ShieldCheck,
  GraduationCap,
  FileText,
  MessagesSquare,
  BarChart3,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@smit/shared";

interface AdminStats {
  users: number;
  admins: number;
  documents: number;
  readyDocuments: number;
  conversations: number;
  messages: number;
  usage: { kind: string; count: number; tokensIn: number; tokensOut: number }[];
}

function roleBadge(role: UserRole) {
  return role === "ADMIN" ? "Admin" : "Student";
}

export function SettingsView() {
  const { user } = useAuth();
  const { error } = useToast();
  const isAdmin = user?.role === "ADMIN";

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(isAdmin);

  const loadStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setStatsLoading(true);
      const res = await api<{ stats: AdminStats }>("/api/v1/admin/stats");
      setStats(res.stats);
    } catch {
      error("Failed to load platform stats");
    } finally {
      setStatsLoading(false);
    }
  }, [isAdmin, error]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account and workspace details.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</dt>
              <dd className="mt-1">
                <Badge variant={isAdmin ? "default" : "secondary"}>{roleBadge(user.role)}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Member since</dt>
              <dd className="mt-1 text-sm text-foreground">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security
          </CardTitle>
          <CardDescription>How your account is protected.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          <p>
            Sessions use short-lived access tokens with rotating refresh tokens stored securely.
            Log out from the sidebar to end the current session on this device.
          </p>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Platform overview
            </CardTitle>
            <CardDescription>Last 30 days across your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Students", value: stats.users, icon: GraduationCap },
                  { label: "Documents", value: stats.documents, icon: FileText },
                  { label: "Ready documents", value: stats.readyDocuments, icon: FileText },
                  { label: "Conversations", value: stats.conversations, icon: MessagesSquare },
                  { label: "Messages", value: stats.messages, icon: MessagesSquare },
                  { label: "Admins", value: stats.admins, icon: ShieldCheck },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold leading-none text-foreground">{value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No stats available.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
