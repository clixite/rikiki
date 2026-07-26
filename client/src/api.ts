import type { PublicUser, UserStats } from '@rikiki/shared';
import { useSession } from './store/session';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useSession.getState().token;
  const res = await fetch(path, {
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

export function requestMagicLink(email: string) {
  return request<{ ok: boolean }>('/api/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyMagicLink(token: string) {
  return request<{ token: string; user: PublicUser }>(`/api/auth/verify?t=${encodeURIComponent(token)}`);
}
