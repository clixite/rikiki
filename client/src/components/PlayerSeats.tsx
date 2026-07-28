import { AnimatePresence, motion } from 'motion/react';
import type { GameView } from '@rikiki/shared';
import { useT } from '../i18n';
import PlayerAvatar from './PlayerAvatar';
import { EMOTE_GLYPH } from './EmoteBar';
import { useGame } from '../store/game';

interface Props {
  view: GameView;
}

/**
 * Les adversaires, placés autour de la table.
 *
 * Une rangée de pastilles en haut de l'écran ne dit rien de la position des
 * joueurs : on ne sait ni qui suit qui, ni où regarder quand une carte tombe.
 * Les joueurs sont donc disposés sur un arc, dans l'ordre réel du tour à
 * partir de soi — le joueur suivant est toujours à gauche, comme sur une vraie
 * table où l'on joue dans le sens des aiguilles d'une montre.
 *
 * Le joueur dont c'est le tour est le seul élément lumineux du tapis : c'est
 * la question qu'on se pose dix fois par manche.
 */

/**
 * Position de chaque siège, en pourcentage du tapis, selon le nombre
 * d'adversaires. On part du bas-gauche, on remonte par le haut, on redescend
 * à droite : soi-même occupe le bas de l'écran.
 */
const SEATS: Record<number, [number, number][]> = {
  1: [[50, 4]],
  2: [
    [15, 8],
    [85, 8],
  ],
  3: [
    [11, 20],
    [50, 2],
    [89, 20],
  ],
  4: [
    [9, 28],
    [29, 3],
    [71, 3],
    [91, 28],
  ],
  5: [
    [7, 34],
    [21, 9],
    [50, 1],
    [79, 9],
    [93, 34],
  ],
  6: [
    [7, 38],
    [15, 13],
    [37, 2],
    [63, 2],
    [85, 13],
    [93, 38],
  ],
  7: [
    [6, 42],
    [11, 19],
    [29, 5],
    [50, 0],
    [71, 5],
    [89, 19],
    [94, 42],
  ],
};

export default function PlayerSeats({ view }: Props) {
  const t = useT();
  const emotes = useGame((s) => s.emotes);
  const me = view.players.find((p) => p.id === view.you);
  const round = view.round;
  const n = view.players.length;
  const mySeat = me?.seat ?? 0;

  // Ordre du tour à partir de soi : le joueur juste après moi vient en premier
  const others = [...view.players]
    .filter((p) => p.id !== view.you)
    .sort((a, b) => ((a.seat - mySeat + n) % n) - ((b.seat - mySeat + n) % n));

  const positions = SEATS[others.length] ?? SEATS[7];

  return (
    <div className="pointer-events-none absolute inset-0" data-testid="player-seats">
      {others.map((p, i) => {
        const [x, y] = positions[i] ?? positions[positions.length - 1];
        const isCurrent =
          round !== null &&
          view.phase !== 'round-scoring' &&
          view.phase !== 'game-over' &&
          round.currentSeat === p.seat;
        const bid = round?.bids[p.id];
        const tricks = round?.tricksWon[p.id] ?? 0;
        const isDealer = round?.dealerSeat === p.seat;
        const hasBid = bid !== null && bid !== undefined;
        const done = hasBid && tricks === bid;
        const over = hasBid && tricks > bid;

        return (
          <motion.div
            key={p.id}
            layout
            animate={{ scale: isCurrent ? 1.08 : 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            data-testid={`opponent-${p.id}`}
            data-current={isCurrent ? 'true' : 'false'}
            className="absolute flex w-24 -translate-x-1/2 flex-col items-center"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <SeatEmotes emotes={emotes.filter((e) => e.playerId === p.id)} />

            <div
              className={`relative rounded-full p-0.5 ${
                isCurrent ? 'rk-turn bg-brass-400/20' : 'bg-felt-900/50 ring-1 ring-white/8'
              } ${p.connected ? '' : 'opacity-45'}`}
            >
              <PlayerAvatar playerId={p.id} avatar={p.avatar} photo={p.photo} size={44} className="rounded-full" />
              {isDealer && (
                <span
                  className="absolute -right-1 -top-1 rounded-full bg-brass-400 px-1.5 text-[10px] font-bold leading-tight text-felt-950"
                  title={t.dealer}
                >
                  D
                </span>
              )}
            </div>

            <span className="mt-1 max-w-full truncate text-[13px] font-semibold leading-tight text-paper-50">
              {p.pseudo}
            </span>

            {/* Contrat : la donnée qu'on relit sans arrêt pendant la manche */}
            {hasBid ? (
              <span
                className={`mt-0.5 rounded-full px-2 py-0.5 text-[13px] font-bold tabular-nums leading-tight ${
                  over
                    ? 'bg-danger/20 text-danger'
                    : done
                      ? 'bg-success/20 text-success'
                      : 'bg-felt-950/60 text-brass-300'
                }`}
                title={t.tricksOfContract(tricks, bid)}
              >
                {tricks}/{bid}
              </span>
            ) : (
              <span className="mt-0.5 text-[12px] leading-tight text-paper-50/40">
                {view.phase === 'bidding' ? t.thinking : '—'}
              </span>
            )}

            {!p.connected && <span className="text-[10px] leading-tight text-danger">{t.offline}</span>}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Bulles de réaction au-dessus d'un joueur.
 *
 * Elles se posent en absolu pour ne pas décaler le siège : une table qui
 * sursaute à chaque bisou serait vite pénible.
 */
function SeatEmotes({ emotes }: { emotes: { id: number; emote: keyof typeof EMOTE_GLYPH }[] }) {
  return (
    <div className="pointer-events-none absolute -top-9 left-1/2 flex -translate-x-1/2 gap-0.5">
      <AnimatePresence>
        {emotes.map((e) => (
          <motion.span
            key={e.id}
            initial={{ opacity: 0, scale: 0.4, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -14 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="text-3xl drop-shadow-lg"
            aria-hidden="true"
          >
            {EMOTE_GLYPH[e.emote]}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
