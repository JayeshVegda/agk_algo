import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-akg-bg disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 border border-transparent shadow-sm',
        gradient:
          'btn-cyan-emerald text-white shadow-md hover:shadow-lg',
        positive:
          'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 border border-transparent shadow-sm',
        secondary:
          'bg-akg-tint text-akg-text hover:bg-[var(--akg-bg-elevated-2)] border border-transparent shadow-2xs',
        outline:
          'border border-[var(--akg-hairline)] bg-akg-card text-akg-text hover:bg-akg-tint shadow-2xs',
        ghost:
          'text-akg-textSecondary hover:bg-akg-tint hover:text-akg-text',
        link:
          'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline-offset-4 hover:underline p-0 h-auto active:scale-100',
        gold:
          'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 border border-transparent shadow-sm',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
        md: 'h-10 px-4 py-2 text-sm gap-2 rounded-xl',
        lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export function Button({ className, variant, size, asChild = false, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
