import { AnimatePresence, motion } from 'motion/react';
import type { GameView } from '@rikiki/shared';
import { fr } from '../i18n/fr';

interface Props {
  view: GameView;
  open: boolean;
  onClose: () => void;
}

export default function ScoreDrawer({ view, open, onClose }: Props) {
  const sorted = [...view.players].sort((a, b) => b.totalScore - a.totalScore);
  const round = view.round;

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
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            <h2 className="mb-4 text-center text-lg font-bold">{fr.scoreboard}</h2>

            <ul className="space-y-1.5">
              {sorted.map((p, i) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${
                    i === 0 ? 'bg-brass-400/12 ring-1 ring-brass-400/25' : 'bg-felt-900/40'
                  }`}
                >
                  <span className="w-5 text-center text-xs font-semibold tabular-nums text-paper-50/40">
                    {i + 1}
                  </span>
                  <span className="text-xl leading-none" aria-hidden="true">
                    {p.avatar}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {p.pseudo}
                    {p.id === view.you && <span className="ml-1 text-[11px] text-paper-50/45">({fr.you})</span>}
                  </span>
                  {round && round.bids[p.id] !== null && (
                    <span className="shrink-0 text-[11px] tabular-nums text-paper-50/50">
                      {round.tricksWon[p.id] ?? 0}/{round.bids[p.id]}
                    </span>
                  )}
                  <span className="w-12 shrink-0 text-right text-base font-bold tabular-nums text-brass-300">
                    {p.totalScore}
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-white/8 py-3 text-sm font-medium transition active:scale-[0.98]"
            >
              Fermer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
