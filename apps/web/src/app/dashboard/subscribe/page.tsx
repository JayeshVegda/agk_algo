import { requireUser } from "@/lib/guards";
import { getDb, cycles, paymentNetworks } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import SubscribeClientForm from "./client-form";

export default async function SubscribePage() {
  await requireUser();
  const db = getDb();

  const activeCycles = await db
    .select()
    .from(cycles)
    .orderBy(desc(cycles.startsOn))
    .limit(3);

  const networks = await db
    .select()
    .from(paymentNetworks)
    .where(eq(paymentNetworks.enabled, true));

  return (
    <div className="max-w-2xl mx-auto space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Enrolment</div>
        <h1 className="text-2xl font-bold mt-1">Subscribe / Renew Cycle</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Select your algorithmic tier and payment network to generate a blockchain invoice.
        </p>
      </div>

      <SubscribeClientForm cycles={activeCycles} networks={networks} />
    </div>
  );
}
