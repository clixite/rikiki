import { AnimatePresence, motion } from 'motion/react';
import type { GameView } from '@rikiki/shared';
import { useT } from '../i18n';
import PlayerAvatar from './PlayerAvatar';
import { EMOTE_GLYPH } from './EmoteBar';
import { useGame } from '../store/game';
import TurnCountdown from './TurnCountdown';
import type { FeltLayout } from './tableLayout';

interface Props {
  view: GameView;
  layout: FeltLayout;
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
 * Les positions viennent de `feltLayout` : calculées depuis la taille réelle du
 * feutre, elles ne peuvent plus sortir de l'écran ni se recouvrir entre elles.
 *
 * Le joueur dont c'est le tour est le seul élément lumineux du tapis : c'est
 * la question qu'on se pose dix fois par manche.
 */
export default function PlayerSeats({ view, layout }: Props) {
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

  return (
    <div className="pointer-events-none absolute inset-0" data-testid="player-seats">
      {others.map((p, i) => {
        const pos = layout.seats[i] ?? layout.centre;
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
            animate={{ scale: isCurrent ? 1.06 : 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            data-testid={`opponent-${p.id}`}
            data-current={isCurrent ? 'true' : 'false'}
            className="absolute flex flex-col items-center"
            style={{
              width: layout.seatW,
              // La hauteur est imposée, pas déduite du contenu : c'est elle que
              // la géométrie réserve, et c'est sur elle que se cale le pseudo
              // du joueur attendu quand les autres noms ne tiennent pas.
              minHeight: layout.seatH,
              left: pos.x - layout.seatW / 2,
              top: pos.y - layout.seatH / 2,
            }}
          >
            <SeatEmotes emotes={emotes.filter((e) => e.playerId === p.id)} />

            <div
              className={`relative rounded-full p-0.5 ${
                isCurrent ? 'rk-turn bg-brass-400/20' : 'bg-felt-900/50 ring-1 ring-white/8'
              } ${p.connected ? '' : 'opacity-45'}`}
            >
              <PlayerAvatar
                playerId={p.id}
                avatar={p.avatar}
                photo={p.photo}
                size={layout.avatar}
                className="rounded-full"
              />
              {isCurrent && <TurnCountdown deadline={view.turnDeadline} size={layout.avatar + 12} />}
              {isDealer && (
                <span
                  className="absolute -right-1 -top-1 rounded-full bg-brass-400 px-1.5 text-[10px] font-bold leading-tight text-felt-950"
                  title={t.dealer}
                >
                  D
                </span>
              )}
            </div>

            {/* Le pseudo tient sur la largeur du siège, jamais au-delà : sinon
                deux voisins se recouvrent dès qu'un nom est long. Sur une table
                très serrée il disparaît — l'avatar identifie déjà le joueur, et
                trois lettres suivies de points de suspension n'apprennent
                rien à personne. */}
            {layout.showName ? (
              <span className="mt-1 w-full truncate px-0.5 text-center text-[12px] font-semibold leading-tight text-paper-50">
                {p.pseudo}
              </span>
            ) : isCurrent ? (
              // Une table à huit ne laisse pas la place à huit pseudos ; celui
              // qu'on attend, en revanche, doit pouvoir se nommer. Il se pose
              // dans la bande réservée en bas du siège, jamais sur les cartes.
              <span className="absolute bottom-0 left-1/2 max-w-24 -translate-x-1/2 truncate rounded-full bg-felt-950/85 px-1.5 text-[11px] font-semibold leading-tight text-brass-200">
                {p.pseudo}
              </span>
            ) : (
              <span className="sr-only">{p.pseudo}</span>
            )}

            {/* Contrat : la donnée qu'on relit sans arrêt pendant la manche */}
            {hasBid ? (
              <span
                className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[12px] font-bold tabular-nums leading-tight ${
                  over
                    ? 'bg-danger/25 text-danger'
                    : done
                      ? 'bg-success/25 text-success'
                      : 'bg-felt-950/70 text-brass-300'
                }`}
                title={t.tricksOfContract(tricks, bid)}
              >
                {tricks}/{bid}
              </span>
            ) : (
              <span className="mt-0.5 text-[11px] leading-tight text-paper-50/40">
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
    <div className="pointer-events-none absolute -top-8 left-1/2 flex -translate-x-1/2 gap-0.5">
      <AnimatePresence>
        {emotes.map((e) => (
          <motion.span
            key={e.id}
            initial={{ opacity: 0, scale: 0.4, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -14 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="text-2xl drop-shadow-lg"
            aria-hidden="true"
          >
            {EMOTE_GLYPH[e.emote]}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
