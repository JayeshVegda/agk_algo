import React, { useState, useEffect, useMemo } from 'react';
import { pb, pbUrl } from '../lib/pocketbase';
import {
  Cpu, Download, CheckCircle2, KeyRound, Copy, Check,
  ExternalLink, HardDrive, Clock, AlertCircle, ChevronLeft,
  FlaskConical,
  FileText, RefreshCw, X
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { downloadLicensedFile, downloadLinksFor, formatUsdt } from '../lib/utils';
import { pairsOf, featuresOf, timeframesOf, pctStat, statNumOrNull, performanceReport, matchesBotPurchase } from '../lib/bots';
import { StorefrontGuide } from './StorefrontGuide';
import { storefrontPages } from '../lib/storefrontPages';

const slugify = (name) =>
  String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const fallbackRobotImage = '/assets/brand/robot-store.webp';

function RobotImage({ bot, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [bot.id, bot.image_url]);
  const src = !failed && bot.image_url?.trim() ? pbUrl(bot.image_url.trim()) : fallbackRobotImage;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function BotsTab({ user, botSlug, onOpenBot, onNavigate, onNavigateAdmin, notify }) {
  const [bots, setBots] = useState([]);
  const [botsLoading, setBotsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [myPurchases, setMyPurchases] = useState([]);
  const [allBotChanges, setAllBotChanges] = useState([]);
  const [licenseModalBot, setLicenseModalBot] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadBots = async () => {
    setCatalogError(false);
    setBotsLoading(true);
    try {
      const records = await pb.collection('bots').getFullList({ sort: '-created' });
      setBots(records);
    } catch (err) {
      console.error('Failed to load bots:', err);
      setCatalogError(true);
    } finally {
      setBotsLoading(false);
    }
  };

  const loadUserPurchases = async () => {
    if (!user?.email) return;
    try {
      const records = await pb.collection('payments').getFullList({
        filter: pb.filter("user_email = {:email}", { email: user.email }),
        sort: '-created'
      });
      setMyPurchases(records);
    } catch (err) {
      console.error('Failed to load user bot purchases:', err);
    }
  };

  useEffect(() => {
    loadBots();
  }, []);

  useEffect(() => {
    setMyPurchases([]);
    if (user?.email) {
      loadUserPurchases();
      const unsub = pb.collection('payments').subscribe('*', () => loadUserPurchases()).catch(() => {});
      return () => { unsub?.then?.((u) => u && u()); };
    }
  }, [user?.email]);

  useEffect(() => {
    let stale = false;
    pb.collection('bot_changes').getFullList({ sort: '-released' })
      .then((items) => { if (!stale) setAllBotChanges(items); })
      .catch(() => {});
    return () => { stale = true; };
  }, [botSlug]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      notify?.({ type: 'error', title: 'Could not copy', message: 'Select the text and copy it manually.' });
      return;
    }
    setCopiedKey(true);
    if (notify) {
      notify({ type: 'copy', title: 'Copied to clipboard', message: text });
    }
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const isBotOwned = (botName) => {
    return myPurchases.some((p) => p.status === 'confirmed' && matchesBotPurchase(p.plan, botName));
  };

  const isBotPending = (botName) => {
    return myPurchases.some((p) => p.status === 'pending' && matchesBotPurchase(p.plan, botName));
  };

  const getOwnedPurchase = (botName) => {
    return myPurchases.find((p) => p.status === 'confirmed' && matchesBotPurchase(p.plan, botName));
  };

  const startPurchase = (bot) => {
    const existing = getOwnedPurchase(bot.name);
    if (existing) {
      setLicenseModalBot({ bot, payment: existing });
      return;
    }

    if (isBotPending(bot.name)) {
      if (notify) {
        notify({
          type: 'info',
          title: 'Verification in progress',
          message: `Your payment for ${bot.name} is being verified by the desk.`
        });
      }
      return;
    }

    sessionStorage.setItem('akg_order', JSON.stringify({
      kind: 'bot',
      id: bot.id,
      name: bot.name,
      price: bot.price,
      platform: bot.platform,
    }));
    if (onNavigate) onNavigate('checkout');
  };

  const liveBots = useMemo(() => bots.filter((b) => b.is_live !== false), [bots]);

  const filteredBots = useMemo(() => {
    return liveBots.filter((bot) => {
      if (platformFilter === 'all') return true;
      return (bot.platform || '').includes(platformFilter);
    });
  }, [liveBots, platformFilter]);

  const selectedBot = botSlug ? liveBots.find((b) => slugify(b.name) === botSlug) : null;

  if (botsLoading) {
    return (
      <div role="status" className="flex justify-center items-center py-24 font-mono text-xs text-akg-muted">
        {botSlug ? "Loading robot details…" : "Loading robots…"}
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p role="alert" className="text-sm text-akg-muted">Couldn’t load the robot store.</p>
        <Button variant="outline" onClick={loadBots}>Try again</Button>
      </div>
    );
  }

  if (botSlug && !selectedBot) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24 space-y-4">
        <AlertCircle className="h-10 w-10 mx-auto text-akg-accent" />
        <h1 className="font-display text-2xl font-bold text-akg-text">Robot not found</h1>
        <p className="text-sm text-akg-muted">The robot may be unpublished or the link is outdated.</p>
        <Button variant="outline" onClick={() => onNavigate && onNavigate('bots')}>
          Back to Robots
        </Button>
      </div>
    );
  }

  // ==========================================================================
  // SINGLE BOT PRODUCT PAGE
  // ==========================================================================
  if (selectedBot) {
    const bot = selectedBot;
    const owned = isBotOwned(bot.name);
    const pending = isBotPending(bot.name);
    const pairs = pairsOf(bot);
    const features = featuresOf(bot);
    const timeframes = timeframesOf(bot);
    const selectedChanges = allBotChanges.filter((ch) => ch.bot === bot.id);

    const report = performanceReport(bot);
    const statItems = [
      { label: 'Win rate', value: statNumOrNull(bot.win_rate) !== null ? pctStat(bot.win_rate) : null, tone: 'text-akg-text' },
      { label: 'Profit factor', value: statNumOrNull(bot.profit_factor) !== null ? `${bot.profit_factor}` : null, tone: 'text-akg-accent' },
      { label: 'Max drawdown', value: statNumOrNull(bot.drawdown) !== null ? pctStat(bot.drawdown) : null, tone: 'text-rose-500' },
    ].filter((s) => Boolean(s.value));


    return (
      <div className="max-w-5xl mx-auto font-sans text-akg-text w-full space-y-8 pb-12">
        {/* Navigation & Admin Deep-link */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => onNavigate && onNavigate('bots')}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-akg-muted hover:text-akg-accent transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            All Robots
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => onNavigateAdmin?.(`/admin?s=bots&edit=${bot?.id || ''}`)}
              className="flex h-7 items-center gap-1.5 rounded-md border border-akg-accent/40 bg-akg-card px-3 font-mono text-[10px] font-semibold text-akg-accent hover:bg-akg-accent/10 transition-colors"
            >
              <FlaskConical className="h-3 w-3" /> Admin: Edit Bot
            </button>
          )}
        </div>

        {/* Hero Section */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
          <div className="flex flex-col justify-center space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono">{bot.platform}</Badge>
              <Badge variant="emerald" className="font-mono">{bot.version || 'v1.0'}</Badge>
              {owned && <Badge variant="emerald">Licensed</Badge>}
              {pending && <Badge variant="outline">Verification in progress</Badge>}
            </div>

            <h1 className="font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-akg-text sm:text-4xl">
              {bot.name}
            </h1>

            {pairs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {pairs.map((p) => (
                  <span
                    key={p}
                    className="rounded-md border border-akg-hairline bg-akg-raised px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-akg-accent"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-3 flex flex-wrap items-center gap-5">
              <div>
                <div className="font-display text-3xl font-extrabold text-akg-text tabular-nums">
                  {formatUsdt(bot.price)}
                  <span className="ml-1.5 text-sm font-bold text-akg-accent">USDT</span>
                </div>
                <div className="text-[11px] text-akg-muted">One-time perpetual license</div>
              </div>

              <Button
                size="lg"
                variant={owned ? 'outline' : 'default'}
                className="gap-2 px-6"
                onClick={() => startPurchase(bot)}
              >
                {owned ? (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>View License</span>
                  </>
                ) : pending ? (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Verification in Progress</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Buy License</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-akg-hairline bg-[#071a12] sm:min-h-[340px]">
            <RobotImage bot={bot} className="absolute inset-0 h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-xs font-semibold text-white">{bot.platform}</span>
              {pairs.slice(0, 3).map((pair) => <span key={pair} className="rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-xs font-semibold text-white">{pair}</span>)}
            </div>
          </div>
        </div>

        {report && (
          <details className="space-y-3 rounded-xl border border-akg-hairline bg-akg-card p-5">
            <summary className="cursor-pointer font-display text-lg font-bold">Performance report</summary>
            <p className="text-sm text-akg-muted">{report.type} · {report.start} to {report.end}</p>
            {statItems.length > 0 && <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {statItems.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-akg-hairline p-3">
                  <dt className="text-xs text-akg-muted">{stat.label}</dt>
                  <dd className={`font-mono text-lg font-semibold ${stat.tone}`}>{stat.value}</dd>
                </div>
              ))}
            </dl>}
            <a href={report.source} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-akg-accent underline underline-offset-4">Open source report</a>
            <p className="text-xs text-akg-muted">Past performance does not guarantee future results.</p>
          </details>
        )}

        {/* Strategy Text & Details */}
        <section className="space-y-4 rounded-xl border border-akg-hairline bg-akg-card p-6">
          <h2 className="font-display text-lg font-bold text-akg-text">How this robot trades</h2>
          {bot.description && (
            <p className="font-sans text-sm leading-relaxed text-akg-muted whitespace-pre-line">
              {bot.description}
            </p>
          )}

          {bot.strategy_type && (
            <div className="pt-1 font-mono text-xs text-akg-muted">
              Core logic: <span className="text-akg-accent font-semibold">{bot.strategy_type}</span>
            </div>
          )}

          {(timeframes.length > 0 || bot.min_lot != null || bot.leverage || bot.trading_style) && (
            <div className="grid gap-2.5 pt-3 sm:grid-cols-2 md:grid-cols-4">
              {timeframes.length > 0 && (
                <div className="rounded-lg border border-akg-hairline bg-akg-raised p-3">
                  <div className="font-mono text-[9.5px] uppercase text-akg-muted">Timeframes</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {timeframes.map((tf) => (
                      <span key={tf} className="font-mono text-xs text-akg-accent">{tf}</span>
                    ))}
                  </div>
                </div>
              )}
              {bot.trading_style && (
                <div className="rounded-lg border border-akg-hairline bg-akg-raised p-3">
                  <div className="font-mono text-[9.5px] uppercase text-akg-muted">Style</div>
                  <div className="mt-1 font-mono text-xs text-akg-text">{bot.trading_style}</div>
                </div>
              )}
              {bot.min_lot != null && bot.min_lot !== '' && (
                <div className="rounded-lg border border-akg-hairline bg-akg-raised p-3">
                  <div className="font-mono text-[9.5px] uppercase text-akg-muted">Min Lot</div>
                  <div className="mt-1 font-mono text-xs text-akg-text">{bot.min_lot}</div>
                </div>
              )}
              {bot.leverage && (
                <div className="rounded-lg border border-akg-hairline bg-akg-raised p-3">
                  <div className="font-mono text-[9.5px] uppercase text-akg-muted">Leverage</div>
                  <div className="mt-1 font-mono text-xs text-akg-text">{bot.leverage}</div>
                </div>
              )}
            </div>
          )}

          {bot.broker_note && (
            <p className="text-xs text-akg-muted leading-relaxed pt-2">
              <span className="font-semibold text-akg-text">Broker note:</span> {bot.broker_note}
            </p>
          )}

          {features.length > 0 && (
            <div className="pt-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-akg-muted mb-3">Key Features</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-2 rounded-lg border border-akg-hairline bg-akg-raised p-3 text-xs text-akg-text">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-akg-green" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* What You Get */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold text-akg-text">What You Get</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-akg-hairline bg-akg-card p-5 space-y-2">
              <div className="h-9 w-9 rounded-lg border border-akg-hairline bg-akg-raised flex items-center justify-center text-akg-accent">
                <Download className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-akg-text">EA Binary File</h3>
              <p className="text-xs text-akg-muted leading-relaxed">
                File format: {downloadLinksFor(bot).map(({ platform, ext }) => `${platform} (.${ext.toLowerCase()})`).join(' or ')}.
              </p>
            </div>

            <div className="rounded-xl border border-akg-hairline bg-akg-card p-5 space-y-2">
              <div className="h-9 w-9 rounded-lg border border-akg-hairline bg-akg-raised flex items-center justify-center text-akg-green">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-akg-text">Setup Guide</h3>
              <p className="text-xs text-akg-muted leading-relaxed">
                Follow the installation steps for your MetaTrader version and check the product requirements before enabling the robot.
              </p>
              <a href="/downloads/AKG_ALGO_SETUP_GUIDE.txt" className="inline-block text-xs font-semibold text-akg-accent underline underline-offset-4">Read the installation guide</a>
            </div>

            <div className="rounded-xl border border-akg-hairline bg-akg-card p-5 space-y-2">
              <div className="h-9 w-9 rounded-lg border border-akg-hairline bg-akg-raised flex items-center justify-center text-emerald-500">
                <RefreshCw className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-akg-text">Version Updates</h3>
              <p className="text-xs text-akg-muted leading-relaxed">
                Perpetual license covers all future version releases and optimizations for this system.
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-akg-muted">
            After payment approval, access the key and download in <a className="text-akg-accent underline underline-offset-4" href="/account">My Account</a>.
            See the <a className="text-akg-accent underline underline-offset-4" href="/refund">refund policy</a> for purchase eligibility and support instructions.
          </p>

          {/* Drive package link if owned */}
          {owned && bot.download_url && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-akg-accent shrink-0" />
                <div>
                  <div className="text-sm font-bold text-akg-text">Google Drive Distribution Package</div>
                  <div className="text-xs text-akg-muted">Contains full presets, historical set files, and release archives.</div>
                </div>
              </div>
              <a
                href={bot.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-akg-cta px-4 py-2 font-mono text-xs font-bold text-akg-cta-text hover:opacity-90 transition-opacity"
              >
                <span>Open Drive</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </section>

        {/* Release History (if present) */}
        {selectedChanges.length > 0 && (
          <section className="space-y-3 rounded-xl border border-akg-hairline bg-akg-card p-6">
            <h2 className="font-display text-lg font-bold text-akg-text">Release History</h2>
            <ol className="mt-3 space-y-3 border-l border-akg-hairline pl-4">
              {selectedChanges.map((ch) => (
                <li key={ch.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-akg-accent" />
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs font-bold text-akg-accent">{ch.version}</span>
                    {ch.released && (
                      <span className="font-mono text-[10px] text-akg-muted">
                        {new Date(ch.released).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-akg-muted">{ch.summary}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Demo reminder & Risk Disclosure */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 rounded-lg border border-akg-hairline bg-akg-raised p-4 text-xs text-akg-text">
            <FlaskConical className="h-4 w-4 shrink-0 text-akg-accent" />
            <span>
              <strong className="text-akg-text">Demo account reminder:</strong> Always run the EA on a demo account first to validate execution and slippage on your broker's live feed before committing live capital.
            </span>
          </div>

          <p className="text-[11px] leading-relaxed text-akg-muted">
            <strong className="text-akg-text">Risk Disclosure:</strong> Backtested results do not represent actual trading and cannot account for impact of financial risk or market liquidity. Algorithmic trading carries risk of substantial loss.
          </p>
        </div>

        {/* License Viewer Modal for Owners */}
        {licenseModalBot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-akg-hairline bg-akg-card p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-akg-green" />
                  <h3 className="font-bold text-akg-text text-base">Active License</h3>
                </div>
                <button
                  onClick={() => setLicenseModalBot(null)}
                  className="rounded-lg p-1 text-akg-muted hover:text-akg-text cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <div className="font-bold text-sm text-akg-text">{licenseModalBot.bot.name}</div>
                <div className="font-mono text-xs text-akg-muted">Platform: {licenseModalBot.bot.platform}</div>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[11px] font-bold text-akg-green">
                  <span>License Key:</span>
                  <button
                    onClick={() => handleCopy(licenseModalBot.payment.license_key)}
                    className="flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="rounded-md bg-akg-bg border border-akg-hairline p-2.5 text-xs text-akg-text font-bold break-all select-all">
                  {licenseModalBot.payment.license_key}
                </div>
                <p className="text-[10px] text-akg-muted font-sans">
                  Paste this key into the EA inputs dialog. It binds silently to your account on first run.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {downloadLinksFor(licenseModalBot.bot).map((l) => (
                  <a
                    key={l.path}
                    href={l.path}
                        onClick={(event) => downloadLicensedFile(event, l.path, notify)}
                    download
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-akg-cta px-3.5 py-2 font-mono text-xs font-bold text-akg-cta-text hover:opacity-90 transition-opacity"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .{l.ext}</span>
                  </a>
                ))}
                {licenseModalBot.bot.download_url && (
                  <a
                    href={licenseModalBot.bot.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-akg-hairline bg-akg-raised px-3.5 py-2 font-mono text-xs font-semibold text-akg-text hover:border-akg-accent/40"
                  >
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>Drive Package</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // CATALOG GRID: /bots
  // ==========================================================================
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12 font-sans text-akg-text">
      <header className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-[#071a12] px-6 py-10 text-white sm:px-10 sm:py-14">
        <img src={fallbackRobotImage} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#071a12] via-[#071a12]/90 to-transparent" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">AKG ALGO · Robot store</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{storefrontPages['/bots'].heading}</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">{storefrontPages['/bots'].intro}</p>
        </div>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Explore robots</h2>
          <p role="status" className="mt-1 text-sm text-akg-muted">{filteredBots.length} {filteredBots.length === 1 ? 'robot' : 'robots'} available</p>
        </div>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-akg-muted">Platform</legend>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-akg-hairline bg-akg-card p-1">
            {['all', 'MT4', 'MT5'].map((platform) => (
              <button key={platform} type="button" aria-pressed={platformFilter === platform}
                onClick={() => setPlatformFilter(platform)}
                className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${platformFilter === platform ? 'bg-akg-cta text-akg-cta-text' : 'text-akg-muted hover:text-akg-text'}`}>
                {platform === 'all' ? 'All' : platform}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredBots.map((bot) => {
          const owned = isBotOwned(bot.name);
          const pending = !owned && isBotPending(bot.name);
          const slug = slugify(bot.name);
          return (
            <article key={bot.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-akg-hairline bg-akg-card transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-akg-accent motion-reduce:transform-none">
              <a href={`/bots/${slug}`} onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onOpenBot?.(slug);
              }} aria-label={`View ${bot.name}`} className="relative block aspect-[16/9] overflow-hidden bg-[#071a12]">
                <RobotImage bot={bot} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none" />
                <span className="absolute left-3 top-3 rounded-md border border-white/20 bg-black/75 px-2.5 py-1 text-xs font-semibold text-white">{bot.platform}</span>
                {(owned || pending) && <span className="absolute right-3 top-3 rounded-md bg-black/75 px-2.5 py-1 text-xs font-semibold text-white">{owned ? 'Licensed' : 'Pending'}</span>}
              </a>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-bold text-akg-text">{bot.name}</h3>
                {pairsOf(bot).length > 0 && <p className="mt-1 text-xs font-medium text-akg-accent">{pairsOf(bot).join(' · ')}</p>}
                {bot.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-akg-muted">{bot.description}</p>}
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-akg-hairline pt-4">
                  <div><p className="font-display text-xl font-bold">{formatUsdt(bot.price)} <span className="text-xs text-akg-accent">USDT</span></p><p className="mt-1 text-xs text-akg-muted">One-time license</p></div>
                  <a href={`/bots/${slug}`} onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    onOpenBot?.(slug);
                  }} className="inline-flex min-h-10 items-center rounded-lg border border-akg-hairline px-4 text-sm font-semibold hover:border-akg-accent">View Robot<span className="sr-only"> {bot.name}</span></a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filteredBots.length === 0 && (
        <div className="rounded-xl border border-akg-hairline bg-akg-card p-12 text-center">
          <Cpu className="h-8 w-8 mx-auto text-akg-muted" />
          <h3 className="mt-3 text-sm font-bold text-akg-text">{platformFilter === "all" ? "No robots available yet" : "No robots for this platform"}</h3>
          {platformFilter !== "all" && <Button variant="outline" className="mt-3" onClick={() => setPlatformFilter("all")}>Show all robots</Button>}
        </div>
      )}
      <StorefrontGuide path="/bots" />
    </div>
  );
}
