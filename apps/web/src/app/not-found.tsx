import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-lg border border-border bg-card p-8 max-w-md w-full space-y-4">
        <div className="font-mono text-4xl font-bold text-primary">404</div>
        <h2 className="text-xl font-semibold">Page Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested terminal resource could not be found or has moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors font-mono"
        >
          Return to Terminal
        </Link>
      </div>
    </div>
  );
}
