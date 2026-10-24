import type { Metadata } from "next";
import "./globals.css";
import { strings } from "@/lib/strings";
import { MarketTicker } from "@/components/MarketTicker";
import { AppHeader } from "@/components/AppHeader";

export const metadata: Metadata = {
  title: `${strings.common.brandName} · Institutional Precision Trading Systems`,
  description: strings.common.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <div className="flex min-h-screen flex-col">
          {/* Live Trading Ticker Ribbon */}
          <MarketTicker />

          {/* Dynamic Navigation Header */}
          <AppHeader />

          {/* Content Viewport */}
          <main className="flex-1">{children}</main>

          {/* Institutional Compliance Footer */}
          <footer className="border-t border-border/40 bg-[#06080d] py-8 text-xs text-muted-foreground">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-5">
              <div className="rounded-lg border border-border/40 bg-card/60 p-4 leading-relaxed font-mono text-[11px] text-muted-foreground/90">
                <span className="text-amber-400 font-bold mr-2">NOTICE:</span>
                {strings.common.riskDisclaimer}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-border/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{strings.common.brandName}</span>
                  <span className="text-border">·</span>
                  <span>{strings.common.copyright}</span>
                </div>
                <div className="flex items-center gap-6">
                  <a href="/pricing" className="hover:text-foreground transition-colors">
                    Pricing & Cycles
                  </a>
                  <a href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                  <a href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
