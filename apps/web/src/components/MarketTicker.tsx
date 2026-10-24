"use client";

import { useEffect, useState } from "react";

interface TickerItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  positive: boolean;
}

const INITIAL_ITEMS: TickerItem[] = [
  { symbol: "XAU/USD", name: "Gold", price: "2,748.50", change: "+0.84%", positive: true },
  { symbol: "EUR/USD", name: "Euro", price: "1.0842", change: "+0.18%", positive: true },
  { symbol: "GBP/USD", name: "Pound", price: "1.2985", change: "-0.08%", positive: false },
  { symbol: "BTC/USD", name: "Bitcoin", price: "68,420", change: "+2.65%", positive: true },
  { symbol: "ETH/USD", name: "Ethereum", price: "2,635.80", change: "+1.92%", positive: true },
  { symbol: "US30", name: "Dow Jones", price: "42,410", change: "+0.35%", positive: true },
  { symbol: "NAS100", name: "Nasdaq", price: "20,380", change: "+0.72%", positive: true },
  { symbol: "USOIL", name: "Crude Oil", price: "71.45", change: "-0.54%", positive: false },
];

export function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>(INITIAL_ITEMS);

  // Subtle live tick simulation for institutional feel
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => {
          if (Math.random() > 0.4) return item;
          const delta = (Math.random() - 0.49) * 0.15;
          const isUp = delta >= 0;
          return {
            ...item,
            positive: isUp,
            change: `${isUp ? "+" : ""}${delta.toFixed(2)}%`,
          };
        }),
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#05070b] border-b border-border/40 text-[11px] font-mono py-1.5 px-4 overflow-hidden select-none">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-border/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
            LIVE FEED
          </span>
        </div>

        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
          {items.map((item) => (
            <div key={item.symbol} className="inline-flex items-center gap-2">
              <span className="font-semibold text-foreground/90">{item.symbol}</span>
              <span className="tabular-nums text-foreground/80">{item.price}</span>
              <span
                className={`tabular-nums font-medium text-[10px] ${
                  item.positive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {item.change}
              </span>
            </div>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3 shrink-0 pl-4 border-l border-border/30 text-[10px] text-muted-foreground">
          <span>LATENCY: 14ms</span>
          <span className="text-border">|</span>
          <span className="text-emerald-400 font-semibold">ALL SYSTEMS NOMINAL</span>
        </div>
      </div>
    </div>
  );
}
