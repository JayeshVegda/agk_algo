import React from 'react';

const TICKERS = [
  { symbol: 'XAU/USD', price: '2,748.50', change: '+0.84%', up: true },
  { symbol: 'EUR/USD', price: '1.0842', change: '+0.18%', up: true },
  { symbol: 'GBP/USD', price: '1.2985', change: '-0.08%', up: false },
  { symbol: 'BTC/USD', price: '68,420', change: '+2.65%', up: true },
  { symbol: 'ETH/USD', price: '2,635.80', change: '+1.92%', up: true },
  { symbol: 'US30', price: '42,410', change: '+0.35%', up: true },
  { symbol: 'NAS100', price: '20,380', change: '+0.91%', up: true },
];

export function TickerBar() {
  return (
    <div className="w-full bg-[#05080f] border-b border-border/80 text-[11px] font-mono py-1.5 px-4 overflow-hidden select-none">
      <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-border/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">LIVE FEED</span>
        </div>
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar whitespace-nowrap">
          {TICKERS.map((t, i) => (
            <div key={i} className="inline-flex items-center gap-2">
              <span className="font-semibold text-slate-200">{t.symbol}</span>
              <span className="tabular-nums text-slate-300">{t.price}</span>
              <span className={`tabular-nums font-medium text-[10px] ${t.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                {t.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
