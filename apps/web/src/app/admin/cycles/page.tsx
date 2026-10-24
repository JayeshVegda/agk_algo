import { requireAdmin } from "@/lib/guards";
import { getDb, cycles } from "@akg/db";
import { desc } from "drizzle-orm";
import CyclesManagementClient from "./cycles-client";

export default async function AdminCyclesPage() {
  await requireAdmin();
  const db = getDb();

  const allCycles = await db
    .select()
    .from(cycles)
    .orderBy(desc(cycles.startsOn));

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Subscription Architecture</div>
        <h1 className="text-2xl font-bold mt-1">Cycles Management</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure start/end periods, renewal priority audiences, and plan tier pricing.
        </p>
      </div>

      <CyclesManagementClient existingCycles={allCycles} />
    </div>
  );
}
