import { requireUser } from "@/lib/guards";
import { getDb, payments, paymentNetworks } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import { formatMoney, createMoney } from "@akg/core";

export default async function UserPaymentsPage() {
  const ctx = await requireUser();
  const db = getDb();

  const userPayments = await db
    .select({
      id: payments.id,
      orderType: payments.orderType,
      amountMinor: payments.amountMinor,
      currency: payments.currency,
      asset: payments.asset,
      status: payments.status,
      txid: payments.txid,
      createdAt: payments.createdAt,
      networkLabel: paymentNetworks.label,
    })
    .from(payments)
    .leftJoin(paymentNetworks, eq(paymentNetworks.id, payments.networkId))
    .where(eq(payments.userId, ctx.user.id))
    .orderBy(desc(payments.createdAt));

  return (
    <div className="space-y-6 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Billing & Invoices</div>
        <h1 className="text-2xl font-bold mt-1">Payment History</h1>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {userPayments.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No payment history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">Invoice ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Network</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {userPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/20">
                    <td className="p-3 font-semibold">{p.id.slice(0, 8)}...</td>
                    <td className="p-3 uppercase text-[11px] text-muted-foreground">
                      {p.orderType.replace("_", " ")}
                    </td>
                    <td className="p-3 font-bold text-foreground">
                      {formatMoney(createMoney(p.amountMinor, p.currency))} ({p.asset})
                    </td>
                    <td className="p-3 text-muted-foreground">{p.networkLabel || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === "confirmed"
                            ? "bg-green-500/20 text-green-400"
                            : p.status === "awaiting_confirmations"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : p.status === "rejected" || p.status === "expired"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-primary/20 text-primary"
                        }`}
                      >
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <a
                        href={`/dashboard/invoice/${p.id}`}
                        className="text-primary hover:underline text-[11px]"
                      >
                        View Invoice →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
