import { requireAdmin } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  const adminNav = [
    { label: "Overview", href: "/admin" },
    { label: "Cycles", href: "/admin/cycles" },
    { label: "Payments Queue", href: "/admin/payments" },
    { label: "Signals Management", href: "/admin/signals" },
    { label: "Broadcast Composer", href: "/admin/broadcast" },
    { label: "Bots & Licenses", href: "/admin/bots" },
    { label: "Connector Requests", href: "/admin/connector" },
    { label: "System Settings", href: "/admin/settings" },
    { label: "Audit Logs", href: "/admin/audit" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col md:flex-row font-mono">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 border-r border-border/40 bg-card/90 p-4 shrink-0">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/30">
          <span className="rounded bg-destructive/20 text-destructive px-2 py-0.5 text-[10px] font-bold">
            ADMIN
          </span>
          <span className="text-xs font-bold text-foreground">Control Center</span>
        </div>

        <nav className="space-y-1 text-xs">
          {adminNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center rounded px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}

          <div className="pt-4 mt-4 border-t border-border/40">
            <a
              href="/dashboard"
              className="flex items-center rounded px-3 py-2 text-primary hover:bg-primary/10 transition-colors"
            >
              ← Back to Trader Dashboard
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Admin Panel Viewport */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
