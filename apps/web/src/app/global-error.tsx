"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white flex min-h-screen items-center justify-center p-4 font-mono">
        <div className="rounded border border-red-800 bg-neutral-950 p-6 max-w-md w-full space-y-4 text-center">
          <h2 className="text-xl font-bold text-red-500">Critical Application Fault</h2>
          <p className="text-xs text-neutral-400">
            A fatal error was intercepted by the global boundary.
          </p>
          <button
            onClick={() => reset()}
            className="rounded bg-neutral-800 px-4 py-2 text-xs font-semibold hover:bg-neutral-700"
          >
            Attempt Recovery
          </button>
        </div>
      </body>
    </html>
  );
}
