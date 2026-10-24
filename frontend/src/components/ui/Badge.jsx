import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
        success: 'bg-emerald-600 text-white',
        outline: 'text-slate-700 border border-slate-300',
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
