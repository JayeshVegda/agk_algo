import { requireAdmin } from "@/lib/guards";
import { getDb, payments, paymentNetworks, users } from "@akg/db";
import { desc, eq } from "drizzle-orm";
import AdminPaymentsQueueClient from "./payments-queue";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const db = getDb();

  const allPayments = await db
    .select({
      id: payments.id,
      orderType: payments.orderType,
      amountMinor: payments.amountMinor,
      currency: payments.currency,
      asset: payments.asset,
      status: payments.status,
      txid: payments.txid,
      createdAt: payments.createdAt,
      userEmail: users.email,
      networkLabel: paymentNetworks.label,
    })
    .from(payments)
    .innerJoin(users, eq(users.id, payments.userId))
    .leftJoin(paymentNetworks, eq(paymentNetworks.id, payments.networkId))
    .orderBy(desc(payments.createdAt));

  const allNetworks = await db.select().from(paymentNetworks);

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Settlement Queue</div>
        <h1 className="text-2xl font-bold mt-1">Payments & Networks Control</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review submitted blockchain transaction hashes (TXIDs), approve/reject orders, and manage receiving addresses.
        </p>
      </div>

      <AdminPaymentsQueueClient payments={allPayments} networks={allNetworks} />
    </div>
  );
}
