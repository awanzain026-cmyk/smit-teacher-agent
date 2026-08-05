"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Sparkles } from "lucide-react";
import { Label, Input, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden border-l border-border bg-card lg:block">
        <div className="absolute inset-0 -z-0">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-primary/20 blur-[110px]" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-accent-foreground/10 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-40 dark:opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Back to home">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-foreground">SMIT AI Teaching Agent</span>
          </Link>

          <div>
            <p className="text-sm font-medium text-primary">Every answer has a source</p>
            <blockquote className="mt-4 max-w-md text-balance text-2xl font-medium leading-snug tracking-tight text-foreground">
              “Ask a question. The agent answers only from your uploaded course material — and shows
              you exactly where each fact came from.”
            </blockquote>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Grounded retrieval, no hallucinations
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Saylani Mass IT Training
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthForm({
  mode,
}: {
  mode: "login" | "register";
}) {
  const router = useRouter();
  const { login, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isRegister = mode === "register";

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (isRegister && name.trim().length < 2) next.name = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (isRegister && confirm !== password) next.confirm = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      router.push("/chat");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {isRegister ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isRegister
          ? "Free for SMIT students. Start studying smarter today."
          : "Sign in to continue learning with your materials."}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
        {formError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        {isRegister ? (
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ayesha Khan"
            />
            {errors.name ? <FieldError>{errors.name}</FieldError> : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@smit.edu.pk"
          />
          {errors.email ? <FieldError>{errors.email}</FieldError> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {errors.password ? <FieldError>{errors.password}</FieldError> : null}
        </div>

        {isRegister ? (
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
            {errors.confirm ? <FieldError>{errors.confirm}</FieldError> : null}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {isRegister ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account? " : "New to the agent? "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-medium text-primary hover:underline"
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
