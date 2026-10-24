"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvoiceAction } from "@/actions/payments";
import { bindBotAccountAction, getSignedBotDownloadUrlAction } from "@/actions/bots";
import { formatMoney, createMoney } from "@akg/core";

interface Props {
  bots: {
    id: string;
    name: string;
    description: string;
    platform: string;
    priceMinor: number;
    currency: string;
  }[];
  myLicenses: {
    licenseId: string;
    licenseKey: string;
    boundAccountNumber: string | null;
    rebindCount: number;
    status: string;
    botName: string;
    platform: string;
    createdAt: Date | string;
  }[];
  networks: { id: string; label: string; network: string }[];
}

export default function BotsViewClient({ bots, myLicenses, networks }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"catalog" | "my_bots">("catalog");
  const [bindingId, setBindingId] = useState<string | null>(null);
  const [accountInput, setAccountInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<Record<string, string>>({});

  const handleBuy = async (botId: string, priceMinor: number) => {
    if (networks.length === 0) {
      setError("No active payment networks available for purchase");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await createInvoiceAction({
        orderType: "bot_purchase",
        orderId: botId,
        networkId: networks[0].id,
        amountMinor: priceMinor,
      });

      router.push(`/dashboard/invoice/${res.payment.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initiate bot purchase");
      setLoading(false);
    }
  };

  const handleBind = async (licenseId: string) => {
    if (!accountInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      await bindBotAccountAction(licenseId, accountInput);
      setBindingId(null);
      setAccountInput("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to bind account");
    } finally {
      setLoading(false);
    }
  };

  const handleGetDownload = async (licenseId: string) => {
    try {
      const res = await getSignedBotDownloadUrlAction(licenseId);
      setDownloadLinks((prev) => ({ ...prev, [licenseId]: res.downloadUrl }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to obtain download URL");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Controls */}
      <div className="flex border-b border-border/40 text-xs">
        <button
          onClick={() => setTab("catalog")}
          className={`px-4 py-2 font-bold transition-colors ${
            tab === "catalog"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          EA Catalogue ({bots.length})
        </button>
        <button
          onClick={() => setTab("my_bots")}
          className={`px-4 py-2 font-bold transition-colors ${
            tab === "my_bots"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Licenses ({myLicenses.length})
        </button>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Catalog Tab */}
      {tab === "catalog" && (
        <div className="grid md:grid-cols-2 gap-6">
          {bots.map((bot) => (
            <div key={bot.id} className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{bot.name}</h3>
                  <span className="text-[10px] text-primary border border-primary/30 rounded px-2 py-0.5 mt-1 inline-block">
                    Platform: {bot.platform}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-foreground">
                    {formatMoney(createMoney(bot.priceMinor, bot.currency))}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">One-time license</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{bot.description}</p>

              <button
                onClick={() => handleBuy(bot.id, bot.priceMinor)}
                disabled={loading}
                className="w-full rounded bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Purchase License (USDT)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* My Licenses Tab */}
      {tab === "my_bots" && (
        <div className="space-y-4">
          {myLicenses.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
              You do not own any bot licenses yet. Browse the catalogue to acquire one.
            </div>
          ) : (
            myLicenses.map((lic) => (
              <div key={lic.licenseId} className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-border/20">
                  <div>
                    <h3 className="font-bold text-base">{lic.botName}</h3>
                    <span className="text-[10px] text-muted-foreground">Platform: {lic.platform}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase self-start sm:self-auto ${
                      lic.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {lic.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">License Key</span>
                    <span className="font-bold text-primary">{lic.licenseKey}</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-[10px] block">
                      Bound Trading Account ({lic.rebindCount}/3 rebinds used)
                    </span>
                    <span className="font-semibold">
                      {lic.boundAccountNumber || "Unbound (Any Account)"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-3 border-t border-border/20">
                  {downloadLinks[lic.licenseId] ? (
                    <a
                      href={downloadLinks[lic.licenseId]}
                      download
                      className="rounded bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-500 transition-colors"
                    >
                      Download Compiled EA (.ex4 / .ex5)
                    </a>
                  ) : (
                    <button
                      onClick={() => handleGetDownload(lic.licenseId)}
                      className="rounded bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Generate Secure Download Link
                    </button>
                  )}

                  {bindingId === lic.licenseId ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="MT Account #"
                        value={accountInput}
                        onChange={(e) => setAccountInput(e.target.value)}
                        className="rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                      />
                      <button
                        onClick={() => handleBind(lic.licenseId)}
                        className="rounded bg-accent px-3 py-1.5 text-xs font-semibold hover:bg-accent/80"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setBindingId(null)}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setBindingId(lic.licenseId)}
                      className="rounded border border-border bg-accent/40 px-3 py-2 text-xs font-semibold hover:bg-accent transition-colors"
                    >
                      Bind Account #
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
