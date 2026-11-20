import { cycleDay, getSignalPriceCycle } from '../lib/signalCycles';
import React, { useState, useEffect, useMemo } from 'react';
import { pb } from '../lib/pocketbase';
import { pairsOf } from '../lib/bots';
import { formatUsdt } from '../lib/utils';
import { Cpu, ArrowRight, Check, Terminal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion';
import Reveal, { RevealGroup, RevealItem } from './motion/Reveal';
import { useSiteSettings, getPlans } from '../lib/wallets';
import { StorefrontGuide } from './StorefrontGuide';
import { storefrontPages } from '../lib/storefrontPages';

const botSlug = (name) =>
  String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const FAQS = [
  {
    q: 'What is AKG ALGO and how does the desk work?',
    a: 'AKG ALGO sells ready-made Expert Advisors for MetaTrader 4 and 5. Signal Room subscriptions are a separate purchase.',
  },
  {
    q: 'How does Expert Advisor licensing and delivery work?',
    a: 'Every EA purchase is a one-time payment. After we approve your payment, your download and license key appear in My Account. On first launch inside MetaTrader, the EA silently binds itself to your account number with no manual account configuration required beforehand.',
  },
  {
    q: 'Can I run these bots on any broker or prop firm?',
    a: 'Check the product page for supported platforms and account requirements. Ask your broker or prop firm whether they allow the robot and its trading strategy.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Checkout lists the currently available USDT and UPI payment options. Submit your transaction reference so the desk can confirm your payment.',
  },
  {
    q: 'Can I get a refund if the bot is not for me?',
    a: 'See the Refund Policy for eligibility and how to request a refund.',
  },
];





function RobotLink({ bot, onNavigate, children, className }) {
  const slug = botSlug(bot.name);
  return (
    <a href={`/bots/${slug}`} onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      onNavigate('bots', slug);
    }} className={className}>{children}</a>
  );
}

function marketMatches(bot, market) {
  if (market === 'all') return true;
  const pairs = pairsOf(bot).join(' ').toUpperCase();
  if (market === 'gold') return /XAU|GOLD/.test(pairs);
  if (market === 'crypto') return /BTC|ETH|CRYPTO|SOL/.test(pairs);
  return /FOREX|FX|EUR|GBP|JPY|AUD|NZD|CAD|CHF/.test(pairs);
}

export function LandingPage({ onNavigate, schedule }) {
  const [catalog, setCatalog] = useState({ status: "loading", bots: [] });
  const [briefings, setBriefings] = useState([]);
  const [platform, setPlatform] = useState('all');
  const [market, setMarket] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);
  const [featuredId, setFeaturedId] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const settings = useSiteSettings();
  const PLANS = getPlans(settings, getSignalPriceCycle(schedule));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const bots = await pb.collection('bots').getFullList({
          filter: 'is_live = true', sort: '-published_at,-created',
        });
        if (!cancelled) setCatalog({ status: 'ready', bots });
      } catch {
        if (!cancelled) setCatalog({ status: 'error', bots: [] });
      }
      try {
        const brRes = await pb.collection('broadcasts').getList(1, 3, { sort: '-created' });
        if (!cancelled) setBriefings(brRes.items);
      } catch {
        /* absent */
      }
    };

    load();

    const unsubBots = pb.collection('bots').subscribe('*', () => load()).catch(() => {});
    const unsubBrief = pb.collection('broadcasts').subscribe('*', () => load()).catch(() => {});

    return () => {
      cancelled = true;
      unsubBots.then((unsub) => unsub && unsub()).catch(() => {});
      unsubBrief.then((unsub) => unsub && unsub()).catch(() => {});
    };
  }, []);

  const matchingBots = useMemo(() => catalog.bots.filter((bot) =>
    (platform === 'all' || String(bot.platform || '').toUpperCase().includes(platform)) &&
    marketMatches(bot, market)
  ), [catalog.bots, platform, market]);
  const featuredIndex = Math.max(0, catalog.bots.findIndex((bot) => bot.id === featuredId));
  const featured = catalog.bots[featuredIndex];
  const priceCycle = getSignalPriceCycle(schedule);

  return (
    <div className="font-sans text-akg-text w-full -mt-6">
      {settings?.landing_announcement && !bannerDismissed && (
        <div className="-mt-2 mb-4 flex items-center justify-between gap-3 rounded-xl border border-akg-hairline bg-akg-surface px-4 py-2.5">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{settings.landing_announcement}</p>
          <button onClick={() => setBannerDismissed(true)} className="shrink-0 text-xs text-akg-muted hover:text-akg-text cursor-pointer" aria-label="Dismiss">✕</button>
        </div>
      )}

      <section className="relative overflow-hidden border-b border-akg-hairline bg-tech-grid">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-akg-accent">AKG ALGO · MetaTrader robots</p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-akg-text sm:text-5xl xl:text-6xl">
              {storefrontPages['/'].heading}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-akg-muted sm:text-lg">
              {storefrontPages['/'].intro}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#home-robots-title" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-akg-cta px-5 text-sm font-bold text-akg-cta-text transition-transform hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none">
                Find a robot <ArrowRight aria-hidden className="h-4 w-4" />
              </a>
              <Button variant="outline" size="lg" onClick={() => onNavigate('pricing')}>
                <Terminal aria-hidden className="mr-2 h-4 w-4" /> View Signal Plans
              </Button>
            </div>
          </div>

          {featured && (
            <article className="relative rounded-2xl border border-emerald-500/30 bg-akg-card p-5 shadow-xl sm:p-7">
              <div className="flex items-center justify-between gap-4 border-b border-akg-hairline pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-akg-muted">Featured robot</span>
                <span className="rounded-md border border-akg-hairline bg-akg-raised px-2 py-1 font-mono text-xs text-akg-text">{featured.platform}</span>
              </div>
              <div className="py-6" aria-live="polite">
                <Cpu aria-hidden className="mb-5 h-8 w-8 text-akg-accent" />
                <h2 className="font-display text-2xl font-bold text-akg-text sm:text-3xl">{featured.name}</h2>
                {featured.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-akg-muted">{featured.description}</p>}
                {pairsOf(featured).length > 0 && <p className="mt-4 text-xs text-akg-muted">{pairsOf(featured).join(', ')}</p>}
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4 border-t border-akg-hairline pt-4">
                <div><p className="font-display text-xl font-bold text-akg-text">{formatUsdt(featured.price)} USDT</p><p className="mt-1 text-xs text-akg-muted">One-time license</p></div>
                <RobotLink bot={featured} onNavigate={onNavigate} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-akg-hairline px-4 text-sm font-semibold text-akg-text transition-colors hover:border-akg-accent">
                  View Robot <ArrowRight aria-hidden className="h-4 w-4" />
                </RobotLink>
              </div>
              {catalog.bots.length > 1 && (
                <div className="mt-5 flex items-center justify-between border-t border-akg-hairline pt-4">
                  <span className="text-xs text-akg-muted">{featuredIndex + 1} of {catalog.bots.length}</span>
                  <div className="flex gap-2">
                    <button type="button" aria-label="Previous featured robot" onClick={() => setFeaturedId(catalog.bots[(featuredIndex - 1 + catalog.bots.length) % catalog.bots.length].id)} className="rounded-lg border border-akg-hairline p-2 text-akg-text hover:border-akg-accent"><ChevronLeft aria-hidden className="h-5 w-5" /></button>
                    <button type="button" aria-label="Next featured robot" onClick={() => setFeaturedId(catalog.bots[(featuredIndex + 1) % catalog.bots.length].id)} className="rounded-lg border border-akg-hairline p-2 text-akg-text hover:border-akg-accent"><ChevronRight aria-hidden className="h-5 w-5" /></button>
                  </div>
                </div>
              )}
            </article>
          )}
        </div>
      </section>

      <section aria-labelledby="home-robots-title" className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="home-robots-title" tabIndex={-1} className="scroll-mt-24 font-display text-3xl font-extrabold text-akg-text">Find your trading robot</h2>
            <p className="mt-2 text-sm text-akg-muted">Choose your platform and market to explore the catalog.</p>
          </div>
          <Button variant="outline" onClick={() => onNavigate('bots')}>View all robots <ArrowRight aria-hidden className="ml-2 h-4 w-4" /></Button>
        </div>
        {catalog.status === 'ready' && catalog.bots.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-4 rounded-xl border border-akg-hairline bg-akg-card p-4">
            {[
              { label: 'Platform', value: platform, set: setPlatform, options: [['all', 'All'], ['MT4', 'MT4'], ['MT5', 'MT5']] },
              { label: 'Market', value: market, set: setMarket, options: [['all', 'All'], ['gold', 'Gold'], ['forex', 'Forex'], ['crypto', 'Crypto']] },
            ].map((group) => (
              <fieldset key={group.label} className="min-w-0">
                <legend className="mb-2 text-xs font-semibold text-akg-muted">{group.label === 'Platform' ? '1. Choose your platform' : '2. Choose a market'}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {group.options.map(([value, label]) => (
                    <button key={value} type="button" aria-pressed={group.value === value}
                      onClick={() => { group.set(value); setVisibleCount(6); }}
                      className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition-colors ${group.value === value ? 'border-akg-accent bg-akg-accent/15 text-akg-text' : 'border-akg-hairline text-akg-muted hover:text-akg-text'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}
        {catalog.status === 'ready' && catalog.bots.length > 0 && (
          <p role="status" className="mt-4 text-sm text-akg-muted">{matchingBots.length} {matchingBots.length === 1 ? 'robot' : 'robots'} found</p>
        )}
        {matchingBots.length > 0 ? (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchingBots.slice(0, visibleCount).map((bot) => (
                <article key={bot.id} className="flex flex-col rounded-xl border border-akg-hairline bg-akg-card p-5 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-akg-accent active:scale-[0.99] motion-reduce:transform-none">
                  <div className="flex items-center gap-2 text-xs text-akg-muted"><Cpu aria-hidden className="h-4 w-4 text-akg-accent" /> {bot.platform}</div>
                  <h3 className="mt-2 font-display text-lg font-bold text-akg-text">{bot.name}</h3>
                  {pairsOf(bot).length > 0 && <p className="mt-1 text-xs text-akg-muted">{pairsOf(bot).join(', ')}</p>}
                  {bot.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-akg-muted">{bot.description}</p>}
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
                    <div><p className="font-semibold text-akg-text">{formatUsdt(bot.price)} USDT</p><p className="text-xs text-akg-muted">One-time license</p></div>
                    <RobotLink bot={bot} onNavigate={onNavigate} className="inline-flex min-h-10 items-center rounded-lg border border-akg-hairline px-3 text-sm font-semibold text-akg-text hover:border-akg-accent">View Robot <span className="sr-only">{bot.name}</span></RobotLink>
                  </div>
                </article>
              ))}
            </div>
            {matchingBots.length > visibleCount && <Button variant="outline" className="mt-5" onClick={() => setVisibleCount((count) => count + 6)}>Show more robots</Button>}
          </>
        ) : (
          <div role="status" className="mt-5 rounded-xl border border-akg-hairline bg-akg-card p-5 text-sm text-akg-muted">
            {catalog.status === 'loading' ? 'Loading robots…' : catalog.status === 'error' ? 'The robot catalog could not load. Try opening the store.' : catalog.bots.length ? 'No robots match these filters.' : 'No robots are currently listed.'}
            {catalog.status === 'ready' && catalog.bots.length > 0 && <button type="button" onClick={() => { setPlatform('all'); setMarket('all'); }} className="ml-2 font-semibold text-akg-accent underline">Clear filters</button>}
          </div>
        )}
      </section>

      <section aria-labelledby="buy-robots-title" className="mx-auto max-w-7xl border-t border-akg-hairline px-4 py-14 sm:py-20">
        <h2 id="buy-robots-title" className="font-display text-3xl font-extrabold text-akg-text">How to buy and install a robot</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Choose a robot', 'Check its supported markets, MetaTrader version, and account requirements.'],
            ['Pay for your license', 'Pay at checkout and submit your payment reference for review.'],
            ['Download after approval', 'Find your license, download, and setup guide in My Account after the desk approves your payment.'],
            ['Install in MetaTrader', 'Follow the setup guide and test the robot on a demo account first.'],
          ].map(([title, description], index) => (
            <li key={title}><Reveal className="h-full rounded-xl border border-akg-hairline bg-akg-card p-5">
              <h3 className="font-display text-lg font-bold text-akg-text"><span className="mr-2 text-akg-accent">{index + 1}.</span>{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-akg-muted">{description}</p>
            </Reveal></li>
          ))}
        </ol>
      </section>

      {/* ============================================================
          5. SIGNAL PLANS - duo with clean VIP styling
      ============================================================ */}
      <section className="border-y border-akg-hairline bg-akg-card/40">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <Reveal>
            <div className="text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Signal plans
              </span>
            </div>
            <h2 className="mt-2.5 text-center font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-akg-text sm:text-4xl">
              Live signals, complete setups.
            </h2>
            <p className="mx-auto mt-3 max-w-[55ch] text-center text-sm text-akg-muted sm:text-[15px]">
              Every alert comes with the entry, stop-loss, and take-profit already worked out.
            </p>
          </Reveal>

          {priceCycle && (
            <p className="mx-auto mt-5 w-fit rounded-lg border border-akg-hairline bg-akg-card px-4 py-2 text-center text-sm text-akg-muted">
              {priceCycle.name} · {cycleDay(priceCycle.startsAt)} to {cycleDay(priceCycle.endsAt, true)}
            </p>
          )}
          <RevealGroup className="mt-10 grid gap-6 md:grid-cols-2 sm:mt-12" stagger={0.12}>
            {PLANS.map((plan) => (
              <RevealItem key={plan.id}>
                <article
                  className={`card-depth flex h-full flex-col rounded-2xl p-7 bg-akg-card ${
                    plan.popular
                      ? 'border border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'border border-akg-hairline'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.popular ? 'emerald' : 'secondary'}>{plan.tag}</Badge>
                    <span className="text-[11px] text-akg-muted">Manual renewal by cycle</span>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-bold text-akg-text">{plan.name}</h3>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-extrabold tabular-nums text-akg-text">
                      {formatUsdt(plan.price)}
                    </span>
                    <span className="text-xs text-akg-muted">USDT / cycle</span>
                  </div>

                  <p className="mt-3 text-sm text-akg-muted">{plan.blurb}</p>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-akg-text">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-7">
                    <Button
                      variant={plan.popular ? 'gradient' : 'secondary'}
                      size="lg"
                      onClick={() => onNavigate('pricing')}
                      className="w-full font-bold text-sm shadow-sm"
                    >
                      View Signal Plans
                    </Button>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>


      {/* ============================================================
          7. LATEST FROM THE DESK - real briefings
      ============================================================ */}
      {briefings.length > 0 && (
        <section className="border-y border-akg-hairline bg-akg-card/30">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
            <div className="flex items-end justify-between gap-6">
              <Reveal>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  From the desk
                </span>
                <h2 className="mt-2.5 font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-3xl">
                  Latest briefings
                </h2>
                <p className="mt-2 max-w-[55ch] text-sm text-akg-muted">
                  Short desk notes as market conditions change.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <button
                  onClick={() => onNavigate('broadcasts')}
                  className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline sm:inline-flex cursor-pointer"
                >
                  All briefings
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Reveal>
            </div>

            <RevealGroup className="mt-8 overflow-hidden rounded-2xl border border-akg-hairline bg-akg-card shadow-sm" stagger={0.08}>
              {briefings.map((b, i) => (
                <RevealItem key={b.id}>
                  <button
                    onClick={() => onNavigate('broadcasts')}
                    className={`w-full px-6 py-5 text-left transition-colors hover:bg-akg-surfaceElevated cursor-pointer ${i > 0 ? 'border-t border-akg-hairline' : ''}`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-[15px] font-bold text-akg-text">{b.title}</h3>
                      <span className="shrink-0 font-mono text-[10px] text-akg-muted">
                        {b.author || 'Desk'}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-xs text-akg-muted">{b.body}</p>
                  </button>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* ============================================================
          8. FAQ - single column accordion
      ============================================================ */}
      <section className="mx-auto max-w-3xl px-4 pb-14 pt-14 sm:pt-20 sm:pb-20">
        <Reveal>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            FAQ
          </span>
          <h2 className="mt-2.5 font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card-depth mt-8 rounded-2xl border border-akg-hairline bg-akg-card px-6 py-2 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </section>

      {/* ============================================================
          9. FINAL CTA - high-impact card
      ============================================================ */}
      <section className="px-4 pb-12">
        <Reveal>
          <div className="card-depth relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-akg-card px-5 py-12 text-center sm:px-6 sm:py-20 shadow-lg">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-400/10 to-emerald-400/15 blur-3xl" />

            <img
              src="/assets/logos/akg-algo-crest-384.webp"
              srcSet="/assets/logos/akg-algo-crest-96.webp 96w, /assets/logos/akg-algo-crest-384.webp 384w"
              sizes="(min-width: 640px) 160px, 128px"
              alt="AKG ALGO"
              width={160}
              height={160}
              className="relative z-10 mx-auto h-32 w-32 object-contain sm:h-40 sm:w-40"
              loading="lazy"
            />

            <h2 className="relative z-10 mt-6 font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-3xl">
              Find a robot for your MetaTrader platform.
            </h2>
            <p className="relative z-10 mx-auto mt-3 max-w-[45ch] text-sm text-akg-muted">
              Compare ready-made robots and choose a one-time license.
            </p>

            <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => onNavigate('bots')}
                className="px-8 font-bold text-sm shadow-md"
              >
                <span>Browse Robots</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('pricing')}
                className="px-7 font-bold text-sm"
              >
                <span>View Signal Plans</span>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
      <StorefrontGuide path="/" />
    </div>
  );
}

export default LandingPage;
