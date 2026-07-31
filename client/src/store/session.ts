import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicUser } from '@rikiki/shared';

interface SessionState {
  token: string | null;
  user: PublicUser | null;
  /** Dernière partie rejointe, pour reprendre après un refresh. */
  roomCode: string | null;
  setSession: (token: string, user: PublicUser) => void;
  setUser: (user: PublicUser) => void;
  setRoomCode: (code: string | null) => void;
  clear: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      roomCode: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      setRoomCode: (roomCode) => set({ roomCode }),
      clear: () => set({ token: null, user: null, roomCode: null }),
    }),
    { name: 'rikiki-session' },
  ),
);
