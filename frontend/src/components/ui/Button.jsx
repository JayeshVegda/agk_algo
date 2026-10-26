import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3C653] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090D] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'sheen bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-[#1C1403] hover:brightness-[1.07] active:brightness-95 shadow-md shadow-[#F3C653]/20',
        gold: 'sheen bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-[#1C1403] hover:brightness-[1.07] active:brightness-95 shadow-md shadow-[#F3C653]/20',
        positive: 'bg-[#00D878] text-[#052012] hover:bg-[#00F09A] shadow-md shadow-[#00D878]/15',
        secondary: 'bg-[#171D26] text-[#E7E9EF] hover:bg-[#202733] border border-white/10',
        outline: 'border border-white/15 bg-transparent text-[#E7E9EF] hover:bg-white/5 hover:border-[#F3C653]/40',
        ghost: 'text-[#A6ADB9] hover:bg-white/5 hover:text-[#E7E9EF]',
        link: 'text-[#F3C653] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 py-2 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2.5',
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
