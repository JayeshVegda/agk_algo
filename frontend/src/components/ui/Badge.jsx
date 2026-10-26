import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30',
        gold: 'bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30',
        positive: 'bg-[#00D878]/15 text-[#00D878] border border-[#00D878]/30',
        green: 'bg-[#00D878]/15 text-[#00D878] border border-[#00D878]/30',
        secondary: 'bg-white/5 text-[#E7E9EF] border border-white/10',
        outline: 'text-[#A6ADB9] border border-white/15',
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
