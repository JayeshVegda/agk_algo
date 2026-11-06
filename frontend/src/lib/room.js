import { pb } from './pocketbase';

const PAGE_SIZE = 60;
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

export async function fetchMessages({ before } = {}) {
  const filter = before ? 'created < "' + escapeFilter(before) + '"' : '';
  const res = await pb.collection('messages').getList(1, PAGE_SIZE, {
    filter,
    sort: '-created',
    expand: 'author,reply_to',
  });
  return res.items;
}

function escapeFilter(value) {
  return value.replace(/"/g, '\\"');
}

export async function fetchContent(messageIds) {
  if (!messageIds || !messageIds.length) return [];
  const filter = messageIds.map((id) => 'message = "' + id + '"').join(' || ');
  const rows = await pb.collection('message_content').getFullList({ filter }).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

export async function fetchReactions() {
  const rows = await pb.collection('reactions').getFullList({}).catch(() => []);
  return rows;
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

export async function postMessage({ audience, body, replyTo, files }) {
  const stub = await pb.collection('messages').create({
    audience: audience || 'all',
    has_image: !!(files && files.length),
    reply_to: replyTo || '',
  });
  try {
    const fd = new FormData();
    fd.set('message', stub.id);
    if (body) fd.set('body', body);
    if (files && files.length) {
      for (const f of files) fd.append('attachments', f, f.name || 'image.png');
    }
    await pb.collection('message_content').create(fd);
  } catch (err) {
    await pb.collection('messages').delete(stub.id).catch(() => {});
    throw err;
  }
  return stub;
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

export async function toggleReaction(messageId, emoji, existing) {
  if (existing) {
    await pb.collection('reactions').delete(existing.id);
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

export function subscribeRoom({ onMessages, onContent, onReactions }) {
  const unsubs = [];
  const wire = (collection, handler) => {
    if (!handler) return Promise.resolve(null);
    return pb.collection(collection).subscribe('*', (e) => handler(e)).catch(() => null);
  };
  return Promise.all([wire('messages', onMessages), wire('message_content', onContent), wire('reactions', onReactions)]).then(
    (all) => () => all.forEach((u) => u && (typeof u === 'function' ? u() : u.then && u.then((fn) => fn && fn()))),
  );
}
