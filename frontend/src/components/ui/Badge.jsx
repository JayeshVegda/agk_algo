import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
        emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
        positive: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
        secondary: 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-white/10 dark:text-slate-200 dark:border-white/10',
        outline: 'bg-white text-slate-800 border border-slate-300 dark:bg-[#0E141B] dark:text-slate-200 dark:border-white/15',
        gold: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
        blue: 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
