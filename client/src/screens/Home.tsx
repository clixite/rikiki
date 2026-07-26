import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { UserStats } from '@rikiki/shared';
import { fetchMe } from '../api';
import { fr } from '../i18n/fr';
import { createRoom, joinRoom } from '../socket';
import { useGame } from '../store/game';
import { useSession } from '../store/session';

export default function Home() {
  const { user, roomCode } = useSession();
  const socketConnected = useGame((s) => s.socketConnected);
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMe()
      .then(({ user: fresh, stats: s }) => {
        useSession.getState().setUser(fresh);
        setStats(s);
      })
      .catch(() => undefined);
  }, [user?.id]);

  if (!user) return <Navigate to="/profile" replace />;

  const onCreate = async () => {
    const res = await createRoom();
    if (res.ok) navigate('/game');
    else useGame.getState().showToast(res.error.message);
  };

  const onResume = async () => {
    if (!roomCode) return;
    const res = await joinRoom(roomCode);
    if (res.ok) navigate('/game');
    else useSession.getState().setRoomCode(null);
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col items-center justify-between px-6 py-8">
      <button
        type="button"
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 self-end rounded-full bg-black/25 px-3 py-1.5 text-sm active:scale-95"
      >
        <span className="text-xl">{user.avatar}</span>
        <span className="font-medium">{user.pseudo}</span>
        <span className="text-white/50">✏️</span>
      </button>

      <div className="text-center">
        <div className="mb-2 text-6xl">🃏</div>
        <h1 className="font-display text-5xl font-bold tracking-wide text-gold-300">{fr.appName}</h1>
        <p className="mt-3 text-sm text-white/70">{fr.tagline}</p>
        {stats && stats.gamesPlayed > 0 && (
          <p className="mt-3 text-xs text-white/50">
            🎮 {stats.gamesPlayed} {fr.gamesPlayed.toLowerCase()} · 🏆 {stats.gamesWon} {fr.gamesWon.toLowerCase()}
          </p>
        )}
      </div>

      <div className="w-full space-y-3 pb-4">
        {roomCode && (
          <button
            type="button"
            onClick={onResume}
            disabled={!socketConnected}
            className="w-full rounded-2xl bg-white/15 py-3.5 text-base font-semibold shadow-lg active:scale-95 disabled:opacity-50"
          >
            ↩️ {fr.resumeGame} · {roomCode}
          </button>
        )}
        <button
          type="button"
          data-testid="create-game"
          onClick={onCreate}
          disabled={!socketConnected}
          className="w-full rounded-2xl bg-gold-400 py-4 text-lg font-bold text-felt-900 shadow-lg active:scale-95 disabled:opacity-50"
        >
          {fr.createGame}
        </button>
        <button
          type="button"
          onClick={() => navigate('/join')}
          disabled={!socketConnected}
          className="w-full rounded-2xl border-2 border-gold-400/70 py-3.5 text-lg font-bold text-gold-300 shadow-lg active:scale-95 disabled:opacity-50"
        >
          {fr.joinGame}
        </button>
      </div>
    </div>
  );
}
