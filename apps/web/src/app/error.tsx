"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-8 max-w-md w-full space-y-5 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20 text-xl font-bold">
          !
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Operational Notice</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            The requested trading action or view encountered a transient interruption.
            {error.digest && (
              <span className="block mt-1 font-mono text-[10px] text-muted-foreground/80">
                Diagnostic Digest: {error.digest}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
          >
            Retry Action
          </button>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="flex-1 rounded-lg border border-border bg-secondary/50 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-lg border border-border bg-secondary/50 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
