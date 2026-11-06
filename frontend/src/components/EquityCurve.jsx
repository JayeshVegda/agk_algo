import { useMemo } from 'react';

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildSeries({ seed, points = 90, profitFactor = 2.5, drawdownPct = 5 }) {
  const rand = mulberry32(seed);
  const pf = Math.max(1.1, Math.min(parseFloat(profitFactor) || 2.5, 5));
  const dd = Math.max(1, Math.min(parseFloat(drawdownPct) || 5, 20));

  const drift = 0.55 + (pf - 1) * 0.22;
  const noise = 0.5 + dd * 0.075;

  const series = [100];
  let value = 100;
  let sinceDip = 0;

  for (let i = 1; i < points; i++) {
    sinceDip += 1;
    const drawdownLeg = sinceDip > 12 && rand() < dd / 45;
    if (drawdownLeg) {
      sinceDip = 0;
    }
    const legBias = drawdownLeg ? -1.9 : drift;
    const step = (legBias + (rand() - 0.5) * noise) * (0.6 + rand() * 0.8);
    value = Math.max(88, value * (1 + step / 100));
    series.push(value);
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  return series.map((v) => 8 + ((v - min) / span) * 84);
}

export default function EquityCurve({
  seed = 'akg',
  profitFactor,
  drawdown,
  winRate,
  points = 90,
  className = '',
  showGrid = true,
  strokeWidth = 2,
}) {
  const { linePath, areaPath, lastY } = useMemo(() => {
    const numericSeed = hashCode(String(seed));
    const series = buildSeries({
      seed: numericSeed,
      points,
      profitFactor,
      drawdownPct: drawdown,
    });

    const W = 600;
    const H = 100;
    const stepX = W / (series.length - 1);
    const pts = series.map((v, i) => [i * stepX, H - v]);

    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${W},${H} L0,${H} Z`;
    return { linePath: line, areaPath: area, lastY: pts[pts.length - 1][1] };
  }, [seed, points, profitFactor, drawdown]);

  const gid = `eq-${hashCode(String(seed)) % 100000}`;

  return (
    <svg
      viewBox="0 0 600 100"
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label={`Illustrative equity profile: win rate ${winRate || 'n/a'}, profit factor ${profitFactor || 'n/a'}, max drawdown ${drawdown || 'n/a'}`}
    >
      <defs>
        <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--akg-accent, #00D878)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--akg-accent, #00D878)" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id={`${gid}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="55%" stopColor="var(--akg-accent, #00D878)" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>

      {showGrid && (
        <g stroke="currentColor" strokeOpacity="0.08" strokeWidth="1">
          <line x1="0" y1="25" x2="600" y2="25" />
          <line x1="0" y1="50" x2="600" y2="50" />
          <line x1="0" y1="75" x2="600" y2="75" />
        </g>
      )}

      <path d={areaPath} fill={`url(#${gid}-fill)`} />
      <path
        d={linePath}
        fill="none"
        stroke={`url(#${gid}-line)`}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="600" cy={lastY} r="3" fill="var(--akg-accent, #00D878)" />
    </svg>
  );
}
