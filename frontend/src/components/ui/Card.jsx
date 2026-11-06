import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0E141B] text-slate-900 dark:text-slate-100 shadow-sm transition-[border-color,box-shadow,transform] duration-200',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <div
      className={cn('text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white font-display', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <div
      className={cn('text-xs text-slate-500 dark:text-slate-400 leading-relaxed', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  );
}
