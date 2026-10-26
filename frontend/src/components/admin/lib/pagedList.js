import { useCallback, useEffect, useMemo, useState } from 'react';
import { pb } from '../../../lib/pocketbase';

/**
 * Server-paginated collection loader for the admin console. The browser holds
 * one page at a time; realtime events refresh the current page only.
 *
 * filter may use {:placeholders}; pass matching `params` (expanded safely via
 * pb.filter). searchKeys are matched with `~` against the search box.
 */
export function usePagedList(collection, { filter = '', params = null, sort = '-created', searchKeys = [], perPage = 20 } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearchRaw] = useState('');
  const [loading, setLoading] = useState(true);

  const fullFilter = useMemo(() => {
    const q = search.trim();
    const searchPart = q && searchKeys.length
      ? '(' + searchKeys.map((k) => `${k} ~ "${q.replace(/"/g, '')}"`).join(' || ') + ')'
      : '';
    const combined = [filter, searchPart].filter(Boolean).join(' && ');
    return params ? pb.filter(combined, params) : combined;
  }, [filter, params, search, searchKeys]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pb.collection(collection).getList(page, perPage, { filter: fullFilter, sort });
      setItems(res.items);
      setTotal(res.totalItems);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [collection, page, perPage, fullFilter, sort]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsubP = pb.collection(collection).subscribe('*', () => load()).catch(() => null);
    return () => { unsubP?.then?.((u) => u && u()); };
  }, [collection, load]);

  const setSearch = (v) => { setSearchRaw(v); setPage(1); };

  return {
    items, total, page, setPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    search, setSearch, loading, refresh: load,
  };
}

/** Admin aggregate stats (server-computed KPIs) with realtime refresh. */
export function useStats() {
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await pb.send('/api/akg/stats', { method: 'GET' });
      setStats(res);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    load();
    const unsubs = ['payments', 'users', 'signals', 'connector_requests']
      .map((c) => pb.collection(c).subscribe('*', () => load()).catch(() => null));
    const t = setInterval(load, 60000);
    return () => {
      unsubs.forEach((u) => u?.then?.((fn) => fn && fn()));
      clearInterval(t);
    };
  }, [load]);

  return { stats, refreshStats: load };
}
