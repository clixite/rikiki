import { useEffect } from 'react';
import { m as motion } from 'motion/react';
import type { GameView } from '@rikiki/shared';
import CardFace, { suitSymbol, suitInkClass } from './CardFace';
import PlayerAvatar from './PlayerAvatar';
import { useElementSize } from './tableLayout';
import { useT } from '../i18n';

interface Props {
  view: GameView;
  onClose: () => void;
}

/** Écart entre deux cartes du pli figé, en pixels. */
const GAP = 6;
/** En dessous, le rang de la carte n'est plus lisible ; au-delà, on gaspille la largeur. */
const CARD_W_MIN = 30;
const CARD_W_MAX = 76;

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

/**
 * Le pli précédent, figé comme une photo.
 *
 * Sur une vraie table, on peut toujours redemander « qui a joué quoi ? » ; ici
 * le pli disparaît en une seconde et l'information est perdue pour de bon. Un
 * joueur qui hésite doit donc pouvoir revoir la donne SANS quitter la table :
 * d'où une feuille modale posée par-dessus le tapis plutôt qu'un écran à part.
 *
 * Les cartes gardent leur ordre de jeu — c'est lui qui raconte le pli : la
 * première impose la couleur, la dernière décide souvent du gagnant.
 */
export default function LastTrickSheet({ view, onClose }: Props) {
  const t = useT();
  const [rowRef, rowSize] = useElementSize<HTMLDivElement>();
  const trick = view.round?.lastTrick ?? null;

  // Fermeture au clavier : sur un iPad avec clavier, « Échap » est le réflexe.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Premier pli de la manche, ou manche à peine ouverte : rien à revoir.
  if (!trick || trick.plays.length === 0) return null;

  const byId = new Map(view.players.map((p) => [p.id, p]));
  const winner = byId.get(trick.winnerId);
  const ledSuit = trick.plays[0].card.suit;

  /*
   * Largeur d'une carte : calculée depuis la place réellement disponible, comme
   * le fait le tapis. Une taille figée ne peut pas convenir à la fois à trois
   * joueurs et à huit — à huit sur un iPhone SE, la rangée sortirait de l'écran
   * ou se replierait, et le pli ne se lirait plus d'un coup d'œil.
   *
   * La toute première passe de rendu n'a pas encore mesuré : on part d'une
   * largeur de téléphone étroit, corrigée avant l'affichage (mesure en
   * `useLayoutEffect`), donc sans clignotement.
   */
  const n = trick.plays.length;
  const available = rowSize.width || 335;
  const cardW = clamp(Math.floor((available - GAP * (n - 1)) / n), CARD_W_MIN, CARD_W_MAX);
  const cardSize = cardW >= 56 ? 'lg' : cardW >= 46 ? 'md' : cardW >= 34 ? 'sm' : 'xs';
  const avatarSize = clamp(Math.round(cardW * 0.55), 16, 26);

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="last-trick-sheet"
    >
      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="w-full max-w-md rounded-t-3xl bg-felt-800 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] ring-1 ring-white/10 sm:rounded-3xl sm:p-5"
        style={{ boxShadow: 'var(--shadow-panel)' }}
        // Le fond ferme la feuille : le panneau, lui, ne doit pas la fermer
        // sous les doigts de qui veut simplement regarder les cartes.
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

        <h2 className="text-center text-[11px] font-semibold uppercase tracking-widest text-paper-50/55">
          {t.lastTrick}
        </h2>

        <div ref={rowRef} className="mt-3 flex items-start justify-center" style={{ gap: GAP }}>
          {trick.plays.map(({ playerId, card }, i) => {
            const player = byId.get(playerId);
            const isWinner = playerId === trick.winnerId;
            const isLeader = i === 0;
            return (
              <div
                key={playerId}
                className="flex flex-col items-center"
                style={{ width: cardW }}
                data-testid={`last-trick-play-${playerId}`}
              >
                {/*
                 * Repère d'entame, au-dessus des cartes : sans lui, on ne sait
                 * plus quelle couleur était demandée, et donc pourquoi telle
                 * carte a gagné. La ligne existe pour tout le monde, vide chez
                 * les autres, sinon les cartes ne seraient plus alignées.
                 */}
                <span className="flex h-4 items-center text-[10px] leading-none">
                  {isLeader && (
                    <span
                      className="flex items-center gap-px rounded-full bg-white/10 px-1 py-0.5"
                      aria-label={t.suitNames[ledSuit] ?? ledSuit}
                    >
                      <span aria-hidden="true" className="text-paper-50/60">
                        ▸
                      </span>
                      <span
                        aria-hidden="true"
                        className={`${suitInkClass(ledSuit)} brightness-125 saturate-150`}
                      >
                        {suitSymbol(ledSuit)}
                      </span>
                    </span>
                  )}
                </span>

                <div className="relative mt-1">
                  {/* Aucun `layoutId` ici : ces cartes sont une photo, pas les
                      cartes du tapis — les faire voler d'un composant à
                      l'autre les arracherait au pli en cours. */}
                  <CardFace card={card} width={cardW} size={cardSize} />
                  {isWinner && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-1 rounded-lg ring-2 ring-brass-300"
                    />
                  )}
                </div>

                <PlayerAvatar
                  playerId={playerId}
                  avatar={player?.avatar ?? '🙂'}
                  photo={player?.photo}
                  size={avatarSize}
                  className="mt-2"
                />
                <span
                  className={`mt-0.5 w-full truncate text-center text-[10px] leading-tight ${
                    isWinner ? 'font-semibold text-brass-300' : 'text-paper-50/60'
                  }`}
                >
                  {playerId === view.you ? t.you : (player?.pseudo ?? '')}
                </span>
              </div>
            );
          })}
        </div>

        {winner && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-brass-300">
            <PlayerAvatar
              playerId={winner.id}
              avatar={winner.avatar}
              photo={winner.photo}
              size={20}
            />
            {t.trickWonBy(winner.pseudo)}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          data-testid="last-trick-close"
          className="mt-4 min-h-11 w-full rounded-xl bg-white/8 py-3 text-sm font-medium transition active:scale-[0.98]"
        >
          {t.close}
        </button>
      </motion.div>
    </div>
  );
}
