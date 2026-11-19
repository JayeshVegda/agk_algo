import React from 'react';

export function BrandLockup({ className = '' }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-akg-text ${className}`}>
      <img src="/assets/logos/akg-algo-crest-96.webp" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
      <span className="font-display text-sm font-extrabold tracking-tight">AKG ALGO</span>
    </span>
  );
}
