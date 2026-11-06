import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-akg-hairline bg-akg-card text-akg-text shadow-sm transition-[border-color,background-color] duration-150',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-5', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <div
      className={cn('text-base font-medium leading-none tracking-tight text-akg-text', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <div
      className={cn('text-xs text-akg-muted leading-relaxed', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center p-5 pt-0', className)}
      {...props}
    />
  );
}
