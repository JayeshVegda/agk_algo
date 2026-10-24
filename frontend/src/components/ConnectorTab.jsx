import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Network, ShieldCheck, CheckCircle2, Lock, AlertTriangle, 
  Activity, Wifi, Terminal, Zap, Play, RefreshCw, Cpu
} from 'lucide-react';

export function ConnectorTab({ user, onOpenAuth, notify }) {
  const [accountNumber, setAccountNumber] = useState('');
  const [server, setServer] = useState('ICMarkets-Demo01');
  const [platform, setPlatform] = useState('MT4');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [latency, setLatency] = useState(0.8);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [simulatingOrder, setSimulatingOrder] = useState(false);

  // Fluctuating real-time latency pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Number((0.7 + Math.random() * 0.5).toFixed(2)));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    setSubmitting(true);
    try {
      await pb.collection('connector_requests').create({
        user_email: user.email,
        account_number: accountNumber,
        server,
        platform,
        status: 'demo_active'
      });
      setSubmitted(true);
      if (notify) {
        notify({
          type: 'success',
          title: 'Bridge Established',
          message: `Connected ${platform} #${accountNumber} to Equinix LD4 Gateway`
        });
      }
    } catch (err) {
      if (notify) {
        notify({
          type: 'error',
          title: 'Bridge Connection Failed',
          message: err.message
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateExecution = () => {
    setSimulatingOrder(true);
    setSimulationLogs([]);

    const steps = [
      { time: '0.0ms', text: `[IPC] Outbound packet created: ${platform} BUY 0.01 XAUUSD @ Market` },
      { time: '0.3ms', text: '[GATEWAY] Encrypted fiber routed via Equinix LD4 (London)' },
      { time: '0.7ms', text: '[MATCH] Institutional liquidity provider matched. Slip: 0.0 pips' },
      { time: '1.0ms', text: `[CONFIRM] Ticket #${Math.floor(100000 + Math.random() * 900000)} executed in 0.94ms` },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setSimulationLogs((prev) => [...prev, step]);
        if (idx === steps.length - 1) {
          setSimulatingOrder(false);
          if (notify) {
            notify({
              type: 'success',
              title: 'Packet Executed',
              message: 'Simulated 0.01 Lot fill confirmed in 0.94ms'
            });
          }
        }
      }, (idx + 1) * 350);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-semibold mb-2">
              <Network className="h-3.5 w-3.5" />
              SIMULATED TERMINAL BRIDGE (DEMO PROTOCOL)
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
              MetaTrader Low-Latency Bridge
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Test sub-millisecond execution packet routing into MT4 / MT5 demo terminals.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl border border-border bg-slate-50 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-500">Gateway:</span>
              <span className="text-emerald-400 font-bold tabular-nums">{latency}ms (LD4)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bridge Configuration Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-400" />
            Terminal Connection Parameters
          </h3>

          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <p className="leading-relaxed">
              Demo Isolation Protocol: Credentials are never transmitted to live financial brokers. Strictly sandbox execution for latency verification.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-6 space-y-3 font-mono">
              <div className="relative inline-flex mb-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
                <CheckCircle2 className="h-12 w-12 text-emerald-400 relative" />
              </div>
              <h3 className="text-lg font-bold text-white">Bridge Link Established!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Simulated WebSocket bridge to {platform} server ({server}) is active. Round-trip ping: <span className="text-emerald-400 font-bold tabular-nums">{latency}ms</span>.
              </p>
              <div className="pt-3">
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-slate-800 text-xs text-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Configure Another Terminal
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-500 mb-1">Terminal Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2.5 text-white cursor-pointer"
                >
                  <option value="MT4">MetaTrader 4 (MT4 EA Bridge)</option>
                  <option value="MT5">MetaTrader 5 (MT5 EA Bridge)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Demo Account Number</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. 50928192"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Broker Demo Server</label>
                <input
                  type="text"
                  required
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. ICMarkets-Demo01"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-glow-blue cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Authenticating IPC Gateway...' : 'Initialize Demo Connection'}
              </button>
            </form>
          )}
        </div>

        {/* Live Packet Sandbox & Simulation Console */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col justify-between font-mono text-xs space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Live Execution Console
              </h3>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                <Wifi className="h-3 w-3" />
                FIBER ONLINE
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 border border-border p-3.5 h-48 overflow-y-auto space-y-2 text-[11px] font-mono">
              <div className="text-slate-500">--- Real-time IPC Packet Trace ---</div>
              <div className="text-slate-500">[SYSTEM] Bridge daemon listening on 127.0.0.1:8095</div>
              <div className="text-slate-500">[CLOCK] Precision hardware timestamping (TSC) sync</div>
              
              {simulationLogs.map((log, idx) => (
                <div key={idx} className="text-emerald-400 flex items-start gap-2 animate-fadeIn">
                  <span className="text-slate-500 tabular-nums">{log.time}</span>
                  <span>{log.text}</span>
                </div>
              ))}

              {simulatingOrder && (
                <div className="text-blue-400 flex items-center gap-2 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                  <span>Routing liquidity packet...</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border/60">
            <button
              onClick={handleSimulateExecution}
              disabled={simulatingOrder}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-glow-emerald cursor-pointer disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Dispatch 0.01 Lot Demo Order (XAUUSD)
            </button>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
              <div>Protocol: <span className="text-slate-700">FIX 4.4 / WS</span></div>
              <div>Fill Slippage: <span className="text-emerald-400">0.0 pips</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
