import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Compass } from 'lucide-react';

const SYMBOLS = [
  { id: 'OANDA:XAUUSD', label: 'Gold (XAU/USD)', tag: 'COMMODITY' },
  { id: 'FX:EURUSD', label: 'Euro (EUR/USD)', tag: 'FOREX' },
  { id: 'FX:GBPUSD', label: 'Cable (GBP/USD)', tag: 'FOREX' },
  { id: 'BINANCE:BTCUSDT', label: 'Bitcoin (BTC/USDT)', tag: 'CRYPTO' },
  { id: 'CAPITALCOM:US30', label: 'US Wall St 30', tag: 'INDEX' },
  { id: 'CAPITALCOM:NAS100', label: 'US Tech 100', tag: 'INDEX' },
];

export function ChartsTab() {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0].id);
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && containerRef.current) {
        new window.TradingView.widget({
          autosize: true,
          symbol: selectedSymbol,
          interval: '60',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#05070D',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview_widget_container',
          hide_side_toolbar: false,
        });
      }
    };
    containerRef.current.appendChild(script);
  }, [selectedSymbol]);

  return (
    <div className="space-y-4">
      {/* Top Header & Symbol Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-sans">Institutional Multi-Asset Terminal</h2>
            <div className="text-xs font-mono text-slate-400">TradingView Live Feeds · 60m Default Horizon</div>
          </div>
        </div>

        {/* Quick Symbol Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          {SYMBOLS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSymbol(s.id)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedSymbol === s.id
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold shadow-sm'
                  : 'border-border/80 bg-card text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span>{s.label}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                {s.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Chart Viewport */}
      <div className="w-full h-[650px] rounded-2xl border border-border bg-card overflow-hidden shadow-2xl relative">
        <div id="tradingview_widget_container" className="w-full h-full" ref={containerRef} />
      </div>
    </div>
  );
}
