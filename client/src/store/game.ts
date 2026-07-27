import { create } from 'zustand';
import type { CompletedTrick, GameView, TransientEvent } from '@rikiki/shared';
import { playSound } from '../audio';
import { fr } from '../i18n/fr';

const TRICK_FREEZE_MS = 1600;

interface GameStore {
  view: GameView | null;
  socketConnected: boolean;
  /** Dernier pli complet affiché quelques instants avant d'être ramassé. */
  frozenTrick: CompletedTrick | null;
  closedReason: string | null;
  toast: string | null;
  setView: (view: GameView) => void;
  onEvent: (event: TransientEvent) => void;
  setSocketConnected: (connected: boolean) => void;
  setClosed: (reason: string | null) => void;
  showToast: (message: string) => void;
  reset: () => void;
}

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
  frozenTrick: null,
  closedReason: null,
  toast: null,

  setView: (view) => {
    const prev = get().view;
    const sameRound = prev?.round?.roundIndex === view.round?.roundIndex && prev?.code === view.code;
    const newTrickCompleted = sameRound && view.round?.lastTrick && tricksPlayed(view) > tricksPlayed(prev);
    if (newTrickCompleted) {
      if (freezeTimer) clearTimeout(freezeTimer);
      const trick = view.round!.lastTrick!;
      set({ frozenTrick: trick });
      playSound(trick.winnerId === view.you ? 'trickWin' : 'trickLose');
      freezeTimer = setTimeout(() => set({ frozenTrick: null }), TRICK_FREEZE_MS);
    }

    // Nouvelle donne : bruit de distribution
    if (view.round && prev?.round && view.round.roundIndex !== prev.round.roundIndex) {
      playSound('cardDeal');
    } else if (view.round && !prev?.round) {
      playSound('cardDeal');
    }

    // C'est à moi : discret rappel sonore (uniquement au passage de tour)
    const wasMyTurn = isMyTurn(prev);
    const nowMyTurn = isMyTurn(view);
    if (nowMyTurn && !wasMyTurn && !newTrickCompleted) {
      playSound('yourTurn');
    }

    // Fin de partie
    if (view.phase === 'game-over' && prev?.phase !== 'game-over') {
      const best = Math.max(...view.players.map((p) => p.totalScore));
      const iWon = view.players.find((p) => p.id === view.you)?.totalScore === best;
      playSound(iWon ? 'victory' : 'roundEnd');
    }

    set({ view, closedReason: null });
  },

  onEvent: (event) => {
    const view = get().view;
    const pseudoOf = (id: string) => view?.players.find((p) => p.id === id)?.pseudo ?? '';
    switch (event.type) {
      case 'player-joined':
        get().showToast(fr.playerJoined(event.pseudo));
        playSound('join');
        break;
      case 'bid-placed':
        if (event.playerId !== view?.you) playSound('bid');
        break;
      case 'card-played':
        if (event.playerId !== view?.you) playSound('cardPlay');
        break;
      case 'round-scored':
        playSound('roundEnd');
        break;
      case 'player-left':
        get().showToast(fr.playerLeft(event.pseudo));
        break;
      case 'player-disconnected':
        get().showToast(fr.playerDisconnected(pseudoOf(event.playerId)));
        break;
      case 'player-reconnected':
        get().showToast(fr.playerReconnected(pseudoOf(event.playerId)));
        break;
      default:
        break;
    }
  },

  setSocketConnected: (socketConnected) => set({ socketConnected }),

  setClosed: (reason) => {
    if (freezeTimer) clearTimeout(freezeTimer);
    set({ closedReason: reason, view: null, frozenTrick: null });
  },

  showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 2500);
  },

  reset: () => {
    if (freezeTimer) clearTimeout(freezeTimer);
    set({ view: null, frozenTrick: null, closedReason: null, toast: null });
  },
}));
