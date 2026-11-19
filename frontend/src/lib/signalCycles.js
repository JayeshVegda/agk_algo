import { useEffect, useRef, useState } from 'react';
import { pb } from './pocketbase';

export const CYCLE_ZONE = 'Asia/Kolkata';

export function cycleDay(value, inclusiveEnd = false) {
  if (!value) return '';
  const date = new Date(Date.parse(value.replace(' ', 'T')) - (inclusiveEnd ? 1 : 0));
  return date.toLocaleDateString('en-GB', {
    timeZone: CYCLE_ZONE, day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function getSignalPriceCycle(schedule) {
  return schedule?.checkout || schedule?.next || schedule?.active || null;
}

export function useSignalSchedule(userId, enabled) {
  const [snapshot, setSnapshot] = useState(null);
  const refreshRef = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let request = 0;
    const refresh = async (reset = false) => {
      const sequence = ++request;
      if (reset === true) setSnapshot({ userId, status: 'loading', data: null });
      try {
        const data = await pb.send('/api/akg/signal-schedule');
        if (alive && sequence === request) setSnapshot({ userId, status: 'ready', data });
      } catch {
        if (alive && sequence === request) setSnapshot({ userId, status: 'error', data: null });
      }
    };
    refreshRef.current = refresh;
    refresh();
    const interval = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    const subscriptions = [pb.collection('signal_cycles').subscribe('*', refresh).catch(() => null)];
    if (userId) subscriptions.push(pb.collection('payments').subscribe('*', refresh).catch(() => null));
    return () => {
      alive = false;
      refreshRef.current = null;
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      subscriptions.forEach((promise) => promise.then((unsubscribe) => unsubscribe?.()));
    };
  }, [userId, enabled]);
  const current = snapshot?.userId === userId ? snapshot : null;
  return {
    status: current?.status || 'loading',
    data: current?.data || null,
    retry: () => refreshRef.current?.(true),
  };
}
