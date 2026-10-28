import PocketBase from 'pocketbase';

// Backend origin. Same-origin when the SPA is served by PocketBase itself;
// set VITE_PB_URL (e.g. https://akg-algo.pocketbasecloud.io) when the SPA is
// hosted elsewhere (Vercel) and talks to PocketBase cross-origin.
const envUrl = (import.meta.env?.VITE_PB_URL || '').trim().replace(/\/+$/, '');
export const PB_URL = envUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8095');

// Resolve a backend route/asset path for <a href> / <img src>. Absolute,
// protocol-relative and data: URLs pass through untouched.
export const pbUrl = (path) =>
  !path || (!path.startsWith('/') && !/^(https?:)?\/\//i.test(path)) ? path : /^(https?:)?\/\//i.test(path) ? path : `${PB_URL}${path}`;

export const pb = new PocketBase(PB_URL);

// Auto cancel duplicate requests is disabled to prevent race conditions during state updates
pb.autoCancellation(false);
