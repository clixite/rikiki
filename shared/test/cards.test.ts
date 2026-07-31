import { describe, expect, it } from 'vitest';
import { cardFromId, cardId, fullDeck, hashSeed, isRedSuit, mulberry32, shuffle, sortHand } from '../src/cards';
import type { Card, Suit } from '../src/types';

describe('deck', () => {
  it('contient 52 cartes uniques', () => {
    const deck = fullDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardId)).size).toBe(52);
  });
});

describe('cardId / cardFromId', () => {
  it('aller-retour stable', () => {
    for (const c of fullDeck()) {
      expect(cardFromId(cardId(c))).toEqual(c);
    }
  });
  it('rejette les identifiants invalides', () => {
    expect(() => cardFromId('X5')).toThrow();
    expect(() => cardFromId('S1')).toThrow();
  });
});

describe('shuffle', () => {
  it('est déterministe pour un même seed', () => {
    const a = shuffle(fullDeck(), mulberry32(hashSeed('abc')));
    const b = shuffle(fullDeck(), mulberry32(hashSeed('abc')));
    expect(a).toEqual(b);
  });
  it('varie selon le seed et préserve les 52 cartes', () => {
    const a = shuffle(fullDeck(), mulberry32(hashSeed('abc')));
    const b = shuffle(fullDeck(), mulberry32(hashSeed('def')));
    expect(a).not.toEqual(b);
    expect(new Set(a.map(cardId)).size).toBe(52);
  });
});

describe('sortHand', () => {
  const ids = (hand: string[]) => hand.map(cardFromId);

  /** Suite des couleurs rencontrées, dans l'ordre, sans répétition consécutive. */
  const suitSequence = (sorted: Card[]): Suit[] => {
    const seq: Suit[] = [];
    for (const c of sorted) {
      if (seq[seq.length - 1] !== c.suit) seq.push(c.suit);
    }
    return seq;
  };

  /** Nombre de fois où deux groupes voisins sont de la même teinte. */
  const sameShadeAdjacencies = (sorted: Card[]): number => {
    const seq = suitSequence(sorted);
    let count = 0;
    for (let i = 1; i < seq.length; i++) {
      if (isRedSuit(seq[i]) === isRedSuit(seq[i - 1])) count++;
    }
    return count;
  };

  it('groupe chaque couleur et trie les rangs par ordre croissant', () => {
    const sorted = sortHand(ids(['H14', 'S2', 'H3', 'S10', 'H7']), null);
    // chaque couleur apparaît en un seul bloc
    expect(suitSequence(sorted)).toHaveLength(new Set(sorted.map((c) => c.suit)).size);
    // rangs croissants à l'intérieur de chaque bloc
    for (const suit of ['H', 'S'] as Suit[]) {
      const ranks = sorted.filter((c) => c.suit === suit).map((c) => c.rank);
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    }
    expect(sorted.map(cardId)).toEqual(['S2', 'S10', 'H3', 'H7', 'H14']);
  });

  it('alterne strictement rouge/noir quand les 4 couleurs sont présentes', () => {
    const hand = ids(['D5', 'C9', 'H14', 'S2', 'D12', 'C3', 'H7', 'S13']);
    for (const trump of [null, 'S', 'H', 'D', 'C'] as (Suit | null)[]) {
      const sorted = sortHand(hand, trump);
      const seq = suitSequence(sorted);
      expect(seq).toHaveLength(4);
      expect(sameShadeAdjacencies(sorted)).toBe(0);
    }
  });

  it('ancre l’alternance sur l’atout quand les 4 couleurs sont présentes', () => {
    const hand = ids(['D5', 'C9', 'H14', 'S2']);
    expect(sortHand(hand, 'S').map(cardId)).toEqual(['S2', 'H14', 'C9', 'D5']);
    expect(sortHand(hand, 'C').map(cardId)).toEqual(['C9', 'H14', 'S2', 'D5']);
    expect(sortHand(hand, 'H').map(cardId)).toEqual(['H14', 'S2', 'D5', 'C9']);
    expect(sortHand(hand, 'D').map(cardId)).toEqual(['D5', 'S2', 'H14', 'C9']);
    // sans atout, on retombe sur l'ordre historique ♠ ♥ ♣ ♦
    expect(sortHand(hand, null).map(cardId)).toEqual(['S2', 'H14', 'C9', 'D5']);
  });

  it('n’exile plus l’atout en fin de main', () => {
    const sorted = sortHand(ids(['H14', 'S2', 'H3', 'S10']), 'H');
    expect(sorted.map(cardId)).toEqual(['H3', 'H14', 'S2', 'S10']);
  });

  it('produit R/N/R avec 2 rouges et 1 noire', () => {
    const sorted = sortHand(ids(['H9', 'D4', 'S8', 'D11', 'S3']), 'S');
    expect(sameShadeAdjacencies(sorted)).toBe(0);
    expect(suitSequence(sorted).map(isRedSuit)).toEqual([true, false, true]);
    expect(sorted.map(cardId)).toEqual(['H9', 'S3', 'S8', 'D4', 'D11']);
  });

  it('produit N/R/N avec 2 noires et 1 rouge', () => {
    const sorted = sortHand(ids(['C6', 'S13', 'H2', 'C10']), 'H');
    expect(sameShadeAdjacencies(sorted)).toBe(0);
    expect(suitSequence(sorted).map(isRedSuit)).toEqual([false, true, false]);
    expect(sorted.map(cardId)).toEqual(['S13', 'H2', 'C6', 'C10']);
  });

  it('alterne aussi avec 2 couleurs de teintes différentes', () => {
    for (const [a, b] of [
      ['H', 'S'],
      ['H', 'C'],
      ['D', 'S'],
      ['D', 'C'],
    ] as [Suit, Suit][]) {
      for (const trump of [null, a, b, 'S', 'H', 'D', 'C'] as (Suit | null)[]) {
        const sorted = sortHand(ids([`${a}5`, `${b}9`, `${a}12`]), trump);
        expect(sameShadeAdjacencies(sorted)).toBe(0);
      }
    }
  });

  it('laisse les deux couleurs groupées quand elles sont de même teinte', () => {
    const rouges = sortHand(ids(['D8', 'H3', 'D2', 'H12']), 'D');
    expect(suitSequence(rouges)).toEqual(['D', 'H']);
    expect(rouges.map(cardId)).toEqual(['D2', 'D8', 'H3', 'H12']);
    const noires = sortHand(ids(['C8', 'S3', 'C2', 'S12']), null);
    expect(suitSequence(noires)).toEqual(['S', 'C']);
    expect(noires.map(cardId)).toEqual(['S3', 'S12', 'C2', 'C8']);
  });

  it('est déterministe : deux appels donnent le même ordre', () => {
    const hand = ids(['D5', 'C9', 'H14', 'S2', 'D12', 'H7']);
    for (const trump of [null, 'S', 'H', 'D', 'C'] as (Suit | null)[]) {
      expect(sortHand(hand, trump).map(cardId)).toEqual(sortHand(hand, trump).map(cardId));
      // l'ordre d'arrivée des cartes n'influence pas le résultat
      const melangee = shuffle(hand, mulberry32(hashSeed('xyz')));
      expect(sortHand(melangee, trump).map(cardId)).toEqual(sortHand(hand, trump).map(cardId));
    }
  });

  it('gère la main vide et la main d’une seule carte', () => {
    expect(sortHand([], 'H')).toEqual([]);
    expect(sortHand([], null)).toEqual([]);
    expect(sortHand(ids(['C7']), 'H').map(cardId)).toEqual(['C7']);
    expect(sortHand(ids(['C7']), 'C').map(cardId)).toEqual(['C7']);
  });

  it('ne perd ni ne duplique aucune carte, quelle que soit la main', () => {
    const rand = mulberry32(hashSeed('sortHand'));
    for (let essai = 0; essai < 50; essai++) {
      const taille = 1 + Math.floor(rand() * 13);
      const main = shuffle(fullDeck(), rand).slice(0, taille);
      const avant = main.map(cardId);
      for (const trump of [null, 'S', 'H', 'D', 'C'] as (Suit | null)[]) {
        const sorted = sortHand(main, trump);
        expect(sorted).toHaveLength(main.length);
        expect([...sorted.map(cardId)].sort()).toEqual([...avant].sort());
        // la main d'origine n'est pas modifiée en place
        expect(main.map(cardId)).toEqual(avant);
      }
    }
  });

  it('ne laisse jamais deux teintes voisines évitables sur des mains aléatoires', () => {
    const rand = mulberry32(hashSeed('alternance'));
    for (let essai = 0; essai < 100; essai++) {
      const main = shuffle(fullDeck(), rand).slice(0, 1 + Math.floor(rand() * 13));
      const sorted = sortHand(main, 'S');
      const couleurs = new Set(main.map((c) => c.suit));
      const rouges = [...couleurs].filter(isRedSuit).length;
      const noires = couleurs.size - rouges;
      // meilleure alternance possible : max(0, |rouges - noires| - 1) collages
      expect(sameShadeAdjacencies(sorted)).toBe(Math.max(0, Math.abs(rouges - noires) - 1));
    }
  });
});
