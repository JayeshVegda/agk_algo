"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { strings } from "@/lib/strings";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
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
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 font-mono">
        <div>
          <div className="text-xs uppercase text-primary">New Member</div>
          <h2 className="text-2xl font-bold mt-1">{strings.auth.registerTitle}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Access algorithmic trading intelligence and bots
          </p>
        </div>

        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1">Full Name / Alias</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
              placeholder="Trader Alex"
            />
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">{strings.auth.emailLabel}</label>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-border"
            />
            <label htmlFor="terms" className="text-[11px] text-muted-foreground leading-tight">
              I agree to the{" "}
              <a href="/terms" target="_blank" className="text-primary underline">
                Terms of Service
              </a>{" "}
              and acknowledge that trading algorithms involve substantial financial risk.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? strings.common.loading : strings.auth.registerButton}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/40">
          Already registered?{" "}
          <a href="/login" className="text-primary hover:underline">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
