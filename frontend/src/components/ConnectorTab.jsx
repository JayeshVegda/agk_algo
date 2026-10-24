import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Network, ShieldCheck, CheckCircle2, Lock, AlertTriangle, 
  Activity, Wifi, Terminal, Zap, Play, RefreshCw, Cpu,
  Clock, AlertCircle, ArrowRight, Server, Check
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

export function ConnectorTab({ user, onOpenAuth, notify }) {
  const [accountNumber, setAccountNumber] = useState('');
  const [server, setServer] = useState('ICMarkets-Demo01');
  const [platform, setPlatform] = useState('MT5');
  const [leverage, setLeverage] = useState('1:100');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [latency, setLatency] = useState(0.8);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [simulatingOrder, setSimulatingOrder] = useState(false);
  const [userRequests, setUserRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Ping fluctuation simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Number((0.7 + Math.random() * 0.4).toFixed(2)));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Fetch and subscribe to user's real-time connector inquiries
  const loadUserRequests = async () => {
    if (!user?.email) return;
    setLoadingRequests(true);
    try {
      const records = await pb.collection('connector_requests').getFullList({
        filter: `user_email = "${user.email}"`,
        sort: '-created'
      });
      setUserRequests(records);
    } catch (err) {
      console.error('Failed to load user connector requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      loadUserRequests();
      const unsub = pb.collection('connector_requests').subscribe('*', (e) => {
        loadUserRequests();
        if (e.action === 'update' && notify) {
          notify({
            type: 'info',
            title: 'Bridge Status Updated',
            message: `Desk updated connection status to: ${e.record.status.toUpperCase()}`
          });
        }
      }).catch(() => {});

      return () => { unsub?.then?.((u) => u && u()); };
    }
  }, [user?.email]);

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
        account_number: accountNumber.trim(),
        server: server.trim(),
        platform,
        leverage,
        risk_level: riskLevel,
        status: 'pending_review',
        admin_notes: 'Account received. Desk is initiating latency routing.'
      });

      setAccountNumber('');
      loadUserRequests();

      if (notify) {
        notify({
          type: 'success',
          title: 'Bridge Inquiry Submitted',
          message: `Request for ${platform} #${accountNumber} sent to AKG Desk`
        });
      }
    } catch (err) {
      if (notify) {
        notify({
          type: 'error',
          title: 'Submission Failed',
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

  const getStatusBadge = (st) => {
    switch (st) {
      case 'connected':
        return {
          label: 'Bridge Online (Equinix LD4)',
          class: 'bg-[#00D878]/15 text-[#00D878] border-[#00D878]/30',
          dot: 'bg-[#00D878]'
        };
      case 'in_progress':
        return {
          label: 'Desk Configuring Bridge',
          class: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-400 animate-ping'
        };
      case 'rejected':
        return {
          label: 'Connection Inactive / Rejected',
          class: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400'
        };
      default:
        return {
          label: 'Awaiting Desk Review',
          class: 'bg-[#F3C653]/15 text-[#F3C653] border-[#F3C653]/30',
          dot: 'bg-[#F3C653] animate-pulse'
        };
    }
  };

  return (
    <div className="w-full space-y-6 font-sans text-[#E7E9EF]">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#10141B] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="gold" className="gap-2 mb-2 font-mono">
              <Network className="h-3.5 w-3.5" />
              <span>TERMINAL CONNECTOR GATEWAY</span>
            </Badge>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              MetaTrader Low-Latency Bridge
            </h1>
            <p className="text-xs text-[#A6ADB9] font-mono mt-1">
              Sub-millisecond signal replication into MetaTrader 4 & MetaTrader 5 demo/live terminals.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00D878] animate-pulse" />
              <span className="text-[#A6ADB9]">Gateway:</span>
              <span className="text-[#00D878] font-bold tabular-nums">{latency}ms (Equinix LD4)</span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-WAY LIVE STATUS CARDS (Real-time updates from Admin Portal) */}
      {user && userRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono px-1">
            <span className="text-white font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00D878]" />
              <span>Your Registered Bridge Terminals (Live Two-Way Sync)</span>
            </span>
            <span className="text-[#A6ADB9] text-[11px]">{userRequests.length} Active Accounts</span>
          </div>

          <div className="grid gap-3">
            {userRequests.map((req) => {
              const statusInfo = getStatusBadge(req.status);

              return (
                <div 
                  key={req.id}
                  className="p-5 rounded-2xl border border-white/10 bg-[#10141B] space-y-3 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                        {req.platform}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white font-mono">
                          Account #{req.account_number}
                        </div>
                        <div className="text-xs text-[#A6ADB9] flex items-center gap-2 font-mono">
                          <span>Server: {req.server}</span>
                          <span>•</span>
                          <span>Leverage: {req.leverage || '1:100'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.class}`}>
                      <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  {/* Admin Live Notes Directive */}
                  {req.admin_notes && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono space-y-1">
                      <div className="text-[10px] text-[#A6ADB9] uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-[#00D878]" />
                        <span>Desk Administrator Operational Note</span>
                      </div>
                      <p className="text-white text-xs leading-relaxed">
                        "{req.admin_notes}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#A6ADB9] pt-1">
                    <span>Equinix Cross-Connect: <span className="text-[#00D878]">LD4 London Slough</span></span>
                    <span>Direct IPC: <span className="text-white">Active</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bridge Configuration Form */}
        <div className="rounded-2xl border border-white/10 bg-[#10141B] p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#F3C653]" />
            Request New Terminal Link
          </h3>

          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#F3C653]/30 bg-[#F3C653]/10 text-xs font-mono text-[#F3C653]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#F3C653] mt-0.5" />
            <p className="leading-relaxed">
              Security Protocol: Never submit master investor passwords here. Use demo accounts or read-only investor credentials for bridge configuration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A6ADB9] mb-1">Terminal Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#171D26] px-3.5 py-2.5 text-white cursor-pointer"
                >
                  <option value="MT5">MetaTrader 5 (MT5)</option>
                  <option value="MT4">MetaTrader 4 (MT4)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A6ADB9] mb-1">Account Leverage</label>
                <select
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#171D26] px-3.5 py-2.5 text-white cursor-pointer"
                >
                  <option value="1:100">1:100 Standard</option>
                  <option value="1:200">1:200 Medium</option>
                  <option value="1:500">1:500 High</option>
                  <option value="1:30">1:30 EU Regulated</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#A6ADB9] mb-1">Demo / Live Account Number</label>
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
              <label className="block text-[#A6ADB9] mb-1">Broker Server Name</label>
              <input
                type="text"
                required
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-white placeholder:text-[#A6ADB9] focus:border-[#F3C653] focus:outline-none"
                placeholder="e.g. ICMarketsSC-Live02 or Demo01"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full justify-center text-xs font-bold"
            >
              {submitting ? 'Transmitting to Desk...' : 'Submit Bridge Connection Request'}
            </Button>
          </form>
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
