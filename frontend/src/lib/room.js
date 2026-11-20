import { pb } from './pocketbase';

export const PAGE_SIZE = 60;
const EMOJIS = ['🔥', '👍', '🎯', '💰', '🙏'];

export const ROOM_EMOJIS = EMOJIS;

export function planOf(user) {
  const p = String(user?.plan || '').toUpperCase();
  if (p.includes('PERFECT')) return 'vip';
  if (p.includes('SR') || p === 'SIGNAL_BOX') return 'sr';
  return null;
}

export function subActive(user) {
  if (!user) return false;
  const plan = String(user.plan || '').toUpperCase();
  if (!plan || plan === 'NONE') return false;
  const exp = Date.parse(String(user.cycle_expires_at || '').replace(' ', 'T'));
  return exp > Date.now();
}

export function isStaff(user) {
  return !!user && (user.role === 'admin' || user.collectionName === '_superusers');
}

/* Same gate the API rules enforce, mirrored client-side only for DECORATION
 * (blur/CTA choices). Real gating happens server-side. */
export function canReadAudience(user, audience) {
  if (isStaff(user)) return true;
  if (!user) return false;
  if (audience === 'all') return true;
  if (!subActive(user)) return false;
  const plan = planOf(user);
  if (audience === 'sr') return !!plan;
  return plan === 'vip';
}

export async function fetchMessages({ before: cursor } = {}) {
  const filter = cursor
    ? pb.filter('created < {:created} || (created = {:created} && id < {:id})', cursor)
    : '';
  const res = await pb.collection('messages').getList(1, PAGE_SIZE, {
    filter,
    sort: '-created,-id',
    expand: 'author,reply_to',
    skipTotal: true,
  });
  return res.items.reverse();
}

function byMessage(ids) {
  return ids.map((id) => pb.filter('message = {:id}', { id })).join(' || ');
}

export async function fetchContent(messageIds) {
  if (!messageIds || !messageIds.length) return [];
  const filter = messageIds.map((id) => 'message = "' + id + '"').join(' || ');
  const rows = await pb.collection('message_content').getFullList({ filter });
  return Array.isArray(rows) ? rows : [];
}

export async function fetchReactions(messageIds) {
  if (!messageIds.length) return [];
  const filter = byMessage(messageIds);
  return pb.collection('reactions').getFullList({ filter });
}

export function reactionCounts(reactions) {
  const counts = {};
  for (const r of reactions) {
    const key = r.message;
    counts[key] = counts[key] || { total: 0, mine: {} };
    counts[key].total += 1;
    counts[key][r.emoji] = (counts[key][r.emoji] || 0) + 1;
  }
  return counts;
}

export const ROOM_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const ROOM_IMAGE_LIMIT = 4;
export const ROOM_IMAGE_BYTES = 8 * 1024 * 1024;
export const ROOM_TEXT_LIMIT = 6000;

export function newBroadcastKey() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function postMessage({ requestKey, audience, body, replyTo, files }) {
  const fd = new FormData();
  fd.set('request_key', requestKey);
  fd.set('audience', audience);
  fd.set('body', body);
  fd.set('reply_to', replyTo || '');
  for (const file of files) fd.append('attachments', file, file.name || 'pasted-image');
  return pb.send('/api/akg/signal-room/broadcasts', { method: 'POST', body: fd });
}

export async function updateMessageBody(contentId, body) {
  return pb.collection('message_content').update(contentId, { body });
}

export async function setMessagePinned(message) {
  const next = !message.pinned;
  const updated = await pb.collection('messages').update(message.id, { pinned: next });
  return updated;
}

export async function deleteMessage(messageId) {
  await pb.collection('messages').delete(messageId);
}

export async function toggleReaction({ messageId, emoji, existingId }) {
  if (existingId) {
    await pb.collection('reactions').delete(existingId);
    return null;
  }
  return pb.collection('reactions').create({ message: messageId, user: pb.authStore.record.id, emoji });
}

export function fileUrl(contentRecord, filename, fileToken, thumb) {
  const opts = {};
  if (thumb) opts.thumb = thumb;
  if (fileToken) opts.token = fileToken;
  return pb.files.getURL(contentRecord, filename, opts);
}

export function subscribeRoom({ onMessage, onContent, onReaction }) {
  const wire = (collection, handler) => {
    if (!handler) return Promise.resolve(null);
    return pb.collection(collection).subscribe('*', ({ action, record }) => handler(action, record)).catch(() => null);
  };
  return Promise.all([wire('messages', onMessage), wire('message_content', onContent), wire('reactions', onReaction)]).then(
    (all) => all.filter(Boolean),
  );
}
