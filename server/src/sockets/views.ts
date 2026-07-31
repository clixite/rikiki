import type { GameState, GameView, RoundView } from '@rikiki/shared';
import { cardId, legalBids, legalCards } from '@rikiki/shared';

/** Projette l'état complet vers la vue d'UN joueur — jamais les mains adverses. */
export function projectView(state: GameState, playerId: string): GameView {
  const { round, seed: _seed, ...rest } = state;

  let roundView: RoundView | null = null;
  if (round) {
    const { hands, ...publicRound } = round;
    const me = state.players.find((p) => p.id === playerId);
    const isMyTurn = me !== undefined && round.currentSeat === me.seat;

    let myLegalBids: number[] | null = null;
    if (state.phase === 'bidding' && isMyTurn) {
      const others = Object.entries(round.bids).filter(([id]) => id !== playerId);
      const otherSum = others.reduce((sum, [, b]) => sum + (b ?? 0), 0);
      const isLast = others.every(([, b]) => b !== null);
      myLegalBids = legalBids(round.cardsCount, otherSum, isLast);
    }

    let myLegalCardIds: string[] | null = null;
    if (state.phase === 'playing' && isMyTurn) {
      myLegalCardIds = legalCards(hands[playerId] ?? [], round.currentTrick).map(cardId);
    }

    roundView = {
      ...publicRound,
      myHand: hands[playerId] ?? [],
      handCounts: Object.fromEntries(state.players.map((p) => [p.id, hands[p.id]?.length ?? 0])),
      legalBids: myLegalBids,
      legalCardIds: myLegalCardIds,
    };
  }

  return { ...rest, you: playerId, round: roundView };
}
