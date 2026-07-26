import { describe, expect, it } from 'vitest';
import { cardFromId } from '../src/cards';
import { legalBids, legalCards, maxCards, roundsSequence, scoreRound, trickWinner } from '../src/rules';
import type { Trick } from '../src/types';

describe('maxCards', () => {
  it('respecte le plafond de 10 et garde une carte pour l’atout', () => {
    expect(maxCards(3)).toBe(10);
    expect(maxCards(4)).toBe(10);
    expect(maxCards(5)).toBe(10);
    expect(maxCards(6)).toBe(8);
    expect(maxCards(7)).toBe(7);
    expect(maxCards(8)).toBe(6);
    for (let n = 3; n <= 8; n++) {
      expect(n * maxCards(n)).toBeLessThan(52);
    }
  });
});

describe('roundsSequence', () => {
  it('monte de 1 à max puis redescend à 1', () => {
    expect(roundsSequence(6)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(roundsSequence(3)).toHaveLength(19);
    expect(roundsSequence(3)[0]).toBe(1);
    expect(roundsSequence(3)[9]).toBe(10);
    expect(roundsSequence(3)[18]).toBe(1);
  });
});

describe('legalBids — règle du crochet', () => {
  it('autorise tout pour les non-derniers', () => {
    expect(legalBids(4, 2, false)).toEqual([0, 1, 2, 3, 4]);
  });
  it('interdit au dernier de compléter le total', () => {
    expect(legalBids(4, 3, true)).toEqual([0, 2, 3, 4]); // 1 interdit (3+1=4)
    expect(legalBids(4, 4, true)).toEqual([1, 2, 3, 4]); // 0 interdit
    expect(legalBids(1, 0, true)).toEqual([0]); // 1 interdit sur manche à 1 carte
    expect(legalBids(1, 1, true)).toEqual([1]); // 0 interdit : total déjà à 1... non, 1+0=1 interdit → reste [1]
  });
  it('le total dépasse déjà : tout est permis', () => {
    expect(legalBids(3, 5, true)).toEqual([0, 1, 2, 3]);
  });
});

function trick(leaderSeat: number, ids: [string, string][]): Trick {
  return { leaderSeat, plays: ids.map(([playerId, id]) => ({ playerId, card: cardFromId(id) })) };
}

describe('legalCards', () => {
  const hand = ['S5', 'S9', 'H2', 'C14'].map(cardFromId);
  it('tout est jouable en ouverture', () => {
    expect(legalCards(hand, trick(0, []))).toHaveLength(4);
  });
  it('doit fournir la couleur demandée', () => {
    const legal = legalCards(hand, trick(0, [['a', 'S7']]));
    expect(legal.map((c) => c.suit)).toEqual(['S', 'S']);
  });
  it('défausse libre sans la couleur (pas d’obligation de couper)', () => {
    const legal = legalCards(hand, trick(0, [['a', 'D7']]));
    expect(legal).toHaveLength(4);
  });
});

describe('trickWinner', () => {
  it('plus haute carte de la couleur demandée sans atout joué', () => {
    const t = trick(0, [['a', 'S5'], ['b', 'S13'], ['c', 'H14']]);
    expect(trickWinner(t, 'D').playerId).toBe('b');
  });
  it('l’atout bat la couleur demandée', () => {
    const t = trick(0, [['a', 'S13'], ['b', 'D2'], ['c', 'S14']]);
    expect(trickWinner(t, 'D').playerId).toBe('b');
  });
  it('plus haut atout entre plusieurs atouts', () => {
    const t = trick(0, [['a', 'S13'], ['b', 'D2'], ['c', 'D10']]);
    expect(trickWinner(t, 'D').playerId).toBe('c');
  });
  it('sans atout : la couleur demandée gagne', () => {
    const t = trick(0, [['a', 'H9'], ['b', 'S14'], ['c', 'H10']]);
    expect(trickWinner(t, null).playerId).toBe('c');
  });
});

describe('scoreRound', () => {
  it('contrat exact', () => {
    expect(scoreRound(0, 0)).toBe(10);
    expect(scoreRound(3, 3)).toBe(16);
  });
  it('contrat raté', () => {
    expect(scoreRound(2, 0)).toBe(-4);
    expect(scoreRound(0, 3)).toBe(-6);
  });
});
