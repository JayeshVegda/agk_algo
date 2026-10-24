import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Activity, ShieldCheck } from 'lucide-react';

const TICKERS = [
  { symbol: 'XAU/USD', name: 'Gold Spot', price: '2,748.50', change: '+0.84%', up: true, high: '2,752.10', low: '2,731.40' },
  { symbol: 'EUR/USD', name: 'Euro Dollar', price: '1.0842', change: '+0.18%', up: true, high: '1.0865', low: '1.0818' },
  { symbol: 'GBP/USD', name: 'Cable', price: '1.2985', change: '-0.08%', up: false, high: '1.3012', low: '1.2965' },
  { symbol: 'BTC/USD', name: 'Bitcoin', price: '68,420', change: '+2.65%', up: true, high: '68,950', low: '66,800' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: '2,635.80', change: '+1.92%', up: true, high: '2,660.00', low: '2,580.00' },
  { symbol: 'US30', name: 'Wall St 30', price: '42,410', change: '+0.35%', up: true, high: '42,550', low: '42,280' },
  { symbol: 'NAS100', name: 'Tech 100', price: '20,380', change: '+0.91%', up: true, high: '20,450', low: '20,190' },
  { symbol: 'DXY', name: 'USD Index', price: '104.15', change: '-0.12%', up: false, high: '104.40', low: '103.95' },
];

export function TickerBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#04060A] border-b border-border text-[11px] font-mono py-1.5 px-4 overflow-hidden select-none">
      <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto">
        {/* Session Status & Clock */}
        <div className="flex items-center gap-3 shrink-0 pr-4 border-r border-border">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-200 tracking-wider">
              LONDON / NY DESK
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {time}
          </span>
        </div>

        {/* Live Ticker Feed */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          {TICKERS.map((t, i) => (
            <div 
              key={i} 
              className="inline-flex items-center gap-2 hover:bg-slate-800/40 px-2 py-0.5 rounded-lg transition-colors cursor-default"
              title={`${t.name} · High: ${t.high} | Low: ${t.low}`}
            >
              <span className="font-bold text-slate-200">{t.symbol}</span>
              <span className="tabular-nums font-mono text-slate-300 font-medium">{t.price}</span>
              <span className={`tabular-nums font-semibold text-[10px] flex items-center gap-0.5 ${
                t.up ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {t.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {t.change}
              </span>
            </div>
          ))}
        </div>

        {/* Latency indicator */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0 pl-4 border-l border-border text-[10px] text-slate-500">
          <Activity className="h-3 w-3 text-emerald-400" />
          <span>Ping: <span className="text-emerald-400 font-bold">1.2ms</span></span>
        </div>
      </div>
    </div>
  );
}
