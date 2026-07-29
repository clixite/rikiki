import { AnimatePresence, motion } from 'motion/react';
import type { CompletedTrick, GameView, Trick } from '@rikiki/shared';
import { cardId } from '@rikiki/shared';
import CardFace from './CardFace';
import type { FeltLayout } from './tableLayout';

interface Props {
  view: GameView;
  frozenTrick: CompletedTrick | null;
  layout: FeltLayout;
}

/**
 * Le pli, au centre du tapis.
 *
 * Les cartes étaient alignées dans une rangée souple avec le pseudo de leur
 * auteur en dessous. À six joueurs et plus, la rangée se repliait sur deux ou
 * trois lignes et recouvrait toute la table.
 *
 * Chaque carte se pose donc DEVANT son propriétaire, sur une ellipse
 * intérieure qui reprend exactement les angles des sièges. La position dit qui
 * a joué : plus besoin d'étiquette, et le nombre de joueurs ne change plus
 * rien à la hauteur occupée. C'est la disposition des jeux de plis mobiles les
 * plus joués, et c'est aussi celle d'une vraie table.
 *
 * Les cartes gardent le `layoutId` qu'elles avaient dans la main : elles y
 * « volent » naturellement (technique FLIP) au lieu d'apparaître d'un coup.
 */
export default function TrickArea({ view, frozenTrick, layout }: Props) {
  const round = view.round!;
  const trick: Trick = frozenTrick ?? round.currentTrick;
  const winnerId = frozenTrick?.winnerId;
  const n = view.players.length;
  const mySeat = view.players.find((p) => p.id === view.you)?.seat ?? 0;

  const cardW = layout.trickCardW;
  const cardH = layout.trickCardH;

  /** Rang du joueur sur l'arc, de ma gauche à ma droite (0 = juste après moi). */
  const arcIndex = (playerId: string) => {
    const seat = view.players.find((p) => p.id === playerId)?.seat ?? 0;
    return ((seat - mySeat + n) % n) - 1;
  };

  /** Emplacement d'un joueur : le mien en bas, les autres sous leur siège. */
  const slotOf = (playerId: string) =>
    playerId === view.you ? layout.mySlot : (layout.slots[arcIndex(playerId)] ?? layout.centre);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      data-testid="trick-area"
      // Nombre de cartes posées : lisible par les scripts de capture et de test
      data-trick-cards={trick.plays.length}
    >
      {/* Ancrage de la zone de dépose, tant que personne n'a joué */}
      {trick.plays.length === 0 && (
        <div
          className="absolute flex items-center justify-center rounded-lg border border-dashed border-white/12"
          style={{
            width: cardW,
            height: cardH,
            left: layout.centre.x - cardW / 2,
            top: layout.centre.y - cardH / 2,
          }}
          aria-hidden="true"
        >
          <span className="text-xl text-white/12">♠</span>
        </div>
      )}

      <AnimatePresence>
        {trick.plays.map(({ playerId, card }) => {
          const slot = slotOf(playerId);
          const isWinner = winnerId === playerId;
          return (
            <motion.div
              key={playerId}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: isWinner ? 1.12 : 1 }}
              exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              data-testid={`trick-card-${playerId}`}
              className="absolute"
              style={{
                left: slot.x - cardW / 2,
                top: slot.y - cardH / 2,
                // Empilement de gauche à droite : chaque carte ne masque que le
                // bord DROIT de sa voisine, jamais son index haut-gauche. Ma
                // carte, jetée par le bas, passe devant tout le monde.
                // L'ordre gauche→droite ne souffre AUCUNE exception : mettre
                // le gagnant au premier plan masquait l'index de son voisin de
                // droite. Sa mise en avant se fait à l'échelle et à l'anneau.
                // Ma carte, elle, est décalée vers le bas : elle passe devant
                // sans jamais recouvrir l'index de personne.
                zIndex: playerId === view.you ? 20 : arcIndex(playerId),
              }}
            >
              <div className="relative">
                <CardFace
                  card={card}
                  layoutId={`card-${cardId(card)}`}
                  width={cardW}
                  size={cardW >= 56 ? 'lg' : cardW >= 46 ? 'md' : 'sm'}
                />
                {/* Ma carte est décalée vers le bas au milieu des autres : sans
                    repère, on la prend pour celle du joueur d'en face. */}
                {playerId === view.you && !isWinner && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-0.5 rounded-lg ring-2 ring-paper-50/45"
                  />
                )}
                {isWinner && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pointer-events-none absolute -inset-1 rounded-lg ring-2 ring-brass-300"
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
