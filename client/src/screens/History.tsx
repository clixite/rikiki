import { useEffect, useState } from 'react';
import { m as motion } from 'motion/react';
import { Navigate } from 'react-router-dom';
import { useNav } from '../nav';
import type { GameHistoryEntry } from '@rikiki/shared';
import { fetchHistory, fetchMe, readCachedHistory } from '../api';
import SoundToggle from '../components/SoundToggle';
import EmptyState from '../components/EmptyState';
import { useT } from '../i18n';

import { useSession } from '../store/session';
import PlayerAvatar from '../components/PlayerAvatar';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function History() {
  const t = useT();
  const { user } = useSession();
  const navigate = useNav();
  // On affiche d'abord le cache local : la liste apparaît instantanément,
  // même sans réseau, puis se rafraîchit en arrière-plan.
  const [games, setGames] = useState<GameHistoryEntry[] | null>(() =>
    user ? readCachedHistory(user.id) : null,
  );
  const [stats, setStats] = useState<{ gamesPlayed: number; gamesWon: number; bestRound: number } | null>(null);
  const [loading, setLoading] = useState(games === null);

  useEffect(() => {
    if (!user) return;
    fetchHistory(user.id)
      .then(setGames)
      .catch(() => undefined)
      .finally(() => setLoading(false));
    fetchMe()
      .then(({ stats: s }) => setStats(s))
      .catch(() => undefined);
  }, [user?.id]);

  if (!user) return <Navigate to="/profile" replace />;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label={t.backHome}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-felt-900/45 text-lg ring-1 ring-white/8 transition active:scale-90"
        >
          ←
        </button>
        <SoundToggle />
      </div>

      <h1 className="font-display mt-2 text-center text-2xl font-bold text-brass-300">{t.historyTitle}</h1>

      {stats && stats.gamesPlayed > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { value: stats.gamesPlayed, label: t.gamesPlayed },
            { value: stats.gamesWon, label: t.gamesWon },
            { value: stats.bestRound, label: t.bestRound },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-felt-900/45 py-2.5 text-center ring-1 ring-white/6">
              <p className="text-xl font-bold tabular-nums text-brass-300">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-paper-50/55">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rk-scroll mt-4 min-h-0 flex-1 overflow-y-auto">
        {loading && !games ? (
          <p className="py-8 text-center text-sm text-paper-50/55">{t.loading}</p>
        ) : !games || games.length === 0 ? (
          <EmptyState glyph="🃏" message={t.noHistory} testId="history-empty" />
        ) : (
          <ul className="space-y-2">
            {games.map((g, i) => (
              <motion.li
                key={`${g.code}-${g.playedAt}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="rounded-xl bg-felt-900/45 p-3 ring-1 ring-white/6"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      g.won ? 'bg-success/20 text-success' : 'bg-white/8 text-paper-50/55'
                    }`}
                  >
                    {g.won ? t.wonBadge : `${g.myRank}ᵉ`}
                  </span>
                  <span className="text-xs text-paper-50/55">{formatDate(g.playedAt)}</span>
                  <span className="flex-1" />
                  <span className="text-base font-bold tabular-nums text-brass-300">{g.myScore}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {g.standings.map((s, idx) => (
                    <span
                      key={`${s.pseudo}-${idx}`}
                      className="flex items-center gap-1 text-[11px] text-paper-50/55"
                      title={`${s.pseudo} · ${s.score}`}
                    >
                      <PlayerAvatar avatar={s.avatar} size={16} />
                      <span className="max-w-16 truncate">{s.pseudo}</span>
                      <span className="tabular-nums text-paper-50/55">{s.score}</span>
                    </span>
                  ))}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
