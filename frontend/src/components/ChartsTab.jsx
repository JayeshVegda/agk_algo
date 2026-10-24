import React, { useEffect, useRef } from 'react';
import { BarChart3 } from 'lucide-react';

export function ChartsTab() {
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
          symbol: 'OANDA:XAUUSD',
          interval: '60',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#070d17',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview_widget_container',
          hide_side_toolbar: false,
        });
      }
    };
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-card/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          <h2 className="text-base font-bold text-white">Live Institutional Chart Terminal</h2>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Default: <span className="text-emerald-400 font-bold">XAUUSD (Gold)</span> · Switch symbols directly in widget
        </div>
      </div>

      <div className="w-full h-[650px] rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xl relative">
        <div id="tradingview_widget_container" className="w-full h-full" ref={containerRef} />
      </div>
    </div>
  );
}
