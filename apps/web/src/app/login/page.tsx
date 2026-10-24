"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { strings } from "@/lib/strings";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (needs2FA) {
        const res = await authClient.twoFactor.verifyTotp({
          code: totpCode,
        });
        if (res.error) {
          setError(res.error.message || "Invalid two-factor authentication code");
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
        });

        if (res.error) {
          if (res.error.status === 403 || res.error.message?.includes("two-factor")) {
            setNeeds2FA(true);
          } else {
            setError(res.error.message || "Invalid credentials");
          }
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 font-mono">
        <div>
          <div className="text-xs uppercase text-primary">Terminal Access</div>
          <h2 className="text-2xl font-bold mt-1">
            {needs2FA ? strings.auth.twoFactorTitle : strings.auth.loginTitle}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {needs2FA ? strings.auth.twoFactorPrompt : "Enter your account credentials to continue"}
          </p>
        </div>

        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          {!needs2FA ? (
            <>
              <div>
                <label className="block text-muted-foreground mb-1">
                  {strings.auth.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  placeholder="trader@example.com"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">
                  {strings.auth.passwordLabel}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-muted-foreground mb-1">6-Digit TOTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground text-center tracking-widest text-lg font-bold focus:border-primary focus:outline-none"
                placeholder="123456"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? strings.common.loading : needs2FA ? strings.auth.verifyButton : strings.auth.signInButton}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/40">
          Need an account?{" "}
          <a href="/register" className="text-primary hover:underline">
            Register here
          </a>
        </div>
      </div>
    </div>
  );
}
