import { describe, expect, it } from 'vitest';
import { cardFromId } from '../src/cards';
import {
  GAME_FORMATS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  SCORING_VARIANTS,
  formatSummary,
  isGameFormat,
  isScoringVariant,
  legalBids,
  legalCards,
  maxCards,
  roundsSequence,
  scoreRound,
  trickWinner,
} from '../src/rules';
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

describe('formats de partie', () => {
  it('le format par défaut reste la partie normale', () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      expect(roundsSequence(n)).toEqual(roundsSequence(n, 'normal'));
    }
  });

  it('Éclair : montée et descente plafonnées à 5 cartes', () => {
    expect(roundsSequence(3, 'blitz')).toEqual([1, 2, 3, 4, 5, 4, 3, 2, 1]);
    expect(roundsSequence(6, 'blitz')).toEqual([1, 2, 3, 4, 5, 4, 3, 2, 1]);
    // Même à 8 joueurs (max 6 cartes), le plafond Éclair reste atteignable
    expect(roundsSequence(8, 'blitz')).toEqual([1, 2, 3, 4, 5, 4, 3, 2, 1]);
  });

  it('Montante : montée seule, sans redescente', () => {
    expect(roundsSequence(3, 'climb')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(roundsSequence(6, 'climb')).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(roundsSequence(8, 'climb')).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('Normale : montée puis descente complètes', () => {
    expect(roundsSequence(4, 'normal')).toHaveLength(19);
    expect(roundsSequence(6, 'normal')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(roundsSequence(8, 'normal')).toEqual([1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]);
  });

  it('toute séquence commence et finit sur une manche jouable', () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      for (const format of GAME_FORMATS) {
        const seq = roundsSequence(n, format);
        expect(seq.length).toBeGreaterThan(0);
        expect(seq[0]).toBe(1);
        expect(Math.max(...seq)).toBeLessThanOrEqual(maxCards(n));
        // Chaque manche doit pouvoir être distribuée (52 cartes disponibles)
        expect(n * Math.max(...seq)).toBeLessThan(52);
      }
    }
  });

  it('la Normale est toujours le format le plus long', () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      const blitz = formatSummary(n, 'blitz');
      const normal = formatSummary(n, 'normal');
      const climb = formatSummary(n, 'climb');
      expect(blitz.tricks).toBeLessThan(normal.tricks);
      expect(climb.tricks).toBeLessThan(normal.tricks);
      expect(blitz.minutes).toBeLessThan(normal.minutes);
      expect(climb.minutes).toBeLessThan(normal.minutes);
    }
  });

  it('Éclair est le plus court jusqu’à 6 joueurs (au-delà, Montante le rattrape)', () => {
    for (let n = MIN_PLAYERS; n <= 6; n++) {
      expect(formatSummary(n, 'blitz').tricks).toBeLessThan(formatSummary(n, 'climb').tricks);
    }
    // À 8 joueurs, la montée seule s'arrête à 6 cartes : elle devient plus courte
    expect(formatSummary(8, 'climb').tricks).toBeLessThan(formatSummary(8, 'blitz').tricks);
  });

  it('le résumé est cohérent avec la séquence', () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      for (const format of GAME_FORMATS) {
        const seq = roundsSequence(n, format);
        const summary = formatSummary(n, format);
        expect(summary.format).toBe(format);
        expect(summary.rounds).toBe(seq.length);
        expect(summary.tricks).toBe(seq.reduce((a, b) => a + b, 0));
        expect(summary.minutes).toBeGreaterThanOrEqual(5);
        expect(summary.minutes % 5).toBe(0);
      }
    }
  });

  it('estime la durée à partir du nombre de joueurs présents', () => {
    expect(formatSummary(3, 'blitz')).toEqual({ format: 'blitz', rounds: 9, tricks: 25, minutes: 10 });
    expect(formatSummary(3, 'normal')).toEqual({ format: 'normal', rounds: 19, tricks: 100, minutes: 30 });
    expect(formatSummary(3, 'climb')).toEqual({ format: 'climb', rounds: 10, tricks: 55, minutes: 15 });
    // Un salon incomplet affiche déjà l'estimation de la partie réellement jouable
    expect(formatSummary(1, 'normal')).toEqual(formatSummary(MIN_PLAYERS, 'normal'));
  });

  it('valide les identifiants de format', () => {
    expect(isGameFormat('blitz')).toBe(true);
    expect(isGameFormat('normal')).toBe(true);
    expect(isGameFormat('climb')).toBe(true);
    expect(isGameFormat('rapide')).toBe(false);
    expect(isGameFormat(undefined)).toBe(false);
    expect(isGameFormat(2)).toBe(false);
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

  it('barème classique : identique au comportement par défaut', () => {
    expect(scoreRound(3, 3, 'classic')).toBe(scoreRound(3, 3));
    expect(scoreRound(2, 0, 'classic')).toBe(scoreRound(2, 0));
  });

  it('barème bienveillant : jamais de score négatif', () => {
    expect(scoreRound(0, 0, 'gentle')).toBe(10);
    expect(scoreRound(3, 3, 'gentle')).toBe(13);
    expect(scoreRound(2, 0, 'gentle')).toBe(0);
    expect(scoreRound(0, 5, 'gentle')).toBe(0);
  });

  it('barème « plis toujours comptés » : rater reste rentable', () => {
    expect(scoreRound(0, 0, 'always')).toBe(10);
    expect(scoreRound(3, 3, 'always')).toBe(13);
    expect(scoreRound(2, 0, 'always')).toBe(0);
    // Trois plis pris sans les avoir annoncés valent mieux que zéro pli.
    expect(scoreRound(0, 3, 'always')).toBe(3);
  });

  it('aucun barème ne pénalise un contrat tenu', () => {
    for (const variant of SCORING_VARIANTS) {
      for (let bid = 0; bid <= 10; bid++) {
        expect(scoreRound(bid, bid, variant)).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it('isScoringVariant filtre les valeurs venues du réseau', () => {
    for (const variant of SCORING_VARIANTS) expect(isScoringVariant(variant)).toBe(true);
    expect(isScoringVariant('classique')).toBe(false);
    expect(isScoringVariant(null)).toBe(false);
    expect(isScoringVariant(0)).toBe(false);
  });
});
