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

    const isDark = document.documentElement.classList.contains('dark');

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
          theme: isDark ? 'dark' : 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: isDark ? '#0B0D14' : '#F5F7FA',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview_widget_container',
          hide_side_toolbar: false,
        });
      }
    };
    containerRef.current.appendChild(script);
  }, [selectedSymbol]);

  const activeSymbol = SYMBOLS.find((s) => s.id === selectedSymbol);

  return (
    <div className="space-y-6 font-sans text-akg-text">
      {/* Page Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-akg-accent">
            <BarChart3 className="h-3.5 w-3.5" />
            Market Charts
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-3xl">
            Multi-Asset Terminal
          </h1>
          <p className="mt-2 text-sm text-akg-muted">
            TradingView feeds covering metals, forex, crypto and index futures.
          </p>
        </div>

        {/* Symbol Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-akg-raised p-1 rounded-lg border border-akg-hairline">
          {SYMBOLS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSymbol(s.id)}
              className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                selectedSymbol === s.id
                  ? 'bg-akg-cta text-akg-cta-text shadow-sm'
                  : 'text-akg-muted hover:text-akg-text hover:bg-akg-card/50'
              }`}
            >
              <span>{s.label}</span>
              <span
                className={`rounded px-1 py-px font-mono text-[9px] tracking-wide ${
                  selectedSymbol === s.id ? 'bg-black/20 text-akg-cta-text' : 'bg-akg-card text-akg-muted border border-akg-hairline'
                }`}
              >
                {s.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Chart Viewport */}
      <div className="w-full overflow-hidden rounded-xl border border-akg-hairline bg-akg-card shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-akg-hairline px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="live-dot" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-akg-text">
              Chart feed
            </span>
          </div>
          <span className="font-mono text-xs text-akg-muted">{activeSymbol?.label}</span>
        </div>
        <div className="relative h-[650px] w-full">
          <div id="tradingview_widget_container" ref={containerRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
