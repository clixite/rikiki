import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { UserStats } from '@rikiki/shared';
import { fetchMe } from '../api';
import SoundToggle from '../components/SoundToggle';
import { unlockAudio } from '../audio';
import { fr } from '../i18n/fr';
import { createRoom, joinRoom } from '../socket';
import { useGame } from '../store/game';
import { useSession } from '../store/session';

export default function Home() {
  const { user, roomCode } = useSession();
  const socketConnected = useGame((s) => s.socketConnected);
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [busy, setBusy] = useState(false);

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
    unlockAudio();
    setBusy(true);
    const res = await createRoom();
    setBusy(false);
    if (res.ok) navigate('/game');
    else useGame.getState().showToast(res.error.message);
  };

  const onResume = async () => {
    if (!roomCode) return;
    unlockAudio();
    const res = await joinRoom(roomCode);
    if (res.ok) navigate('/game');
    else useSession.getState().setRoomCode(null);
  };

  const disabled = !socketConnected || busy;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
      {/* Barre du haut : profil + son */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="open-profile"
          onClick={() => navigate('/profile')}
          className="flex h-11 min-w-0 items-center gap-2 rounded-full bg-felt-900/45 pl-2.5 pr-3.5 ring-1 ring-white/8 transition active:scale-95"
        >
          <span className="text-xl leading-none" aria-hidden="true">
            {user.avatar}
          </span>
          <span className="max-w-32 truncate text-sm font-medium">{user.pseudo}</span>
          {!user.isGuest && (
            <span className="text-xs text-success" title={fr.accountSaved} aria-label={fr.accountSaved}>
              ✓
            </span>
          )}
        </button>
        <div className="flex-1" />
        <button
          type="button"
          data-testid="open-rules"
          onClick={() => navigate('/rules')}
          aria-label={fr.rules}
          title={fr.rules}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-felt-900/45 text-lg ring-1 ring-white/8 transition active:scale-90"
        >
          <span aria-hidden="true">📖</span>
        </button>
        <SoundToggle />
      </div>

      {/* Identité de marque */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="text-center"
        >
          {/* Deux cartes croisées, dessinées en CSS */}
          <div className="relative mx-auto mb-5 h-24 w-24" aria-hidden="true">
            <div
              className="absolute left-2 top-1 h-20 w-14 -rotate-12 rounded-lg bg-linear-to-b from-paper-50 to-paper-100 ring-1 ring-black/15"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-2xl text-suit-red">♥</span>
            </div>
            <div
              className="absolute left-8 top-3 h-20 w-14 rotate-[10deg] rounded-lg bg-linear-to-b from-paper-50 to-paper-100 ring-1 ring-black/15"
              style={{ boxShadow: 'var(--shadow-card-lifted)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-2xl text-suit-black">♠</span>
            </div>
          </div>

          <h1 className="font-display text-5xl font-bold tracking-tight text-brass-300">{fr.appName}</h1>
          <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-snug text-paper-50/55">{fr.tagline}</p>

          {stats && stats.gamesPlayed > 0 && (
            <motion.button
              type="button"
              data-testid="open-history"
              onClick={() => navigate('/history')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-4 flex h-11 items-center gap-1.5 rounded-full bg-felt-900/40 px-4 text-xs tabular-nums text-paper-50/60 ring-1 ring-white/8 transition active:scale-95"
            >
              {stats.gamesPlayed} {fr.gamesPlayed} · {stats.gamesWon} {fr.gamesWon}
              <span className="text-paper-50/35">›</span>
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Actions principales */}
      <div className="space-y-2.5">
        {roomCode && (
          <button
            type="button"
            onClick={onResume}
            disabled={disabled}
            className="w-full rounded-2xl bg-white/8 py-3 text-sm font-semibold ring-1 ring-white/10 transition active:scale-[0.98] disabled:opacity-40"
          >
            {fr.resumeGame} · {roomCode}
          </button>
        )}
        <button
          type="button"
          data-testid="create-game"
          onClick={onCreate}
          disabled={disabled}
          className="w-full rounded-2xl bg-linear-to-b from-brass-300 to-brass-500 py-4 text-lg font-bold text-felt-950 transition active:scale-[0.98] disabled:opacity-40"
          style={{ boxShadow: '0 4px 20px -6px rgb(0 0 0 / 0.6)' }}
        >
          {fr.createGame}
        </button>
        <button
          type="button"
          data-testid="goto-join"
          onClick={() => {
            unlockAudio();
            navigate('/join');
          }}
          disabled={disabled}
          className="w-full rounded-2xl bg-white/8 py-3.5 text-base font-semibold ring-1 ring-white/10 transition active:scale-[0.98] disabled:opacity-40"
        >
          {fr.joinGame}
        </button>

        {!socketConnected && (
          <p className="pt-1 text-center text-xs text-paper-50/40">{fr.reconnecting}</p>
        )}
        <p className="pt-0.5 text-center text-[10px] text-paper-50/25">{fr.copyright}</p>
      </div>
    </div>
  );
}
