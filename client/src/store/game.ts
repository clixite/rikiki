import { create } from 'zustand';
import type { Card, CompletedTrick, EmoteId, GameView, TransientEvent } from '@rikiki/shared';
import { playSound } from '../audio';
import { vibrate } from '../haptics';
import { t as tr } from '../i18n';
import { applyOptimistic, EMPTY_OPTIMISTIC, type OptimisticState } from './optimistic';


const TRICK_FREEZE_MS = 1600;

interface GameStore {
  view: GameView | null;
  socketConnected: boolean;
  /** Dernier pli complet affiché quelques instants avant d'être ramassé. */
  frozenTrick: CompletedTrick | null;
  /** Contrat de la manche qui vient de s'achever : anime le récapitulatif. */
  roundOutcome: 'success' | 'fail' | null;
  /** Incrémenté à chaque motif de célébration (contrat tenu, victoire). */
  celebrate: number;
  closedReason: string | null;
  toast: string | null;
  /** Coup joué localement, en attente de confirmation du serveur. */
  optimistic: OptimisticState;
  /** Réactions reçues, affichées quelques secondes près de leur auteur. */
  emotes: { id: number; playerId: string; emote: EmoteId }[];
  setView: (view: GameView) => void;
  /** Applique un coup immédiatement à l'écran (sans attendre le serveur). */
  playOptimistic: (card: Card) => void;
  bidOptimistic: (bid: number) => void;
  /** Abandonne le coup local : la vue du serveur reprend la main. */
  rollbackOptimistic: () => void;
  /** Vue à afficher : serveur + coup local éventuel. */
  displayView: () => GameView | null;
  onEvent: (event: TransientEvent) => void;
  /** Retire une réaction dont l'affichage est terminé. */
  dismissEmote: (id: number) => void;
  setSocketConnected: (connected: boolean) => void;
  setClosed: (reason: string | null) => void;
  showToast: (message: string) => void;
  reset: () => void;
}

/** Durée d'affichage d'une réaction au-dessus de son auteur. */
const EMOTE_VISIBLE_MS = 2600;
let emoteSeq = 0;
let freezeTimer: ReturnType<typeof setTimeout> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function tricksPlayed(view: GameView | null): number {
  if (!view?.round) return -1;
  return Object.values(view.round.tricksWon).reduce((a, b) => a + b, 0);
}

/** Le joueur est-il attendu (annonce ou carte) dans cette vue ? */
function isMyTurn(view: GameView | null | undefined): boolean {
  if (!view?.round) return false;
  if (view.phase !== 'bidding' && view.phase !== 'playing') return false;
  const me = view.players.find((p) => p.id === view.you);
  return me !== undefined && view.round.currentSeat === me.seat;
}

export const useGame = create<GameStore>((set, get) => ({
  view: null,
  socketConnected: false,
  emotes: [],
  frozenTrick: null,
  roundOutcome: null,
  celebrate: 0,
  closedReason: null,
  toast: null,
  optimistic: EMPTY_OPTIMISTIC,

  playOptimistic: (card) => {
    const view = get().view;
    if (!view) return;
    set({ optimistic: { ...get().optimistic, playedCard: { card, playerId: view.you } } });
  },

  bidOptimistic: (bid) => set({ optimistic: { ...get().optimistic, bid } }),

  rollbackOptimistic: () => set({ optimistic: EMPTY_OPTIMISTIC }),

  displayView: () => {
    const { view, optimistic } = get();
    return view ? applyOptimistic(view, optimistic) : null;
  },

  setView: (view) => {
    const prev = get().view;
    const sameRound = prev?.round?.roundIndex === view.round?.roundIndex && prev?.code === view.code;
    const newTrickCompleted = sameRound && view.round?.lastTrick && tricksPlayed(view) > tricksPlayed(prev);
    if (newTrickCompleted) {
      if (freezeTimer) clearTimeout(freezeTimer);
      const trick = view.round!.lastTrick!;
      set({ frozenTrick: trick });
      const iWonTrick = trick.winnerId === view.you;
      playSound(iWonTrick ? 'trickWin' : 'trickLose');
      if (iWonTrick) vibrate('success');
      freezeTimer = setTimeout(() => set({ frozenTrick: null }), TRICK_FREEZE_MS);
    }

    // Nouvelle donne : rafale de distribution, calée sur l'animation des cartes
    const newDeal =
      (view.round && prev?.round && view.round.roundIndex !== prev.round.roundIndex) ||
      (view.round !== null && !prev?.round);
    if (newDeal) {
      playSound('dealStart');
      vibrate('select');
    }

    // Fin de manche : verdict du contrat, sonore et tactile
    if (view.phase === 'round-scoring' && prev?.phase !== 'round-scoring' && view.round) {
      const bid = view.round.bids[view.you];
      const tricks = view.round.tricksWon[view.you] ?? 0;
      const success = bid !== null && bid === tricks;
      playSound(success ? 'contractSuccess' : 'contractFail');
      vibrate(success ? 'success' : 'failure');
      set({ roundOutcome: success ? 'success' : 'fail', celebrate: get().celebrate + (success ? 1 : 0) });
    }
    if (view.phase !== 'round-scoring' && prev?.phase === 'round-scoring') {
      set({ roundOutcome: null });
    }

    // C'est à moi : discret rappel sonore (uniquement au passage de tour)
    const wasMyTurn = isMyTurn(prev);
    const nowMyTurn = isMyTurn(view);
    if (nowMyTurn && !wasMyTurn && !newTrickCompleted) {
      playSound('yourTurn');
    }

    // Fin de partie : fanfare et confettis pour le vainqueur
    if (view.phase === 'game-over' && prev?.phase !== 'game-over') {
      const best = Math.max(...view.players.map((p) => p.totalScore));
      const iWon = view.players.find((p) => p.id === view.you)?.totalScore === best;
      playSound(iWon ? 'victory' : 'defeat');
      vibrate(iWon ? 'celebrate' : 'failure');
      if (iWon) set({ celebrate: get().celebrate + 1 });
    }

    // Coup d'envoi
    if (view.phase === 'bidding' && prev?.phase === 'lobby') {
      playSound('gameStart');
    }

    // La vue du serveur fait foi : le coup local n'a plus lieu d'être
    set({ view, closedReason: null, optimistic: EMPTY_OPTIMISTIC });
  },

  onEvent: (event) => {
    const view = get().view;
    const pseudoOf = (id: string) => view?.players.find((p) => p.id === id)?.pseudo ?? '';
    switch (event.type) {
      case 'player-joined':
        get().showToast(tr().playerJoined(event.pseudo));
        playSound('join');
        break;
      case 'bid-placed':
        if (event.playerId !== view?.you) playSound('bid');
        break;
      case 'card-played':
        if (event.playerId !== view?.you) playSound('cardPlay');
        break;
      // Le verdict de fin de manche est déjà sonorisé dans setView
      // (contrat tenu ou manqué) : pas de second son ici.
      case 'player-left':
        get().showToast(tr().playerLeft(event.pseudo));
        break;
      case 'player-disconnected':
        get().showToast(tr().playerDisconnected(pseudoOf(event.playerId)));
        break;
      case 'player-reconnected':
        get().showToast(tr().playerReconnected(pseudoOf(event.playerId)));
        break;
      case 'emote': {
        // Chaque réaction porte un identifiant propre : deux envois identiques
        // coup sur coup doivent s'afficher comme deux bulles distinctes.
        const id = ++emoteSeq;
        set((state) => ({ emotes: [...state.emotes, { id, playerId: event.playerId, emote: event.emote }] }));
        playSound('bid');
        setTimeout(() => get().dismissEmote(id), EMOTE_VISIBLE_MS);
        break;
      }
      default:
        break;
    }
  },

  dismissEmote: (id) => set((state) => ({ emotes: state.emotes.filter((e) => e.id !== id) })),

  setSocketConnected: (socketConnected) => set({ socketConnected }),

  setClosed: (reason) => {
    if (freezeTimer) clearTimeout(freezeTimer);
    set({ closedReason: reason, view: null, frozenTrick: null, roundOutcome: null, optimistic: EMPTY_OPTIMISTIC, emotes: [] });
  },

  showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 2500);
  },

  reset: () => {
    if (freezeTimer) clearTimeout(freezeTimer);
    set({ view: null, frozenTrick: null, roundOutcome: null, closedReason: null, toast: null, optimistic: EMPTY_OPTIMISTIC, emotes: [] });
  },
}));
