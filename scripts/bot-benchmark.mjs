/**
 * Banc d'essai des joueurs automatiques.
 *
 * « Le robot joue mieux » n'est pas une affirmation vérifiable à l'œil : sur
 * quelques parties, le hasard de la donne décide de tout. On fait donc jouer
 * des centaines de parties complètes et on mesure ce qui compte réellement au
 * Rikiki — non pas les plis remportés, mais la **précision du contrat** : le
 * jeu récompense celui qui tombe juste, pas celui qui prend le plus.
 *
 * Trois adversaires s'affrontent, tous sur les mêmes donnes :
 *   - `nouveau`  : la stratégie actuelle (mémoire, coupes, contrats adverses) ;
 *   - `ancien`   : la stratégie d'origine, sans mémoire ni lecture des autres ;
 *   - `naïf`     : plus petite carte légale, référence basse.
 *
 * Usage : npx tsx scripts/bot-benchmark.mjs [nbParties]
 * (tsx : le paquet partagé est consommé en TypeScript, sans build préalable)
 */
import {
  applyAction,
  botBid,
  botCard,
  cardId,
  createGame,
  legalBids,
  legalCards,
  ledSuit,
  trickWinner,
} from '@rikiki/shared';

const GAMES = Number(process.argv[2] ?? 300);
/** Format des parties : « blitz » va vite, « normal » monte jusqu'à 10 cartes. */
const FORMAT = process.argv[3] ?? 'blitz';

/* ------------------------------------------------------------------ */
/* Stratégies comparées                                                */
/* ------------------------------------------------------------------ */

function isTrump(card, trump) {
  return trump !== null && card.suit === trump;
}
function beats(candidate, best, trump) {
  const c = isTrump(candidate, trump);
  const b = isTrump(best, trump);
  if (c !== b) return c;
  if (candidate.suit !== best.suit) return false;
  return candidate.rank > best.rank;
}
function cost(card, trump) {
  return (isTrump(card, trump) ? 100 : 0) + card.rank;
}
function dumpValue(card, trump) {
  return isTrump(card, trump) ? card.rank : 100 + card.rank;
}
function leadPower(card, trump) {
  if (isTrump(card, trump)) return 24 + card.rank;
  if (card.rank === 14) return 34;
  if (card.rank === 13) return 15;
  return card.rank;
}
function pick(cards, score) {
  let best = cards[0];
  let bestScore = score(best);
  for (const c of cards.slice(1)) {
    const s = score(c);
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}

/** Stratégie d'origine : ne voit que le pli en cours. */
function legacyCard(state, playerId) {
  const round = state.round;
  const legal = legalCards(round.hands[playerId] ?? [], round.currentTrick);
  const trump = round.trumpCard?.suit ?? null;
  const wantTrick = (round.bids[playerId] ?? 0) - (round.tricksWon[playerId] ?? 0) > 0;

  if (ledSuit(round.currentTrick) === null) {
    return cardId(wantTrick ? pick(legal, (c) => leadPower(c, trump)) : pick(legal, (c) => -cost(c, trump)));
  }
  const best = trickWinner(round.currentTrick, trump).card;
  const winners = legal.filter((c) => beats(c, best, trump));
  if (wantTrick) {
    const pool = winners.length > 0 ? winners : legal;
    return cardId(pick(pool, (c) => -cost(c, trump)));
  }
  const losers = legal.filter((c) => !beats(c, best, trump));
  if (losers.length > 0) return cardId(pick(losers, (c) => dumpValue(c, trump)));
  return cardId(pick(legal, (c) => -cost(c, trump)));
}

/**
 * Annonce d'origine : addition carte par carte, sans potentiel de coupe.
 * Reproduite ici pour que la comparaison porte aussi sur l'annonce — sinon
 * les deux stratégies partageraient le même calcul et l'écart resterait
 * invisible.
 */
function legacyEstimate(hand, trump, nbPlayers) {
  const suitLengths = new Map();
  for (const c of hand) suitLengths.set(c.suit, (suitLengths.get(c.suit) ?? 0) + 1);
  const oppFactor = Math.max(0.6, 1 - 0.05 * (nbPlayers - 3));
  let total = 0;
  for (const card of hand) {
    if (trump !== null && card.suit === trump) {
      total += 0.35 + ((card.rank - 2) / 12) * 0.55;
      continue;
    }
    const len = suitLengths.get(card.suit) ?? 1;
    let p;
    if (card.rank === 14) p = 0.85;
    else if (card.rank === 13) p = len >= 2 ? 0.55 : 0.3;
    else if (card.rank === 12) p = len >= 3 ? 0.3 : 0.12;
    else if (card.rank === 11) p = len >= 4 ? 0.15 : 0.05;
    else p = 0.03;
    total += p * oppFactor;
  }
  return total;
}

function legacyBid(state, playerId) {
  const round = state.round;
  const others = Object.entries(round.bids).filter(([id]) => id !== playerId);
  const otherSum = others.reduce((sum, [, b]) => sum + (b ?? 0), 0);
  const isLast = others.every(([, b]) => b !== null);
  const legal = legalBids(round.cardsCount, otherSum, isLast);
  const raw = legacyEstimate(round.hands[playerId] ?? [], round.trumpCard?.suit ?? null, state.players.length);
  const target = Math.max(0, Math.min(round.cardsCount, Math.round(raw)));
  let best = legal[0];
  for (const b of legal) {
    if (Math.abs(b - target) < Math.abs(best - target)) best = b;
  }
  return best;
}

/** Référence basse : plus petite carte légale, annonce au plus proche de 0. */
function naiveCard(state, playerId) {
  const round = state.round;
  const legal = legalCards(round.hands[playerId] ?? [], round.currentTrick);
  const trump = round.trumpCard?.suit ?? null;
  return cardId(pick(legal, (c) => -cost(c, trump)));
}

const STRATEGIES = {
  nouveau: { bid: botBid, card: botCard },
  ancien: { bid: legacyBid, card: legacyCard },
  naif: { bid: legacyBid, card: naiveCard },
};

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */

/** Joue une partie complète et renvoie, par joueur, contrats tenus et score. */
function playGame(seed, assignment) {
  const players = assignment.map((name, i) => ({
    id: `p${i}`,
    pseudo: name,
    avatar: 'a1',
  }));

  let state = createGame('BENCH', seed, 0, players[0]);
  for (const p of players.slice(1)) {
    const res = applyAction(state, { type: 'ADD_PLAYER', player: p });
    state = res.state;
  }
  state = applyAction(state, { type: 'SET_FORMAT', playerId: players[0].id, format: FORMAT }).state;
  state = applyAction(state, { type: 'START_GAME', playerId: players[0].id }).state;

  const kept = Object.fromEntries(players.map((p) => [p.id, 0]));
  const rounds = Object.fromEntries(players.map((p) => [p.id, 0]));

  let guard = 0;
  while (state.phase !== 'game-over' && guard++ < 5000) {
    const round = state.round;
    if (state.phase === 'bidding') {
      const current = state.players.find((p) => p.seat === round.currentSeat);
      const strat = STRATEGIES[assignment[Number(current.id.slice(1))]];
      const res = applyAction(state, { type: 'BID', playerId: current.id, bid: strat.bid(state, current.id) });
      state = res.ok ? res.state : state;
      if (!res.ok) break;
    } else if (state.phase === 'playing') {
      const current = state.players.find((p) => p.seat === round.currentSeat);
      const strat = STRATEGIES[assignment[Number(current.id.slice(1))]];
      const res = applyAction(state, {
        type: 'PLAY_CARD',
        playerId: current.id,
        cardId: strat.card(state, current.id),
      });
      state = res.ok ? res.state : state;
      if (!res.ok) break;
    } else if (state.phase === 'round-scoring') {
      for (const p of state.players) {
        rounds[p.id] += 1;
        if ((round.bids[p.id] ?? -1) === (round.tricksWon[p.id] ?? 0)) kept[p.id] += 1;
      }
      const res = applyAction(state, { type: 'NEXT_ROUND', playerId: state.hostId });
      if (!res.ok) break;
      state = res.state;
    } else {
      break;
    }
  }

  return state.players.map((p) => ({
    strategy: assignment[Number(p.id.slice(1))],
    kept: kept[p.id],
    rounds: rounds[p.id],
    score: p.totalScore,
  }));
}

/* ------------------------------------------------------------------ */
/* Exécution                                                           */
/* ------------------------------------------------------------------ */

const totals = {};
for (const name of Object.keys(STRATEGIES)) {
  totals[name] = { kept: 0, rounds: 0, score: 0, wins: 0, seats: 0 };
}

// Les trois stratégies tournent de siège en siège : la position du donneur et
// l'ordre de parole avantagent, il ne faut pas qu'ils profitent toujours au
// même. Chaque donne est jouée dans les trois rotations.
const ROTATIONS = [
  ['nouveau', 'ancien', 'naif'],
  ['ancien', 'naif', 'nouveau'],
  ['naif', 'nouveau', 'ancien'],
];

for (let g = 0; g < GAMES; g++) {
  const assignment = ROTATIONS[g % ROTATIONS.length];
  const results = playGame(`bench-${Math.floor(g / ROTATIONS.length)}`, assignment);
  const bestScore = Math.max(...results.map((r) => r.score));
  for (const r of results) {
    const t = totals[r.strategy];
    t.kept += r.kept;
    t.rounds += r.rounds;
    t.score += r.score;
    t.seats += 1;
    if (r.score === bestScore) t.wins += 1;
  }
}

console.log(`\n${GAMES} parties « ${FORMAT} » à 3 joueurs, chaque stratégie tournant sur les 3 sièges\n`);
console.log('stratégie   contrats tenus   score moyen   parties gagnées');
console.log('─'.repeat(62));
for (const [name, t] of Object.entries(totals)) {
  const accuracy = ((t.kept / t.rounds) * 100).toFixed(1);
  const avgScore = (t.score / t.seats).toFixed(1);
  const winRate = ((t.wins / t.seats) * 100).toFixed(1);
  console.log(
    `${name.padEnd(11)} ${(accuracy + ' %').padStart(13)}   ${avgScore.padStart(11)}   ${(winRate + ' %').padStart(15)}`,
  );
}
console.log('');
