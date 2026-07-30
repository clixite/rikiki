import { cardId } from './cards';
import { ledSuit, legalBids, legalCards, trickWinner } from './rules';
import type { Card, CardId, CompletedTrick, GameState, Player, Suit, Trick } from './types';

/* ------------------------------------------------------------------ */
/* Identité des joueurs automatiques                                   */
/* ------------------------------------------------------------------ */

/** Préfixe des identifiants de bots — jamais collisionnable avec un uuid utilisateur. */
export const BOT_ID_PREFIX = 'bot:';

export function isBotId(id: string): boolean {
  return id.startsWith(BOT_ID_PREFIX);
}

export type BotProfile = Pick<Player, 'id' | 'pseudo' | 'avatar'>;

/** Panel de robots (7 suffisent : 1 humain + 7 bots = 8 joueurs max). */
export const BOT_PROFILES: readonly BotProfile[] = [
  { id: `${BOT_ID_PREFIX}ada`, pseudo: 'Ada', avatar: '🤖' },
  { id: `${BOT_ID_PREFIX}turing`, pseudo: 'Turing', avatar: '🦾' },
  { id: `${BOT_ID_PREFIX}marvin`, pseudo: 'Marvin', avatar: '🛸' },
  { id: `${BOT_ID_PREFIX}blaise`, pseudo: 'Blaise', avatar: '⚙️' },
  { id: `${BOT_ID_PREFIX}grace`, pseudo: 'Grace', avatar: '🧠' },
  { id: `${BOT_ID_PREFIX}nono`, pseudo: 'Nono', avatar: '🔩' },
  { id: `${BOT_ID_PREFIX}hedy`, pseudo: 'Hedy', avatar: '📡' },
];

/** Premier profil de robot encore libre (déterministe, jamais aléatoire). */
export function nextBotProfile(takenIds: readonly string[]): BotProfile {
  const taken = new Set(takenIds);
  const free = BOT_PROFILES.find((p) => !taken.has(p.id));
  if (free) return free;
  let n = BOT_PROFILES.length + 1;
  while (taken.has(`${BOT_ID_PREFIX}r${n}`)) n++;
  return { id: `${BOT_ID_PREFIX}r${n}`, pseudo: `Robot ${n}`, avatar: '🤖' };
}

/* ------------------------------------------------------------------ */
/* Outils de comparaison de cartes                                     */
/* ------------------------------------------------------------------ */

function isTrump(card: Card, trump: Suit | null): boolean {
  return trump !== null && card.suit === trump;
}

/** `candidate` prend-elle la main sur la carte maîtresse actuelle du pli ? */
function beats(candidate: Card, best: Card, trump: Suit | null): boolean {
  const c = isTrump(candidate, trump);
  const b = isTrump(best, trump);
  if (c !== b) return c;
  if (candidate.suit !== best.suit) return false;
  return candidate.rank > best.rank;
}

/** Coût d'une carte : on se sépare en priorité des petites cartes hors atout. */
function cost(card: Card, trump: Suit | null): number {
  return (isTrump(card, trump) ? 100 : 0) + card.rank;
}

/**
 * Force d'entame quand le bot cherche des plis : les gros atouts passent
 * devant l'as sec d'une couleur ordinaire, qui passe devant les petits atouts.
 */
function leadPower(card: Card, trump: Suit | null): number {
  if (isTrump(card, trump)) return 24 + card.rank;
  if (card.rank === 14) return 34;
  if (card.rank === 13) return 15;
  return card.rank;
}

/** Argmax déterministe : à égalité, la première carte de la liste gagne. */
function pick(cards: readonly Card[], score: (c: Card) => number): Card {
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

/* ------------------------------------------------------------------ */
/* Annonce                                                             */
/* ------------------------------------------------------------------ */

export interface BotBidInput {
  /** Main du bot pour cette manche. */
  hand: readonly Card[];
  trump: Suit | null;
  cardsCount: number;
  nbPlayers: number;
  /** Annonces autorisées (règle du crochet déjà appliquée). */
  legalBids: readonly number[];
}

/**
 * Espérance de plis d'une main : somme des probabilités estimées carte par carte.
 *
 * - atout : linéaire du 2 (0.35) à l'as (0.90) — même un petit atout coupe parfois ;
 * - as : quasi maître, sauf coupe adverse ;
 * - roi/dame/valet : d'autant plus sûrs qu'ils sont accompagnés (couleur longue) ;
 * - le tout pondéré par le nombre d'adversaires (plus on est nombreux, plus ça coupe).
 */
export function estimateTricks(hand: readonly Card[], trump: Suit | null, nbPlayers: number): number {
  const suitLengths = new Map<Suit, number>();
  for (const c of hand) suitLengths.set(c.suit, (suitLengths.get(c.suit) ?? 0) + 1);

  // 3 joueurs → 1 ; 8 joueurs → 0.75
  const oppFactor = Math.max(0.6, 1 - 0.05 * (nbPlayers - 3));

  let total = 0;
  for (const card of hand) {
    if (isTrump(card, trump)) {
      total += 0.35 + ((card.rank - 2) / 12) * 0.55;
      continue;
    }
    const len = suitLengths.get(card.suit) ?? 1;
    let p: number;
    if (card.rank === 14) p = 0.85;
    else if (card.rank === 13) p = len >= 2 ? 0.55 : 0.3;
    else if (card.rank === 12) p = len >= 3 ? 0.3 : 0.12;
    else if (card.rank === 11) p = len >= 4 ? 0.15 : 0.05;
    else p = 0.03;
    total += p * oppFactor;
  }

  /*
   * Potentiel de coupe.
   *
   * Une main courte dans une couleur, avec des atouts en réserve, rapporte des
   * plis qu'aucune carte prise isolément ne laisse prévoir : on coupe. C'est
   * précisément ce que voit un joueur humain et que l'addition carte par carte
   * manque — d'où des annonces systématiquement trop basses avec beaucoup
   * d'atouts et une main déséquilibrée.
   */
  if (trump !== null) {
    const trumpCount = suitLengths.get(trump) ?? 0;
    let shortness = 0;
    for (const suit of ['S', 'H', 'D', 'C'] as const) {
      if (suit === trump) continue;
      const len = suitLengths.get(suit) ?? 0;
      if (len === 0 && hand.length >= 3) shortness += 1;
      else if (len === 1) shortness += 0.5;
    }
    // Chaque coupe demande un atout : on ne compte pas plus de coupes que
    // d'atouts disponibles, et on reste prudent (0.6 pli par coupe possible).
    total += Math.min(shortness, trumpCount) * 0.6 * oppFactor;
  }

  return total;
}

/** Annonce légale la plus proche de `target` ; à égalité on prend la plus basse (prudence). */
function nearestLegalBid(target: number, legal: readonly number[]): number {
  let best = legal[0];
  let bestDist = Math.abs(best - target);
  for (const b of legal.slice(1)) {
    const d = Math.abs(b - target);
    if (d < bestDist) {
      best = b;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Annonce du bot : estimation arrondie, bornée à [0, cardsCount], puis ramenée
 * sur la valeur légale la plus proche (la règle du crochet peut l'interdire).
 */
export function chooseBid(input: BotBidInput): number {
  if (input.legalBids.length === 0) throw new Error('Aucune annonce légale');
  const raw = estimateTricks(input.hand, input.trump, input.nbPlayers);
  const target = Math.max(0, Math.min(input.cardsCount, Math.round(raw)));
  return nearestLegalBid(target, input.legalBids);
}

/* ------------------------------------------------------------------ */
/* Choix de carte                                                      */
/* ------------------------------------------------------------------ */

export interface BotOpponent {
  playerId: string;
  /** Plis encore nécessaires : positif = il en cherche, 0 = il n'en veut plus. */
  needed: number;
  /** Couleurs dont on l'a vu se défausser : il n'en a plus. */
  voids: ReadonlySet<Suit>;
}

export interface BotCardInput {
  /** Cartes jouables (résultat de `legalCards`). */
  legal: readonly Card[];
  /** Pli en cours (éventuellement vide si le bot entame). */
  trick: Trick;
  trump: Suit | null;
  /** Contrat annoncé par le bot pour la manche. */
  bid: number;
  /** Plis déjà remportés par le bot dans la manche. */
  tricksWon: number;
  /** Cartes déjà tombées dans la manche, celles du pli en cours comprises. */
  seen?: readonly Card[];
  /** Cartes encore en main du bot (pour juger de la longueur d'une couleur). */
  hand?: readonly Card[];
  /** Nombre de joueurs qui parleront après lui dans ce pli. */
  playersAfter?: number;
  /** Total des cartes encore en main chez les adversaires. */
  opponentCards?: number;
  /** État des adversaires : ce qu'ils cherchent, ce qui leur manque. */
  opponents?: readonly BotOpponent[];
}

/**
 * Probabilité qu'une carte ne soit dominée par aucune carte adverse.
 *
 * Au Rikiki, contrairement à la belote ou au bridge, **une grande partie du
 * paquet n'est jamais distribuée** : à trois joueurs et cinq cartes, quinze
 * cartes sur cinquante-deux sont en jeu. Une carte plus forte qui n'est pas
 * encore tombée dort donc le plus souvent dans le talon, où elle ne prendra
 * jamais rien. Raisonner en « maîtresse ou non » — comme le ferait un joueur
 * de belote — conduit à ne jamais rien considérer comme sûr, et ne sert à rien.
 *
 * On estime donc, pour chaque carte supérieure encore inconnue, la chance
 * qu'elle se trouve réellement dans une main adverse : le rapport entre les
 * cartes que les adversaires détiennent encore et le total des cartes que l'on
 * ne voit pas.
 */
function dominanceOdds(
  card: Card,
  seen: readonly Card[],
  hand: readonly Card[],
  opponentCards: number,
): number {
  const known = new Set<string>();
  for (const c of seen) known.add(`${c.suit}${c.rank}`);
  for (const c of hand) known.add(`${c.suit}${c.rank}`);

  let higherUnknown = 0;
  for (let rank = card.rank + 1; rank <= 14; rank++) {
    if (!known.has(`${card.suit}${rank}`)) higherUnknown++;
  }
  if (higherUnknown === 0) return 1;

  // 52 cartes, moins ce que l'on connaît : le reste se partage entre les mains
  // adverses et le talon jamais distribué.
  const unknown = Math.max(1, 52 - known.size);
  const inOpponentHands = Math.min(1, Math.max(0, opponentCards) / unknown);
  // Chaque carte supérieure est indépendamment « chez un adversaire » avec
  // cette probabilité ; la carte passe si aucune n'y est.
  return (1 - inOpponentHands) ** higherUnknown;
}

/** Seuil au-delà duquel on traite une carte comme gagnante. */
const SURE_ENOUGH = 0.7;

/** Un adversaire encore en course pour des plis peut-il couper cette couleur ? */
function someoneCanRuff(suit: Suit, trump: Suit | null, opponents: readonly BotOpponent[]): boolean {
  if (trump === null || suit === trump) return false;
  return opponents.some((o) => o.needed > 0 && o.voids.has(suit));
}

/**
 * Choix de carte, piloté par le contrat et par ce qui s'est déjà joué.
 *
 * Trois idées, dans cet ordre d'importance :
 *
 * 1. **Mémoire.** Une carte maîtresse se joue sans hésiter quand on cherche un
 *    pli, et se garde quand on n'en veut pas.
 * 2. **Position.** Dernier à parler, on sait exactement ce que coûte la prise :
 *    on prend au plus juste, ou on se couche pour rien. Premier, on ne sait
 *    rien et il faut se méfier.
 * 3. **Contrats adverses.** Au Rikiki, tout le monde ne cherche pas à gagner :
 *    celui qui a fini son contrat fuit les plis. Entamer une couleur qu'un
 *    joueur en manque de plis peut couper, c'est lui offrir le pli.
 */
export function chooseCard(input: BotCardInput): CardId {
  const { legal, trick, trump } = input;
  if (legal.length === 0) throw new Error('Aucune carte jouable');
  const seen = input.seen ?? [];
  const hand = input.hand ?? legal;
  const opponents = input.opponents ?? [];
  const playersAfter = input.playersAfter ?? 0;
  const opponentCards = input.opponentCards ?? hand.length * Math.max(1, opponents.length);
  const remaining = input.bid - input.tricksWon;
  const wantTrick = remaining > 0;

  // ---- Entame : personne à battre, on choisit l'intention
  if (ledSuit(trick) === null) {
    if (wantTrick) {
      // Une maîtresse d'abord : c'est un pli quasi acquis, sauf coupe.
      const masters = legal.filter(
        (c) =>
          dominanceOdds(c, seen, hand, opponentCards) >= SURE_ENOUGH &&
          !someoneCanRuff(c.suit, trump, opponents),
      );
      const pool = masters.length > 0 ? masters : legal;
      return cardId(pick(pool, (c) => leadPower(c, trump)));
    }
    // On fuit les plis : petite carte, et surtout pas une couleur que quelqu'un
    // qui cherche des plis pourrait couper — ce serait la lui offrir.
    const safe = legal.filter((c) => !someoneCanRuff(c.suit, trump, opponents));
    const pool = safe.length > 0 ? safe : legal;
    return cardId(pick(pool, (c) => -cost(c, trump)));
  }

  const best = trickWinner(trick, trump).card;
  const winners = legal.filter((c) => beats(c, best, trump));
  const losers = legal.filter((c) => !beats(c, best, trump));

  if (wantTrick) {
    if (winners.length === 0) {
      // Impossible de prendre : on garde ses forces pour les plis suivants.
      return cardId(pick(legal, (c) => -cost(c, trump)));
    }
    // Dernier à parler : la prise est certaine, on la paie au prix minimum.
    if (playersAfter === 0) {
      return cardId(pick(winners, (c) => -cost(c, trump)));
    }
    // Des joueurs passent encore : une prise trop juste se fait repasser
    // dessus. On prend franchement quand la carte est maîtresse, sinon au
    // meilleur marché.
    const sure = winners.filter((c) => dominanceOdds(c, seen, hand, opponentCards) >= SURE_ENOUGH);
    return cardId(sure.length > 0 ? pick(sure, (c) => -cost(c, trump)) : pick(winners, (c) => -cost(c, trump)));
  }

  // ---- Contrat atteint : on évite de prendre
  if (losers.length > 0) {
    // Le pli est perdu, tant mieux : c'est l'occasion GRATUITE de lâcher la
    // carte qui, gardée, nous forcerait à remporter un pli plus tard et à
    // casser un contrat déjà tenu. La plus dangereuse est celle qui a le plus
    // de chances de dominer un futur pli — au premier chef un atout devenu
    // maître. On la mesure par `dominanceOdds` plutôt que par un forfait qui
    // classait aveuglément tout atout derrière n'importe quelle carte
    // ordinaire, et gardait donc les atouts encombrants jusqu'au bout.
    const danger = (c: Card) => dominanceOdds(c, seen, hand, opponentCards) * 100 + c.rank;
    return cardId(pick(losers, danger));
  }
  // Obligé de dépasser : la plus petite, pour laisser les suivants repasser.
  return cardId(pick(legal, (c) => -cost(c, trump)));
}

/* ------------------------------------------------------------------ */
/* Adaptateurs sur le GameState (utilisés par le serveur)              */
/* ------------------------------------------------------------------ */

/** Annonce du bot `playerId` dans l'état courant (phase `bidding`). */
export function botBid(state: GameState, playerId: string): number {
  const round = state.round!;
  const others = Object.entries(round.bids).filter(([id]) => id !== playerId);
  const otherSum = others.reduce((sum, [, b]) => sum + (b ?? 0), 0);
  const isLast = others.every(([, b]) => b !== null);
  return chooseBid({
    hand: round.hands[playerId] ?? [],
    trump: round.trumpCard?.suit ?? null,
    cardsCount: round.cardsCount,
    nbPlayers: state.players.length,
    legalBids: legalBids(round.cardsCount, otherSum, isLast),
  });
}

/**
 * Coupes déduites de la manche.
 *
 * Un joueur qui ne fournit pas la couleur demandée n'en a plus : c'est la
 * déduction la plus rentable d'un jeu de plis, et elle est gratuite. Une
 * renonce vue au premier pli reste vraie jusqu'à la fin de la manche — on
 * parcourt donc tout le journal des plis achevés (`completedTricks`), pas
 * seulement le dernier : s'arrêter à `lastTrick` faisait « oublier » un
 * adversaire vide dès le pli suivant, et le bot entamait alors une couleur
 * qu'il croyait sûre en pensant avoir déjà écarté cette menace.
 */
function inferVoids(state: GameState): Map<string, Set<Suit>> {
  const voids = new Map<string, Set<Suit>>();
  const round = state.round;
  if (!round) return voids;

  const record = (trick: Trick | CompletedTrick | null | undefined) => {
    if (!trick || trick.plays.length === 0) return;
    const led = trick.plays[0].card.suit;
    for (const play of trick.plays.slice(1)) {
      if (play.card.suit === led) continue;
      const set = voids.get(play.playerId) ?? new Set<Suit>();
      set.add(led);
      voids.set(play.playerId, set);
    }
  };
  // Parties reprises depuis avant l'ajout du journal : il n'existe pas encore,
  // on retombe sur le seul `lastTrick` que l'état conservait alors — pas de
  // régression, juste la mémoire courte d'avant.
  const completed = round.completedTricks ?? (round.lastTrick ? [round.lastTrick] : []);
  for (const trick of completed) record(trick);
  record(round.currentTrick);
  return voids;
}

/** Carte jouée par le bot `playerId` dans l'état courant (phase `playing`). */
export function botCard(state: GameState, playerId: string): CardId {
  const round = state.round!;
  const hand = round.hands[playerId] ?? [];
  const voids = inferVoids(state);

  // Combien de joueurs parlent encore après nous dans ce pli : dernier à
  // jouer, la prise est certaine et se paie au prix minimum.
  const playersAfter = Math.max(0, state.players.length - round.currentTrick.plays.length - 1);

  const opponents: BotOpponent[] = state.players
    .filter((p) => p.id !== playerId)
    .map((p) => ({
      playerId: p.id,
      needed: (round.bids[p.id] ?? 0) - (round.tricksWon[p.id] ?? 0),
      voids: voids.get(p.id) ?? new Set<Suit>(),
    }));

  // Cartes qui peuvent ENCORE contester le pli : celles des adversaires qui
  // n'ont pas encore joué dans ce pli. Compter aussi ceux qui ont déjà posé
  // gonflait le risque perçu et poussait le bot à garder ses maîtresses par
  // excès de prudence — au dernier à parler, plus personne ne peut le coiffer.
  const played = new Set(round.currentTrick.plays.map((p) => p.playerId));
  const opponentCards = state.players
    .filter((p) => p.id !== playerId && !played.has(p.id))
    .reduce((sum, p) => sum + (round.hands[p.id]?.length ?? 0), 0);

  return chooseCard({
    legal: legalCards(hand, round.currentTrick),
    trick: round.currentTrick,
    trump: round.trumpCard?.suit ?? null,
    bid: round.bids[playerId] ?? 0,
    tricksWon: round.tricksWon[playerId] ?? 0,
    // L'atout retourné est visible de tous : il compte comme carte connue.
    seen: [...(round.playedCards ?? []), ...(round.trumpCard ? [round.trumpCard] : [])],
    hand,
    playersAfter,
    opponentCards,
    opponents,
  });
}
