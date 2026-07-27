import { motion } from 'motion/react';
import type { GameView } from '@rikiki/shared';
import PlayerAvatar from './PlayerAvatar';
import { useT } from '../i18n';

import { nextRound } from '../socket';
import { useGame } from '../store/game';

interface Props {
  view: GameView;
}

export default function RoundRecap({ view }: Props) {
  const t = useT();
  const round = view.round!;
  const outcome = useGame((s) => s.roundOutcome);
  const isHost = view.hostId === view.you;
  const isLastRound = round.roundIndex === view.roundsSequence.length - 1;
  const sorted = [...view.players].sort((a, b) => b.totalScore - a.totalScore);
  const myPoints = round.roundScores?.[view.you] ?? 0;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center">
      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="w-full max-w-md rounded-t-3xl bg-felt-800 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] ring-1 ring-white/10 sm:rounded-3xl"
        style={{ boxShadow: 'var(--shadow-panel)' }}
        data-testid="round-recap"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

        <h2 className="text-center text-xl font-bold">{t.roundRecap}</h2>
        <p className="mt-0.5 text-center text-xs text-paper-50/50">
          {t.round} {round.roundIndex + 1}/{view.roundsSequence.length} · {t.cards(round.cardsCount)}
        </p>

        {/* Verdict personnel : la première chose qu'on cherche des yeux */}
        {outcome && (
          <motion.div
            data-testid="round-outcome"
            data-outcome={outcome}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.05 }}
            className={`mx-auto my-3 flex w-fit items-center gap-2 rounded-full px-4 py-1.5 ${
              outcome === 'success'
                ? 'bg-success/15 text-success ring-1 ring-success/30'
                : 'bg-danger/15 text-danger ring-1 ring-danger/30'
            }`}
          >
            <motion.span
              aria-hidden="true"
              className="text-lg leading-none"
              initial={{ rotate: outcome === 'success' ? -25 : 0, y: outcome === 'fail' ? -3 : 0 }}
              animate={{ rotate: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 12, delay: 0.12 }}
            >
              {outcome === 'success' ? '✓' : '✕'}
            </motion.span>
            <span className="text-sm font-bold">
              {outcome === 'success' ? t.contractKept : t.contractMissed}
            </span>
            <span className="text-sm font-bold tabular-nums">
              {myPoints > 0 ? `+${myPoints}` : myPoints}
            </span>
          </motion.div>
        )}

        <ul className="space-y-1.5">
          {sorted.map((p, i) => {
            const bid = round.bids[p.id] ?? 0;
            const tricks = round.tricksWon[p.id] ?? 0;
            const pts = round.roundScores?.[p.id] ?? 0;
            const success = bid === tricks;
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className="flex items-center gap-2.5 rounded-xl bg-felt-900/40 px-3 py-2"
              >
                <PlayerAvatar avatar={p.avatar} size={22} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {p.pseudo}
                  {p.id === view.you && <span className="ml-1 text-[11px] text-paper-50/45">({t.you})</span>}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-paper-50/60">
                  {tricks}/{bid}
                </span>
                <span
                  className={`w-14 shrink-0 text-right text-sm font-bold tabular-nums ${
                    success ? 'text-success' : 'text-danger'
                  }`}
                >
                  {pts > 0 ? `+${pts}` : pts}
                </span>
                <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-brass-300">
                  {p.totalScore}
                </span>
              </motion.li>
            );
          })}
        </ul>

        <div className="mt-5">
          {isHost ? (
            <button
              type="button"
              data-testid="next-round"
              onClick={() => nextRound()}
              className="w-full rounded-2xl bg-linear-to-b from-brass-300 to-brass-500 py-3.5 text-base font-bold text-felt-950 transition active:scale-[0.98]"
              style={{ boxShadow: '0 4px 16px -4px rgb(0 0 0 / 0.5)' }}
            >
              {isLastRound ? t.seeResults : t.nextRound}
            </button>
          ) : (
            <p className="rk-shimmer rounded-xl py-3 text-center text-sm text-paper-50/60">
              {t.waitingNextRound}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
