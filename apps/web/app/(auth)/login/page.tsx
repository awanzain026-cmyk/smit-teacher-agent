import { AuthShell, AuthForm } from "@/components/auth/auth-shell";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <AuthShell>
      <AuthForm mode="login" />
    </AuthShell>
  );
}
