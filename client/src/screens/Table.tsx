import { useState } from 'react';
import { motion } from 'motion/react';
import type { GameView } from '@rikiki/shared';
import { cardId } from '@rikiki/shared';
import BidPicker from '../components/BidPicker';
import BidsSummary from '../components/BidsSummary';
import HandFan from '../components/HandFan';
import OpponentsBar from '../components/OpponentsBar';
import RoundRecap from '../components/RoundRecap';
import ScoreDrawer from '../components/ScoreDrawer';
import SoundToggle from '../components/SoundToggle';
import TrickArea from '../components/TrickArea';
import TrumpBadge from '../components/TrumpBadge';
import PlayerAvatar from '../components/PlayerAvatar';
import { vibrate } from '../haptics';
import { useT } from '../i18n';

import { placeBid, playCard } from '../socket';
import { useGame } from '../store/game';
import { applyOptimistic } from '../store/optimistic';

interface Props {
  view: GameView;
}

/**
 * Table de jeu, pensée pour le portrait mobile.
 *
 * Règle de mise en page : la main du joueur reste TOUJOURS visible et
 * n'est jamais recouverte — ni pendant les annonces, ni pendant le jeu.
 * Chaque zone occupe sa propre ligne d'une colonne flex, sans superposition.
 */
export default function Table({ view: serverView }: Props) {
  const t = useT();
  const frozenTrick = useGame((s) => s.frozenTrick);
  const optimistic = useGame((s) => s.optimistic);
  // Le coup local s'affiche sans attendre la réponse du serveur
  const view = applyOptimistic(serverView, optimistic);
  const [scoresOpen, setScoresOpen] = useState(false);
  const round = view.round!;
  const me = view.players.find((p) => p.id === view.you)!;
  const currentPlayer = view.players.find((p) => p.seat === round.currentSeat);
  const myTurn = currentPlayer?.id === view.you;

  const bidding = view.phase === 'bidding';
  const showBidPicker = bidding && round.legalBids !== null && !frozenTrick;
  const showRecap = view.phase === 'round-scoring' && !frozenTrick;
  const myBid = round.bids[view.you];
  const myTricks = round.tricksWon[view.you] ?? 0;
  const bidsSoFar = Object.values(round.bids).reduce<number>((sum, b) => sum + (b ?? 0), 0);
  const contractDone = myBid !== null && myTricks === myBid;
  const contractBusted = myBid !== null && myTricks > myBid;
  const trickBusy = round.currentTrick.plays.length > 0 || frozenTrick !== null;

  const onPlay = async (id: string) => {
    const card = round.myHand.find((c) => cardId(c) === id);
    if (!card) return;
    vibrate('tap');
    useGame.getState().playOptimistic(card);
    const res = await playCard(id);
    if (!res.ok) {
      // Coup refusé : on rend la carte à la main et on explique
      useGame.getState().rollbackOptimistic();
      useGame.getState().showToast(res.error.message);
    }
  };

  const onBid = async (bid: number) => {
    vibrate('tap');
    useGame.getState().bidOptimistic(bid);
    const res = await placeBid(bid);
    if (!res.ok) {
      useGame.getState().rollbackOptimistic();
      useGame.getState().showToast(res.error.message);
    }
  };

  const statusText = frozenTrick
    ? t.trickWonBy(view.players.find((p) => p.id === frozenTrick.winnerId)?.pseudo ?? '')
    : myTurn
      ? view.phase === 'playing'
        ? t.yourTurn
        : ''
      : currentPlayer
        ? t.turnOf(currentPlayer.pseudo)
        : '';

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* ---- En-tête : manche, son, scores ---- */}
      <header className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-paper-50/50">
            {t.round} {round.roundIndex + 1}/{view.roundsSequence.length}
          </p>
          <p className="truncate text-sm font-medium text-paper-50">{t.cards(round.cardsCount)}</p>
        </div>

        <SoundToggle />

        <button
          type="button"
          data-testid="open-scores"
          onClick={() => setScoresOpen(true)}
          aria-label={t.scoreboard}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-felt-900/55 text-lg ring-1 ring-white/10 transition active:scale-90"
        >
          <span aria-hidden="true">🏆</span>
        </button>
      </header>

      {/* ---- Adversaires ---- */}
      <div className="shrink-0 pb-1 pt-1">
        <OpponentsBar view={view} />
      </div>

      {/* ---- Récapitulatif des annonces : lisible en permanence ---- */}
      <div className="shrink-0 pb-1">
        <BidsSummary view={view} />
      </div>

      {/* ---- Tapis : atout au centre, puis le pli ---- */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5">
        {/* Ancrage visuel : suggère la zone de dépose au centre de la table */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgb(255 255 255 / 0.045) 0%, transparent 68%)',
            boxShadow: 'inset 0 0 60px -20px rgb(0 0 0 / 0.5)',
          }}
        />

        <TrumpBadge trumpCard={round.trumpCard} compact={trickBusy} />
        <TrickArea view={view} frozenTrick={frozenTrick} />

        <motion.p
          key={statusText}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative h-5 px-4 text-center text-sm font-medium ${
            myTurn && !frozenTrick ? 'text-brass-300' : 'text-paper-50/55'
          }`}
          data-testid="turn-status"
          aria-live="polite"
        >
          {statusText}
        </motion.p>
      </div>

      {/* ---- Annonce : au-dessus de la main, jamais par-dessus ---- */}
      {showBidPicker && (
        <div className="shrink-0 pb-2">
          <BidPicker
            cardsCount={round.cardsCount}
            legalBids={round.legalBids!}
            bidsSoFar={bidsSoFar}
            onBid={onBid}
          />
        </div>
      )}

      {/* ---- Ma zone : contrat + main ---- */}
      <div className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-2 flex items-center justify-center gap-2.5 px-3">
          <PlayerAvatar avatar={me.avatar} size={20} />
          <span className="max-w-20 truncate text-sm font-medium text-paper-50">{me.pseudo}</span>
          {round.dealerSeat === me.seat && (
            <span className="rounded-full bg-brass-400 px-1.5 text-[9px] font-bold text-felt-950" title={t.dealer}>
              D
            </span>
          )}
          <span
            data-testid="my-contract"
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
              myBid === null
                ? 'bg-white/8 text-paper-50/55'
                : contractBusted
                  ? 'bg-danger/20 text-danger'
                  : contractDone
                    ? 'bg-success/20 text-success'
                    : 'bg-brass-400/15 text-brass-300'
            }`}
          >
            {myBid === null ? t.noBidYet : t.tricksOfContract(myTricks, myBid)}
          </span>
          <span className="text-[11px] tabular-nums text-paper-50/45">
            {t.total} {me.totalScore}
          </span>
        </div>

        <HandFan
          hand={round.myHand}
          legalCardIds={view.phase === 'playing' && !frozenTrick ? round.legalCardIds : null}
          onPlay={onPlay}
          compact={showBidPicker}
          trumpSuit={round.trumpCard?.suit ?? null}
          dealKey={round.roundIndex}
        />
      </div>

      {showRecap && <RoundRecap view={view} />}
      <ScoreDrawer view={view} open={scoresOpen} onClose={() => setScoresOpen(false)} />
    </div>
  );
}
