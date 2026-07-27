import type { GameHistoryEntry, Group, GroupDetail, PublicUser, UserStats } from '@rikiki/shared';
import { API_BASE } from './config';
import { useSession } from './store/session';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useSession.getState().token;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Erreur ${res.status}`);
  }
  return data;
}

export function createGuestAccount(pseudo: string, avatar: string) {
  return request<{ token: string; user: PublicUser }>('/api/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ pseudo, avatar }),
  });
}

export function fetchMe() {
  return request<{ user: PublicUser; stats: UserStats }>('/api/me');
}

export function updateProfile(pseudo: string, avatar: string) {
  return request<{ user: PublicUser }>('/api/me', {
    method: 'PATCH',
    body: JSON.stringify({ pseudo, avatar }),
  });
}

/**
 * Suppression définitive du compte et de tout ce qui s'y rattache.
 * L'App Store l'exige dès lors qu'une création de compte est proposée.
 */
export function deleteAccount() {
  return request<{ ok: true }>('/api/me', { method: 'DELETE' });
}

const HISTORY_CACHE_KEY = 'rikiki-history-cache';

/** Historique en cache : affichage instantané, y compris hors ligne. */
export function readCachedHistory(userId: string): GameHistoryEntry[] | null {
  try {
    const raw = localStorage.getItem(HISTORY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId: string; games: GameHistoryEntry[] };
    return parsed.userId === userId ? parsed.games : null;
  } catch {
    return null;
  }
}

function writeCachedHistory(userId: string, games: GameHistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify({ userId, games }));
  } catch {
    // quota plein ou navigation privée : le cache est optionnel
  }
}

export async function fetchHistory(userId: string): Promise<GameHistoryEntry[]> {
  const { games } = await request<{ games: GameHistoryEntry[] }>('/api/me/history');
  writeCachedHistory(userId, games);
  return games;
}

/* ------------------------------------------------------------------ */
/* Groupes d'amis                                                       */
/* ------------------------------------------------------------------ */

const GROUPS_CACHE_KEY = 'rikiki-groups-cache';
const GROUP_DETAIL_CACHE_KEY = 'rikiki-group-detail-cache';

/** Petit cache local générique (même principe que l'historique). */
function readCache<T>(key: string, ownerId: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ownerId: string; data: T };
    return parsed.ownerId === ownerId ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, ownerId: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ownerId, data }));
  } catch {
    // quota plein ou navigation privée : le cache est optionnel
  }
}

/** Mes groupes en cache : la liste s'affiche instantanément au retour. */
export function readCachedGroups(userId: string): Group[] | null {
  return readCache<Group[]>(GROUPS_CACHE_KEY, userId);
}

export async function fetchGroups(userId: string): Promise<Group[]> {
  const { groups } = await request<{ groups: Group[] }>('/api/groups');
  writeCache(GROUPS_CACHE_KEY, userId, groups);
  return groups;
}

export function createGroup(name: string) {
  return request<{ group: Group }>('/api/groups', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function joinGroupByCode(code: string) {
  return request<{ group: Group }>('/api/groups/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

/** Détail en cache, indexé par groupe : podium et classement sans attente. */
export function readCachedGroupDetail(groupId: string): GroupDetail | null {
  return readCache<GroupDetail>(GROUP_DETAIL_CACHE_KEY, groupId);
}

export async function fetchGroupDetail(groupId: string): Promise<GroupDetail> {
  const detail = await request<GroupDetail>(`/api/groups/${encodeURIComponent(groupId)}`);
  writeCache(GROUP_DETAIL_CACHE_KEY, groupId, detail);
  return detail;
}

export function leaveGroup(groupId: string) {
  return request<{ ok: boolean }>(`/api/groups/${encodeURIComponent(groupId)}/leave`, { method: 'POST' });
}

export function deleteGroup(groupId: string) {
  return request<{ ok: boolean }>(`/api/groups/${encodeURIComponent(groupId)}`, { method: 'DELETE' });
}

export function requestMagicLink(email: string) {
  return request<{ ok: boolean }>('/api/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyMagicLink(token: string) {
  return request<{ token: string; user: PublicUser }>(`/api/auth/verify?t=${encodeURIComponent(token)}`);
}

/* ------------------------------------------------------------------ */
/* Notifications « c'est ton tour » (Web Push)                          */
/* ------------------------------------------------------------------ */

export function fetchPushPublicKey() {
  return request<{ publicKey: string }>('/api/push/public-key');
}

export function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  return request<{ ok: boolean; subscribed: boolean }>('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}

/** `endpoint` absent : coupe les notifications sur tous les appareils du joueur. */
export function removePushSubscription(endpoint: string | null) {
  return request<{ ok: boolean; subscribed: boolean }>('/api/push/unsubscribe', {
    method: 'POST',
    body: JSON.stringify(endpoint ? { endpoint } : {}),
  });
}
