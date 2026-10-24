import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { getDb, enrolments, payments, users } from "@akg/db";
import { eq, or, desc } from "drizzle-orm";
import { formatMoney, createMoney } from "@akg/core";

export const dynamic = "force-dynamic";

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
    .limit(8);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Operations Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Admin Command Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time subscriber metrics, cycle status, and blockchain settlement verification
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/signals"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all"
          >
            + Post Signal
          </Link>
          <Link
            href="/admin/broadcast"
            className="rounded-lg border border-border/80 bg-secondary/60 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            Broadcast Message
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active Subscribers
          </div>
          <div className="text-3xl font-extrabold text-foreground font-mono tabular-nums">
            {paidEnrolments.length}
          </div>
          <div className="text-[11px] text-muted-foreground">Current paid cycle seats</div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Confirmed Revenue
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
            {formatMoney(createMoney(totalRevenueMinor, "USD"))}
          </div>
          <div className="text-[11px] text-muted-foreground">USDT / Blockchain settlements</div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Pending Queue
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
            {pendingPayments.length}
          </div>
          <div className="text-[11px] text-amber-400/80">Requires manual TXID approval</div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Orders
          </div>
          <div className="text-3xl font-extrabold text-foreground font-mono tabular-nums">
            {confirmedPayments.length}
          </div>
          <div className="text-[11px] text-muted-foreground">Subscriptions & Bot licenses</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur overflow-hidden shadow-lg">
        <div className="p-5 border-b border-border/40 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-sm text-foreground">Recent Member Transactions</h2>
            <p className="text-[11px] text-muted-foreground">
              Review incoming USDT deposits, TXIDs, and processing states
            </p>
          </div>
          <Link
            href="/admin/payments"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            Manage Queue ({pendingPayments.length} Pending) →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] font-mono">
              <tr>
                <th className="p-3.5">Trader Email</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">TXID Reference</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-3.5 font-medium text-foreground">{p.userEmail}</td>
                    <td className="p-3.5 font-mono font-bold text-foreground tabular-nums">
                      {formatMoney(createMoney(p.amountMinor, p.currency))}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                      {p.txid ? `${p.txid.slice(0, 18)}...` : "—"}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          p.status === "confirmed"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : p.status === "awaiting_confirmations"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground text-[11px] font-mono">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
