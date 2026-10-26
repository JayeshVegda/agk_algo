import React, { createContext, useContext, useEffect, useState } from 'react';
import { Rows3, Rows4 } from 'lucide-react';
import { cn } from '../../../lib/utils';

const KEY = 'akg-admin-density';
const Ctx = createContext(['compact', () => {}]);

export function DensityProvider({ children }) {
  const [value, setValue] = useState(() => {
    try { return localStorage.getItem(KEY) === 'comfortable' ? 'comfortable' : 'compact'; }
    catch { return 'compact'; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, value); } catch { /* private mode */ }
    document.documentElement.dataset.density = value;
    return () => { delete document.documentElement.dataset.density; };
  }, [value]);

  return <Ctx.Provider value={[value, setValue]}>{children}</Ctx.Provider>;
}

export function useDensity() {
  return useContext(Ctx);
}

export function DensityToggle({ className }) {
  const [density, setDensity] = useDensity();
  return (
    <button
      onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}
      className={cn('rounded-full border border-white/10 p-2.5 text-akg-muted transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold', className)}
      title={density === 'compact' ? 'Density: Compact (switch to roomy rows)' : 'Density: Roomy rows (switch to compact)'}
      aria-label="Toggle table density"
    >
      {density === 'compact' ? <Rows3 className="h-4 w-4" /> : <Rows4 className="h-4 w-4" />}
    </button>
  );
}
