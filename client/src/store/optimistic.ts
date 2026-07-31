import type { Card, GameView } from '@rikiki/shared';
import { cardId } from '@rikiki/shared';

/**
 * Affichage optimiste.
 *
 * Sur un réseau mobile, l'aller-retour serveur coûte 80 à 300 ms : si on
 * attend sa réponse pour bouger la carte, le jeu paraît mou et on doute
 * d'avoir bien appuyé. On applique donc le coup localement tout de suite,
 * puis la vue du serveur — qui reste seule juge — prend le relais.
 *
 * En cas de refus, l'état optimiste est simplement abandonné : la vue
 * serveur, jamais modifiée, se réaffiche telle quelle.
 */
export interface OptimisticState {
  /** Carte posée localement, en attente de confirmation. */
  playedCard: { card: Card; playerId: string } | null;
  /** Annonce faite localement, en attente de confirmation. */
  bid: number | null;
}

export const EMPTY_OPTIMISTIC: OptimisticState = { playedCard: null, bid: null };

/**
 * Vue à afficher = vue du serveur + coup local en attente.
 * Aucune règle du jeu n'est réimplémentée ici : on ne fait que déplacer une
 * carte déjà validée comme jouable par le serveur (`legalCardIds`).
 */
export function applyOptimistic(view: GameView, optimistic: OptimisticState): GameView {
  if (!view.round) return view;
  if (!optimistic.playedCard && optimistic.bid === null) return view;

  const round = { ...view.round };
  let changed = false;

  if (optimistic.playedCard) {
    const { card, playerId } = optimistic.playedCard;
    const id = cardId(card);
    const alreadyPlayed = round.currentTrick.plays.some((p) => cardId(p.card) === id);
    const stillInHand = round.myHand.some((c) => cardId(c) === id);

    // On n'applique que si le serveur n'a pas encore intégré le coup
    if (!alreadyPlayed && stillInHand && playerId === view.you) {
      round.myHand = round.myHand.filter((c) => cardId(c) !== id);
      round.currentTrick = {
        ...round.currentTrick,
        plays: [...round.currentTrick.plays, { playerId, card }],
      };
      // Plus rien n'est jouable tant que le serveur n'a pas répondu
      round.legalCardIds = null;
      changed = true;
    }
  }

  if (optimistic.bid !== null && round.bids[view.you] === null) {
    round.bids = { ...round.bids, [view.you]: optimistic.bid };
    round.legalBids = null;
    changed = true;
  }

  return changed ? { ...view, round } : view;
}
