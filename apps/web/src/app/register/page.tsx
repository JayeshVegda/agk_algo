"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { strings } from "@/lib/strings";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("root");
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("You must review and agree to the Terms of Service & Risk Disclosures");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Failed to create membership account");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-8 shadow-2xl">
          <div className="space-y-1 mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Member Enrolment
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-1">
              {strings.auth.registerTitle}
            </h2>
            <p className="text-xs text-muted-foreground">
              Create your institutional trading account to access algorithmic signals and bots
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400 mb-5 flex items-start gap-2">
              <span className="font-bold text-sm leading-none">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground/80">
                Full Name / Alias
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Jayesh Vegda"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground/80">
                {strings.auth.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="trader@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-foreground/80">
                  {strings.auth.passwordLabel}
                </label>
                <span className="text-[11px] text-muted-foreground/80">Default: root</span>
              </div>
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border bg-background text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-400 hover:underline">
                  Terms of Service
                </Link>{" "}
                and acknowledge the high-risk nature of CFD/forex trading.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              {loading ? "Creating Terminal Account..." : "Complete Enrolment"}
            </button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-5 border-t border-border/40 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 font-semibold hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
