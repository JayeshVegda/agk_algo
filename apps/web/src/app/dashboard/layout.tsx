import { requireUser } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireUser();

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Archive", href: "/dashboard/archive" },
    { label: "Subscribe / Renew", href: "/dashboard/subscribe" },
    { label: "My Payments", href: "/dashboard/payments" },
    { label: "Bot Store", href: "/dashboard/bots" },
    { label: "Connector Demo", href: "/dashboard/connector" },
    { label: "Charts & News", href: "/dashboard/charts" },
    { label: "Brokers", href: "/dashboard/brokers" },
    { label: "Resources", href: "/dashboard/resources" },
    { label: "Social", href: "/dashboard/social" },
    { label: "Broadcast Feed", href: "/dashboard/messages" },
    { label: "Account", href: "/dashboard/account" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col md:flex-row font-mono">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border/40 bg-card/60 p-4 shrink-0">
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Trader Terminal
        </div>
        <div className="text-xs font-semibold text-primary truncate mb-6 pb-2 border-b border-border/30">
          {ctx.user.name || ctx.user.email}
          {ctx.role === "admin" && (
            <span className="ml-2 rounded bg-destructive/20 text-destructive px-1.5 py-0.5 text-[10px]">
              ADMIN
            </span>
          )}
        </div>

        <nav className="space-y-1 text-xs">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center rounded px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}

          {ctx.role === "admin" && (
            <div className="pt-4 mt-4 border-t border-border/40">
              <a
                href="/admin"
                className="flex items-center rounded px-3 py-2 text-primary font-bold bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                ⚙ Admin Panel
              </a>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
