"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client error with digest
    console.error("Client error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-lg border border-destructive/40 bg-card p-8 max-w-md w-full space-y-4">
        <div className="font-mono text-3xl font-bold text-destructive">System Alert</div>
        <h2 className="text-lg font-semibold">An unexpected exception occurred</h2>
        <p className="text-xs text-muted-foreground font-mono">
          {error.digest ? `Error reference: ${error.digest}` : "Please attempt to reload the view."}
        </p>
        <button
          onClick={() => reset()}
          className="rounded bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors font-mono"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
