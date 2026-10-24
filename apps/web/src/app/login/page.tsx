"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  const performSignIn = async (targetEmail: string, targetPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authClient.signIn.email({
        email: targetEmail,
        password: targetPass,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needs2FA) {
      setError(null);
      setLoading(true);
      try {
        const res = await authClient.twoFactor.verifyTotp({
          code: totpCode,
        });
        if (res.error) {
          setError(res.error.message || "Invalid two-factor authentication code");
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "2FA verification failed");
      } finally {
        setLoading(false);
      }
    } else {
      await performSignIn(email, password);
    }
  };

  const quickLogin = async (testEmail: string) => {
    setEmail(testEmail);
    setPassword("root");
    await performSignIn(testEmail, "root");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Main Card */}
        <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-8 shadow-2xl">
          <div className="space-y-1 mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Terminal Authentication
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-1">
              {needs2FA ? strings.auth.twoFactorTitle : "Sign In to Terminal"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {needs2FA
                ? strings.auth.twoFactorPrompt
                : "Enter your registered credentials to access your live algorithmic feeds"}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400 mb-5 flex items-start gap-2">
              <span className="font-bold text-sm leading-none">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {!needs2FA ? (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground/80">
                    {strings.auth.emailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="trader@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-foreground/80">
                      {strings.auth.passwordLabel}
                    </label>
                    <span className="text-[11px] text-muted-foreground/80">Password is: root</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-foreground/80">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-center font-mono text-xl tracking-widest text-foreground focus:border-blue-500 focus:outline-none"
                  placeholder="000000"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              {loading ? "Authenticating..." : needs2FA ? "Verify Code" : "Sign In to Terminal"}
            </button>
          </form>

          {/* Quick Demo Access Helpers */}
          <div className="mt-6 pt-5 border-t border-border/50 space-y-2.5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
              One-Click Quick Access (Password: root)
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => quickLogin("jayeshvegda@gmail.com")}
                disabled={loading}
                className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <span>👑 Jayesh Vegda (Admin Role)</span>
                <span className="text-[10px] font-mono text-amber-400">1-Click Login →</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin("admin@akgalgo.local")}
                disabled={loading}
                className="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition-colors"
              >
                <span>⚡ System Admin</span>
                <span className="text-[10px] font-mono text-blue-400">1-Click Login →</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin("user@akgalgo.local")}
                disabled={loading}
                className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                <span>📈 Demo Trader</span>
                <span className="text-[10px] font-mono text-emerald-400">1-Click Login →</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-5">
            New trader?{" "}
            <Link href="/register" className="text-blue-400 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
