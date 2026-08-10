import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" aria-label="SMIT AI Teaching Agent home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground" aria-label="Footer">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <Link href="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link href="/register" className="transition-colors hover:text-foreground">
              Register
            </Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Saylani Mass IT Training. An AI-assisted learning platform.</p>
          <p className="mt-1">Answers are generated from your uploaded course material only.</p>
        </div>
      </div>
    </footer>
  );
}
