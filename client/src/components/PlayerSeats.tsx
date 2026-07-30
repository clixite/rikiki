import { AnimatePresence, m as motion } from 'motion/react';
import type { GameView, PhraseId } from '@rikiki/shared';
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
  const phrases = useGame((s) => s.phrases);
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
        // Pendant les annonces, aucun pli n'a encore été joué : tout le monde
        // est à zéro. Comparer les plis au contrat n'a donc aucun sens — et
        // colorerait en vert une annonce de 0 comme si elle était déjà tenue.
        const bidding = view.phase === 'bidding';
        const done = !bidding && hasBid && tricks === bid;
        const over = !bidding && hasBid && tricks > bid;

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
            <SeatBubbles
              emotes={emotes.filter((e) => e.playerId === p.id)}
              phrases={phrases.filter((e) => e.playerId === p.id)}
            />

            <div
              className={`relative rounded-full p-0.5 ${
                isCurrent ? 'rk-turn bg-brass-400/20' : 'bg-felt-900/50 ring-1 ring-white/8'
              } ${p.connected && !p.paused ? '' : 'opacity-45'}`}
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

              {/* Score total.
                  On le consulte souvent, mais il n'a droit à aucune ligne :
                  la hauteur d'un siège est réservée par `feltLayout`, et une
                  ligne de plus ferait mordre les sièges sur le pli dès qu'un
                  joueur est hors ligne. Il se pose donc en absolu sur le bord
                  bas de l'avatar — juste au-dessus du pseudo, sans rien
                  pousser. Volontairement terne et menu : c'est la pastille de
                  contrat qu'on doit voir en premier, pas lui. Sur une table
                  trop serrée pour les pseudos, il disparaît avec eux. */}
              {layout.showName && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-felt-950/75 px-1 text-[10px] font-semibold leading-none tabular-nums text-paper-50/55"
                  title={`${t.total} : ${p.totalScore}`}
                >
                  {p.totalScore}
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
                title={bidding ? `${t.bid} : ${bid}` : t.tricksOfContract(tricks, bid)}
              >
                {/* Tant qu'on annonce, « 0/3 » se lit comme un score déjà
                    entamé alors qu'il ne s'est rien passé : on ne montre que
                    le nombre annoncé, et le rapport plis/contrat n'apparaît
                    qu'au moment où les plis commencent à tomber. */}
                {bidding ? bid : `${tricks}/${bid}`}
              </span>
            ) : (
              <span className="mt-0.5 text-[11px] leading-tight text-paper-50/40">
                {view.phase === 'bidding' ? t.thinking : '—'}
              </span>
            )}

            {/* Une pause est un choix, pas une panne : elle se dit autrement
                qu'une déconnexion, et prime sur elle — quelqu'un qui verrouille
                son téléphone après avoir demandé une pause n'a pas « lâché »
                la partie, il l'avait annoncé. */}
            {p.paused ? (
              <span className="text-[10px] leading-tight text-brass-300">{t.pausedTag}</span>
            ) : (
              !p.connected && <span className="text-[10px] leading-tight text-danger">{t.offline}</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Ce qu'un joueur vient d'envoyer : réactions et petites phrases.
 *
 * Tout se pose en absolu au-dessus du siège pour ne pas le décaler — une table
 * qui sursaute à chaque bisou serait vite pénible. Les deux partagent la même
 * colonne (`bottom-full`) : une phrase et une réaction envoyées coup sur coup
 * s'empilent au lieu de se recouvrir, sans qu'aucun décalage soit écrit à
 * l'avance.
 */
function SeatBubbles({
  emotes,
  phrases,
}: {
  emotes: { id: number; emote: keyof typeof EMOTE_GLYPH }[];
  phrases: { id: number; phrase: PhraseId }[];
}) {
  const t = useT();
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 flex-col items-center gap-0.5">
      <AnimatePresence>
        {phrases.map((p) => (
          <motion.span
            key={`p${p.id}`}
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10 }}
            transition={{ type: 'spring', stiffness: 460, damping: 26 }}
            // `w-max` sur un siège de 44 px : la bulle déborde volontairement
            // de part et d'autre, sinon la phrase se couperait en cinq lignes.
            className="w-max max-w-40 rounded-xl bg-felt-950/90 px-2 py-1 text-center text-[11px] font-medium leading-tight text-paper-50 ring-1 ring-white/10"
            data-testid={`seat-phrase-${p.phrase}`}
          >
            {t.phraseTexts[p.phrase]}
          </motion.span>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {emotes.length > 0 && (
          <motion.div key="emotes" className="flex gap-0.5">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
