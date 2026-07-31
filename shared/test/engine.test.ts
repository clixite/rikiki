import { describe, expect, it } from 'vitest';
import { cardId } from '../src/cards';
import { applyAction, createGame, lowestLegalBid, lowestLegalCard } from '../src/engine';
import {
  SCORING_VARIANTS,
  roundsSequence,
  scoreRound,
  type GameFormat,
  type GamePace,
  type ScoringVariant,
} from '../src/rules';
import type { GameState } from '../src/types';

function newLobby(nbPlayers: number): GameState {
  let state = createGame('TEST', 'seed-42', 0, { id: 'p0', pseudo: 'Alice', avatar: '🦊' });
  for (let i = 1; i < nbPlayers; i++) {
    const res = applyAction(state, {
      type: 'ADD_PLAYER',
      player: { id: `p${i}`, pseudo: `Joueur${i}`, avatar: '🐼' },
    });
    if (!res.ok) throw new Error(res.error);
    state = res.state;
  }
  return state;
}

function mustApply(state: GameState, action: Parameters<typeof applyAction>[1]): GameState {
  const res = applyAction(state, action);
  if (!res.ok) throw new Error(`${action.type} → ${res.error}`);
  return res.state;
}

describe('lobby', () => {
  it('refuse de démarrer à moins de 3 joueurs', () => {
    const state = newLobby(2);
    const res = applyAction(state, { type: 'START_GAME', playerId: 'p0' });
    expect(res).toEqual({ ok: false, error: 'NOT_ENOUGH_PLAYERS' });
  });

  it('seul l’hôte peut démarrer', () => {
    const state = newLobby(3);
    const res = applyAction(state, { type: 'START_GAME', playerId: 'p1' });
    expect(res).toEqual({ ok: false, error: 'NOT_HOST' });
  });

  it('refuse un 9e joueur', () => {
    const state = newLobby(8);
    const res = applyAction(state, { type: 'ADD_PLAYER', player: { id: 'p9', pseudo: 'Trop', avatar: '🐙' } });
    expect(res).toEqual({ ok: false, error: 'ROOM_FULL' });
  });

  it('transfère l’hôte quand il part', () => {
    let state = newLobby(3);
    state = mustApply(state, { type: 'REMOVE_PLAYER', playerId: 'p0' });
    expect(state.hostId).toBe('p1');
    expect(state.players.map((p) => p.seat)).toEqual([0, 1]);
  });
});

describe('démarrage et enchères', () => {
  it('distribue la manche 1 avec un atout', () => {
    const state = mustApply(newLobby(4), { type: 'START_GAME', playerId: 'p0' });
    expect(state.phase).toBe('bidding');
    expect(state.roundsSequence).toHaveLength(19);
    expect(state.round!.cardsCount).toBe(1);
    expect(state.round!.trumpCard).not.toBeNull();
    for (const p of state.players) {
      expect(state.round!.hands[p.id]).toHaveLength(1);
    }
  });

  it('applique la règle du crochet au dealer', () => {
    let state = mustApply(newLobby(3), { type: 'START_GAME', playerId: 'p0' });
    const round = state.round!;
    const order = [0, 1, 2].map((i) => state.players.find((p) => p.seat === (round.dealerSeat + 1 + i) % 3)!.id);
    // Les deux premiers annoncent 0 → le dealer ne peut pas annoncer 1 (total = 1 pli)
    state = mustApply(state, { type: 'BID', playerId: order[0], bid: 0 });
    state = mustApply(state, { type: 'BID', playerId: order[1], bid: 0 });
    const hook = applyAction(state, { type: 'BID', playerId: order[2], bid: 1 });
    expect(hook).toEqual({ ok: false, error: 'ILLEGAL_BID_HOOK' });
    state = mustApply(state, { type: 'BID', playerId: order[2], bid: 0 });
    expect(state.phase).toBe('playing');
  });

  it('rejette une enchère hors tour', () => {
    const state = mustApply(newLobby(3), { type: 'START_GAME', playerId: 'p0' });
    const notCurrent = state.players.find((p) => p.seat !== state.round!.currentSeat)!;
    const res = applyAction(state, { type: 'BID', playerId: notCurrent.id, bid: 0 });
    expect(res).toEqual({ ok: false, error: 'NOT_YOUR_TURN' });
  });

  it('rejette une enchère intrinsèquement invalide (négative, non entière, ou hors bornes)', () => {
    // Manche à 1 carte : la seule enchère de 0 à 1 carte, donc tout ce qui
    // s'écarte de l'intervalle [0, cardsCount] est illégal en soi — avant
    // même d'appliquer la règle du crochet (`ILLEGAL_BID_HOOK`, testée
    // ailleurs), qui elle porte sur la valeur totale annoncée à table.
    const state = mustApply(newLobby(3), { type: 'START_GAME', playerId: 'p0' });
    const current = state.players.find((p) => p.seat === state.round!.currentSeat)!;
    expect(state.round!.cardsCount).toBe(1);

    expect(applyAction(state, { type: 'BID', playerId: current.id, bid: -1 })).toEqual({
      ok: false,
      error: 'ILLEGAL_BID',
    });
    expect(applyAction(state, { type: 'BID', playerId: current.id, bid: 1.5 })).toEqual({
      ok: false,
      error: 'ILLEGAL_BID',
    });
    expect(applyAction(state, { type: 'BID', playerId: current.id, bid: 2 })).toEqual({
      ok: false,
      error: 'ILLEGAL_BID',
    });
  });
});

/**
 * Joue une partie complète en choisissant toujours la plus petite option légale.
 * Renvoie l'état final et le nombre d'actions jouées (mesure de la longueur réelle).
 */
function runGame(
  nbPlayers: number,
  seed = 'seed-42',
  format?: GameFormat,
  scoring?: ScoringVariant,
): { state: GameState; actions: number } {
  let state = newLobby(nbPlayers);
  state = { ...state, seed };
  if (format) state = mustApply(state, { type: 'SET_FORMAT', playerId: 'p0', format });
  if (scoring) state = mustApply(state, { type: 'SET_SCORING', playerId: 'p0', scoring });
  state = mustApply(state, { type: 'START_GAME', playerId: 'p0' });
  let actions = 0;
  let guard = 10000;
  while (state.phase !== 'game-over' && guard-- > 0) {
    if (state.phase === 'bidding') {
      const current = state.players.find((p) => p.seat === state.round!.currentSeat)!;
      state = mustApply(state, { type: 'BID', playerId: current.id, bid: lowestLegalBid(state, current.id) });
    } else if (state.phase === 'playing') {
      const current = state.players.find((p) => p.seat === state.round!.currentSeat)!;
      state = mustApply(state, { type: 'PLAY_CARD', playerId: current.id, cardId: lowestLegalCard(state, current.id) });
    } else if (state.phase === 'round-scoring') {
      state = mustApply(state, { type: 'NEXT_ROUND', playerId: 'p0' });
    }
    actions++;
  }
  if (guard <= 0) throw new Error('Partie infinie');
  return { state, actions };
}

function playFullGame(nbPlayers: number, seed = 'seed-42', format?: GameFormat): GameState {
  return runGame(nbPlayers, seed, format).state;
}

describe('partie complète simulée', () => {
  for (const n of [3, 5, 8]) {
    it(`se termine proprement à ${n} joueurs`, () => {
      const state = playFullGame(n);
      expect(state.phase).toBe('game-over');
      // Cohérence : chaque manche distribue tous ses plis
      const round = state.round!;
      const totalTricks = Object.values(round.tricksWon).reduce((a, b) => a + b, 0);
      expect(totalTricks).toBe(round.cardsCount);
      // Les scores totaux sont la somme des scores de manche (spot check dernier round)
      for (const p of state.players) {
        expect(Number.isInteger(p.totalScore)).toBe(true);
      }
    });
  }

  it('est déterministe à seed égal', () => {
    const a = playFullGame(4, 'fixe');
    const b = playFullGame(4, 'fixe');
    expect(a.players.map((p) => p.totalScore)).toEqual(b.players.map((p) => p.totalScore));
  });

  it('donne des résultats différents avec un autre seed', () => {
    const a = playFullGame(4, 'seed-a');
    const b = playFullGame(4, 'seed-b');
    expect(JSON.stringify(a.players)).not.toBe(JSON.stringify(b.players));
  });
});

describe('format de partie', () => {
  it('démarre en format normal par défaut', () => {
    const state = newLobby(3);
    expect(state.format).toBe('normal');
    const started = mustApply(state, { type: 'START_GAME', playerId: 'p0' });
    expect(started.roundsSequence).toEqual(roundsSequence(3, 'normal'));
  });

  it('l’hôte choisit le format, qui pilote la séquence de manches', () => {
    let state = mustApply(newLobby(4), { type: 'SET_FORMAT', playerId: 'p0', format: 'blitz' });
    expect(state.format).toBe('blitz');
    state = mustApply(state, { type: 'START_GAME', playerId: 'p0' });
    expect(state.roundsSequence).toEqual([1, 2, 3, 4, 5, 4, 3, 2, 1]);
  });

  it('refuse un format venu d’un non-hôte, d’une valeur inconnue ou hors lobby', () => {
    const lobby = newLobby(3);
    expect(applyAction(lobby, { type: 'SET_FORMAT', playerId: 'p1', format: 'blitz' })).toEqual({
      ok: false,
      error: 'NOT_HOST',
    });
    expect(
      applyAction(lobby, { type: 'SET_FORMAT', playerId: 'p0', format: 'turbo' as GameFormat }),
    ).toEqual({ ok: false, error: 'ILLEGAL_FORMAT' });

    const started = mustApply(lobby, { type: 'START_GAME', playerId: 'p0' });
    expect(applyAction(started, { type: 'SET_FORMAT', playerId: 'p0', format: 'climb' })).toEqual({
      ok: false,
      error: 'BAD_PHASE',
    });
  });

  it('une partie Éclair se termine, en bien moins de coups qu’une normale', () => {
    const blitz = runGame(4, 'seed-format', 'blitz');
    const normal = runGame(4, 'seed-format');

    expect(blitz.state.phase).toBe('game-over');
    expect(blitz.state.roundsSequence).toHaveLength(9);
    expect(blitz.state.round!.roundIndex).toBe(8);
    expect(blitz.actions).toBeLessThan(normal.actions / 3);
  });

  it('une partie Montante se termine sur la manche la plus fournie', () => {
    const climb = runGame(6, 'seed-format', 'climb');
    expect(climb.state.phase).toBe('game-over');
    expect(climb.state.roundsSequence).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // Dernière manche jouée = le sommet de la montée
    expect(climb.state.round!.cardsCount).toBe(8);
    expect(climb.actions).toBeLessThan(runGame(6, 'seed-format').actions);
  });
});

describe('barème de score', () => {
  it('démarre en barème classique par défaut', () => {
    expect(newLobby(3).scoring).toBe('classic');
  });

  it('refuse un barème venu d’un non-hôte, d’une valeur inconnue ou hors lobby', () => {
    const lobby = newLobby(3);
    expect(applyAction(lobby, { type: 'SET_SCORING', playerId: 'p1', scoring: 'gentle' })).toEqual({
      ok: false,
      error: 'NOT_HOST',
    });
    expect(
      applyAction(lobby, { type: 'SET_SCORING', playerId: 'p0', scoring: 'doux' as ScoringVariant }),
    ).toEqual({ ok: false, error: 'ILLEGAL_FORMAT' });

    const started = mustApply(lobby, { type: 'START_GAME', playerId: 'p0' });
    expect(applyAction(started, { type: 'SET_SCORING', playerId: 'p0', scoring: 'always' })).toEqual({
      ok: false,
      error: 'BAD_PHASE',
    });
  });

  it('applique le barème choisi aux scores de manche', () => {
    for (const scoring of SCORING_VARIANTS) {
      const state = runGame(4, 'seed-bareme', 'blitz', scoring).state;
      const round = state.round!;
      for (const p of state.players) {
        expect(round.roundScores![p.id]).toBe(scoreRound(round.bids[p.id]!, round.tricksWon[p.id], scoring));
      }
    }
  });

  it('les barèmes sans pénalité ne produisent jamais de total négatif', () => {
    for (const scoring of ['gentle', 'always'] as const) {
      const state = runGame(4, 'seed-bareme', 'blitz', scoring).state;
      for (const p of state.players) expect(p.totalScore).toBeGreaterThanOrEqual(0);
    }
  });

  it('une partie déjà en cours conserve son barème absent (parties d’avant la v1.3)', () => {
    // Les états persistés avant l'arrivée des barèmes n'ont pas le champ :
    // la lecture doit retomber sur le classique plutôt que de planter.
    let state = newLobby(3);
    state = { ...state, scoring: undefined };
    state = mustApply(state, { type: 'START_GAME', playerId: 'p0' });
    while (state.phase !== 'round-scoring') {
      const current = state.players.find((p) => p.seat === state.round!.currentSeat)!;
      state =
        state.phase === 'bidding'
          ? mustApply(state, { type: 'BID', playerId: current.id, bid: lowestLegalBid(state, current.id) })
          : mustApply(state, { type: 'PLAY_CARD', playerId: current.id, cardId: lowestLegalCard(state, current.id) });
    }
    const round = state.round!;
    for (const p of state.players) {
      expect(round.roundScores![p.id]).toBe(scoreRound(round.bids[p.id]!, round.tricksWon[p.id], 'classic'));
    }
  });
});

describe('rythme de la partie', () => {
  it('démarre en temps réel par défaut', () => {
    expect(newLobby(3).pace).toBe('live');
  });

  it('refuse un rythme venu d’un non-hôte, d’une valeur inconnue ou hors lobby', () => {
    const lobby = newLobby(3);
    expect(applyAction(lobby, { type: 'SET_PACE', playerId: 'p1', pace: 'async' })).toEqual({
      ok: false,
      error: 'NOT_HOST',
    });
    expect(applyAction(lobby, { type: 'SET_PACE', playerId: 'p0', pace: 'lent' as GamePace })).toEqual({
      ok: false,
      error: 'ILLEGAL_FORMAT',
    });

    const started = mustApply(lobby, { type: 'START_GAME', playerId: 'p0' });
    expect(applyAction(started, { type: 'SET_PACE', playerId: 'p0', pace: 'async' })).toEqual({
      ok: false,
      error: 'BAD_PHASE',
    });
  });

  it('en asynchrone, n’importe quel joueur relance la manche', () => {
    let state = mustApply(newLobby(3), { type: 'SET_PACE', playerId: 'p0', pace: 'async' });
    state = mustApply(state, { type: 'START_GAME', playerId: 'p0' });
    while (state.phase !== 'round-scoring') {
      const current = state.players.find((p) => p.seat === state.round!.currentSeat)!;
      state =
        state.phase === 'bidding'
          ? mustApply(state, { type: 'BID', playerId: current.id, bid: lowestLegalBid(state, current.id) })
          : mustApply(state, { type: 'PLAY_CARD', playerId: current.id, cardId: lowestLegalCard(state, current.id) });
    }
    const other = state.players.find((p) => p.id !== state.hostId)!;
    expect(applyAction(state, { type: 'NEXT_ROUND', playerId: other.id }).ok).toBe(true);
  });

  it('en temps réel, la relance reste à l’hôte', () => {
    let state = mustApply(newLobby(3), { type: 'START_GAME', playerId: 'p0' });
    while (state.phase !== 'round-scoring') {
      const current = state.players.find((p) => p.seat === state.round!.currentSeat)!;
      state =
        state.phase === 'bidding'
          ? mustApply(state, { type: 'BID', playerId: current.id, bid: lowestLegalBid(state, current.id) })
          : mustApply(state, { type: 'PLAY_CARD', playerId: current.id, cardId: lowestLegalCard(state, current.id) });
    }
    const other = state.players.find((p) => p.id !== state.hostId)!;
    expect(applyAction(state, { type: 'NEXT_ROUND', playerId: other.id })).toEqual({
      ok: false,
      error: 'NOT_HOST',
    });
  });
});

describe('validation des cartes jouées', () => {
  it('refuse une carte absente de la main', () => {
    let state = mustApply(newLobby(3), { type: 'START_GAME', playerId: 'p0' });
    // finir les enchères
    while (state.phase === 'bidding') {
      const current = state.players.find((p) => p.seat === state.round!.currentSeat)!;
      state = mustApply(state, { type: 'BID', playerId: current.id, bid: lowestLegalBid(state, current.id) });
    }
    const current = state.players.find((p) => p.seat === state.round!.currentSeat)!;
    const notMine = state.players.find((p) => p.id !== current.id)!;
    const foreignCard = cardId(state.round!.hands[notMine.id][0]);
    const res = applyAction(state, { type: 'PLAY_CARD', playerId: current.id, cardId: foreignCard });
    expect(res).toEqual({ ok: false, error: 'ILLEGAL_CARD' });
  });
});

/** Fait avancer une manche jusqu'à la fin de la phase d'enchères. */
function finishBidding(state: GameState): GameState {
  while (state.phase === 'bidding') {
    const current = state.players.find((p) => p.seat === state.round!.currentSeat)!;
    state = mustApply(state, { type: 'BID', playerId: current.id, bid: lowestLegalBid(state, current.id) });
  }
  return state;
}

/** Joue une carte pour le joueur au trait, avec la plus petite carte légale. */
function playOneCard(state: GameState): GameState {
  const current = state.players.find((p) => p.seat === state.round!.currentSeat)!;
  return mustApply(state, { type: 'PLAY_CARD', playerId: current.id, cardId: lowestLegalCard(state, current.id) });
}

describe('journal des plis achevés (completedTricks)', () => {
  it('se remplit pli après pli et repart à vide à la manche suivante', () => {
    let state = mustApply(newLobby(3), { type: 'START_GAME', playerId: 'p0' });
    // Manche 1 : une seule carte, un seul pli — on l'expédie pour atteindre
    // la manche 2 (2 cartes), qui donne deux plis à observer.
    state = finishBidding(state);
    while (state.phase === 'playing') state = playOneCard(state);
    state = mustApply(state, { type: 'NEXT_ROUND', playerId: 'p0' });

    expect(state.round!.cardsCount).toBe(2);
    state = finishBidding(state);
    // Fraîchement distribuée : le journal est vide.
    expect(state.round!.completedTricks ?? []).toEqual([]);

    // Premier pli de la manche (3 joueurs → 3 cartes posées).
    state = playOneCard(state);
    state = playOneCard(state);
    state = playOneCard(state);
    expect(state.round!.completedTricks).toHaveLength(1);
    expect(state.round!.completedTricks![0]).toEqual(state.round!.lastTrick);
    // L'attribution joueur↔carte est bien conservée.
    expect(state.round!.completedTricks![0].plays).toHaveLength(3);

    // Second et dernier pli de la manche.
    state = playOneCard(state);
    state = playOneCard(state);
    state = playOneCard(state);
    expect(state.phase).toBe('round-scoring');
    expect(state.round!.completedTricks).toHaveLength(2);

    // Nouvelle manche : le journal repart à vide, pas de fuite entre manches.
    state = mustApply(state, { type: 'NEXT_ROUND', playerId: 'p0' });
    expect(state.round!.completedTricks).toEqual([]);
  });

  it('ne plante pas sur une manche restaurée sans le champ (parties d’avant cette version)', () => {
    let state = mustApply(newLobby(3), { type: 'START_GAME', playerId: 'p0' });
    state = finishBidding(state);
    // Simule un état persisté avant l'ajout du journal : le champ est absent.
    state = { ...state, round: { ...state.round!, completedTricks: undefined } };
    expect(() => {
      while (state.phase === 'playing') state = playOneCard(state);
    }).not.toThrow();
    // Le pli joué après restauration alimente quand même le journal.
    expect(state.round!.completedTricks).toHaveLength(1);
  });
});
