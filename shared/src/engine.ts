import { isBotId } from './bot';
import { cardFromId, cardId, fullDeck, hashSeed, mulberry32, shuffle, sortHand } from './cards';
import {
  DEFAULT_FORMAT,
  DEFAULT_PACE,
  DEFAULT_SCORING,
  MAX_PLAYERS,
  MIN_PLAYERS,
  isGameFormat,
  isGamePace,
  isScoringVariant,
  legalBids,
  legalCards,
  roundsSequence,
  scoreRound,
  trickWinner,
  type GameFormat,
  type GamePace,
  type ScoringVariant,
} from './rules';
import type { CardId, GameState, Player, RoundState } from './types';

export type EngineErrorCode =
  | 'BAD_PHASE'
  | 'NOT_HOST'
  | 'NOT_ENOUGH_PLAYERS'
  | 'ROOM_FULL'
  | 'PLAYER_NOT_FOUND'
  | 'NOT_YOUR_TURN'
  | 'ILLEGAL_BID'
  | 'ILLEGAL_BID_HOOK'
  | 'ILLEGAL_CARD'
  | 'ILLEGAL_FORMAT';

export type GameAction =
  | { type: 'ADD_PLAYER'; player: Pick<Player, 'id' | 'pseudo' | 'avatar'> & { photo?: string | null } }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'UPDATE_PROFILE'; playerId: string; pseudo: string; avatar: string; photo?: string | null }
  | { type: 'SET_CONNECTED'; playerId: string; connected: boolean }
  | { type: 'SET_PAUSED'; playerId: string; paused: boolean }
  | { type: 'SET_FORMAT'; playerId: string; format: GameFormat }
  | { type: 'SET_SCORING'; playerId: string; scoring: ScoringVariant }
  | { type: 'SET_PACE'; playerId: string; pace: GamePace }
  | { type: 'START_GAME'; playerId: string }
  | { type: 'BID'; playerId: string; bid: number }
  | { type: 'PLAY_CARD'; playerId: string; cardId: CardId }
  | { type: 'NEXT_ROUND'; playerId: string };

export type EngineResult =
  | { ok: true; state: GameState }
  | { ok: false; error: EngineErrorCode };

function err(error: EngineErrorCode): EngineResult {
  return { ok: false, error };
}

export function createGame(
  code: string,
  seed: string,
  createdAt: number,
  host: Pick<Player, 'id' | 'pseudo' | 'avatar'> & { photo?: string | null },
): GameState {
  return {
    code,
    hostId: host.id,
    founderId: host.id,
    phase: 'lobby',
    players: [{ ...host, seat: 0, connected: true, totalScore: 0 }],
    maxPlayers: MAX_PLAYERS,
    format: DEFAULT_FORMAT,
    scoring: DEFAULT_SCORING,
    pace: DEFAULT_PACE,
    roundsSequence: [],
    round: null,
    createdAt,
    seed,
  };
}

function playerBySeat(state: GameState, seat: number): Player {
  const p = state.players.find((pl) => pl.seat === seat);
  if (!p) throw new Error(`Aucun joueur au siège ${seat}`);
  return p;
}

function nextSeat(state: GameState, seat: number): number {
  return (seat + 1) % state.players.length;
}

/** Distribue la manche `roundIndex` et passe en phase d'enchères. */
function dealRound(state: GameState, roundIndex: number, dealerSeat: number): void {
  const cardsCount = state.roundsSequence[roundIndex];
  const n = state.players.length;
  const rand = mulberry32(hashSeed(`${state.seed}:${roundIndex}`));
  const deck = shuffle(fullDeck(), rand);

  const hands: RoundState['hands'] = {};
  state.players.forEach((p, i) => {
    hands[p.id] = deck.slice(i * cardsCount, (i + 1) * cardsCount);
  });
  const remaining = deck.length - n * cardsCount;
  const trumpCard = remaining > 0 ? deck[n * cardsCount] : null;

  for (const p of state.players) {
    hands[p.id] = sortHand(hands[p.id], trumpCard?.suit ?? null);
  }

  const firstSeat = (dealerSeat + 1) % n;
  state.round = {
    roundIndex,
    cardsCount,
    dealerSeat,
    trumpCard,
    hands,
    bids: Object.fromEntries(state.players.map((p) => [p.id, null])),
    currentSeat: firstSeat,
    currentTrick: { leaderSeat: firstSeat, plays: [] },
    lastTrick: null,
    playedCards: [],
    tricksWon: Object.fromEntries(state.players.map((p) => [p.id, 0])),
    roundScores: null,
  };
  state.phase = 'bidding';
}

export function applyAction(prev: GameState, action: GameAction): EngineResult {
  const state = structuredClone(prev);

  switch (action.type) {
    case 'ADD_PLAYER': {
      const existing = state.players.find((p) => p.id === action.player.id);
      if (existing) return { ok: true, state };
      if (state.phase !== 'lobby') return err('BAD_PHASE');
      if (state.players.length >= state.maxPlayers) return err('ROOM_FULL');
      state.players.push({ ...action.player, seat: state.players.length, connected: true, totalScore: 0 });
      return { ok: true, state };
    }

    case 'REMOVE_PLAYER': {
      if (state.phase !== 'lobby') return err('BAD_PHASE');
      const idx = state.players.findIndex((p) => p.id === action.playerId);
      if (idx === -1) return err('PLAYER_NOT_FOUND');
      state.players.splice(idx, 1);
      state.players.forEach((p, i) => (p.seat = i));
      if (state.hostId === action.playerId && state.players.length > 0) {
        // Un bot ne devient jamais hôte tant qu'il reste un humain.
        const human = state.players.find((p) => !isBotId(p.id));
        state.hostId = (human ?? state.players[0]).id;
      }
      return { ok: true, state };
    }

    case 'UPDATE_PROFILE': {
      const p = state.players.find((pl) => pl.id === action.playerId);
      if (!p) return err('PLAYER_NOT_FOUND');
      p.pseudo = action.pseudo;
      p.avatar = action.avatar;
      if (action.photo !== undefined) p.photo = action.photo;
      return { ok: true, state };
    }

    case 'SET_CONNECTED': {
      const p = state.players.find((pl) => pl.id === action.playerId);
      if (!p) return err('PLAYER_NOT_FOUND');
      p.connected = action.connected;
      return { ok: true, state };
    }

    case 'SET_PAUSED': {
      const p = state.players.find((pl) => pl.id === action.playerId);
      if (!p) return err('PLAYER_NOT_FOUND');
      p.paused = action.paused;
      return { ok: true, state };
    }

    case 'SET_FORMAT': {
      if (state.phase !== 'lobby') return err('BAD_PHASE');
      if (action.playerId !== state.hostId) return err('NOT_HOST');
      if (!isGameFormat(action.format)) return err('ILLEGAL_FORMAT');
      state.format = action.format;
      return { ok: true, state };
    }

    case 'SET_SCORING': {
      if (state.phase !== 'lobby') return err('BAD_PHASE');
      if (action.playerId !== state.hostId) return err('NOT_HOST');
      if (!isScoringVariant(action.scoring)) return err('ILLEGAL_FORMAT');
      state.scoring = action.scoring;
      return { ok: true, state };
    }

    case 'SET_PACE': {
      if (state.phase !== 'lobby') return err('BAD_PHASE');
      if (action.playerId !== state.hostId) return err('NOT_HOST');
      if (!isGamePace(action.pace)) return err('ILLEGAL_FORMAT');
      state.pace = action.pace;
      return { ok: true, state };
    }

    case 'START_GAME': {
      if (state.phase !== 'lobby') return err('BAD_PHASE');
      if (action.playerId !== state.hostId) return err('NOT_HOST');
      if (state.players.length < MIN_PLAYERS) return err('NOT_ENOUGH_PLAYERS');
      state.roundsSequence = roundsSequence(state.players.length, state.format);
      const rand = mulberry32(hashSeed(`${state.seed}:dealer`));
      const dealerSeat = Math.floor(rand() * state.players.length);
      dealRound(state, 0, dealerSeat);
      return { ok: true, state };
    }

    case 'BID': {
      if (state.phase !== 'bidding' || !state.round) return err('BAD_PHASE');
      const round = state.round;
      const current = playerBySeat(state, round.currentSeat);
      if (current.id !== action.playerId) return err('NOT_YOUR_TURN');
      if (!Number.isInteger(action.bid) || action.bid < 0 || action.bid > round.cardsCount) return err('ILLEGAL_BID');
      const others = Object.entries(round.bids).filter(([id]) => id !== action.playerId);
      const otherSum = others.reduce((sum, [, b]) => sum + (b ?? 0), 0);
      const isLast = others.every(([, b]) => b !== null);
      if (!legalBids(round.cardsCount, otherSum, isLast).includes(action.bid)) {
        return err('ILLEGAL_BID_HOOK');
      }
      round.bids[action.playerId] = action.bid;
      if (isLast) {
        state.phase = 'playing';
        round.currentSeat = (round.dealerSeat + 1) % state.players.length;
        round.currentTrick = { leaderSeat: round.currentSeat, plays: [] };
      } else {
        round.currentSeat = nextSeat(state, round.currentSeat);
      }
      return { ok: true, state };
    }

    case 'PLAY_CARD': {
      if (state.phase !== 'playing' || !state.round) return err('BAD_PHASE');
      const round = state.round;
      const current = playerBySeat(state, round.currentSeat);
      if (current.id !== action.playerId) return err('NOT_YOUR_TURN');
      const hand = round.hands[action.playerId];
      const card = hand.find((c) => cardId(c) === action.cardId);
      if (!card) return err('ILLEGAL_CARD');
      const legal = legalCards(hand, round.currentTrick).map(cardId);
      if (!legal.includes(action.cardId)) return err('ILLEGAL_CARD');

      // Retrait de la carte, puis nouveau tri : quand une couleur disparaît de
      // la main, l'alternance rouge/noir doit se refaire, sinon deux couleurs
      // de même teinte se retrouvent côte à côte et la lecture se brouille.
      round.hands[action.playerId] = sortHand(
        hand.filter((c) => cardId(c) !== action.cardId),
        round.trumpCard?.suit ?? null,
      );
      round.currentTrick.plays.push({ playerId: action.playerId, card });
      // Mémoire publique de la manche : ce qui est tombé ne revient pas.
      (round.playedCards ??= []).push(card);

      if (round.currentTrick.plays.length === state.players.length) {
        const winner = trickWinner(round.currentTrick, round.trumpCard?.suit ?? null);
        round.tricksWon[winner.playerId] += 1;
        round.lastTrick = { ...round.currentTrick, winnerId: winner.playerId };
        const winnerSeat = state.players.find((p) => p.id === winner.playerId)!.seat;

        const handsEmpty = state.players.every((p) => round.hands[p.id].length === 0);
        if (handsEmpty) {
          round.roundScores = {};
          for (const p of state.players) {
            const score = scoreRound(round.bids[p.id] ?? 0, round.tricksWon[p.id], state.scoring ?? DEFAULT_SCORING);
            round.roundScores[p.id] = score;
            p.totalScore += score;
          }
          state.phase = 'round-scoring';
        } else {
          round.currentTrick = { leaderSeat: winnerSeat, plays: [] };
          round.currentSeat = winnerSeat;
        }
      } else {
        round.currentSeat = nextSeat(state, round.currentSeat);
      }
      return { ok: true, state };
    }

    case 'NEXT_ROUND': {
      if (state.phase !== 'round-scoring' || !state.round) return err('BAD_PHASE');
      // En temps réel, l'hôte donne le rythme : il laisse la table lire les
      // scores. En asynchrone il peut être absent des heures, et attendre son
      // clic bloquerait tout le monde — chacun peut donc relancer la manche.
      const canAdvance =
        state.pace === 'async'
          ? state.players.some((p) => p.id === action.playerId)
          : action.playerId === state.hostId;
      if (!canAdvance) return err('NOT_HOST');
      const nextIndex = state.round.roundIndex + 1;
      if (nextIndex < state.roundsSequence.length) {
        const dealerSeat = (state.round.dealerSeat + 1) % state.players.length;
        dealRound(state, nextIndex, dealerSeat);
      } else {
        state.phase = 'game-over';
      }
      return { ok: true, state };
    }
  }
}

/** Plus petite enchère légale (utilisée par l'auto-play serveur). */
export function lowestLegalBid(state: GameState, playerId: string): number {
  const round = state.round!;
  const others = Object.entries(round.bids).filter(([id]) => id !== playerId);
  const otherSum = others.reduce((sum, [, b]) => sum + (b ?? 0), 0);
  const isLast = others.every(([, b]) => b !== null);
  return legalBids(round.cardsCount, otherSum, isLast)[0];
}

/** Plus petite carte légale (utilisée par l'auto-play serveur). */
export function lowestLegalCard(state: GameState, playerId: string): CardId {
  const round = state.round!;
  const legal = legalCards(round.hands[playerId], round.currentTrick);
  const lowest = legal.reduce((min, c) => (c.rank < min.rank ? c : min), legal[0]);
  return cardId(lowest);
}

export { cardFromId, cardId };
