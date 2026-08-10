"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessagesSquare,
  FolderOpen,
  BookOpen,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="grid flex-1 gap-4 md:grid-cols-[240px_1fr]">
          <Skeleton className="hidden h-full rounded-lg md:block" />
          <Skeleton className="h-full rounded-lg" />
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/chat", label: "Chat", icon: MessagesSquare },
    { href: "/documents", label: "Documents", icon: FolderOpen },
    { href: "/courses", label: "Courses", icon: BookOpen },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (href: string) =>
    href === "/chat" ? pathname.startsWith("/chat") : pathname.startsWith(href);

  const SidebarContent = (
    <>
      <div className="flex h-14 items-center justify-between border-b border-border/60 px-4">
        <Link href="/chat" aria-label="Dashboard home">
          <Logo />
        </Link>
        <button
          className="rounded p-1 text-muted-foreground hover:text-foreground md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main">
        <Link href="/chat" className="mb-2 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted">
          <Plus className="h-4 w-4 text-primary" />
          New conversation
        </Link>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3">
        <Dropdown
          trigger={
            <span className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted">
              <Avatar name={user.name} src={user.avatarUrl} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
            </span>
          }
        >
          <div className="px-2.5 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Signed in as {user.role === "ADMIN" ? "Administrator" : "Student"}
            </p>
          </div>
          <DropdownItem icon={<LogOut className="h-4 w-4" />} danger onSelect={() => void logout()}>
            Sign out
          </DropdownItem>
        </Dropdown>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {SidebarContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
          <button
            className="rounded p-1.5 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
