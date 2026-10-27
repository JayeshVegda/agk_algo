import { pb } from '../../../lib/pocketbase';

const CACHE_TTL = 45_000;
let rosterCache = { at: 0, data: [] };

/**
 * The `users` collection list rule hides other records from the SPA (only
 * /api/akg/traders — an admin-gated hook route — returns the full roster).
 * Shared + cached so the palette, dossier and sections reuse one fetch.
 */
export async function loadRoster() {
  if (Date.now() - rosterCache.at < CACHE_TTL) return rosterCache.data;
  try {
    const res = await pb.send('/api/akg/traders', { method: 'GET' });
    rosterCache = { at: Date.now(), data: res.items || res };
  } catch { rosterCache = { at: Date.now(), data: rosterCache.data }; }
  return rosterCache.data;
}
