import { requireAdmin } from "@/lib/guards";
import { getDb, enrolments, payments, users } from "@akg/db";
import { eq, or, desc } from "drizzle-orm";
import { formatMoney, createMoney } from "@akg/core";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const db = getDb();

  // Metrics
  const paidEnrolments = await db
    .select()
    .from(enrolments)
    .where(eq(enrolments.status, "paid"));

  const pendingPayments = await db
    .select()
    .from(payments)
    .where(
      or(
        eq(payments.status, "pending"),
        eq(payments.status, "awaiting_confirmations"),
      ),
    );

  const confirmedPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.status, "confirmed"));

  const totalRevenueMinor = confirmedPayments.reduce((acc, p) => acc + p.amountMinor, 0);

  const recentPayments = await db
    .select({
      id: payments.id,
      amountMinor: payments.amountMinor,
      currency: payments.currency,
      status: payments.status,
      txid: payments.txid,
      createdAt: payments.createdAt,
      userEmail: users.email,
    })
    .from(payments)
    .innerJoin(users, eq(users.id, payments.userId))
    .orderBy(desc(payments.createdAt))
    .limit(5);

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Executive Summary</div>
        <h1 className="text-2xl font-bold mt-1">Admin Command Overview</h1>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase">Active Subscribers</div>
          <div className="text-3xl font-extrabold text-primary">{paidEnrolments.length}</div>
          <div className="text-[10px] text-muted-foreground">Current paid cycles</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase">Total Confirmed Revenue</div>
          <div className="text-3xl font-extrabold text-green-400">
            {formatMoney(createMoney(totalRevenueMinor, "USD"))}
          </div>
          <div className="text-[10px] text-muted-foreground">USDT / Blockchain settlements</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase">Pending Queue</div>
          <div className="text-3xl font-extrabold text-yellow-400">
            {pendingPayments.length}
          </div>
          <div className="text-[10px] text-muted-foreground">Requires TXID approval</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase">Total Orders</div>
          <div className="text-3xl font-extrabold text-foreground">{confirmedPayments.length}</div>
          <div className="text-[10px] text-muted-foreground">Subscriptions & Bots</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40 flex justify-between items-center">
          <span className="font-bold text-sm">Recent Transactions</span>
          <a href="/admin/payments" className="text-xs text-primary hover:underline">
            Manage Payments Queue →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Amount</th>
                <th className="p-3">TXID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-accent/20">
                  <td className="p-3 font-semibold text-foreground">{p.userEmail}</td>
                  <td className="p-3 font-mono font-bold">
                    {formatMoney(createMoney(p.amountMinor, p.currency))}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-muted-foreground">
                    {p.txid ? `${p.txid.slice(0, 16)}...` : "—"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === "confirmed"
                          ? "bg-green-500/20 text-green-400"
                          : p.status === "awaiting_confirmations"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-primary/20 text-primary"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-[11px]">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
