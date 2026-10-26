import { useReducedMotion } from 'motion/react';

/**
 * Terminal ticker tape. The single marquee on the landing page.
 * Items are duplicated once; the CSS track shifts by -50% for a seamless loop.
 * Pauses on hover; static under reduced motion.
 *
 * <Ticker items={[{ label: 'XAUUSD', value: 'BUY +45 pips', tone: 'up' }]} />
 */
export default function Ticker({ items = [], className = '' }) {
  const reduce = useReducedMotion();
  if (!items.length) return null;

  const strip = (hidden) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span
          key={`${item.label}-${i}`}
          className="flex items-center gap-2 px-5 font-data text-[13px] whitespace-nowrap"
        >
          <span className="font-semibold tracking-wide text-akg-silver">{item.label}</span>
          <span className={item.tone === 'down' ? 'text-rose-400' : 'text-akg-green'}>
            {item.value}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`relative overflow-hidden border-y border-white/[0.07] bg-[#0A0D13] py-2.5 ${className}`}
      aria-label="Live signal tape"
    >
      <div className={`ticker-track ${reduce ? '!animate-none' : ''}`}>
        {strip(false)}
        {strip(true)}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0A0D13] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0A0D13] to-transparent" />
    </div>
  );
}
