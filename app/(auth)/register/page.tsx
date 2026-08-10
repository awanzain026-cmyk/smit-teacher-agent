import { AuthShell, AuthForm } from "@/components/auth/auth-shell";

export const metadata = {
  title: "Create an account",
};

export default function RegisterPage() {
  return (
    <AuthShell>
      <AuthForm mode="register" />
    </AuthShell>
  );
}
