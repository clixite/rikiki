import { motion } from 'motion/react';
import type { GameView } from '@rikiki/shared';
import { fr } from '../i18n/fr';
import PlayerAvatar from './PlayerAvatar';

interface Props {
  view: GameView;
}

/**
 * Les autres joueurs, dans l'ordre réel de la table à partir de soi.
 * Chaque pastille indique en un coup d'œil : qui joue, le contrat annoncé,
 * les plis déjà remportés, et l'état de connexion.
 */
export default function OpponentsBar({ view }: Props) {
  const me = view.players.find((p) => p.id === view.you);
  const round = view.round;
  const n = view.players.length;
  const mySeat = me?.seat ?? 0;

  const others = [...view.players]
    .filter((p) => p.id !== view.you)
    .sort((a, b) => ((a.seat - mySeat + n) % n) - ((b.seat - mySeat + n) % n));

  return (
    <div className="flex flex-wrap items-start justify-center gap-1.5 px-2" data-testid="opponents-bar">
      {others.map((p) => {
        const isCurrent =
          round !== null && view.phase !== 'round-scoring' && view.phase !== 'game-over' && round.currentSeat === p.seat;
        const bid = round?.bids[p.id];
        const tricks = round?.tricksWon[p.id] ?? 0;
        const isDealer = round?.dealerSeat === p.seat;
        const done = bid !== null && bid !== undefined && tricks === bid;
        const over = bid !== null && bid !== undefined && tricks > bid;

        return (
          <motion.div
            key={p.id}
            layout
            animate={isCurrent ? { scale: 1.04 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            data-testid={`opponent-${p.id}`}
            data-current={isCurrent ? 'true' : 'false'}
            className={`relative flex min-w-[4.25rem] flex-col items-center rounded-xl px-2 py-1.5 ${
              isCurrent ? 'rk-turn bg-felt-700/80' : 'bg-felt-900/45'
            } ${p.connected ? '' : 'opacity-45'}`}
          >
            <PlayerAvatar avatar={p.avatar} size={26} />
            <span className="mt-0.5 max-w-[4.5rem] truncate text-[11px] font-medium leading-tight text-paper-50">
              {p.pseudo}
            </span>

            {bid === null || bid === undefined ? (
              <span className="text-[10px] leading-tight text-paper-50/40">
                {view.phase === 'bidding' ? fr.thinking : '—'}
              </span>
            ) : (
              <span
                className={`text-[11px] font-semibold tabular-nums leading-tight ${
                  over ? 'text-danger' : done ? 'text-success' : 'text-brass-300'
                }`}
                title={fr.tricksOfContract(tricks, bid)}
              >
                {tricks}/{bid}
              </span>
            )}

            {isDealer && (
              <span
                className="absolute -right-0.5 -top-0.5 rounded-full bg-brass-400 px-1 text-[8px] font-bold text-felt-950"
                title={fr.dealer}
              >
                D
              </span>
            )}
            {!p.connected && (
              <span className="text-[8px] leading-tight text-danger">{fr.offline}</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
