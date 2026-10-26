import React from 'react';
import { cn } from '../../../lib/utils';

const TONES = {
  amber: 'bg-amber-300',
  green: 'bg-akg-green',
  rose: 'bg-rose-400',
  sky: 'bg-sky-400',
  slate: 'bg-white/30',
};

const LABELS = {
  pending: ['amber', 'Pending review'],
  pending_review: ['amber', 'Pending review'],
  confirmed: ['green', 'Confirmed'],
  approved: ['green', 'Approved'],
  active: ['green', 'Active'],
  connected: ['green', 'Connected'],
  licensed: ['green', 'Licensed'],
  paid: ['green', 'Paid'],
  trading: ['green', 'Trading'],
  rejected: ['rose', 'Rejected'],
  expiring: ['amber', 'Expiring soon'],
  lapsed: ['rose', 'Lapsed'],
  settlement: ['amber', 'Settlement due'],
  settlement_due: ['amber', 'Settlement due'],
  in_progress: ['sky', 'Setup in progress'],
  in_review: ['sky', 'In review'],
  pending_bridging: ['sky', 'Bridging'],
  paused: ['slate', 'Paused'],
  closed: ['slate', 'Closed'],
  settled: ['slate', 'Settled'],
  canceled: ['slate', 'Canceled'],
};

function fallback(status) {
  return String(status || '').replace(/_/g, ' ').trim()
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/([a-z][a-z]*)/g, (w) => w.toLowerCase());
}

/**
 * Status as a quiet dot + sentence-case label. Replaces the ALL-CAPS pills.
 * Unmapped statuses degrade gracefully to their raw text.
 */
export function StatusDot({ status, className, pulse = true }) {
  const s = String(status || '').toLowerCase().trim();
  const [tone, label] = LABELS[s] || ['slate', fallback(s)];
  return (
    <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', className)} data-status={s || undefined}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONES[tone], pulse && ['amber', 'green'].includes(tone) && 'animate-pulse-soft')} />
      <span className={cn(
        'text-xs font-medium',
        tone === 'green' && 'text-akg-green',
        tone === 'amber' && 'text-amber-300',
        tone === 'rose' && 'text-rose-300',
        tone === 'sky' && 'text-sky-300',
        tone === 'slate' && 'text-akg-muted',
      )}>{label}</span>
    </span>
  );
}
