import { useEffect, useState } from 'react';
import { AnimatePresence, m as motion } from 'motion/react';
import type { GameHistoryEntry, GameView } from '@rikiki/shared';
import { fetchHistory, readCachedHistory } from '../api';
import { useT } from '../i18n';
import { useSession } from '../store/session';
import { reportPlayer } from '../api';
import { hidePlayer, isHidden } from '../moderation';
import { isPhotoDataUrl } from '../photo';

import PlayerAvatar from './PlayerAvatar';

interface Props {
  view: GameView;
  open: boolean;
  onClose: () => void;
}

/**
 * Scores de la partie en cours et historique personnel, dans le même tiroir.
 *
 * Les joueurs veulent revoir leurs résultats précédents sans quitter la table :
 * sortir de la partie pour aller les consulter ferait perdre le fil, et
 * personne ne le fait. Le cache local permet d'afficher l'historique
 * instantanément, la requête ne fait que le rafraîchir.
 */
export default function ScoreDrawer({ view, open, onClose }: Props) {
  const t = useT();
  const userId = useSession((s) => s.user?.id);
  const [tab, setTab] = useState<'scores' | 'history'>('scores');
  const [history, setHistory] = useState<GameHistoryEntry[] | null>(null);
  const sorted = [...view.players].sort((a, b) => b.totalScore - a.totalScore);
  const round = view.round;

  useEffect(() => {
    if (!open || tab !== 'history' || !userId) return;
    setHistory((current) => current ?? readCachedHistory(userId));
    fetchHistory(userId)
      .then(setHistory)
      .catch(() => undefined);
  }, [open, tab, userId]);

  // Le tiroir rouvre toujours sur les scores : c'est ce qu'on vient voir
  useEffect(() => {
    if (!open) setTab('scores');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-end bg-black/50 backdrop-blur-[2px]"
          onClick={onClose}
          data-testid="score-drawer"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="rk-scroll max-h-[72%] w-full overflow-y-auto rounded-t-3xl bg-felt-800 p-5 pb-[max(2rem,env(safe-area-inset-bottom))] ring-1 ring-white/10"
            style={{ boxShadow: 'var(--shadow-panel)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />

            <div className="mb-4 flex gap-1 rounded-xl bg-felt-950/40 p-1">
              {(['scores', 'history'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  data-testid={`drawer-tab-${key}`}
                  onClick={() => setTab(key)}
                  aria-pressed={tab === key}
                  className={`min-h-11 flex-1 rounded-lg text-sm font-semibold transition ${
                    tab === key ? 'bg-felt-700 text-paper-50' : 'text-paper-50/55 active:scale-95'
                  }`}
                >
                  {key === 'scores' ? t.scoreboard : t.myGames}
                </button>
              ))}
            </div>

            {tab === 'history' ? (
              <HistoryList entries={history} t={t} />
            ) : (
            <ul className="space-y-1.5">
              {sorted.map((p, i) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${
                    i === 0 ? 'bg-brass-400/12 ring-1 ring-brass-400/25' : 'bg-felt-900/40'
                  }`}
                >
                  <span className="w-5 text-center text-xs font-semibold tabular-nums text-paper-50/55">
                    {i + 1}
                  </span>
                  <PlayerAvatar playerId={p.id} avatar={p.avatar} photo={p.photo} size={22} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {p.pseudo}
                    {p.id === view.you && <span className="ml-1 text-[11px] text-paper-50/55">({t.you})</span>}
                  </span>
                  {round && round.bids[p.id] !== null && (
                    <span className="shrink-0 text-[11px] tabular-nums text-paper-50/55">
                      {round.tricksWon[p.id] ?? 0}/{round.bids[p.id]}
                    </span>
                  )}
                  <span className="w-12 shrink-0 text-right text-base font-bold tabular-nums text-brass-300">
                    {p.totalScore}
                  </span>
                  {p.id !== view.you && isPhotoDataUrl(p.photo) && !isHidden(p.id) && (
                    <button
                      type="button"
                      data-testid={`report-${p.id}`}
                      onClick={() => {
                        hidePlayer(p.id);
                        reportPlayer(p.id, 'photo').catch(() => undefined);
                      }}
                      aria-label={t.reportPlayer}
                      title={t.reportPlayer}
                      className="ml-1 flex h-11 w-8 shrink-0 items-center justify-center text-paper-50/45 transition active:scale-90"
                    >
                      <span aria-hidden="true">⚑</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-4 min-h-11 w-full rounded-xl bg-white/8 py-3 text-sm font-medium transition active:scale-[0.98]"
            >
              {t.close}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Dernières parties du joueur, en lecture seule. */
function HistoryList({
  entries,
  t,
}: {
  entries: GameHistoryEntry[] | null;
  t: ReturnType<typeof useT>;
}) {
  if (entries === null) {
    return <p className="py-6 text-center text-sm text-paper-50/55">{t.verifying}</p>;
  }
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-paper-50/55">{t.noHistory}</p>;
  }
  return (
    <ul className="space-y-1.5" data-testid="drawer-history">
      {entries.map((game, i) => (
        <li
          key={`${game.code}-${game.playedAt}-${i}`}
          className="flex items-center gap-2.5 rounded-xl bg-felt-900/40 px-3 py-2.5"
        >
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              game.won ? 'bg-success/20 text-success' : 'bg-white/8 text-paper-50/55'
            }`}
          >
            {game.won ? t.wonBadge : t.lostBadge}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-paper-50/70">
            {t.playersCount(game.playersCount)}
          </span>
          <span className="w-12 shrink-0 text-right text-base font-bold tabular-nums text-brass-300">
            {game.myScore}
          </span>
        </li>
      ))}
    </ul>
  );
}
