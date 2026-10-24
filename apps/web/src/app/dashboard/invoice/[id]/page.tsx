import { requireUser } from "@/lib/guards";
import { getDb, payments, paymentNetworks } from "@akg/db";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceClient from "./invoice-client";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireUser();
  const db = getDb();

  const rows = await db
    .select({
      payment: payments,
      network: paymentNetworks,
    })
    .from(payments)
    .innerJoin(paymentNetworks, eq(paymentNetworks.id, payments.networkId))
    .where(and(eq(payments.id, id), eq(payments.userId, ctx.user.id)))
    .limit(1);

  if (rows.length === 0) {
    notFound();
  }

  const { payment, network } = rows[0];

  return (
    <div className="max-w-xl mx-auto space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Deposit Order</div>
        <h1 className="text-2xl font-bold mt-1">Payment Invoice</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Invoice #{payment.id.slice(0, 8)} • Transfer exact amount to the blockchain address below.
        </p>
      </div>

      <InvoiceClient payment={payment} network={network} />
    </div>
  );
}
