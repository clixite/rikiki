import { describe, expect, it } from 'vitest';
import { cardFromId, cardId, fullDeck, hashSeed, mulberry32, shuffle, sortHand } from '../src/cards';

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
  it('met l’atout en dernier, rangs croissants', () => {
    const hand = ['H14', 'S2', 'H3', 'S10'].map(cardFromId);
    const sorted = sortHand(hand, 'H');
    expect(sorted.map(cardId)).toEqual(['S2', 'S10', 'H3', 'H14']);
  });
});
