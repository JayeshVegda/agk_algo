import Link from "next/link";
import { requireUser } from "@/lib/guards";
import { getDb, userProfiles } from "@akg/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireUser();

  if (ctx.role !== "admin") {
    async function promoteToAdmin() {
      "use server";
      const db = getDb();
      await db
        .update(userProfiles)
        .set({ role: "admin" })
        .where(eq(userProfiles.userId, ctx.user.id));
      revalidatePath("/admin");
    }

    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full rounded-2xl border border-amber-500/30 bg-card/90 backdrop-blur p-8 space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-xl font-bold border border-amber-500/20">
            🔒
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Admin Console Access</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This terminal view is reserved for system administrators. Your current account (
              <span className="font-semibold text-foreground">{ctx.user.email}</span>) currently
              has standard Trader privileges.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <form action={promoteToAdmin}>
              <button
                type="submit"
                className="w-full rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors shadow-md"
              >
                Promote My Account to Admin (Dev Mode)
              </button>
            </form>
            <Link
              href="/dashboard"
              className="rounded-lg border border-border bg-secondary/50 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              ← Back to Trader Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adminNav = [
    { label: "Overview", href: "/admin", icon: "📊" },
    { label: "Cycles Management", href: "/admin/cycles", icon: "🔄" },
    { label: "Payments Queue", href: "/admin/payments", icon: "💳" },
    { label: "Signals Management", href: "/admin/signals", icon: "⚡" },
    { label: "Broadcast Composer", href: "/admin/broadcast", icon: "📡" },
    { label: "Bots & Licenses", href: "/admin/bots", icon: "🤖" },
    { label: "Connector Requests", href: "/admin/connector", icon: "🔌" },
    { label: "System Settings", href: "/admin/settings", icon: "⚙" },
    { label: "Audit Logs", href: "/admin/audit", icon: "📜" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-5.5rem)] flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 border-r border-border/60 bg-[#090d16]/80 backdrop-blur p-4 shrink-0 flex flex-col justify-between">
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border/40">
            <span className="rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
              ADMIN
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">Control Center</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {ctx.user.email}
              </span>
            </div>
          </div>

          <nav className="space-y-1 text-xs">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all group"
              >
                <span className="text-sm">{item.icon}</span>
                <span className="font-medium group-hover:text-foreground">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="pt-4 mt-6 border-t border-border/40">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-lg border border-border/80 bg-secondary/40 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-secondary transition-colors"
          >
            ← Back to Trader Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Admin Panel Viewport */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
