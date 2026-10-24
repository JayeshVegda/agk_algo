"use client";

import { useEffect, useRef, useState } from "react";

interface TradingViewChartProps {
  initialSymbol?: string;
}

export function TradingViewChart({ initialSymbol = "OANDA:XAUUSD" }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);

  const symbols = [
    { label: "Gold (XAU/USD)", symbol: "OANDA:XAUUSD" },
    { label: "EUR/USD", symbol: "FX:EURUSD" },
    { label: "GBP/USD", symbol: "FX:GBPUSD" },
    { label: "Bitcoin (BTC/USD)", symbol: "BINANCE:BTCUSDT" },
    { label: "Nasdaq (NAS100)", symbol: "OANDA:NAS100USD" },
  ];

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof (window as unknown as { TradingView: unknown }).TradingView !== "undefined") {
        const tv = (window as unknown as { TradingView: { widget: new (options: unknown) => void } }).TradingView;
        new tv.widget({
          autosize: true,
          symbol: selectedSymbol,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#080b11",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerRef.current?.id || "tv_chart_container",
          hide_side_toolbar: false,
          studies: ["MASimple@tv-basicstudies", "RSI@tv-basicstudies"],
        });
      }
    };

    containerRef.current.appendChild(script);
  }, [selectedSymbol]);

  return (
    <div className="space-y-3">
      {/* Symbol Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {symbols.map((item) => (
          <button
            key={item.symbol}
            onClick={() => setSelectedSymbol(item.symbol)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold font-mono transition-all ${
              selectedSymbol === item.symbol
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500"
                : "border border-border/80 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Chart Canvas Container */}
      <div className="rounded-2xl border border-border/80 bg-[#080b11] overflow-hidden shadow-2xl h-[520px] w-full relative">
        <div id="tv_chart_container" ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
