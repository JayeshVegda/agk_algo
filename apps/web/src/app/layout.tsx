import type { Metadata } from "next";
import "./globals.css";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: strings.common.brandName,
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
          <header className="border-b border-border/40 bg-background/95 backdrop-blur">
            <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
              <a href="/" className="flex items-center gap-2 font-mono text-lg font-bold tracking-wider">
                <span className="text-primary">AKG</span>
                <span className="text-muted-foreground">ALGO</span>
              </a>
              <nav className="flex items-center gap-4 text-sm font-medium">
                <a href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
                <a href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </a>
                <a
                  href="/register"
                  className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Join
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-border/40 bg-card py-6 text-xs text-muted-foreground">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-4">
              <p className="max-w-4xl text-muted-foreground/80 leading-relaxed font-mono">
                {strings.common.riskDisclaimer}
              </p>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-border/20">
                <span>{strings.common.copyright}</span>
                <div className="flex gap-4">
                  <a href="/terms" className="hover:underline">
                    Terms of Service
                  </a>
                  <a href="/privacy" className="hover:underline">
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
