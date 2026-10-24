import { requireUser } from "@/lib/guards";
import { getDb, cycles, paymentNetworks } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import SubscribeClientForm from "./client-form";

export const dynamic = "force-dynamic";

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
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b border-border/40 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Cycle Enrolment
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
          Subscribe / Renew Cycle
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select your target cycle, signal plan tier, and USDT payment network to generate a blockchain settlement invoice
        </p>
      </div>

      <SubscribeClientForm cycles={activeCycles} networks={networks} />
    </div>
  );
}
