import { requireUser } from "@/lib/guards";
import { getDb, termsAcceptances } from "@akg/db";
import { eq, desc } from "drizzle-orm";

export default async function AccountPage() {
  const ctx = await requireUser();
  const db = getDb();

  const userTerms = await db
    .select()
    .from(termsAcceptances)
    .where(eq(termsAcceptances.userId, ctx.user.id))
    .orderBy(desc(termsAcceptances.acceptedAt))
    .limit(1);

  const lastAccepted = userTerms[0] || null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-mono text-xs">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Account Profile</div>
        <h1 className="text-2xl font-bold mt-1">Terminal Settings</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border/20">
            User Credentials
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">Display Name</span>
              <span className="font-semibold text-sm">{ctx.user.name || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">Email Address</span>
              <span className="font-semibold text-sm">{ctx.user.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">Role Privilege</span>
              <span className="font-semibold uppercase text-primary">{ctx.role}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">Member Since</span>
              <span className="font-semibold">{new Date(ctx.user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/20">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border/20">
            Security & Authentication
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">Two-Factor Authentication (TOTP)</div>
              <div className="text-muted-foreground text-[11px]">
                {ctx.user.twoFactorEnabled
                  ? "TOTP authenticator app is active on this account."
                  : "Two-Factor authentication is not enabled."}
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                ctx.user.twoFactorEnabled
                  ? "bg-green-500/20 text-green-400"
                  : "bg-accent text-muted-foreground"
              }`}
            >
              {ctx.user.twoFactorEnabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/20">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border/20">
            Terms & Risk Disclosures
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">Agreement Version</div>
              <div className="text-muted-foreground text-[11px]">
                {lastAccepted
                  ? `Accepted v${lastAccepted.termsVersion} on ${new Date(lastAccepted.acceptedAt).toLocaleDateString()}`
                  : "No formal acceptance record on file."}
              </div>
            </div>
            <a href="/terms" className="text-primary hover:underline text-xs">
              Review Terms →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
