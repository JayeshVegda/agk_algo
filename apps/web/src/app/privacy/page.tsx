export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8">
      <div className="border-b border-border/40 pb-6">
        <div className="text-xs font-semibold text-primary uppercase tracking-wider">
          Compliance & Legal
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1">
          Privacy Policy
        </h1>
        <p className="text-xs text-muted-foreground mt-2">
          Effective Date: January 1, 2026 · Institutional Data Protection Standards
        </p>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
          <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            AKG ALGO collects minimal data necessary to provision algorithmic intelligence and
            software license keys: account credentials (email, hashed authentication tokens), cycle
            enrolment status, and manual blockchain transaction IDs submitted for USDT order
            verification.
          </p>
          <p>
            We do NOT store unencrypted financial account passwords, raw private keys, or trading
            account credentials. Connector simulation configurations are encrypted at rest with
            AES-256-GCM.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
          <h2 className="text-base font-semibold text-foreground">2. Use of Information</h2>
          <p>
            Your information is used solely to authenticate your session, verify cycle-based
            entitlements, issue hardware-bound MetaTrader license files, and transmit real-time
            broadcast intelligence via server-sent events.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
          <h2 className="text-base font-semibold text-foreground">3. Self-Hosted Data Isolation</h2>
          <p>
            AKG ALGO runs on an isolated self-hosted database instance. No telemetry, user activity
            logs, or trading parameters are transmitted to third-party ad networks or brokers.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
          <h2 className="text-base font-semibold text-foreground">4. Contact & Data Access</h2>
          <p>
            For compliance queries or account deletion requests, reach our systems administration
            team via the internal broadcast feed or support terminal.
          </p>
        </section>
      </div>
    </div>
  );
}
