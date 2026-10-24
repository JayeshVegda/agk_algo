"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: sessionData, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const isAdmin =
    sessionData?.user?.email?.toLowerCase().includes("admin") ||
    sessionData?.user?.email?.toLowerCase().includes("jayesh");

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-[#080b11]/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              <span className="font-mono text-sm font-extrabold text-white">AKG</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-base font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                AKG <span className="text-blue-400">ALGO</span>
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                Institutional Quant
              </span>
            </div>
          </Link>

          {/* Logged-in Primary Nav */}
          {sessionData && (
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-border/40 text-xs font-medium">
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/archive"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  pathname.startsWith("/dashboard/archive")
                    ? "bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                Signals Archive
              </Link>
              <Link
                href="/dashboard/bots"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  pathname.startsWith("/dashboard/bots")
                    ? "bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                Bot Store
              </Link>
              <Link
                href="/dashboard/connector"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  pathname.startsWith("/dashboard/connector")
                    ? "bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                Connector Demo
              </Link>
              <Link
                href="/dashboard/charts"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  pathname.startsWith("/dashboard/charts")
                    ? "bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                Charts
              </Link>
              <Link
                href="/dashboard/messages"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  pathname.startsWith("/dashboard/messages")
                    ? "bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                Broadcast Feed
              </Link>
            </nav>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isPending ? (
            <div className="h-8 w-20 bg-secondary/50 animate-pulse rounded-md" />
          ) : sessionData ? (
            <div className="flex items-center gap-2.5">
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm ${
                    pathname.startsWith("/admin")
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Admin Console
                </Link>
              )}

              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-foreground max-w-[150px] truncate">
                  {sessionData.user.name || sessionData.user.email}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {isAdmin ? "Institutional Admin" : "Active Member"}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="rounded-md border border-border/80 bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Sign out of current terminal session"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Pricing & Cycles
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-border/80 bg-secondary/40 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-500 transition-all"
              >
                Join Terminal
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
