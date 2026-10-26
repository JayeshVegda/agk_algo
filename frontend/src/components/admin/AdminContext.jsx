import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { pb } from '../../lib/pocketbase';

/**
 * Admin data layer. One fetch per collection, then granular realtime: each
 * collection subscription applies create/update/delete straight into local
 * state, so a new payment appears instantly without refetching everything.
 * Mutations go through actions that apply the same change locally after the
 * server confirms (realtime echo is harmless: same record replaces itself).
 */
const AdminData = createContext(null);

export function useAdmin() {
  const ctx = useContext(AdminData);
  if (!ctx) throw new Error('useAdmin outside AdminDataProvider');
  return ctx;
}

// Small catalogs load whole (they stay tiny). The growing collections
// (payments / users / signals) are server-paginated per section via
// lib/pagedList.js and never load wholesale here.
const COLLECTIONS = [
  ['broadcasts', 'broadcasts', { sort: '-pinned,-created' }],
  ['bots', 'bots', { sort: '-created' }],
  ['connectors', 'connector_requests', { sort: '-created' }],
  ['resources', 'resources', { sort: 'sort_order,-created' }],
];

export function AdminDataProvider({ currentUser, notify, children }) {
  const [data, setData] = useState(() =>
    Object.fromEntries(COLLECTIONS.map(([k]) => [k, []])));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        COLLECTIONS.map(([key, col, opts]) =>
          pb.collection(col).getFullList(opts).catch(() => [])
        )
      );
      setData(Object.fromEntries(COLLECTIONS.map(([key], i) => [key, results[i]])));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Granular realtime: one subscription per collection mutating local state.
  useEffect(() => {
    const unsubs = COLLECTIONS.map(([key, col]) =>
      pb.collection(col).subscribe('*', (e) => {
        setData((prev) => {
          const list = prev[key];
          if (e.action === 'create') {
            return { ...prev, [key]: [e.record, ...list.filter((r) => r.id !== e.record.id)] };
          }
          if (e.action === 'update') {
            return { ...prev, [key]: list.map((r) => (r.id === e.record.id ? e.record : r)) };
          }
          if (e.action === 'delete') {
            return { ...prev, [key]: list.filter((r) => r.id !== e.record.id) };
          }
          return prev;
        });
      }).catch(() => null)
    );
    return () => {
      unsubs.forEach((u) => u?.then?.((fn) => fn && fn()));
    };
  }, []);

  const toast = useCallback((title, message, type = 'success') => {
    notify?.({ type, title, message });
  }, [notify]);

  const applyLocal = useCallback((key, record, action = 'update') => {
    setData((prev) => {
      const list = prev[key] || [];
      if (action === 'delete') return { ...prev, [key]: list.filter((r) => r.id !== record.id) };
      if (action === 'create') return { ...prev, [key]: [record, ...list.filter((r) => r.id !== record.id)] };
      return { ...prev, [key]: list.map((r) => (r.id === record.id ? { ...r, ...record } : r)) };
    });
  }, []);

  /* ------------------------------ payments ------------------------------ */
  // Revert an approved/rejected payment: status back to pending, and undo the
  // side effects the hook applied (pull the cycle back / clear the license).
  const undoPayment = useCallback(async (p) => {
    try {
      const isBot = String(p.plan || '').startsWith('BOT:');
      if (isBot) {
        await pb.collection('payments').update(p.id, { status: 'pending', license_key: '' });
      } else if (p.plan === 'SR_SIGNAL_BOX' || p.plan === 'PERFECT_SIGNAL_BOX') {
        const users = await pb.collection('users').getFullList({ filter: `email = "${p.user_email}"` }).catch(() => []);
        const u = users[0];
        if (u?.cycle_expires_at) {
          const cur = new Date(String(u.cycle_expires_at).replace(' ', 'T')).getTime();
          const rolled = Math.max(Date.now(), cur - 30 * 86400000);
          await pb.collection('users').update(u.id, { cycle_expires_at: new Date(rolled).toISOString() });
        }
        await pb.collection('payments').update(p.id, { status: 'pending' });
      } else {
        await pb.collection('payments').update(p.id, { status: 'pending' });
      }
      toast('Reverted', `${p.user_email}: payment is back in the pending queue.`, 'info');
      return true;
    } catch (err) {
      toast('Undo Failed', err.message, 'error');
      return false;
    }
  }, [toast]);

  const approvePayment = useCallback(async (p) => {
    try {
      const updated = await pb.collection('payments').update(p.id, { status: 'confirmed' });
      applyLocal('payments', updated);
      const isBot = String(p.plan || '').startsWith('BOT:');
      notify?.({
        type: 'success',
        title: isBot ? 'License Issued' : 'Access Granted',
        message: isBot
          ? `${p.user_email}: license key issued for ${p.plan.replace('BOT:', '').trim().split('(')[0].trim()}.`
          : `${p.user_email}: 30-day cycle activated ($${p.amount} USDT).`,
        action: { label: 'Undo', onClick: () => undoPayment(updated) },
      });
      return true;
    } catch (err) {
      toast('Approval Failed', err.message, 'error');
      return false;
    }
  }, [applyLocal, notify, undoPayment, toast]);

  const rejectPayment = useCallback(async (p, reason) => {
    try {
      const updated = await pb.collection('payments').update(p.id, {
        status: 'rejected',
        admin_notes: reason || '',
      });
      applyLocal('payments', updated);
      notify?.({
        type: 'info',
        title: 'Payment Rejected',
        message: `${p.user_email} has been notified${reason ? ' with your reason' : ''}.`,
        action: { label: 'Undo', onClick: () => undoPayment(updated) },
      });
      return true;
    } catch (err) {
      toast('Reject Failed', err.message, 'error');
      return false;
    }
  }, [applyLocal, toast]);

  const deletePayment = useCallback(async (p) => {
    try {
      await pb.collection('payments').delete(p.id);
      applyLocal('payments', p, 'delete');
      toast('Payment Deleted', 'Record removed from the ledger.', 'info');
    } catch (err) {
      toast('Delete Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  /* ------------------------------ signals ------------------------------- */
  const saveSignal = useCallback(async (payload, editingId) => {
    try {
      const record = editingId
        ? await pb.collection('signals').update(editingId, payload)
        : await pb.collection('signals').create(payload);
      applyLocal('signals', record, editingId ? 'update' : 'create');
      toast(editingId ? 'Signal Updated' : 'Signal Broadcast',
        `${record.symbol} ${record.direction} is ${editingId ? 'updated' : 'live'}.`);
      return true;
    } catch (err) {
      toast('Save Failed', err.message, 'error');
      return false;
    }
  }, [applyLocal, toast]);

  const closeSignal = useCallback(async (s, pnl) => {
    try {
      const updated = await pb.collection('signals').update(s.id, { status: 'closed', pnl });
      applyLocal('signals', updated);
      toast('Signal Closed', `${s.symbol} settled with ${pnl}.`, 'info');
    } catch (err) {
      toast('Close Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  const deleteSignal = useCallback(async (s) => {
    try {
      await pb.collection('signals').delete(s.id);
      applyLocal('signals', s, 'delete');
      toast('Signal Deleted', `${s.symbol} removed from the feed.`, 'info');
    } catch (err) {
      toast('Delete Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  /* ----------------------------- broadcasts ----------------------------- */
  const saveBroadcast = useCallback(async (payload, editingId) => {
    try {
      const body = { ...payload };
      if (!editingId) body.author = payload.author || currentUser?.name || 'Desk Admin';
      const record = editingId
        ? await pb.collection('broadcasts').update(editingId, body)
        : await pb.collection('broadcasts').create(body);
      applyLocal('broadcasts', record, editingId ? 'update' : 'create');
      toast(editingId ? 'Directive Updated' : 'Directive Dispatched', record.title);
      return true;
    } catch (err) {
      toast('Dispatch Failed', err.message, 'error');
      return false;
    }
  }, [applyLocal, toast, currentUser]);

  const togglePinBroadcast = useCallback(async (b) => {
    try {
      const updated = await pb.collection('broadcasts').update(b.id, { pinned: !b.pinned });
      applyLocal('broadcasts', updated);
    } catch (err) {
      toast('Pin Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  const deleteBroadcast = useCallback(async (b) => {
    try {
      await pb.collection('broadcasts').delete(b.id);
      applyLocal('broadcasts', b, 'delete');
      toast('Directive Deleted', '', 'info');
    } catch (err) {
      toast('Delete Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  /* -------------------------------- bots -------------------------------- */
  const saveBot = useCallback(async (payload, editingId) => {
    try {
      const record = editingId
        ? await pb.collection('bots').update(editingId, payload)
        : await pb.collection('bots').create(payload);
      applyLocal('bots', record, editingId ? 'update' : 'create');
      toast(editingId ? 'Bot Updated' : 'Bot Added', record.name);
      return true;
    } catch (err) {
      toast('Save Failed', err.message, 'error');
      return false;
    }
  }, [applyLocal, toast]);

  const deleteBot = useCallback(async (bot) => {
    try {
      await pb.collection('bots').delete(bot.id);
      applyLocal('bots', bot, 'delete');
      toast('Bot Deleted', `${bot.name} removed from the catalog.`, 'info');
    } catch (err) {
      toast('Delete Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  /* -------------------------------- users ------------------------------- */
  const saveUserAccess = useCallback(async (user, { plan, role, cycle_expires_at }) => {
    try {
      const updated = await pb.collection('users').update(user.id, { plan, role, cycle_expires_at });
      applyLocal('users', updated);
      toast('Access Updated', `${user.email} now: ${plan === 'NONE' ? 'no plan' : plan}.`);
    } catch (err) {
      toast('Update Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  const grantDays = useCallback(async (user, days) => {
    try {
      const raw = user.cycle_expires_at;
      const current = raw ? new Date(String(raw).replace(' ', 'T')).getTime() : 0;
      const base = current > Date.now() ? current : Date.now();
      const plan = !user.plan || user.plan === 'NONE' ? 'PERFECT_SIGNAL_BOX' : user.plan;
      const iso = new Date(base + days * 86400000).toISOString();
      const updated = await pb.collection('users').update(user.id, { cycle_expires_at: iso, plan });
      applyLocal('users', updated);
      toast(`+${days} Days Granted`, `${user.email} extended to ${new Date(iso).toLocaleDateString()}.`);
    } catch (err) {
      toast('Grant Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  /* ----------------------------- connectors ----------------------------- */
  const updateConnector = useCallback(async (c, { status, admin_notes }) => {
    try {
      const payload = {};
      if (status !== undefined) payload.status = status;
      if (admin_notes !== undefined) payload.admin_notes = admin_notes;
      const updated = await pb.collection('connector_requests').update(c.id, payload);
      applyLocal('connectors', updated);
      toast('Bridge Updated', `${c.user_email}: ${status || 'note saved'}.`);
    } catch (err) {
      toast('Update Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  /* ------------------------------ resources ----------------------------- */
  const saveResource = useCallback(async (payload, editingId) => {
    try {
      const record = editingId
        ? await pb.collection('resources').update(editingId, payload)
        : await pb.collection('resources').create(payload);
      applyLocal('resources', record, editingId ? 'update' : 'create');
      toast(editingId ? 'Item Updated' : 'Item Added', record.title);
      return true;
    } catch (err) {
      toast('Save Failed', err.message, 'error');
      return false;
    }
  }, [applyLocal, toast]);

  const toggleResource = useCallback(async (r) => {
    try {
      const updated = await pb.collection('resources').update(r.id, { is_active: !r.is_active });
      applyLocal('resources', updated);
    } catch (err) {
      toast('Toggle Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  const deleteResource = useCallback(async (r) => {
    try {
      await pb.collection('resources').delete(r.id);
      applyLocal('resources', r, 'delete');
      toast('Item Deleted', '', 'info');
    } catch (err) {
      toast('Delete Failed', err.message, 'error');
    }
  }, [applyLocal, toast]);

  const value = useMemo(() => ({
    ...data,
    loading,
    refresh: load,
    approvePayment, rejectPayment, deletePayment, undoPayment,
    saveSignal, closeSignal, deleteSignal,
    saveBroadcast, togglePinBroadcast, deleteBroadcast,
    saveBot, deleteBot,
    saveUserAccess, grantDays,
    updateConnector,
    saveResource, toggleResource, deleteResource,
  }), [data, loading, load, approvePayment, rejectPayment, deletePayment, undoPayment, saveSignal,
      closeSignal, deleteSignal, saveBroadcast, togglePinBroadcast, deleteBroadcast,
      saveBot, deleteBot, saveUserAccess, grantDays, updateConnector, saveResource,
      toggleResource, deleteResource]);

  return <AdminData.Provider value={value}>{children}</AdminData.Provider>;
}
