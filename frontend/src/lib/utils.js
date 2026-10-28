import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { pbUrl } from './pocketbase';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Resolve gated download links for bot binaries. Binaries are served by the
// /api/akg/download/{name} hook route, which requires a confirmed license.
// Multi-platform bots ("MT4/MT5") get one link per platform.
export function downloadLinksFor(bot) {
  if (!bot?.name) return [];
  const slug = bot.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const platforms = bot.platform && bot.platform.includes('/')
    ? ['mt4', 'mt5']
    : [(bot.platform || 'mt5').toLowerCase().replace(/[^a-z0-9]/g, '')];
  return platforms.map((p) => ({
    platform: p.toUpperCase(),
    ext: p === 'mt4' ? 'EX4' : 'EX5',
    path: pbUrl(`/api/akg/download/${slug}_${p}.${p === 'mt4' ? 'ex4' : 'ex5'}`),
  }));
}
