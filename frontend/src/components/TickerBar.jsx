import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Globe } from 'lucide-react';

const TICKERS = [
  { symbol: 'XAU/USD', name: 'Gold', price: '2,748.50', change: '+0.84%', up: true },
  { symbol: 'EUR/USD', name: 'Euro', price: '1.0842', change: '+0.18%', up: true },
  { symbol: 'GBP/USD', name: 'Cable', price: '1.2985', change: '-0.08%', up: false },
  { symbol: 'BTC/USD', name: 'Bitcoin', price: '68,420', change: '+2.65%', up: true },
  { symbol: 'ETH/USD', name: 'Ethereum', price: '2,635.80', change: '+1.92%', up: true },
  { symbol: 'US30', name: 'Dow Jones', price: '42,410', change: '+0.35%', up: true },
  { symbol: 'NAS100', name: 'Nasdaq', price: '20,380', change: '+0.91%', up: true },
  { symbol: 'DXY', name: 'USD Index', price: '104.15', change: '-0.12%', up: false },
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
    <div className="w-full bg-[#05080e] border-b border-border/80 text-[11px] font-mono py-1.5 px-4 overflow-hidden select-none">
      <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto">
        {/* Market Status & Clock */}
        <div className="flex items-center gap-3 shrink-0 pr-4 border-r border-border/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-300 tracking-wider">
            LONDON / NY DESK
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-500">
            <Clock className="h-3 w-3" />
            {time}
          </span>
        </div>

        {/* Live Ticker Feed */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          {TICKERS.map((t, i) => (
            <div 
              key={i} 
              className="inline-flex items-center gap-2 hover:bg-slate-800/40 px-2 py-0.5 rounded transition-colors"
            >
              <span className="font-bold text-slate-200">{t.symbol}</span>
              <span className="tabular-nums font-mono text-slate-300">{t.price}</span>
              <span className={`tabular-nums font-semibold text-[10px] flex items-center gap-0.5 ${
                t.up ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {t.up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {t.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
