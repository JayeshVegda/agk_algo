import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-akg-green focus-visible:ring-offset-2 focus-visible:ring-offset-akg-bg disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[#064E3B] text-white dark:bg-[#00D878] dark:text-[#07080D] hover:bg-[#043D2E] dark:hover:bg-[#00C46C] border border-transparent shadow-sm',
        gold:
          'bg-[#064E3B] text-white dark:bg-[#00D878] dark:text-[#07080D] hover:bg-[#043D2E] dark:hover:bg-[#00C46C] border border-transparent shadow-sm',
        positive:
          'bg-[#059669] text-white dark:bg-[#00D878] dark:text-[#07080D] hover:bg-[#047857] dark:hover:bg-[#00C46C] border border-transparent shadow-sm',
        secondary:
          'bg-akg-surface text-akg-text hover:bg-akg-surfaceElevated border border-akg-hairline shadow-sm',
        outline:
          'border border-akg-hairline bg-transparent text-akg-text hover:bg-akg-surface hover:border-akg-green/30',
        ghost:
          'text-akg-muted hover:bg-akg-surface hover:text-akg-text',
        link:
          'text-akg-green underline-offset-4 hover:underline p-0 h-auto active:scale-100',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
        md: 'h-9 px-4 py-2 text-sm gap-2 rounded-lg',
        lg: 'h-11 px-5 text-base gap-2.5 rounded-lg',
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
