import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
        gold: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
        positive: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
        green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
        secondary: 'bg-akg-surfaceElevated text-akg-textSecondary border border-akg-hairline',
        outline: 'text-akg-muted border border-akg-hairline bg-transparent',
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
