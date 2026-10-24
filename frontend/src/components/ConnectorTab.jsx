import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Network, ShieldCheck, CheckCircle2, Lock, AlertTriangle, 
  Activity, Wifi, Terminal, Zap, Play, RefreshCw, Cpu
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

export function ConnectorTab({ user, onOpenAuth, notify }) {
  const [accountNumber, setAccountNumber] = useState('');
  const [server, setServer] = useState('ICMarkets-Demo01');
  const [platform, setPlatform] = useState('MT4');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [latency, setLatency] = useState(0.8);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [simulatingOrder, setSimulatingOrder] = useState(false);

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
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-[#E7E9EF]">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#10141B] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="gold" className="gap-2 mb-2 font-mono">
              <Network className="h-3.5 w-3.5" />
              <span>SIMULATED TERMINAL BRIDGE (DEMO PROTOCOL)</span>
            </Badge>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              MetaTrader Low-Latency Bridge
            </h1>
            <p className="text-xs text-[#A6ADB9] font-mono mt-1">
              Test sub-millisecond execution packet routing into MT4 / MT5 demo terminals.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00D878] animate-pulse" />
              <span className="text-[#A6ADB9]">Gateway:</span>
              <span className="text-[#00D878] font-bold tabular-nums">{latency}ms (LD4)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bridge Configuration Form */}
        <div className="rounded-2xl border border-white/10 bg-[#10141B] p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#F3C653]" />
            Terminal Connection Parameters
          </h3>

          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#F3C653]/30 bg-[#F3C653]/10 text-xs font-mono text-[#F3C653]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#F3C653] mt-0.5" />
            <p className="leading-relaxed">
              Demo Isolation Protocol: Credentials are never transmitted to live financial brokers. Strictly sandbox execution for latency verification.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-6 space-y-3 font-mono">
              <div className="relative inline-flex mb-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D878] opacity-50"></span>
                <CheckCircle2 className="h-12 w-12 text-[#00D878] relative" />
              </div>
              <h3 className="text-lg font-bold text-white">Bridge Link Established!</h3>
              <p className="text-xs text-[#A6ADB9] max-w-sm mx-auto leading-relaxed">
                Simulated WebSocket bridge to {platform} server ({server}) is active. Round-trip ping: <span className="text-[#00D878] font-bold tabular-nums">{latency}ms</span>.
              </p>
              <div className="pt-3">
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                  className="text-xs"
                >
                  Configure Another Terminal
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#A6ADB9] mb-1">Terminal Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#171D26] px-3.5 py-2.5 text-white cursor-pointer"
                >
                  <option value="MT4">MetaTrader 4 (MT4 EA Bridge)</option>
                  <option value="MT5">MetaTrader 5 (MT5 EA Bridge)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A6ADB9] mb-1">Demo Account Number</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-white placeholder:text-[#A6ADB9] focus:border-[#F3C653] focus:outline-none"
                  placeholder="e.g. 50928192"
                />
              </div>

              <div>
                <label className="block text-[#A6ADB9] mb-1">Broker Demo Server</label>
                <input
                  type="text"
                  required
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-white placeholder:text-[#A6ADB9] focus:border-[#F3C653] focus:outline-none"
                  placeholder="e.g. ICMarkets-Demo01"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full justify-center text-xs font-bold"
              >
                {submitting ? 'Authenticating IPC Gateway...' : 'Initialize Demo Connection'}
              </Button>
            </form>
          )}
        </div>

        {/* Live Packet Sandbox & Simulation Console */}
        <div className="rounded-2xl border border-white/10 bg-[#10141B] p-6 shadow-xl flex flex-col justify-between font-mono text-xs space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#00D878]" />
                Live Execution Console
              </h3>
              <span className="text-[10px] text-[#00D878] flex items-center gap-1 font-bold">
                <Wifi className="h-3 w-3" />
                FIBER ONLINE
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-[#07090D] border border-white/10 p-3.5 h-48 overflow-y-auto space-y-2 text-[11px] font-mono">
              <div className="text-[#A6ADB9]">--- Real-time IPC Packet Trace ---</div>
              <div className="text-[#A6ADB9]">[SYSTEM] Bridge daemon listening on 127.0.0.1:8095</div>
              <div className="text-[#A6ADB9]">[CLOCK] Precision hardware timestamping (TSC) sync</div>
              
              {simulationLogs.map((log, idx) => (
                <div key={idx} className="text-[#00D878] flex items-start gap-2">
                  <span className="text-[#A6ADB9] tabular-nums">{log.time}</span>
                  <span>{log.text}</span>
                </div>
              ))}

              {simulatingOrder && (
                <div className="text-[#F3C653] flex items-center gap-2 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F3C653]"></span>
                  <span>Routing liquidity packet...</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/10">
            <Button
              variant="positive"
              onClick={handleSimulateExecution}
              disabled={simulatingOrder}
              className="w-full justify-center gap-2 text-xs font-bold"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Dispatch 0.01 Lot Demo Order (XAUUSD)</span>
            </Button>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-[#A6ADB9]">
              <div>Protocol: <span className="text-white">FIX 4.4 / WS</span></div>
              <div>Fill Slippage: <span className="text-[#00D878]">0.0 pips</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
