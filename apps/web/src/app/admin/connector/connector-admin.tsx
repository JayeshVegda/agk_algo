"use client";

import { useState } from "react";
import { adminDecryptConnectorAction } from "@/actions/connector";

interface RequestRow {
  id: string;
  platform: string;
  accountNumber: string;
  server: string;
  status: string;
  createdAt: Date | string;
  userEmail: string;
}

export default function AdminConnectorClient({ requests }: { requests: RequestRow[] }) {
  const [decryptedData, setDecryptedData] = useState<{
    id: string;
    server: string;
    accountNumber: string;
    decryptedSecret: string;
  } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDecrypt = async (id: string) => {
    if (!confirm("Accessing master password will write an immutable audit log entry. Continue?")) {
      return;
    }

    setLoadingId(id);
    try {
      const res = await adminDecryptConnectorAction(id);
      setDecryptedData({
        id,
        server: res.server,
        accountNumber: res.accountNumber,
        decryptedSecret: res.decryptedSecret,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to decrypt credentials");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {decryptedData && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 space-y-2 text-xs">
          <div className="font-bold text-destructive flex items-center justify-between">
            <span>AUDITED CREDENTIAL VIEWPORT</span>
            <button
              onClick={() => setDecryptedData(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div>
              <span className="text-muted-foreground block text-[10px]">Server</span>
              <span className="font-semibold">{decryptedData.server}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Account #</span>
              <span className="font-semibold">{decryptedData.accountNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Decrypted Secret</span>
              <span className="font-bold text-green-400 font-mono">
                {decryptedData.decryptedSecret}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40 font-bold text-sm">
          Registered Sandbox Connections
        </div>
        {requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No connector demo entries registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Server</th>
                  <th className="p-3">Account #</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Security Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-accent/20">
                    <td className="p-3 font-semibold">{r.userEmail}</td>
                    <td className="p-3 font-bold text-primary">{r.platform}</td>
                    <td className="p-3 text-muted-foreground">{r.server}</td>
                    <td className="p-3 font-mono">{r.accountNumber}</td>
                    <td className="p-3 uppercase text-[10px] font-bold text-yellow-500">
                      {r.status}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDecrypt(r.id)}
                        disabled={loadingId === r.id}
                        className="rounded border border-border bg-accent/60 px-2.5 py-1 text-[11px] font-semibold hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        {loadingId === r.id ? "Decrypting..." : "Decrypt Credentials"}
                      </button>
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
