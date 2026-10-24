import Link from "next/link";
import { requireUser } from "@/lib/guards";

export const dynamic = "force-dynamic";

interface NavSection {
  title: string;
  items: { label: string; href: string; icon: string; badge?: string }[];
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireUser();

  const sections: NavSection[] = [
    {
      title: "Trading Intelligence",
      items: [
        { label: "Live Signals", href: "/dashboard", icon: "⚡" },
        { label: "Signals Archive", href: "/dashboard/archive", icon: "📊" },
        { label: "Broadcast Feed", href: "/dashboard/messages", icon: "📡", badge: "LIVE" },
      ],
    },
    {
      title: "Automation & Tools",
      items: [
        { label: "Bot Store (EA)", href: "/dashboard/bots", icon: "🤖" },
        { label: "Connector Demo", href: "/dashboard/connector", icon: "🔌", badge: "SANDBOX" },
        { label: "Charts & News", href: "/dashboard/charts", icon: "📈" },
        { label: "Verified Brokers", href: "/dashboard/brokers", icon: "🏛" },
      ],
    },
    {
      title: "Membership & Account",
      items: [
        { label: "Subscribe / Renew", href: "/dashboard/subscribe", icon: "💳" },
        { label: "Payment History", href: "/dashboard/payments", icon: "🧾" },
        { label: "Resources & Guides", href: "/dashboard/resources", icon: "📚" },
        { label: "Community & Social", href: "/dashboard/social", icon: "💬" },
        { label: "Account Security", href: "/dashboard/account", icon: "⚙" },
      ],
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-5.5rem)] flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-border/60 bg-[#090d16]/70 backdrop-blur p-4 shrink-0 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Member Card */}
          <div className="rounded-xl border border-border/60 bg-card/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Active Member
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  ctx.role === "admin"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {ctx.role === "admin" ? "Institutional Admin" : "Trader Pro"}
              </span>
            </div>
            <div className="text-xs font-semibold text-foreground truncate">
              {ctx.user.name || ctx.user.email}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border/30 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cycle 2 Active · Entitled</span>
            </div>
          </div>

          {/* Nav Sections */}
          <nav className="space-y-5 text-xs">
            {sections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{item.icon}</span>
                        <span className="font-medium group-hover:text-foreground">
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span className="rounded bg-blue-500/20 text-blue-400 px-1.5 py-0.2 text-[9px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Admin Quick Jump */}
        {ctx.role === "admin" && (
          <div className="pt-4 mt-6 border-t border-border/40">
            <Link
              href="/admin"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 px-3 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all shadow-sm"
            >
              <span>⚙</span>
              <span>Open Admin Console</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 p-5 md:p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
