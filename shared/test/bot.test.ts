import { describe, expect, it } from 'vitest';
import { cardFromId, cardId } from '../src/cards';
import { BOT_ID_PREFIX, botBid, botCard, chooseBid, chooseCard, isBotId, nextBotProfile } from '../src/bot';
import { applyAction, createGame } from '../src/engine';
import { legalBids, legalCards } from '../src/rules';
import type { Card, GameState, Trick } from '../src/types';

const hand = (...ids: string[]): Card[] => ids.map(cardFromId);

function trickOf(...ids: string[]): Trick {
  return {
    leaderSeat: 0,
    plays: ids.map((id, i) => ({ playerId: `p${i}`, card: cardFromId(id) })),
  };
}

describe('identité des bots', () => {
  it('reconnaît les identifiants de bots', () => {
    expect(isBotId(`${BOT_ID_PREFIX}ada`)).toBe(true);
    expect(isBotId('9f2c-…-uuid')).toBe(false);
  });

  it('distribue des profils distincts et déterministes', () => {
    const first = nextBotProfile([]);
    expect(nextBotProfile([])).toEqual(first);
    const second = nextBotProfile([first.id]);
    expect(second.id).not.toBe(first.id);
    expect(isBotId(second.id)).toBe(true);
  });

  it('génère un profil de secours quand le panel est épuisé', () => {
    const taken: string[] = [];
    for (let i = 0; i < 10; i++) taken.push(nextBotProfile(taken).id);
    expect(new Set(taken).size).toBe(10);
    expect(taken.every(isBotId)).toBe(true);
  });
});

describe('les bots ne prennent jamais la main du salon', () => {
  it('transfère l’hôte à un humain plutôt qu’à un bot', () => {
    let state = createGame('TEST', 'seed', 0, { id: 'p0', pseudo: 'Alice', avatar: '🦊' });
    for (const player of [nextBotProfile([]), { id: 'p1', pseudo: 'Bob', avatar: '🐼' }]) {
      const res = applyAction(state, { type: 'ADD_PLAYER', player });
      if (!res.ok) throw new Error(res.error);
      state = res.state;
    }
    const removed = applyAction(state, { type: 'REMOVE_PLAYER', playerId: 'p0' });
    if (!removed.ok) throw new Error(removed.error);
    // Le bot est au siège 0 après le retrait, mais l'hôte doit être Bob.
    expect(removed.state.players[0].id).toBe(nextBotProfile([]).id);
    expect(removed.state.hostId).toBe('p1');
  });
});

describe('annonce du bot', () => {
  it('annonce toujours une valeur légale', () => {
    const bid = chooseBid({
      hand: hand('S14', 'S13', 'H14'),
      trump: 'S',
      cardsCount: 3,
      nbPlayers: 3,
      legalBids: legalBids(3, 0, false),
    });
    expect(legalBids(3, 0, false)).toContain(bid);
  });

  it('annonce plus haut avec une main forte qu’avec une main faible', () => {
    const common = { trump: 'S' as const, cardsCount: 5, nbPlayers: 4, legalBids: legalBids(5, 0, false) };
    const forte = chooseBid({ ...common, hand: hand('S14', 'S13', 'H14', 'H13', 'C2') });
    const faible = chooseBid({ ...common, hand: hand('H2', 'H3', 'D4', 'D5', 'C6') });
    expect(forte).toBeGreaterThanOrEqual(3);
    expect(faible).toBe(0);
    expect(forte).toBeGreaterThan(faible);
  });

  it('annonce 1 avec un as d’atout sec sur une manche à 1 carte', () => {
    const bid = chooseBid({
      hand: hand('S14'),
      trump: 'S',
      cardsCount: 1,
      nbPlayers: 3,
      legalBids: legalBids(1, 0, false),
    });
    expect(bid).toBe(1);
  });

  it('respecte la règle du crochet en prenant la valeur légale la plus proche', () => {
    // Main estimée à ~2 plis, mais 2 est interdit (dernier enchérisseur, total = 3).
    const legal = legalBids(3, 1, true);
    expect(legal).toEqual([0, 1, 3]);
    const bid = chooseBid({
      hand: hand('S14', 'H14', 'C2'),
      trump: 'S',
      cardsCount: 3,
      nbPlayers: 3,
      legalBids: legal,
    });
    expect(legal).toContain(bid);
    expect(bid).toBe(1); // à distance égale, on choisit la valeur prudente
  });

  it('ne dépasse jamais le nombre de cartes de la manche', () => {
    const bid = chooseBid({
      hand: hand('S14', 'S13'),
      trump: 'S',
      cardsCount: 2,
      nbPlayers: 3,
      legalBids: legalBids(2, 0, false),
    });
    expect(bid).toBeLessThanOrEqual(2);
    expect(bid).toBeGreaterThanOrEqual(0);
  });
});

describe('choix de carte du bot', () => {
  it('joue toujours une carte légale', () => {
    const legal = hand('H5', 'H14', 'H2');
    const chosen = chooseCard({ legal, trick: trickOf('H10'), trump: 'S', bid: 1, tricksWon: 0 });
    expect(legal.map(cardId)).toContain(chosen);
  });

  describe('contrat encore à remplir', () => {
    it('prend la main avec la carte la moins chère qui gagne', () => {
      const chosen = chooseCard({
        legal: hand('H11', 'H14', 'H12'),
        trick: trickOf('H10'),
        trump: 'S',
        bid: 2,
        tricksWon: 0,
      });
      expect(chosen).toBe('H11');
    });

    it('coupe quand il ne peut pas fournir', () => {
      const chosen = chooseCard({
        legal: hand('S14', 'C2', 'C13'),
        trick: trickOf('H10'),
        trump: 'S',
        bid: 2,
        tricksWon: 0,
      });
      expect(chosen).toBe('S14');
    });

    it('jette sa plus petite carte quand il ne peut pas prendre', () => {
      const chosen = chooseCard({
        legal: hand('H9', 'H3', 'H7'),
        trick: trickOf('H10'),
        trump: null,
        bid: 2,
        tricksWon: 0,
      });
      expect(chosen).toBe('H3');
    });

    it('entame avec un gros atout plutôt qu’un petit', () => {
      const chosen = chooseCard({
        legal: hand('S2', 'S13', 'C3'),
        trick: { leaderSeat: 0, plays: [] },
        trump: 'S',
        bid: 2,
        tricksWon: 0,
      });
      expect(chosen).toBe('S13');
    });

    it('entame avec un as hors atout plutôt qu’un petit atout', () => {
      const chosen = chooseCard({
        legal: hand('S2', 'H14', 'C3'),
        trick: { leaderSeat: 0, plays: [] },
        trump: 'S',
        bid: 1,
        tricksWon: 0,
      });
      expect(chosen).toBe('H14');
    });
  });

  describe('contrat déjà atteint', () => {
    it('se défausse de sa plus grosse carte perdante', () => {
      const chosen = chooseCard({
        legal: hand('H14', 'H5', 'H2'),
        trick: trickOf('H10'),
        trump: 'S',
        bid: 0,
        tricksWon: 0,
      });
      expect(chosen).toBe('H5');
    });

    it('ne coupe pas et jette une grosse carte hors atout', () => {
      const chosen = chooseCard({
        legal: hand('S14', 'C2', 'C13'),
        trick: trickOf('H10'),
        trump: 'S',
        bid: 1,
        tricksWon: 1,
      });
      expect(chosen).toBe('C13');
    });

    it('lâche un atout devenu maître sur un pli perdu plutôt que de le garder', () => {
      // Atout pique. Le pli est déjà perdu (l'as d'atout, S14, l'a coupé) et le
      // contrat est tenu. Le bot tient le roi d'atout (S13), désormais le plus
      // fort atout restant : le garder le forcerait à remporter un pli plus
      // tard et à casser son contrat. C'est le moment gratuit de s'en défaire.
      const chosen = chooseCard({
        legal: hand('C7', 'S13'),
        trick: trickOf('D14', 'S14'),
        trump: 'S',
        bid: 1,
        tricksWon: 1,
        seen: hand('D14', 'S14'),
      });
      expect(chosen).toBe('S13');
    });

    it('joue la plus petite quand il est obligé de dépasser', () => {
      const chosen = chooseCard({
        legal: hand('H9', 'H5'),
        trick: trickOf('H2'),
        trump: 'S',
        bid: 0,
        tricksWon: 0,
      });
      expect(chosen).toBe('H5');
    });

    it('entame avec sa plus petite carte hors atout', () => {
      const chosen = chooseCard({
        legal: hand('S2', 'H14', 'C3'),
        trick: { leaderSeat: 0, plays: [] },
        trump: 'S',
        bid: 0,
        tricksWon: 0,
      });
      expect(chosen).toBe('C3');
    });
  });

  it('est déterministe', () => {
    const input = {
      legal: hand('H11', 'H14', 'H12'),
      trick: trickOf('H10'),
      trump: 'S' as const,
      bid: 2,
      tricksWon: 0,
    };
    expect(chooseCard(input)).toBe(chooseCard(input));
  });
});

/** Partie entièrement pilotée par les bots — vérifie qu'aucune action illégale n'est produite. */
function playFullBotGame(nbPlayers: number, seed: string): GameState {
  let state = createGame('BOTS', seed, 0, { id: 'p0', pseudo: 'Alice', avatar: '🦊' });
  for (let i = 1; i < nbPlayers; i++) {
    const res = applyAction(state, {
      type: 'ADD_PLAYER',
      player: nextBotProfile(state.players.map((p) => p.id)),
    });
    if (!res.ok) throw new Error(res.error);
    state = res.state;
  }
  const started = applyAction(state, { type: 'START_GAME', playerId: 'p0' });
  if (!started.ok) throw new Error(started.error);
  state = started.state;

  let guard = 20000;
  while (state.phase !== 'game-over' && guard-- > 0) {
    const round = state.round!;
    let action: Parameters<typeof applyAction>[1];
    if (state.phase === 'round-scoring') {
      action = { type: 'NEXT_ROUND', playerId: 'p0' };
    } else {
      const current = state.players.find((p) => p.seat === round.currentSeat)!;
      if (state.phase === 'bidding') {
        action = { type: 'BID', playerId: current.id, bid: botBid(state, current.id) };
      } else {
        const chosen = botCard(state, current.id);
        // La carte choisie doit toujours faire partie des cartes jouables.
        expect(legalCards(round.hands[current.id], round.currentTrick).map(cardId)).toContain(chosen);
        action = { type: 'PLAY_CARD', playerId: current.id, cardId: chosen };
      }
    }
    const res = applyAction(state, action);
    if (!res.ok) throw new Error(`${action.type} → ${res.error}`);
    state = res.state;
  }
  if (guard <= 0) throw new Error('Partie infinie');
  return state;
}

describe('partie complète pilotée par les bots', () => {
  for (const n of [3, 5]) {
    it(`se termine proprement à ${n} joueurs`, () => {
      const state = playFullBotGame(n, `bot-seed-${n}`);
      expect(state.phase).toBe('game-over');
      for (const p of state.players) {
        expect(Number.isInteger(p.totalScore)).toBe(true);
      }
    });
  }

  it('joue mieux que la stratégie « toujours le minimum »', () => {
    // Les bots doivent réussir au moins quelques contrats non nuls.
    const state = playFullBotGame(4, 'bot-seed-mix');
    const best = Math.max(...state.players.map((p) => p.totalScore));
    expect(best).toBeGreaterThan(0);
  });

  it('est déterministe à seed égal', () => {
    const a = playFullBotGame(4, 'fixe');
    const b = playFullBotGame(4, 'fixe');
    expect(a.players.map((p) => p.totalScore)).toEqual(b.players.map((p) => p.totalScore));
  });
});
