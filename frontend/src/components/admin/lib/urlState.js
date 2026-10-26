import { useEffect, useState } from 'react';

/**
 * URL query state for the admin console. The console has no router, so the
 * whole truth (section, tab, filter, search, sort, page, open record) lives in
 * the query string of /admin. Sections subscribe with useUrlQuery() and write
 * with replaceParams; the server always serves the same /admin document.
 */
const listeners = new Set();

export function readQuery() {
  const out = {};
  new URLSearchParams(window.location.search).forEach((v, k) => { out[k] = v; });
  return out;
}

/** Merge a patch into the current query string. Missing/''/undefined keys are removed. */
export function replaceParams(patch = {}, { push = false } = {}) {
  const q = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null || v === '') q.delete(k);
    else q.set(k, String(v));
  }
  const s = q.toString();
  const url = window.location.pathname + (s ? `?${s}` : '') + window.location.hash;
  if (push) window.history.pushState({}, '', url);
  else window.history.replaceState({}, '', url);
  listeners.forEach((l) => l());
}

/** Write a complete fresh query (used for cross-section navigation). */
export function setParams(obj = {}, { push = false } = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  const url = window.location.pathname + (s ? `?${s}` : '') + window.location.hash;
  if (push) window.history.pushState({}, '', url);
  else window.history.replaceState({}, '', url);
  listeners.forEach((l) => l());
}

/**
 * Read-side hook. Returns the full query object and re-renders subscribers
 * whenever replaceParams or a popstate changes it.
 */
export function useUrlQuery() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    listeners.add(bump);
    window.addEventListener('popstate', bump);
    return () => { listeners.delete(bump); window.removeEventListener('popstate', bump); };
  }, []);
  return readQuery();
}
