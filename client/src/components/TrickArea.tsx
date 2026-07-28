import { AnimatePresence, motion } from 'motion/react';
import type { CompletedTrick, GameView, Trick } from '@rikiki/shared';
import { cardId } from '@rikiki/shared';
import CardFace from './CardFace';

interface Props {
  view: GameView;
  frozenTrick: CompletedTrick | null;
}

/**
 * Centre du tapis. Les cartes conservent le `layoutId` qu'elles avaient dans
 * la main : elles y « volent » naturellement (technique FLIP) au lieu
 * d'apparaître d'un coup.
 */
export default function TrickArea({ view, frozenTrick }: Props) {
  const round = view.round!;
  const trick: Trick = frozenTrick ?? round.currentTrick;
  const winnerId = frozenTrick?.winnerId;
  const empty = trick.plays.length === 0;

  return (
    <div
      className="flex min-h-[9.5rem] w-full items-center justify-center px-3"
      data-testid="trick-area"
      // Nombre de cartes posées : lisible par les scripts de capture et de test
      data-trick-cards={trick.plays.length}
    >
      {empty ? (
        <div className="flex h-28 w-[4.75rem] items-center justify-center rounded-lg border border-dashed border-white/12">
          <span className="text-2xl text-white/12">♠</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-1">
          <AnimatePresence mode="popLayout">
            {trick.plays.map(({ playerId, card }) => {
              const player = view.players.find((p) => p.id === playerId);
              const isWinner = winnerId === playerId;
              const isMine = playerId === view.you;
              return (
                <motion.div
                  key={playerId}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{
                    opacity: 1,
                    scale: isWinner ? 1.06 : 1,
                    y: isWinner ? -4 : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.18 } }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="relative">
                    <CardFace card={card} size="lg" layoutId={`card-${cardId(card)}`} />
                    {isWinner && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pointer-events-none absolute -inset-1 rounded-lg ring-2 ring-brass-300"
                      />
                    )}
                  </div>
                  <span
                    className={`max-w-[5rem] truncate text-[12px] font-medium leading-tight ${
                      isWinner ? 'font-semibold text-brass-200' : 'text-paper-50/60'
                    }`}
                  >
                    {isMine ? '● ' : ''}
                    {player?.pseudo}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
